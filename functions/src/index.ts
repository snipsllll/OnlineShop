import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
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

    const clientId = process.env['PAYPAL_CLIENT_ID'];
    const clientSecret = process.env['PAYPAL_CLIENT_SECRET'];

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured');
      return;
    }

    const sandbox = process.env['PAYPAL_SANDBOX'] !== 'false';
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

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
