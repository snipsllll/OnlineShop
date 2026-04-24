"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserData = deleteUserData;
async function deleteUserData(uid, db, auth) {
    const ordersSnap = await db.collection('orders').where('userId', '==', uid).get();
    const BATCH_SIZE = 500;
    for (let i = 0; i < ordersSnap.docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        ordersSnap.docs.slice(i, i + BATCH_SIZE).forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
    await auth.deleteUser(uid);
    await db.collection('users').doc(uid).delete();
}
//# sourceMappingURL=userDeletion.js.map