import { escapeHtml } from '../utils/formatters.js';

/**
 * Serviço de Busca Global (In-Memory Cache Search).
 * Implementa renderização dinâmica de metadados e otimização de repintura do DOM.
 */
export class SearchService {
    constructor() {
        this.input = document.getElementById('global-search-input');
        this.dropdown = document.getElementById('search-results-dropdown');
        this.postsCache = []; // Buffer imutável da coleção de publicações
    }

    init(posts) {
        this.postsCache = posts;
        if (this.input) {
            this.input.addEventListener('input', (e) => this.handleSearch(e.target.value));
            
            // Mitigação de Concorrência: Fechamento passivo via Outside Click Listener
            document.addEventListener('click', (e) => {
                if (!this.input.contains(e.target) && !this.dropdown.contains(e.target)) {
                    this.dropdown.classList.add('hidden');
                }
            });
        }
    }

    updateCache(posts) {
        this.postsCache = posts;
    }

    handleSearch(query) {
        // Threshold estrito para evitar overhead algorítmico em buscas prematuras
        if (query.length < 2) {
            this.dropdown.classList.add('hidden');
            return;
        }

        // Normalização Lexicográfica: Bypass de Diacritics (Acentuação) e Case Sensitivity
        const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        const results = this.postsCache.filter(post => {
            const content = (post.content || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const author = (post.authorName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return content.includes(normalizedQuery) || author.includes(normalizedQuery);
        });

        this.renderResults(results);
    }

    /**
     * Motor de Renderização com injeção de DTOs de imagem e proteção contra XSS (Cross-Site Scripting).
     */
    renderResults(results) {
        this.dropdown.innerHTML = '';
        this.dropdown.classList.remove('hidden');

        // Early Return: Tratamento visual para conjuntos vazios
        if (results.length === 0) {
            this.dropdown.innerHTML = '<div style="padding:15px; text-align:center; color:#888; font-size: 0.9rem; font-weight: 500;">Nenhum resultado encontrado.</div>';
            return;
        }

        // Aplicação de DocumentFragment para agrupar mutações e delegar reflow único à Main Thread
        const fragment = document.createDocumentFragment();

        results.slice(0, 5).forEach(post => {
            const div = document.createElement('div');
            div.className = 'search-item';
            
            // Contrato de Layout Estrutural In-Line para blindagem contra sobrescritas CSS externas
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.padding = '10px 12px';
            div.style.cursor = 'pointer';
            div.style.borderBottom = '1px solid #f0f2f5';
            div.style.transition = 'background-color 0.2s ease';
            
            div.onmouseenter = () => div.style.backgroundColor = '#f8f9fa';
            div.onmouseleave = () => div.style.backgroundColor = 'transparent';

            // Resolução de Mídia (Nullish/OR fallback em cascata com mapeamento estrito)
            const authorNameRaw = post.authorName || 'Usuário';
            
            // Injeção da propriedade original do autor ('photo') para resolução de anomalias no schema NoSQL
            const avatarPath = post.authorPhoto || post.photoURL || post.photo; 
            
            // Mecanismo de Fallback em caso de payload anêmico
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorNameRaw)}&background=random`;
            const avatar = avatarPath || fallbackAvatar;

            div.innerHTML = `
                <div style="flex-shrink: 0; margin-right: 12px; display: flex;">
                    <img src="${avatar}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #eaeaea;">
                </div>
                <div class="s-info" style="display: flex; flex-direction: column; overflow: hidden; width: 100%;">
                    <span class="s-title" style="font-weight: 700; font-size: 0.95rem; color: #1a1a1a; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${escapeHtml(authorNameRaw)}</span>
                    <span class="s-desc" style="font-size: 0.85rem; color: #65676b; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${escapeHtml((post.content || "").substring(0, 45))}...</span>
                </div>
            `;
            
            // Dispatch de Evento Customizado para o Controller (Desacoplamento de UI)
            div.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('open-post-detail', { detail: post.id }));
                this.dropdown.classList.add('hidden');
            });
            
            fragment.appendChild(div);
        });

        this.dropdown.appendChild(fragment);
    }
}