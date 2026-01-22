/**
 * Serviço de Integração com Giphy API
 */

// SUA CHAVE DE API (CONFIGURADA)
const YOUR_API_KEY = 'Mnlz1Z1P0Bd2m1x6D9170bCN9bDOguld'; 

export class GiphyService {
    constructor() {
        this.apiKey = YOUR_API_KEY;
        this.baseUrl = 'https://api.giphy.com/v1/gifs';
    }

    async search(query, limit = 20) {
        if (!query) return [];
        try {
            const url = `${this.baseUrl}/search?api_key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g&lang=pt`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erro Giphy');
            const data = await response.json();
            return this._mapResults(data.data);
        } catch (error) {
            console.error('[Giphy] Erro busca:', error);
            return [];
        }
    }

    async getTrending(limit = 20) {
        try {
            const url = `${this.baseUrl}/trending?api_key=${this.apiKey}&limit=${limit}&rating=g`;
            const response = await fetch(url);
            const data = await response.json();
            return this._mapResults(data.data);
        } catch (error) {
            console.error('[Giphy] Erro trending:', error);
            return [];
        }
    }

    _mapResults(items) {
        if (!items) return [];
        return items.map(gif => ({
            id: gif.id,
            title: gif.title,
            previewUrl: gif.images.fixed_height_small.url,
            fullUrl: gif.images.original.url
        }));
    }
}