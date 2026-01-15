/* ARQUIVO: login/js/auth-handler.js (Substitua tudo) */

import { auth } from '../../firebase-config.js'; 
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ui = {
    btnEntrar: document.getElementById('btn-entrar'),
    profileSection: document.getElementById('user-profile-actions'),
    userName: document.getElementById('user-display-name'),
    userPhoto: document.getElementById('user-photo'),
    defaultIcon: document.getElementById('default-user-icon'), 
    userInitials: document.getElementById('user-initials'),
    btnLogout: document.getElementById('btn-logout')
};

console.log("[Auth Handler] Iniciado. Aguardando Firebase...");

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("[Auth Handler] Usuário detectado:", user.email);
        console.log("[Auth Handler] Foto URL do usuário:", user.photoURL);

        // 1. Alterna botões
        if (ui.btnEntrar) ui.btnEntrar.style.display = 'none';
        if (ui.profileSection) ui.profileSection.style.display = 'flex'; // ou 'block' dependendo do seu CSS

        // 2. Resolve Nome
        const displayName = user.displayName || user.email.split('@')[0];
        if (ui.userName) ui.userName.textContent = displayName;

        // 3. Resolve Foto
        if (ui.userPhoto) {
            let avatarUrl = user.photoURL;

            // Se não tem foto, cria o avatar de letras
            if (!avatarUrl) {
                console.log("[Auth Handler] Sem foto definida. Gerando avatar...");
                const initial = displayName.charAt(0).toUpperCase();
                avatarUrl = `https://ui-avatars.com/api/?name=${initial}&background=53954a&color=fff&size=128&bold=true`;
            }

            ui.userPhoto.src = avatarUrl;
            
            // FORÇA A EXIBIÇÃO
            ui.userPhoto.style.display = 'block'; 
            
            // ESCONDE OS OUTROS
            if (ui.defaultIcon) ui.defaultIcon.style.display = 'none';
            if (ui.userInitials) ui.userInitials.style.display = 'none';
        } else {
            console.error("[Auth Handler] ERRO: Elemento 'user-photo' (<img>) não encontrado no HTML!");
        }

    } else {
        console.log("[Auth Handler] Usuário deslogado.");
        if (ui.btnEntrar) ui.btnEntrar.style.display = 'flex';
        if (ui.profileSection) ui.profileSection.style.display = 'none';
    }
});

window.logoutSistema = async () => {
    await signOut(auth);
    window.location.reload();
};

if (ui.btnLogout) {
    ui.btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        window.logoutSistema();
    });
}