// backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AiService } from './services/ai.service.js';
import { ChatController } from './controllers/chat.controller.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();

// Middlewares de Segurança
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); 
app.use(express.json());

// Injeção de Dependência (IoC)
const aiService = new AiService(process.env);
const chatController = new ChatController(aiService);

// Rota
app.post('/api/chat', (req, res) => chatController.handleMessage(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[Server] Running on port ${PORT}`));