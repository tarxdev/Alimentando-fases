import { ChatController } from './controllers/chat.controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const chat = new ChatController();
    chat.init();
});