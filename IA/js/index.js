import '../../global/developer-console.js';
import '../../global/sidebar-search.js'; // Injeção de Dependência do Motor de Busca (Cross-Domain)
import { ChatController } from './controllers/chat.controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const chat = new ChatController();
    chat.init();
});