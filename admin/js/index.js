// admin/js/index.js
// V2.0 - PROFESSIONAL EDITION
// Autor: Tarciso (via Gemini)
// Data: Janeiro 2026

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
    let allUsersCache = []; // Cache local para filtragem instantânea no cliente

    // ============================================================
    // 0. AUTH & SECURITY GATEKEEPER
    // ============================================================
    onAuthStateChanged(auth, async (user) => {
        if (!user) { 
            window.location.href = '../login/index.html'; 
            return; 
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) throw new Error("Usuário não encontrado na base de dados.");
            
            const userData = userSnap.data();
            const isOwner = user.uid === OWNER_UID;
            const isMaster = userData.role === 'admin_master';

            if (!isMaster && !isOwner) {
                console.warn(`Tentativa de acesso não autorizado: ${user.uid}`);
                alert("ACESSO NEGADO: Você não tem permissão de Administrador.");
                window.location.href = '../perfil/index.html';
                return;
            }

            currentUser = { uid: user.uid, ...userData };
            
            // Inicializa Dashboard apenas após validação
            initDashboard();

        } catch (error) {
            console.error("Auth Critical Error:", error);
            alert("Erro crítico de autenticação: " + error.message);
        }
    });

    function initDashboard() {
        console.info("Dashboard Iniciado. Modo Deus: ON");
        renderMyPreview();
        updateDashboardStats(); // Carrega analytics do topo
        loadAllUsers();         // Carrega tabela principal
        setupNavigation();      // Configura abas
        setupFilters();         // Configura busca dinâmica

        // Configura botão de "Simular Cargo" (Para testes do próprio admin)
        const btnUpdateMe = document.getElementById('btn-update-me');
        if (btnUpdateMe) {
            btnUpdateMe.onclick = async () => {
                const newRole = document.getElementById('select-my-role').value;
                await updateUserRole(currentUser.uid, newRole, null);
                window.location.reload();
            };
        }
    }

    // ============================================================
    // 1. ANALYTICS (CONTAGEM SERVER-SIDE OTIMIZADA)
    // ============================================================
    async function updateDashboardStats() {
        try {
            const usersColl = collection(db, 'users');
            const postsColl = collection(db, 'posts');

            // Executa contagens leves (meta-dados) em paralelo
            const [totalUsersSnap, postsSnap] = await Promise.all([
                getCountFromServer(usersColl),
                getCountFromServer(postsColl)
            ]);

            animateCounter('stat-total-users', totalUsersSnap.data().count);
            animateCounter('stat-total-posts', postsSnap.data().count);

        } catch (e) {
            console.warn("Analytics Warning:", e);
            document.getElementById('stat-total-users').innerText = '-';
            document.getElementById('stat-total-posts').innerText = '-';
        }
    }

    function animateCounter(id, target) {
        const el = document.getElementById(id);
        if(!el) return;
        el.innerText = target; 
        // Futuro: Implementar countUp.js se desejar animação
    }

    // ============================================================
    // 2. GESTÃO DE USUÁRIOS (CORE)
    // ============================================================
    async function loadAllUsers() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando base de dados...</td></tr>';

        try {
            const usersRef = collection(db, 'users');
            // Busca os primeiros 100 usuários ordenados por nome real
            const q = query(usersRef, orderBy('realname'), limit(100)); 
            const snapshot = await getDocs(q);
            
            allUsersCache = [];
            
            snapshot.forEach(docSnap => {
                allUsersCache.push({ uid: docSnap.id, ...docSnap.data() });
            });

            // Calcula estatísticas baseadas no snapshot carregado
            updateSpecificStats(allUsersCache);
            
            // Renderiza tabela inicial
            renderUsersTable(allUsersCache);

        } catch (error) { 
            console.error("Erro ao carregar usuários:", error); 
            tbody.innerHTML = `<tr><td colspan="3" style="color:#e74c3c; text-align:center; padding:20px;">Erro de conexão: ${error.message}</td></tr>`;
        }
    }

    function updateSpecificStats(users) {
        const pros = users.filter(u => ['nutri','doctor','nurse','pe_teacher','teacher'].includes(u.role)).length;
        const students = users.filter(u => u.role === 'student').length;
        
        const elPro = document.getElementById('stat-pro-users');
        const elStudent = document.getElementById('stat-student-users');
        
        if(elPro) elPro.innerText = pros;
        if(elStudent) elStudent.innerText = students;
    }

    // Renderização Pura (Stateless UI)
    function renderUsersTable(usersList) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        if (usersList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#95a5a6">Nenhum usuário encontrado para estes filtros.</td></tr>';
            return;
        }

        usersList.forEach(u => {
            if (u.uid === currentUser.uid) return; // Não listar a si mesmo

            const isBanned = u.isBanned === true;
            const tr = document.createElement('tr');
            if (isBanned) tr.style.backgroundColor = "#fff5f5"; 

            const professionalRoles = ['nutri', 'doctor', 'nurse', 'pe_teacher', 'teacher'];
            const isProfessional = professionalRoles.includes(u.role);

            // Coluna 1: Info Básica
            const userCell = `
                <div class="user-cell">
                    <img src="${u.photo || 'https://ui-avatars.com/api/?name=User&background=random'}" class="table-avatar" loading="lazy" alt="avatar">
                    <div class="user-info-text">
                        <strong>${u.realname || 'Sem nome'} ${isBanned ? '<span style="color:#e74c3c;font-size:0.7em;border:1px solid #e74c3c;padding:1px 4px;border-radius:4px;margin-left:5px;">BANIDO</span>' : ''}</strong>
                        <small title="${u.uid}">${u.username || u.email || 'UID: ' + u.uid.substring(0,8)+'...'}</small>
                    </div>
                </div>
            `;

            // Coluna 3: Ações (Select + Inputs + Botões)
            const actionsCell = `
                <div style="display:flex; gap:8px; align-items:center;">
                    <select class="admin-select role-changer" style="width: 130px; padding: 5px; font-size:0.85rem;">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuário</option>
                        <option value="student" ${u.role === 'student' ? 'selected' : ''}>Estudante</option>
                        <optgroup label="Saúde">
                            <option value="nutri" ${u.role === 'nutri' ? 'selected' : ''}>Nutricionista</option>
                            <option value="doctor" ${u.role === 'doctor' ? 'selected' : ''}>Médico</option>
                            <option value="nurse" ${u.role === 'nurse' ? 'selected' : ''}>Enfermeiro</option>
                        </optgroup>
                         <optgroup label="Educação">
                            <option value="pe_teacher" ${u.role === 'pe_teacher' ? 'selected' : ''}>Personal</option>
                            <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Professor</option>
                        </optgroup>
                        <option value="admin_master" ${u.role === 'admin_master' ? 'selected' : ''}>👑 Master</option>
                    </select>
                    
                    <input type="text" class="admin-input crn-input" 
                           value="${u.crn || ''}" placeholder="CRN/Reg." style="width: 80px; padding: 5px; font-size:0.85rem;"
                           ${!isProfessional ? 'disabled' : ''}>

                    <button class="btn-icon-save btn-save-role" data-uid="${u.uid}" title="Salvar Alterações">
                        <i class="fa-solid fa-floppy-disk"></i>
                    </button>

                    <button class="btn-ban-action ${isBanned ? 'banned' : ''}" data-uid="${u.uid}" title="${isBanned ? 'Desbanir' : 'Banir'}">
                        <i class="fa-solid ${isBanned ? 'fa-lock-open' : 'fa-ban'}"></i>
                    </button>
                </div>
            `;

            tr.innerHTML = `<td>${userCell}</td><td>${getRoleBadgeHTML(u)}</td><td>${actionsCell}</td>`;
            tbody.appendChild(tr);
        });

        attachRowListeners(); // Reconecta listeners do DOM recém-criado
    }

    // ============================================================
    // 3. FILTRAGEM INTELIGENTE (CLIENT-SIDE)
    // ============================================================
    function setupFilters() {
        const searchInput = document.getElementById('search-users');
        const roleFilter = document.getElementById('filter-role');
        const countInfo = document.getElementById('table-count-info');

        const applyFilters = () => {
            const term = searchInput.value.toLowerCase();
            const role = roleFilter.value;

            const filtered = allUsersCache.filter(u => {
                // Filtro 1: Texto (Nome, Email, UID)
                const matchesText = (u.realname || '').toLowerCase().includes(term) || 
                                    (u.email || '').toLowerCase().includes(term) ||
                                    (u.uid || '').includes(term);
                
                // Filtro 2: Categoria/Cargo
                let matchesRole = true;
                if (role === 'pro') matchesRole = ['nutri','doctor','nurse','pe_teacher','teacher'].includes(u.role);
                else if (role === 'banned') matchesRole = u.isBanned === true;
                else if (role !== 'all') matchesRole = u.role === role;

                return matchesText && matchesRole;
            });

            renderUsersTable(filtered);
            countInfo.innerText = `Exibindo ${filtered.length} de ${allUsersCache.length} carregados`;
        };

        searchInput.addEventListener('input', applyFilters);
        roleFilter.addEventListener('change', applyFilters);
    }

    // ============================================================
    // 4. LISTENERS DE AÇÃO (CRUD)
    // ============================================================
    function attachRowListeners() {
        const professionalRoles = ['nutri', 'doctor', 'nurse', 'pe_teacher', 'teacher'];
        
        // UX: Habilita campo CRN dinamicamente
        document.querySelectorAll('.role-changer').forEach(select => {
            select.addEventListener('change', (e) => {
                const row = e.target.closest('tr');
                const crnInput = row.querySelector('.crn-input');
                const isPro = professionalRoles.includes(e.target.value);
                
                crnInput.disabled = !isPro;
                if(isPro) {
                    crnInput.focus();
                } else {
                    crnInput.value = '';
                }
            });
        });

        // AÇÃO: Salvar Cargo
        document.querySelectorAll('.btn-save-role').forEach(btn => {
            btn.onclick = async (e) => {
                const btnEl = e.currentTarget;
                const uid = btnEl.dataset.uid;
                const row = btnEl.closest('tr');
                
                const newRole = row.querySelector('.role-changer').value;
                const newCrn = row.querySelector('.crn-input').value;
                const icon = btnEl.querySelector('i');

                // UI Feedback: Loading
                const originalClass = icon.className;
                icon.className = 'fa-solid fa-spinner fa-spin';

                try {
                    await updateUserRole(uid, newRole, newCrn);
                    
                    // Atualiza Cache Local (Otimisticamente)
                    const userInCache = allUsersCache.find(u => u.uid === uid);
                    if(userInCache) {
                        userInCache.role = newRole;
                        userInCache.crn = newCrn;
                    }
                    
                    // Sucesso
                    icon.className = 'fa-solid fa-check';
                    
                    // Reset visual após 1s
                    setTimeout(() => {
                        icon.className = 'fa-solid fa-floppy-disk';
                        // Re-renderiza para atualizar Badges
                        if(document.getElementById('search-users').value === '') {
                             renderUsersTable(allUsersCache); 
                        }
                    }, 1000);

                } catch (err) {
                    console.error(err);
                    icon.className = 'fa-solid fa-triangle-exclamation';
                    alert("Erro ao salvar: " + err.message);
                    setTimeout(() => icon.className = originalClass, 2000);
                }
            };
        });

        // AÇÃO: Banir/Desbanir
        document.querySelectorAll('.btn-ban-action').forEach(btn => {
            btn.onclick = async (e) => {
                const btnEl = e.currentTarget;
                const uid = btnEl.dataset.uid;
                const isBanned = btnEl.classList.contains('banned');
                const actionText = isBanned ? "Desbloquear" : "BANIR";

                const confirm = await Swal.fire({
                    title: `${actionText} Usuário?`,
                    text: isBanned ? "O acesso será restaurado imediatamente." : "O usuário será desconectado e impedido de entrar.",
                    icon: isBanned ? 'question' : 'warning',
                    showCancelButton: true,
                    confirmButtonColor: isBanned ? '#2ecc71' : '#d33',
                    confirmButtonText: `Sim, ${actionText}`,
                    cancelButtonText: 'Cancelar'
                });

                if (confirm.isConfirmed) {
                    try {
                        const userRef = doc(db, 'users', uid);
                        await updateDoc(userRef, { isBanned: !isBanned });
                        
                        // Atualiza Cache
                        const userInCache = allUsersCache.find(u => u.uid === uid);
                        if(userInCache) userInCache.isBanned = !isBanned;

                        renderUsersTable(allUsersCache); 
                        
                        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                        Toast.fire({ icon: 'success', title: 'Status atualizado!' });

                    } catch (err) {
                        console.error(err);
                        Swal.fire('Erro', 'Falha ao atualizar status.', 'error');
                    }
                }
            };
        });
    }

    // ============================================================
    // 5. NAVEGAÇÃO E MODERAÇÃO DE POSTS
    // ============================================================
    function setupNavigation() {
        const links = document.querySelectorAll('.nav-links li a');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('data-target');
                if(!targetId) return; // Links externos

                e.preventDefault();
                // Reset ativo
                document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
                document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
                
                // Ativa novo
                document.getElementById(targetId).style.display = 'block';
                link.parentElement.classList.add('active');

                // Carregamento Lazy para Posts
                if(targetId === 'section-posts') loadAllPosts();
            });
        });
    }

    async function loadAllPosts() {
        const grid = document.getElementById('admin-feed-grid');
        grid.innerHTML = '<p style="text-align:center; padding:20px; color:#95a5a6"><i class="fa-solid fa-spinner fa-spin"></i> Carregando feed recente...</p>';
        
        try {
            const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20));
            const snap = await getDocs(q);
            
            grid.innerHTML = '';
            
            if(snap.empty) { 
                grid.innerHTML = '<p style="text-align:center; width:100%; color:#95a5a6">Nenhuma postagem encontrada.</p>'; 
                return; 
            }

            snap.forEach(d => {
                const post = d.data();
                const div = document.createElement('div');
                div.className = 'admin-post-card';
                
                // Tratamento seguro de imagem
                let imgSrc = '';
                if(post.images && Array.isArray(post.images) && post.images.length > 0) imgSrc = post.images[0];
                else if(post.image) imgSrc = post.image;

                const imgHTML = imgSrc ? `<img src="${imgSrc}" class="admin-post-img" loading="lazy">` : '';
                const textHTML = post.content ? `<p class="admin-post-text">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>` : '<p class="admin-post-text" style="color:#ccc; font-style:italic;">Sem texto</p>';

                div.innerHTML = `
                    <div class="admin-post-header">
                        <small><strong>${post.authorName || 'Anônimo'}</strong></small> 
                        <button class="btn-delete-post" data-id="${d.id}" title="Apagar Postagem"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    ${imgHTML}
                    ${textHTML}
                `;
                grid.appendChild(div);
            });

            // Listeners de Delete Post
             document.querySelectorAll('.btn-delete-post').forEach(btn => {
                btn.onclick = async (ev) => {
                    const btnEl = ev.currentTarget;
                    const pid = btnEl.dataset.id;

                    const confirm = await Swal.fire({
                        title: 'Apagar Post?', 
                        text: "Esta ação é irreversível.", 
                        icon: 'warning', 
                        showCancelButton: true, 
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Sim, Apagar'
                    });

                    if(confirm.isConfirmed) {
                        try {
                            await deleteDoc(doc(db, 'posts', pid));
                            btnEl.closest('.admin-post-card').remove();
                            
                            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                            Toast.fire({ icon: 'success', title: 'Post apagado.' });
                        } catch(err) {
                            console.error(err);
                            Swal.fire('Erro', 'Não foi possível apagar.', 'error');
                        }
                    }
                }
            });

        } catch(e) { 
            console.error(e);
            grid.innerHTML = `<p style="color:red; text-align:center;">Erro ao carregar feed: ${e.message}</p>`;
        }
    }

    // ============================================================
    // AUXILIARES
    // ============================================================
    function renderMyPreview() {
        const preview = document.getElementById('my-preview-area');
        if(preview && currentUser) preview.innerHTML = getRoleBadgeHTML(currentUser);
    }
    
    async function updateUserRole(uid, role, crn) {
        // Função auxiliar de update no Firestore
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { 
            role: role, 
            crn: crn || null 
        });
    }
});