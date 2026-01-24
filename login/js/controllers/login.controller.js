/**
 * LOGIN CONTROLLER
 * Gerencia a UI e interações do usuário.
 */
import { auth } from '../../../firebase-config.js'; 
import { AuthService } from '../services/auth.service.js';

export class LoginController {
    
    constructor() {
        this.authService = new AuthService();
        
        // Mapeamento do DOM
        this.dom = {
            form: document.getElementById('loginForm'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            togglePasswordIcon: document.querySelector('.toggle-password'),
            submitBtn: document.getElementById('btnSubmit'),
            loaderIcon: document.querySelector('.btn-loader'),
            
            // Botões Sociais (IDs definidos no HTML novo)
            btnGoogle: document.getElementById('btn-google'),
            btnFacebook: document.getElementById('btn-facebook')
        };
    }

    init() {
        if (!this.dom.form) {
            console.error('[Critical] Elemento #loginForm não encontrado.');
            return;
        }
        
        // Listener do Login Tradicional
        this.dom.form.addEventListener('submit', (e) => this.handleLogin(e));

        // Listener do Olho (Senha)
        if (this.dom.togglePasswordIcon) {
            this.dom.togglePasswordIcon.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Listeners Sociais
        if (this.dom.btnGoogle) {
            this.dom.btnGoogle.addEventListener('click', () => this.handleSocialLogin('google'));
        }
        if (this.dom.btnFacebook) {
            this.dom.btnFacebook.addEventListener('click', () => this.handleSocialLogin('facebook'));
        }
    }

    // Alterna visibilidade da senha
    togglePasswordVisibility() {
        const input = this.dom.password;
        const icon = this.dom.togglePasswordIcon;
        const isPassword = input.getAttribute('type') === 'password';

        input.setAttribute('type', isPassword ? 'text' : 'password');
        icon.classList.remove('fa-eye', 'fa-eye-slash');
        icon.classList.add(isPassword ? 'fa-eye' : 'fa-eye-slash');
    }

    // Handler: Login Email/Senha
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
            const rememberMe = document.getElementById('rememberMe')?.checked || false;

            await this.authService.loginEmailPassword(auth, email, password, rememberMe);
            
            // Sucesso -> Redireciona
            window.location.href = '../index.html'; 

        } catch (error) {
            this.handleAuthException(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Handler: Login Social
    async handleSocialLogin(provider) {
        this.setLoadingState(true);
        try {
            if (provider === 'google') {
                await this.authService.loginGoogle(auth);
            } else if (provider === 'facebook') {
                await this.authService.loginFacebook(auth);
            }
            
            console.info(`[Auth] Login via ${provider} realizado com sucesso.`);
            window.location.href = '../index.html';

        } catch (error) {
            // Se o usuário fechar o popup, não mostramos erro crítico
            if (error.code !== 'auth/popup-closed-by-user') {
                this.handleAuthException(error);
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    // UI: Controle de Estado de Carregamento
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

    // UI: Exibição de Erros
    handleAuthException(error) {
        const msg = this.authService.parseError(error);
        
        // Se tiver SweetAlert (Swal) disponível, usa ele. Se não, alert nativo.
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Ops!',
                text: msg,
                confirmButtonColor: '#53954a'
            });
        } else {
            alert(msg);
        }
    }
}