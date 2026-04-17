import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

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
