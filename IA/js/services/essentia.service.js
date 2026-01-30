/**
 * Serviço de Integração Essentia (Client-Side)
 * Agora seguro: Conecta ao seu Backend Local em vez de expor chaves.
 */
export class EssentiaService { 
    constructor() {
        // Aponta para o servidor que você acabou de rodar na porta 3000
        this.endpoint = 'https://alimentando-fases.onrender.com/api/chat'; 
    }

    async sendMessage(userMessage, history = []) {
        try {
            // Prepara o pacote para o backend
            const payload = {
                message: userMessage,
                history: history
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