"use strict";
/**
 * E2E tests for user deletion logic against Firebase emulators.
 *
 * Requires:
 *   firebase emulators:start --only firestore,auth
 *   (Firestore on :8080, Auth on :9099)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';
const admin = __importStar(require("firebase-admin"));
const userDeletion_1 = require("../userDeletion");
let app;
let db;
let auth;
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
async function createTestUser(uid, rolle = '1') {
    await auth.createUser({ uid, email: `${uid}@test.de`, password: 'test1234' });
    await db.collection('users').doc(uid).set({ uid, rolle, email: `${uid}@test.de` });
}
async function createOrder(orderId, userId) {
    await db.collection('orders').doc(orderId).set({
        userId,
        zahlungsZustand: 1,
        bestellungsZustand: 0,
    });
}
describe('deleteUserData', () => {
    it('deletes the user document from Firestore', async () => {
        await createTestUser('user-a');
        await (0, userDeletion_1.deleteUserData)('user-a', db, auth);
        const snap = await db.collection('users').doc('user-a').get();
        expect(snap.exists).toBe(false);
    });
    it('deletes the user from Firebase Auth', async () => {
        await createTestUser('user-b');
        await (0, userDeletion_1.deleteUserData)('user-b', db, auth);
        await expect(auth.getUser('user-b')).rejects.toMatchObject({
            code: 'auth/user-not-found',
        });
    });
    it('deletes all orders belonging to the user', async () => {
        await createTestUser('user-c');
        await createOrder('order-1', 'user-c');
        await createOrder('order-2', 'user-c');
        await createOrder('order-3', 'user-c');
        await (0, userDeletion_1.deleteUserData)('user-c', db, auth);
        const snap = await db.collection('orders').where('userId', '==', 'user-c').get();
        expect(snap.empty).toBe(true);
    });
    it('does not delete orders belonging to other users', async () => {
        await createTestUser('user-d');
        await createTestUser('user-e');
        await createOrder('order-d1', 'user-d');
        await createOrder('order-e1', 'user-e');
        await (0, userDeletion_1.deleteUserData)('user-d', db, auth);
        const snap = await db.collection('orders').doc('order-e1').get();
        expect(snap.exists).toBe(true);
    });
    it('succeeds when the user has no orders', async () => {
        await createTestUser('user-f');
        await expect((0, userDeletion_1.deleteUserData)('user-f', db, auth)).resolves.not.toThrow();
        const snap = await db.collection('users').doc('user-f').get();
        expect(snap.exists).toBe(false);
    });
});
//# sourceMappingURL=userDeletion.e2e.test.js.map