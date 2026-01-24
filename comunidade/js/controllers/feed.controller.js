/* ARQUIVO: comunidade/js/controllers/feed.controller.js */
import { PostService } from '../services/post.service.js';
import { InteractionService } from '../services/interaction.service.js';
import { escapeHtml, getTimeAgo } from '../utils/formatters.js';
import { auth, onAuthStateChanged, db, getDoc, doc } from '../config/firebase.proxy.js';

export class FeedController {
    constructor() {
        this.postService = new PostService();
        this.interactionService = new InteractionService();
        this.container = document.getElementById('feed-container');
        this.currentUser = null;
        this.unsubscribeFeed = null; 
    }

    async init() {
        onAuthStateChanged(auth, user => {
            this.currentUser = user;
            this.startRealTimeFeed();
        });

        if (this.container) {
            this.container.addEventListener('click', (e) => this.handleInteractions(e));
        }

        // --- NOVO: OUVINTE PARA EXCLUSÃO VIA MODAL LUXURY ---
        document.addEventListener('request-delete-post', async (e) => {
            const { postId } = e.detail;
            if(postId) {
                await this.performDelete(postId);
            }
        });
    }

    startRealTimeFeed() {
        if (this.unsubscribeFeed) this.unsubscribeFeed();
        this.renderSkeleton();

        this.unsubscribeFeed = this.postService.subscribeToFeed(50, async (posts) => {
            await this.renderPosts(posts);
        });
    }

    renderSkeleton() {
        const s = `<article class="feed-post skeleton-card"><div class="fp-header"><div class="skeleton sk-avatar"></div><div class="skeleton sk-line w-60"></div></div><div class="skeleton sk-content-line"></div><div class="skeleton sk-content-line w-80"></div></article>`;
        this.container.innerHTML = s.repeat(2);
    }

    async renderPosts(posts) {
        if (!posts || posts.length === 0) {
            this.container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#ccc;"><p>Nada aqui ainda.</p></div>`;
            return;
        }

        const authorIds = new Set(posts.map(p => p.authorId));
        const photosMap = {};

        await Promise.all(Array.from(authorIds).map(async (uid) => {
            try {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) photosMap[uid] = uDoc.data().photo;
            } catch(e) {}
        }));

        posts.forEach(p => {
            if (photosMap[p.authorId]) p.authorPhoto = photosMap[p.authorId];
        });

