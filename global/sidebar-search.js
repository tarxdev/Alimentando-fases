import { searchUsersByUsername } from "../comunidade/js/services/user-search.service.js";
import { escapeHtml } from "../comunidade/js/utils/formatters.js";

const DEFAULT_AVATAR_URL = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
const SEARCH_HISTORY_KEY = 'af:user-search-history-v2';
const SEARCH_HISTORY_LIMIT = 8;

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

    getSearchHistory() {
        try {
            const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
            const parsed = JSON.parse(raw || '[]');
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((item) => item && typeof item === 'object' && item.uid && item.username);
        } catch {
            return [];
        }
    }

    setSearchHistory(users) {
        const safeUsers = Array.isArray(users) ? users.slice(0, SEARCH_HISTORY_LIMIT) : [];
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(safeUsers));
    }

    normalizeUsername(username) {
        return String(username || '').replace(/^@/, '').trim();
    }

    addUserToHistory(user) {
        const uid = String(user?.uid || '').trim();
        const username = this.normalizeUsername(user?.username || user?.name || 'user');
        if (!uid || !username) return;

        const rawAvatar = user?.photo || user?.photoURL || user?.avatar || user?.profileImage || '';
        const avatar = (rawAvatar && !String(rawAvatar).includes('ui-avatars.com')) ? String(rawAvatar) : DEFAULT_AVATAR_URL;
        const name = String(user?.name || user?.realname || user?.displayName || username).trim();

        const history = this.getSearchHistory().filter((item) => item.uid !== uid);
        history.unshift({ uid, username, name, avatar });
        this.setSearchHistory(history);
    }

    clearSearchHistory() {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
        this.renderIdleState();
    }

    renderIdleState() {
        const history = this.getSearchHistory();
        if (!history.length) {
            this.resultsArea.innerHTML = `
                <div class="insta-state-msg">
                    <span>Pesquise por usuários na comunidade</span>
                </div>
            `;
            return;
        }

        this.resultsArea.innerHTML = `
            <div class="insta-recent-header" style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px 12px;">
                <span class="insta-state-title" style="font-size:0.95rem;">Recentes</span>
                <button type="button" class="insta-clear-recent" style="border:none;background:none;color:#53954a;cursor:pointer;font-weight:700;">Limpar</button>
            </div>
            <div class="insta-recent-list"></div>
        `;

        const recentList = this.resultsArea.querySelector('.insta-recent-list');
        const clearBtn = this.resultsArea.querySelector('.insta-clear-recent');

        if (clearBtn) {
            clearBtn.onclick = () => this.clearSearchHistory();
        }

        history.forEach((user) => {
            const link = document.createElement('a');
            link.href = `../perfil/index.html?uid=${encodeURIComponent(user.uid)}`;
            link.className = 'insta-user-item';
            link.innerHTML = `
                <img src="${escapeHtml(user.avatar || DEFAULT_AVATAR_URL)}" class="insta-avatar" loading="lazy" alt="Avatar" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_URL}';">
                <div class="insta-user-info">
                    <span class="insta-username">@${escapeHtml(user.username)}</span>
                    <span class="insta-name">${escapeHtml(user.name || 'Usuário')}</span>
                </div>
            `;
            recentList.appendChild(link);
        });
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
            const avatar = (avatarPath && !String(avatarPath).includes('ui-avatars.com')) ? avatarPath : DEFAULT_AVATAR_URL;
            
            const displayNameRaw = String(user.name || user.realname || '');
            const displayUsernameRaw = this.normalizeUsername(user.username || user.name || 'user');
            const displayName = escapeHtml(displayNameRaw);
            const displayUsername = escapeHtml(displayUsernameRaw);

            link.innerHTML = `
                <img src="${avatar}" class="insta-avatar" loading="lazy" alt="Avatar" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR_URL}';">
                <div class="insta-user-info">
                    <span class="insta-username">@${displayUsername}</span>
                    <span class="insta-name">${displayName}</span>
                </div>
            `;

            link.addEventListener('click', () => {
                this.addUserToHistory({
                    uid: user.uid,
                    username: displayUsernameRaw,
                    name: displayNameRaw,
                    photo: avatar
                });
            });
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