import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

const loadAuthenticatedUserProfile = () => {
    onAuthStateChanged(auth, async (user) => {
        const profileElements = {
            // Padrão antigo
            avatar: document.getElementById('nav-avatar-img'),
            name: document.querySelector('.profile-info-mini .p-name'),
            
            // Padrão mobile
            mobileAvatar: document.getElementById('mobile-nav-avatar'),
            mobileMenuAvatar: document.getElementById('mobile-menu-avatar'),
            mobileMenuName: document.getElementById('mobile-menu-name'),
        };

        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                let displayName = 'Meu Perfil';
                let photoURL = DEFAULT_AVATAR_URL;

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    displayName = userData.name || user.displayName || 'Meu Perfil';
                    const candidatePhoto = userData.photoURL || user.photoURL || '';
                    photoURL = (candidatePhoto && !String(candidatePhoto).includes('ui-avatars.com')) ? candidatePhoto : DEFAULT_AVATAR_URL;

                    // Verifica o cargo do usuário
                    if (userData.role === 'master') {
                        const adminPanel = document.getElementById('nav-item-admin');
                        const mobileAdminPanel = document.getElementById('mobile-item-admin');
                        if (adminPanel) {
                            adminPanel.style.display = 'block';
                        }
                        if (mobileAdminPanel) {
                            mobileAdminPanel.style.display = 'block';
                        }
                    }
                } else {
                    // Fallback para dados do Auth se não houver doc
                    displayName = user.displayName || 'Meu Perfil';
                    photoURL = (user.photoURL && !String(user.photoURL).includes('ui-avatars.com')) ? user.photoURL : DEFAULT_AVATAR_URL;
                }

                // Atualiza a sidebar principal
                if (profileElements.avatar) profileElements.avatar.src = photoURL;
                if (profileElements.name) profileElements.name.textContent = displayName;

                // Atualiza elementos mobile
                if (profileElements.mobileAvatar) profileElements.mobileAvatar.src = photoURL;
                if (profileElements.mobileMenuAvatar) profileElements.mobileMenuAvatar.src = photoURL;
                if (profileElements.mobileMenuName) profileElements.mobileMenuName.textContent = displayName;

                // Garante que o link aponta para o perfil
                const profileLink = document.querySelector('.profile-pill-link');
                if (profileLink) profileLink.href = '../perfil/index.html';

            } catch (error) {
                console.error("Erro ao buscar dados do perfil:", error);
                // Mantém placeholders em caso de erro
                if (profileElements.name) profileElements.name.textContent = 'Meu Perfil';
                if (profileElements.mobileMenuName) profileElements.mobileMenuName.textContent = 'Meu Perfil';
            }
        } else {
            console.log("Nenhum usuário autenticado.");
            // Opcional: Ocultar ou alterar o link do perfil se não houver usuário
            const profileLink = document.querySelector('.profile-pill-link');
            if (profileLink) {
                profileLink.href = '../login/index.html';
                 if (profileElements.name) profileElements.name.textContent = 'Fazer Login';
            }
        }
    });
};

// Inicializa a função quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadAuthenticatedUserProfile);
