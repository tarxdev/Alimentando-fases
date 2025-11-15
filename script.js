// Seu script.js COMPLETO (com TODAS as correções de Menu e Navegação)

// *** (V25.5) CORREÇÃO Scroll-on-Refresh ***
if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
}
// *** FIM DA CORREÇÃO ***


// --- 2. LÓGICA DO MENU MOBILE ---
const burger = document.querySelector('.main-header__burger');
const navWrapper = document.querySelector('.main-header__navigation-wrapper');

function toggleMobileMenu() {
    if (!burger || !navWrapper) return;
    burger.classList.toggle('active');
    navWrapper.classList.toggle('open');
}

function closeMobileMenu() {
    if (!burger || !navWrapper) return;
    burger.classList.remove('active');
    navWrapper.classList.remove('open');
}

if (burger) {
    burger.addEventListener('click', toggleMobileMenu);
}


// --- 3. LÓGICA DO MEGA MENU (Desktop) ---
// Este bloco agora vem ANTES da Lógica de Navegação
const menuItems = document.querySelectorAll('.main-header__list-item.has-submenu');
const mainHeader = document.querySelector('.main-header'); // Para "click outside"

// Função de hover para os TABS internos (Isso não muda)
const handleSubmenuLinkHover = (event) => {
    const subLink = event.currentTarget;
    const parentMenuItem = subLink.closest('.main-header__list-item.has-submenu');
    if (!parentMenuItem) return;

    const allSubmenuLinks = parentMenuItem.querySelectorAll('.submenu-list__item.has-submenu');
    const allSubmenuContents = parentMenuItem.querySelectorAll('.submenu-content');

    allSubmenuLinks.forEach(sl => sl.classList.remove('active'));
    allSubmenuContents.forEach(sc => sc.classList.remove('active'));

    subLink.classList.add('active');
    const contentKeyElement = subLink.querySelector('.submenu-list__item-title');
    if (contentKeyElement) {
        const firstContentKey = contentKeyElement.textContent;
        const targetContent = parentMenuItem.querySelector(`.submenu-content[data-submenu-for="${firstContentKey}"]`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }
};

// Função para FECHAR um menu
function closeMenu(item) {
    item.classList.remove('js-hover'); // 'js-hover' é a nossa classe que significa "aberto"
    item.classList.add('is-closing'); // Ativa a animação de fechamento
    const submenuLinks = item.querySelectorAll('.submenu-list__item.has-submenu');
    submenuLinks.forEach((subLink) => {
        subLink.removeEventListener('mouseenter', handleSubmenuLinkHover);
    });

    // --- INÍCIO DA CORREÇÃO (NÍVEL 1) ---
    // Fecha o acordeão no mobile

    // 👇 CORREÇÃO ADICIONADA: SÓ EXECUTA NO MOBILE 👇
    const burger = document.querySelector('.main-header__burger');
    if (burger && getComputedStyle(burger).display === 'flex') {
        const submenuWrapper = item.querySelector('.submenu-wrapper');
        if (submenuWrapper) {
            submenuWrapper.style.maxHeight = null;
        }
    } // 👈 FIM DA CONDIÇÃO

    // --- FIM DA CORREÇÃO ---
}

// Função para ABRIR um menu (VERSÃO CORRIGIDA)
function openMenu(item) {
    // 2. Abre ESTE menu
    item.classList.remove('is-closing');
    item.classList.add('js-hover'); // Ativa a cor verde e a abertura (via CSS)

    // --- INÍCIO DA CORREÇÃO (LÓGICA DE ACORDEÃO L1 MOBILE) ---
    // Abre o acordeão no mobile (L1)
    const burger = document.querySelector('.main-header__burger');
    if (burger && getComputedStyle(burger).display === 'flex') {
        const submenuWrapper = item.querySelector('.submenu-wrapper');
        if (submenuWrapper) {
            // Usa scrollHeight para definir a altura exata do conteúdo
            // (O CSS que adicionamos no Passo 1 garante que o scrollHeight seja o valor total)
            submenuWrapper.style.maxHeight = submenuWrapper.scrollHeight + "px";
        }
    }
    // --- FIM DA CORREÇÃO ---

    // 3. Lógica interna (ativar primeiro tab - APENAS DESKTOP)
    const submenuLinks = item.querySelectorAll('.submenu-list__item.has-submenu');
    const submenuContents = item.querySelectorAll('.submenu-content');

    // 👇 CORREÇÃO ADICIONADA: SÓ EXECUTA NO DESKTOP 👇
    // (Impede que a lógica de "abas" ative no mobile)
    const burgerCheck = document.querySelector('.main-header__burger');
    if (!burgerCheck || getComputedStyle(burgerCheck).display === 'none') {
        setTimeout(() => {
            submenuLinks.forEach(sl => sl.classList.remove('active'));
            submenuContents.forEach(sc => sc.classList.remove('active'));

            if (submenuLinks.length > 0) {
                const firstSubLink = submenuLinks[0];
                firstSubLink.classList.add('active');
                const firstContentKeyElement = firstSubLink.querySelector('.submenu-list__item-title');
                if (firstContentKeyElement) {
                    const firstContentKey = firstContentKeyElement.textContent;
                    const firstContent = item.querySelector(`.submenu-content[data-submenu-for="${firstContentKey}"]`);
                    if (firstContent) firstContent.classList.add('active');
                }
            }
        }, 0); // Timeout 0
    } // 👈 FIM DA CONDIÇÃO

    // 4. Adiciona listeners (separados para Desktop e Mobile)
    submenuLinks.forEach((subLink) => {

        // LÓGICA DE HOVER (DESKTOP)
        // (A função 'handleSubmenuLinkHover' está definida fora, isso está correto)
        subLink.addEventListener('mouseenter', handleSubmenuLinkHover);

        // LÓGICA DE CLIQUE (AGORA SIMPLIFICADA)
        subLink.addEventListener('click', (e) => {
            const burger = document.querySelector('.main-header__burger');

            // Checa se NÃO é mobile (desktop)
            if (burger && getComputedStyle(burger).display !== 'flex') {
                // É DESKTOP: Apenas fecha o menu principal ao clicar
                const mainMenuItem = subLink.closest('.main-header__list-item.has-submenu');
                if (mainMenuItem) {
                    closeMenu(mainMenuItem);
                }
                // Deixa o link navegar (não usa preventDefault)
                return;
            }

            // === INÍCIO DA CORREÇÃO MOBILE (SIMPLIFICAÇÃO) ===
            // É MOBILE. O link <a> dentro deste <li> (subLink) 
            // será pego pelo listener 'navLinks' (Lógica 1. SPA).
            // Nós NÃO queremos e.preventDefault() no <li>.
            // Nós NÃO queremos o L2 Accordion.

            // Apenas fechamos os menus. O clique no <a> interno
            // (que é um nav-link) vai cuidar da navegação.

            // 1. Fecha o menu mobile principal (a gaveta)
            closeMobileMenu();

            // 2. Fecha o L1 accordion (Fases da Vida)
            const mainMenuItem = subLink.closest('.main-header__list-item.has-submenu');
            if (mainMenuItem) {
                closeMenu(mainMenuItem);
            }
            // === FIM DA CORREÇÃO MOBILE ===
        });
    });
}


// --- Loop principal de setup do menu ---
menuItems.forEach(item => {
    const link = item.querySelector(':scope > a');
    const submenuWrapper = item.querySelector('.submenu-wrapper');

    if (!link || !submenuWrapper) return;

    // ===============================================
    // LÓGICA DE CLIQUE (COM CORREÇÃO DE SCROLL)
    // ===============================================

    // 1. CLIQUE NO LINK PRINCIPAL (Ex: "Fases da Vida")
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o link de navegar (#)
        e.stopPropagation(); // <-- Impede o clique de "vazar" para o document

        // Verifica o estado do item clicado
        const wasOpen = item.classList.contains('js-hover');

        // 1. Fecha TODOS OS OUTROS menus
        menuItems.forEach(otherItem => {
            if (otherItem !== item) { // Só fecha os que NÃO são o item clicado
                closeMenu(otherItem);
            }
        });

        // 2. Faz o toggle no item clicado
        if (wasOpen) {
            closeMenu(item); // Se estava aberto, fecha
        } else {
            openMenu(item); // Se estava fechado, abre

            // --- INÍCIO DA CORREÇÃO DE SCROLL DO ACORDEÃO MOBILE ---
            const burger = document.querySelector('.main-header__burger');
            // Verifica se está no mobile e se o navWrapper existe (definido lá em cima)
            if (navWrapper && burger && getComputedStyle(burger).display === 'flex') {
                // Espera a animação de max-height começar
                setTimeout(() => {
                    // Calcula a posição do item (<li>) relativo ao topo do navWrapper
                    const itemTop = item.offsetTop;
                    // Pega o padding-top do navWrapper (definido no CSS como 20px)
                    const containerPaddingTop = parseFloat(window.getComputedStyle(navWrapper).paddingTop) || 0;

                    // Rola o navWrapper para que o topo do item
                    // fique no topo do container (descontando o padding)
                    navWrapper.scrollTo({
                        top: itemTop - containerPaddingTop,
                        behavior: 'smooth'
                    });
                }, 50); // 50ms de delay
            }
            // --- FIM DA CORREÇÃO DE SCROLL ---
        }
    });

    // 2. CLIQUE DENTRO DO PAINEL DO SUBMENU
    submenuWrapper.addEventListener('click', (e) => {
        e.stopPropagation(); // <-- Impede que cliques *dentro* do menu fechem ele.
    });

    // ===============================================
    // FIM DA CORREÇÃO
    // ===============================================

    // Lógica de acessibilidade (focus) - ainda útil
    const focusableElements = Array.from(item.querySelectorAll('a, button'));
    if (focusableElements.length > 0) {
        const lastElement = focusableElements[focusableElements.length - 1];
        const firstElement = focusableElements[0];
        firstElement.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.key === 'Tab') {
                closeMenu(item);
            }
        });
        lastElement.addEventListener('keydown', (e) => {
            if (!e.shiftKey && e.key === 'Tab') {
                closeMenu(item);
            }
        });
        item.addEventListener('focusout', (e) => {
            if (!item.contains(e.relatedTarget)) {
                closeMenu(item);
            }
        });
    }
});

