import { 
    db, collection, addDoc, doc, updateDoc, deleteDoc, 
    serverTimestamp, arrayUnion, arrayRemove, query, orderBy, limit,
    onSnapshot // <--- A CHAVE DO TEMPO REAL
} from '../config/firebase.proxy.js';

export class PostService {
    constructor() {
        this.collectionName = 'posts';
    }

    // --- MUDANÇA CRÍTICA: De getFeed para subscribeToFeed ---
    // Em vez de retornar dados uma vez, ele chama o 'callback' sempre que algo mudar no banco.
    subscribeToFeed(limitCount = 50, callback) {
        const q = query(
            collection(db, this.collectionName),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        // O onSnapshot retorna uma função para parar de escutar (unsubscribe)
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Entrega os dados novos para quem pediu (FeedController)
            callback(posts);
        }, (error) => {
            console.error("Erro no Real-Time do Feed:", error);
        });

        return unsubscribe;
    }

    async createPost(user, text, images = []) {
        if (!user) throw new Error("Usuário não autenticado.");

        const payload = {
            authorId: user.uid,
            authorName: user.displayName || user.realname || 'Usuário',
            authorPhoto: user.photoURL,
            content: text,
            images: images, 
            image: images.length > 0 ? images[0] : null,
            likes: [],
            commentsCount: 0,
            timestamp: serverTimestamp()
        };

        return await addDoc(collection(db, this.collectionName), payload);
    }

    async toggleLike(postId, userId, isLiking) {
        const postRef = doc(db, this.collectionName, postId);
        const operation = isLiking ? arrayUnion(userId) : arrayRemove(userId);
        await updateDoc(postRef, { likes: operation });
    }

    async deletePost(postId) {
        return await deleteDoc(doc(db, this.collectionName, postId));
    }

    async updatePost(postId, newContent) {
        return await updateDoc(doc(db, this.collectionName, postId), { content: newContent });
    }
}