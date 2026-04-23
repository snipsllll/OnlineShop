import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';

admin.initializeApp();

const PAYPAL_CLIENT_ID = defineSecret('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = defineSecret('PAYPAL_CLIENT_SECRET');
const PAYPAL_SANDBOX = defineSecret('PAYPAL_SANDBOX');

// Mirrors ZahlungsZustand enum: BEZAHLT = 0, NOCH_AUSSTEHEND = 1
const BEZAHLT = 0;
const NOCH_AUSSTEHEND = 1;

export const verifyPaypalPayment = onDocumentCreated(
  { document: 'orders/{orderId}', secrets: [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_SANDBOX] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const transactionId: string | undefined = data['paypalTransactionId'];
    if (!transactionId) return;

    const clientId = PAYPAL_CLIENT_ID.value();
    const clientSecret = PAYPAL_CLIENT_SECRET.value();
    const sandbox = PAYPAL_SANDBOX.value() !== 'false';
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    try {
      const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenRes.ok) {
        console.error('PayPal token request failed:', await tokenRes.text());
        return;
      }

      const { access_token: accessToken } = await tokenRes.json() as { access_token: string };

      const captureRes = await fetch(`${baseUrl}/v2/payments/captures/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!captureRes.ok) {
        console.error('PayPal capture fetch failed:', await captureRes.text());
        return;
      }

      const capture = await captureRes.json() as { status: string };
      const zahlungsZustand = capture.status === 'COMPLETED' ? BEZAHLT : NOCH_AUSSTEHEND;

      await admin.firestore()
        .collection('orders')
        .doc(event.params['orderId'])
        .update({ zahlungsZustand });

      console.log(`Order ${event.params['orderId']}: zahlungsZustand = ${zahlungsZustand}`);
    } catch (err) {
      console.error('PayPal verification error:', err);
    }
  }
);

/** Rolle.OWNER = 2 (stored as string in Firestore) */
const OWNER_ROLLE = '2';

/**
 * Deletes a user from both Firebase Auth and Firestore.
 * Only callable by an authenticated Owner.
 * Refuses to delete other Owners or the caller themselves.
 */
export const deleteUserAccount = onCall(async (request) => {
  // 1. Must be authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Nicht angemeldet.');
  }

  // 2. Verify caller is Owner
  const callerSnap = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();

  if (!callerSnap.exists || String(callerSnap.data()?.['rolle']) !== OWNER_ROLLE) {
    throw new HttpsError('permission-denied', 'Nur Owner dürfen Benutzer löschen.');
  }

  // 3. Validate input
  const { uid } = request.data as { uid?: string };
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'Ungültige oder fehlende UID.');
  }

  // 4. Prevent self-deletion
  if (uid === request.auth.uid) {
    throw new HttpsError('invalid-argument', 'Du kannst dein eigenes Konto nicht löschen.');
  }

  // 5. Prevent deleting another Owner
  const targetSnap = await admin.firestore().collection('users').doc(uid).get();
  if (targetSnap.exists && String(targetSnap.data()?.['rolle']) === OWNER_ROLLE) {
    throw new HttpsError('permission-denied', 'Owner-Konten können nicht gelöscht werden.');
  }

  // 6. Delete from Firebase Auth (Admin SDK)
  await admin.auth().deleteUser(uid);

  // 7. Delete from Firestore
  await admin.firestore().collection('users').doc(uid).delete();

  return { success: true };
});
