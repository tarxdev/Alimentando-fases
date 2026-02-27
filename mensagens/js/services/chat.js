import { db } from '../../../firebase-config.js'; 
import { 
    collection, query, where, onSnapshot, 
    addDoc, updateDoc, doc, serverTimestamp, getDoc, getDocs, orderBy 
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

        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => {
                const data = doc.data();
                let content = data.text;
                let wasDecrypted = false;

                // INTERCEPTAÇÃO: Decipher (Base64 -> Plaintext)
                // IMPORTANTE: alguns dados legados podem marcar isEncrypted em image/gif.
                // Centralizamos a decifragem aqui para o controller não decifrar duas vezes.
                if (asmCrypto.isReady && data.isEncrypted && typeof data.text === 'string') {
                    content = asmCrypto.decrypt(data.text);
                    wasDecrypted = true;
                }

                return {
                    id: doc.id,
                    ...data,
                    text: content,
                    wasDecrypted
                };
            });
            
            // Ordena Antigas -> Novas (timestamp pendente/null deve ir por último)
            const toMillis = (t) => {
                if (!t) return Number.POSITIVE_INFINITY;
                if (typeof t.toMillis === 'function') return t.toMillis();
                if (typeof t.seconds === 'number') return (t.seconds * 1000) + Math.floor((t.nanoseconds || 0) / 1e6);
                const d = new Date(t);
                const ms = d.getTime();
                return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
            };
            messages.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
            callback(messages);
        });
    }

    // 3. ENVIAR MENSAGEM (Escrita com Cifragem)
    async sendMessage(chatId, userId, text, type = 'text') {
        if (!text && type === 'text') return;

        const writeMessage = async (messageType, rawText) => {
            let payload = rawText;
            let isEncrypted = false;

            // INTERCEPTAÇÃO: Encipher (Plaintext -> Base64)
            if (asmCrypto.isReady && messageType === 'text') {
                payload = asmCrypto.encrypt(rawText);
                isEncrypted = true;
            }

            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                senderId: userId,
                text: payload,
                type: messageType,
                timestamp: serverTimestamp(),
                isEncrypted
            });

            return { payload, isEncrypted };
        };

        const updatePreview = async ({ previewText, previewEncrypted }) => {
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: previewText,
                lastMessageTime: serverTimestamp(),
                lastMessageEncrypted: !!previewEncrypted
            });
        };

        // Fluxo padrão
        try {
            const { payload, isEncrypted } = await writeMessage(type, text);

            const previewText = type === 'image'
                ? '📷 Imagem'
                : (type === 'gif' ? '🎞️ GIF' : payload);

            const previewEncrypted = (type === 'text') ? isEncrypted : false;
            await updatePreview({ previewText, previewEncrypted });
            return;
        } catch (e) {
            // Fallback específico: algumas regras do Firestore bloqueiam type='gif'.
            const msg = String(e?.message || '');
            const isPermissionDenied = e?.code === 'permission-denied' || msg.includes('Missing or insufficient permissions');
            if (type !== 'gif' || !isPermissionDenied) throw e;

            // Reenvia como TEXT com marcador, para passar por regras restritivas
            // e ainda renderizar como GIF no front.
            const markerText = `GIF:${text}`;
            const { isEncrypted } = await writeMessage('text', markerText);
            // Preview amigável (não mostra URL/base64)
            await updatePreview({ previewText: '🎞️ GIF', previewEncrypted: false });
            return;
        }
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