import { EssentiaService } from '../services/essentia.service.js';

export class ChatController {
    constructor() {
        this.service = new EssentiaService();
        
        // Elementos UI do Chat
        this.input = document.getElementById('user-input');
        this.btnSend = document.getElementById('btn-send');
        this.msgArea = document.getElementById('chat-messages');
        this.btnClear = document.getElementById('btn-clear-chat');
        
        // Elementos UI do Modal
        this.modal = document.getElementById('modal-clear');
        this.btnModalConfirm = document.getElementById('btn-modal-confirm');
        this.btnModalCancel = document.getElementById('btn-modal-cancel');

        this.isThinking = false;
        this.typingSpeed = 15; 
    }

    init() {
        // Chat Event Listeners
        this.btnSend.addEventListener('click', () => this.send());
        
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = (this.input.scrollHeight) + 'px';
            this.toggleSendButton();
        });

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                this.send(); 
            }
        });

        // Trigger do Modal (Abre o popup)
        if(this.btnClear) {
            this.btnClear.addEventListener('click', () => this.openModal());
        }

        // Ações do Modal (Confirmar ou Cancelar)
        if (this.modal) {
            this.btnModalConfirm.addEventListener('click', () => {
                this.executeClear();
                this.closeModal();
            });

            this.btnModalCancel.addEventListener('click', () => this.closeModal());

            // Fecha se clicar fora (Overlay)
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });
        }
    }

    // --- Lógica do Modal ---

    openModal() {
        this.modal.classList.add('active');
        this.modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modal.setAttribute('aria-hidden', 'true');
    }

    executeClear() {
        this.msgArea.innerHTML = ''; 
        // Pequeno delay para a UI respirar antes de dar a mensagem de boas vindas
        setTimeout(() => {
            this.typeWriterSmart("Histórico limpo! Como posso ajudar agora? 🥦");
        }, 300);
    }

    // --- Lógica do Chat (Mantida Igual) ---

    toggleSendButton() {
        this.btnSend.disabled = this.input.value.trim().length === 0;
    }

    async send() {
        const text = this.input.value.trim();
        if (!text || this.isThinking) return;

        this.appendMessage(text, 'user');
        this.resetInput();
        
        this.setThinkingState(true);
        this.showLoader(true);

        try {
            const reply = await this.service.sendMessage(text);
            this.showLoader(false);
            await this.typeWriterSmart(reply);

        } catch (e) {
            console.error(e);
            this.showLoader(false);
            this.appendMessage("⚠️ Erro de conexão.", 'ai system-error');
        } finally {
            this.setThinkingState(false);
            this.input.focus();
        }
    }

    async typeWriterSmart(rawText) {
        const { messageDiv, contentDiv } = this.createMessageBubble('ai');
        this.msgArea.appendChild(messageDiv);

        const htmlContent = this.parseMarkdown(rawText);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        if (rawText.length < 50) {
            contentDiv.innerHTML = htmlContent;
            this.scrollToBottom();
            return;
        }

        const plainText = tempDiv.textContent || tempDiv.innerText;
        contentDiv.innerHTML = ''; 
        
        let currentText = '';
        for (let i = 0; i < plainText.length; i++) {
            currentText += plainText[i];
            contentDiv.textContent = currentText; 
            this.scrollToBottom();
            
            const dynamicSpeed = plainText.length > 200 ? 5 : this.typingSpeed;
            await new Promise(r => setTimeout(r, dynamicSpeed));
        }

        contentDiv.innerHTML = htmlContent;
        this.scrollToBottom();
    }

    appendMessage(text, type) {
        const { messageDiv, contentDiv } = this.createMessageBubble(type);
        contentDiv.innerHTML = this.parseMarkdown(text); 
        this.msgArea.appendChild(messageDiv);
        this.scrollToBottom();
    }

    parseMarkdown(text) {
        return text
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/^### (.*$)/gim, '<h3 class="chat-heading">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="chat-heading">$1</h2>')
            .replace(/^\s*---\s*$/gim, '<hr class="chat-divider">')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="chat-code">$1</code>')
            .replace(/\n/g, '<br>');
    }

    createMessageBubble(type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.innerText = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeSpan);

        return { messageDiv, contentDiv };
    }

    showLoader(show) {
        if (show) {
            const loader = document.createElement('div');
            loader.id = 'typing-loader';
            loader.className = 'message ai-message';
            loader.innerHTML = `<div class="message-content typing"><div class="dot-anim"></div><div class="dot-anim"></div><div class="dot-anim"></div></div>`;
            this.msgArea.appendChild(loader);
            this.scrollToBottom();
        } else {
            const el = document.getElementById('typing-loader');
            if (el) el.remove();
        }
    }

    scrollToBottom() { this.msgArea.scrollTop = this.msgArea.scrollHeight; }

    resetInput() {
        this.input.value = '';
        this.input.style.height = 'auto';
        this.toggleSendButton();
    }

    setThinkingState(isThinking) {
        this.isThinking = isThinking;
        this.btnSend.disabled = isThinking;
    }
}