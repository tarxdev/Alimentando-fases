/* =======================================================
 * NOTIFICAÇÕES (MODULAR JS)
 * ======================================================= */

// Importações do Firebase e Configuração
import { auth, db } from '../firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Importação do Sistema de Cargos (Para validar Admin)
import { isMasterUser } from '../sistema-cargos/cargos.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Loader (Visual)
    setTimeout(() => {
        if(window.GlobalLoader) window.GlobalLoader.hide();
    }, 1500);

    // 2. Eventos UI
    initUIEvents();
    initMobileMenu();
    
    // 3. Autenticação e Dados
    initAuth();
});

function initMobileMenu() {
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileOverlay = document.getElementById('mobile-menu-overlay');
    const btnCloseMobileMenu = document.getElementById('btn-close-mobile-menu');

    if (btnMobileMenu && mobileOverlay) {
        btnMobileMenu.addEventListener('click', () => mobileOverlay.classList.add('open'));
    }

    if (btnCloseMobileMenu && mobileOverlay) {
        btnCloseMobileMenu.addEventListener('click', () => mobileOverlay.classList.remove('open'));
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', (event) => {
            if (event.target === mobileOverlay) {
                mobileOverlay.classList.remove('open');
            }
        });

        mobileOverlay.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => mobileOverlay.classList.remove('open'));
        });
    }
}

let currentUserId = null;
let notificationsUnsubscribe = null;

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

            startNotificationsStream(user.uid);

        } else {
            // Fallback para usuário sem registro no banco
            const fallbackPhoto = user.photoURL || `https://ui-avatars.com/api/?name=User&background=random`;
            updateAvatarImages(fallbackPhoto);
            startNotificationsStream(user.uid);
        }

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getNotificationMessage(notification) {
    const actor = escapeHtml(notification.actorName || 'Alguém');
    if (notification.type === 'follow') return `<strong>${actor}</strong> começou a seguir você.`;
    if (notification.type === 'like') return `<strong>${actor}</strong> curtiu uma publicação sua.`;
    if (notification.type === 'comment') return `<strong>${actor}</strong> comentou em uma publicação sua.`;
    return `<strong>${actor}</strong> interagiu com seu perfil.`;
}

function getNotificationIcon(type) {
    if (type === 'follow') return '<i class="fa-solid fa-user-plus"></i>';
    if (type === 'like') return '<i class="fa-solid fa-heart"></i>';
    if (type === 'comment') return '<i class="fa-solid fa-comment"></i>';
    return '<i class="fa-regular fa-bell"></i>';
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return 'Agora';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diff = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

    if (diff < 60) return 'Agora';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
    return date.toLocaleDateString('pt-BR');
}

function renderNotifications(notifications) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="notif-item" style="justify-content:center; cursor:default;">
                <div class="notif-content" style="text-align:center;">
                    <div class="notif-text">Nenhuma notificação por enquanto.</div>
                    <div class="notif-time">Quando houver interações, elas aparecerão aqui.</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map((n) => {
        const photo = escapeHtml(n.actorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.actorName || 'User')}`);
        const unreadClass = n.read ? '' : 'unread';
        return `
            <article class="notif-item ${unreadClass}" data-notification-id="${escapeHtml(n.id)}">
                <img src="${photo}" class="notif-avatar" alt="Avatar">
                <div class="notif-content">
                    <div class="notif-text">${getNotificationIcon(n.type)} ${getNotificationMessage(n)}</div>
                    <div class="notif-time">${formatRelativeTime(n.timestamp)}</div>
                </div>
            </article>
        `;
    }).join('');

    container.querySelectorAll('.notif-item').forEach((el) => {
        el.addEventListener('click', () => {
            const id = el.getAttribute('data-notification-id');
            const data = notifications.find((item) => item.id === id);
            if (data) handleNotificationClick(data, el);
        });
    });
}

function startNotificationsStream(userId) {
    currentUserId = userId;

    if (notificationsUnsubscribe) {
        notificationsUnsubscribe();
        notificationsUnsubscribe = null;
    }

    const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(100)
    );

    notificationsUnsubscribe = onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));
        renderNotifications(notifications);
    }, (error) => {
        console.error('Erro ao carregar notificações:', error);
    });
}

async function handleNotificationClick(notification, element) {
    if (!notification.read) {
        try {
            await updateDoc(doc(db, 'notifications', notification.id), { read: true });
            if (element) element.classList.remove('unread');
        } catch (error) {
            console.error('Erro ao marcar notificação como lida:', error);
        }
    }

    if (notification.type === 'follow' && notification.actorId) {
        window.location.href = `../perfil/index.html?uid=${encodeURIComponent(notification.actorId)}`;
        return;
    }

    if (notification.postId) {
        window.location.href = '../perfil/index.html';
    }
}

async function markAllNotificationsAsRead() {
    if (!currentUserId) return;

    try {
        const unreadQuery = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUserId),
            where('read', '==', false),
            limit(200)
        );
        const snapshot = await getDocs(unreadQuery);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
            batch.update(docSnap.ref, { read: true });
        });
        await batch.commit();
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
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
        btnMarkAll.addEventListener('click', async () => {
            await markAllNotificationsAsRead();
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
        });
    }

    // Modais
    setupModal('btn-open-tools', 'modal-tools', 'btn-close-tools');
    // Configuracoes agora abre pagina dedicada em ../configuracoes/index.html

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