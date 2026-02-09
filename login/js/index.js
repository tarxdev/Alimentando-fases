import '../../global/developer-console.js';
import { LoginController } from './controllers/login.controller.js';

document.addEventListener('DOMContentLoaded', () => {
    // Instancia e inicia a aplicação
    const app = new LoginController();
    app.init();
});