import { db, auth } from '../../../firebase-config.js';
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class PresenceService {
    constructor() {
        this.heartbeatInterval = null;
    }

    // Começa a avisar o banco que estou online
    startHeartbeat() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.updateStatus(user.uid); // Atualiza agora
                
                // Atualiza a cada 60 segundos
                this.heartbeatInterval = setInterval(() => {
                    this.updateStatus(user.uid);
                }, 60000);

                // Atualiza quando focar na janela/aba
                window.addEventListener('focus', () => this.updateStatus(user.uid));
            } else {
                this.stopHeartbeat();
            }
        });
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    }

    async updateStatus(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                lastSeen: serverTimestamp(),
                isOnline: true // Opcional, mas ajuda
            });
        } catch (e) {
            console.error("Erro ao atualizar presença:", e);
        }
    }

    // Escuta o status de outro usuário em tempo real
    listenToUserStatus(uid, callback) {
        return onSnapshot(doc(db, 'users', uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const lastSeen = data.lastSeen?.toDate();
                const now = new Date();
                
                // Considera Online se visto nos últimos 2 minutos
                const isOnline = lastSeen && (now - lastSeen) < 120000; 
                
                callback({ isOnline, lastSeen });
            } else {
                callback({ isOnline: false, lastSeen: null });
            }
        });
    }
}