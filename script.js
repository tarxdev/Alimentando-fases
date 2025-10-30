/* =======================================================
 * SCRIPT PRINCIPAL - ALIMENTANDO FASES
 * ======================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA DE NAVEGAÇÃO (SPA) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const appContainer = document.getElementById('app-container');

    function navigateTo(pageId) {
        // Esconde todas as páginas
        pages.forEach(page => page.classList.remove('active'));

        // Mostra a página correta
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            // Se não achar, volta pra home
            document.getElementById('home').classList.add('active');
        }

        // (NOVO) Inicia o caça-palavras se a página for a correta
        if (pageId === 'adolescencia') {
            if (typeof WordSearchGame !== 'undefined' && WordSearchGame.init) {
                // Um pequeno delay para garantir que a página esteja visível antes de construir o grid
                setTimeout(() => {
                    WordSearchGame.init();
                }, 100);
            } else {
                console.warn('WordSearchGame não está pronto para iniciar.');
            }
        }

        // Rola para o topo do container
        if (appContainer) appContainer.scrollIntoView({ behavior: 'smooth' });

        // Fecha o menu mobile (se estiver aberto)
        closeMobileMenu();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });

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
    const menuItems = document.querySelectorAll('.main-header__list-item.has-submenu');
    let activeSubmenu = null;
    let closeTimer = null;

    menuItems.forEach(item => {
        const link = item.querySelector(':scope > a'); // Seletor mais específico
        const submenuWrapper = item.querySelector('.submenu-wrapper');

        if (!link || !submenuWrapper) return; // Garante que elementos existem

        // Mostra no hover/focus
        const showSubmenu = () => {
            if (closeTimer) clearTimeout(closeTimer);
            if (activeSubmenu && activeSubmenu !== item) {
                activeSubmenu.classList.remove('is-closing'); // Remove classe de fechamento de outros
            }
            item.classList.remove('is-closing'); // Remove classe de fechamento do item atual
            activeSubmenu = item; // Define o item atual como ativo


            // Lógica de conteúdo interno do submenu (ativação do primeiro item)
            const submenuLinks = item.querySelectorAll('.submenu-list__item.has-submenu');
            const submenuContents = item.querySelectorAll('.submenu-content');

            // Reset inicial antes de ativar o primeiro
            submenuLinks.forEach(sl => sl.classList.remove('active'));
            submenuContents.forEach(sc => sc.classList.remove('active'));

            if (submenuLinks.length > 0) {
                 const firstSubLink = submenuLinks[0];
                 firstSubLink.classList.add('active');
                 const firstContentKeyElement = firstSubLink.querySelector('.submenu-list__item-title');
                 if (firstContentKeyElement) {
                     const firstContentKey = firstContentKeyElement.textContent;
                     const firstContent = item.querySelector(`.submenu-content[data-submenu-for="${firstContentKey}"]`);
                     if(firstContent) firstContent.classList.add('active');
                 }
            }


            // Adiciona listeners para hover nos links internos APENAS QUANDO o submenu é mostrado
            submenuLinks.forEach((subLink) => {
                // Usar 'mouseenter' em vez de 'mouseover' para evitar disparos múltiplos
                 subLink.addEventListener('mouseenter', handleSubmenuLinkHover);
            });
        };

        const handleSubmenuLinkHover = (event) => {
            const subLink = event.currentTarget;
            const parentMenuItem = subLink.closest('.main-header__list-item.has-submenu'); // Acha o menu principal pai
            if (!parentMenuItem) return;

             const allSubmenuLinks = parentMenuItem.querySelectorAll('.submenu-list__item.has-submenu');
             const allSubmenuContents = parentMenuItem.querySelectorAll('.submenu-content');

             // Remove active de todos os links e conteúdos DENTRO DO MESMO SUBMENU PRINCIPAL
             allSubmenuLinks.forEach(sl => sl.classList.remove('active'));
             allSubmenuContents.forEach(sc => sc.classList.remove('active'));

             // Ativa o atual
             subLink.classList.add('active');
             const contentKeyElement = subLink.querySelector('.submenu-list__item-title');
             if (contentKeyElement) {
                 const contentKey = contentKeyElement.textContent;
                 const targetContent = parentMenuItem.querySelector(`.submenu-content[data-submenu-for="${contentKey}"]`);
                 if (targetContent) {
                     targetContent.classList.add('active');
                 }
             }
        };


        // Esconde
        const hideSubmenu = () => {
             // Remove listeners internos ao esconder para evitar acumulo
             const submenuLinks = item.querySelectorAll('.submenu-list__item.has-submenu');
             submenuLinks.forEach((subLink) => {
                 subLink.removeEventListener('mouseenter', handleSubmenuLinkHover);
             });

            closeTimer = setTimeout(() => {
                item.classList.add('is-closing');
                // Não precisa remover active dos internos aqui, pois serão resetados no próximo showSubmenu
            }, 100); // Aumentei um pouco o delay
        };

        item.addEventListener('mouseenter', showSubmenu);
        item.addEventListener('mouseleave', hideSubmenu);
        if (link) {
           link.addEventListener('focus', showSubmenu); // Adicionado focus no link principal
        }

        // Lógica de acessibilidade para 'focusout' - Garante que o submenu feche ao sair dele
        const focusableElements = Array.from(item.querySelectorAll('a, button'));
        if (focusableElements.length > 0) {
            const lastElement = focusableElements[focusableElements.length - 1];

             // Adiciona listener no primeiro e último elementos focáveis
             const firstElement = focusableElements[0];

            firstElement.addEventListener('keydown', (e) => {
                // Se Shift+Tab no primeiro item, fecha o submenu
                if (e.shiftKey && e.key === 'Tab') {
                     hideSubmenu();
                }
            });

            lastElement.addEventListener('keydown', (e) => {
                // Se Tab (sem Shift) no último item, fecha o submenu
                if (!e.shiftKey && e.key === 'Tab') {
                    hideSubmenu();
                }
            });

             // Listener genérico no item para fechar se o foco sair completamente
             item.addEventListener('focusout', (e) => {
                 // Verifica se o novo foco (relatedTarget) está FORA do item do menu
                 if (!item.contains(e.relatedTarget)) {
                     hideSubmenu();
                 }
             });
        }
    });


    // --- 4. LÓGICA DO CARROSSEL (HERO) ---
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.querySelector('.carousel-dots');
    const nextBtn = document.querySelector('.carousel-nav.next');
    const prevBtn = document.querySelector('.carousel-nav.prev');
    let currentSlide = 0;
    let slideInterval;
    let heroCarouselInitialized = false; // Flag para inicialização

    function initHeroCarousel() {
        if (heroCarouselInitialized || !slides || slides.length <= 0 || !dotsContainer) return; // Roda só uma vez e verifica se slides existe

        function createDots() {
            dotsContainer.innerHTML = ''; // Limpa dots antigos
            slides.forEach((_, index) => {
                const button = document.createElement('button');
                button.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                button.addEventListener('click', () => {
                    goToSlide(index);
                    resetInterval();
                });
                dotsContainer.appendChild(button);
            });
        }

        function updateDots() {
            const dots = dotsContainer.querySelectorAll('button');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }

        function goToSlide(slideIndex) {
            if (!slides[currentSlide]) return; // Adiciona verificação
            slides[currentSlide].classList.remove('active');
            currentSlide = (slideIndex + slides.length) % slides.length;
            if (!slides[currentSlide]) return; // Adiciona verificação
            slides[currentSlide].classList.add('active');
            updateDots();
        }

        function startInterval() {
             // Limpa intervalo anterior antes de começar um novo
             if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(() => {
                goToSlide(currentSlide + 1);
            }, 5000); // Muda a cada 5 segundos
        }

        function resetInterval() {
            clearInterval(slideInterval);
            startInterval();
        }

        if(nextBtn) nextBtn.addEventListener('click', () => {
            goToSlide(currentSlide + 1);
            resetInterval();
        });
        if(prevBtn) prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1);
            resetInterval();
        });

        createDots();
        goToSlide(0); // Garante que o primeiro slide esteja ativo
        startInterval();
        heroCarouselInitialized = true; // Marca como inicializado
    }
     // Chama a inicialização quando o DOM estiver pronto
     initHeroCarousel();


    // --- 5. LÓGICA DE ANIMAÇÃO (GSAP) ---
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // --- Função Genérica para Animar Elementos (Fade In + Slide Up Sutil) ---
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

        // --- Função Genérica para Esconder Elementos ---
        function hide(elem) {
            gsap.set(elem, { autoAlpha: 0 }); // Mantém escondido antes de animar
        }

        // --- Animação Genérica para elementos .gs_reveal ---
        gsap.utils.toArray(".gs_reveal").forEach(function (elem) {
            hide(elem); // Esconde inicialmente

            ScrollTrigger.create({
                trigger: elem,
                start: "top 85%",
                end: "bottom 15%",
                onEnter: () => animateFrom(elem),
                onEnterBack: () => animateFrom(elem, -1), // Anima ao voltar
                onLeave: () => hide(elem), // Opcional: esconde ao sair completamente
                markers: false // Debug (mude para true se precisar)
            });
        });

        // --- Animação Orquestrada (Stagger) para os .topic-block ---
        //    (Animação específica para os blocos dentro de #adolescencia)
        const topicBlocks = gsap.utils.toArray('#adolescencia .topic-block');
        if (topicBlocks.length > 0) {
             // Esconde os blocos inicialmente (mesmo estado 'from' da animação)
             gsap.set(topicBlocks, { autoAlpha: 0, y: 50 });

            ScrollTrigger.create({
                trigger: "#adolescencia .topic-container", // O container que agrupa os blocos
                start: "top 75%", // Quando 75% do topo do container entra na tela
                end: "bottom 25%", // Opcional: define um fim para o trigger
                markers: false, // Debug
                onEnter: () => {
                    gsap.to(topicBlocks, { // Animamos 'para' o estado final
                        duration: 0.8,      // Duração da animação de CADA bloco (reduzida)
                        autoAlpha: 1,     // Fade in
                        y: 0,             // Slide para a posição final (Y=0)
                        stagger: 0.15,    // Atraso entre o início da animação de cada bloco
                        ease: "power2.out", // Ease mais suave
                        overwrite: "auto" // Evita conflitos se o usuário rolar rápido
                    });
                },
                onLeaveBack: () => { // Opcional: Reseta a animação se o usuário rolar para CIMA
                     gsap.set(topicBlocks, { autoAlpha: 0, y: 50 }); // Volta ao estado inicial
                }
            });
        }

    } // --- Fim do if typeof gsap ---

    // --- 6. LÓGICA DO CARROSSEL 3D (NUTRIENTES) ---
    const carouselWrapperNutrients = document.querySelector('#adolescencia .carousel-wrapper'); 
    const gridNutrients = document.querySelector('#adolescencia .grid-nutrients');
    const cardsNutrients = document.querySelectorAll('#adolescencia .flip-card');
    const prevButtonNutrients = document.querySelector('#adolescencia .prev-card');
    const nextButtonNutrients = document.querySelector('#adolescencia .next-card');

    if (carouselWrapperNutrients && gridNutrients && cardsNutrients.length > 0 && prevButtonNutrients && nextButtonNutrients) { 
        let currentIndexNutrients = 0;
        const totalCardsNutrients = cardsNutrients.length;
        // Pega o gap do CSS (remove 'px' e converte para número)
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

            // Calcula quantos cards completos cabem na tela (usando floor para ser seguro)
            const visibleCards = Math.max(1, Math.floor((wrapperWidth + gapNutrients) / (cardWidth + gapNutrients)));
            
            // Calcula o número de passos que podemos dar (último card visível na tela)
            const maxIndex = Math.max(0, totalCardsNutrients - visibleCards);
            
            // Garante que o índice atual não ultrapasse o máximo
            if (currentIndexNutrients > maxIndex) {
                 currentIndexNutrients = maxIndex;
            }

            // Calcula o scroll máximo real
            const totalGridWidth = (cardWidth * totalCardsNutrients) + (gapNutrients * (totalCardsNutrients - 1));
            const maxScroll = Math.max(0, totalGridWidth - wrapperWidth);

            // Calcula o deslocamento alvo
            let targetOffset = currentIndexNutrients * (cardWidth + gapNutrients);

            // Se o deslocamento alvo for maior que o máximo, usa o máximo (garante que o final não seja cortado)
            if (targetOffset > maxScroll) {
                targetOffset = maxScroll;
            }

            // Aplica a transformação
            gridNutrients.style.transform = `translateX(-${targetOffset}px)`;
            gridNutrients.style.transition = 'transform 0.5s ease-out';

            // Atualiza o estado dos botões
            prevButtonNutrients.disabled = currentIndexNutrients === 0;
            // Desativa o botão "próximo" se o deslocamento atual for igual ao scroll máximo (ou muito próximo)
            nextButtonNutrients.disabled = targetOffset >= (maxScroll - 1); // -1 é uma margem de erro
        }

        // --- Navegação ---
        prevButtonNutrients.addEventListener('click', () => {
            if (currentIndexNutrients > 0) {
                currentIndexNutrients--;
                updateNutrientsCarousel();
            }
        });

        nextButtonNutrients.addEventListener('click', () => {
            // A lógica de desabilitar o botão já impede avanços inválidos
            if (!nextButtonNutrients.disabled) {
                currentIndexNutrients++;
                updateNutrientsCarousel();
            }
        });

        // Recalcular no resize
        window.addEventListener('resize', () => {
            // Garante que a transição seja desativada durante o resize
            gridNutrients.style.transition = 'none'; 
            updateNutrientsCarousel();
        });

        // Inicializa
        setTimeout(updateNutrientsCarousel, 50);

    } else {
        console.warn("Elementos do carrossel de nutrientes (wrapper, grid, cards ou botões) não encontrados.");
        if(prevButtonNutrients) prevButtonNutrients.style.display = 'none';
        if(nextButtonNutrients) nextButtonNutrients.style.display = 'none';
    }


    // --- SEÇÃO 7 VAZIA (REMOVIDA) ---


    /* =======================================================
     * CONTROLE GERAL DOS JOGOS
     * ======================================================= */

    /**
     * Esconde todos os containers de jogo e modais, voltando ao "launch pad"
     */
    function showGameCover() {
        document.body.classList.remove('game-modal-open');
        document.querySelectorAll('.game-container-wrapper').forEach(container => {
            container.classList.remove('active');
        });
        document.querySelectorAll('.game-modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Mostra um container de jogo e chama sua função de inicialização
     * @param {string} containerId - O ID do container (ex: 'memory-game-container')
     * @param {Function} gameInitializerFunction - A função que inicia o jogo (ex: MemoryGame.init)
     */
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
                gameArea.classList.add('active'); // Garante que a área interna seja exibida
            } else {
                 console.warn(`Área de jogo não encontrada dentro de #${containerId}`);
            }

            if (gameInitializerFunction && typeof gameInitializerFunction === 'function') {
                try {
                    gameInitializerFunction(); // Chama a inicialização do jogo específico
                } catch (error) {
                    console.error(`Erro ao inicializar o jogo ${containerId}:`, error);
                     showGameCover(); // Fecha se houver erro na inicialização
                }
            } else {
                 console.warn(`Função de inicialização para ${containerId} não fornecida ou inválida.`);
            }

        } else {
            console.error(`Container do jogo "${containerId}" não encontrado.`);
             document.body.classList.remove('game-modal-open'); // Libera o scroll se o container não existe
        }
    }

    // --- Anexando os Event Listeners (Sem 'onclick' no HTML) ---

    // 1. Botões de Lançamento (no "launch pad")
    const memLauncher = document.querySelector('button[aria-label*="Memória"]');
    if (memLauncher) {
         memLauncher.addEventListener('click', () => {
             // Garante que MemoryGame existe antes de chamar
             if (typeof MemoryGame !== 'undefined' && MemoryGame.init) {
                 launchGame('memory-game-container', MemoryGame.init.bind(MemoryGame));
             } else {
                 console.error('Objeto MemoryGame ou MemoryGame.init não encontrado.');
             }
         });
    }

    const classifyLauncher = document.querySelector('button[aria-label*="Caminho"]');
    if (classifyLauncher) {
        classifyLauncher.addEventListener('click', () => {
             // Garante que ClassifyGame existe antes de chamar
             if (typeof ClassifyGame !== 'undefined' && ClassifyGame.init) {
                 launchGame('classify-game-container', ClassifyGame.init.bind(ClassifyGame));
             } else {
                 console.error('Objeto ClassifyGame ou ClassifyGame.init não encontrado.');
             }
         });
    }
    
    // (REMOVIDO) O listener do wordsearch-launcher foi removido

    // 2. Botões Internos (Fechar, Reiniciar, Jogar de Novo)

    // Jogo da Memória
    document.querySelector('#memory-game-area .game-restart-btn')?.addEventListener('click', () => {
         if (typeof MemoryGame !== 'undefined' && MemoryGame.init) MemoryGame.init();
    });
    document.querySelector('#win-modal .cta-button')?.addEventListener('click', () => {
         if (typeof MemoryGame !== 'undefined' && MemoryGame.init) MemoryGame.init();
    });
    document.querySelectorAll('#memory-game-container .game-close-btn, #win-modal .cta-link').forEach(btn => {
        btn.addEventListener('click', showGameCover);
    });

    // Jogo de Classificar
    document.querySelector('#classify-game-area .game-restart-btn')?.addEventListener('click', () => {
         if (typeof ClassifyGame !== 'undefined' && ClassifyGame.init) ClassifyGame.init();
    });
    document.querySelector('#classify-win-modal .cta-button')?.addEventListener('click', () => {
         if (typeof ClassifyGame !== 'undefined' && ClassifyGame.init) ClassifyGame.init();
    });
    document.querySelectorAll('#classify-game-container .game-close-btn, #classify-win-modal .cta-link').forEach(btn => {
        btn.addEventListener('click', showGameCover);
    });

    // (REMOVIDO) Os listeners do caça-palavras foram movidos para o wordsearch.js


}); // --- FIM DO DOMContentLoaded ---


