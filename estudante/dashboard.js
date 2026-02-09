/* ARQUIVO: estudante/dashboard.js */
import { auth, db } from '../firebase-config.js'; 
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const OWNER_UID = "1Sfw2sVb7RVuKqCsNs2PUy8pIs33"; 

document.addEventListener('DOMContentLoaded', () => {
    
    // UI Cache (Livre de IDs antigos)
    const ui = {
        loader: document.getElementById('af-global-loader'),
        mainInterface: document.getElementById('main-interface'),
        navName: document.getElementById('nav-name'),
        navAvatar: document.getElementById('nav-avatar-img'),
        navUni: document.getElementById('nav-uni'),
        adminBadge: document.getElementById('admin-view-badge'),
        btnNotifs: document.getElementById('btn-notificacoes'),
        btnConfig: document.getElementById('btn-config')
    };

    if (!ui.loader || !ui.mainInterface) return;

    setupInteractions(ui);

    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = '../login/index.html'; return; }

        try {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (!userSnap.exists()) { window.location.href = '../perfil/index.html'; return; }

            const userData = userSnap.data();
            
            // ACL
            const isAuthorized = (userData.role === 'student') || 
                               (userData.role === 'admin_master') || 
                               (user.uid === OWNER_UID);

            if (!isAuthorized) {
                window.location.replace('../perfil/index.html');
                return;
            }

            // Hydrate
            if (ui.navName) ui.navName.innerText = userData.realname || "Estudante";
            if (ui.navUni) ui.navUni.innerText = userData.university || "Universidade";
            if (ui.navAvatar) ui.navAvatar.src = userData.photo || "https://ui-avatars.com/api/?name=Student";

            // Admin Badge
            if ((userData.role === 'admin_master' || user.uid === OWNER_UID) && ui.adminBadge) {
                ui.adminBadge.style.display = 'flex';
            }

            // [IMPORTANTE] Libera tela
            ui.loader.classList.add('hidden');
            ui.mainInterface.style.display = 'flex';

        } catch (error) {
            console.error("Erro:", error);
            ui.loader.classList.add('hidden');
            ui.mainInterface.style.display = 'flex';
        }
    });
});

function setupInteractions(ui) {
    if(ui.btnNotifs) {
        ui.btnNotifs.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({ title: 'Avisos', text: 'Sem novos avisos.', confirmButtonColor: '#8e44ad' });
        });
    }
    if(ui.btnConfig) {
        ui.btnConfig.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '../perfil/index.html';
        });
    }
}