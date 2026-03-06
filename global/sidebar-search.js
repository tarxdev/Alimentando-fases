import { searchUsersByUsername } from "../comunidade/js/services/user-search.service.js";
import { escapeHtml } from "../comunidade/js/utils/formatters.js";

/**
 * Implementação de Memoization/Debounce para otimização de renderização e mitigação de I/O.
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

/**
 * Arquitetura de Apresentação: Off-Canvas Drawer (Instagram Pattern).
 * Utiliza o Portal Pattern para acoplar-se à raiz do DOM, evadindo o Clipping Context da Sidebar.
 */
class InstagramSearchDrawer {
    constructor(inputElement) {
        this.input = inputElement;
        this.drawer = this.buildDrawer();
        this.resultsArea = this.drawer.querySelector('.insta-results-area');
        this.closeBtn = this.drawer.querySelector('.insta-close-btn');
        
        this.bindEvents();
    }

    buildDrawer() {
        let drawer = document.getElementById('insta-search-drawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'insta-search-drawer';
            drawer.className = 'insta-search-drawer';
            drawer.innerHTML = `
                <div class="insta-drawer-header">
                    <h2>Pesquisa</h2>
                    <button class="insta-close-btn" aria-label="Fechar busca"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="insta-drawer-body">
                    <div class="insta-results-area"></div>
                </div>
            `;
            // Portal: Renderização no top-level document para bypass de z-index limitados
            document.body.appendChild(drawer); 
        }
        return drawer;
    }

    async handleSearch(term) {
        if (term.length < 2) {
            this.renderIdleState();
            return;
        }

        this.renderLoadingState();

        try {
            const sanitizedTerm = term.replace(/^@/, '');
            const users = await searchUsersByUsername(sanitizedTerm);
            this.renderResults(users, sanitizedTerm);
        } catch (error) {
            console.error('[SearchDrawer] Falha de Injeção de Dependência/API:', error);
            this.renderErrorState();
        }
    }

    renderIdleState() {
        this.resultsArea.innerHTML = `
            <div class="insta-state-msg">
                <span>Pesquise por usuários na comunidade</span>
            </div>
        `;
    }

    renderLoadingState() {
        this.resultsArea.innerHTML = `
            <div class="insta-loader-container">
                <div class="insta-spinner"></div>
            </div>
        `;
    }

    renderResults(users, term) {
        this.resultsArea.innerHTML = '';

        if (!users || users.length === 0) {
            this.resultsArea.innerHTML = `
                <div class="insta-state-msg">
                    <span class="insta-state-title">Nenhum resultado</span>
                    <span class="insta-state-desc">Não encontramos "@${escapeHtml(term)}"</span>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        users.forEach(user => {
            const link = document.createElement('a');
            link.href = `../perfil/index.html?uid=${user.uid}`;
            link.className = 'insta-user-item';
            
            const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`;
            const displayName = escapeHtml(user.name || '');
            const displayUsername = escapeHtml(user.username || user.name);

            link.innerHTML = `
                <img src="${avatar}" class="insta-avatar" loading="lazy" alt="Avatar">
                <div class="insta-user-info">
                    <span class="insta-username">${displayUsername}</span>
                    <span class="insta-name">${displayName}</span>
                </div>
            `;
            fragment.appendChild(link);
        });

        this.resultsArea.appendChild(fragment);
    }

    renderErrorState() {
        this.resultsArea.innerHTML = `
            <div class="insta-state-msg error">
                <span>Falha na sincronização com o servidor.</span>
            </div>
        `;
    }

    openDrawer() {
        this.drawer.classList.add('active');
        if (this.input.value.trim().length < 2) {
            this.renderIdleState();
        }
    }

    closeDrawer() {
        this.drawer.classList.remove('active');
    }

    bindEvents() {
        const debouncedSearch = debounce((e) => this.handleSearch(e.target.value.trim()), 350);

        this.input.addEventListener('input', debouncedSearch);
        
        this.input.addEventListener('focus', () => {
            this.openDrawer();
            if (this.input.value.trim().length >= 2) {
                this.handleSearch(this.input.value.trim());
            }
        });

        // Delegação centralizada para fechamento
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeDrawer());
        }

        /**
         * Correção de Concorrência (Race Condition): 
         * Mitigação de conflito entre múltiplas instâncias validando a presença do 
         * data-attribute do Factory (bootstrapSearch) na cadeia de propagação do evento.
         */
        document.addEventListener('click', (e) => {
            const isClickInsideDrawer = this.drawer.contains(e.target);
            
            // Verifica se o clique partiu de QUALQUER input de pesquisa inicializado no DOM
            const isClickOnAnySearchInput = e.target.closest('[data-search-drawer-initialized="true"]');
            
            if (!isClickInsideDrawer && !isClickOnAnySearchInput) {
                this.closeDrawer();
            }
        });
    }
}

/**
 * Bootstrap Resiliente: Avalia o estado da Main Thread para garantir execução segura em ES Modules.
 */
function bootstrapSearch() {
    const inputs = document.querySelectorAll('.sidebar-search input, .mobile-menu-search input');
    if (inputs.length === 0) return;
    
    inputs.forEach(input => {
        // Previne vazamento de memória com múltiplas instâncias no mesmo nó
        if (!input.dataset.searchDrawerInitialized) {
            new InstagramSearchDrawer(input);
            input.dataset.searchDrawerInitialized = 'true';
        }
    });
}

// Resolução da Race Condition do evento DOMContentLoaded em scripts module
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapSearch);
} else {
    bootstrapSearch();
}