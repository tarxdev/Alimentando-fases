import { 
    db, collection, collectionGroup, query, where, getDocs, writeBatch 
} from '../config/firebase.proxy.js';

export class IdentityService {

    /**
     * Atualiza a foto do autor em TODOS os posts e comentários.
     */
    async propagateImage(authorId, newPhotoUrl) {
        if (!authorId || !newPhotoUrl) return 0;

        const batch = writeBatch(db);
        let count = 0;
        
        try {
            // 1. Atualizar Meus Posts
            const postsQ = query(collection(db, 'posts'), where('authorId', '==', authorId));
            const postsSnap = await getDocs(postsQ);
            postsSnap.forEach(doc => { 
                batch.update(doc.ref, { authorPhoto: newPhotoUrl }); 
                count++; 
            });

            // 2. Atualizar Meus Comentários (Global)
            const commentsQ = query(collectionGroup(db, 'comments'), where('authorId', '==', authorId));
            const commentsSnap = await getDocs(commentsQ);
            commentsSnap.forEach(doc => { 
                batch.update(doc.ref, { authorPhoto: newPhotoUrl }); 
                count++; 
            });

            // 3. Atualizar Minhas Respostas
            const repliesQ = query(collectionGroup(db, 'replies'), where('authorId', '==', authorId));
            const repliesSnap = await getDocs(repliesQ);
            repliesSnap.forEach(doc => { 
                batch.update(doc.ref, { authorPhoto: newPhotoUrl }); 
                count++; 
            });

            if (count > 0) {
                await batch.commit();
                console.log(`[Sistema] Atualizado ${count} posts/comentários com a nova foto.`);
            }
            return count;

        } catch (error) {
            console.error("[Sistema] Erro na propagação:", error);
            return 0;
        }
    }
}