import { db } from '../config/firebase.proxy.js'; // Ajuste o path se necessário
import { collection, query, orderBy, startAt, endAt, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Interface assíncrona de Typeahead / Autocomplete.
 * Otimizada para mitigação de anomalias de Case-Sensitivity em NoSQL.
 * * @param {string} term - Input bruto submetido pelo Presentation Layer.
 * @returns {Promise<Array<{uid: string, [key: string]: any}>>} - Coleção deduplicada de DTOs.
 */
export async function searchUsersByUsername(term) {
    // Threshold reduzido para 1 char para gatilho agressivo de sugestão
    if (!term || term.trim().length < 1) return []; 
    
    const rawTerm = term.replace(/^@/, '').trim();
    const lowerTerm = rawTerm.toLowerCase();
    // Permutação Capitalizada (ex: "tarciso" -> "Tarciso") para bypass de índice do Firestore
    const capitalizedTerm = rawTerm.charAt(0).toUpperCase() + rawTerm.slice(1).toLowerCase();

    try {
        // Disparo assíncrono paralelo (Scatter-Gather) cobrindo os eixos de busca
        const queries = [
            // 1. Sugestão por Username exato ou minúsculo
            getDocs(query(collection(db, 'users'), orderBy('username'), startAt(lowerTerm), endAt(lowerTerm + '\uf8ff'), limit(6))),
            getDocs(query(collection(db, 'users'), orderBy('username'), startAt(rawTerm), endAt(rawTerm + '\uf8ff'), limit(6))),
            
            // 2. Sugestão por Nome Real (Capitalizado - Cobre 90% dos casos de nomes próprios)
            getDocs(query(collection(db, 'users'), orderBy('realname'), startAt(capitalizedTerm), endAt(capitalizedTerm + '\uf8ff'), limit(6))),
            
            // 3. Sugestão por Nome Real (Minúsculo/Exato)
            getDocs(query(collection(db, 'users'), orderBy('realname'), startAt(rawTerm), endAt(rawTerm + '\uf8ff'), limit(6)))
        ];

        const snapshots = await Promise.allSettled(queries);
        
        // Aplicação de Hash Map estrutural para deduplicação O(1)
        const entityMap = new Map();
        
        snapshots.forEach(promiseResult => {
            if (promiseResult.status === 'fulfilled') {
                promiseResult.value.docs.forEach(doc => {
                    // Impede que o mesmo utilizador apareça duplicado se o username e realname derem match
                    if (!entityMap.has(doc.id)) {
                        entityMap.set(doc.id, { uid: doc.id, ...doc.data() });
                    }
                });
            }
        });

        return Array.from(entityMap.values());

    } catch (error) {
        // Tratamento de falha silencioso para evitar quebra de UI durante digitação rápida
        console.error('[TypeaheadEngine] Falha de transação RPC/Firestore Rules:', error.code || error);
        return [];
    }
}