/* =======================================================
 * FUNÇÃO DE CONFETE (CORRIGIDO O TIMING E Z-INDEX)
 * ======================================================= */
function triggerConfetti(modalElement) {
    if (typeof confetti !== 'function' || !modalElement) {
        console.warn('Biblioteca de confete não carregada ou modal inválido.');
        return;
    }

    const icon = modalElement.querySelector('.win-icon');

    // Espera a animação do modal + um pequeno delay
    setTimeout(() => {
        let origin = { y: 0.6, x: 0.5 }; // Padrão (centro)
        if (icon) {
            const rect = icon.getBoundingClientRect();
             if (rect.width > 0 && rect.height > 0) { // Garante que o ícone está visível
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
            zIndex: 3000 // Garante que fique na frente
        });
    }, 450); // Tempo da animação do modal é 400ms + 50ms de margem
}


/* =======================================================
 * LÓGICA JOGO DA MEMÓRIA
 * ======================================================= */

const MemoryGame = {
    cardNames: ['banana', 'brocolis', 'cenoura', 'laranja', 'maca', 'morango', 'pimentao', 'uva'],
    gameBoard: null,
    movesCounter: null,
    winModal: null,
    finalMoves: null,
    hasFlippedCard: false,
    lockBoard: false,
    firstCard: null,
    secondCard: null,
    moves: 0,
    matches: 0,
    // Sons omitidos por brevidade, mas podem ser adicionados como no seu original

    init: function() {
        this.gameBoard = document.querySelector('#memory-game-area .memory-game');
        this.movesCounter = document.getElementById('moves-counter'); // Re-obtido, pode ser diferente do Classify
        this.winModal = document.getElementById('win-modal');
        this.finalMoves = document.getElementById('final-moves');

        if (!this.gameBoard || !this.movesCounter || !this.winModal || !this.finalMoves) {
            console.error("Elementos do DOM do Jogo da Memória não encontrados.");
            return;
        }

        if (this.winModal) this.winModal.classList.remove('active');
        this.gameBoard.classList.add('restarting'); // Para feedback visual
        this.lockBoard = true;
        this.resetGameVariables();

        // Vira cartas para baixo ANTES de limpar, para animação
        const allCards = this.gameBoard.querySelectorAll('.card');
        allCards.forEach(card => card.classList.remove('flip', 'match'));

        setTimeout(() => {
            this.createBoard();
            this.gameBoard.classList.remove('restarting');
            this.lockBoard = false;
        }, 600); // Espera animação de virar
    },

    createBoard: function() {
        this.gameBoard.innerHTML = ''; // Limpa tabuleiro
        const duplicatedCards = [...this.cardNames, ...this.cardNames];
        this.shuffleArray(duplicatedCards);

        duplicatedCards.forEach(name => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.name = name;
            // Usando 'button' interno para melhor acessibilidade (embora o jogo seja visual)
            card.innerHTML = `
                <button class="card-inner" aria-label="Carta ${name}">
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front"><img src="jogo-memoria-nutri/assets/cards/${name}.png" alt="${name}"></div>
                </button>
            `;
             // Adiciona listener ao botão interno
             card.querySelector('.card-inner').addEventListener('click', () => this.flipCard(card));
            this.gameBoard.appendChild(card);
        });
    },

     // Modificado para receber o elemento 'card' como argumento
     flipCard: function(cardElement) {
        if (this.lockBoard || cardElement === this.firstCard || cardElement.classList.contains('flip')) return;

        cardElement.classList.add('flip');
        // this.playSound(this.flipSound);

        if (!this.hasFlippedCard) {
            this.hasFlippedCard = true;
            this.firstCard = cardElement;
            return;
        }

        this.secondCard = cardElement;
        this.incrementMoves();
        this.checkForMatch();
    },

    checkForMatch: function() {
        if (!this.firstCard || !this.secondCard) return;
        let isMatch = this.firstCard.dataset.name === this.secondCard.dataset.name;
        isMatch ? this.disableCards() : this.unflipCards();
    },

    disableCards: function() {
        this.matches++;
        // this.playSound(this.matchSound);

         // Remove listener do botão interno
         // Certifique-se de que a função passada para removeEventListener é a mesma que foi adicionada
         // É mais seguro referenciar a função diretamente se possível, ou usar bind corretamente.
         // Mas como a função é anônima e criada no loop, a remoção pode não funcionar como esperado.
         // A alternativa é desabilitar o botão ou usar a classe .match para CSS pointer-events: none.
         // this.firstCard.querySelector('.card-inner').removeEventListener('click', ...);
         // this.secondCard.querySelector('.card-inner').removeEventListener('click', ...);

        this.firstCard.classList.add('match');
        this.secondCard.classList.add('match');
        this.resetBoard();

        if (this.matches === this.cardNames.length) {
            // this.playSound(this.winSound);
            setTimeout(() => this.showWinModal(), 800); // Delay antes de mostrar modal
        }
    },

    unflipCards: function() {
        this.lockBoard = true;
        // Adiciona classe para visualmente bloquear (opcional)
        if (this.firstCard) this.firstCard.classList.add('block-click');
        if (this.secondCard) this.secondCard.classList.add('block-click');


        setTimeout(() => {
            if (this.firstCard) this.firstCard.classList.remove('flip', 'block-click');
            if (this.secondCard) this.secondCard.classList.remove('flip', 'block-click');
            this.resetBoard();
        }, 1300); // Tempo para ver as cartas
    },

    showWinModal: function() {
        this.finalMoves.textContent = this.moves;
        this.winModal.classList.add('active');
        triggerConfetti(this.winModal); // Chama confete
    },

    resetBoard: function() {
        [this.hasFlippedCard, this.lockBoard] = [false, false];
        [this.firstCard, this.secondCard] = [null, null];
    },
    resetGameVariables: function() {
        this.matches = 0;
        this.moves = 0;
        if(this.movesCounter) this.movesCounter.textContent = `Jogadas: 0`; // Verifica se existe
        this.resetBoard();
    },
    incrementMoves: function() {
        this.moves++;
        if(this.movesCounter) this.movesCounter.textContent = `Jogadas: ${this.moves}`; // Verifica se existe
    },
    /* playSound: function(sound) { // Exemplo
        if (sound && sound.play) {
            sound.currentTime = 0;
            sound.play().catch(e => console.warn("Ação do usuário necessária para tocar som."));
        }
    }, */
    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

