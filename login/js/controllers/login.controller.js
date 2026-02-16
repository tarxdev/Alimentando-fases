/**
 * LOGIN CONTROLLER - BLINDADO COM ASSEMBLY & MIGRAÇÃO INTELIGENTE
 * Arquitetura: Fallback Strategy Pattern para retrocompatibilidade de senhas.
 */
import { auth } from '../../../firebase-config.js'; 
import { AuthService } from '../services/auth.service.js';
// 1. Import do Motor de Segurança
import { asmCrypto } from '../../../mensagens/js/services/asm-loader.js';
// 2. Import para atualização de credenciais (Migração)
import { updatePassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export class LoginController {
    
    constructor() {
        this.authService = new AuthService();
        
        // Inicializa Kernel Assembly (Lazy Loading)
        asmCrypto.init();

        this.dom = {
            form: document.getElementById('loginForm'),
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            togglePasswordIcon: document.querySelector('.toggle-password'),
            submitBtn: document.getElementById('btnSubmit'),
            loaderIcon: document.querySelector('.btn-loader'),
            btnGoogle: document.getElementById('btn-google'),
            btnFacebook: document.getElementById('btn-facebook')
        };
    }

    init() {
        if (!this.dom.form) {
            console.error('[Critical] Elemento #loginForm não encontrado na DOM.');
            return;
        }
        
        this.dom.form.addEventListener('submit', (e) => this.handleLogin(e));

        if (this.dom.togglePasswordIcon) {
            this.dom.togglePasswordIcon.addEventListener('click', () => this.togglePasswordVisibility());
        }

        if (this.dom.btnGoogle) {
            this.dom.btnGoogle.addEventListener('click', () => this.handleSocialLogin('google'));
        }
        if (this.dom.btnFacebook) {
            this.dom.btnFacebook.addEventListener('click', () => this.handleSocialLogin('facebook'));
        }
    }

    togglePasswordVisibility() {
        const input = this.dom.password;
        const icon = this.dom.togglePasswordIcon;
        const isPassword = input.getAttribute('type') === 'password';
        input.setAttribute('type', isPassword ? 'text' : 'password');
        icon.classList.remove('fa-eye', 'fa-eye-slash');
        icon.classList.add(isPassword ? 'fa-eye' : 'fa-eye-slash');
    }

    /**
     * HANDLER DE LOGIN COM MIGRAÇÃO AUTOMÁTICA
     * Lógica: Secure First -> Fallback Legacy -> Auto Upgrade
     */
    async handleLogin(e) {
        e.preventDefault();
        
        if (!this.dom.form.checkValidity()) {
            this.dom.form.reportValidity();
            return;
        }

        this.setLoadingState(true);

        const email = this.dom.email.value.trim();
        const rawPassword = this.dom.password.value; // Senha digitada (input puro)
        const rememberMe = document.getElementById('rememberMe')?.checked || false;

        // 1. GERAÇÃO DO HASH SEGURO (Assembly)
        let securePassword = rawPassword;
        if (asmCrypto.isReady) {
            securePassword = asmCrypto.hashPassword(rawPassword);
        } else {
            console.warn("[SecOps] Assembly não carregado. Operando em modo degradado.");
        }

        try {
            // TENTATIVA 1: Login com Padrão Novo (Blindado)
            // Cobre usuários novos e usuários já migrados.
            await this.authService.loginEmailPassword(auth, email, securePassword, rememberMe);
            
            // Sucesso (Happy Path)
            window.location.href = '../index.html'; 

        } catch (error) {
            
            // DETECÇÃO DE USUÁRIO LEGADO
            // Se a senha blindada falhar, pode ser um usuário antigo com senha pura no banco.
            const isAuthError = error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password';
            
            if (isAuthError) {
                try {
                    console.log("⚠️ Credencial Blindada recusada. Iniciando protocolo de Migração Legada...");
                    
                    // TENTATIVA 2: Login com Padrão Antigo (Senha Pura)
                    await this.authService.loginEmailPassword(auth, email, rawPassword, rememberMe);
                    
                    // SE CHEGOU AQUI: Usuário validado com credencial antiga.
                    // AÇÃO: Atualizar DB para padrão Assembly (Self-Healing).
                    const user = auth.currentUser;
                    
                    if (user && asmCrypto.isReady) {
                        await updatePassword(user, securePassword);
                        console.log("♻️ [MIGRATION] Conta atualizada para criptografia militar com sucesso.");
                    }
                    
                    window.location.href = '../index.html';
                    return;

                } catch (legacyError) {
                    // Falha Real: A senha não bate nem com o hash nem com a pura.
                    this.handleAuthException(legacyError);
                }
            } else {
                // Erros de Rede/Bloqueio/API
                this.handleAuthException(error);
            }
        } finally {
            this.setLoadingState(false);
        }
    }

    // --- MÉTODOS AUXILIARES (UI & SOCIAL) ---

    async handleSocialLogin(provider) {
        this.setLoadingState(true);
        try {
            if (provider === 'google') await this.authService.loginGoogle(auth);
            else if (provider === 'facebook') await this.authService.loginFacebook(auth);
            window.location.href = '../index.html';
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') this.handleAuthException(error);
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
        const msg = this.authService.parseError(error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Acesso Negado',
                text: msg,
                confirmButtonColor: '#53954a'
            });
        } else {
            alert(msg);
        }
    }
}