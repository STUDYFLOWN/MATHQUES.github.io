/* ==========================================================================
   MathQuest V3 - Módulo Sodocu Algebraico 9x9
   Sudoku completo de 9x9 con subcuadrículas 3x3, ecuaciones dinámicas
   con hasta 5 variables (a, b, c, d, e) y soporte de Pistas Globales.
   ========================================================================== */

(function() {
    let solvedBoard = [];
    let cells = []; // 81 celdas
    let varValues = { a: 0, b: 0, c: 0, d: 0, e: 0 };
    let selectedCell = null;
    let gameActive = false;

    // Inicializar el Juego de Sudoku 9x9
    window.initSudokuGame = function() {
        const overlay = document.getElementById('sudoku-overlay');
        const startBtn = document.getElementById('btn-start-sudoku-game');
        
        if (overlay) overlay.classList.remove('hidden');

        if (startBtn) {
            startBtn.onclick = function() {
                sounds.playClick();
                if (overlay) overlay.classList.add('hidden');
                setupNewGame();
            };
        }

        const restartBtn = document.getElementById('btn-restart-sudoku');
        if (restartBtn) {
            restartBtn.onclick = function() {
                sounds.playClick();
                setupNewGame();
            };
        }

        // Registrar callback de pistas universales (auto-rellena la celda seleccionada!)
        window.registerGameHintCallback(useSudokuHint);

        setupNumpad();
    };

    window.stopSudokuGame = function() {
        gameActive = false;
        selectedCell = null;
    };

    function setupNewGame() {
        gameActive = true;
        selectedCell = null;

        // 1. Generar tablero 9x9 resuelto por permutación de base matemática
        generateSolvedBoard();

        // 2. Asignar valores a variables según dificultad
        assignVariables();

        // 3. Generar pistas algebraicas
        generateCluesUI();

        // 4. Crear mapa de celdas (fijas, variables y vacías)
        createBoardCells();

        // 5. Renderizar en el DOM
        renderBoard();
    }

    // Generador de Sudoku 9x9 robusto en O(1)
    function generateSolvedBoard() {
        let base = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [4, 5, 6, 7, 8, 9, 1, 2, 3],
            [7, 8, 9, 1, 2, 3, 4, 5, 6],
            [2, 3, 1, 5, 6, 4, 8, 9, 7],
            [5, 6, 4, 8, 9, 7, 2, 3, 1],
            [8, 9, 7, 2, 3, 1, 5, 6, 4],
            [3, 1, 2, 6, 4, 5, 9, 7, 8],
            [6, 4, 5, 9, 7, 8, 3, 1, 2],
            [9, 7, 8, 3, 1, 2, 6, 4, 5]
        ];

        // 1. Mezclar bloques de 3 filas
        if (Math.random() > 0.5) {
            let t = base.slice(0, 3);
            base.splice(0, 3, ...base.slice(3, 6));
            base.splice(3, 3, ...t);
        }

        // 2. Mezclar filas individuales dentro de su bloque de 3
        let shuffleRows = (startIdx) => {
            if (Math.random() > 0.5) {
                let temp = base[startIdx];
                base[startIdx] = base[startIdx + 1];
                base[startIdx + 1] = temp;
            }
        };
        shuffleRows(0);
        shuffleRows(3);
        shuffleRows(6);

        // 3. Intercambiar dígitos aleatoriamente para infinidad de tableros
        let digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = digits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [digits[i], digits[j]] = [digits[j], digits[i]];
        }

        solvedBoard = base.map(row => row.map(val => digits[val - 1]));
    }

    // Permutación aleatoria de valores para a, b, c, d, e
    function assignVariables() {
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }

        varValues.a = values[0];
        varValues.b = values[1];
        varValues.c = values[2];
        varValues.d = values[3];
        varValues.e = values[4];
    }

    // Generador de Ecuaciones Procedurales
    function generateCluesUI() {
        const { a, b, c, d, e } = varValues;
        const lvl = state.activeGameLevel || 1;
        const clues = [];

        if (lvl === 1) {
            // Fácil: Solo resolver 'a' y 'b'
            clues.push(`b = ${b}`);
            clues.push(`a + b = ${a + b}`);
            clues.push(`c, d, e = ya reveladas en el mapa`);
        } 
        else if (lvl === 2) {
            // Medio: a, b, c
            clues.push(`b = ${b}`);
            clues.push(`a + b = ${a + b}`);
            const diff = a + b - c;
            clues.push(`c = a + b ${diff >= 0 ? '-' : '+'} ${Math.abs(diff)}`);
            clues.push(`d, e = ya reveladas en el mapa`);
        } 
        else {
            // Difícil: a, b, c, d, e cruzados de secundaria
            clues.push(`b = ${b}`);
            clues.push(`a + b = ${a + b}`);
            const diff3 = a + b - c;
            clues.push(`c = a + b ${diff3 >= 0 ? '-' : '+'} ${Math.abs(diff3)}`);
            clues.push(`d = a * 2 - b`);
            clues.push(`e = d - c + 1`);
        }

        const cluesBox = document.getElementById('sudoku-clues-box');
        if (cluesBox) {
            cluesBox.innerHTML = clues.join('<br>');
        }
    }

    // Crear el mapa de 81 celdas
    function createBoardCells() {
        cells = [];
        const lvl = state.activeGameLevel || 1;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                cells.push({
                    row: r,
                    col: c,
                    correctValue: solvedBoard[r][c],
                    type: 'empty',
                    variableName: null,
                    currentValue: null
                });
            }
        }

        // 1. Asignar variables según nivel
        const variables = ['a', 'b'];
        if (lvl >= 2) variables.push('c');
        if (lvl >= 3) variables.push('d', 'e');

        variables.forEach(varName => {
            const val = varValues[varName];
            const matchCells = cells.filter(cell => cell.correctValue === val && cell.type === 'empty');
            if (matchCells.length > 0) {
                // Colocar variable en 2 cuadrículas aleatorias para practicar
                for (let k = 0; k < 2; k++) {
                    const chosenCell = matchCells[Math.floor(Math.random() * matchCells.length)];
                    chosenCell.type = 'variable';
                    chosenCell.variableName = varName;
                }
            }
        });

        // 2. Colocar celdas fijas (pistas numéricas iniciales, más en fácil, menos en difícil)
        let fixedCount = lvl === 1 ? 38 : lvl === 2 ? 30 : 22; // Menos pistas = más dificultad!
        let fixedAdded = 0;
        let attempts = 0;
        while (fixedAdded < fixedCount && attempts < 250) {
            attempts++;
            const randIdx = Math.floor(Math.random() * 81);
            const cell = cells[randIdx];
            if (cell.type === 'empty') {
                cell.type = 'fixed';
                cell.currentValue = cell.correctValue;
                fixedAdded++;
            }
        }

        // Si hay variables ocultadas en la dificultad fácil/media, auto-rellenarlas
        if (lvl < 3) {
            const hiddenVars = lvl === 1 ? ['c', 'd', 'e'] : ['d', 'e'];
            hiddenVars.forEach(vName => {
                const val = varValues[vName];
                cells.forEach(cell => {
                    if (cell.correctValue === val && cell.type === 'empty') {
                        cell.type = 'fixed';
                        cell.currentValue = val;
                    }
                });
            });
        }
    }

    // Renderizar
    function renderBoard() {
        const grid = document.getElementById('sudoku-board-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        cells.forEach((cell, idx) => {
            const cellEl = document.createElement('div');
            cellEl.className = 'sudoku-cell';
            cellEl.dataset.index = idx;
            
            // Asignar filas/columnas para líneas gruesas de subcuadrículas 3x3 en CSS
            cellEl.dataset.row = cell.row;
            cellEl.dataset.col = cell.col;

            if (cell.type === 'fixed') {
                cellEl.classList.add('cell-fixed');
                cellEl.textContent = cell.currentValue;
            } else if (cell.type === 'variable') {
                cellEl.classList.add('cell-variable');
                if (cell.currentValue) {
                    cellEl.innerHTML = `<span class="cell-num">${cell.currentValue}</span><sub class="cell-sub" style="font-size:0.6rem; opacity:0.6; margin-left:1.5px;">${cell.variableName}</sub>`;
                } else {
                    cellEl.textContent = cell.variableName;
                }
            } else {
                if (cell.currentValue) {
                    cellEl.textContent = cell.currentValue;
                } else {
                    cellEl.textContent = '';
                }
            }

            cellEl.addEventListener('click', () => {
                if (!gameActive) return;
                if (cell.type === 'fixed') {
                    sounds.playWrong();
                    return;
                }
                sounds.playClick();
                selectCell(cell, cellEl);
            });

            grid.appendChild(cellEl);
        });
    }

    function selectCell(cell, cellEl) {
        document.querySelectorAll('.sudoku-cell').forEach(el => el.classList.remove('cell-selected'));

        if (selectedCell === cell) {
            selectedCell = null;
        } else {
            selectedCell = cell;
            cellEl.classList.add('cell-selected');
        }
    }

    // Pistas Universales callback: ¡Autocompleta la celda seleccionada!
    function useSudokuHint() {
        if (selectedCell && gameActive) {
            selectedCell.currentValue = selectedCell.correctValue;
            renderBoard();
            
            // Mantener selección visual
            const idx = cells.indexOf(selectedCell);
            const cellEl = document.querySelector(`.sudoku-cell[data-index="${idx}"]`);
            if (cellEl) cellEl.classList.add('cell-selected');

            sounds.playCorrect();
            confetti.spawn(15);
            checkGameWin();
        } else {
            alert("💡 Por favor, selecciona primero una casilla vacía o una variable en la cuadrícula para rellenarla con la pista.");
        }
    }

    // Teclado Numérico 1-9
    function setupNumpad() {
        const numBtns = document.querySelectorAll('.sudoku-num-btn');
        numBtns.forEach(btn => {
            btn.onclick = function() {
                if (!gameActive || !selectedCell) {
                    sounds.playWrong();
                    return;
                }

                sounds.playClick();
                const numVal = btn.getAttribute('data-num');

                if (numVal) {
                    selectedCell.currentValue = parseInt(numVal, 10);
                } else if (btn.id === 'btn-sudoku-clear') {
                    selectedCell.currentValue = null;
                }

                renderBoard();
                
                const idx = cells.indexOf(selectedCell);
                const cellEl = document.querySelector(`.sudoku-cell[data-index="${idx}"]`);
                if (cellEl) cellEl.classList.add('cell-selected');

                checkGameWin();
            };
        });
    }

    function checkGameWin() {
        const unfilled = cells.filter(cell => cell.currentValue === null);
        if (unfilled.length > 0) return;

        const incorrect = cells.filter(cell => cell.currentValue !== cell.correctValue);

        if (incorrect.length === 0) {
            gameActive = false;
            selectedCell = null;
            document.querySelectorAll('.sudoku-cell').forEach(el => el.classList.remove('cell-selected'));

            sounds.playWin();
            confetti.spawn(75);

            addStars(15);
            addCoins(45);

            const lvl = state.activeGameLevel || 1;
            if (lvl === 1) {
                unlockLevel('sudoku', 2);
                openMateoModal("🎉 ¡Sodocu Resuelto!", "¡Excelente! Has resuelto el Sudoku 9x9 Fácil y desbloqueaste el Nivel 2: Sodocu Medio.");
            } else if (lvl === 2) {
                unlockLevel('sudoku', 3);
                openMateoModal("🎉 ¡Sodocu Resuelto!", "¡Excelente! Has resuelto el Sudoku 9x9 Medio y desbloqueaste el Nivel 3: Sodocu Difícil.");
            } else {
                unlockLevel('ahorcado', 1);
                openMateoModal("🎉 ¡Sodocu Resuelto!", "¡Magnífico! Has conquistado el Sudoku 9x9 Difícil y desbloqueaste el **Ahorcado Matemático (Fácil)**.");
            }
        }
    }
})();
