import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { resolvePaypalPayment } from './paypal';
import { deleteUserData } from './userDeletion';

admin.initializeApp();

export const verifyPaypalPayment = onDocumentCreated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const transactionId: string | undefined = data['paypalTransactionId'];
    if (!transactionId) return;

    const [shopSnap, paypalSnap] = await Promise.all([
      admin.firestore().doc('settings/shop').get(),
      admin.firestore().doc('settings/paypalConfig').get(),
    ]);

    const devBannerEnabled: boolean = shopSnap.data()?.['devBannerEnabled'] ?? true;
    const pc = paypalSnap.data() ?? {};

    let clientId: string;
    let clientSecret: string;
    let baseUrl: string;

    if (devBannerEnabled) {
      clientId = (pc['sandboxClientId'] as string | undefined) ?? process.env['PAYPAL_CLIENT_ID'] ?? '';
      clientSecret = (pc['sandboxClientSecret'] as string | undefined) ?? process.env['PAYPAL_CLIENT_SECRET'] ?? '';
      baseUrl = 'https://api-m.sandbox.paypal.com';
    } else {
      clientId = (pc['liveClientId'] as string | undefined) ?? '';
      clientSecret = (pc['liveClientSecret'] as string | undefined) ?? '';
      baseUrl = 'https://api-m.paypal.com';
    }

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured for', devBannerEnabled ? 'sandbox' : 'live', 'mode');
      return;
    }

    try {
      await resolvePaypalPayment(
        event.params['orderId'],
        transactionId,
        admin.firestore(),
        baseUrl,
        clientId,
        clientSecret
      );
      console.log(`Order ${event.params['orderId']}: payment verified`);
    } catch (err) {
      console.error('PayPal verification error:', err);
    }
  }
);

const IN_BEARBEITUNG = 1;

export const adjustLagerbestand = onDocumentUpdated(
  { document: 'orders/{orderId}' },
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    // Only react when status just flipped to IN_BEARBEITUNG
    if (after['bestellungsZustand'] !== IN_BEARBEITUNG) return;
    if (before['bestellungsZustand'] === IN_BEARBEITUNG) return;
    // Idempotency guard – never deduct twice
    if (after['lagerbestandAngepasst'] === true) return;

    const produkte: Array<{ id: string; anzahl: number }> = after['produkte'] ?? [];
    const db = admin.firestore();

    await Promise.all(
      produkte.map((pos) =>
        db.runTransaction(async (tx) => {
          const ref  = db.collection('products').doc(pos.id);
          const snap = await tx.get(ref);
          if (!snap.exists) return;
          const current: number = snap.data()?.['lagerbestand'] ?? 0;
          tx.update(ref, { lagerbestand: Math.max(0, current - (pos.anzahl ?? 0)) });
        })
      )
    );

    await db.collection('orders').doc(event.params['orderId']).update({ lagerbestandAngepasst: true });
    console.log(`Order ${event.params['orderId']}: lagerbestand adjusted`);
  }
);

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
