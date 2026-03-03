import { db, collection, query, orderBy, startAt, endAt, limit, getDocs } from '../config/firebase.proxy.js';

export async function searchUsersByUsername(term) {
    if (!term || term.length < 2) return [];
    const q = query(
        collection(db, 'users'),
        orderBy('username'),
        startAt(term.replace(/^@/, '')),
        endAt(term.replace(/^@/, '') + '\uf8ff'),
        limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
}