// LÓGICA DE CLICAR FORA (Click Outside) - Mantida
document.addEventListener('click', (e) => {
    menuItems.forEach(menuItem => {
        closeMenu(menuItem);
    });
});


// --- 1. LÓGICA DE NAVEGAÇÃO (SPA) ---
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page-content');
const appContainer = document.getElementById('app-container');

// =======================================================
// ✅ FUNÇÃO navigateTo ATUALIZADA (com correção de scroll no início)
// =======================================================
function navigateTo(pageId, anchorId = null) { // <-- 1. PARÂMETRO ADICIONADO

    // ** CORREÇÃO CHAVE: Rola para o topo IMEDIATAMENTE antes de tudo. **
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Esconde todas as páginas
    pages.forEach(page => page.classList.remove('active'));

    // Mostra a página correta
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        // Se não achar, volta pra home
        pageId = 'home'; // Garante que o pageId seja 'home'
        document.getElementById('home').classList.add('active');
    }

    // --- LÓGICA DE INICIALIZAÇÃO SOB DEMANDA (OTIMIZAÇÃO TBT) ---
    // Esta lógica agora carrega os scripts APENAS da página que está sendo aberta.
    if (pageId === 'home') {
        setupHeroCarousel();
    }
    else if (pageId === 'adolescencia') {
        if (typeof WordSearchGame !== 'undefined' && WordSearchGame.init) {
            setTimeout(() => { WordSearchGame.init(); }, 100);
        } else {
            console.warn('WordSearchGame não está pronto para iniciar.');
        }
    }
    else if (pageId === 'infancia') {
        if (typeof EmbeddedClassifyGame !== 'undefined' && EmbeddedClassifyGame.init) {
            setTimeout(() => { EmbeddedClassifyGame.init(); }, 100);
        } else {
            console.warn('EmbeddedClassifyGame não está pronto para iniciar.');
        }
    }
    else if (pageId === 'receitas') {
        if (typeof setupRecipeFilters !== 'undefined') {
            setTimeout(() => { setupRecipeFilters(); }, 100);
        } else {
            console.warn('setupRecipeFilters não está pronto para iniciar.');
        }
    }
    else if (pageId === 'adulto') {
        setupSnackPlanner();
        animateChartBars();
    }
    else if (pageId === 'idoso') {
        setupHydrationCalculator();
    }
    else if (pageId === 'higiene') {
        setupHandwashGuide();
    }
    else if (pageId === 'origem-alimentar') {
        setupOriginMap();
    }
    // --- FIM DA LÓGICA DE INICIALIZAÇÃO ---


    // *** 2. LÓGICA DE ROLAGEM MODIFICADA ***
    if (anchorId) {
        // Se uma âncora foi fornecida (ex: #infancia-quiz)
        const targetElement = document.querySelector(anchorId); // <--- O BUG ACONTECIA AQUI
        if (targetElement) {
            // Espera um instante para a página renderizar e rola suavemente
            setTimeout(() => {
                // Ajuste de 90px para compensar o header fixo
                const headerOffset = 90;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }, 50); // 50ms é geralmente suficiente
        } else {
            // Se não achar a âncora, rola para o topo
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        // Comportamento padrão: rola para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // *** FIM DA MODIFICAÇÃO DE ROLAGEM ***

    // Fecha o menu mobile (já existia)
    closeMobileMenu();

    // (V25.4) Fechamento de mega-menus
    if (menuItems && typeof closeMenu === 'function') {
        menuItems.forEach(menuItem => {
            closeMenu(menuItem);
        });
    }

    // ******** INÍCIO DA CORREÇÃO (DUPLA) ********
    // Dá um pequeno tempo (10ms) para o DOM atualizar o display:block
    // antes de forçar o ScrollTrigger a recalcular as posições.
    if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 10);
    }
    // ******** FIM DA CORREÇÃO ********
}

// =======================================================
//   ✅ NOVO OUVINTE PARA O CHATBOT
// =======================================================
// Este ouvinte "escuta" o pedido de navegação vindo do
// arquivo 'gemini-chat.js' e chama a função navigateTo.
document.addEventListener('navigateRequest', (e) => {
    const { pageId, anchorId } = e.detail;
    if (pageId) {
        navigateTo(pageId, anchorId);
    }
});
// =======================================================
//   FIM DO NOVO OUVINTE
// =======================================================


// =======================================================
// =======================================================
// INÍCIO DA CORREÇÃO DE NAVEGAÇÃO (ANTI-querySelector('#'))
// =======================================================
// =======================================================

