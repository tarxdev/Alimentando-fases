import { PostService } from '../services/post.service.js';
import { InteractionService } from '../services/interaction.service.js';
import { escapeHtml, getTimeAgo } from '../utils/formatters.js';
import { auth, onAuthStateChanged } from '../config/firebase.proxy.js';

export class FeedController {
    constructor() {
        this.postService = new PostService();
        this.interactionService = new InteractionService();
        this.container = document.getElementById('feed-container');
        this.currentUser = null;
        this.unsubscribeFeed = null; // Para guardar a conexão
    }

    async init() {
        onAuthStateChanged(auth, user => {
            this.currentUser = user;
            // Inicia a conexão Real-Time assim que tivermos o usuário (ou guest)
            this.startRealTimeFeed();
        });

        if (this.container) {
            this.container.addEventListener('click', (e) => this.handleInteractions(e));
        }
        
        // Removemos os Listeners manuais antigos ('post-interaction-update', etc)
        // O Real-Time cuida disso agora.
    }

    startRealTimeFeed() {
        // Se já existir uma conexão, fecha ela antes de abrir outra
        if (this.unsubscribeFeed) this.unsubscribeFeed();

        this.renderSkeleton();

        // Conecta ao "Tubo" de dados do Firebase
        this.unsubscribeFeed = this.postService.subscribeToFeed(50, (posts) => {
            // Esta função roda AUTOMATICAMENTE sempre que:
            // 1. Alguém postar
            // 2. Alguém der like
            // 3. O contador de comentários mudar
            this.renderPosts(posts);
        });
    }

    renderSkeleton() {
        const s = `<article class="feed-post skeleton-card"><div class="fp-header"><div class="skeleton sk-avatar"></div><div class="skeleton sk-line w-60"></div></div><div class="skeleton sk-content-line"></div><div class="skeleton sk-content-line w-80"></div></article>`;
        this.container.innerHTML = s.repeat(2);
    }

    renderPosts(posts) {
        if (!posts || posts.length === 0) {
            this.container.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#ccc;"><p>Nada aqui ainda.</p></div>`;
            return;
        }
        // Redesenha o feed com os dados mais frescos possíveis
        this.container.innerHTML = posts.map(p => this.buildPostHTML(p)).join('');
    }

    buildPostHTML(post) {
        const uid = this.currentUser ? this.currentUser.uid : null;
        const isLiked = post.likes && post.likes.includes(uid);
        
        // Proteção contra undefined no contador
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

    // --- MANIPULADORES DE INTERAÇÃO (Mantidos, mas simplificados) ---
    async handleInteractions(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const postId = target.dataset.id;

        if (action === 'like') this.handleLike(postId, target); // Passando target para feedback otimista
        else if (action === 'comment') document.dispatchEvent(new CustomEvent('open-post-detail', { detail: postId }));
        else if (action === 'options') {
            const authorId = target.dataset.author;
            const content = decodeURIComponent(target.dataset.content);
            this.handleOptions(postId, authorId, content);
        }
    }

    async handleLike(postId, btn) {
        if (!this.currentUser) return alert("Faça login.");
        // O Real-Time vai atualizar a tela sozinho, mas para ser INSTANTÂNEO (0ms),
        // podemos alternar a classe visualmente antes da resposta do servidor.
        btn.classList.toggle('liked');
        const icon = btn.querySelector('i');
        icon.className = btn.classList.contains('liked') ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        
        // Envia para o banco (isso vai disparar o listener lá em cima depois)
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