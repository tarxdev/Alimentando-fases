/* =======================================================
 * LÓGICA JOGO CAÇA-PALAVRAS (V19.1 - DEBUG Feedback)
 * ======================================================= */

const WordSearchGame = {
    // --- 1. Elementos do DOM ---
    gameArea: null,
    gridContainer: null,
    wordsListContainer: null,
    winModal: null, 
    feedbackToast: null,
    feedbackTitle: null,
    feedbackText: null,

    // --- 2. Dados do Jogo ---
    gridData: [
        ['F', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'C', 'A', 'L', 'C', 'I', 'O', 'P'], // Linha 0
        ['E', 'G', 'Z', 'X', 'C', 'P', 'R', 'O', 'T', 'E', 'I', 'N', 'A', 'K', 'R'], // Linha 1
        ['R', 'H', 'A', 'M', 'V', 'B', 'N', 'M', 'K', 'J', 'H', 'G', 'F', 'D', 'X'], // Linha 2 
        ['R', 'J', 'B', 'Z', 'N', 'M', 'I', 'X', 'D', 'G', 'U', 'M', 'A', 'Z', 'I'], // Linha 3 
        ['O', 'K', 'A', 'Q', 'A', 'E', 'L', 'A', 'R', 'A', 'N', 'J', 'A', 'R', 'T'], // Linha 4 (LARANJA correta)
        ['X', 'L', 'C', 'W', 'N', 'B', 'P', 'Y', 'A', 'B', 'I', 'Q', 'C', 'A', 'A'], // Linha 5 
        ['C', 'E', 'N', 'O', 'U', 'R', 'A', 'T', 'H', 'M', 'K', 'J', 'A', 'N', 'M'], // Linha 6 (CENOURA)
        ['Y', 'M', 'X', 'P', 'L', 'O', 'Ñ', 'U', 'J', 'B', 'I', 'H', 'X', 'J', 'I'], // Linha 7 
        ['A', 'D', 'A', 'F', 'A', 'Q', 'I', 'Q', 'P', 'E', 'R', 'T', 'Y', 'U', 'N'], // Linha 8 
        ['A', 'N', 'B', 'R', 'I', 'C', 'O', 'A', 'I', 'S', 'Q', 'N', 'A', 'K', 'A'], // Linha 9: ABACAXI (letra 'A' na [9][0]) / BANANA (letra 'A' na [9][7])
        ['B', 'O', 'V', 'O', 'U', 'B', 'L', 'V', 'N', 'T', 'A', 'N', 'B', 'N', 'X'], // Linha 10: ABACAXI (letra 'B' na [10][0]) / BANANA (letra 'N' na [10][8])
        ['A', 'P', 'C', 'L', 'R', 'S', 'G', 'B', 'N', 'A', 'R', 'E', 'A', 'P', 'A'], // Linha 11: ABACAXI (letra 'A' na [11][0]) / BANANA (letra 'A' na [11][9])
        ['C', 'Q', 'D', 'K', 'A', 'J', 'U', 'V', 'A', 'Y', 'N', 'D', 'N', 'M', 'C'], // Linha 12: ABACAXI (letra 'C' na [12][0]) / BANANA (letra 'N' na [12][10])
        ['A', 'R', 'E', 'J', 'N', 'N', 'B', 'E', 'R', 'Ç', 'A', 'A', 'A', 'Q', 'L'], // Linha 13: ABACAXI (letra 'A' na [13][0]) / BANANA (letra 'A' na [13][11])
        ['X', 'S', 'F', 'I', 'A', 'O', 'P', 'R', 'S', 'W', 'D', 'B', 'B', 'R', 'Q'], // Linha 14: ABACAXI (letra 'X' na [14][0]) / BANANA (letra 'B' na [14][12])
        ['I', 'V', 'I', 'T', 'A', 'M', 'I', 'N', 'A', 'O', 'P', 'A', 'A', 'T', 'Z']  // Linha 15: ABACAXI (letra 'I' na [15][0]) / VITAMINA correta
    ],

    wordList: [
        { word: 'PROTEINA', found: false, coordinates: [ {r: 1, c: 5}, {r: 1, c: 6}, {r: 1, c: 7}, {r: 1, c: 8}, {r: 1, c: 9}, {r: 1, c: 10}, {r: 1, c: 11}, {r: 1, c: 12} ] },
        { word: 'CALCIO',   found: false, coordinates: [ {r: 0, c: 8}, {r: 0, c: 9}, {r: 0, c: 10}, {r: 0, c: 11}, {r: 0, c: 12}, {r: 0, c: 13} ] },
        { word: 'FERRO',    found: false, coordinates: [ {r: 0, c: 0}, {r: 1, c: 0}, {r: 2, c: 0}, {r: 3, c: 0}, {r: 4, c: 0} ] },
        { word: 'LARANJA',  found: false, coordinates: [ {r: 4, c: 6}, {r: 4, c: 7}, {r: 4, c: 8}, {r: 4, c: 9}, {r: 4, c: 10}, {r: 4, c: 11}, {r: 4, c: 12} ] },
        { word: 'CENOURA',  found: false, coordinates: [ {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5}, {r: 6, c: 6} ] },
        { word: 'ABACAXI',  found: false, coordinates: [ {r: 9, c: 0}, {r: 10, c: 0}, {r: 11, c: 0}, {r: 12, c: 0}, {r: 13, c: 0}, {r: 14, c: 0}, {r: 15, c: 0} ] },
        { word: 'BANANA',   found: false, coordinates: [ {r: 14, c: 12}, {r: 13, c: 11}, {r: 12, c: 10}, {r: 11, c: 9}, {r: 10, c: 8}, {r: 9, c: 7} ] },
        { word: 'VITAMINA', found: false, coordinates: [ {r: 15, c: 1}, {r: 15, c: 2}, {r: 15, c: 3}, {r: 15, c: 4}, {r: 15, c: 5}, {r: 15, c: 6}, {r: 15, c: 7}, {r: 15, c: 8} ] }
    ],
   
    wordBadgeMap: {
        'CALCIO': 'badge-osso',
        'FERRO': 'badge-energia',
        'PROTEINA': 'badge-musculo',
        'LARANJA': 'badge-protecao', 
        'CENOURA': 'badge-visao',    
        'VITAMINA': 'badge-osso',
        'ABACAXI': 'badge-protecao', 
        'BANANA': 'badge-energia'    
    },

    wordInfoMap: {
        'CALCIO': {
            title: 'Cálcio Encontrado!',
            text: 'Essencial para fortalecer seus OSSOS e garantir o pico de massa óssea.'
        },
        'FERRO': {
            title: 'Ferro Encontrado!',
            text: 'Garante ENERGIA e ajuda a combater a fadiga nos estudos e desportos.'
        },
        'PROTEINA': {
            title: 'Proteína Encontrada!',
            text: 'Vital para construir MÚSCULOS e para o crescimento durante o estirão.'
        },
        'LARANJA': {
            title: 'Laranja Encontrada!',
            text: 'Rica em Vitamina C, que melhora a IMUNIDADE e a absorção do ferro.'
        },
        'CENOURA': {
            title: 'Cenoura Encontrada!',
            text: 'Fonte de Vitamina A, ótima para a VISÃO e para a saúde da PELE.'
        },
        'ABACAXI': {
            title: 'Abacaxi Encontrado!',
            text: 'Assim como a laranja, é uma ótima fonte de Vitamina C (PROTEÇÃO).'
        },
        'BANANA': {
            title: 'Banana Encontrada!',
            text: 'Fonte de potássio e carboidratos, fornecendo ENERGIA rápida.'
        },
        'VITAMINA': {
            title: 'Vitamina Encontrada!',
            text: 'As vitaminas (A, C, D, etc.) são cruciais para a imunidade, visão e saúde óssea.'
        }
    },

    // --- 3. Estado do Jogo ---
    currentSelection: [],
    foundWordsCount: 0,
    isInitialized: false,
    feedbackTimer: null, 

    /** (RE)INICIA O JOGO */
    init: function() {
        console.log("WordSearchGame.init() chamado."); // DEBUG
        this.gameArea = document.getElementById('wordsearch-game-area-embedded');
        this.gridContainer = this.gameArea?.querySelector('.wordsearch-grid');
        this.wordsListContainer = this.gameArea?.querySelector('.wordsearch-words-list');
        this.winModal = document.getElementById('wordsearch-win-modal'); 
        
        // Captura os elementos do pop-up de feedback
        this.feedbackToast = document.getElementById('wordsearch-feedback');
        this.feedbackTitle = document.getElementById('feedback-title');
        this.feedbackText = document.getElementById('feedback-text');
        
        // DEBUG: Verifica se os elementos do feedback foram encontrados
        if (!this.feedbackToast) console.error("ERRO: Elemento #wordsearch-feedback NÃO encontrado!");
        if (!this.feedbackTitle) console.error("ERRO: Elemento #feedback-title NÃO encontrado!");
        if (!this.feedbackText) console.error("ERRO: Elemento #feedback-text NÃO encontrado!");


        if (!this.gameArea || !this.gridContainer || !this.wordsListContainer) {
            console.error("Elementos essenciais do DOM para o Caça-Palavras não foram encontrados.");
            return;
        }

        if (!this.gridData || this.gridData.length === 0 || !this.gridData[0] || !this.gridData[0].length === 0) {
            console.error("gridData está vazio ou inválido.");
            return;
        }
        const numRows = this.gridData.length;
        const numCols = this.gridData[0].length;
        
        this.closeWinModal();
        this.currentSelection = [];
        this.foundWordsCount = 0;
        this.wordList.forEach(w => w.found = false);

        this.clearAllSelectionClasses();
        this.clearAllFoundClasses();
        this.feedbackToast?.classList.remove('show'); 

        this.createGrid(numRows, numCols);
        this.createWordList();

        if (!this.isInitialized) {
            console.log("Adicionando listeners de reinício."); // DEBUG
            document.getElementById('wordsearch-embedded-restart')?.addEventListener('click', this.init.bind(this));
            
            document.getElementById('wordsearch-win-restart')?.addEventListener('click', this.init.bind(this));
            document.getElementById('wordsearch-win-close')?.addEventListener('click', this.closeWinModal.bind(this));
            
            this.isInitialized = true;
        }
    },

    /** Cria o grid de letras e adiciona listener de clique */
    createGrid: function(numRows, numCols) {
        // ... (código igual)
        if (!this.gridContainer) return;
        this.gridContainer.innerHTML = '';
        this.gridContainer.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${numRows}, 1fr)`;

        this.gridData.slice(0, numRows).forEach((row, r) => {
            const current_row = row.slice(0, numCols).concat(Array(Math.max(0, numCols - row.length)).fill('?'));

            current_row.forEach((letter, c) => {
                const cell = document.createElement('button');
                cell.className = 'wordsearch-cell';
                cell.textContent = letter.toUpperCase();
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.setAttribute('aria-label', `Letra ${letter}, linha ${r+1}, coluna ${c+1}`);
                cell.addEventListener('click', this.handleCellClick.bind(this));
                cell.addEventListener('mousedown', (e) => e.preventDefault());
                this.gridContainer.appendChild(cell);
            });
        });
    },

    /** Cria a lista de palavras */
    createWordList: function() {
        // ... (código igual)
        if (!this.wordsListContainer) return;
        this.wordsListContainer.innerHTML = '';
        const sortedWordList = [...this.wordList].sort((a, b) => a.word.localeCompare(b.word));
        
        sortedWordList.forEach(wordObj => {
            const li = document.createElement('li');
            li.dataset.word = wordObj.word;
            li.classList.remove('found');

            const badgeClass = this.wordBadgeMap[wordObj.word];
            
            if (badgeClass) {
                li.classList.add(badgeClass);
                li.textContent = wordObj.word;
            } else {
                li.textContent = wordObj.word;
            }

            this.wordsListContainer.appendChild(li);
        });
    },

    // --- Funções de Evento ---
    handleCellClick: function(e) {
        // ... (código igual)
        const clickedCellElement = e.target;
        if (!clickedCellElement.classList.contains('wordsearch-cell') || clickedCellElement.classList.contains('found')) {
            return;
        }

        const r = parseInt(clickedCellElement.dataset.r, 10);
        const c = parseInt(clickedCellElement.dataset.c, 10);
        const cellData = { r, c, el: clickedCellElement };

        const existingIndex = this.currentSelection.findIndex(s => s.r === r && s.c === c);

        if (existingIndex !== -1) {
            const cellsToRemove = this.currentSelection.splice(existingIndex);
            cellsToRemove.forEach(cell => cell.el.classList.remove('selected'));
        } else {
            if (this.currentSelection.length === 0) {
                this.currentSelection.push(cellData);
                clickedCellElement.classList.add('selected');
            } else {
                const lastCell = this.currentSelection[this.currentSelection.length - 1];
                if (this.areCellsAdjacent(lastCell, cellData)) {
                    this.currentSelection.push(cellData);
                    clickedCellElement.classList.add('selected');
                } else {
                    this.clearAllSelectionClasses();
                    this.currentSelection = [cellData];
                    clickedCellElement.classList.add('selected');
                }
            }
            this.checkSelection();
        }
    },

    closeWinModal: function() {
        // ... (código igual)
        if (this.winModal) {
            this.winModal.classList.remove('active');
        }
        document.body.classList.remove('game-modal-open'); 
    },

    // --- Funções de Lógica ---
    
    // Nova função para mostrar o feedback
    showWordFeedback: function(palavra) {
        console.log(`showWordFeedback chamada para: ${palavra}`); // DEBUG

        const info = this.wordInfoMap[palavra];
        
        if (!info) {
            console.warn(`Nenhuma informação encontrada para ${palavra}`); // DEBUG
            return; 
        }
        
        if (!this.feedbackToast || !this.feedbackTitle || !this.feedbackText) {
            console.error("ERRO: Elementos do Feedback (Toast, Title, Text) não estão definidos no 'this'."); // DEBUG
            return;
        }

        if (this.feedbackTimer) {
            clearTimeout(this.feedbackTimer);
            console.log("Timer anterior limpo."); // DEBUG
        }
        
        this.feedbackTitle.textContent = info.title;
        this.feedbackText.textContent = info.text;
        
        const badgeClass = this.wordBadgeMap[palavra]; 
        const badgeEl = this.wordsListContainer.querySelector(`li[data-word="${palavra}"]`);
        
        if (badgeEl && badgeClass) {
             const computedStyle = window.getComputedStyle(badgeEl);
             this.feedbackToast.style.borderColor = computedStyle.borderColor;
             this.feedbackTitle.style.color = computedStyle.color;
             console.log(`Estilo do emblema '${badgeClass}' aplicado.`); // DEBUG
        } else {
             this.feedbackToast.style.borderColor = 'var(--color-primary)';
             this.feedbackTitle.style.color = 'var(--color-secondary)';
             console.log("Estilo de fallback aplicado."); // DEBUG
        }

        this.feedbackToast.classList.add('show');
        console.log("Classe '.show' adicionada ao Toast."); // DEBUG

        this.feedbackTimer = setTimeout(() => {
            this.feedbackToast.classList.remove('show');
            console.log("Feedback escondido após 4 segundos."); // DEBUG
        }, 4000);
    },

    areCellsAdjacent: function(cell1, cell2) {
        // ... (código igual)
        if (!cell1 || !cell2) return false;
        const rowDiff = Math.abs(cell1.r - cell2.r);
        const colDiff = Math.abs(cell1.c - cell2.c);
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
    },

    clearAllSelectionClasses: function() {
        // ... (código igual)
        this.gridContainer?.querySelectorAll('.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    },

    clearAllFoundClasses: function() {
        // ... (código igual)
        this.gridContainer?.querySelectorAll('.found').forEach(cell => {
            cell.classList.remove('found');
        });
    },

    checkSelection: function() {
        // ... (código igual)
        if (this.currentSelection.length < 2) return;

        const getCoordsString = (selection) =>
            selection.map(s => `${s.r},${s.c}`).join('|');

        const selectionString = getCoordsString(this.currentSelection);
        const selectionStringReversed = getCoordsString([...this.currentSelection].reverse());

        for (const wordObj of this.wordList) {
            if (wordObj.found) continue;
             const wordCoordsString = wordObj.coordinates.map(c => `${c.r},${c.c}`).join('|');

            if (wordObj.coordinates.length === this.currentSelection.length) {
                if (wordCoordsString === selectionString || wordCoordsString === selectionStringReversed) {
                    this.markWordAsFound(wordObj);
                    return;
                }
            }
        }
    },

    markWordAsFound: function(wordObj) {
        console.log(`Palavra encontrada: ${wordObj.word}`); // DEBUG
        wordObj.found = true;
        this.foundWordsCount++;

        const li = this.wordsListContainer?.querySelector(`li[data-word="${wordObj.word}"]`);
        if (li) {
            li.classList.add('found');
        }

        this.currentSelection.forEach(selectedCell => {
            selectedCell.el.classList.remove('selected');
            selectedCell.el.classList.add('found');
        });

        this.currentSelection = [];

        // Chama a função de feedback
        this.showWordFeedback(wordObj.word); 

        this.checkWinCondition();
    },

    checkWinCondition: function() {
        // ... (código igual)
        if (this.foundWordsCount === this.wordList.length) {
            setTimeout(() => {
                if (typeof triggerConfetti === 'function') {
                    triggerConfetti(document.body); 
                }
            }, 300);
        }
    }
};