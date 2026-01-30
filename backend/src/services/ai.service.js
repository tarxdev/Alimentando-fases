// backend/src/services/ai.service.js
import fetch from 'node-fetch';

export class AiService {
    constructor(config) {
        this.token = config.GITHUB_MODELS_TOKEN;
        this.endpoint = config.GITHUB_MODELS_ENDPOINT;
        // Modelo definido para GPT-4o conforme requisitos de missão crítica
        this.modelName = 'gpt-4o'; 
    }

    async generateResponse(messages) {
        const payload = {
            messages,
            model: this.modelName,
            temperature: 0.6,
            max_tokens: 1500,
            top_p: 1.0
        };

        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error(`[Upstream Error] Status: ${response.status}`);
            throw new Error('Falha na comunicação com o provedor de IA.');
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Sem resposta.";
    }
}