/* =======================================================
 * LÓGICA JOGO CAÇA-PALAVRAS (V17 - Modal de Vitória Removido)
 * ======================================================= */

const WordSearchGame = {
    // --- 1. Elementos do DOM ---
    gameArea: null,
    gridContainer: null,
    wordsListContainer: null,
    winModal: null, // Deixamos a referência, mas não vamos usá-la para ativar

    // --- 2. Dados do Jogo ---
    // GRID CORRIGIDO (V16) - BANANA e LARANJA Corrigidos, Fantasma Removido
    
    gridData: [
        ['F', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'C', 'A', 'L', 'C', 'I', 'O', 'P'], // Linha 0
        ['E', 'G', 'Z', 'X', 'C', 'P', 'R', 'O', 'T', 'E', 'I', 'N', 'A', 'K', 'R'], // Linha 1
        ['R', 'H', 'A', 'M', 'V', 'B', 'N', 'M', 'K', 'J', 'H', 'G', 'F', 'D', 'X'], // Linha 2 (Fantasma quebrado)
        ['R', 'J', 'B', 'Z', 'N', 'M', 'I', 'X', 'D', 'G', 'U', 'M', 'A', 'Z', 'I'], // Linha 3 (Fantasma quebrado)
        ['O', 'K', 'A', 'Q', 'A', 'E', 'L', 'A', 'R', 'A', 'N', 'J', 'A', 'R', 'T'], // Linha 4 (LARANJA correta)
        ['X', 'L', 'C', 'W', 'N', 'B', 'P', 'Y', 'A', 'B', 'I', 'Q', 'C', 'A', 'A'], // Linha 5 (Fantasma quebrado)
        ['C', 'E', 'N', 'O', 'U', 'R', 'A', 'T', 'H', 'M', 'K', 'J', 'A', 'N', 'M'], // Linha 6 (CENOURA e Fantasma quebrado)
        ['Y', 'M', 'X', 'P', 'L', 'O', 'Ñ', 'U', 'J', 'B', 'I', 'H', 'X', 'J', 'I'], // Linha 7 (Fantasma quebrado)
        ['A', 'D', 'A', 'F', 'A', 'Q', 'I', 'Q', 'P', 'E', 'R', 'T', 'Y', 'U', 'N'], // Linha 8 (Fantasma quebrado)
        ['A', 'N', 'B', 'R', 'I', 'C', 'O', 'A', 'I', 'S', 'Q', 'N', 'A', 'K', 'A'], // Linha 9: ABACAXI (letra 'A' na [9][0]) / BANANA (letra 'A' na [9][7])
        ['B', 'O', 'V', 'O', 'U', 'B', 'L', 'V', 'N', 'T', 'A', 'N', 'B', 'N', 'X'], // Linha 10: ABACAXI (letra 'B' na [10][0]) / BANANA (letra 'N' na [10][8])
        ['A', 'P', 'C', 'L', 'R', 'S', 'G', 'B', 'N', 'A', 'R', 'E', 'A', 'P', 'A'], // Linha 11: ABACAXI (letra 'A' na [11][0]) / BANANA (letra 'A' na [11][9])
        ['C', 'Q', 'D', 'K', 'A', 'J', 'U', 'V', 'A', 'Y', 'N', 'D', 'N', 'M', 'C'], // Linha 12: ABACAXI (letra 'C' na [12][0]) / BANANA (letra 'N' na [12][10])
        ['A', 'R', 'E', 'J', 'N', 'N', 'B', 'E', 'R', 'Ç', 'A', 'A', 'A', 'Q', 'L'], // Linha 13: ABACAXI (letra 'A' na [13][0]) / BANANA (letra 'A' na [13][11])
        ['X', 'S', 'F', 'I', 'A', 'O', 'P', 'R', 'S', 'W', 'D', 'B', 'B', 'R', 'Q'], // Linha 14: ABACAXI (letra 'X' na [14][0]) / BANANA (letra 'B' na [14][12])
        ['I', 'V', 'I', 'T', 'A', 'M', 'I', 'N', 'A', 'O', 'P', 'A', 'A', 'T', 'Z']  // Linha 15: ABACAXI (letra 'I' na [15][0]) / VITAMINA correta
    ],

     // LISTA COM 8 PALAVRAS
    wordList: [
        { word: 'PROTEINA', found: false, coordinates: [ {r: 1, c: 5}, {r: 1, c: 6}, {r: 1, c: 7}, {r: 1, c: 8}, {r: 1, c: 9}, {r: 1, c: 10}, {r: 1, c: 11}, {r: 1, c: 12} ] },
        { word: 'CALCIO',   found: false, coordinates: [ {r: 0, c: 8}, {r: 0, c: 9}, {r: 0, c: 10}, {r: 0, c: 11}, {r: 0, c: 12}, {r: 0, c: 13} ] },
        { word: 'FERRO',    found: false, coordinates: [ {r: 0, c: 0}, {r: 1, c: 0}, {r: 2, c: 0}, {r: 3, c: 0}, {r: 4, c: 0} ] },
        { word: 'LARANJA',  found: false, coordinates: [ {r: 4, c: 6}, {r: 4, c: 7}, {r: 4, c: 8}, {r: 4, c: 9}, {r: 4, c: 10}, {r: 4, c: 11}, {r: 4, c: 12} ] }, // CORRETO
        { word: 'CENOURA',  found: false, coordinates: [ {r: 6, c: 0}, {r: 6, c: 1}, {r: 6, c: 2}, {r: 6, c: 3}, {r: 6, c: 4}, {r: 6, c: 5}, {r: 6, c: 6} ] },
        { word: 'ABACAXI',  found: false, coordinates: [ {r: 9, c: 0}, {r: 10, c: 0}, {r: 11, c: 0}, {r: 12, c: 0}, {r: 13, c: 0}, {r: 14, c: 0}, {r: 15, c: 0} ] }, // CORRETO
        { word: 'BANANA',   found: false, coordinates: [ {r: 14, c: 12}, {r: 13, c: 11}, {r: 12, c: 10}, {r: 11, c: 9}, {r: 10, c: 8}, {r: 9, c: 7} ] }, // CORRETO
        { word: 'VITAMINA', found: false, coordinates: [ {r: 15, c: 1}, {r: 15, c: 2}, {r: 15, c: 3}, {r: 15, c: 4}, {r: 15, c: 5}, {r: 15, c: 6}, {r: 15, c: 7}, {r: 15, c: 8} ] }  // CORRETO
    ],
   

    // --- 3. Estado do Jogo ---
    currentSelection: [],
    foundWordsCount: 0,
    isInitialized: false,

    /** (RE)INICIA O JOGO */
    init: function() {
        this.gameArea = document.getElementById('wordsearch-game-area-embedded');
        this.gridContainer = this.gameArea?.querySelector('.wordsearch-grid');
        this.wordsListContainer = this.gameArea?.querySelector('.wordsearch-words-list');
        this.winModal = document.getElementById('wordsearch-win-modal'); // O JS ainda procura por ele

        // MODIFICADO: A verificação do winModal NÃO é mais essencial para iniciar
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
        // console.log(`Grid inicializado com ${numRows} linhas e ${numCols} colunas.`);

        this.closeWinModal(); // Tenta fechar, não faz mal se não existir
        this.currentSelection = [];
        this.foundWordsCount = 0;
        this.wordList.forEach(w => w.found = false);

        this.clearAllSelectionClasses();
        this.clearAllFoundClasses();

        this.createGrid(numRows, numCols);
        this.createWordList();

        if (!this.isInitialized) {
            document.getElementById('wordsearch-embedded-restart')?.addEventListener('click', this.init.bind(this));
            
            // MODIFICADO: Os botões do modal não são mais essenciais
            document.getElementById('wordsearch-win-restart')?.addEventListener('click', this.init.bind(this));
            document.getElementById('wordsearch-win-close')?.addEventListener('click', this.closeWinModal.bind(this));
            
            this.isInitialized = true;
        }
    },

    /** Cria o grid de letras e adiciona listener de clique */
    createGrid: function(numRows, numCols) {
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
        if (!this.wordsListContainer) return;
        this.wordsListContainer.innerHTML = '';
        const sortedWordList = [...this.wordList].sort((a, b) => a.word.localeCompare(b.word));
        sortedWordList.forEach(wordObj => {
            const li = document.createElement('li');
            li.textContent = wordObj.word;
            li.dataset.word = wordObj.word;
            li.classList.remove('found');
            this.wordsListContainer.appendChild(li);
        });
    },

    // --- Funções de Evento ---
    handleCellClick: function(e) {
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
        if (this.winModal) {
            this.winModal.classList.remove('active');
        }
        // Remove também a classe do body, caso ela tenha sido adicionada
        document.body.classList.remove('game-modal-open'); 
    },

    // --- Funções de Lógica ---
    areCellsAdjacent: function(cell1, cell2) {
        if (!cell1 || !cell2) return false;
        const rowDiff = Math.abs(cell1.r - cell2.r);
        const colDiff = Math.abs(cell1.c - cell2.c);
        return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
    },

    clearAllSelectionClasses: function() {
        this.gridContainer?.querySelectorAll('.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    },

    clearAllFoundClasses: function() {
        this.gridContainer?.querySelectorAll('.found').forEach(cell => {
            cell.classList.remove('found');
        });
    },

    checkSelection: function() {
        if (this.currentSelection.length < 2) return;

        const getCoordsString = (selection) =>
            selection.map(s => `${s.r},${s.c}`).join('|');

        const selectionString = getCoordsString(this.currentSelection);
        const selectionStringReversed = getCoordsString([...this.currentSelection].reverse());

        // console.log(`Current Selection: ${selectionString}`);

        for (const wordObj of this.wordList) {
            if (wordObj.found) continue;

             const wordCoordsString = wordObj.coordinates.map(c => `${c.r},${c.c}`).join('|');

            //  console.log(`Checking against: ${wordObj.word} (${wordCoordsString})`);
            //  console.log(`  Lengths match? ${wordObj.coordinates.length} vs ${this.currentSelection.length}`);

            if (wordObj.coordinates.length === this.currentSelection.length) {
                if (wordCoordsString === selectionString || wordCoordsString === selectionStringReversed) {
                    // console.log(`  MATCH FOUND for ${wordObj.word}!`);
                    this.markWordAsFound(wordObj);
                    return;
                } else {
                    // console.log(`  Coords mismatch.`);
                }
            } else {
                // console.log(`  Length mismatch.`);
            }
        }
    },

    markWordAsFound: function(wordObj) {
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

        this.checkWinCondition();
    },

    // =======================================================
    // ==== FUNÇÃO DE VITÓRIA MODIFICADA ====
    // =======================================================
    checkWinCondition: function() {
        if (this.foundWordsCount === this.wordList.length) {
            setTimeout(() => {
                
                // LINHAS QUE MOSTRAM O MODAL E O BLUR FORAM REMOVIDAS:
                // document.body.classList.add('game-modal-open');
                // this.winModal?.classList.add('active'); 
                
                // CHAMA APENAS OS CONFETES
                if (typeof triggerConfetti === 'function') {
                    // Usamos 'document.body' como âncora, 
                    // já que não queremos depender do modal
                    triggerConfetti(document.body); 
                }
            }, 300);
        }
    }
};