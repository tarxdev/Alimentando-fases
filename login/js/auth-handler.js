/* ARQUIVO: login/js/auth-handler.js */

import { auth } from '../../firebase-config.js'; 
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ui = {
    btnEntrar: document.getElementById('btn-entrar'),
    profileSection: document.getElementById('user-profile-actions'),
    userName: document.getElementById('user-display-name'),
    userPhoto: document.getElementById('user-photo'),
    defaultIcon: document.getElementById('default-user-icon'),
    btnLogout: document.getElementById('btn-logout')
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- USUÁRIO LOGADO ---
        console.log("Usuário autenticado:", user.email);

        if (ui.btnEntrar) ui.btnEntrar.style.display = 'none';
        if (ui.profileSection) ui.profileSection.style.display = 'flex';

        // 1. Resolve o Nome
        const displayName = user.displayName || user.email.split('@')[0];
        if (ui.userName) {
            ui.userName.textContent = displayName;
        }

        // 2. Resolve a Foto (Lógica Sênior de Fallback)
        if (ui.userPhoto) {
            let avatarUrl = user.photoURL;

            // Se NÃO tiver foto (Login por senha), usa serviço de avatar com iniciais
            if (!avatarUrl) {
                // Pega a primeira letra do nome ou email
                const initial = displayName.charAt(0).toUpperCase();
                // API Gratuita que gera imagem com a letra
                avatarUrl = `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=128`;
            }

            ui.userPhoto.src = avatarUrl;
            ui.userPhoto.style.display = 'block'; // Força a imagem aparecer
        }

        // Esconde o ícone antigo do FontAwesome, pois agora sempre teremos imagem
        if (ui.defaultIcon) ui.defaultIcon.style.display = 'none';

    } else {
        // --- USUÁRIO DESLOGADO ---
        if (ui.btnEntrar) ui.btnEntrar.style.display = 'flex';
        if (ui.profileSection) ui.profileSection.style.display = 'none';
    }
});

// Logout Global
window.logoutSistema = async () => {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
};

if (ui.btnLogout) {
    ui.btnLogout.addEventListener('click', window.logoutSistema);
}