// NOVO LISTENER COMBINADO para TODOS os .nav-link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const pageId = link.dataset.page;
        if (!pageId) return; // Se não tem data-page, não é um link de navegação SPA

        e.preventDefault(); // Previne a navegação padrão (ex: href="#")

        const href = link.getAttribute('href');
        let anchorId = null;

        // Verifica se é um link de âncora VÁLIDO (começa com # e não é SÓ #)
        if (href && href.startsWith('#') && href.length > 1) {
            anchorId = href;
        }

        // Chama a navegação
        navigateTo(pageId, anchorId); // Se for só "#", anchorId será null (correto)

        // Fecha menus (código de conveniência)
        closeMobileMenu();

        // (V25.4) Fechamento de mega-menus
        if (menuItems && typeof closeMenu === 'function') {
            menuItems.forEach(menuItem => {
                closeMenu(menuItem);
            });
        }
    });
});

// Os listeners antigos 'navLinks.forEach' e 'scrollLinks.forEach' foram
// substituídos pelo bloco único acima, corrigindo o bug do querySelector.

// =======================================================
// =======================================================
// FIM DA CORREÇÃO DE NAVEGAÇÃO
// =======================================================
// =======================================================


// =======================================================
// ✅ NOVA LÓGICA DO CARROSSEL DO HERO
// =======================================================
function setupHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.carousel-dots button');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    const nextBtn = document.querySelector('.carousel-nav.next');

    if (slides.length <= 1) { // Se não houver slides ou só 1, não faz nada
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (dots.length > 0) document.querySelector('.carousel-dots').style.display = 'none';
        return;
    }

    let currentSlide = 0;
    let slideInterval;

    function showSlide(n) {
        // Ajusta o índice para loop
        if (n >= slides.length) { n = 0; }
        if (n < 0) { n = slides.length - 1; }

        // Remove 'active' de todos
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Adiciona 'active' ao slide e dot corretos
        slides[n].classList.add('active');
        dots[n].classList.add('active');

        currentSlide = n;
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Event Listeners para os botões
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetInterval();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetInterval();
        });
    }

    // Event Listeners para os pontos
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetInterval();
        });
    });

    // Autoplay
    function startInterval() {
        slideInterval = setInterval(nextSlide, 5000); // Muda de slide a cada 5 segundos
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    showSlide(0); // Mostra o primeiro slide
    startInterval(); // Inicia o autoplay
}
// =======================================================
// FIM DO CÓDIGO DO CARROSSEL
// =======================================================


// =======================================================
// GRÁFICO DE BARRAS (SEÇÃO ADULTO) - AGORA COM ANIMAÇÃO
// =======================================================
function animateChartBars() {
    const charts = document.querySelectorAll('.interactive-chart');

    charts.forEach(chart => {
        const bars = chart.querySelectorAll('.chart-bar');

        // 1. Define o estado inicial (largura 0)
        if (typeof gsap !== 'undefined') {
            gsap.set(bars, {
                width: "0%",
                autoAlpha: 1
            });

            // 2. Cria o gatilho (ScrollTrigger) para animar
            ScrollTrigger.create({
                trigger: chart, // O gatilho é o próprio gráfico
                start: "top 80%", // Começa quando 80% do gráfico estiver visível
                once: true, // Anima apenas uma vez
                onEnter: () => {
                    // Anima as barras para o valor final
                    gsap.to(bars, {
                        duration: 1.5, // Duração da animação
                        width: (i, target) => target.dataset.value.replace(',', '.') + "%",
                        ease: "power2.out", // Efeito de desaceleração
                        stagger: 0.1 // Atraso entre cada barra
                    });
                }
            });
        } else {
            // Fallback se o GSAP não carregar: apenas mostra as barras
            bars.forEach(bar => {
                bar.style.width = bar.dataset.value.replace(',', '.') + "%";
            });
        }
    });
}

