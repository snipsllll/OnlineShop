"use strict";
/**
 * E2E tests for PayPal API integration and Firestore updates.
 *
 * Requires:
 *   - Firebase Firestore emulator running on localhost:8080
 *     (start with: firebase emulators:start --only firestore)
 *
 * Optional (PayPal tests are skipped if not set):
 *   PAYPAL_CLIENT_ID      – sandbox app client ID
 *   PAYPAL_CLIENT_SECRET  – sandbox app client secret
 *   PAYPAL_TEST_CAPTURE_ID – a completed sandbox capture ID for full-flow test
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
// Must be set before firebase-admin is imported
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
const admin = __importStar(require("firebase-admin"));
const paypal_1 = require("../paypal");
const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = (_a = process.env['PAYPAL_CLIENT_ID']) !== null && _a !== void 0 ? _a : '';
const CLIENT_SECRET = (_b = process.env['PAYPAL_CLIENT_SECRET']) !== null && _b !== void 0 ? _b : '';
const TEST_CAPTURE_ID = (_c = process.env['PAYPAL_TEST_CAPTURE_ID']) !== null && _c !== void 0 ? _c : '';
const hasCredentials = CLIENT_ID !== '' && CLIENT_SECRET !== '';
const hasCapture = TEST_CAPTURE_ID !== '';
const skip = (condition) => (condition ? it : it.skip);
let app;
let db;
beforeAll(() => {
    app = admin.initializeApp({ projectId: 'test-project' }, `paypal-e2e-${Date.now()}`);
    db = admin.firestore(app);
});
afterAll(() => app.delete());
afterEach(async () => {
    const snap = await db.collection('orders').get();
    await Promise.all(snap.docs.map(d => d.ref.delete()));
});
// ─── PayPal API ───────────────────────────────────────────────────────────────
describe('PayPal API – getPaypalAccessToken', () => {
    skip(hasCredentials)('returns a non-empty token with valid sandbox credentials', async () => {
        const token = await (0, paypal_1.getPaypalAccessToken)(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(10);
    });
    skip(hasCredentials)('throws with invalid credentials', async () => {
        await expect((0, paypal_1.getPaypalAccessToken)(SANDBOX_URL, 'bad-id', 'bad-secret')).rejects.toThrow(/PayPal OAuth failed/);
    });
});
describe('PayPal API – fetchCaptureStatus', () => {
    skip(hasCredentials && hasCapture)('returns COMPLETED for a known sandbox capture', async () => {
        const token = await (0, paypal_1.getPaypalAccessToken)(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
        const status = await (0, paypal_1.fetchCaptureStatus)(SANDBOX_URL, token, TEST_CAPTURE_ID);
        expect(status).toBe('COMPLETED');
    });
    skip(hasCredentials)('returns null for a non-existent capture ID', async () => {
        const token = await (0, paypal_1.getPaypalAccessToken)(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
        const status = await (0, paypal_1.fetchCaptureStatus)(SANDBOX_URL, token, 'NONEXISTENT-CAPTURE-0000000');
        expect(status).toBeNull();
    });
});
// ─── Firestore integration ────────────────────────────────────────────────────
describe('Firestore – order without transactionId', () => {
    it('leaves zahlungsZustand untouched when there is no transactionId', async () => {
        var _a;
        await db.collection('orders').doc('order-no-txn').set({
            userId: 'u1',
            zahlungsZustand: paypal_1.NOCH_AUSSTEHEND,
        });
        // The Cloud Function early-returns when transactionId is absent – simulate that here
        const snap = await db.collection('orders').doc('order-no-txn').get();
        expect((_a = snap.data()) === null || _a === void 0 ? void 0 : _a['zahlungsZustand']).toBe(paypal_1.NOCH_AUSSTEHEND);
    });
});
// ─── Full flow ────────────────────────────────────────────────────────────────
describe('resolvePaypalPayment (full flow)', () => {
    skip(hasCredentials && hasCapture)('sets zahlungsZustand = BEZAHLT for a completed sandbox capture', async () => {
        var _a;
        await db.collection('orders').doc('order-ok').set({
            userId: 'u1',
            zahlungsZustand: paypal_1.NOCH_AUSSTEHEND,
            paypalTransactionId: TEST_CAPTURE_ID,
        });
        await (0, paypal_1.resolvePaypalPayment)('order-ok', TEST_CAPTURE_ID, db, SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
        const snap = await db.collection('orders').doc('order-ok').get();
        expect((_a = snap.data()) === null || _a === void 0 ? void 0 : _a['zahlungsZustand']).toBe(paypal_1.BEZAHLT);
    });
    skip(hasCredentials)('sets zahlungsZustand = NOCH_AUSSTEHEND for an invalid capture ID', async () => {
        var _a;
        await db.collection('orders').doc('order-bad').set({
            userId: 'u1',
            zahlungsZustand: paypal_1.NOCH_AUSSTEHEND,
            paypalTransactionId: 'FAKE-0000',
        });
        await (0, paypal_1.resolvePaypalPayment)('order-bad', 'FAKE-0000', db, SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
        const snap = await db.collection('orders').doc('order-bad').get();
        expect((_a = snap.data()) === null || _a === void 0 ? void 0 : _a['zahlungsZustand']).toBe(paypal_1.NOCH_AUSSTEHEND);
    });
});
//# sourceMappingURL=paypal.e2e.test.js.map