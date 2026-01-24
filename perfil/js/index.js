/* ARQUIVO: perfil/js/index.js */

import { db, auth } from '../../firebase-config.js'; 
import { 
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, 
    collection, query, where, orderBy, limit, getDocs, 
    serverTimestamp, arrayUnion, arrayRemove, increment 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { AuthService } from './services/authService.js';
import { renderCommentItem } from './utils/dom.js';
import { getRoleBadgeHTML, isMasterUser } from '../../sistema-cargos/cargos.js';

const COMMON_EMOJIS = ["😂","❤️","😍","🔥","👏","🙌","😭","👀","✨","💯","🥰","🤣","🥺","🙏","😎","✅","🚀","🤔","💀","🤡","🤮","🥳","🤯","🤬","😡","👋","💪","👍","👎"];

document.addEventListener('DOMContentLoaded', () => {
    
    // Inicialização de Serviços
    const authService = new AuthService();
    
    // Estado Local
    let myOriginalData = null;
    let currentProfileUid = null;
    let currentOpenPostId = null;
    let currentPostAuthorId = null; 
    let replyTarget = null;
    let commentImageBase64 = null;
    let tempProfileImage = null;

    // Cache de Elementos DOM
    const els = {
        feedContainer: document.getElementById('feed-container'),
        modal: document.getElementById('modal-post-detail'),
        
        // Header Info
        username: document.getElementById('display-username'),
        realname: document.getElementById('display-realname'),
        bio: document.getElementById('display-bio'),
        bioBlock: document.querySelector('.journey-bio-block'),
        picMain: document.getElementById('profile-pic-main'),
        link: document.getElementById('display-link'),
        
        // Sidebar & Mobile
        navAvatar: document.getElementById('nav-avatar-img'),
        navAvatarMobile: document.getElementById('nav-avatar-img-mobile'),
        mobileMenuAvatar: document.getElementById('mobile-menu-avatar'),
        mobileMenuName: document.getElementById('mobile-menu-name'),
        btnMobileMenu: document.getElementById('btn-mobile-menu'),
        mobileOverlay: document.getElementById('mobile-menu-overlay'),
        btnCloseMobile: document.getElementById('btn-close-mobile-menu'),
        
        // LOGOUT BUTTONS
        btnSairMobile: document.getElementById('btn-sair-mobile'),
        btnSairSidebar: document.getElementById('btn-sair-perfil'),
        
        // NOVO MODAL DE LOGOUT
        modalLogoutLuxury: document.getElementById('modal-logout-luxury'),
        btnCancelLogout: document.getElementById('btn-cancel-logout'),
        btnConfirmLogout: document.getElementById('btn-confirm-logout'),

        adminLink: document.getElementById('nav-item-admin'),

        // Stats
        counts: { 
            posts: document.getElementById('count-posts'), 
            followers: document.getElementById('count-followers'), 
            following: document.getElementById('count-following') 
        },
        
        // Edit & Others
        emptyState: document.getElementById('empty-state-timeline'),
        modalEdit: document.getElementById('edit-modal'),
        btnEdit: document.getElementById('btn-open-edit'),
        btnSaveEdit: document.getElementById('btn-save-changes'),
        btnCamera: document.getElementById('btn-trigger-file'),
        inputGlobalUpload: document.getElementById('file-upload'), 
        imgPreviewEdit: document.getElementById('modal-avatar-preview')
    };

    // Mobile Menu Listeners
    if(els.btnMobileMenu) els.btnMobileMenu.onclick = () => els.mobileOverlay.classList.add('open');
    if(els.btnCloseMobile) els.btnCloseMobile.onclick = () => els.mobileOverlay.classList.remove('open');
    if(els.mobileOverlay) els.mobileOverlay.onclick = (e) => { if(e.target === els.mobileOverlay) els.mobileOverlay.classList.remove('open'); };
    
    // =========================================================================
    // 🔥 LÓGICA DO NOVO MODAL DE LOGOUT 🔥
    // =========================================================================
    const openLogoutModal = (e) => {
        if(e) e.preventDefault();
        // Abre o modal de luxo
        els.modalLogoutLuxury.style.display = 'flex'; // Garante display flex antes da anim
        // Pequeno delay para permitir a transição CSS funcionar
        setTimeout(() => {
            els.modalLogoutLuxury.classList.add('active');
        }, 10);
    };

    const closeLogoutModal = () => {
        els.modalLogoutLuxury.classList.remove('active');
        setTimeout(() => {
            els.modalLogoutLuxury.style.display = 'none';
        }, 400); // Espera a animação de saída terminar
    };

    const confirmLogout = async () => {
        const btnText = els.btnConfirmLogout.querySelector('span');
        const icon = els.btnConfirmLogout.querySelector('i');
        
        // Feedback Visual no Botão
        btnText.textContent = "Saindo...";
        icon.className = "fa-solid fa-circle-notch fa-spin";
        
        try {
            // Loader Global para transição suave
            if(window.GlobalLoader) window.GlobalLoader.show("Encerrando sessão...");
            
            // Delay estético para ver a animação
            setTimeout(async () => {
                await authService.logout();
                window.location.href = '../login/index.html';
            }, 800);
            
        } catch (error) { 
            console.error("Erro ao sair:", error);
            closeLogoutModal();
            if(window.GlobalLoader) window.GlobalLoader.hide();
        }
    };

    // Binds
    if(els.btnSairSidebar) els.btnSairSidebar.onclick = openLogoutModal;
    if(els.btnSairMobile) els.btnSairMobile.onclick = openLogoutModal;
    
    if(els.btnCancelLogout) els.btnCancelLogout.onclick = closeLogoutModal;
    if(els.btnConfirmLogout) els.btnConfirmLogout.onclick = confirmLogout;

    // Fechar ao clicar fora (no vidro)
    if(els.modalLogoutLuxury) {
        els.modalLogoutLuxury.onclick = (e) => {
            if(e.target === els.modalLogoutLuxury) closeLogoutModal();
        };
    }

    // =========================================================================
    // LÓGICA DE CARREGAMENTO SINCRONIZADA (PERFIL + FEED)
    // =========================================================================
    authService.monitorAuth(async (user) => {
        if (user) {
            if(window.GlobalLoader) window.GlobalLoader.show("Carregando Perfil...");

            try {
                currentProfileUid = user.uid;

                const [userDocSnap, feedSnap] = await Promise.all([
                    getDoc(doc(db, 'users', user.uid)),
                    getDocs(query(collection(db, 'posts'), where('authorId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50)))
                ]);

                if (userDocSnap.exists()) {
                    myOriginalData = userDocSnap.data();
                } else {
                    const fallback = { realname: user.displayName || "Usuário", username: "", email: user.email, role: "user", postsCount: 0 };
                    await setDoc(doc(db, 'users', user.uid), fallback);
                    myOriginalData = fallback;
                }
                updateHeaderUI(myOriginalData);
                renderFeed(feedSnap);

            } catch (err) {
                console.error("Erro crítico ao carregar:", err);
                alert("Ocorreu um erro ao carregar seus dados.");
            } finally {
                if(window.GlobalLoader) window.GlobalLoader.hide();
            }

        } else { 
            window.location.href = '../login/index.html'; 
        }
    });

    // ... [MANTIDO O RESTANTE DAS FUNÇÕES DE UI E FEED IGUAL AO ORIGINAL] ...
    // (As funções updateHeaderUI, renderFeed, openPostModal, loadComments etc permanecem inalteradas
    // pois a mudança solicitada foi apenas no modal de Logout)

    /**
     * Atualiza o cabeçalho e REMOVE os esqueletos de carregamento.
     */
     function updateHeaderUI(data) {
        if (!data) return;

        // Limpeza dos Skeletons (Remove classes de animação e larguras fixas)
        [els.realname, els.username, els.picMain].forEach(el => {
            if(el) {
                el.classList.remove('skeleton');
                el.style.width = ''; 
                el.style.height = '';
            }
        });

        const isMaster = isMasterUser(data);
        
        // Textos
        if(els.realname) els.realname.innerHTML = `${isMaster ? `<span class="master-text-effect">${data.realname}</span>` : data.realname} ${getRoleBadgeHTML(data)}`;
        if(els.username) els.username.innerText = `@${data.username}`;
        if(els.bio) els.bio.innerText = data.bio || "";
        
        // Toggle Bio (Esconde se vazio)
        if(els.bioBlock) els.bioBlock.style.display = data.bio ? 'block' : 'none';

        // Link
        if(els.link) {
            if (data.link) {
                els.link.style.display = 'inline-flex';
                let href = data.link.startsWith('http') ? data.link : `https://${data.link}`;
                els.link.href = href;
                els.link.innerHTML = `<i class="fa-solid fa-link"></i> ${data.link.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}`;
            } else { els.link.style.display = 'none'; }
        }

        // Fotos
        const photo = data.photo || "https://ui-avatars.com/api/?name=User";
        if(els.picMain) {
            els.picMain.src = photo;
            els.picMain.style.background = 'transparent'; // Remove fundo cinza do loader
        }
        if(els.navAvatar) els.navAvatar.src = photo;
        if(els.navAvatarMobile) els.navAvatarMobile.src = photo;
        if(els.mobileMenuAvatar) els.mobileMenuAvatar.src = photo;
        if(els.mobileMenuName) els.mobileMenuName.innerText = data.realname;

        // Moldura Master
        const badgeIcon = document.querySelector('.phase-badge');
        const avatarContainer = document.querySelector('.journey-avatar-container');
        if(avatarContainer) {
            if(isMaster) {
                avatarContainer.classList.add('master-avatar-frame');
                if(badgeIcon) { badgeIcon.className = 'phase-badge master-crown'; badgeIcon.innerHTML = '<i class="fa-solid fa-crown"></i>'; }
            } else {
                avatarContainer.classList.remove('master-avatar-frame');
                if(badgeIcon) { badgeIcon.className = 'phase-badge'; badgeIcon.innerHTML = '<i class="fa-solid fa-seedling"></i>'; }
            }
        }

        if(els.adminLink) els.adminLink.style.display = isMaster ? 'block' : 'none';
        
        // Contadores
        if(els.counts.posts) els.counts.posts.innerText = data.postsCount || 0;
        if(els.counts.followers) els.counts.followers.innerText = data.followers?.length || 0;
        if(els.counts.following) els.counts.following.innerText = data.following?.length || 0;
    }

    function renderFeed(snapshot) {
        if(!els.feedContainer) return;
        els.feedContainer.innerHTML = ''; 
        els.feedContainer.className = 'gallery-grid'; 

        if(snapshot.empty) { 
            if(els.emptyState) els.emptyState.style.display = 'block'; 
            return;
        }
        if(els.emptyState) els.emptyState.style.display = 'none';

        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const item = document.createElement('div');
            item.className = 'gallery-item fade-in';
            
            let contentHtml = '';
            if (post.images && post.images.length > 0) {
                contentHtml = `<img src="${post.images[0]}" class="gallery-image" loading="lazy">`;
                if(post.images.length > 1) contentHtml += `<div class="multi-image-icon"><i class="fa-solid fa-clone"></i></div>`;
            } else if (post.image) {
                contentHtml = `<img src="${post.image}" class="gallery-image" loading="lazy">`;
            } else {
                contentHtml = `<div class="gallery-text-only">${post.content?.substring(0,50)}...</div>`;
            }

            item.innerHTML = `${contentHtml}<div class="gallery-overlay"><span><i class="fa-solid fa-heart"></i> ${post.likes?.length || 0}</span></div>`;
            item.onclick = () => openPostModal(docSnap.id, post);
            els.feedContainer.appendChild(item);
        });
    }

    async function openPostModal(postId, postData) {
        if (!els.modal) return;
        currentOpenPostId = postId;
        currentPostAuthorId = postData.authorId; 
        replyTarget = null;
        commentImageBase64 = null;

        const isMe = postData.authorId === currentProfileUid;
        const displayPhoto = isMe ? myOriginalData.photo : (postData.authorPhoto || "https://ui-avatars.com/api/?name=User");
        const badge = getRoleBadgeHTML({ role: postData.authorRole });
        const nameHTML = isMasterUser({ role: postData.authorRole }) ? `<span class="master-text-effect">${postData.authorName}</span>` : postData.authorName;

        let mediaLeft = '';
        if (postData.images && postData.images.length > 0) mediaLeft = `<img src="${postData.images[0]}" class="inst-post-img">`;
        else if (postData.image) mediaLeft = `<img src="${postData.image}" class="inst-post-img">`;
        else mediaLeft = `<div style="color:white;padding:40px;text-align:center;">${postData.content}</div>`;

        const emojisHtml = COMMON_EMOJIS.map(e => `<div class="emoji-item">${e}</div>`).join('');

        els.modal.innerHTML = `
            <button class="btn-close-modal-inst"><i class="fa-solid fa-xmark"></i></button>
            <div class="modal-instagram-container">
                <div class="inst-left-side">${mediaLeft}</div>
                <div class="inst-right-side">
                    <div class="inst-header">
                        <div class="inst-header-left">
                            <img src="${displayPhoto}" class="inst-avatar">
                            <div class="inst-meta"><h4>${nameHTML} ${badge}</h4></div>
                        </div>
                        <button class="btn-options-modal"><i class="fa-solid fa-ellipsis"></i></button>
                    </div>
                    <div class="inst-comments-area" id="dynamic-comments"><p style="text-align:center;padding:20px;color:#999;">Carregando...</p></div>
                    <div class="inst-footer-section">
                        <div class="inst-action-icons">
                            <div class="inst-icons-left">
                                <button class="inst-icon-btn" id="modal-like-btn"><i class="fa-regular fa-heart"></i></button>
                                <button class="inst-icon-btn" onclick="document.getElementById('inp-comment').focus()"><i class="fa-regular fa-comment"></i></button>
                                <button class="inst-icon-btn"><i class="fa-regular fa-paper-plane"></i></button>
                            </div>
                            <button class="inst-icon-btn"><i class="fa-regular fa-bookmark"></i></button>
                        </div>
                        <p class="inst-likes-count"><span id="lbl-likes">${postData.likes?.length||0}</span> curtidas</p>
                        <span class="inst-date">${timeAgo(postData.timestamp)}</span>
                        <div class="inst-input-wrapper">
                            <button class="inst-emoji-btn" id="btn-toggle-emoji"><i class="fa-regular fa-face-smile"></i></button>
                            <textarea id="inp-comment" placeholder="Adicione um comentário..." rows="1"></textarea>
                            <button class="inst-gallery-btn" id="btn-trigger-comment-img"><i class="fa-regular fa-image"></i></button>
                            <input type="file" id="inp-file-comment" hidden accept="image/*">
                            <button class="inst-post-btn" id="btn-send-comment" disabled>Publicar</button>
                            <div class="emoji-picker-container hidden" id="emoji-picker">${emojisHtml}</div>
                        </div>
                        <div id="comment-img-preview" class="comment-file-preview hidden"></div>
                    </div>
                </div>
            </div>
        `;

        els.modal.classList.add('open');
        els.modal.querySelector('.btn-close-modal-inst').onclick = () => els.modal.classList.remove('open');
        els.modal.onclick = (e) => { if (e.target === els.modal) els.modal.classList.remove('open'); };

        const inp = document.getElementById('inp-comment');
        const sendBtn = document.getElementById('btn-send-comment');
        const emojiBtn = document.getElementById('btn-toggle-emoji');
        const emojiPicker = document.getElementById('emoji-picker');
        const galleryBtn = document.getElementById('btn-trigger-comment-img');
        const fileInp = document.getElementById('inp-file-comment');
        const previewBox = document.getElementById('comment-img-preview');

        emojiBtn.onclick = (e) => { e.stopPropagation(); emojiPicker.classList.toggle('hidden'); };
        document.querySelectorAll('.emoji-item').forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                const start = inp.selectionStart;
                const end = inp.selectionEnd;
                inp.value = inp.value.substring(0, start) + item.innerText + inp.value.substring(end);
                inp.selectionStart = inp.selectionEnd = start + item.innerText.length;
                checkInput(); inp.focus();
            };
        });
        document.addEventListener('click', (e) => { if(!emojiPicker.contains(e.target) && e.target !== emojiBtn) emojiPicker.classList.add('hidden'); });

        galleryBtn.onclick = () => fileInp.click();
        fileInp.onchange = async (e) => {
            if(e.target.files[0]) {
                commentImageBase64 = await compressImage(e.target.files[0], 800, 0.7);
                previewBox.innerHTML = `<img src="${commentImageBase64}"><button class="btn-remove-preview">X</button>`;
                previewBox.classList.remove('hidden');
                previewBox.querySelector('.btn-remove-preview').onclick = () => { commentImageBase64 = null; previewBox.classList.add('hidden'); checkInput(); };
                checkInput();
            }
        };

        function checkInput() {
            if (inp.value.trim().length > 0 || commentImageBase64) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
            else { sendBtn.disabled = true; sendBtn.style.opacity = '0.4'; }
            inp.style.height = '18px'; inp.style.height = (inp.scrollHeight) + 'px';
        }
        inp.addEventListener('input', checkInput);

        sendBtn.onclick = async () => {
            const txt = inp.value.trim();
            if(!txt && !commentImageBase64) return;
            const user = { uid: currentProfileUid, displayName: myOriginalData.realname, photoURL: myOriginalData.photo };
            try {
                if (replyTarget) await addReply(postId, replyTarget.id, user, txt, commentImageBase64);
                else await addComment(postId, user, txt, commentImageBase64);
                inp.value = ''; commentImageBase64 = null; previewBox.classList.add('hidden'); replyTarget = null; checkInput();
                await loadComments(postId, document.getElementById('dynamic-comments'));
            } catch(e) { alert("Erro ao enviar."); }
        };

        const likeBtn = document.getElementById('modal-like-btn');
        const updateLike = (arr) => {
            if(arr.includes(currentProfileUid)) { likeBtn.classList.add('liked'); likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>'; }
            else { likeBtn.classList.remove('liked'); likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; }
            document.getElementById('lbl-likes').innerText = `${arr.length} curtidas`;
        };
        updateLike(postData.likes||[]);

        likeBtn.onclick = async () => {
            const ref = doc(db, 'posts', postId);
            const nowLiked = !likeBtn.classList.contains('liked');
            if(nowLiked) await updateDoc(ref, { likes: arrayUnion(currentProfileUid) });
            else await updateDoc(ref, { likes: arrayRemove(currentProfileUid) });
            const s = await getDoc(ref); updateLike(s.data().likes);
        };

        await loadComments(postId, document.getElementById('dynamic-comments'));
    }

    async function loadComments(postId, container) {
        if(!container) return;
        const q = query(collection(db, 'posts', postId, 'comments'), orderBy('timestamp', 'asc'));
        const snap = await getDocs(q);
        container.innerHTML = '';
        if(snap.empty) { container.innerHTML = '<p style="text-align:center;padding:20px;color:#999;">Sem comentários.</p>'; return; }

        const authorIds = new Set();
        const commentsRaw = [];
        
        for (const docSnap of snap.docs) {
            const cData = docSnap.data();
            authorIds.add(cData.authorId);
            const rSnap = await getDocs(query(collection(db, 'posts', postId, 'comments', docSnap.id, 'replies'), orderBy('timestamp', 'asc')));
            const replies = rSnap.docs.map(r => { const rd = r.data(); authorIds.add(rd.authorId); return { id: r.id, ...rd }; });
            commentsRaw.push({ id: docSnap.id, ...cData, replies });
        }

        const userPhotosMap = {};
        if(myOriginalData) userPhotosMap[currentProfileUid] = myOriginalData.photo;
        
        await Promise.all(Array.from(authorIds).map(async (uid) => {
            if(userPhotosMap[uid]) return;
            try { const u = await getDoc(doc(db, 'users', uid)); if(u.exists()) userPhotosMap[uid] = u.data().photo; } catch(e){}
        }));

        const callbacks = {
            onLike: (cid, isLiking) => toggleCommentLike(postId, cid, currentProfileUid, isLiking),
            onReply: (cid, name) => { replyTarget = {id:cid}; const i = document.getElementById('inp-comment'); i.value = `@${name} `; i.focus(); },
            onDelete: async (cid) => { if(confirm("Excluir?")) { await deleteDoc(doc(db, 'posts', postId, 'comments', cid)); await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) }); loadComments(postId, container); } }
        };

        commentsRaw.forEach(c => {
            if(userPhotosMap[c.authorId]) c.authorPhoto = userPhotosMap[c.authorId];
            c.replies.forEach(r => { if(userPhotosMap[r.authorId]) r.authorPhoto = userPhotosMap[r.authorId]; });
            container.appendChild(renderCommentItem(c, currentProfileUid, null, currentPostAuthorId, callbacks, c.replies));
        });
    }

    async function toggleCommentLike(postId, commentId, userId, isLiking) {
        const ref = doc(db, 'posts', postId, 'comments', commentId);
        if(isLiking) await updateDoc(ref, { likes: arrayUnion(userId) });
        else await updateDoc(ref, { likes: arrayRemove(userId) });
    }

    async function addComment(postId, user, text, image) {
        await addDoc(collection(db, 'posts', postId, 'comments'), { authorId: user.uid, authorName: user.displayName, authorPhoto: user.photoURL, text: text, image: image||null, timestamp: serverTimestamp(), likes: [] });
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    }
    
    async function addReply(postId, commentId, user, text, image) {
        await addDoc(collection(db, 'posts', postId, 'comments', commentId, 'replies'), { authorId: user.uid, authorName: user.displayName, authorPhoto: user.photoURL, text: text, image: image||null, timestamp: serverTimestamp(), likes: [] });
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    }

    document.addEventListener('delete-reply', async (e) => {
        if(!confirm("Excluir resposta?")) return;
        try { await deleteDoc(doc(db, 'posts', currentOpenPostId, 'comments', e.detail.commentId, 'replies', e.detail.replyId)); await updateDoc(doc(db, 'posts', currentOpenPostId), { commentsCount: increment(-1) }); loadComments(currentOpenPostId, document.getElementById('dynamic-comments')); } catch(err) {}
    });

    function timeAgo(timestamp) {
        if (!timestamp) return 'AGORA';
        try {
            const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const diff = (Date.now() - d) / 1000;
            if(diff < 60) return 'HÁ ALGUNS SEGUNDOS';
            if(diff < 3600) return `HÁ ${Math.floor(diff/60)} MINUTOS`;
            if(diff < 86400) return `HÁ ${Math.floor(diff/3600)} HORAS`;
            const days = Math.floor(diff/86400);
            if (days < 7) return `HÁ ${days} DIAS`;
            const weeks = Math.floor(days/7);
            return `HÁ ${weeks} SEMANA${weeks > 1 ? 'S' : ''}`;
        } catch(e) { return ''; }
    }

    function compressImage(file, w, q) { return new Promise(resolve => { const r = new FileReader(); r.onload=e=>{ const i=new Image(); i.onload=()=>{ const c=document.createElement('canvas'); let nw=i.width, nh=i.height; if(nw>w){nh=Math.round(nh*(w/nw)); nw=w;} c.width=nw; c.height=nh; c.getContext('2d').drawImage(i,0,0,nw,nh); resolve(c.toDataURL('image/jpeg',q)); }; i.src=e.target.result; }; r.readAsDataURL(file); }); }

    // =========================================================================
    // EDIÇÃO DE PERFIL
    // =========================================================================
    if(els.btnEdit) els.btnEdit.onclick = () => { 
        document.getElementById('input-realname').value = myOriginalData.realname; 
        document.getElementById('input-username').value = myOriginalData.username; 
        document.getElementById('input-bio').value = myOriginalData.bio || ""; 
        document.getElementById('input-link').value = myOriginalData.link || ""; 
        if(els.imgPreviewEdit) els.imgPreviewEdit.src = myOriginalData.photo; 
        tempProfileImage = null; 
        els.modalEdit.classList.add('open'); 
    };

    if(els.btnSaveEdit) els.btnSaveEdit.onclick = async () => { 
        // Feedback de salvamento com Loader Global
        if(window.GlobalLoader) window.GlobalLoader.show("Salvando Perfil...");
        
        try {
            const newData = { 
                realname: document.getElementById('input-realname').value, 
                username: document.getElementById('input-username').value, 
                bio: document.getElementById('input-bio').value, 
                link: document.getElementById('input-link').value 
            }; 
            if(tempProfileImage) newData.photo = tempProfileImage; 
            
            await updateDoc(doc(db, 'users', currentProfileUid), newData, {merge:true}); 
            window.location.reload(); 
        } catch(e) {
            console.error(e);
            alert("Erro ao salvar.");
            if(window.GlobalLoader) window.GlobalLoader.hide();
        }
    };

    if(els.btnCamera) els.btnCamera.onclick = () => { els.inputGlobalUpload.click(); };
    if(els.inputGlobalUpload) els.inputGlobalUpload.onchange = async (e) => { 
        if(e.target.files[0]) { 
            const b64 = await compressImage(e.target.files[0], 800, 0.7); 
            els.imgPreviewEdit.src = b64; 
            tempProfileImage = b64; 
        } 
    };

    document.querySelectorAll('.btn-close').forEach(b => b.onclick = (e) => e.target.closest('.modal-overlay').classList.remove('open'));
});