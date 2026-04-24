"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOCH_AUSSTEHEND = exports.BEZAHLT = void 0;
exports.getPaypalAccessToken = getPaypalAccessToken;
exports.fetchCaptureStatus = fetchCaptureStatus;
exports.resolvePaypalPayment = resolvePaypalPayment;
exports.BEZAHLT = 0;
exports.NOCH_AUSSTEHEND = 1;
async function getPaypalAccessToken(baseUrl, clientId, clientSecret) {
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok)
        throw new Error(`PayPal OAuth failed (${res.status}): ${await res.text()}`);
    const body = (await res.json());
    return body.access_token;
}
async function fetchCaptureStatus(baseUrl, accessToken, captureId) {
    var _a;
    const res = await fetch(`${baseUrl}/v2/payments/captures/${captureId}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok)
        return null;
    const body = (await res.json());
    return (_a = body.status) !== null && _a !== void 0 ? _a : null;
}
async function resolvePaypalPayment(orderId, transactionId, db, baseUrl, clientId, clientSecret) {
    const accessToken = await getPaypalAccessToken(baseUrl, clientId, clientSecret);
    const status = await fetchCaptureStatus(baseUrl, accessToken, transactionId);
    const zahlungsZustand = status === 'COMPLETED' ? exports.BEZAHLT : exports.NOCH_AUSSTEHEND;
    await db.collection('orders').doc(orderId).update({ zahlungsZustand });
}
//# sourceMappingURL=paypal.js.map