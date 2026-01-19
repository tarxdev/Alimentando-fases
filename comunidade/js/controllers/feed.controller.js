/* ARQUIVO: comunidade/js/controllers/feed.controller.js */
import { PostService } from '../services/post.service.js';
import { InteractionService } from '../services/interaction.service.js';
import { escapeHtml, getTimeAgo } from '../utils/formatters.js';
import { auth, onAuthStateChanged, db, getDoc, doc } from '../config/firebase.proxy.js'; // +Imports

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

        // === SYNC FOTOS DO FEED ===
        const authorIds = new Set(posts.map(p => p.authorId));
        const photosMap = {};

        // Busca fotos atualizadas em paralelo
        await Promise.all(Array.from(authorIds).map(async (uid) => {
            try {
                const uDoc = await getDoc(doc(db, 'users', uid));
                if (uDoc.exists()) photosMap[uid] = uDoc.data().photo;
            } catch(e) {}
        }));

        // Atualiza objetos do post
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

        return `
            <article class="feed-post" id="post-${post.id}">
                <div class="fp-header">
                    <div class="fp-user-info">
                        <img src="${post.authorPhoto || 'https://ui-avatars.com/api/?name=User'}" class="fp-avatar">
                        <div class="fp-info"><h4>${escapeHtml(post.authorName)}</h4><span>${getTimeAgo(post.timestamp)}</span></div>
                    </div>
                    <button class="fp-options-btn" data-action="options" data-id="${post.id}" data-author="${post.authorId}" data-content="${encodeURIComponent(post.content || "")}"><i class="fa-solid fa-ellipsis"></i></button>
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

    // ... (Métodos de interação handleLike, handleOptions mantêm-se iguais) ...
    // Estou omitindo para brevidade, pois não mudam a lógica principal, 
    // mas se precisar, copie do arquivo original enviado anteriormente.
    
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
        if (!this.currentUser) return alert("Faça login.");
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        icon.className = btn.classList.contains('liked') ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        
        const isLiking = btn.classList.contains('liked');
        await this.postService.toggleLike(postId, this.currentUser.uid, isLiking);
    }

    handleOptions(postId, authorId, currentContent) {
        const isOwner = (this.currentUser && this.currentUser.uid === authorId);
        let html = `<div class="custom-options-list">`;
        
        if (isOwner) {
            html += `<button id="opt-edit" class="option-btn">Editar</button>`;
            html += `<button id="opt-delete" class="option-btn danger">Excluir</button>`;
        } else {
            html += `<button class="option-btn" onclick="Swal.close()">Denunciar</button>`;
        }
        html += `<button id="opt-cancel" class="option-btn cancel">Cancelar</button></div>`;
        
        Swal.fire({ html, showConfirmButton: false, padding: 0, width: 300 });
        
        setTimeout(() => {
            const edit = document.getElementById('opt-edit');
            const del = document.getElementById('opt-delete');
            const cancel = document.getElementById('opt-cancel');
            
            if(cancel) cancel.onclick = () => Swal.close();
            if(edit) edit.onclick = () => { Swal.close(); this.openEditModal(postId, currentContent); };
            if(del) del.onclick = () => { Swal.close(); this.confirmDelete(postId); };
        }, 50);
    }

    openEditModal(postId, content) {
        Swal.fire({
            title: 'Editar Post', input: 'textarea', inputValue: content,
            showCancelButton: true, confirmButtonText: 'Salvar'
        }).then(async res => {
            if(res.isConfirmed) await this.postService.updatePost(postId, res.value);
        });
    }

    confirmDelete(postId) {
        Swal.fire({ title: 'Tem certeza?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim, excluir' }).then(async res => {
            if(res.isConfirmed) await this.postService.deletePost(postId);
        });
    }
}