/* =======================================================
 * LÓGICA JOGO DE CLASSIFICAR (CAMINHO DO ALIMENTO)
 * ======================================================= */

const ClassifyGame = {
    // --- 1. Definição dos Alimentos ---
    // IMPORTANTE: Preencha com seus dados!
    foodItemsData: [
        // Exemplos - SUBSTITUA PELOS SEUS DADOS REAIS
        { name: 'Maçã', imageSrc: 'jogo-caminho/assets/maca.png', category: 'natura' },
        { name: 'Brócolis', imageSrc: 'jogo-caminho/assets/brocolis.png', category: 'natura' },
        { name: 'Arroz', imageSrc: 'jogo-caminho/assets/arroz.png', category: 'natura' }, // Minimamente Processado
        { name: 'Pão Francês', imageSrc: 'jogo-caminho/assets/pao.png', category: 'processado' },
        { name: 'Queijo', imageSrc: 'jogo-caminho/assets/queijo.png', category: 'processado' },
        { name: 'Geleia', imageSrc: 'jogo-caminho/assets/geleia.png', category: 'processado' },
        { name: 'Salgadinho', imageSrc: 'jogo-caminho/assets/salgadinho.png', category: 'ultra' },
        { name: 'Refrigerante', imageSrc: 'jogo-caminho/assets/refri.png', category: 'ultra' },
        { name: 'Bolacha Recheada', imageSrc: 'jogo-caminho/assets/bolacha.png', category: 'ultra' },
        { name: 'Nuggets', imageSrc: 'jogo-caminho/assets/nuggets.png', category: 'ultra' },
        // Adicione mais alimentos aqui...
    ],

    // --- 2. Seletores de Elementos ---
    gameArea: null,
    foodBank: null,
    dropZones: null,
    scoreDisplay: null,
    winModal: null,

    // --- 3. Variáveis de Estado ---
    remainingItems: 0,
    draggedItemElement: null, // Referência ao elemento HTML sendo arrastado

    /** (RE)INICIA O JOGO */
    init: function() {
        // 1. Busca os elementos do DOM
        this.gameArea = document.getElementById('classify-game-area');
        this.foodBank = this.gameArea?.querySelector('.classify-food-bank');
        this.dropZones = this.gameArea?.querySelectorAll('.classify-zone');
        this.scoreDisplay = document.getElementById('classify-score');
        this.winModal = document.getElementById('classify-win-modal');

        if (!this.gameArea || !this.foodBank || !this.dropZones || !this.scoreDisplay || !this.winModal) {
            console.error("Elementos do DOM do Jogo de Classificar não encontrados.");
            return; // Sai se o DOM não estiver pronto
        }

        // 2. Reseta o estado
        this.resetGame();
        if (this.winModal) this.winModal.classList.remove('active');

        // 3. Limpa áreas
        this.foodBank.innerHTML = '';
        this.dropZones.forEach(zone => {
            zone.classList.remove('correct', 'incorrect', 'over');
            // Remove listeners antigos para evitar duplicação
            // Usar bind(this) garante que a referência da função seja a mesma para adicionar e remover
             zone.removeEventListener('dragover', this.handleDragOver.bind(this));
             zone.removeEventListener('dragleave', this.handleDragLeave.bind(this));
             zone.removeEventListener('drop', this.handleDrop.bind(this));
        });


        // 4. Cria e embaralha os itens
        const shuffledItems = this.shuffleArray([...this.foodItemsData]);
        shuffledItems.forEach(itemData => {
            const itemElement = this.createFoodItemElement(itemData);
            this.foodBank.appendChild(itemElement);
        });
        this.remainingItems = shuffledItems.length; // Define contagem inicial
        this.updateScore();

        // 5. Adiciona listeners às zonas de drop
        this.dropZones.forEach(zone => {
             zone.addEventListener('dragover', this.handleDragOver.bind(this));
             zone.addEventListener('dragleave', this.handleDragLeave.bind(this));
             zone.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    /** Cria o elemento HTML para um item alimentar */
    createFoodItemElement: function(itemData) {
        const item = document.createElement('div');
        item.classList.add('classify-food-item');
        item.draggable = true;
        item.dataset.name = itemData.name; // Guarda o nome para referência no drop
        item.innerHTML = `<img src="${itemData.imageSrc}" alt="${itemData.name}">`;

         // Adiciona listeners de drag ao item
         item.addEventListener('dragstart', this.handleDragStart.bind(this));
         item.addEventListener('dragend', this.handleDragEnd.bind(this));

        return item;
    },

    // --- Funções de Drag and Drop ---
    handleDragStart: function(event) {
        // Verifica se o elemento clicado é a imagem dentro do item
        const targetItem = event.target.closest('.classify-food-item');
        if (!targetItem) return;

        this.draggedItemElement = targetItem; // Guarda o elemento que está sendo arrastado
        event.dataTransfer.setData('text/plain', targetItem.dataset.name);
        setTimeout(() => targetItem.classList.add('dragging'), 0); // Adiciona classe com delay
    },

    handleDragEnd: function(event) {
         // Verifica se o elemento clicado é a imagem dentro do item
        const targetItem = event.target.closest('.classify-food-item');
        if (!targetItem) return;
        targetItem.classList.remove('dragging');
        this.draggedItemElement = null; // Limpa referência
    },

    handleDragOver: function(event) {
        event.preventDefault(); // Necessário para permitir o drop
        const zone = event.target.closest('.classify-zone');
         if (zone) {
            zone.classList.add('over');
        }
    },

     handleDragLeave: function(event) {
         const zone = event.target.closest('.classify-zone');
         if (zone) {
             zone.classList.remove('over');
         }
     },


    handleDrop: function(event) {
        event.preventDefault();
        const zone = event.target.closest('.classify-zone');
        if (!zone || !this.draggedItemElement) return; // Sai se não for zona ou não houver item arrastado

        const foodName = event.dataTransfer.getData('text/plain');
        const targetCategory = zone.dataset.category;

        // Encontra os dados do alimento arrastado
        const foodData = this.foodItemsData.find(item => item.name === foodName);

        zone.classList.remove('over'); // Remove feedback visual de 'over'

        if (foodData && foodData.category === targetCategory) {
            // Correto!
            zone.classList.add('correct');
            this.draggedItemElement.classList.add('hide'); // Esconde o item
            this.draggedItemElement.draggable = false; // Impede arrastar novamente
            this.remainingItems--;
            this.updateScore();
            this.checkWinCondition();
            setTimeout(() => zone.classList.remove('correct'), 500); // Remove feedback após um tempo
        } else {
            // Incorreto!
            zone.classList.add('incorrect');
            setTimeout(() => zone.classList.remove('incorrect'), 500); // Remove feedback após um tempo
        }
        this.draggedItemElement = null; // Limpa referência após drop
    },

    // --- Funções Auxiliares ---
    updateScore: function() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = `Itens restantes: ${this.remainingItems}`;
        }
    },

    checkWinCondition: function() {
        if (this.remainingItems === 0) {
            this.showWinModal();
        }
    },

    showWinModal: function() {
        if (this.winModal) {
            this.winModal.classList.add('active');
            triggerConfetti(this.winModal); // Chama confete
        }
    },

    resetGame: function() {
        this.remainingItems = 0;
        this.draggedItemElement = null;
        // Limpar classes de feedback visual das zonas, se necessário
         if (this.dropZones) {
             this.dropZones.forEach(zone => zone.classList.remove('correct', 'incorrect', 'over'));
         }
    },

    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};