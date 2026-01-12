/**
 * LOGIN CONTROLLER
 * Path: login/js/controllers/login.controller.js
 * Descrição: Gerencia autenticação e UX do formulário (incluindo toggle de senha).
 */

import { auth } from '../../../firebase-config.js'; 
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export class LoginController {
    
    constructor() {
        this.dom = {
            form: document.getElementById('loginForm'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            
            // NOVO: Seleciona o ícone de olho (pela classe CSS .toggle-password)
            togglePasswordIcon: document.querySelector('.toggle-password'),
            
            submitBtn: document.getElementById('btnSubmit') || document.querySelector('.btn-primary'),
            loaderIcon: document.querySelector('.btn-loader'), 
            errorModal: document.getElementById('errorModal'),
            modalMessage: document.getElementById('modalDesc')
        };
    }

    init() {
        if (!this.dom.form) {
            console.error('[Critical] Elemento #loginForm não encontrado.');
            return;
        }
        
        // Listener do Login
        this.dom.form.addEventListener('submit', (e) => this.handleLogin(e));

        // NOVO: Listener do Olho (Ver Senha)
        if (this.dom.togglePasswordIcon) {
            this.dom.togglePasswordIcon.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    /**
     * NOVO MÉTODO: Alterna a visibilidade da senha
     */
    togglePasswordVisibility() {
        const input = this.dom.password;
        const icon = this.dom.togglePasswordIcon;

        // 1. Verifica o estado atual
        const isPassword = input.getAttribute('type') === 'password';

        // 2. Troca o tipo do input (password <-> text)
        input.setAttribute('type', isPassword ? 'text' : 'password');

        // 3. Troca o ícone (FontAwesome classes)
        // Remove classes antigas para evitar conflito
        icon.classList.remove('fa-eye', 'fa-eye-slash');

        if (isPassword) {
            // Se virou texto (visível), mostra o olho cortado ou aberto (depende do seu gosto)
            // Geralmente: Olho aberto = vendo senha. Olho cortado = senha oculta.
            // Ajuste aqui conforme sua preferência visual:
            icon.classList.add('fa-eye'); // Ícone de olho aberto
        } else {
            // Se virou password (oculto)
            icon.classList.add('fa-eye-slash'); // Ícone de olho cortado
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.dom.form.checkValidity()) {
            this.dom.form.reportValidity();
            return;
        }

        this.setLoadingState(true);

        try {
            const email = this.dom.email.value.trim();
            const password = this.dom.password.value;

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.info(`[Auth] Sucesso! UID: ${userCredential.user.uid}`);
            
            // Redirecionamento
            window.location.href = '../index.html'; 

        } catch (error) {
            this.handleAuthException(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(isLoading) {
        if (!this.dom.submitBtn) return;

        if (isLoading) {
            this.dom.submitBtn.classList.add('loading');
            this.dom.submitBtn.setAttribute('disabled', 'true');
            if (this.dom.loaderIcon) this.dom.loaderIcon.classList.remove('hidden');
        } else {
            this.dom.submitBtn.classList.remove('loading');
            this.dom.submitBtn.removeAttribute('disabled');
            if (this.dom.loaderIcon) this.dom.loaderIcon.classList.add('hidden');
        }
    }

    handleAuthException(error) {
        console.error(`[Auth Error] ${error.code}`);
        
        let msg = 'Erro ao entrar.';
        const errorMap = {
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde.'
        };

        if (errorMap[error.code]) msg = errorMap[error.code];
        this.renderError(msg);
    }

    renderError(message) {
        alert(message); 
    }
}