// --- 5. LÓGICA DE ANIMAÇÃO (GSAP) ---
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    // A chamada da animação do gráfico foi movida para o final (DOMContentLoaded)

    function animateFrom(elem, direction = 1, distance = 50) {
        let y = direction * distance;
        gsap.fromTo(elem, { y: y, autoAlpha: 0 }, {
            duration: 1.25,
            y: 0,
            autoAlpha: 1,
            ease: "expo.out",
            overwrite: "auto"
        });
    }

    function hide(elem) {
        gsap.set(elem, { autoAlpha: 0 });
    }

    // *** MELHORIA SCROLL REVEAL (Vem de Baixo/Esquerda/Direita) ***

    gsap.utils.toArray(".gs_reveal").forEach(function (elem) {
        hide(elem); // Começa escondido

        let direction = 1; // Padrão: Vir de baixo (y: 50)
        let distance = 50;

        // Animação para X (Esquerda/Direita)
        if (elem.classList.contains('gs_reveal_fromLeft') || elem.classList.contains('gs_reveal_fromRight')) {

            const xDistance = elem.classList.contains('gs_reveal_fromLeft') ? -100 : 100;

            // Cria uma animação específica para vir da lateral (X)
            ScrollTrigger.create({
                trigger: elem,
                start: "top 85%",
                once: true,
                onEnter: () => {
                    gsap.fromTo(elem, { x: xDistance, autoAlpha: 0 }, {
                        duration: 1.25,
                        x: 0,
                        autoAlpha: 1,
                        ease: "expo.out",
                        overwrite: "auto"
                    });
                }
            });
            return; // Pula o ScrollTrigger padrão
        }

        // ScrollTrigger Padrão (Vem de baixo - Y)
        ScrollTrigger.create({
            trigger: elem,
            start: "top 85%",
            once: true,
            onEnter: () => animateFrom(elem, direction, distance),
            markers: false
        });
    });

    // *** FIM DA MELHORIA SCROLL REVEAL ***

    const topicBlocks = gsap.utils.toArray('#adolescencia .topic-block');
    if (topicBlocks.length > 0) {
        gsap.set(topicBlocks, { autoAlpha: 0, y: 50 });

        ScrollTrigger.create({
            trigger: "#adolescencia .topic-container",
            start: "top 75%",
            end: "bottom 25%",
            markers: false,
            onEnter: () => {
                gsap.to(topicBlocks, {
                    duration: 0.8,
                    autoAlpha: 1,
                    y: 0,
                    stagger: 0.15,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            },
            onLeaveBack: () => {
                gsap.set(topicBlocks, { autoAlpha: 0, y: 50 });
            }
        });
    }

}

// --- 6. LÓGICA DO CARROSSEL 3D (NUTRIENTES) ---
const carouselWrapperNutrients = document.querySelector('#adolescencia .carousel-wrapper');
const gridNutrients = document.querySelector('#adolescencia .grid-nutrients');
const cardsNutrients = document.querySelectorAll('#adolescencia .flip-card');
const prevButtonNutrients = document.querySelector('#adolescencia .prev-card');
const nextButtonNutrients = document.querySelector('#adolescencia .next-card');

if (carouselWrapperNutrients && gridNutrients && cardsNutrients.length > 0 && prevButtonNutrients && nextButtonNutrients) {
    let currentIndexNutrients = 0;
    const totalCardsNutrients = cardsNutrients.length;
    const gapNutrients = parseFloat(window.getComputedStyle(gridNutrients).gap) || 30;

    function getCardWidth() {
        if (cardsNutrients.length > 0) {
            return cardsNutrients[0].offsetWidth;
        }
        return 0;
    }

    function updateNutrientsCarousel() {
        const cardWidth = getCardWidth();
        if (cardWidth === 0) {
            setTimeout(updateNutrientsCarousel, 100);
            return;
        }

        const wrapperWidth = carouselWrapperNutrients.clientWidth;
        const visibleCards = Math.max(1, Math.floor((wrapperWidth + gapNutrients) / (cardWidth + gapNutrients)));
        const maxIndex = Math.max(0, totalCardsNutrients - visibleCards);

        if (currentIndexNutrients > maxIndex) {
            currentIndexNutrients = maxIndex;
        }

        const totalGridWidth = (cardWidth * totalCardsNutrients) + (gapNutrients * (totalCardsNutrients - 1));
        const maxScroll = Math.max(0, totalGridWidth - wrapperWidth);
        let targetOffset = currentIndexNutrients * (cardWidth + gapNutrients);

        if (targetOffset > maxScroll) {
            targetOffset = maxScroll;
        }

        gridNutrients.style.transform = `translateX(-${targetOffset}px)`;
        gridNutrients.style.transition = 'transform 0.5s ease-out';

        prevButtonNutrients.disabled = currentIndexNutrients === 0;
        nextButtonNutrients.disabled = targetOffset >= (maxScroll - 1);
    }

    prevButtonNutrients.addEventListener('click', () => {
        if (currentIndexNutrients > 0) {
            currentIndexNutrients--;
            updateNutrientsCarousel();
        }
    });

    nextButtonNutrients.addEventListener('click', () => {
        if (!nextButtonNutrients.disabled) {
            currentIndexNutrients++;
            updateNutrientsCarousel();
        }
    });

    window.addEventListener('resize', () => {
        gridNutrients.style.transition = 'none';
        updateNutrientsCarousel();
    });

    setTimeout(updateNutrientsCarousel, 50);

} else if (prevButtonNutrients && nextButtonNutrients) {
    prevButtonNutrients.style.display = 'none';
    nextButtonNutrients.style.display = 'none';
}


/* =======================================================
 * CONTROLE GERAL DOS JOGOS
 * ======================================================= */

function showGameCover() {
    document.body.classList.remove('game-modal-open');
    document.querySelectorAll('.game-container-wrapper').forEach(container => {
        container.classList.remove('active');
    });
    document.querySelectorAll('.game-modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
}

function launchGame(containerId, gameInitializerFunction) {
    document.body.classList.add('game-modal-open');

    document.querySelectorAll('.game-container-wrapper').forEach(container => {
        if (container.id !== containerId) {
            container.classList.remove('active');
        }
    });

    const gameContainer = document.getElementById(containerId);
    if (gameContainer) {
        gameContainer.classList.add('active');

        const gameArea = gameContainer.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.add('active');
        } else {
            console.warn(`Área de jogo não encontrada dentro de #${containerId}`);
        }

        if (gameInitializerFunction && typeof gameInitializerFunction === 'function') {
            try {
                gameInitializerFunction();
            } catch (error) {
                console.error(`Erro ao inicializar o jogo ${containerId}:`, error);
                showGameCover();
            }
        } else {
            console.warn(`Função de inicialização para ${containerId} não fornecida ou inválida.`);
        }

    } else {
        console.error(`Container do jogo "${containerId}" não encontrado.`);
        document.body.classList.remove('game-modal-open');
    }
}

// --- Anexando os Event Listeners ---

// Jogo de Classificar (Embutido na página Infância)
document.querySelector('#classify-game-area-embedded .game-restart-btn')?.addEventListener('click', () => {
    if (typeof EmbeddedClassifyGame !== 'undefined' && EmbeddedClassifyGame.init) EmbeddedClassifyGame.init();
});


// ===============================================
// ==== ✂️ LÓGICA DA CALCULADORA REINSERIDA ✂️ =====
// ===============================================

/* =======================================================
 * 14. LÓGICA DA CALCULADORA DE HIDRATAÇÃO (IDOSO) - COM ANIMAÇÃO GSAP
 * ======================================================= */
function setupHydrationCalculator() {
    // 1. Selecionar todos os elementos
    const calcContainer = document.getElementById('hydration-calculator');
    if (!calcContainer) return; // Se não estiver na página, sai

    const btnMenos = document.getElementById('btn-peso-menos');
    const btnMais = document.getElementById('btn-peso-mais');
    const displayPeso = document.getElementById('display-peso');

    const ageButtons = document.querySelectorAll('.age-button');
    const btnCalcular = document.getElementById('calcHidratacaoBtn');

    const displayLitros = document.getElementById('calcLitros');
    const displayCopos = document.getElementById('calcCopos');
    const displayDisclaimer = document.getElementById('calc-disclaimer');

    // 2. Definir valores iniciais
    let currentPeso = 70;
    let currentMlPorKg = 30; // Padrão para "Adultos (55-65)" que está ativo no HTML
    let currentAnimation = null; // Para controlar a animação do número

    // 3. Funções de Lógica

    // Atualiza o peso na tela
    function updatePesoDisplay() {
        if (displayPeso) displayPeso.textContent = currentPeso;
    }

    // Lógica dos botões de peso
    if (btnMenos) {
        btnMenos.addEventListener('click', () => {
            if (currentPeso > 20) { // Limite mínimo
                currentPeso--;
                updatePesoDisplay();
            }
        });
    }

    if (btnMais) {
        btnMais.addEventListener('click', () => {
            if (currentPeso < 200) { // Limite máximo
                currentPeso++;
                updatePesoDisplay();
            }
        });
    }

    // Lógica dos botões de idade
    ageButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' de todos
            ageButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona 'active' ao clicado
            button.classList.add('active');
            // Atualiza o multiplicador
            currentMlPorKg = parseInt(button.dataset.value, 10);
        });
    });

    // Lógica do botão CALCULAR
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            // 1. Fazer o cálculo
            const totalMl = currentPeso * currentMlPorKg;
            const totalLitros = (totalMl / 1000); // Valor numérico, ex: 2.1

            // 2. Calcular copos (250ml por copo, arredondando para cima)
            const totalCopos = Math.ceil(totalMl / 250);

            // --- INÍCIO DAS NOVAS ANIMAÇÕES ---

            // Verifica se o GSAP está disponível
            if (typeof gsap !== 'undefined') {
                // A. Animação do Número (Contador)
                let counter = { value: 0 }; // Objeto para o GSAP animar

                // Tenta pegar o valor atual, se for um número, senão começa do 0
                if (displayLitros && displayLitros.textContent) {
                    let currentText = displayLitros.textContent.split(' ')[0].replace(',', '.');
                    let currentValue = parseFloat(currentText);
                    if (!isNaN(currentValue)) {
                        counter.value = currentValue; // Começa do valor que já está na tela
                    }
                }

                // Se uma animação anterior estiver rodando, mate-a
                if (currentAnimation) {
                    currentAnimation.kill();
                }

                // Anima o objeto 'counter' de seu valor atual até o valor final
                currentAnimation = gsap.to(counter, {
                    duration: 1.2, // Duração de 1.2s
                    value: totalLitros,
                    ease: "power2.out",
                    onUpdate: () => {
                        // a cada "frame" da animação, atualiza o texto
                        if (displayLitros) {
                            displayLitros.textContent = `${counter.value.toFixed(2).replace('.', ',')} Litros`;
                        }
                    },
                    onComplete: () => {
                        currentAnimation = null; // Limpa a animação
                    }
                });

                // B. Animação das Gotas (Stagger)
                if (displayCopos) {
                    displayCopos.innerHTML = ''; // Limpa os copos antigos
                    let copoElements = []; // Array para guardar os novos elementos

                    if (totalCopos > 0) {
                        for (let i = 0; i < totalCopos; i++) {
                            const copoIcon = document.createElement('i');
                            copoIcon.className = 'fa-solid fa-droplet';

                            if (i < 15) { // Mostra no máximo 15 copos
                                displayCopos.appendChild(copoIcon);
                                copoElements.push(copoIcon); // Adiciona ao array
                            }
                        }
                        if (totalCopos > 15) {
                            const extraText = document.createElement('span');
                            extraText.textContent = ` +${totalCopos - 15}`;
                            extraText.style.fontSize = '0.7em';
                            extraText.style.fontWeight = 'bold';
                            extraText.style.marginLeft = '5px';
                            displayCopos.appendChild(extraText);
                        }
                    }

                    // Anima os elementos que acabamos de criar
                    // Começa de uma opacidade e escala 0
                    gsap.fromTo(copoElements, {
                        opacity: 0,
                        scale: 0.5,
                        y: -10 // Começa um pouco acima
                    }, {
                        duration: 0.3, // Duração de cada gota
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        ease: "back.out(1.7)",
                        stagger: 0.08, // Atraso entre cada gota
                        delay: 0.2 // Começa 0.2s depois do clique
                    });
                }
            } else {
                // --- FALLBACK (Se o GSAP não carregar) ---
                if (displayLitros) displayLitros.textContent = `${totalLitros.toFixed(2).replace('.', ',')} Litros`;
                if (displayCopos) {
                    displayCopos.innerHTML = ''; // Limpa os copos antigos
                    if (totalCopos > 0) {
                        for (let i = 0; i < totalCopos; i++) {
                            // ... (código de adicionar copos, igual ao de cima)
                        }
                    }
                }
            }
            // --- FIM DAS NOVAS ANIMAÇÕES ---

            // 5. Esconder o aviso
            if (displayDisclaimer) {
                displayDisclaimer.style.display = 'none';
            }
        });
    }

    // 6. Inicializar o display
    updatePesoDisplay();
}
// --- FIM DA LÓGICA DA CALCULADORA ---


