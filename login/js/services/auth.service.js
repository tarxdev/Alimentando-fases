/**
 * SERVIÇO DE AUTENTICAÇÃO (Business Logic)
 * Responsável pela comunicação direta com o Firebase.
 */
import { 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    sendPasswordResetEmail,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

export class AuthService {
    
    constructor() {}

    /**
     * Login Tradicional
     */
    async loginEmailPassword(auth, email, password, rememberMe) {
        // Define persistência (Local = mantém logado após fechar aba / Session = limpa ao fechar)
        const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        
        await setPersistence(auth, persistenceType);
        return await signInWithEmailAndPassword(auth, email, password);
    }

    /**
     * Login com Google
     */
    async loginGoogle(auth) {
        const provider = new GoogleAuthProvider();
        // Customização opcional: força seleção de conta
        provider.setCustomParameters({ prompt: 'select_account' });
        
        return await signInWithPopup(auth, provider);
    }

    /**
     * Login com Facebook
     */
    async loginFacebook(auth) {
        const provider = new FacebookAuthProvider();
        return await signInWithPopup(auth, provider);
    }

    /**
     * Recuperação de Senha
     */
    async recoverPassword(auth, email) {
        return await sendPasswordResetEmail(auth, email);
    }

    /**
     * Tradutor de Erros (Firebase -> PT-BR)
     */
    parseError(error) {
        const errorCode = error.code || error;
        console.warn("Firebase Auth Error:", errorCode);

        const errors = {
            'auth/user-not-found': 'E-mail não cadastrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-email': 'Formato de e-mail inválido.',
            'auth/user-disabled': 'Conta desativada.',
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/account-exists-with-different-credential': 'Este e-mail já está associado a outra conta (ex: Google/Facebook).',
            'auth/popup-closed-by-user': 'Login cancelado.',
            'auth/popup-blocked': 'O navegador bloqueou o popup. Permita popups para entrar.',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns instantes.',
            'auth/network-request-failed': 'Sem conexão com a internet.'
        };

        return errors[errorCode] || 'Ocorreu um erro inesperado. Tente novamente.';
    }
}