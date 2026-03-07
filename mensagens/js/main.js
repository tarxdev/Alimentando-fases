/* =======================================================
 * MENSAGENS - ARQUIVO PRINCIPAL
 * ======================================================= */
import '../../global/developer-console.js'; // Garantindo consistência de logs e ambiente
import '../../global/sidebar-search.js';    // Injeção de Dependência do Motor de Busca (Cross-Domain)

// Tenta ajustar o caminho se necessário (Fallback manual não funciona em módulos ES6 puros, 
// então garantimos o caminho padrão mais comum: ../../)
import { auth, db } from '../../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { MessageController } from './controllers/message.controller.js';
import { isMasterUser } from '../../sistema-cargos/cargos.js';
import { PresenceService } from './services/presence.service.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Oculta o Loader Global
    setTimeout(() => { 
        if(window.GlobalLoader) window.GlobalLoader.hide(); 
    }, 1200);

    console.log("Iniciando Módulo de Mensagens...");

    // 2. Inicializa os Controladores
    const chatApp = new MessageController();
    chatApp.init();

    const presence = new PresenceService();
    presence.startHeartbeat();

    // 3. Carrega Dados da Sidebar (Foto e Nome)
    initLayoutAuth();
});

function initLayoutAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadSidebarData(user);
        } else {
            const img = document.getElementById('nav-avatar-img');
            if(img) img.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        }
    });
}

async function loadSidebarData(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Prioriza foto do banco > foto do google > placeholder
            // Verifica também campos alternativos como 'foto' em pt-br
            const dbPhoto = data.photo || data.foto; 
            const name = data.nome || data.realname || data.name || user.displayName || "Usuário";
            
            const displayPhoto = (dbPhoto && !dbPhoto.includes('ui-avatars')) ? dbPhoto : (user.photoURL || `https://ui-avatars.com/api/?name=${name}`);

            // Atualiza na tela
            const img = document.getElementById('nav-avatar-img');
            if(img) img.src = displayPhoto;
            
            // Se tiver elemento de nome na sidebar, atualiza tbm
            const nameEl = document.querySelector('.profile-info-mini .p-name');
            if(nameEl) nameEl.innerText = name.split(' ')[0]; // Só o primeiro nome

            // Verifica Admin
            if (isMasterUser(data)) {
                const adminItem = document.getElementById('nav-item-admin');
                if (adminItem) adminItem.style.display = 'block';
            }
        }
    } catch (e) {
        console.error("Erro ao carregar sidebar:", e);
    }
}