// ===============================================
// ==== INÍCIO DO CÓDIGO DO PLANEJADOR DE LANCHES (ADULTO) =====
// ===============================================

function setupSnackPlanner() {
    const plannerDays = document.querySelectorAll('.planner-day');
    const modal = document.getElementById('snack-selector-modal');
    const modalTitle = document.getElementById('snack-modal-title');
    const optionButtons = document.querySelectorAll('.snack-option-btn');
    const closeModalBtn = document.querySelector('#snack-selector-modal .game-close-btn');
    const resetBtn = document.getElementById('planner-reset-btn');
    const downloadBtn = document.getElementById('planner-download-btn'); // NOVO: Botão de Download

    if (plannerDays.length === 0 || !modal || optionButtons.length === 0 || !resetBtn || !downloadBtn) {
        return; // Sai se os elementos não forem encontrados
    }

    let currentDayElement = null;
    const weekDayNames = {
        seg: 'Segunda-feira',
        ter: 'Terça-feira',
        qua: 'Quarta-feira',
        qui: 'Quinta-feira',
        sex: 'Sexta-feira',
        sab: 'Sábado',
        dom: 'Domingo'
    };

    // Função para abrir o modal
    function openModal(dayElement) {
        currentDayElement = dayElement;
        const dayKey = currentDayElement.dataset.day;
        modalTitle.textContent = `Escolha seu lanche para: ${weekDayNames[dayKey]}`;

        // Abre o modal e trava o body (o CSS agora o torna fixo e centralizado)
        modal.classList.add('active');
        document.body.classList.add('game-modal-open');
    }

    // Função para fechar o modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('game-modal-open');
        currentDayElement = null;
    }

    // ===================================================
    // FUNÇÃO PRINCIPAL: GERAR O ARQUIVO DE TEXTO
    // ===================================================
    function generateDownload() {
        const date = new Date().toLocaleDateString('pt-BR');
        let content = "=== Meu Plano Semanal de Lanches (Alimentando Fases) ===\n";
        content += `Gerado em: ${date}\n\n`;

        let allEmpty = true;

        plannerDays.forEach(day => {
            const dayName = day.querySelector('h5').textContent;
            const choice = day.querySelector('.planner-choice span').textContent;

            let line = `${dayName}: `;

            if (day.classList.contains('filled')) {
                line += choice + " (Lanche Inteligente)";
                allEmpty = false;
            } else if (day.classList.contains('off-day')) {
                line += choice + " (Dia de Descanso)";
                allEmpty = false;
            } else {
                line += "Não Planejado";
            }
            content += line + "\n";
        });

        if (allEmpty) {
            alert("O plano está vazio! Escolha suas opções antes de baixar.");
            return;
        }

        content += "\n========================================================\n";
        content += "Lembre-se: Hidratação e planejamento são a chave para o sucesso na rotina adulta!";

        // Cria um BLOB (objeto de dados) e um link de download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `Plano_Lanches_Semana_${date.replace(/\//g, '-')}.txt`;

        // Simula o clique para iniciar o download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Libera o objeto
    }
    // ===================================================
    // FIM: GERAR O ARQUIVO DE TEXTO
    // ===================================================


    // ADICIONA EVENT LISTENERS

    // 1. Botões dos Dias
    plannerDays.forEach(day => {
        day.addEventListener('click', () => {
            openModal(day);
        });
    });

    // 2. Opções de Lanche (Lógica de 3 estados: Lanche, Folga, Limpar)
    optionButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentDayElement) {
                const choiceText = button.dataset.snack;
                const choiceSpan = currentDayElement.querySelector('.planner-choice span');

                // Limpa todos os estados anteriores
                currentDayElement.classList.remove('filled', 'off-day');
                currentDayElement.querySelector('.planner-choice i').style.display = 'block';

                if (choiceText === "Folga") {
                    // 1. Estado de FOLGA
                    choiceSpan.textContent = choiceText;
                    currentDayElement.classList.add('off-day');
                    currentDayElement.querySelector('.planner-choice i').style.display = 'none';

                } else if (choiceText) {
                    // 2. Estado de LANCE
                    choiceSpan.textContent = choiceText;
                    currentDayElement.classList.add('filled');
                    currentDayElement.querySelector('.planner-choice i').style.display = 'none';

                } else {
                    // 3. Estado de LIMPAR (Nenhum)
                    choiceSpan.textContent = 'Clique para escolher';
                }
            }
            closeModal();
        });
    });

    // 3. Eventos para fechar o modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Fecha se clicar no overlay (fundo)
        if (e.target === modal) {
            closeModal();
        }
    });

    // 4. Evento do botão de Resetar
    resetBtn.addEventListener('click', () => {
        plannerDays.forEach(day => {
            day.querySelector('.planner-choice span').textContent = 'Clique para escolher';
            day.querySelector('.planner-choice i').style.display = 'block';
            day.classList.remove('filled', 'off-day');
        });
    });

    // 5. Evento do botão de Download (NOVO)
    downloadBtn.addEventListener('click', generateDownload);

}

