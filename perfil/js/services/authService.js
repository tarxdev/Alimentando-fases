/* ARQUIVO: perfil/js/services/authService.js */

import { auth } from '../../../firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut, 
    updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export class AuthService {
    constructor() {
        this.auth = auth;
    }

    /**
     * Monitora o estado da autenticação (Login/Logout)
     * @param {Function} callback - Função executada quando o status muda
     */
    monitorAuth(callback) {
        return onAuthStateChanged(this.auth, callback);
    }

    /**
     * Realiza o logout
     */
    async logout() {
        try {
            await signOut(this.auth);
            return true;
        } catch (error) {
            console.error("Erro ao sair:", error);
            throw error;
        }
    }

    /**
     * Atualiza a foto do perfil no Auth
     * @param {string} photoURL - Nova URL
     */
    async updateUserPhoto(photoURL) {
        if (this.auth.currentUser) {
            await updateProfile(this.auth.currentUser, { photoURL });
        }
    }

    /**
     * Retorna o objeto do usuário atual
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }
}