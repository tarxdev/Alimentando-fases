import { db, collection, query, orderBy, startAt, endAt, limit, getDocs } from '../config/firebase.proxy.js';

/**
 * Interface de busca de usuários com mitigação de colação lexical.
 * Arquitetura (Denormalização): Requer a existência do nó 'usernameLower' nos documentos Firestore 
 * para indexação determinística, dissociando a UI (Case-Preserving) da Busca (Case-Insensitive).
 * * @param {string} term - Parâmetro de busca submetido pelo client.
 * @returns {Promise<Array>} - Coleção imutável de Data Transfer Objects (DTO) resolvidos.
 */
export async function searchUsersByUsername(term) {
    // Early Return: Prevenção de alocação de memória e chamadas RPC desnecessárias
    if (!term || term.trim().length < 2) return [];
    
    // Sanitização de input eliminando prefixos de UI e normalizando a string de busca
    const sanitizedTerm = term.replace(/^@/, '').toLowerCase().trim();

    try {
        // Construção da query com prefix-matching no índice normalizado
        const q = query(
            collection(db, 'users'),
            orderBy('usernameLower'), // Obrigatório: Campo indexado exclusivamente em lowercase no Firestore
            startAt(sanitizedTerm),
            endAt(sanitizedTerm + '\uf8ff'),
            limit(10)
        );
        
        const snapshot = await getDocs(q);
        
        // Mapeamento e imutabilidade dos DTOs injetando a chave primária (uid)
        return snapshot.docs.map(doc => ({ 
            uid: doc.id, 
            ...doc.data() 
        }));

    } catch (error) {
        // Tratamento de falhas de I/O e Security Rules Boundary
        console.error('[UserSearchService] Falha de transação RPC/Firestore Rules:', error.code, error.message);
        throw new Error('Timeout ou falha de autorização na camada de persistência.');
    }
}