        this.container.innerHTML = posts.map(p => this.buildPostHTML(p)).join('');
    }

    buildPostHTML(post) {
        const uid = this.currentUser ? this.currentUser.uid : null;
        const isLiked = post.likes && post.likes.includes(uid);
        const commentCount = post.commentsCount !== undefined ? post.commentsCount : 0;

        let mediaHtml = '';
        if (post.images && post.images.length > 0) mediaHtml = `<img src="${post.images[0]}" class="fp-image" data-action="comment" data-id="${post.id}">`;
        else if (post.image) mediaHtml = `<img src="${post.image}" class="fp-image" data-action="comment" data-id="${post.id}">`;

        const safeContent = encodeURIComponent(post.content || "");

        return `
            <article class="feed-post" id="post-${post.id}">
                <div class="fp-header">
                    <div class="fp-user-info">
                        <img src="${post.authorPhoto || 'https://ui-avatars.com/api/?name=User'}" class="fp-avatar">
                        <div class="fp-info"><h4>${escapeHtml(post.authorName)}</h4><span>${getTimeAgo(post.timestamp)}</span></div>
                    </div>
                    <button class="fp-options-btn" data-action="options" data-id="${post.id}" data-author="${post.authorId}" data-content="${safeContent}"><i class="fa-solid fa-ellipsis"></i></button>
                </div>
                <div class="fp-content" id="content-${post.id}">${escapeHtml(post.content)}</div>
                ${mediaHtml}
                <div class="fp-actions">
                    <button class="fp-action-btn ${isLiked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
                        <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i> <span class="like-count">${post.likes ? post.likes.length : 0}</span>
                    </button>
                    <button class="fp-action-btn" data-action="comment" data-id="${post.id}">
                        <i class="fa-regular fa-comment"></i> <span>${commentCount}</span>
                    </button>
                </div>
            </article>`;
    }

    async handleInteractions(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const postId = target.dataset.id;

        if (action === 'like') this.handleLike(postId, target);
        else if (action === 'comment') document.dispatchEvent(new CustomEvent('open-post-detail', { detail: postId }));
        else if (action === 'options') {
            const authorId = target.dataset.author;
            const content = decodeURIComponent(target.dataset.content);
            this.handleOptions(postId, authorId, content);
        }
    }

    async handleLike(postId, btn) {
        if (!this.currentUser) return Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Faça login para curtir', showConfirmButton: false, timer: 1500 });
        
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        const countSpan = btn.querySelector('.like-count');
        let currentCount = parseInt(countSpan.innerText) || 0;

        if (btn.classList.contains('liked')) {
            icon.className = 'fa-solid fa-heart';
            currentCount++;
        } else {
            icon.className = 'fa-regular fa-heart';
            currentCount = Math.max(0, currentCount - 1);
        }
        
        countSpan.innerText = currentCount;
        
        const isLiking = btn.classList.contains('liked');
        try {
            await this.postService.toggleLike(postId, this.currentUser.uid, isLiking);
        } catch (error) {
            console.error("Erro ao curtir:", error);
            btn.classList.toggle('liked'); 
            countSpan.innerText = isLiking ? currentCount - 1 : currentCount + 1;
        }
    }

    handleOptions(postId, authorId, currentContent) {
        const isOwner = (this.currentUser && this.currentUser.uid === authorId);
        
        const postElement = document.getElementById(`post-${postId}`);
        let authorPhoto = 'https://ui-avatars.com/api/?name=User';
        let authorName = 'Usuário';

        if (postElement) {
            const imgTag = postElement.querySelector('.fp-avatar');
            const nameTag = postElement.querySelector('.fp-info h4');
            if (imgTag) authorPhoto = imgTag.src;
            if (nameTag) authorName = nameTag.innerText;
        }

        let html = `<div class="af-options-menu">`;
        if (isOwner) {
            html += `
                <button id="opt-edit" class="af-option-item">
                    <i class="fa-regular fa-pen-to-square"></i> Editar
                </button>
                <button id="opt-delete" class="af-option-item danger">
                    <i class="fa-regular fa-trash-can"></i> Excluir
                </button>
            `;
        } else {
            html += `
                <button id="opt-report" class="af-option-item danger">
                    <i class="fa-regular fa-flag"></i> Denunciar
                </button>
                <button id="opt-copy" class="af-option-item">
                    <i class="fa-solid fa-link"></i> Copiar Link
                </button>
            `;
        }
        html += `<button id="opt-cancel" class="af-option-item cancel">Cancelar</button></div>`;

        Swal.fire({
            html: html,
            showConfirmButton: false, showCloseButton: false,
            width: 300, padding: 0,
            customClass: { popup: 'af-options-modal' },
            backdrop: `rgba(0,0,0,0.6)`
        });

        setTimeout(() => {
            const get = (id) => document.getElementById(id);
            if (get('opt-cancel')) get('opt-cancel').onclick = () => Swal.close();
            
            // --- CORREÇÃO AQUI: CHAMA O NOVO MODAL LUXURY ---
            if (get('opt-delete')) get('opt-delete').onclick = () => { 
                Swal.close(); 
                // Verifica se a função global existe antes de chamar
                if(window.openDeleteModal) {
                    window.openDeleteModal(postId); 
                } else {
                    console.error("Função window.openDeleteModal não encontrada!");
                }
            };
            
            if (get('opt-edit')) get('opt-edit').onclick = () => { 
                Swal.close(); 
                this.openEditModal(postId, currentContent, authorName, authorPhoto); 
            };

            if (get('opt-report')) get('opt-report').onclick = () => { Swal.close(); Swal.fire({ icon: 'success', title: 'Denúncia enviada', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false }); };
            if (get('opt-copy')) get('opt-copy').onclick = () => { 
                Swal.close(); 
                if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
                Swal.fire({ icon: 'success', title: 'Link copiado!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            };
        }, 50);
    }

    openEditModal(postId, content, authorName, authorPhoto) {
        const customHtml = `
            <div class="insta-content-body">
                <div class="insta-user-header">
                    <img src="${authorPhoto}" class="i-avatar-small" alt="Foto">
                    <span class="i-username">${authorName}</span>
                </div>
                <textarea id="swal-edit-content" class="insta-textarea-seamless" placeholder="Escreva sua legenda...">${content}</textarea>
            </div>
        `;

        Swal.fire({
            title: 'Editar informações',
            html: customHtml,
            showCancelButton: true,
            confirmButtonText: 'Concluir',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'insta-edit-modal' },
            width: 400,
            didOpen: () => {
                const textarea = Swal.getPopup().querySelector('#swal-edit-content');
                if (textarea) {
                    textarea.focus();
                    const val = textarea.value;
                    textarea.value = '';
                    textarea.value = val;
                    textarea.style.height = 'auto';
                    textarea.style.height = (textarea.scrollHeight) + 'px';
                    textarea.addEventListener('input', function() {
                        this.style.height = 'auto';
                        this.style.height = (this.scrollHeight) + 'px';
                    });
                }
            },
            preConfirm: () => {
                const newContent = Swal.getPopup().querySelector('#swal-edit-content').value;
                if (!newContent.trim()) {
                    Swal.showValidationMessage('A legenda não pode ficar vazia.');
                    return false;
                }
                return newContent;
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value !== content) {
                try {
                    Swal.fire({ title: 'Salvando...', didOpen: () => Swal.showLoading(), background: 'transparent', backdrop: 'rgba(0,0,0,0.3)', showConfirmButton: false, allowOutsideClick: false });
                    await this.postService.updatePost(postId, result.value);
                    Swal.fire({ icon: 'success', title: 'Salvo!', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
                } catch (error) {
                    console.error(error);
                    Swal.fire('Erro', 'Não foi possível salvar.', 'error');
                }
            }
        });
    }

    // --- NOVA FUNÇÃO DE EXCLUSÃO (CHAMADA PELO EVENTO DO MODAL) ---
    async performDelete(postId) {
        try {
            await this.postService.deletePost(postId);
            // Feedback sutil ao invés de alert
            if(window.Swal) Swal.fire({ icon: 'success', title: 'Post excluído.', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        } catch(error) {
            console.error(error);
            alert("Erro ao excluir.");
        }
    }
}