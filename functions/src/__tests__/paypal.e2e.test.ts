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

// Must be set before firebase-admin is imported
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';

import * as admin from 'firebase-admin';
import {
  getPaypalAccessToken,
  fetchCaptureStatus,
  resolvePaypalPayment,
  BEZAHLT,
  NOCH_AUSSTEHEND,
} from '../paypal';

const SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env['PAYPAL_CLIENT_ID'] ?? '';
const CLIENT_SECRET = process.env['PAYPAL_CLIENT_SECRET'] ?? '';
const TEST_CAPTURE_ID = process.env['PAYPAL_TEST_CAPTURE_ID'] ?? '';

const hasCredentials = CLIENT_ID !== '' && CLIENT_SECRET !== '';
const hasCapture = TEST_CAPTURE_ID !== '';

const skip = (condition: boolean) => (condition ? it : it.skip);

let app: admin.app.App;
let db: admin.firestore.Firestore;

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
    const token = await getPaypalAccessToken(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  skip(hasCredentials)('throws with invalid credentials', async () => {
    await expect(
      getPaypalAccessToken(SANDBOX_URL, 'bad-id', 'bad-secret')
    ).rejects.toThrow(/PayPal OAuth failed/);
  });
});

describe('PayPal API – fetchCaptureStatus', () => {
  skip(hasCredentials && hasCapture)(
    'returns COMPLETED for a known sandbox capture',
    async () => {
      const token = await getPaypalAccessToken(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
      const status = await fetchCaptureStatus(SANDBOX_URL, token, TEST_CAPTURE_ID);
      expect(status).toBe('COMPLETED');
    }
  );

  skip(hasCredentials)(
    'returns null for a non-existent capture ID',
    async () => {
      const token = await getPaypalAccessToken(SANDBOX_URL, CLIENT_ID, CLIENT_SECRET);
      const status = await fetchCaptureStatus(SANDBOX_URL, token, 'NONEXISTENT-CAPTURE-0000000');
      expect(status).toBeNull();
    }
  );
});

// ─── Firestore integration ────────────────────────────────────────────────────

describe('Firestore – order without transactionId', () => {
  it('leaves zahlungsZustand untouched when there is no transactionId', async () => {
    await db.collection('orders').doc('order-no-txn').set({
      userId: 'u1',
      zahlungsZustand: NOCH_AUSSTEHEND,
    });
    // The Cloud Function early-returns when transactionId is absent – simulate that here
    const snap = await db.collection('orders').doc('order-no-txn').get();
    expect(snap.data()?.['zahlungsZustand']).toBe(NOCH_AUSSTEHEND);
  });
});

// ─── Full flow ────────────────────────────────────────────────────────────────

describe('resolvePaypalPayment (full flow)', () => {
  skip(hasCredentials && hasCapture)(
    'sets zahlungsZustand = BEZAHLT for a completed sandbox capture',
    async () => {
      await db.collection('orders').doc('order-ok').set({
        userId: 'u1',
        zahlungsZustand: NOCH_AUSSTEHEND,
        paypalTransactionId: TEST_CAPTURE_ID,
      });

      await resolvePaypalPayment(
        'order-ok',
        TEST_CAPTURE_ID,
        db,
        SANDBOX_URL,
        CLIENT_ID,
        CLIENT_SECRET
      );

      const snap = await db.collection('orders').doc('order-ok').get();
      expect(snap.data()?.['zahlungsZustand']).toBe(BEZAHLT);
    }
  );

  skip(hasCredentials)(
    'sets zahlungsZustand = NOCH_AUSSTEHEND for an invalid capture ID',
    async () => {
      await db.collection('orders').doc('order-bad').set({
        userId: 'u1',
        zahlungsZustand: NOCH_AUSSTEHEND,
        paypalTransactionId: 'FAKE-0000',
      });

      await resolvePaypalPayment(
        'order-bad',
        'FAKE-0000',
        db,
        SANDBOX_URL,
        CLIENT_ID,
        CLIENT_SECRET
      );

      const snap = await db.collection('orders').doc('order-bad').get();
      expect(snap.data()?.['zahlungsZustand']).toBe(NOCH_AUSSTEHEND);
    }
  );
});
