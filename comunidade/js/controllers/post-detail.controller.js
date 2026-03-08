/* ARQUIVO: comunidade/js/controllers/post-detail.controller.js */
import { InteractionService } from '../services/interaction.service.js';
import { createCommentElement } from '../utils/dom-helpers.js';
import { auth, db, onAuthStateChanged, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '../config/firebase.proxy.js';
import { escapeHtml, getTimeAgo } from '../utils/formatters.js';
import { notifyPostLike } from '../../../global/notification-events.js';

export class PostDetailController {
    constructor() {
        this.service = new InteractionService();
        this.currentUser = null;
        this.currentPostId = null;
        this.currentPostAuthorId = null; // Guardar ID do dono do post
        this.selectedImageBase64 = null;
        this.replyToCommentId = null;

        this.modal = document.getElementById('modal-post-detail');
        this.containerComments = document.getElementById('inst-comments-list');
        this.input = document.getElementById('inst-comment-input');
        this.btnSend = document.getElementById('inst-btn-send');
        this.btnClose = document.querySelector('.btn-close-modal-inst');
        this.btnImg = document.getElementById('btn-add-comment-img');
        this.fileInput = document.getElementById('input-comment-img');
        this.previewContainer = document.getElementById('comment-img-preview-container');
        this.btnEmoji = document.querySelector('.inst-emoji-btn');
        
        // Elementos do Header do Post
        this.leftSide = document.getElementById('inst-left-content');
        this.authorName = document.getElementById('inst-author-name');
        this.authorPhoto = document.getElementById('inst-author-photo');
        this.postDate = document.getElementById('inst-post-date');
        this.likesCount = document.getElementById('inst-likes-number');
        this.likeBtn = document.getElementById('inst-btn-like');
        
        this.commonEmojis = ['😂','❤️','😍','🔥','👏','🙌','😭','🤣','🥰','😊','👍','👀','🤔','😅'];
    }

    init() {
        onAuthStateChanged(auth, user => this.currentUser = user);

        document.addEventListener('open-post-detail', (e) => { if (e.detail) this.open(e.detail); });
        
        document.addEventListener('delete-reply', (e) => {
            const { commentId, replyId } = e.detail;
            this.deleteReply(commentId, replyId);
        });

        if (this.btnClose) this.btnClose.onclick = () => this.close();
        if (this.modal) this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(); });
        if (this.btnSend) this.btnSend.onclick = () => this.handleSubmit();
        
        if (this.input) {
            this.input.addEventListener('input', () => this.checkInputState());
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!this.btnSend.disabled) this.handleSubmit(); }
            });
        }

        if (this.btnImg && this.fileInput) {
            this.btnImg.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.selectedImageBase64 = evt.target.result;
                        this.showPreview(this.selectedImageBase64);
                        this.checkInputState();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (this.btnEmoji) {
            this.createEmojiPicker();
            this.btnEmoji.addEventListener('click', (e) => { e.stopPropagation(); this.toggleEmojiPicker(); });
            document.addEventListener('click', (e) => {
                if (this.emojiPicker && !this.emojiPicker.contains(e.target) && e.target !== this.btnEmoji) this.emojiPicker.classList.add('hidden');
            });
        }
    }

    createEmojiPicker() {
        const wrapper = document.querySelector('.inst-input-wrapper');
        if (!wrapper) return;
        this.emojiPicker = document.createElement('div');
        this.emojiPicker.className = 'emoji-picker-popover hidden';
        this.commonEmojis.forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'emoji-option';
            span.innerText = emoji;
            span.onclick = () => this.insertEmoji(emoji);
            this.emojiPicker.appendChild(span);
        });
        wrapper.appendChild(this.emojiPicker);
    }

    toggleEmojiPicker() { if(this.emojiPicker) this.emojiPicker.classList.toggle('hidden'); }

    insertEmoji(emoji) {
        if(!this.input) return;
        const start = this.input.selectionStart;
        const end = this.input.selectionEnd;
        this.input.value = this.input.value.substring(0, start) + emoji + this.input.value.substring(end);
        this.input.focus();
        this.input.selectionStart = this.input.selectionEnd = start + emoji.length;
        this.checkInputState();
    }

    showPreview(base64) {
        if(!this.previewContainer) return;
        this.previewContainer.classList.remove('hidden');
        this.previewContainer.innerHTML = `<div class="comment-preview-box"><img src="${base64}"><button class="btn-remove-comment-img"><i class="fa-solid fa-xmark"></i></button></div>`;
        this.previewContainer.querySelector('.btn-remove-comment-img').addEventListener('click', () => this.clearImageSelection());
    }

    clearImageSelection() {
        this.selectedImageBase64 = null;
        this.fileInput.value = '';
        this.previewContainer.innerHTML = '';
        this.previewContainer.classList.add('hidden');
        this.checkInputState();
    }

    checkInputState() {
        const hasContent = this.input.value.trim().length > 0 || !!this.selectedImageBase64;
        this.btnSend.disabled = !hasContent;
    }

    async open(postId) {
        this.currentPostId = postId;
        this.modal.classList.add('open');
        this.containerComments.innerHTML = '<div style="text-align:center; padding:40px; color:#999;"><i class="fa-solid fa-circle-notch fa-spin"></i></div>';
        
        try {
            const postDoc = await getDoc(doc(db, 'posts', postId));
            if (postDoc.exists()) {
                const post = postDoc.data();
                this.currentPostAuthorId = post.authorId; // Importante para permissões
                
                // === SYNC FOTO AUTOR POST ===
                // Busca foto atualizada do autor do post
                let authorPhoto = post.authorPhoto;
                try {
                    const authorDoc = await getDoc(doc(db, 'users', post.authorId));
                    if (authorDoc.exists()) authorPhoto = authorDoc.data().photo || authorPhoto;
                } catch(e) {}
                
                // Injeta a foto atualizada no objeto post para renderizar
                const postWithUpdatedPhoto = { ...post, authorPhoto };
                
                this.renderPostHeaderAndImage(postWithUpdatedPhoto);
                await this.loadComments();
            }
        } catch (error) { console.error(error); }
    }

    close() {
        this.modal.classList.remove('open');
        this.currentPostId = null;
        this.currentPostAuthorId = null;
        this.replyToCommentId = null;
        this.input.value = '';
        if(this.emojiPicker) this.emojiPicker.classList.add('hidden');
        this.clearImageSelection();
        if(this.leftSide) this.leftSide.innerHTML = '';
    }

    renderPostHeaderAndImage(post) {
        if(this.authorName) this.authorName.innerText = post.authorName;
        if(this.authorPhoto) this.authorPhoto.src = post.authorPhoto || 'https://ui-avatars.com/api/?name=User';
        if(this.postDate) this.postDate.innerText = getTimeAgo(post.timestamp).toUpperCase();
        
        const count = post.likes ? post.likes.length : 0;
        if(this.likesCount) this.likesCount.innerText = count === 1 ? '1 curtida' : `${count} curtidas`;

        const isLiked = post.likes && this.currentUser && post.likes.includes(this.currentUser.uid);
        this.updateLikeButton(isLiked);

        let imageUrl = null;
        if (post.images && post.images.length > 0) imageUrl = post.images[0];
        else if (post.image) imageUrl = post.image;

        if (imageUrl && this.leftSide) {
            this.leftSide.style.display = 'flex';
            this.leftSide.innerHTML = `<img src="${imageUrl}" class="inst-post-img" alt="Post">`;
        } else if (this.leftSide) {
            this.leftSide.style.display = 'none';
        }
    }

    updateLikeButton(isLiked) {
        if (!this.likeBtn) return;
        if (isLiked) {
            this.likeBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
            this.likeBtn.style.color = '#ed4956';
            this.likeBtn.classList.add('liked');
        } else {
            this.likeBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
            this.likeBtn.style.color = '#262626';
            this.likeBtn.classList.remove('liked');
        }
        const newBtn = this.likeBtn.cloneNode(true);
        this.likeBtn.parentNode.replaceChild(newBtn, this.likeBtn);
        this.likeBtn = newBtn;
        this.likeBtn.onclick = () => this.handleModalLike(!isLiked);
    }

    async handleModalLike(shouldLike) {
        if (!this.currentUser) return alert("Faça login.");
        this.updateLikeButton(shouldLike);
        
        const ref = doc(db, 'posts', this.currentPostId);
        const uid = this.currentUser.uid;
        try { 
            await updateDoc(ref, { likes: shouldLike ? arrayUnion(uid) : arrayRemove(uid) }); 
            if (shouldLike && this.currentPostAuthorId) {
                await notifyPostLike({
                    recipientId: this.currentPostAuthorId,
                    actorId: uid,
                    actorName: this.currentUser.displayName || 'Usuário',
                    actorPhoto: this.currentUser.photoURL || '',
                    postId: this.currentPostId
                });
            }
        } catch (error) { console.error(error); }
    }

    async loadComments() {
        try {
            const comments = await this.service.getComments(this.currentPostId);
            
            // === SYNC DE FOTOS DOS COMENTÁRIOS ===
            // 1. Coletar IDs únicos de autores
            const authorIds = new Set();
            comments.forEach(c => {
                authorIds.add(c.authorId);
                c.replies.forEach(r => authorIds.add(r.authorId));
            });

            // 2. Buscar fotos atuais no banco
            const photosMap = {};
            await Promise.all(Array.from(authorIds).map(async (uid) => {
                try {
                    const uDoc = await getDoc(doc(db, 'users', uid));
                    if(uDoc.exists()) photosMap[uid] = uDoc.data().photo;
                } catch(e) {}
            }));

            // 3. Atualizar objetos de comentário com a foto nova
            comments.forEach(c => {
                if(photosMap[c.authorId]) c.authorPhoto = photosMap[c.authorId];
                c.replies.forEach(r => {
                    if(photosMap[r.authorId]) r.authorPhoto = photosMap[r.authorId];
                });
            });

            this.renderComments(comments);
        } catch (error) { 
            console.error(error);
            this.containerComments.innerHTML = '<p style="padding:20px; text-align:center;">Erro ao carregar comentários.</p>'; 
        }
    }

    renderComments(comments) {
        this.containerComments.innerHTML = '';
        if (comments.length === 0) {
            this.containerComments.innerHTML = `<div style="text-align:center; padding:40px 20px; color:#65676b;"><h3 style="font-size:1.2rem; margin-bottom:5px;">Sem comentários ainda.</h3><p style="font-size:0.9rem;">Comece a conversa.</p></div>`;
            return;
        }

        const callbacks = {
            onLike: (commentId, isLiking) => this.toggleCommentLike(commentId, isLiking),
            onReply: (commentId, username) => this.prepareReply(commentId, username),
            onDelete: async (commentId) => {
                if(confirm("Excluir comentário?")) {
                    await this.deleteComment(commentId);
                }
            }
        };

        comments.forEach(comment => {
            // Passamos this.currentPostAuthorId para o renderizador controlar permissões
            const el = createCommentElement(
                comment, 
                this.currentUser ? this.currentUser.uid : null, 
                this.currentPostAuthorId, 
                callbacks, 
                comment.replies
            );
            this.containerComments.appendChild(el);
        });
        
        // Scroll suave apenas na primeira carga ou envio, não em update de like
        // (Optei por remover o auto-scroll agressivo para não incomodar na leitura)
    }

    prepareReply(commentId, username) {
        this.replyToCommentId = commentId;
        this.input.value = `@${username} `;
        this.input.focus();
    }

    async toggleCommentLike(commentId, isLiking) {
        if (!this.currentUser) return;
        try {
            await this.service.toggleCommentLike(this.currentPostId, commentId, this.currentUser.uid, isLiking);
            await this.loadComments();
        } catch(e) { console.error(e); }
    }

    async handleSubmit() {
        if (!this.currentUser) return;
        const text = this.input.value.trim();
        const image = this.selectedImageBase64;

        if (!text && !image) return;

        this.btnSend.disabled = true;
        this.btnSend.innerText = "...";

        try {
            if (this.replyToCommentId) {
                await this.service.addReply(this.currentPostId, this.replyToCommentId, this.currentUser, text, image);
            } else {
                await this.service.addComment(this.currentPostId, this.currentUser, text, image);
            }

            document.dispatchEvent(new CustomEvent('post-interaction-update', { 
                detail: { postId: this.currentPostId, type: 'comment', countChange: 1 } 
            }));

            this.input.value = '';
            this.replyToCommentId = null;
            this.clearImageSelection();
            if(this.emojiPicker) this.emojiPicker.classList.add('hidden');
            await this.loadComments();
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar.');
        } finally {
            this.btnSend.innerText = "Publicar";
            this.btnSend.disabled = false;
        }
    }

    async deleteComment(commentId) {
        try {
            await this.service.deleteComment(this.currentPostId, commentId);
            document.dispatchEvent(new CustomEvent('post-interaction-update', { 
                detail: { postId: this.currentPostId, type: 'comment', countChange: -1 } 
            }));
            await this.loadComments();
        } catch (error) { console.error(error); }
    }

    async deleteReply(commentId, replyId) {
        if (!confirm('Deseja excluir esta resposta?')) return;
        try {
            await this.service.deleteReply(this.currentPostId, commentId, replyId);
            document.dispatchEvent(new CustomEvent('post-interaction-update', { 
                detail: { postId: this.currentPostId, type: 'comment', countChange: -1 } 
            }));
            await this.loadComments();
        } catch (error) { console.error(error); }
    }
}