import { 
    db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, 
    serverTimestamp, arrayUnion, arrayRemove, increment, 
    query, orderBy, getDoc
} from '../config/firebase.proxy.js';
import { notifyPostComment } from '../../../global/notification-events.js';

export class InteractionService {
    
    // Busca comentários e respostas
    async getComments(postId) {
        try {
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const q = query(commentsRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(q);
            
            const commentsWithReplies = await Promise.all(snapshot.docs.map(async docSnap => {
                const commentData = docSnap.data();
                // Caminho explícito para garantir leitura correta
                const repliesRef = collection(db, 'posts', postId, 'comments', docSnap.id, 'replies');
                const repliesQ = query(repliesRef, orderBy('timestamp', 'asc'));
                const repliesSnap = await getDocs(repliesQ);
                
                const replies = repliesSnap.docs.map(rd => ({ id: rd.id, ...rd.data() }));
                
                return { id: docSnap.id, ...commentData, replies: replies };
            }));

            return commentsWithReplies;
        } catch (error) {
            console.error("Erro ao buscar comentários:", error);
            return [];
        }
    }

    // Adicionar Comentário (+1 no contador)
    async addComment(postId, user, text, image = null) {
        if (!user) throw new Error("Login necessário");
        
        const payload = {
            authorId: user.uid,
            authorName: user.displayName || 'Usuário',
            authorPhoto: user.photoURL,
            text: text,
            image: image,
            likes: [],
            timestamp: serverTimestamp()
        };
        
        const ref = await addDoc(collection(db, 'posts', postId, 'comments'), payload);
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });

        const postSnap = await getDoc(doc(db, 'posts', postId));
        if (postSnap.exists()) {
            const postData = postSnap.data();
            await notifyPostComment({
                recipientId: postData.authorId,
                actorId: user.uid,
                actorName: user.displayName || 'Usuário',
                actorPhoto: user.photoURL || '',
                postId
            });
        }
        
        return { id: ref.id, ...payload };
    }

    // Adicionar Resposta (+1 no contador)
    async addReply(postId, commentId, user, text, image = null) {
        if (!user) throw new Error("Login necessário");
        
        const payload = {
            authorId: user.uid,
            authorName: user.displayName || 'Usuário',
            authorPhoto: user.photoURL,
            text: text,
            image: image,
            timestamp: serverTimestamp()
        };
        
        await addDoc(collection(db, 'posts', postId, 'comments', commentId, 'replies'), payload);
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });

        const postSnap = await getDoc(doc(db, 'posts', postId));
        if (postSnap.exists()) {
            const postData = postSnap.data();
            await notifyPostComment({
                recipientId: postData.authorId,
                actorId: user.uid,
                actorName: user.displayName || 'Usuário',
                actorPhoto: user.photoURL || '',
                postId
            });
        }
    }

    // Deletar Comentário (Remove Pai + Filhos e atualiza contador)
    async deleteComment(postId, commentId) {
        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            
            // 1. Contar quantas respostas existem para descontar corretamente
            const repliesRef = collection(db, 'posts', postId, 'comments', commentId, 'replies');
            const repliesSnap = await getDocs(repliesRef);
            const totalToDelete = 1 + repliesSnap.size; // 1 (Pai) + N (Filhos)

            // 2. Deletar respostas individualmente
            const deletePromises = repliesSnap.docs.map(r => deleteDoc(r.ref));
            await Promise.all(deletePromises);

            // 3. Deletar Pai
            await deleteDoc(commentRef);

            // 4. Atualizar contador com o número exato que foi removido
            await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-totalToDelete) });

        } catch (error) {
            console.error("Erro ao deletar:", error);
        }
    }

    async deleteReply(postId, commentId, replyId) {
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId, 'replies', replyId));
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) });
    }

    async toggleCommentLike(postId, commentId, userId, isLiking) {
        const commentRef = doc(db, 'posts', postId, 'comments', commentId);
        const op = isLiking ? arrayUnion(userId) : arrayRemove(userId);
        await updateDoc(commentRef, { likes: op });
    }

    // --- FERRAMENTA DE CORREÇÃO (NUCLEAR) ---
    // Conta manualmente tudo o que existe e sobrescreve o número no banco
    async syncPostCommentCount(postId) {
        try {
            // 1. Pega todos os comentários raiz
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const commentsSnap = await getDocs(commentsRef);
            
            let realTotal = commentsSnap.size;

            // 2. Itera sobre cada um para somar as respostas (Subcoleções)
            for (const docSnap of commentsSnap.docs) {
                const repliesRef = collection(db, 'posts', postId, 'comments', docSnap.id, 'replies');
                const repliesSnap = await getDocs(repliesRef);
                realTotal += repliesSnap.size;
            }

            // 3. Força a atualização no banco (Sobrescreve o valor antigo errado)
            await updateDoc(doc(db, 'posts', postId), { commentsCount: realTotal });
            
            return realTotal;
        } catch (error) {
            console.error("Falha no Sync:", error);
            throw error;
        }
    }
}