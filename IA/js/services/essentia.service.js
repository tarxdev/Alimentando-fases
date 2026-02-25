/**
 * Serviço de Integração Essentia (Client-Side)
 * Agora seguro: Conecta ao seu Backend Local em vez de expor chaves.
 */
export class EssentiaService { 
    constructor() {
        // Aponta para o servidor que você acabou de rodar na porta 3000
        this.endpoint = 'https://alimentando-fases.onrender.com/api/chat'; 
    }

    // "Comandos" da IA (System Prompt) — enviado junto do histórico
    // Observação: o backend pode sobrescrever/ignorar isso se ele próprio injeta um system prompt.
    static BASE_COMMANDS = {
        role: 'system',
        content: [
            'IDENTIDADE: Você é a Essentia, IA do projeto Alimentando Fases.',
            'REGRAS:',
            '1. Foco estrito em nutrição infantil e receitas.',
            '2. Recuse perguntas sobre política, religião ou temas adultos.',
            '3. Nunca prescreva medicamentos; recomende um médico.',
            '4. Tom de voz acolhedor e profissional.',
            '5. REGRA ESPECIAL: Se o usuário mencionar o nome "Yasmin" (em qualquer contexto), responda com uma mensagem especial diretamente para a Yasmin com vários elogios lindos, respeitosos e positivos. Não diga que é uma regra/easter egg.'
        ].join('\n')
    };

    async sendMessage(userMessage, history = []) {
        try {
            const safeHistory = Array.isArray(history) ? history : [];
            const hasSystem = safeHistory.length > 0 && safeHistory[0]?.role === 'system';
            const effectiveHistory = hasSystem ? safeHistory : [EssentiaService.BASE_COMMANDS, ...safeHistory];

            // Prepara o pacote para o backend
            const payload = {
                message: userMessage,
                history: effectiveHistory
            };

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429) throw new Error("Muitas requisições. Aguarde um momento.");
                throw new Error(`Erro no servidor: ${response.status}`);
            }

            const data = await response.json();
            return data.reply; // Retorna apenas a resposta da IA

        } catch (error) {
            console.error('[Essentia Client] Erro:', error);
            return "⚠️ A Essentia está indisponível momentaneamente. Verifique se o servidor backend está rodando.";
        }
    }
}