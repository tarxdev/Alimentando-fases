/* =======================================================
 * NOTIFICAÇÕES (MODULAR JS)
 * ======================================================= */

// Importações do Firebase e Configuração
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Importação do Sistema de Cargos (Para validar Admin)
import { isMasterUser } from '../sistema-cargos/cargos.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Loader (Visual)
    setTimeout(() => {
        if(window.GlobalLoader) window.GlobalLoader.hide();
    }, 1500);

    // 2. Eventos UI
    initUIEvents();
    
    // 3. Autenticação e Dados
    initAuth();
});

function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log('Usuário autenticado:', user.uid);
            await loadUserData(user);
        } else {
            // Se não estiver logado, foto genérica
            updateAvatarImages("https://cdn-icons-png.flaticon.com/512/149/149071.png");
        }
    });
}

async function loadUserData(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const dbData = userDoc.data();
            
            // --- 1. Lógica de Foto (Padrão Unificado) ---
            const dbPhoto = dbData.photo; 
            const authPhoto = user.photoURL;
            const hasValidDbPhoto = dbPhoto && !dbPhoto.includes('ui-avatars.com');
            
            let finalPhoto = null;
            if (hasValidDbPhoto) {
                finalPhoto = dbPhoto;
            } else if (authPhoto) {
                finalPhoto = authPhoto;
            }

            const finalName = dbData.realname || dbData.name || dbData.username || user.displayName || "Usuário";
            const displayPhoto = finalPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=random&color=fff`;

            updateAvatarImages(displayPhoto);
            updateUserTexts(dbData, user.email);

            // --- 2. Lógica do Painel Admin (NOVO) ---
            const adminItem = document.getElementById('nav-item-admin');
            const mobileAdminItem = document.getElementById('mobile-item-admin'); // Caso exista menu mobile no futuro

            // Verifica se o usuário tem permissão usando a função centralizada
            if (isMasterUser(dbData)) {
                if (adminItem) adminItem.style.display = 'block'; 
                if (mobileAdminItem) mobileAdminItem.style.display = 'block';
                console.log('Acesso Admin liberado para:', finalName);
            }

        } else {
            // Fallback para usuário sem registro no banco
            const fallbackPhoto = user.photoURL || `https://ui-avatars.com/api/?name=User&background=random`;
            updateAvatarImages(fallbackPhoto);
        }

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Atualiza a imagem na Sidebar
function updateAvatarImages(url) {
    const sidebarAvatar = document.getElementById('nav-avatar-img');
    if (sidebarAvatar) sidebarAvatar.src = url;
}

// Preenche dados nos modais de configuração
function updateUserTexts(userData, email) {
    const stUsername = document.getElementById('st-info-username');
    const stEmail = document.getElementById('st-info-email');
    
    const displayUser = userData.username || userData.realname || userData.name || '';
    
    if (stUsername) stUsername.value = displayUser;
    if (stEmail) stEmail.value = email || '';
}

// --- EVENTOS DE INTERFACE ---
function initUIEvents() {
    // Botão Marcar Lidas
    const btnMarkAll = document.getElementById('btn-mark-all-read');
    if (btnMarkAll) {
        btnMarkAll.addEventListener('click', () => {
            if(window.Swal) {
                Swal.fire({
                    title: 'Pronto!',
                    text: 'Todas as notificações foram marcadas como lidas.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                    backdrop: `rgba(0,0,0,0.4)`
                });
            }
            document.querySelectorAll('.notif-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
        });
    }

    // Modais
    setupModal('btn-open-tools', 'modal-tools', 'btn-close-tools');
    setupModal('btn-open-settings', 'modal-settings', 'btn-close-settings');

    // Tabs Configurações
    const settingsTabs = document.querySelectorAll('.settings-nav-btn');
    const settingsSections = document.querySelectorAll('.settings-section');
    settingsTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsSections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            if(settingsSections[index]) settingsSections[index].classList.add('active');
        });
    });
}

function setupModal(triggerId, modalId, closeId) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (trigger && modal) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('open');
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });
    }
}

// --- FERRAMENTAS GLOBAIS ---
window.calculateWater = function() {
    const weight = parseFloat(document.getElementById('user-weight-water').value);
    const resultArea = document.getElementById('calc-result-area');
    const resultText = document.getElementById('water-result-text');

    if (weight > 0) {
        const water = (weight * 0.035).toFixed(1);
        resultText.innerText = `${water} L`;
        resultArea.classList.remove('hidden');
    } else {
        resultArea.classList.add('hidden');
    }
};

window.calculateIMC = function() {
    const height = parseFloat(document.getElementById('imc-height').value) / 100;
    const weight = parseFloat(document.getElementById('imc-weight').value);
    
    if (height > 0 && weight > 0) {
        const imc = (weight / (height * height)).toFixed(1);
        const resultArea = document.getElementById('imc-result-area');
        const imcValue = document.getElementById('imc-value');
        const badge = document.getElementById('imc-status-badge');

        imcValue.innerText = imc;
        
        let status = ''; let color = '';
        if (imc < 18.5) { status = 'Abaixo'; color = '#f1c40f'; }
        else if (imc < 24.9) { status = 'Normal'; color = '#2ecc71'; }
        else if (imc < 29.9) { status = 'Sobrepeso'; color = '#e67e22'; }
        else { status = 'Obesidade'; color = '#e74c3c'; }

        badge.innerText = status;
        badge.style.backgroundColor = color;
        badge.style.color = '#fff';
        resultArea.classList.remove('hidden');
    }
};