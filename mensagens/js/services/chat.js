import { db } from '../../../firebase-config.js'; 
import { 
    collection, query, where, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp, getDoc, getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Importação do Módulo de Segurança Assembly
import { asmCrypto } from './asm-loader.js';

export class ChatService {

    constructor() {
        // Inicializa o Kernel Assembly silenciosamente ao carregar o serviço
        asmCrypto.init();
    }

    // 1. LISTAR CONVERSAS
    listenToConversations(userId, callback) {
        if (!userId) return;

        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId)
        );

        return onSnapshot(q, (snapshot) => {
            const chats = snapshot.docs.map(doc => {
                const data = doc.data();

                return {
                    id: doc.id,
                    ...data,
                    // Mantém o payload bruto; o controller decide quando descriptografar
                    lastMessageEncrypted: !!data.lastMessageEncrypted
                };
            });
            
            // Ordenação (Mais recentes primeiro)
            chats.sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0));

            callback(chats);
        });
    }

    // 2. LISTAR MENSAGENS (Leitura com Decifragem)
    listenToMessages(chatId, callback) {
        if (!chatId) return;

        const q = query(collection(db, 'chats', chatId, 'messages'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                let content = data.text;

                // INTERCEPTAÇÃO: Decipher (Base64 -> Plaintext)
                // Verifica a flag isEncrypted para garantir que só deciframos o que nós ciframos
                if (asmCrypto.isReady && data.type === 'text' && data.isEncrypted) {
                    content = asmCrypto.decrypt(data.text);
                }

                return {
                    id: doc.id,
                    ...data,
                    text: content
                };
            });
            
            // Ordena Antigas -> Novas
            messages.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
            callback(messages);
        });
    }

    // 3. ENVIAR MENSAGEM (Escrita com Cifragem)
    async sendMessage(chatId, userId, text, type = 'text') {
        if (!text && type === 'text') return;

        let payload = text;
        let isEncrypted = false;

        // INTERCEPTAÇÃO: Encipher (Plaintext -> Base64)
        if (asmCrypto.isReady && type === 'text') {
            payload = asmCrypto.encrypt(text);
            isEncrypted = true;
        }

        // Persistência com Flag de Segurança
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: userId, 
            text: payload, // Grava Base64 no banco (seguro contra corrupção de caracteres)
            type, 
            timestamp: serverTimestamp(),
            isEncrypted: isEncrypted
        });

        // Atualiza Preview na conversa principal
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: type === 'image' ? '📷 Imagem' : payload,
            lastMessageTime: serverTimestamp(),
            lastMessageEncrypted: type === 'text' ? isEncrypted : false
        });
    }

    // --- MÉTODOS AUXILIARES (Mantidos originais) ---

    async createChat(currentUserId, targetUserId) {
        const chatData = {
            participants: [currentUserId, targetUserId],
            lastMessage: 'Iniciou uma conversa',
            lastMessageTime: serverTimestamp(),
            createdBy: currentUserId
        };
        const docRef = await addDoc(collection(db, 'chats'), chatData);
        return docRef.id;
    }

    async searchUsers(searchTerm) {
        if (!searchTerm || searchTerm.length < 3) return [];
        const q = query(collection(db, 'users')); 
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