import '../../global/developer-console.js';
/**
 * Entry Point: Module Initialization
 * Responsabilidade: Configuração de Auth, injeção de dependências e inicialização de controllers.
 */
import { auth, db } from './config/firebaseConfig.js'; // Ajuste o caminho conforme seu setup real
import { NotificationController } from './controllers/notificationController.js';

document.addEventListener('DOMContentLoaded', () => {
    const notificationController = new NotificationController();

    // Auth State Observer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Recuperação de dados estendidos do usuário se necessário (opcional para notificações, mas boa prática)
                // const userDoc = await db.collection('users').doc(user.uid).get();
                // const userData = userDoc.exists ? { ...userDoc.data(), uid: user.uid } : user;
                
                // Injeção de dependência do User no Controller
                notificationController.init(user);
                
                // Inicialização de scripts globais (Sidebar, Search) deve ocorrer aqui ou em um main.js separado
                // initGlobalComponents(user); 

            } catch (error) {
                console.error('[System] Falha na inicialização do contexto do usuário:', error);
            }
        } else {
            window.location.href = '../login/index.html';
        }
    });
});