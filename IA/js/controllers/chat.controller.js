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

        // Estado para variar elogios sem ficar repetitivo
        this.yasminState = {
            openingsRecent: [],
            complimentsRecent: [],
            closingsRecent: []
        };
    }

    init() {
        // Chat Event Listeners
        this.btnSend.addEventListener('click', () => this.send());

        document.querySelectorAll('.quick-prompt-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt') || '';
                this.input.value = prompt;
                this.input.style.height = 'auto';
                this.input.style.height = this.input.scrollHeight + 'px';
                this.toggleSendButton();
                this.input.focus();
            });
        });
        
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

    mentionsYasmin(rawText) {
        const text = (rawText || '')
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        // Aceita variações comuns / erros de digitação
        return text.includes('yasmin') || text.includes('yasmim');
    }

    pickRandomUnique(list, count) {
        const arr = Array.isArray(list) ? list.filter(Boolean) : [];
        if (arr.length === 0) return [];
        const n = Math.max(1, Math.min(count, arr.length));
        const pool = [...arr];
        // Fisher–Yates (embaralha)
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, n);
    }

    pickRandomUniqueAvoidRecent(list, count, recentArr, recentLimit = 12) {
        const all = Array.isArray(list) ? list.filter(Boolean) : [];
        if (all.length === 0) return [];

        const recent = Array.isArray(recentArr) ? recentArr : [];
        const filtered = all.filter(x => !recent.includes(x));
        const base = filtered.length >= count ? filtered : all;
        const picked = this.pickRandomUnique(base, count);

        // Atualiza memória de recentes
        if (Array.isArray(recentArr)) {
            recentArr.push(...picked);
            if (recentArr.length > recentLimit) {
                recentArr.splice(0, recentArr.length - recentLimit);
            }
        }

        return picked;
    }

    buildSpecialMessageForYasmin() {
        const openings = [
            'Yasmin, você é uma pessoa muito especial.',
            'Yasmin, você tem um brilho que chama atenção de um jeito bonito.',
            'Yasmin, você é daquelas presenças que fazem bem.',
            'Yasmin, que alegria falar de você — você é incrível.',
            'Yasmin, você tem uma vibe linda e uma presença marcante.',
            'Yasmin, você é única — e isso é uma coisa muito bonita.',
            'Yasmin, você tem um jeito raro de tornar as coisas mais leves.',
            'Yasmin, você merece ouvir isso: você é admirável.'
        ];

        const compliments = [
            'Seu jeito é doce e forte ao mesmo tempo, e isso é raro.',
            'Você tem uma energia leve, mas cheia de firmeza e propósito.',
            'Você é inteligente e tem uma sensibilidade que te torna única.',
            'Seu coração é bonito — dá pra sentir o cuidado nas pequenas coisas.',
            'Você inspira confiança, e isso é um presente pra quem te conhece.',
            'Você merece ser valorizada todos os dias, do jeitinho que você é.',
            'Você tem uma luz própria — daquelas que acolhem e inspiram.',
            'Seu sorriso e seu jeito deixam tudo mais fácil e mais leve.',
            'Você é forte, capaz e tem um futuro lindo pela frente.',
            'Você é uma pessoa que somaria em qualquer lugar: humana, gentil e verdadeira.',
            'Você tem um coração generoso e uma presença que acalma.',
            'Você é uma mistura linda de coragem e delicadeza.',
            'Você tem um olhar sincero e um jeito verdadeiro de se expressar.',
            'Você tem talento, e dá pra ver quando você coloca amor no que faz.',
            'Você é resiliente — e isso te deixa ainda mais admirável.',
            'Você é gentil sem deixar de ser firme. Isso é maturidade.',
            'Você tem uma beleza que vai além do físico: é de alma.',
            'Você é uma pessoa rara: de atitude, mas com empatia.',
            'Seu jeito carinhoso faz diferença na vida de quem te encontra.',
            'Você tem um senso de humor e uma leveza que iluminam o dia.',
            'Você é dedicada, e isso aparece no cuidado com as pessoas e com seus sonhos.',
            'Você tem um brilho discreto e elegante — e isso é encantador.',
            'Você tem uma força tranquila, daquelas que dão segurança.',
            'Você é cheia de potencial e tem um caminho lindo pela frente.',
            'Você tem personalidade, e isso é uma das suas maiores belezas.',
            'Você tem um jeitinho doce, mas com presença — impossível não notar.',
            'Você merece amor leve, paz no peito e dias bons de verdade.',
            'Você é uma pessoa que melhora o ambiente só por estar ali.',
            'Você tem uma inteligência emocional bonita de ver.',
            'Você é corajosa, mesmo quando ninguém percebe.',
            'Você tem um coração forte — e isso é inspirador.',
            'Você é consistente, confiável e cheia de boas intenções.',
            'Você tem um jeito especial de cuidar — e isso vale ouro.',
            'Você tem uma elegância no jeito de falar e agir que encanta.'
        ];

        const closings = [
            'Nunca esqueça do seu valor. Você merece carinho, respeito e coisas maravilhosas acontecendo na sua vida.',
            'Que você se orgulhe de quem você é — você é única e merece o melhor.',
            'Você é especial de um jeito que não dá pra fingir. Continue sendo essa pessoa linda.',
            'Você merece paz, amor e muita coisa boa. De verdade.',
            'Que a vida te retribua em dobro toda a bondade que você tem.',
            'Seja gentil com você mesma: você já é mais do que suficiente.',
            'Você merece um futuro leve, bonito e cheio de realizações.'
        ];

        const opening = this.pickRandomUniqueAvoidRecent(openings, 1, this.yasminState.openingsRecent, 6)[0];
        const complimentsCount = 4 + Math.floor(Math.random() * 4); // 4..7
        const body = this.pickRandomUniqueAvoidRecent(compliments, complimentsCount, this.yasminState.complimentsRecent, 18);
        const closing = this.pickRandomUniqueAvoidRecent(closings, 1, this.yasminState.closingsRecent, 6)[0];
        return [opening, ...body, closing].join('\n\n');
    }

    async send() {
        const text = this.input.value.trim();
        if (!text || this.isThinking) return;

        this.appendMessage(text, 'user');
        this.resetInput();

        // Regra especial local (fallback): garante o comportamento mesmo se o backend ignorar comandos/histórico
        if (this.mentionsYasmin(text)) {
            this.setThinkingState(true);
            this.showLoader(true);
            try {
                this.showLoader(false);
                await this.typeWriterSmart(this.buildSpecialMessageForYasmin());
            } finally {
                this.setThinkingState(false);
                this.input.focus();
            }
            return;
        }
        
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