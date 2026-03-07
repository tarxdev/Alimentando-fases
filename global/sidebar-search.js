import { searchUsersByUsername } from "../comunidade/js/services/user-search.service.js";
import { escapeHtml } from "../comunidade/js/utils/formatters.js";

/**
 * Implementação de Memoization/Debounce para otimização de renderização e mitigação de I/O na Main Thread.
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
 * Arquitetura de Apresentação: Off-Canvas Drawer.
 * O input original (Sidebar) atua como Trigger Boundary, delegando a captura léxica para o Shadow Input interno.
 */
class InstagramSearchDrawer {
    constructor(inputElement) {
        this.triggerInput = inputElement; // Nó estático da barra lateral (Gatilho)
        this.drawer = this.buildDrawer();
        
        // Caches de Árvore DOM
        this.drawerInput = this.drawer.querySelector('.insta-drawer-input'); // Nó ativo de captura
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
            
            // Reestruturação topológica: Injeção do Input Controller no Header
            drawer.innerHTML = `
                <div class="insta-drawer-header">
                    <h2>Pesquisa</h2>
                    <button class="insta-close-btn" aria-label="Fechar busca"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="insta-drawer-search-container">
                    <div class="insta-input-wrapper">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" class="insta-drawer-input" placeholder="Pesquisar..." autocomplete="off">
                    </div>
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

    /**
     * Motor de Renderização de Entidades via Fragmentação de DOM.
     */
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
            
            const avatarPath = user.photo || user.photoURL || user.avatar || user.profileImage;
            const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username || 'U')}&background=random`;
            const avatar = avatarPath || fallbackAvatar;
            
            const displayName = escapeHtml(user.name || '');
            const displayUsername = escapeHtml(user.username || 'user');

            link.innerHTML = `
                <img src="${avatar}" class="insta-avatar" loading="lazy" alt="Avatar">
                <div class="insta-user-info">
                    <span class="insta-username">@${displayUsername}</span>
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
        if (this.drawerInput.value.trim().length < 2) {
            this.renderIdleState();
        }
        // Microtask delay para Focus Trapping pós-GPU Repaint da animação CSS
        setTimeout(() => this.drawerInput.focus(), 100);
    }

    closeDrawer() {
        this.drawer.classList.remove('active');
        this.drawerInput.value = ''; // Purga de estado na desmontagem virtual
        this.triggerInput.value = '';
    }

    bindEvents() {
        const debouncedSearch = debounce((e) => this.handleSearch(e.target.value.trim()), 350);

        // O Evento de Mutação Léxica agora ocorre exclusivamente no input INJETADO na gaveta
        this.drawerInput.addEventListener('input', debouncedSearch);
        
        // O input original da Sidebar atua apenas como State Trigger e Focus Stealer
        this.triggerInput.addEventListener('focus', (e) => {
            e.preventDefault();
            this.openDrawer();
        });

        this.triggerInput.addEventListener('click', () => {
            this.openDrawer();
        });

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeDrawer());
        }

        /**
         * Mitigação de Concorrência (Race Condition): Evitar colisão de encerramento de nó.
         */
        document.addEventListener('click', (e) => {
            const isClickInsideDrawer = this.drawer.contains(e.target);
            const isClickOnAnySearchInput = e.target.closest('[data-search-drawer-initialized="true"]');
            
            if (!isClickInsideDrawer && !isClickOnAnySearchInput) {
                this.closeDrawer();
            }
        });
    }
}

function bootstrapSearch() {
    const inputs = document.querySelectorAll('.sidebar-search input, .mobile-menu-search input');
    if (inputs.length === 0) return;
    
    inputs.forEach(input => {
        // Controle de Instância Estrita (Singleton por nó)
        if (!input.dataset.searchDrawerInitialized) {
            new InstagramSearchDrawer(input);
            input.dataset.searchDrawerInitialized = 'true';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapSearch);
} else {
    bootstrapSearch();
}