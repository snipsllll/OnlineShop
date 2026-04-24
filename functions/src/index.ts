import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { resolvePaypalPayment, getPaypalAccessToken, refundPaypalCapture, BEZAHLT, ERSTATTET } from './paypal';
import { deleteUserData } from './userDeletion';

admin.initializeApp();

// ── Shared helper ────────────────────────────────────────────────────────────

async function getPaypalConfig(db: admin.firestore.Firestore): Promise<{
  baseUrl: string;
  clientId: string;
  clientSecret: string;
} | null> {
  const [shopSnap, paypalSnap] = await Promise.all([
    db.doc('settings/shop').get(),
    db.doc('settings/paypalConfig').get(),
  ]);
  const devBannerEnabled: boolean = shopSnap.data()?.['devBannerEnabled'] ?? true;
  const pc = paypalSnap.data() ?? {};
  const clientId = devBannerEnabled
    ? ((pc['sandboxClientId'] as string | undefined) ?? process.env['PAYPAL_CLIENT_ID'] ?? '')
    : ((pc['liveClientId'] as string | undefined) ?? '');
  const clientSecret = devBannerEnabled
    ? ((pc['sandboxClientSecret'] as string | undefined) ?? process.env['PAYPAL_CLIENT_SECRET'] ?? '')
    : ((pc['liveClientSecret'] as string | undefined) ?? '');
  const baseUrl = devBannerEnabled ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  if (!clientId || !clientSecret) return null;
  return { baseUrl, clientId, clientSecret };
}

// ── Triggers ─────────────────────────────────────────────────────────────────

export const verifyPaypalPayment = onDocumentCreated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const transactionId: string | undefined = data['paypalTransactionId'];
    if (!transactionId) return;

    const db = admin.firestore();
    const config = await getPaypalConfig(db);
    if (!config) {
      console.error('PayPal credentials not configured');
      return;
    }

    try {
      await resolvePaypalPayment(
        event.params['orderId'],
        transactionId,
        db,
        config.baseUrl,
        config.clientId,
        config.clientSecret
      );
      console.log(`Order ${event.params['orderId']}: payment verified`);
    } catch (err) {
      console.error('PayPal verification error:', err);
    }
  }
);

const STORNIERT      = 4;
const IN_BEARBEITUNG = 1;
const VERSANDT       = 2;
const ANGEKOMMEN     = 3;

export const handleStornierung = onDocumentUpdated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    if (after['bestellungsZustand'] !== STORNIERT) return;
    if (before['bestellungsZustand'] === STORNIERT) return;
    // Idempotency: don't process twice
    if (after['stornierungVerarbeitet'] === true) return;

    const orderId    = event.params['orderId'];
    const db         = admin.firestore();
    const produkte: Array<{ id: string; anzahl: number }> = before['produkte'] ?? [];
    const prevZustand = Number(before['bestellungsZustand']);

    // 1) Adjust stock based on what state the order was in before cancellation
    if (produkte.length > 0) {
      await Promise.all(produkte.map(pos =>
        db.runTransaction(async (tx) => {
          const ref  = db.collection('products').doc(pos.id);
          const snap = await tx.get(ref);
          if (!snap.exists) return;
          const data   = snap.data()!;
          const update: Record<string, unknown> = {};

          if (prevZustand === IN_BEARBEITUNG) {
            // Reservation was made — release it
            const newReserviert = Math.max(0, (data['reserviert'] ?? 0) - pos.anzahl);
            update['reserviert'] = newReserviert;
            update['verfuegbar'] = ((data['lagerbestand'] ?? 0) - newReserviert) > 0;
          } else if (prevZustand === VERSANDT || prevZustand === ANGEKOMMEN) {
            // Stock was already deducted — return it
            const newLager = (data['lagerbestand'] ?? 0) + pos.anzahl;
            update['lagerbestand'] = newLager;
            update['verfuegbar']   = (newLager - (data['reserviert'] ?? 0)) > 0;
          }
          // EINGEGANGEN: nothing was changed, nothing to revert

          if (Object.keys(update).length > 0) tx.update(ref, update);
        })
      ));
    }

    // 2) PayPal refund if the order was paid
    const orderUpdate: Record<string, unknown> = { stornierungVerarbeitet: true };

    if (Number(before['zahlungsZustand']) === BEZAHLT) {
      const captureId: string | undefined = before['paypalTransactionId'];
      if (captureId) {
        try {
          const config = await getPaypalConfig(db);
          if (config) {
            const accessToken = await getPaypalAccessToken(config.baseUrl, config.clientId, config.clientSecret);
            const refund = await refundPaypalCapture(config.baseUrl, accessToken, captureId);
            if (refund) {
              orderUpdate['zahlungsZustand'] = ERSTATTET;
              orderUpdate['erstattungsId']   = refund.id;
              orderUpdate['erstattungsDatum'] = admin.firestore.FieldValue.serverTimestamp();
            }
          }
        } catch (err) {
          console.error(`Order ${orderId}: PayPal refund error:`, err);
        }
      }
    }

    await db.collection('orders').doc(orderId).update(orderUpdate);
    console.log(`Order ${orderId}: Stornierung verarbeitet (prevZustand=${prevZustand})`);
  }
);

// ── User management ───────────────────────────────────────────────────────────

const OWNER_ROLLE = '2';

export const deleteUserAccount = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Nicht angemeldet.');
  }

  const callerSnap = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();

  if (!callerSnap.exists || String(callerSnap.data()?.['rolle']) !== OWNER_ROLLE) {
    throw new HttpsError('permission-denied', 'Nur Owner dürfen Benutzer löschen.');
  }

  const { uid } = request.data as { uid?: string };
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'Ungültige oder fehlende UID.');
  }

  if (uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Du kannst dein eigenes Konto nicht löschen.');
  }

  const targetSnap = await admin.firestore().collection('users').doc(uid).get();
  if (targetSnap.exists && String(targetSnap.data()?.['rolle']) === OWNER_ROLLE) {
    throw new HttpsError('permission-denied', 'Owner-Konten können nicht gelöscht werden.');
  }

  await deleteUserData(uid, admin.firestore(), admin.auth());

  return { success: true };
});
