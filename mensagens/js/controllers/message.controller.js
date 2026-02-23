import { auth } from '../../../firebase-config.js';
import { ChatService } from '../services/chat.js';
import { PresenceService } from '../services/presence.service.js';
import { GiphyService } from '../services/giphy.service.js';
import { asmCrypto } from '../services/asm-loader.js';

export class MessageController {
    constructor() {
        this.chatService = new ChatService();
        this.presenceService = new PresenceService();
        this.giphyService = new GiphyService();
        this.currentUser = null;
        this.activeChatId = null;
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
                const photo = u?.photo || "https://ui-avatars.com/api/?name=" + name;

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
            });

            item.onclick = (e) => this.openChat(chat.id, e.currentTarget);
            this.listContainer.appendChild(item);
        });
    }

    openChat(chatId, itemElement) {
        this.activeChatId = chatId;
        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
        
        if (itemElement) {
            itemElement.classList.add('active');
            
            // PEGA O NOME DIRETO DO DATASET DO ELEMENTO (SEGURANÇA)
            if (itemElement.dataset.chatName) {
                this.headerName.innerText = itemElement.dataset.chatName;
                this.headerAvatar.src = itemElement.dataset.chatPhoto;
                
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
            div.className = `message-row ${isMe ? 'mine' : 'theirs'}`;
            
            // Conteúdo (Texto ou Imagem)
            let textContent = msg.text;
            if (asmCrypto.isReady && msg.type === 'text' && msg.isEncrypted) {
                textContent = asmCrypto.decrypt(msg.text);
            }

            let content = `<span class="msg-text-content">${textContent}</span>`;
            if (msg.type === 'gif' || msg.type === 'image') {
                content = `<img src="${msg.text}">`;
            }

            // Hora separada
            div.innerHTML = `
                <div class="message-bubble">
                    ${content}
                    <span class="msg-time">${this.formatTime(msg.timestamp)}</span>
                </div>
            `;
            this.messagesArea.appendChild(div);
        });
        setTimeout(() => this.messagesArea.scrollTop = this.messagesArea.scrollHeight, 50);
    }

    updateSendState() {
        if (!this.sendBtn || !this.input) return;
        // Mantém o botão sempre visível; apenas desabilita quando não dá para enviar
        this.sendBtn.classList.remove('hidden');
        const hasText = (this.input.value || '').trim().length > 0;
        this.sendBtn.disabled = !hasText || !this.activeChatId;
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
            const img = document.createElement('img');
            img.src = gif.previewUrl;
            img.className = 'media-item';
            img.style.cursor = 'pointer';
            img.onclick = () => {
                if (this.activeChatId) {
                    this.chatService.sendMessage(this.activeChatId, this.currentUser.uid, gif.fullUrl, 'gif');
                    this.gifModal.classList.remove('open');
                }
            };
            // Wrapper div para o grid funcionar bem
            const div = document.createElement('div');
            div.className = 'media-item';
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