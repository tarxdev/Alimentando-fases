import { db } from '../../../firebase-config.js'; 
import { 
    collection, query, where, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp, getDoc, getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class ChatService {

    // 1. LISTAR CONVERSAS
    listenToConversations(userId, callback) {
        if (!userId) return;

        console.log(`[ChatService] Buscando chats para o usuário: ${userId}`);
        
        // Query na coleção 'chats' onde 'participants' contém o ID do usuário
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`[ChatService] Encontrados ${chats.length} chats.`);
            
            // Ordenação manual (mais recentes primeiro)
            chats.sort((a, b) => {
                const tA = a.lastMessageTime?.seconds || 0;
                const tB = b.lastMessageTime?.seconds || 0;
                return tB - tA;
            });

            callback(chats);
        }, (error) => {
            console.error("[ChatService] Erro ao buscar:", error);
            callback([], error);
        });
    }

    // 2. LISTAR MENSAGENS
    listenToMessages(chatId, callback) {
        if (!chatId) return;

        const q = query(collection(db, 'chats', chatId, 'messages'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Ordena Antigas -> Novas
            messages.sort((a, b) => {
                const tA = a.timestamp?.seconds || 0;
                const tB = b.timestamp?.seconds || 0;
                return tA - tB;
            });

            callback(messages);
        });
    }

    // 3. ENVIAR MENSAGEM
    async sendMessage(chatId, userId, text, type = 'text') {
        if (!text && type === 'text') return;

        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: userId, text, type, timestamp: serverTimestamp()
        });

        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: type === 'image' ? '📷 Imagem' : text,
            lastMessageTime: serverTimestamp()
        });
    }

    // 4. CRIAR CHAT
    async createChat(currentUserId, targetUserId) {
        // Verifica se já existe (Opcional: implemente verificação dupla aqui se quiser)
        const chatData = {
            participants: [currentUserId, targetUserId],
            lastMessage: 'Iniciou uma conversa',
            lastMessageTime: serverTimestamp(),
            createdBy: currentUserId
        };
        const docRef = await addDoc(collection(db, 'chats'), chatData);
        return docRef.id;
    }

    // 5. BUSCA DE USUÁRIOS
    async searchUsers(searchTerm) {
        if (!searchTerm || searchTerm.length < 3) return [];
        const q = query(collection(db, 'users')); // Em produção, usar 'where' ou Algolia
        const snap = await getDocs(q);
        
        const term = searchTerm.toLowerCase();
        return snap.docs
            .map(d => ({uid: d.id, ...d.data()}))
            .filter(u => {
                const name = (u.realname || u.name || '').toLowerCase();
                const user = (u.username || '').toLowerCase();
                return name.includes(term) || user.includes(term);
            })
            .slice(0, 5);
    }

    async getUserInfo(uid) {
        try {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) return snap.data();
            return null;
        } catch (e) { return null; }
    }
}