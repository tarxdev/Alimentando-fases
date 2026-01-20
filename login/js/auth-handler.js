import { auth, db } from '../../firebase-config.js'; 
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const ui = {
    btnEntrar: document.getElementById('btn-entrar'),
    profileSection: document.getElementById('user-profile-actions'),
    userName: document.getElementById('user-display-name'),
    userPhoto: document.getElementById('user-photo'),
    defaultIcon: document.getElementById('default-user-icon'), 
    userInitials: document.getElementById('user-initials'),
    btnLogout: document.getElementById('btn-logout')
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Busca dados estendidos no Firestore (onde a foto de perfil real reside)
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (ui.btnEntrar) ui.btnEntrar.style.display = 'none';
        if (ui.profileSection) ui.profileSection.style.display = 'flex';

        const displayName = userData?.realname || user.displayName || user.email.split('@')[0];
        if (ui.userName) ui.userName.textContent = displayName;

        if (ui.userPhoto) {
            // Prioridade: 1. Foto do Firestore | 2. Foto do Auth | 3. Iniciais
            let avatarUrl = userData?.photo || user.photoURL;

            if (!avatarUrl) {
                const initial = displayName.charAt(0).toUpperCase();
                avatarUrl = `https://ui-avatars.com/api/?name=${initial}&background=53954a&color=fff&size=128&bold=true`;
            }

            ui.userPhoto.src = avatarUrl;
            ui.userPhoto.style.display = 'block'; 
            
            if (ui.defaultIcon) ui.defaultIcon.style.display = 'none';
            if (ui.userInitials) ui.userInitials.style.display = 'none';
        }
    } else {
        if (ui.btnEntrar) ui.btnEntrar.style.display = 'flex';
        if (ui.profileSection) ui.profileSection.style.display = 'none';
    }
});

window.logoutSistema = async () => {
    await signOut(auth);
    window.location.reload();
};