import { auth } from '../../../firebase-config.js';
import { ChatService } from '../services/chat.js';
import { PresenceService } from '../services/presence.service.js';
import { GiphyService } from '../services/giphy.service.js';
import { asmCrypto } from '../services/asm-loader.js';

const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export class MessageController {
    constructor() {
        this.chatService = new ChatService();
        this.presenceService = new PresenceService();
        this.giphyService = new GiphyService();
        this.isSendingGif = false;
        this.currentUser = null;
        this.activeChatId = null;
        this.activeOtherUserId = null;
        this.presenceUnsubscribe = null;
        this.lastChats = [];
        this.lastMessages = [];
        
        // Elementos DOM
        this.listContainer = document.getElementById('conversations-list');
        this.windowPanel = document.getElementById('chat-window-panel');
        this.emptyState = document.getElementById('empty-state-view');
        this.activeView = document.getElementById('active-chat-view');
        this.messagesArea = document.getElementById('messages-area');
        this.input = document.getElementById('message-input');
        this.sendBtn = document.getElementById('btn-send-message');
        this.headerName = document.getElementById('chat-header-name');
        this.headerAvatar = document.getElementById('chat-header-avatar');
        this.headerStatus = document.getElementById('chat-header-status');
        this.attachmentMenu = document.getElementById('attachment-menu');
        this.gifModal = document.getElementById('modal-media-selector');
        this.gifResults = document.getElementById('media-grid-content');
        this.searchGifInp = document.getElementById('giphy-search-input');
    }

    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.currentUser = user;
                this.loadConversations();
                this.bindEvents();
            }
        });

        // Quando o módulo de criptografia ficar pronto, re-renderiza previews/mensagens
        window.addEventListener('asmcrypto:ready', () => {
            if (this.lastChats.length) this.renderConversations(this.lastChats);
            if (this.activeChatId && this.lastMessages.length) this.renderMessages(this.lastMessages);
        });
    }

    loadConversations() {
        this.chatService.listenToConversations(this.currentUser.uid, (chats) => {
            this.lastChats = chats;
            this.renderConversations(chats);
        });
    }

    renderConversations(chats) {
        this.listContainer.innerHTML = '';
        chats.forEach(chat => {
            const otherId = chat.participants.find(uid => uid !== this.currentUser.uid);
            const item = document.createElement('div');
            item.className = `conversation-item ${this.activeChatId === chat.id ? 'active' : ''}`;

            const rawPreview = chat.lastMessage || '';
            const preview = (asmCrypto.isReady && chat.lastMessageEncrypted && rawPreview && !rawPreview.includes('📷'))
                ? asmCrypto.decrypt(rawPreview)
                : rawPreview;

            this.chatService.getUserInfo(otherId).then(u => {
                const name = u?.name || u?.realname || u?.username || "Usuário";
                const photo = (u?.photo && !u.photo.includes('ui-avatars')) ? u.photo : DEFAULT_AVATAR_URL;

                item.dataset.chatName = name;
                item.dataset.chatPhoto = photo;
                item.dataset.otherId = otherId;

                item.innerHTML = `
                    <img src="${photo}" class="conv-avatar">
                    <div class="conv-info">
                        <div class="conv-name">${name}</div>
                        <span class="conv-last-msg">${preview}</span>
                    </div>
                `;

                const avatar = item.querySelector('.conv-avatar');
                if (avatar) {
                    avatar.onerror = () => {
                        avatar.onerror = null;
                        avatar.src = DEFAULT_AVATAR_URL;
                    };
                    avatar.style.cursor = 'pointer';
                    avatar.title = `Ver perfil de ${name}`;
                    avatar.onclick = (e) => {
                        e.stopPropagation();
                        this.openUserProfile(otherId);
                    };
                }

                const nameEl = item.querySelector('.conv-name');
                if (nameEl) {
                    nameEl.style.cursor = 'pointer';
                    nameEl.title = `Ver perfil de ${name}`;
                    nameEl.onclick = (e) => {
                        e.stopPropagation();
                        this.openUserProfile(otherId);
                    };
                }
            });

            item.onclick = (e) => this.openChat(chat.id, e.currentTarget);
            this.listContainer.appendChild(item);
        });
    }

    openChat(chatId, itemElement) {
        this.activeChatId = chatId;
        this.activeOtherUserId = itemElement?.dataset?.otherId || null;
        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
        
        if (itemElement) {
            itemElement.classList.add('active');
            
            // PEGA O NOME DIRETO DO DATASET DO ELEMENTO (SEGURANÇA)
            if (itemElement.dataset.chatName) {
                this.headerName.innerText = itemElement.dataset.chatName;
                this.headerAvatar.src = itemElement.dataset.chatPhoto;
                this.headerAvatar.onerror = () => {
                    this.headerAvatar.onerror = null;
                    this.headerAvatar.src = DEFAULT_AVATAR_URL;
                };
                
                // Status Online
                if(this.presenceUnsubscribe) this.presenceUnsubscribe();
                if(itemElement.dataset.otherId) {
                    this.presenceUnsubscribe = this.presenceService.listenToUserStatus(itemElement.dataset.otherId, s => {
                        this.headerStatus.innerText = s.isOnline ? 'Online' : 'Offline';
                        this.headerStatus.style.color = s.isOnline ? '#00a884' : '#667781';
                    });
                }
            }
        }

        this.emptyState.classList.add('hidden');
        this.activeView.classList.remove('hidden');
        this.windowPanel.classList.remove('empty');
        this.windowPanel.classList.add('active-mobile'); // Para mobile

        this.messagesArea.innerHTML = '';
        if (this.unsubscribeMessages) this.unsubscribeMessages();
        this.unsubscribeMessages = this.chatService.listenToMessages(chatId, (messages) => {
            this.lastMessages = messages;
            this.renderMessages(messages);
        });

        this.updateSendState();
    }

    renderMessages(messages) {
        this.messagesArea.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            const isMe = msg.senderId === this.currentUser.uid;
            let isGif = false;
            let isImage = false;
            div.className = `message-row ${isMe ? 'mine' : 'theirs'}`;

            // Conteúdo (Texto ou Imagem)
            let textContent = (msg?.text ?? '');

            // Se as mensagens foram carregadas antes do core ASM ficar pronto,
            // elas podem chegar ainda em Base64 cifrado. Decifra apenas 1x.
            if (asmCrypto.isReady && msg?.isEncrypted && !msg?.wasDecrypted && typeof textContent === 'string') {
                const decrypted = asmCrypto.decrypt(textContent);
                msg.text = decrypted;
                msg.wasDecrypted = true;
                textContent = decrypted;
            }

            // Fallback de GIF enviado como texto (por regras do Firestore): "GIF:https://..."
            let forcedImageSrc = null;
            if (typeof textContent === 'string') {
                const trimmed = textContent.trim();
                if (trimmed.toUpperCase().startsWith('GIF:')) {
                    forcedImageSrc = trimmed.slice(4).trim();
                }
            }

            const candidateSrc = forcedImageSrc || textContent;
            const shouldRenderAsImage = (msg.type === 'gif' || msg.type === 'image') || !!forcedImageSrc || this.isLikelyImageSrc(candidateSrc);
            if (msg.type === 'gif' || (!!forcedImageSrc && candidateSrc.endsWith('.gif'))) {
                isGif = true;
            } else if (msg.type === 'image' || (!isGif && shouldRenderAsImage)) {
                isImage = true;
            }

            let content = `<span class="msg-text-content">${textContent}</span>`;
            if (shouldRenderAsImage) {
                content = `<img src="${candidateSrc}">`;
            }

            if (isGif) {
                // GIFs dentro de um container de mídia para manter o horário abaixo
                div.classList.add('gif-message');
                div.innerHTML = `
                    <div class="message-bubble media-message-bubble media-gif-bubble">
                        <img src="${candidateSrc}">
                        <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
                    </div>
                `;
            } else if (isImage) {
                // Imagens em container de mídia para consistência com GIF e horário
                div.classList.add('image-message');
                div.innerHTML = `
                    <div class="message-bubble media-message-bubble no-bubble">
                        ${content}
                        <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
                    </div>
                `;
            } else {
                // Mensagem normal
                div.innerHTML = `
                    <div class="message-bubble">
                        ${content}
                        <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
                    </div>
                `;
            }
            this.messagesArea.appendChild(div);
        });
        setTimeout(() => this.messagesArea.scrollTop = this.messagesArea.scrollHeight, 50);
    }

    isLikelyImageSrc(value) {
        if (typeof value !== 'string') return false;
        const v = value.trim();
        if (!v) return false;

        const lower = v.toLowerCase();
        if (lower.startsWith('data:image/')) return true;
        if (lower.startsWith('blob:')) return true;
        if (/^https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(v)) return true;

        // URLs do Firebase Storage nem sempre possuem extensão.
        if (lower.includes('firebasestorage') && lower.includes('alt=media')) return true;

        // Casos comuns do Giphy.
        if (lower.includes('giphy.com') && (lower.includes('.gif') || lower.includes('/media/'))) return true;

        return false;
    }

    updateSendState() {
        if (!this.sendBtn || !this.input) return;
        // Mantém o botão sempre visível; apenas desabilita quando não dá para enviar
        this.sendBtn.classList.remove('hidden');
        const hasText = (this.input.value || '').trim().length > 0;
        this.sendBtn.disabled = !hasText || !this.activeChatId;
    }

    openUserProfile(uid) {
        if (!uid) return;
        window.location.href = `../perfil/index.html?uid=${encodeURIComponent(uid)}`;
    }

    bindEvents() {
        const send = () => {
            const text = this.input.value.trim();
            if (text && this.activeChatId) {
                this.chatService.sendMessage(this.activeChatId, this.currentUser.uid, text, 'text');
                this.input.value = '';
                this.updateSendState();
            }
        };

        this.sendBtn.onclick = (e) => { e.preventDefault(); send(); };

        // Teclado mobile (Enter/Send) nem sempre dispara keypress; usar keydown
        this.input.addEventListener('keydown', (e) => {
            if (e.isComposing) return;
            const isEnter = e.key === 'Enter' || e.keyCode === 13;
            if (isEnter) {
                e.preventDefault();
                send();
            }
        });

        this.input.addEventListener('input', () => this.updateSendState());
        this.updateSendState();
        
        // Menu de Anexos
        const btnAttach = document.getElementById('btn-attach-trigger');
        if (btnAttach) {
            btnAttach.onclick = () => {
                this.attachmentMenu.classList.toggle('hidden');
            };
        }

        // Abrir GIF
        const btnGif = document.getElementById('btn-open-gif');
        if (btnGif) {
            btnGif.onclick = () => {
                this.attachmentMenu.classList.add('hidden');
                this.gifModal.classList.add('open');
                this.loadTrendingGifs();
            };
        }

        // Busca GIF
        if (this.searchGifInp) {
            this.searchGifInp.addEventListener('input', (e) => {
                const term = e.target.value;
                if (term.length > 2) this.searchGifs(term);
                else this.loadTrendingGifs();
            });
        }
        
        // Fechar Modal GIF
        const closeGif = this.gifModal?.querySelector('.btn-close-nc');
        if(closeGif) closeGif.onclick = () => this.gifModal.classList.remove('open');
        
        // Voltar Mobile
        const btnBack = document.getElementById('btn-back-mobile');
        if(btnBack) btnBack.onclick = () => this.windowPanel.classList.remove('active-mobile');

        // Acessar perfil pelo cabeçalho da conversa ativa
        const chatUserDetails = document.querySelector('.chat-header .user-details');
        if (chatUserDetails) {
            chatUserDetails.style.cursor = 'pointer';
            chatUserDetails.title = 'Abrir perfil';
            chatUserDetails.onclick = () => this.openUserProfile(this.activeOtherUserId);
        }
    }

    async searchGifs(term) {
        const gifs = await this.giphyService.search(term);
        this.renderGifGrid(gifs);
    }

    async loadTrendingGifs() {
        const gifs = await this.giphyService.getTrending();
        this.renderGifGrid(gifs);
    }

    renderGifGrid(gifs) {
        this.gifResults.innerHTML = '';
        gifs.forEach(gif => {
            const selectGif = async () => {
                if (!this.activeChatId) return;
                if (this.isSendingGif) return;
                this.isSendingGif = true;
                try {
                    console.debug('[Mensagens] Enviando GIF', { chatId: this.activeChatId, gifId: gif.id });
                    await this.chatService.sendMessage(this.activeChatId, this.currentUser.uid, gif.fullUrl, 'gif');
                    this.gifModal.classList.remove('open');
                } catch (e) {
                    console.error('[Mensagens] Falha ao enviar GIF:', e);
                } finally {
                    // libera no próximo tick para evitar duplo disparo por bubbling
                    setTimeout(() => { this.isSendingGif = false; }, 0);
                }
            };

            const img = document.createElement('img');
            img.src = gif.previewUrl;
            img.className = 'media-item';
            img.style.cursor = 'pointer';
            img.onclick = (e) => {
                if (e) e.stopPropagation();
                selectGif();
            };

            // Wrapper div para o grid funcionar bem
            const div = document.createElement('div');
            div.className = 'media-item';
            div.style.cursor = 'pointer';
            div.onclick = (e) => {
                if (e) e.preventDefault();
                selectGif();
            };
            div.appendChild(img);
            this.gifResults.appendChild(div);
        });
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}