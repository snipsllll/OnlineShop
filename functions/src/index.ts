import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

admin.initializeApp();

/** Rolle.OWNER = 2 (stored as string in Firestore) */
const OWNER_ROLLE = '2';

export const deleteUserAccount = onCall({ cors: true }, async (request) => {
  // 1. Must be authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Nicht angemeldet.');
  }

  // 2. Verify caller is Owner
  let callerSnap: admin.firestore.DocumentSnapshot;
  try {
    callerSnap = await admin.firestore().collection('users').doc(request.auth.uid).get();
  } catch {
    throw new HttpsError('internal', 'Fehler beim Prüfen der Berechtigungen.');
  }

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
  let targetSnap: admin.firestore.DocumentSnapshot;
  try {
    targetSnap = await admin.firestore().collection('users').doc(uid).get();
  } catch {
    throw new HttpsError('internal', 'Fehler beim Laden des Benutzers.');
  }

  if (targetSnap.exists && String(targetSnap.data()?.['rolle']) === OWNER_ROLLE) {
    throw new HttpsError('permission-denied', 'Owner-Konten können nicht gelöscht werden.');
  }

  // 6. Delete from Firebase Auth — tolerate user-not-found (already deleted)
  try {
    await admin.auth().deleteUser(uid);
  } catch (err: any) {
    if (err?.code !== 'auth/user-not-found') {
      throw new HttpsError('internal', 'Fehler beim Löschen des Auth-Kontos: ' + (err?.message ?? ''));
    }
  }

  // 7. Delete from Firestore
  try {
    await admin.firestore().collection('users').doc(uid).delete();
  } catch (err: any) {
    throw new HttpsError('internal', 'Fehler beim Löschen des Firestore-Eintrags: ' + (err?.message ?? ''));
  }

  return { success: true };
});
