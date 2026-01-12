/* ARQUIVO: perfil/js/index.js */

import { db, auth } from '../../firebase-config.js'; 
import { 
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, 
    collection, query, where, orderBy, limit, getDocs, 
    serverTimestamp, arrayUnion, arrayRemove, increment 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { AuthService } from './services/authService.js';
import { renderCommentItem } from './utils/dom.js';
import { getRoleBadgeHTML } from '../../sistema-cargos/cargos.js';

const OWNER_UID = "1Sfw2sVb7RVuKqCsNs2PUy8pIs33"; 

document.addEventListener('DOMContentLoaded', () => {
    
    const authService = new AuthService();

    let myOriginalData = null;
    let currentProfileUid = null;
    let currentOpenPostId = null;
    let replyTarget = null;
    let commentImageBase64 = null;
    let tempProfileImage = null; 

    // Elementos DOM
    const els = {
        username: document.getElementById('display-username'),
        realname: document.getElementById('display-realname'),
        bio: document.getElementById('display-bio'),
        picMain: document.getElementById('profile-pic-main'),
        picNav: document.getElementById('nav-avatar-img'),
        picMainContainer: document.querySelector('.journey-avatar-container'),
        counts: { posts: document.getElementById('count-posts'), followers: document.getElementById('count-followers'), following: document.getElementById('count-following') },
        statFollowers: document.getElementById('btn-view-followers'),
        statFollowing: document.getElementById('btn-view-following'),
        feedContainer: document.getElementById('feed-container'),
        emptyState: document.getElementById('empty-state-timeline'),
        modal: document.getElementById('modal-post-detail'),
        leftContent: document.getElementById('inst-left-content'),
        commentsList: document.getElementById('inst-comments-list'),
        authorName: document.getElementById('inst-author-name'),
        authorPhoto: document.getElementById('inst-author-photo'),
        likesCount: document.getElementById('inst-likes-number'),
        btnCloseDetail: document.getElementById('btn-close-post-detail'),
        inputComment: document.getElementById('inst-comment-input'),
        btnSend: document.getElementById('inst-btn-send'),
        mainLikeBtn: document.getElementById('inst-main-like-btn'),
        btnToggleEmoji: document.getElementById('btn-toggle-emoji'),
        emojiContainer: document.getElementById('inst-emoji-picker-container'),
        btnGallery: document.getElementById('btn-comment-gallery'),
        inputGallery: document.getElementById('input-comment-file'),
        imgPreviewContainer: document.getElementById('comment-image-preview-container'),
        imgPreview: document.getElementById('comment-img-preview'),
        btnRemoveImg: document.getElementById('btn-remove-comment-img'),
        modalEdit: document.getElementById('edit-modal'),
        btnEdit: document.getElementById('btn-open-edit'),
        btnSaveEdit: document.getElementById('btn-save-changes'),
        btnCamera: document.getElementById('btn-trigger-file'),
        inputGlobalUpload: document.getElementById('file-upload'), 
        imgPreviewEdit: document.getElementById('modal-avatar-preview'),
        modalList: document.getElementById('list-modal'),
        modalListTitle: document.getElementById('list-modal-title'),
        modalListBody: document.getElementById('list-modal-body'),
        btnCloseList: document.getElementById('btn-close-list'),
        modalPost: document.getElementById('modal-new-post'),
        btnFab: document.getElementById('btn-fab-post'),
        btnSubmitPost: document.getElementById('btn-submit-post'),
        btnSair: document.getElementById('btn-sair-perfil') 
    };

    authService.monitorAuth(async (user) => {
        if (user) {
            try {
                const docSnap = await getDoc(doc(db, 'users', user.uid));
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    if (userData.isBanned) { await authService.logout(); window.location.href = '../login/index.html'; return; }
                    currentProfileUid = user.uid;
                    myOriginalData = userData;
                    updateHeaderUI(userData);
                    loadFeed(user.uid);
                }
            } catch (err) { console.error("Erro perfil:", err); }
        } else { window.location.href = '../login/index.html'; }
    });

    function isMasterUser(user) { return (user.role || user.authorRole) === 'admin_master'; }

    function updateHeaderUI(data) {
        if (!data) return;
        const isOwner = currentProfileUid === OWNER_UID;
        const isMaster = isMasterUser(data);
        const adminLink = document.getElementById('nav-item-admin');
        if (adminLink) adminLink.style.display = (isMaster || isOwner) ? 'block' : 'none';

        if(els.realname) {
            const nameHTML = isMaster ? `<span class="master-text-effect">${data.realname}</span>` : data.realname;
            els.realname.innerHTML = `${nameHTML} ${getRoleBadgeHTML(data)}`;
        }
        
        if(els.picMainContainer) {
            const badge = document.querySelector('.phase-badge');
            if(isMaster) {
                els.picMainContainer.classList.add('master-avatar-frame');
                if(badge) { badge.classList.add('master-crown'); badge.innerHTML = '<i class="fa-solid fa-crown"></i>'; }
            } else {
                els.picMainContainer.classList.remove('master-avatar-frame');
                if(badge) { badge.classList.remove('master-crown'); badge.innerHTML = '<i class="fa-solid fa-seedling"></i>'; }
            }
        }

        if(els.username) els.username.textContent = "@" + (data.username || "usuario");
        if(els.bio) els.bio.textContent = data.bio || "";
        els.picMain.src = data.photo || "https://ui-avatars.com/api/?name=User";
        els.picNav.src = data.photo || "https://ui-avatars.com/api/?name=User";

        if(els.counts.posts) els.counts.posts.textContent = data.postsCount || 0;
        if(els.counts.followers) els.counts.followers.textContent = data.followers?.length || 0;
        if(els.counts.following) els.counts.following.textContent = data.following?.length || 0;

        if(els.statFollowers) els.statFollowers.onclick = () => openNetworkModal('Seguidores', data.followers || []);
        if(els.statFollowing) els.statFollowing.onclick = () => openNetworkModal('Seguindo', data.following || []);
    }

    async function openNetworkModal(title, uids) {
        if (!els.modalList) return;
        els.modalListTitle.textContent = title;
        els.modalListBody.innerHTML = '<div style="text-align:center; padding:40px;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i></div>';
        els.modalList.classList.add('open');

        if (!uids || uids.length === 0) {
            els.modalListBody.innerHTML = '<div class="empty-list-message" style="text-align:center; padding:40px; color:#888;">Ninguém por aqui ainda.</div>';
            return;
        }

        try {
            const snaps = await Promise.all(uids.slice(0, 50).map(id => getDoc(doc(db, 'users', id))));
            let html = '<div class="user-list-container" style="display:flex; flex-direction:column; gap:12px;">';
            snaps.forEach(s => {
                if(s.exists()) {
                    const u = s.data();
                    html += `
                    <div class="user-list-item" style="display:flex; align-items:center; gap:12px; padding:8px; border-bottom:1px solid #f0f0f0;">
                        <img src="${u.photo || 'https://ui-avatars.com/api/?name=U'}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">
                        <div class="uli-info">
                            <div class="uli-name" style="font-weight:700;">${u.realname} ${getRoleBadgeHTML(u)}</div>
                            <div class="uli-username" style="color:#888; font-size:0.85rem;">@${u.username}</div>
                        </div>
                    </div>`;
                }
            });
            els.modalListBody.innerHTML = html + '</div>';
        } catch (err) { els.modalListBody.innerHTML = '<p>Erro ao carregar.</p>'; }
    }

    if(els.btnSaveEdit) {
        els.btnSaveEdit.onclick = async () => {
            els.btnSaveEdit.disabled = true;
            try {
                const newData = {
                    realname: document.getElementById('input-realname').value,
                    username: document.getElementById('input-username').value.toLowerCase().replace(/\s+/g, ''),
                    bio: document.getElementById('input-bio').value,
                    link: document.getElementById('input-link').value
                };
                if(tempProfileImage) newData.photo = tempProfileImage;
                
                await setDoc(doc(db, 'users', currentProfileUid), newData, {merge:true});
                if(tempProfileImage) try { await authService.updateUserPhoto(tempProfileImage); } catch(e){}
                
                myOriginalData = {...myOriginalData, ...newData};
                updateHeaderUI(myOriginalData);
                els.modalEdit.classList.remove('open');
            } catch(e){ alert("Erro ao salvar."); }
            finally { els.btnSaveEdit.disabled = false; }
        };
    }

    async function loadFeed(uid) {
        if (!els.feedContainer) return;
        els.feedContainer.innerHTML = '';
        const q = query(collection(db, 'posts'), where('authorId', '==', uid), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            if (els.emptyState) els.emptyState.style.display = 'block';
            return;
        }
        if (els.emptyState) els.emptyState.style.display = 'none';

        snapshot.forEach(docSnap => {
            const post = docSnap.data();
            const div = document.createElement('div');
            div.id = `grid-post-${docSnap.id}`;
            let cls = 'gallery-item';
            if (isMasterUser({role: post.authorRole})) cls += ' master-post-border';
            else if (post.authorRole === 'nutri') cls += ' verified-post-border';
            div.className = cls;
            
            let html = '';
            if(post.images && post.images.length > 0) html = `<img src="${post.images[0]}" class="gallery-image">`;
            else if(post.image) html = `<img src="${post.image}" class="gallery-image">`;
            else html = `<div class="gallery-text-only"><p>${post.content.substring(0,60)}...</p></div>`;
            
            div.innerHTML = `${html}<div class="gallery-overlay"><i class="fa-solid fa-heart"></i> ${post.likes ? post.likes.length : 0}</div>`;
            div.onclick = () => openPostModal(docSnap.id, post);
            els.feedContainer.appendChild(div);
        });
    }

    async function openPostModal(postId, postData) {
        if (!els.modal) return;
        currentOpenPostId = postId;
        replyTarget = null;
        
        els.modal.classList.add('open');
        els.inputComment.value = '';
        if(els.emojiContainer) els.emojiContainer.classList.remove('show-picker');
        if(els.imgPreviewContainer) els.imgPreviewContainer.classList.add('hidden');

        if (postData.images && postData.images.length > 0) els.leftContent.innerHTML = `<img src="${postData.images[0]}" class="inst-post-img">`;
        else if (postData.image) els.leftContent.innerHTML = `<img src="${postData.image}" class="inst-post-img">`;
        else els.leftContent.innerHTML = `<div style="padding:40px; text-align:center;">${postData.content}</div>`;

        els.authorName.innerHTML = `${postData.authorName} ${getRoleBadgeHTML({role:postData.authorRole, crn:postData.authorCRN})}`;
        els.authorPhoto.src = postData.authorPhoto || "https://ui-avatars.com/api/?name=User";
        
        updateMainLikeButton(postData.likes);
        els.commentsList.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Carregando...</p>';
        
        await loadComments(postId);
    }

    // --- CORREÇÃO: Lógica de Comentários com Sub-coleções ---
    async function loadComments(postId) {
        // 1. Busca os comentários pais
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'asc'));
        const snap = await getDocs(q);
        
        els.commentsList.innerHTML = '';
        if (snap.empty) {
            els.commentsList.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">Seja o primeiro a comentar.</div>';
            return;
        }

        // 2. Busca as respostas (replies) dentro de cada comentário
        // Isso alinha o Perfil com a estrutura da Comunidade
        const comments = await Promise.all(snap.docs.map(async (docSnap) => {
            const commentData = docSnap.data();
            const repliesRef = collection(db, 'posts', postId, 'comments', docSnap.id, 'replies');
            const repliesQ = query(repliesRef, orderBy('timestamp', 'asc'));
            const repliesSnap = await getDocs(repliesQ);
            const replies = repliesSnap.docs.map(r => ({ id: r.id, ...r.data() }));
            
            return {
                id: docSnap.id,
                ...commentData,
                replies: replies 
            };
        }));

        // Renderiza
        const callbacks = {
            onLike: (cid, liked) => toggleCommentLike(postId, cid, currentProfileUid, liked).then(() => refreshComments()),
            onReply: (cid, name) => { 
                replyTarget = {id:cid}; 
                els.inputComment.placeholder = `Respondendo a ${name}...`; 
                els.inputComment.focus(); 
            },
            onDelete: async (cid) => {
                if(confirm("Apagar comentário?")) {
                    await deleteDoc(doc(db, 'posts', postId, 'comments', cid));
                    await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(-1) });
                    loadComments(postId);
                }
            }
        };
        
        comments.forEach(c => {
            els.commentsList.appendChild(renderCommentItem(c, currentProfileUid, callbacks, c.replies));
        });
    }

    async function refreshComments() {
        if (currentOpenPostId) await loadComments(currentOpenPostId);
    }

    async function toggleCommentLike(postId, commentId, uid, isLiked) {
        const ref = doc(db, 'posts', postId, 'comments', commentId);
        if (isLiked) await updateDoc(ref, { likes: arrayRemove(uid) });
        else await updateDoc(ref, { likes: arrayUnion(uid) });
    }

    async function addComment(postId, user, text, image) {
        const comment = {
            authorId: user.uid,
            authorName: user.displayName,
            authorPhoto: user.photoURL,
            content: text,
            image: image || null,
            timestamp: serverTimestamp(),
            likes: [],
            // Replies não precisa ser inicializado como array vazio aqui se usarmos subcoleção
        };
        await addDoc(collection(db, 'posts', postId, 'comments'), comment);
        await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
    }

    async function addReply(postId, commentId, user, text, image) {
        const reply = {
            authorId: user.uid,
            authorName: user.displayName,
            authorPhoto: user.photoURL,
            content: text,
            image: image || null,
            timestamp: serverTimestamp(),
            likes: []
        };
        
        // CORREÇÃO: Salva na SUB-COLEÇÃO 'replies', não num array
        const repliesRef = collection(db, 'posts', postId, 'comments', commentId, 'replies');
        await addDoc(repliesRef, reply);
        
        // CORREÇÃO: Incrementa o contador GLOBAL do Post (para a Comunidade ver)
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { commentsCount: increment(1) });
    }

    if(els.btnSend) {
        els.btnSend.onclick = async () => {
            const txt = els.inputComment.value.trim();
            if(!txt && !commentImageBase64) return;
            els.btnSend.style.opacity = "0.5";
            
            const user = { 
                uid: authService.getCurrentUser().uid, 
                displayName: myOriginalData.realname, 
                photoURL: myOriginalData.photo 
            };
            
            try {
                if (replyTarget) {
                    await addReply(currentOpenPostId, replyTarget.id, user, txt, commentImageBase64);
                } else {
                    await addComment(currentOpenPostId, user, txt, commentImageBase64);
                }
                
                els.inputComment.value = ''; els.inputComment.placeholder = 'Adicione um comentário...';
                replyTarget = null; commentImageBase64 = null;
                els.imgPreviewContainer.classList.add('hidden');
                els.emojiContainer.classList.remove('show-picker');
                
                await loadComments(currentOpenPostId);
                
            } catch (e) { console.error(e); alert("Erro ao enviar."); }
            finally { els.btnSend.style.opacity = "1"; }
        };
    }

    function compressImage(file, w, q) { return new Promise(resolve => { const r = new FileReader(); r.onload = e => { const img = new Image(); img.onload = () => { const cvs = document.createElement('canvas'); let nw = img.width, nh = img.height; if(nw > w) { nh = Math.round(nh * (w/nw)); nw = w; } cvs.width = nw; cvs.height = nh; cvs.getContext('2d').drawImage(img,0,0,nw,nh); resolve(cvs.toDataURL('image/jpeg', q)); }; img.src = e.target.result; }; r.readAsDataURL(file); }); }
    
    function updateMainLikeButton(likes) { 
        const arr = likes||[]; 
        els.likesCount.textContent = `${arr.length} curtidas`; 
        if(arr.includes(currentProfileUid)) { els.mainLikeBtn.innerHTML='<i class="fa-solid fa-heart"></i>'; els.mainLikeBtn.classList.add('liked'); } 
        else { els.mainLikeBtn.innerHTML='<i class="fa-regular fa-heart"></i>'; els.mainLikeBtn.classList.remove('liked'); } 
        els.mainLikeBtn.onclick=()=>toggleMainLike(arr); 
    }
    
    async function toggleMainLike(likes) { 
        const liked = likes.includes(currentProfileUid); 
        const ref = doc(db, 'posts', currentOpenPostId); 
        if(liked) await updateDoc(ref, {likes: arrayRemove(currentProfileUid)}); 
        else await updateDoc(ref, {likes: arrayUnion(currentProfileUid)}); 
        const s = await getDoc(ref); 
        updateMainLikeButton(s.data().likes); 
    }

    if(els.btnEdit) els.btnEdit.onclick = () => { if(myOriginalData) els.modalEdit.classList.add('open'); };
    if(els.btnCamera) els.btnCamera.onclick = (e) => { e.preventDefault(); els.inputGlobalUpload.click(); };
    if(els.inputGlobalUpload) els.inputGlobalUpload.onchange = async (e) => { if(e.target.files[0]) { const b64 = await compressImage(e.target.files[0], 800, 0.7); els.imgPreviewEdit.src = b64; tempProfileImage = b64; } };
    if(els.btnSair) els.btnSair.onclick = async (e) => { e.preventDefault(); if(confirm("Deseja sair?")) { await authService.logout(); window.location.href='../login/index.html'; } };
    if(els.btnToggleEmoji) els.btnToggleEmoji.onclick = (e) => { e.stopPropagation(); els.emojiContainer.classList.toggle('show-picker'); };
    document.addEventListener('click', e => { if(els.emojiContainer && !els.emojiContainer.contains(e.target) && e.target !== els.btnToggleEmoji) els.emojiContainer.classList.remove('show-picker'); });
    if(els.btnCloseDetail) els.btnCloseDetail.onclick = () => els.modal.classList.remove('open');
    document.querySelectorAll('.btn-close').forEach(b => b.onclick = (e) => e.target.closest('.modal-overlay').classList.remove('open'));
});