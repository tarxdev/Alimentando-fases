/* ARQUIVO: perfil/js/utils/dom.js */

import { getRoleBadgeHTML } from '../../../sistema-cargos/cargos.js';

export function renderCommentItem(data, currentUid, callbacks, replies = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'inst-comment-wrapper';

    const contentText = data.content || data.text || "";
    const badge = getRoleBadgeHTML({ role: data.authorRole, crn: data.authorCRN });
    const isOwner = data.authorId === currentUid;
    const hasImage = data.image ? `<br><img src="${data.image}" class="inst-comment-img" onclick="window.open(this.src)" loading="lazy">` : '';
    const avatarUrl = data.authorPhoto || 'https://ui-avatars.com/api/?name=User';

    // 1. COMENTÁRIO PAI
    const row = document.createElement('div');
    row.className = 'inst-comment-row';
    
    row.innerHTML = `
        <img src="${avatarUrl}" class="inst-c-avatar" alt="Foto">
        <div class="inst-c-wrapper">
            <div class="inst-c-bubble">
                <span class="author-name">${data.authorName} ${badge}</span>
                <span>${contentText}</span>
                ${hasImage}
            </div>
            
            <div class="inst-c-actions">
                <span class="comment-time">${formatTime(data.timestamp)}</span>
                ${data.likes && data.likes.length > 0 ? `<span>${data.likes.length} curtidas</span>` : ''}
                <button class="btn-comment-action btn-reply">Responder</button>
                ${isOwner ? `<button class="btn-comment-action btn-delete" style="color:#ed4956;">Excluir</button>` : ''}
            </div>
        </div>
        <button class="btn-comment-like ${data.likes && data.likes.includes(currentUid) ? 'liked' : ''}">
            <i class="${data.likes && data.likes.includes(currentUid) ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
    `;

    const btnLike = row.querySelector('.btn-comment-like');
    if (btnLike) btnLike.onclick = () => {
        const isLiked = btnLike.classList.toggle('liked');
        btnLike.querySelector('i').className = isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        callbacks.onLike(data.id, isLiked);
    };

    row.querySelector('.btn-reply').onclick = () => callbacks.onReply(data.id, data.authorName);
    if(isOwner) row.querySelector('.btn-delete').onclick = () => callbacks.onDelete(data.id);

    wrapper.appendChild(row);

    // 2. RESPOSTAS (REPLIES)
    if (replies && Array.isArray(replies) && replies.length > 0) {
        const repliesContainer = document.createElement('div');
        repliesContainer.className = 'inst-replies-list'; 

        replies.forEach(reply => {
            const rText = reply.content || reply.text || "";
            const rBadge = getRoleBadgeHTML({ role: reply.authorRole, crn: reply.authorCRN });
            const rIsOwner = reply.authorId === currentUid;
            const rAvatar = reply.authorPhoto || 'https://ui-avatars.com/api/?name=User';
            const rImage = reply.image ? `<br><img src="${reply.image}" class="inst-comment-img">` : '';

            const rRow = document.createElement('div');
            rRow.className = 'inst-comment-row';

            rRow.innerHTML = `
                <img src="${rAvatar}" class="inst-c-avatar inst-reply-avatar">
                <div class="inst-c-wrapper">
                    <div class="inst-c-bubble" style="background:#fff; border:1px solid #f0f0f0;">
                        <span class="author-name">${reply.authorName} ${rBadge}</span>
                        <span>${rText}</span>
                        ${rImage}
                    </div>
                    <div class="inst-c-actions">
                        <span class="comment-time">${formatTime(reply.timestamp)}</span>
                        ${rIsOwner ? `<button class="btn-comment-action btn-delete-reply" style="color:#ed4956;">Excluir</button>` : ''}
                    </div>
                </div>
            `;
            
            if (rIsOwner) {
                const rDel = rRow.querySelector('.btn-delete-reply');
                if (rDel) rDel.onclick = () => alert("Para excluir respostas, use o app.");
            }

            repliesContainer.appendChild(rRow);
        });

        wrapper.appendChild(repliesContainer);
    }

    return wrapper;
}

function formatTime(timestamp) {
    if (!timestamp) return 'Agora';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = (new Date() - date) / 1000;
        if (diff < 60) return 'Agora';
        if (diff < 3600) return `${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
        return `${Math.floor(diff / 86400)} d`;
    } catch (e) { return 'Agora'; }
}