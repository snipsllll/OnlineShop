import * as admin from 'firebase-admin';

export const BEZAHLT = 0;
export const NOCH_AUSSTEHEND = 1;
export const ERSTATTET = 2;

export async function getPaypalAccessToken(
  baseUrl: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed (${res.status}): ${await res.text()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

export async function fetchCaptureStatus(
  baseUrl: string,
  accessToken: string,
  captureId: string
): Promise<string | null> {
  const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { status: string };
  return body.status ?? null;
}

export async function refundPaypalCapture(
  baseUrl: string,
  accessToken: string,
  captureId: string
): Promise<{ id: string } | null> {
  const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    console.error(`PayPal refund failed (${res.status}): ${await res.text()}`);
    return null;
  }
  return (await res.json()) as { id: string };
}

export async function resolvePaypalPayment(
  orderId: string,
  transactionId: string,
  db: admin.firestore.Firestore,
  baseUrl: string,
  clientId: string,
  clientSecret: string
): Promise<void> {
  const accessToken = await getPaypalAccessToken(baseUrl, clientId, clientSecret);
  const status = await fetchCaptureStatus(baseUrl, accessToken, transactionId);
  const zahlungsZustand = status === 'COMPLETED' ? BEZAHLT : NOCH_AUSSTEHEND;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = { zahlungsZustand };
  if (zahlungsZustand === BEZAHLT) update['bestellungsZustand'] = 1; // IN_BEARBEITUNG
  await db.collection('orders').doc(orderId).update(update);
}
