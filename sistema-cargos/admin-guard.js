import { auth, db } from '../firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const OWNER_UID = '1Sfw2sVb7RVuKqCsNs2PUy8pIs33';

const ROLE_CACHE_KEY = 'af_role_cache';

function getCachedRole(uid) {
    try {
        const raw = localStorage.getItem(ROLE_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.uid === uid ? parsed.role : null;
    } catch (e) {
        console.warn('[admin-guard] cache inválido', e);
        return null;
    }
}

function setCachedRole(uid, role) {
    try {
        localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ uid, role }));
    } catch (e) {
        console.warn('[admin-guard] não foi possível salvar cache', e);
    }
}

async function resolveRole(uid) {
    if (!uid) return null;
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            const role = data.role || data.authorRole || null;
            setCachedRole(uid, role);
            return role;
        }
    } catch (err) {
        console.warn('[admin-guard] Falha ao buscar role:', err);
    }
    return null;
}

function toggleAdminLink(show) {
    const desktopLink = document.getElementById('nav-item-admin');
    const mobileLink = document.getElementById('mobile-item-admin');

    if (desktopLink) desktopLink.style.display = show ? 'block' : 'none';
    if (mobileLink) mobileLink.style.display = show ? 'block' : 'none';
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        toggleAdminLink(false);
        return;
    }
    const cachedRole = getCachedRole(user.uid);
    const isOwner = user.uid === OWNER_UID;

    // Otimista: mostra de imediato se já sabemos que é admin_master ou owner.
    if (isOwner || cachedRole === 'admin_master') {
        toggleAdminLink(true);
    }

    const role = await resolveRole(user.uid);
    const isAdmin = role === 'admin_master' || isOwner;
    toggleAdminLink(isAdmin);
});
