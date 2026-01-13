import { auth, db } from '../firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const OWNER_UID = '1Sfw2sVb7RVuKqCsNs2PUy8pIs33';

async function resolveRole(uid) {
    if (!uid) return null;
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return data.role || data.authorRole || null;
        }
    } catch (err) {
        console.warn('[admin-guard] Falha ao buscar role:', err);
    }
    return null;
}

function toggleAdminLink(show) {
    const link = document.getElementById('nav-item-admin');
    if (!link) return;
    link.style.display = show ? 'block' : 'none';
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        toggleAdminLink(false);
        return;
    }
    const role = await resolveRole(user.uid);
    const isAdmin = role === 'admin_master' || user.uid === OWNER_UID;
    toggleAdminLink(isAdmin);
});