// ===============================================
// ====== FIM DO CÓDIGO DO PLANEJADOR DE LANCHES ======
// ===============================================

// ===============================================
// ==== INÍCIO DAS CHAMADAS DE FUNÇÕES =====
// ===============================================

// Funções Globais (rodam em todas as páginas)
// setupFontControls(); // Removido pois os botões não estão no HTML

// Funções da Página Inicial (Home) - Roda no carregamento inicial
setupHeroCarousel();

// Funções de outras páginas são chamadas dentro de navigateTo() para otimizar o TBT

// ===============================================
// ====== FIM DAS CHAMADAS DE FUNÇÕES ======
// ===============================================


// A LÓGICA DO CHATBOT FOI MOVIDA PARA 'gemini-chat.js'


// ... (O restante das suas funções setup que são definidas fora do DOMContentLoaded, como triggerConfetti, setupHandwashGuide, etc., devem vir aqui) ...


/* =======================================================
 * FUNÇÃO DE CONFETE
 * ======================================================= */
function triggerConfetti(modalElement) {
    if (typeof confetti !== 'function' || !modalElement) {
        console.warn('Biblioteca de confete não carregada ou modal inválido.');
        return;
    }

    const icon = modalElement.querySelector('.win-icon');
    setTimeout(() => {
        let origin = { y: 0.6, x: 0.5 };
        if (icon) {
            const rect = icon.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                origin = {
                    x: (rect.left + rect.width / 2) / window.innerWidth,
                    y: (rect.top + rect.height / 2) / window.innerHeight
                };
            }
        }
        confetti({
            particleCount: 150,
            spread: 90,
            origin: origin,
            colors: ['#53954a', '#6e513d', '#f9efd4', '#FFFFFF'],
            zIndex: 3000
        });
    }, 450);
}


/* =======================================================
 * LÓGICA JOGO DE CLASSIFICAR (EMBUTIDO NA INFÂNCIA)
 * ======================================================= */

