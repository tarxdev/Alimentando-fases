// backend/src/controllers/chat.controller.js
export class ChatController {
    constructor(aiService) {
        this.aiService = aiService;
    }

    async handleMessage(req, res) {
        try {
            const { message, history } = req.body;

            // Fail Fast: Validação de entrada
            if (!message || typeof message !== 'string') {
                return res.status(400).json({ error: 'Payload inválido.' });
            }

            // Sanitização do histórico
            const sanitizedHistory = Array.isArray(history) ? history.slice(-6) : [];

            // Injeção de System Persona (Imutável e invisível ao cliente)
            const systemPersona = {
                role: "system",
                content: `
                IDENTIDADE: Você é a Essentia, IA do projeto Alimentando Fases.
                REGRAS:
                1. Foco estrito em nutrição infantil e receitas.
                2. Recuse perguntas sobre política, religião ou temas adultos.
                3. Nunca prescreva medicamentos; recomende um médico.
                4. Tom de voz acolhedor e profissional.
                `
            };

            const fullContext = [systemPersona, ...sanitizedHistory, { role: "user", content: message }];
            const reply = await this.aiService.generateResponse(fullContext);

            return res.status(200).json({ reply });

        } catch (error) {
            console.error('[ChatController] Exception:', error);
            return res.status(500).json({ error: 'Erro interno no processamento.' });
        }
    }
}