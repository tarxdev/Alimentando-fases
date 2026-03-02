/**
 * @fileoverview Controller responsável pela orquestração do fluxo de recuperação de credenciais.
 * Implementa separação de responsabilidades (SoC) e encapsulamento de mutações na DOM.
 */

import { auth } from '../../../firebase-config.js';
import { AuthService } from '../services/auth.service.js';

export class RecuperarSenhaController {
    
    /**
     * Injeção de dependência do serviço de autenticação para testabilidade e baixo acoplamento.
     * @param {AuthService} authService - Instância singleton do serviço de autenticação.
     */
    constructor(authService) {
        this.authService = authService;
        
        // Cache de referências da DOM para otimização de renderização
        this.dom = {
            form: document.getElementById('recovery-form'),
            emailInput: document.getElementById('email'),
            feedbackDiv: document.getElementById('feedback-message'),
            submitButton: document.querySelector('#recovery-form button[type="submit"]')
        };

        this.init();
    }

    /**
     * Bootstrapping dos event listeners com Early Return para prevenção de falhas (Null Reference).
     */
    init() {
        if (!this.dom.form) {
            console.error('[Critical] Falha de binding: Artefato #recovery-form não mapeado na DOM.');
            return;
        }
        this.dom.form.addEventListener('submit', (e) => this.handleRecovery(e));
    }

    /**
     * Handler assíncrono para despacho do payload de recuperação.
     * @param {Event} event - Evento nativo de submissão do formulário.
     */
    async handleRecovery(event) {
        event.preventDefault();
        
        const email = this.dom.emailInput?.value.trim();

        // Implementação de Early Return para validação de integridade do payload
        if (!email) {
            this.renderFeedback('Payload inválido: E-mail obrigatório.', 'error');
            return;
        }

        this.toggleLoadingState(true);

        try {
            await this.authService.recoverPassword(auth, email);
            this.renderFeedback('Instruções de redefinição despachadas. Verifique a caixa de entrada.', 'success');
            this.dom.form.reset();
        } catch (error) {
            this.handleRecoveryException(error);
        } finally {
            this.toggleLoadingState(false);
        }
    }

    /**
     * Delegação de tratamento de exceções para centralização de logs e graceful degradation na UI.
     * @param {Error} error - Exceção propagada pelo adapter do Firebase.
     */
    handleRecoveryException(error) {
        const parsedError = this.authService.parseError(error);
        this.renderFeedback(parsedError, 'error');
        // Ponto de injeção futuro: Telemetria/Observabilidade via Sentry
    }

    /**
     * Mutação controlada da DOM para exibição de status da transação.
     * @param {string} message - String literal contendo o feedback.
     * @param {'success'|'error'|'info'} type - Classificação estrita para estilização de estado.
     */
    renderFeedback(message, type = 'info') {
        if (!this.dom.feedbackDiv) return;
        this.dom.feedbackDiv.textContent = message;
        this.dom.feedbackDiv.className = `feedback-message ${type}`;
        this.dom.feedbackDiv.style.display = 'block';
    }

    /**
     * Gerenciamento de estado da interface durante operações I/O (Network Requests).
     * @param {boolean} isLoading - Flag booleana definindo o estado de processamento.
     */
    toggleLoadingState(isLoading) {
        if (!this.dom.submitButton) return;
        
        const btnText = this.dom.submitButton.querySelector('.btn-text');
        const btnLoader = this.dom.submitButton.querySelector('.btn-loader');

        if (isLoading) {
            this.dom.submitButton.disabled = true;
            this.dom.submitButton.classList.add('loading');
            if (btnText) btnText.textContent = 'Processando...';
            if (btnLoader) btnLoader.classList.remove('hidden');
            return;
        }

        this.dom.submitButton.disabled = false;
        this.dom.submitButton.classList.remove('loading');
        if (btnText) btnText.textContent = 'Enviar Link';
        if (btnLoader) btnLoader.classList.add('hidden');
    }
}

// Instanciação em escopo de módulo
const authService = new AuthService();
new RecuperarSenhaController(authService);