const EmbeddedClassifyGame = {
    foodItemsData: [
        { name: 'Maçã', imageSrc: 'Imagens/maca.webp', category: 'natura' },
        { name: 'Brócolis', imageSrc: 'Imagens/brocolis.webp', category: 'natura' },
        { name: 'Arroz', imageSrc: 'Imagens/arroz.webp', category: 'natura' },
        { name: 'Pão Francês', imageSrc: 'Imagens/pao.webp', category: 'processado' }, // Corrigido de "pao.png"
        { name: 'Queijo', imageSrc: 'Imagens/queijo.webp', category: 'processado' },
        { name: 'Geleia', imageSrc: 'Imagens/geleia.webp', category: 'processado' },
        { name: 'Salgadinho', imageSrc: 'Imagens/salgadinho.webp', category: 'ultra' },
        { name: 'Refrigerante', imageSrc: 'Imagens/refri.webp', category: 'ultra' },
        { name: 'Bolacha Recheada', imageSrc: 'Imagens/bolacha.webp', category: 'ultra' },
        { name: 'Nuggets', imageSrc: 'Imagens/nuggets.webp', category: 'ultra' },
    ],
    gameArea: null,
    foodBank: null,
    dropZones: null,
    scoreDisplay: null,
    winModal: null,
    remainingItems: 0,
    draggedItemElement: null,

    init: function () {
        this.gameArea = document.getElementById('classify-game-area-embedded');
        this.foodBank = this.gameArea?.querySelector('.classify-food-bank');
        this.dropZones = this.gameArea?.querySelectorAll('.classify-zone');
        this.scoreDisplay = document.getElementById('classify-score-embedded');
        this.winModal = document.getElementById('classify-win-modal'); // Ele ainda tenta encontrar o modal

        // --- INÍCIO DA CORREÇÃO (LINHA 983) ---
        // A verificação !this.winModal foi REMOVIDA
        if (!this.gameArea || !this.foodBank || !this.dropZones || !this.scoreDisplay) {
            console.error("Elementos do DOM do Jogo de Classificar EMBUTIDO não encontrados.");
            return; // O script para aqui se não encontrar os elementos ESSENCIAIA
        }
        // --- FIM DA CORREÇÃO ---

        this.resetGame();
        // A verificação abaixo já é segura, pois só usa o winModal SE ele existir
        if (this.winModal) this.winModal.classList.remove('active');

        this.foodBank.innerHTML = '';
        this.dropZones.forEach(zone => {
            zone.classList.remove('correct', 'incorrect', 'over');
            zone.removeEventListener('dragover', this.handleDragOver.bind(this));
            zone.removeEventListener('dragleave', this.handleDragLeave.bind(this));
            zone.removeEventListener('drop', this.handleDrop.bind(this));
        });

        const shuffledItems = this.shuffleArray([...this.foodItemsData]);
        shuffledItems.forEach(itemData => {
            const itemElement = this.createFoodItemElement(itemData);
            this.foodBank.appendChild(itemElement);
        });
        this.remainingItems = shuffledItems.length;
        this.updateScore();

        this.dropZones.forEach(zone => {
            zone.addEventListener('dragover', this.handleDragOver.bind(this));
            zone.removeEventListener('dragleave', this.handleDragLeave.bind(this));
            zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    createFoodItemElement: function (itemData) {
        const item = document.createElement('div');
        item.classList.add('classify-food-item');
        item.draggable = true;
        item.dataset.name = itemData.name;
        item.innerHTML = `<img src="${itemData.imageSrc}" alt="${itemData.name}">`;
        item.addEventListener('dragstart', this.handleDragStart.bind(this));
        item.addEventListener('dragend', this.handleDragEnd.bind(this));
        return item;
    },

    handleDragStart: function (event) {
        const targetItem = event.target.closest('.classify-food-item');
        if (!targetItem) return;
        this.draggedItemElement = targetItem;
        event.dataTransfer.setData('text/plain', targetItem.dataset.name);
        setTimeout(() => targetItem.classList.add('dragging'), 0);
    },

    handleDragEnd: function (event) {
        const targetItem = event.target.closest('.classify-food-item');
        if (!targetItem) return;
        targetItem.classList.remove('dragging');
        this.draggedItemElement = null;
    },

    handleDragOver: function (event) {
        event.preventDefault();
        const zone = event.target.closest('.classify-zone');
        if (zone) {
            zone.classList.add('over');
        }
    },

    handleDragLeave: function (event) {
        const zone = event.target.closest('.classify-zone');
        if (zone) {
            zone.classList.remove('over');
        }
    },

    handleDrop: function (event) {
        event.preventDefault();
        const zone = event.target.closest('.classify-zone');
        if (!zone || !this.draggedItemElement) return;

        const foodName = event.dataTransfer.getData('text/plain');
        const targetCategory = zone.dataset.category;
        const foodData = this.foodItemsData.find(item => item.name === foodName);

        zone.classList.remove('over');

        if (foodData && foodData.category === targetCategory) {
            zone.classList.add('correct');
            this.draggedItemElement.classList.add('hide');
            this.draggedItemElement.draggable = false;
            this.remainingItems--;
            this.updateScore();
            this.checkWinCondition();
            setTimeout(() => zone.classList.remove('correct'), 500);
        } else {
            zone.classList.add('incorrect');
            setTimeout(() => zone.classList.remove('incorrect'), 500);
        }
        this.draggedItemElement = null;
    },

    updateScore: function () {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Itens restantes: ${this.remainingItems}`;
        }
    },

    checkWinCondition: function () {
        if (this.remainingItems === 0) {
            this.showWinModal();
        }
    },

    showWinModal: function () {
        // Esta função já é segura, pois só tenta usar o modal se ele foi encontrado
        if (this.winModal) {
            this.winModal.classList.add('active');
            triggerConfetti(this.winModal);
        }
    },

    resetGame: function () {
        this.remainingItems = 0;
        this.draggedItemElement = null;
        if (this.dropZones) {
            this.dropZones.forEach(zone => zone.classList.remove('correct', 'incorrect', 'over'));
        }
    },

    shuffleArray: function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

/* =======================================================
 * CONTROLES DE ACESSIBILIDADE (TAMANHO DA FONTE)
 * ======================================================= */
function setupFontControls() {
    const htmlEl = document.documentElement; // Pega a tag <html>
    const increaseBtn = document.getElementById('font-increase');
    const decreaseBtn = document.getElementById('font-decrease');
    const resetBtn = document.getElementById('font-reset');

    if (!increaseBtn || !decreaseBtn || !resetBtn) {
        return; // Sai se os botões não existirem
    }

    increaseBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('font-large')) {
            // Se já está 'large', vai para 'xlarge'
            htmlEl.classList.remove('font-large');
            htmlEl.classList.add('font-xlarge');
        } else if (htmlEl.classList.contains('font-xlarge')) {
            // Já está no máximo, não faz nada
            return;
        } else {
            // Se está no normal, vai para 'large'
            htmlEl.classList.add('font-large');
        }
    });

    decreaseBtn.addEventListener('click', () => {
        if (htmlEl.classList.contains('font-xlarge')) {
            // Se está 'xlarge', volta para 'large'
            htmlEl.classList.remove('font-xlarge');
            htmlEl.classList.add('font-large');
        } else if (htmlEl.classList.contains('font-large')) {
            // Se está 'large', volta para normal
            htmlEl.classList.remove('font-large');
        } else {
            // Já está no normal, não faz nada
            return;
        }
    });

    resetBtn.addEventListener('click', () => {
        // Remove todas as classes de fonte
        htmlEl.classList.remove('font-large', 'font-xlarge');
    });
}

/* =======================================================
 * GUIA INTERATIVO (HIGIENE DAS MÃOS)
 * ======================================================= */
function setupHandwashGuide() {
    // 1. Definição dos Passos
    const handWashSteps = [
        {
            icon: 'fa-faucet',
            title: 'Passo 1 de 5',
            text: 'Molhe as mãos com água corrente.'
        },
        {
            icon: 'fa-pump-soap',
            title: 'Passo 2 de 5',
            text: 'Aplique sabão suficiente para cobrir toda a superfície das mãos.'
        },
        {
            icon: 'fa-hand-sparkles',
            title: 'Passo 3 de 5',
            text: 'Esfregue as mãos por pelo menos 20 segundos (palmas, costas, dedos, unhas e punhos).'
        },
        {
            icon: 'fa-faucet-drip',
            title: 'Passo 4 de 5',
            text: 'Enxágue as mãos completamente com água corrente.'
        },
        {
            icon: 'fa-scroll',
            title: 'Passo 5 de 5',
            text: 'Seque as mãos com uma toalha limpa ou secador de mãos.'
        }
    ];

    // 2. Seleção dos ElementOS do DOM
    const guide = document.querySelector('.handwash-guide');
    if (!guide) return; // Se o guia não estiver na página, não faz nada

    const prevBtn = document.getElementById('btn-prev-step');
    const nextBtn = document.getElementById('btn-next-step');
    const stepCounter = document.getElementById('step-counter');

    const iconEl = guide.querySelector('.guide-icon i');
    const titleEl = guide.querySelector('.guide-step-title');
    const textEl = guide.querySelector('.guide-step-text');

    let currentStep = 0;

    // 3. Função para Atualizar a Tela
    function updateStep(stepIndex) {
        const stepData = handWashSteps[stepIndex];

        // Adiciona classe para animação de fade-out
        textEl.classList.add('fade-out');
        iconEl.classList.add('fade-out'); // Anima o ícone também

        setTimeout(() => {
            // Atualiza o conteúdo
            iconEl.className = `fa-solid ${stepData.icon}`; // Atualiza o ícone
            titleEl.textContent = stepData.title;
            textEl.textContent = stepData.text;
            stepCounter.textContent = `${stepIndex + 1} / ${handWashSteps.length}`;

            // Controla os botões
            prevBtn.disabled = (stepIndex === 0);
            nextBtn.disabled = (stepIndex === handWashSteps.length - 1);

            // Remove classe para animação de fade-in
            textEl.classList.remove('fade-out');
            iconEl.classList.remove('fade-out');
        }, 300); // Tempo da transição do CSS
    }

    // 4. Adiciona os Event Listeners
    nextBtn.addEventListener('click', () => {
        if (currentStep < handWashSteps.length - 1) {
            currentStep++;
            updateStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateStep(currentStep);
        }
    });

    // 5. Inicializa o guia no primeiro passo
    // (O HTML já cuida disso)
}


/* =======================================================
 * 22. LÓGICA DO MAPA INTERATIVO (JORNADA DOS SABORES)
 * ======================================================= */

// 1. Dados para cada Matriz
const originMapData = {
    'indigena': {
        title: 'Matriz Indígena',
        imageSrc: 'Imagens/icone-indigena.webp',
        altText: 'Ícone da Matriz Indígena',
        color: 'var(--color-primary)', // Verde
        bgColor: '#f0fdf4', // Verde claro
        items: [
            { icon: 'fa-seedling', text: 'Mandioca (Farinha, Beiju, Polvilho)' },
            { icon: 'fa-mortar-pestle', text: 'Paçoca (Mistura original)' },
            { icon: 'fa-apple-whole', text: 'Frutos Nativos (Açaí, Pequi, Cupuaçu)' },
            { icon: 'fa-leaf', text: 'Conhecimento da Terra e das Estações' }
        ]
    },
    'portuguesa': {
        title: 'Matriz Portuguesa',
        imageSrc: 'Imagens/icone-portuguesa.webp',
        altText: 'Ícone da Matriz Portuguesa',
        color: 'var(--color-secondary)', // Marrom
        bgColor: 'var(--color-background)', // Bege
        items: [
            { icon: 'fa-utensils', text: 'Adaptação de Pratos (Ex: Feijoada)' },
            { icon: 'fa-wheat-awn', text: 'Introdução do Arroz' },
            { icon: 'fa-wine-bottle', text: 'Azeite de Oliva, Alho e Cebola' },
            { icon: 'fa-users', text: 'Hábito do Almoço de Domingo' }
        ]
    },
    'africana': {
        title: 'Matriz Africana',
        imageSrc: 'Imagens/icone-africana.webp',
        altText: 'Ícone da Matriz Africana',
        color: '#d97706', // Laranja
        bgColor: '#fffbeb', // Laranja claro
        items: [
            { icon: 'fa-oil-can', text: 'Azeite de Dendê' },
            { icon: 'fa-mug-hot', text: 'Leite de Coco' },
            { icon: 'fa-drumstick-bite', text: 'Vatapá e Caruru' },
            { icon: 'fa-mug-hot', text: 'Adaptação da Canjica (Kanzika)' }
        ]
    }
};

// 2. Função para fechar o modal
function closeOriginModal() {
    const modal = document.getElementById('origin-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('game-modal-open');
    }
}

// 3. Função para preencher e abrir o modal
function populateOriginModal(data) {
    const modal = document.getElementById('origin-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.game-modal-content');
    const titleEl = document.getElementById('origin-modal-title');
    const iconEl = document.getElementById('origin-modal-icon'); // Agora é um <img>
    const listEl = document.getElementById('origin-modal-list');
    const headerEl = modal.querySelector('.origin-modal-header');

    // Preenche os dados
    titleEl.textContent = data.title;
    iconEl.src = data.imageSrc;
    iconEl.alt = data.altText;

    // Limpa a lista antiga
    listEl.innerHTML = '';

    // Adiciona os novos itens
    data.items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<i class="fa-solid ${item.icon}" aria-hidden="true"></i> ${item.text}`;
        listEl.appendChild(li);
    });

    // Atualiza as cores dinamicamente
    modalContent.style.borderColor = data.color;

    // Abre o modal
    modal.classList.add('active');
    document.body.classList.add('game-modal-open');
}

// 4. Função principal de setup
function setupOriginMap() {
    const hotspots = document.querySelectorAll('.map-hotspot');
    const modal = document.getElementById('origin-modal');

    // ===================================================
    // === ANIMAÇÃO DE ENTRADA (GSAP) ===
    // ===================================================
    if (typeof gsap !== 'undefined' && hotspots.length > 0) {
        // Define o estado inicial (invisível e pequeno)
        gsap.set(hotspots, { opacity: 0, scale: 0.5 });

        gsap.to(hotspots, {
            duration: 0.8, // Duração da animação de cada botão
            opacity: 1,
            scale: 1,
            ease: "back.out(1.7)", // Efeito de "elástico"
            stagger: 0.2, // Atraso entre cada botão
            scrollTrigger: {
                trigger: ".origin-map-container", // O container do mapa
                start: "top 75%", // Começa quando 75% do mapa estiver visível
                toggleActions: "play none none none" // Anima apenas uma vez
            }
        });
    }
    // ===================================================
    // === FIM DA ANIMAÇÃO ===
    // ===================================================

    if (!hotspots.length || !modal) return; // Não faz nada se os elementos não existirem

    const closeBtn = modal.querySelector('.game-close-btn');

    // Listener para cada Hotspot
    hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            const matrizKey = hotspot.dataset.matriz;
            const data = originMapData[matrizKey];
            if (data) {
                populateOriginModal(data);
            }
        });
    });

    // Listeners para fechar o modal
    closeBtn.addEventListener('click', closeOriginModal);
    modal.addEventListener('click', (e) => {
        // Fechar se clicar no fundo (overlay)
        if (e.target === modal) {
            closeOriginModal();
        }
    });
}


