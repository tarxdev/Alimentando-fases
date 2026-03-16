/* ARQUIVO: perfil/js/utils/dom.js */

import { getRoleBadgeHTML } from '../../../sistema-cargos/cargos.js';

const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

function getTimeAgo(timestamp) {
    if (!timestamp) return 'Agora';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = (Date.now() - date) / 1000;
        if(diff < 60) return 'Agora';
        if(diff < 3600) return `${Math.floor(diff/60)} min`;
        if(diff < 86400) return `${Math.floor(diff/3600)} h`;
        const days = Math.floor(diff/86400);
        if(days < 7) return `${days} d`;
        const weeks = Math.floor(days/7);
        return `${weeks} sem`; 
    } catch(e) { return ''; }
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function renderCommentItem(comment, currentUserId, currentUserPhoto, postAuthorId, callbacks, replies = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'inst-comment-block';

    const isCommentOwner = currentUserId === comment.authorId;
    const isPostOwner = currentUserId === postAuthorId;
    const canDelete = isCommentOwner || isPostOwner;

    // Estado inicial
    let isLiked = comment.likes && comment.likes.includes(currentUserId);
    let likeCount = comment.likes ? comment.likes.length : 0;
    
    const badge = getRoleBadgeHTML({ role: comment.authorRole, crn: comment.authorCRN });
    const contentText = comment.text || comment.content || "";
    const displayAvatar = (isCommentOwner && currentUserPhoto) ? currentUserPhoto : (comment.authorPhoto || DEFAULT_AVATAR_URL);

    let mediaHtml = '';
    if (comment.image) {
        mediaHtml = `<img src="${comment.image}" class="inst-comment-img" onclick="window.open(this.src)" alt="Foto">`;
    }

    // HTML INICIAL
    wrapper.innerHTML = `
        <div class="inst-comment-row">
            <img src="${displayAvatar}" class="inst-c-avatar">
            <div class="inst-c-wrapper">
                <div class="inst-c-text">
                    <span class="author-name">${escapeHtml(comment.authorName)} ${badge}</span>
                    ${escapeHtml(contentText)}
                </div>
                ${mediaHtml}
                <div class="inst-c-actions">
                    <span>${getTimeAgo(comment.timestamp)}</span>
                    <span class="like-counter-text" ${likeCount === 0 ? 'style="display:none"' : ''}>
                        ${likeCount} curtida${likeCount > 1 ? 's' : ''}
                    </span>
                    <button class="btn-comment-action" data-action="reply">Responder</button>
                    ${canDelete ? `<button class="btn-comment-action delete-btn" data-action="delete">Excluir</button>` : ''}
                </div>
            </div>
            <button class="btn-comment-like ${isLiked ? 'liked' : ''}" data-action="like">
                <i class="${isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            </button>
        </div>
    `;

    // --- LÓGICA DE LIKE INSTANTÂNEO (SEM RELOAD) ---
    const likeBtn = wrapper.querySelector('[data-action="like"]');
    const likeCounter = wrapper.querySelector('.like-counter-text');
    const icon = likeBtn.querySelector('i');

    likeBtn.onclick = () => {
        // Inverte estado visualmente na hora
        isLiked = !isLiked;
        
        // Atualiza classe e ícone
        if(isLiked) {
            likeBtn.classList.add('liked');
            icon.className = 'fa-solid fa-heart';
            likeCount++;
        } else {
            likeBtn.classList.remove('liked');
            icon.className = 'fa-regular fa-heart';
            likeCount--;
        }

        // Atualiza texto do contador
        if(likeCount > 0) {
            likeCounter.style.display = 'inline';
            likeCounter.innerText = `${likeCount} curtida${likeCount > 1 ? 's' : ''}`;
        } else {
            likeCounter.style.display = 'none';
        }

        // Chama backend silenciosamente
        callbacks.onLike(comment.id, isLiked);
    };

    // Outros Listeners
    wrapper.querySelector('[data-action="reply"]').onclick = () => callbacks.onReply(comment.id, comment.authorName);
    if(canDelete) wrapper.querySelector('[data-action="delete"]').onclick = () => callbacks.onDelete(comment.id);

    // --- RENDERIZAR RESPOSTAS ---
    if (replies && replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'inst-replies-list';

        replies.forEach(reply => {
            // Lógica similar para respostas
            const isReplyOwner = currentUserId === reply.authorId;
            const canDeleteReply = isReplyOwner || isPostOwner;
            const rBadge = getRoleBadgeHTML({ role: reply.authorRole, crn: reply.authorCRN });
            const rAvatar = (isReplyOwner && currentUserPhoto) ? currentUserPhoto : (reply.authorPhoto || DEFAULT_AVATAR_URL);
            
            const rMedia = reply.image ? `<img src="${reply.image}" class="inst-comment-img" onclick="window.open(this.src)">` : '';
            const deleteReplyBtn = canDeleteReply 
                ? `<button class="btn-comment-action delete-btn" onclick="document.dispatchEvent(new CustomEvent('delete-reply', {detail: {commentId: '${comment.id}', replyId: '${reply.id}'}}))">Excluir</button>` 
                : '';

            const div = document.createElement('div');
            div.className = 'inst-comment-row is-reply';
            div.innerHTML = `
                <img src="${rAvatar}" class="inst-c-avatar">
                <div class="inst-c-wrapper">
                    <div class="inst-c-text">
                        <span class="author-name">${escapeHtml(reply.authorName)} ${rBadge}</span>
                        ${escapeHtml(reply.text || reply.content)}
                    </div>
                    ${rMedia}
                    <div class="inst-c-actions">
                        <span>${getTimeAgo(reply.timestamp)}</span>
                        ${deleteReplyBtn}
                    </div>
                </div>
            `;
            repliesContainer.appendChild(div);
        });
        wrapper.appendChild(repliesContainer);
    }

    return wrapper;
}