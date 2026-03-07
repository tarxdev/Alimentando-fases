import '../../global/developer-console.js';
import '../../global/sidebar-search.js'; // Injeção de Dependência do Motor de Busca (Cross-Domain)
/* ARQUIVO: admin/js/index.js - V2.1 */

import { getRoleBadgeHTML } from '../../sistema-cargos/cargos.js';
import { auth, db } from '../../firebase-config.js'; 
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, query, orderBy, limit, getDocs, getDoc, doc, updateDoc, deleteDoc, 
    getCountFromServer 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const OWNER_UID = "1Sfw2sVb7RVuKqCsNs2PUy8pIs33"; 

document.addEventListener('DOMContentLoaded', async () => {
    let currentUser = null;
    let allUsersCache = [];

    // --- AUTH GATEKEEPER ---
    onAuthStateChanged(auth, async (user) => {
        if (!user) { window.location.href = '../login/index.html'; return; }

        try {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (!userSnap.exists()) throw new Error("Usuário não encontrado.");
            
            const userData = userSnap.data();
            const isOwner = user.uid === OWNER_UID;
            const isMaster = userData.role === 'admin_master';

            if (!isMaster && !isOwner) {
                alert("ACESSO NEGADO: Área restrita.");
                window.location.href = '../perfil/index.html';
                return;
            }

            currentUser = { uid: user.uid, ...userData };
            initDashboard();

        } catch (error) {
            console.error(error);
            alert("Erro crítico: " + error.message);
        }
    });

    function initDashboard() {
        console.log("Admin Dashboard Loaded.");
        renderMyPreview();
        updateDashboardStats();
        loadAllUsers();
        setupNavigation();
        setupFilters();

        const btnUpdateMe = document.getElementById('btn-update-me');
        if (btnUpdateMe) {
            btnUpdateMe.onclick = async () => {
                const newRole = document.getElementById('select-my-role').value;
                await updateUserRole(currentUser.uid, newRole, null);
                window.location.reload();
            };
        }
    }

    // --- NAVEGAÇÃO DE ABAS ---
    function setupNavigation() {
        const links = document.querySelectorAll('.nav-links li a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if(!targetId) return; // Links externos

                e.preventDefault();
                // Oculta todas as seções
                document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
                // Remove active dos links
                document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
                
                // Mostra alvo e ativa link
                const targetSection = document.getElementById(targetId);
                if(targetSection) targetSection.style.display = 'block';
                link.parentElement.classList.add('active');

                // Lazy Load Posts
                if(targetId === 'section-posts') loadAllPosts();
            });
        });
    }

    // --- ANALYTICS ---
    async function updateDashboardStats() {
        try {
            const [totalUsersSnap, postsSnap] = await Promise.all([
                getCountFromServer(collection(db, 'users')),
                getCountFromServer(collection(db, 'posts'))
            ]);
            document.getElementById('stat-total-users').innerText = totalUsersSnap.data().count;
            document.getElementById('stat-total-posts').innerText = postsSnap.data().count;
        } catch (e) { console.warn(e); }
    }

    // --- GESTÃO DE USUÁRIOS ---
    async function loadAllUsers() {
        const tbody = document.getElementById('users-table-body');
        try {
            const q = query(collection(db, 'users'), orderBy('realname'), limit(100)); 
            const snapshot = await getDocs(q);
            allUsersCache = [];
            snapshot.forEach(d => allUsersCache.push({ uid: d.id, ...d.data() }));
            
            updateSpecificStats(allUsersCache);
            renderUsersTable(allUsersCache);
        } catch (error) { tbody.innerHTML = `<tr><td colspan="3">Erro de leitura: ${error.message}</td></tr>`; }
    }

    function updateSpecificStats(users) {
        const pros = users.filter(u => ['nutri','doctor','nurse','pe_teacher','teacher'].includes(u.role)).length;
        const students = users.filter(u => u.role === 'student').length;
        document.getElementById('stat-pro-users').innerText = pros;
        document.getElementById('stat-student-users').innerText = students;
    }

    function renderUsersTable(usersList) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (usersList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#999">Nenhum registro.</td></tr>';
            return;
        }

        usersList.forEach(u => {
            if (u.uid === currentUser.uid) return;
            const isBanned = u.isBanned === true;
            const isPro = ['nutri', 'doctor', 'nurse', 'pe_teacher', 'teacher'].includes(u.role);
            
            const tr = document.createElement('tr');
            if(isBanned) tr.style.backgroundColor = "#fff5f5";

            const userCell = `
                <div class="user-cell">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=User'}" class="table-avatar">
                    <div class="user-info-text">
                        <strong>${u.realname} ${isBanned ? '<span style="color:red;font-size:0.7em;">BANIDO</span>' : ''}</strong>
                        <small>${u.email}</small>
                    </div>
                </div>`;

            const actionsCell = `
                <div style="display:flex; gap:8px; align-items:center;">
                    <select class="admin-select role-changer" style="width:130px; padding:5px; font-size:0.85rem;">
                        <option value="user" ${u.role==='user'?'selected':''}>Usuário</option>
                        <option value="student" ${u.role==='student'?'selected':''}>Estudante</option>
                        <optgroup label="Saúde">
                            <option value="nutri" ${u.role==='nutri'?'selected':''}>Nutricionista</option>
                            <option value="doctor" ${u.role==='doctor'?'selected':''}>Médico</option>
                        </optgroup>
                        <option value="admin_master" ${u.role==='admin_master'?'selected':''}>👑 Master</option>
                    </select>
                    <input type="text" class="admin-input crn-input" value="${u.crn||''}" placeholder="CRN" style="width:80px; padding:5px; font-size:0.85rem;" ${!isPro?'disabled':''}>
                    <button class="btn-icon-save btn-save-role" data-uid="${u.uid}"><i class="fa-solid fa-floppy-disk"></i></button>
                    <button class="btn-ban-action ${isBanned?'banned':''}" data-uid="${u.uid}"><i class="fa-solid ${isBanned?'fa-lock-open':'fa-ban'}"></i></button>
                </div>`;

            tr.innerHTML = `<td>${userCell}</td><td>${getRoleBadgeHTML(u)}</td><td>${actionsCell}</td>`;
            tbody.appendChild(tr);
        });
        attachRowListeners();
    }

    function setupFilters() {
        const inp = document.getElementById('search-users');
        const sel = document.getElementById('filter-role');
        const apply = () => {
            const term = inp.value.toLowerCase();
            const role = sel.value;
            const filtered = allUsersCache.filter(u => {
                const matchText = (u.realname||'').toLowerCase().includes(term) || (u.email||'').toLowerCase().includes(term);
                let matchRole = true;
                if(role === 'pro') matchRole = ['nutri','doctor','nurse'].includes(u.role);
                else if(role === 'banned') matchRole = u.isBanned;
                else if(role !== 'all') matchRole = u.role === role;
                return matchText && matchRole;
            });
            renderUsersTable(filtered);
            document.getElementById('table-count-info').innerText = `Exibindo ${filtered.length} de ${allUsersCache.length}`;
        };
        inp.addEventListener('input', apply);
        sel.addEventListener('change', apply);
    }

    function attachRowListeners() {
        document.querySelectorAll('.role-changer').forEach(s => s.addEventListener('change', (e) => {
            const isPro = ['nutri','doctor','nurse'].includes(e.target.value);
            const inp = e.target.closest('tr').querySelector('.crn-input');
            inp.disabled = !isPro; if(isPro) inp.focus(); else inp.value = '';
        }));

        document.querySelectorAll('.btn-save-role').forEach(b => b.onclick = async(e) => {
            const btn = e.currentTarget;
            const icon = btn.querySelector('i');
            const row = btn.closest('tr');
            icon.className = 'fa-solid fa-spinner fa-spin';
            try {
                await updateUserRole(btn.dataset.uid, row.querySelector('.role-changer').value, row.querySelector('.crn-input').value);
                icon.className = 'fa-solid fa-check';
                setTimeout(() => icon.className='fa-solid fa-floppy-disk', 1000);
            } catch(err) { alert(err.message); icon.className='fa-solid fa-triangle-exclamation'; }
        });

        document.querySelectorAll('.btn-ban-action').forEach(b => b.onclick = async(e) => {
            const uid = e.currentTarget.dataset.uid;
            const isBanned = e.currentTarget.classList.contains('banned');
            if(confirm(isBanned ? "Desbanir?" : "Banir usuário?")) {
                await updateDoc(doc(db, 'users', uid), { isBanned: !isBanned });
                const u = allUsersCache.find(x => x.uid === uid); if(u) u.isBanned = !isBanned;
                renderUsersTable(allUsersCache);
            }
        });
    }

    async function loadAllPosts() {
        const grid = document.getElementById('admin-feed-grid');
        grid.innerHTML = '<p style="text-align:center">Carregando...</p>';
        try {
            const snap = await getDocs(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20)));
            grid.innerHTML = '';
            snap.forEach(d => {
                const p = d.data();
                const div = document.createElement('div');
                div.className = 'admin-post-card';
                div.innerHTML = `
                    <div class="admin-post-header"><small>${p.authorName}</small><button class="btn-delete-post" data-id="${d.id}"><i class="fa-solid fa-trash"></i></button></div>
                    ${p.image ? `<img src="${p.image}" class="admin-post-img">` : ''}
                    <p class="admin-post-text">${p.content || ''}</p>
                `;
                grid.appendChild(div);
            });
            document.querySelectorAll('.btn-delete-post').forEach(b => b.onclick = async(e) => {
                if(confirm("Apagar post?")) {
                    await deleteDoc(doc(db, 'posts', e.currentTarget.dataset.id));
                    e.currentTarget.closest('.admin-post-card').remove();
                }
            });
        } catch(e) { grid.innerHTML = 'Erro ao carregar posts.'; }
    }

    function renderMyPreview() {
        const el = document.getElementById('my-preview-area');
        if(el && currentUser) el.innerHTML = getRoleBadgeHTML(currentUser);
    }
    
    async function updateUserRole(uid, role, crn) {
        await updateDoc(doc(db, 'users', uid), { role, crn: crn||null });
    }
});