"use strict";
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
exports.deleteUserAccount = exports.verifyPaypalPayment = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const paypal_1 = require("./paypal");
const userDeletion_1 = require("./userDeletion");
admin.initializeApp();
exports.verifyPaypalPayment = (0, firestore_1.onDocumentCreated)({ document: 'orders/{orderId}' }, async (event) => {
    var _a;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const transactionId = data['paypalTransactionId'];
    if (!transactionId)
        return;
    const clientId = process.env['PAYPAL_CLIENT_ID'];
    const clientSecret = process.env['PAYPAL_CLIENT_SECRET'];
    if (!clientId || !clientSecret) {
        console.error('PayPal credentials not configured');
        return;
    }
    const sandbox = process.env['PAYPAL_SANDBOX'] !== 'false';
    const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    try {
        await (0, paypal_1.resolvePaypalPayment)(event.params['orderId'], transactionId, admin.firestore(), baseUrl, clientId, clientSecret);
        console.log(`Order ${event.params['orderId']}: payment verified`);
    }
    catch (err) {
        console.error('PayPal verification error:', err);
    }
});
const OWNER_ROLLE = '2';
exports.deleteUserAccount = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Nicht angemeldet.');
    }
    const callerSnap = await admin.firestore()
        .collection('users')
        .doc(request.auth.uid)
        .get();
    if (!callerSnap.exists || String((_a = callerSnap.data()) === null || _a === void 0 ? void 0 : _a['rolle']) !== OWNER_ROLLE) {
        throw new https_1.HttpsError('permission-denied', 'Nur Owner dürfen Benutzer löschen.');
    }
    const { uid } = request.data;
    if (!uid || typeof uid !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Ungültige oder fehlende UID.');
    }
    if (uid === request.auth.uid) {
        throw new https_1.HttpsError('invalid-argument', 'Du kannst dein eigenes Konto nicht löschen.');
    }
    const targetSnap = await admin.firestore().collection('users').doc(uid).get();
    if (targetSnap.exists && String((_b = targetSnap.data()) === null || _b === void 0 ? void 0 : _b['rolle']) === OWNER_ROLLE) {
        throw new https_1.HttpsError('permission-denied', 'Owner-Konten können nicht gelöscht werden.');
    }
    await (0, userDeletion_1.deleteUserData)(uid, admin.firestore(), admin.auth());
    return { success: true };
});
//# sourceMappingURL=index.js.map