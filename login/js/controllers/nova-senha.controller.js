/**
 * @fileoverview Controller para redefinição de credenciais via fluxo Out-of-Band (OOB).
 * Centraliza a validação de parâmetros de URL e o handshake criptográfico com o Firebase Auth.
 */

import { auth } from '../../../firebase-config.js';
import { verifyPasswordResetCode, confirmPasswordReset } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class NovaSenhaController {
    
    constructor() {
        this.urlParams = new URLSearchParams(window.location.search);
        this.oobCode = this.urlParams.get('oobCode');
        this.mode = this.urlParams.get('mode');

        this.dom = {
            form: document.getElementById('reset-password-form'),
            newPasswordInput: document.getElementById('new-password'),
            confirmPasswordInput: document.getElementById('confirm-password'),
            feedbackDiv: document.getElementById('feedback-message'),
            submitButton: document.getElementById('btnSubmit'),
            toggleIcons: document.querySelectorAll('.toggle-password')
        };

        this.init();
    }

    /**
     * Avaliação estrutural do payload de roteamento em tempo de bootstrap.
     */
    init() {
        if (!this.dom.form) return;

        if (!this.oobCode || this.mode !== 'resetPassword') {
            this.renderFeedback('AUTH_PAYLOAD_INVALID: Link de recuperação corrompido, ausente ou expirado.', 'error');
            this.toggleFormState(true); 
            return;
        }

        this.dom.form.addEventListener('submit', (e) => this.handlePasswordMutation(e));
        this.bindPasswordToggles();
    }

    /**
     * Delegação de eventos para manipulação do DOM (visibilidade de credenciais).
     */
    bindPasswordToggles() {
        this.dom.toggleIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                const targetId = e.target.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;

                const isPassword = input.getAttribute('type') === 'password';
                input.setAttribute('type', isPassword ? 'text' : 'password');
                e.target.classList.replace(isPassword ? 'fa-eye-slash' : 'fa-eye', isPassword ? 'fa-eye' : 'fa-eye-slash');
            });
        });
    }

    /**
     * Orquestrador assíncrono para efetivação do contrato de redefinição.
     * @param {Event} event 
     */
    async handlePasswordMutation(event) {
        event.preventDefault();

        const newPassword = this.dom.newPasswordInput.value;
        const confirmPassword = this.dom.confirmPasswordInput.value;

        if (newPassword.length < 6) {
            this.renderFeedback('A complexidade mínima da credencial exige 6 caracteres.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.renderFeedback('Divergência de payload: As senhas fornecidas não são idênticas.', 'error');
            return;
        }

        this.toggleLoadingState(true);

        try {
            await verifyPasswordResetCode(auth, this.oobCode);
            await confirmPasswordReset(auth, this.oobCode, newPassword);

            this.renderFeedback('Senha redefinida com sucesso. Redirecionando para o Gateway de Autenticação...', 'success');
            
            setTimeout(() => {
                window.location.replace('index.html');
            }, 3000);

        } catch (error) {
            this.handleFirebaseException(error);
        } finally {
            this.toggleLoadingState(false);
        }
    }

    /**
     * Tradutor de exceções do Identity Provider para a camada de apresentação.
     * @param {Error} error 
     */
    handleFirebaseException(error) {
        const errorCode = error.code;
        console.error('[SecOps] Falha na transação OOB:', errorCode);

        let errorMessage = 'Falha crítica na transação. Contate a engenharia.';
        switch (errorCode) {
            case 'auth/expired-action-code':
            case 'auth/invalid-action-code':
                errorMessage = 'O token de redefinição expirou ou já foi utilizado. Solicite um novo link.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Esta conta encontra-se administrativamente suspensa.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A credencial fornecida não atende aos requisitos de entropia (mínimo 6 caracteres).';
                break;
        }

        this.renderFeedback(errorMessage, 'error');
    }

    /**
     * Mutação da árvore DOM para renderização de status.
     * @param {string} message 
     * @param {'success'|'error'} type 
     */
    renderFeedback(message, type) {
        this.dom.feedbackDiv.textContent = message;
        this.dom.feedbackDiv.className = `feedback-message ${type}`;
        this.dom.feedbackDiv.classList.remove('hidden');
    }

    /**
     * Gerenciamento de bloqueio transacional preventivo.
     * @param {boolean} isDisabled 
     */
    toggleFormState(isDisabled) {
        this.dom.newPasswordInput.disabled = isDisabled;
        this.dom.confirmPasswordInput.disabled = isDisabled;
        this.dom.submitButton.disabled = isDisabled;
    }

    /**
     * Manipulação de estado de UI para concorrência de I/O.
     * @param {boolean} isLoading 
     */
    toggleLoadingState(isLoading) {
        const btnText = this.dom.submitButton.querySelector('.btn-text');
        const btnLoader = this.dom.submitButton.querySelector('.btn-loader');

        if (isLoading) {
            this.dom.submitButton.disabled = true;
            this.dom.submitButton.classList.add('loading');
            btnText.textContent = 'Autenticando transação...';
            btnLoader.classList.remove('hidden');
        } else {
            this.dom.submitButton.disabled = false;
            this.dom.submitButton.classList.remove('loading');
            btnText.textContent = 'Redefinir Senha';
            btnLoader.classList.add('hidden');
        }
    }
}

new NovaSenhaController();