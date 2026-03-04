import { db, collection, query, orderBy, startAt, endAt, limit, getDocs } from '../config/firebase.proxy.js';

/**
 * Interface de busca de usuários com normalização de string.
 * Implementa mitigação de falhas de colação (Case-Insensitive) para queries lexicais no Firestore.
 * * @param {string} term Parâmetro de busca
 * @returns {Promise<Array>} Array de instâncias de documento mapeadas
 */
export async function searchUsersByUsername(term) {
    if (!term || term.length < 2) return [];
    
    const sanitizedTerm = term.replace(/^@/, '').toLowerCase();

    const q = query(
        collection(db, 'users'),
        orderBy('username'),
        startAt(sanitizedTerm),
        endAt(sanitizedTerm + '\uf8ff'),
        limit(10)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
}