/* =======================================================
 * 23. LÓGICA DO FILTRO DA PÁGINA DE RECEITAS
 * ======================================================= */
function setupRecipeFilters() {
    const filterContainer = document.querySelector('.filter-bar');
    // Verificação para garantir que estamos na página de receitas
    // Adiciona uma verificação pelo ID da página de receitas
    const recipePage = document.getElementById('receitas');

    if (!filterContainer || !recipePage || !recipePage.classList.contains('active')) {
        // Se o container não existe OU a página de receitas não está ativa, não faz nada.
        // Isso previne que o script tente rodar em outras páginas.
        return;
    }

    const filterButtons = filterContainer.querySelectorAll('.filter-btn');
    const recipeCards = document.querySelectorAll('#recipe-grid .cards_item');

    // Função que realmente filtra
    const performFilter = (filter) => {
        recipeCards.forEach(card => {
            const categories = card.dataset.category; // ex: "vegano sem-gluten"

            if (filter === 'todos' || (categories && categories.includes(filter))) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    };

    // Adiciona listener aos botões
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;

            // 1. Atualiza o botão ativo
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. Filtra os cards
            performFilter(filter);
        });
    });

    // Garante que o filtro 'todos' seja aplicado na primeira carga da página
    // Encontra o botão 'todos' e o ativa, depois filtra
    const initialActiveButton = filterContainer.querySelector('.filter-btn[data-filter="todos"]');
    if (initialActiveButton) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        initialActiveButton.classList.add('active');
        performFilter('todos');
    }
}
// --- 7. LÓGICA DE CELEBRAÇÃO DA DEDICATÓRIA (FORMATURA) ---
const dedicationBox = document.getElementById('class-dedication');

// Variável para evitar disparar confetes a cada milissegundo.
let confettiTimer = null;

if (dedicationBox && typeof triggerConfetti !== 'undefined') {

    // Dispara o confete APENAS ao passar o mouse (hover)
    dedicationBox.addEventListener('mouseenter', () => {
        // Checa se já existe um timer rodando para não sobrecarregar
        if (confettiTimer) {
            return;
        }

        // Dispara o confete
        triggerConfetti(dedicationBox);

        // Define um novo timer para impedir um novo disparo por 2 segundos
        confettiTimer = setTimeout(() => {
            confettiTimer = null;
        }, 2000);
    });

    // O CÓDIGO DE DISPARO INICIAL FOI REMOVIDO DAQUI.
}

/* =======================================================
 * LÓGICA CHATBOT (IMPLEMENTAÇÃO COMPLETA)
 * ======================================================= */

function setupChatbotToggle() {
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatWindow = document.getElementById('chatbot-window');

    // ⚠️ Adicionado console.error para debugging, caso não encontre um elemento
    if (!toggleBtn || !chatWindow || !closeBtn) {
        console.error("ERRO: Elementos do Chatbot (toggleBtn, chatWindow, closeBtn) não foram encontrados no DOM.");
        return;
    }

    function toggleChatbot() {
        const isHidden = chatWindow.classList.contains('hidden');

        // 1. Alterna a visibilidade da janela e do FAB
        chatWindow.classList.toggle('hidden');
        toggleBtn.classList.toggle('hidden');

        // 2. Controla o scroll do body (trava a rolagem)
        document.body.classList.toggle('game-modal-open', isHidden);

        // 3. Foca no input ao abrir
        if (isHidden) {
            const input = document.getElementById('chatbot-input');
            if (input) {
                // Timeout para garantir que o foco seja aplicado após a animação de abertura
                setTimeout(() => input.focus(), 400);
            }
        }
    }

    // Event listeners
    toggleBtn.addEventListener('click', toggleChatbot);
    closeBtn.addEventListener('click', toggleChatbot);
}

// O restante da lógica de chat (envio de mensagem, gemini-chat.js, etc.) 
// deve ser implementado no arquivo correspondente.


/* =======================================================
 * CHAMADAS GERAIS (Roda APÓS A DEFINIÇÃO das funções)
 * ======================================================= */

// Funções da Página Inicial (Home) - Roda no carregamento inicial
setupHeroCarousel();

// Garante que o Chatbot e outras inicializações rodem *depois* do DOM
// O DOMContentLoaded garante que todos os elementos HTML (como o botão) 
// existam antes de tentarmos anexar o listener.
document.addEventListener('DOMContentLoaded', () => {
    // Funções que devem rodar no carregamento inicial da página, independente da seção ativa:
    setupChatbotToggle();
    setupPrototypeWarning();
});