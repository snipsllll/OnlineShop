/**
 * E2E tests for user deletion logic against Firebase emulators.
 *
 * Requires:
 *   firebase emulators:start --only firestore,auth
 *   (Firestore on :8080, Auth on :9099)
 */

process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';

import * as admin from 'firebase-admin';
import { deleteUserData } from '../userDeletion';

let app: admin.app.App;
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

beforeAll(() => {
  app = admin.initializeApp({ projectId: 'test-project' }, `user-del-e2e-${Date.now()}`);
  db = admin.firestore(app);
  auth = admin.auth(app);
});

afterAll(() => app.delete());

afterEach(async () => {
  const [usersSnap, ordersSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('orders').get(),
  ]);
  await Promise.all([
    ...usersSnap.docs.map(d => d.ref.delete()),
    ...ordersSnap.docs.map(d => d.ref.delete()),
  ]);
});

async function createTestUser(uid: string, rolle = '1'): Promise<void> {
  await auth.createUser({ uid, email: `${uid}@test.de`, password: 'test1234' });
  await db.collection('users').doc(uid).set({ uid, rolle, email: `${uid}@test.de` });
}

async function createOrder(orderId: string, userId: string): Promise<void> {
  await db.collection('orders').doc(orderId).set({
    userId,
    zahlungsZustand: 1,
    bestellungsZustand: 0,
  });
}

describe('deleteUserData', () => {
  it('deletes the user document from Firestore', async () => {
    await createTestUser('user-a');

    await deleteUserData('user-a', db, auth);

    const snap = await db.collection('users').doc('user-a').get();
    expect(snap.exists).toBe(false);
  });

  it('deletes the user from Firebase Auth', async () => {
    await createTestUser('user-b');

    await deleteUserData('user-b', db, auth);

    await expect(auth.getUser('user-b')).rejects.toMatchObject({
      code: 'auth/user-not-found',
    });
  });

  it('deletes all orders belonging to the user', async () => {
    await createTestUser('user-c');
    await createOrder('order-1', 'user-c');
    await createOrder('order-2', 'user-c');
    await createOrder('order-3', 'user-c');

    await deleteUserData('user-c', db, auth);

    const snap = await db.collection('orders').where('userId', '==', 'user-c').get();
    expect(snap.empty).toBe(true);
  });

  it('does not delete orders belonging to other users', async () => {
    await createTestUser('user-d');
    await createTestUser('user-e');
    await createOrder('order-d1', 'user-d');
    await createOrder('order-e1', 'user-e');

    await deleteUserData('user-d', db, auth);

    const snap = await db.collection('orders').doc('order-e1').get();
    expect(snap.exists).toBe(true);
  });

  it('succeeds when the user has no orders', async () => {
    await createTestUser('user-f');

    await expect(deleteUserData('user-f', db, auth)).resolves.not.toThrow();

    const snap = await db.collection('users').doc('user-f').get();
    expect(snap.exists).toBe(false);
  });
});
