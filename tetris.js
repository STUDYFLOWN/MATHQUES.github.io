/* ==========================================================================
   MathQuest V3 - Módulo Math-Tetris (Ángulos Geométricos)
   Bloques de múltiples tamaños (1x1, 2x1 horizontales y 1x2 verticales),
   velocidad incremental y soporte de Pistas Globales (limpieza de la fila inferior).
   ========================================================================== */

(function() {
    let tetrisInterval = null;
    const tetrisCanvas = document.getElementById('tetris-canvas');
    const tetrisCtx = tetrisCanvas?.getContext('2d');

    const tetrisCols = 8;
    const tetrisRows = 12;
    const tetrisBlockSize = 37.5; // 300 / 8 = 37.5px

    let tetrisBoard = [];
    let tetrisFallingBlock = null; // Estructura: { shape: [[x,y,val,color]], x, y }
    let tetrisScore = 0;
    let isTetrisPlaying = false;
    let tetrisTargetAngle = 90;
    
    let baseSpeed = 900; // ms
    let tickCount = 0;

    const ANGLES_LIST = [30, 45, 60, 90, 120, 150];
    const ANGLE_COLORS = {
        30: '#ef4444',  // Coral
        45: '#fb923c',  // Naranja
        60: '#eab308',  // Amarillo
        90: '#10b981',  // Verde
        120: '#3b82f6', // Azul
        150: '#8b5cf6'  // Morado
    };

    function initTetrisGame() {
        isTetrisPlaying = false;
        tetrisScore = 0;
        tickCount = 0;
        document.getElementById('tetris-score').textContent = '0';

        const lvl = state.activeGameLevel || 1;
        const diffLabels = { 1: "Fácil", 2: "Medio", 3: "Difícil" };
        document.getElementById('tetris-overlay-title').textContent = `Math-Tetris 🧱 - Nivel ${diffLabels[lvl]}`;
        
        let descText = "";
        if (lvl === 1) {
            descText = "Los bloques caen a velocidad lenta. La meta es siempre **Suma 90° (Ángulos Complementarios)**. ¡Alinea y limpia!";
        } else if (lvl === 2) {
            descText = "Los bloques caen a velocidad intermedia. La meta alterna entre **Suma 90° y Suma 180° (Ángulos Suplementarios)**.";
        } else {
            descText = "¡Gravedad máxima y mayor variedad de formas! La meta alterna constantemente. ¡Demuestra tu agilidad espacial!";
        }
        document.getElementById('tetris-overlay-text').innerHTML = descText;
        document.getElementById('tetris-overlay').classList.remove('hidden');

        // Registrar callback de pista global
        window.registerGameHintCallback(useTetrisHint);

        resetTetrisBoard();
        setRandomTargetAngle();
        drawTetrisGame();
    }

    function startTetrisGamePlay() {
        sounds.playClick();
        document.getElementById('tetris-overlay').classList.add('hidden');
        
        resetTetrisBoard();
        tetrisScore = 0;
        tickCount = 0;
        document.getElementById('tetris-score').textContent = '0';
        setRandomTargetAngle();
        spawnTetrisBlock();
        
        isTetrisPlaying = true;

        const lvl = state.activeGameLevel || 1;
        if (lvl === 1) baseSpeed = 1000;
        else if (lvl === 2) baseSpeed = 800;
        else baseSpeed = 600; // Difícil
        
        if (tetrisInterval) clearInterval(tetrisInterval);
        tetrisInterval = setInterval(updateTetrisGame, baseSpeed);
    }

    function stopTetrisGame() {
        isTetrisPlaying = false;
        if (tetrisInterval) {
            clearInterval(tetrisInterval);
            tetrisInterval = null;
        }
    }

    function resetTetrisBoard() {
        tetrisBoard = Array(tetrisRows).fill().map(() => Array(tetrisCols).fill(null));
    }

    function setRandomTargetAngle() {
        const lvl = state.activeGameLevel || 1;
        if (lvl === 1) {
            tetrisTargetAngle = 90; // Siempre complementario
        } else {
            tetrisTargetAngle = Math.random() > 0.5 ? 90 : 180;
        }
        
        const panel = document.getElementById('tetris-target-desc');
        if (panel) {
            panel.textContent = tetrisTargetAngle === 90 
                ? "¡Suma 90° (Complementarios)!" 
                : "¡Suma 180° (Suplementarios)!";
            panel.style.background = tetrisTargetAngle === 90 ? 'var(--color-accent-green)' : 'var(--color-accent-purple)';
            panel.style.color = '#ffffff';
        }
    }

    // Spawn de bloques de múltiples formas (1x1, 2x1 y 1x2)
    function spawnTetrisBlock() {
        const shapeType = Math.random();
        let tiles = [];

        // Generar un ángulo aleatorio válido
        let getRndAngle = () => {
            let a = ANGLES_LIST[Math.floor(Math.random() * ANGLES_LIST.length)];
            while (a >= tetrisTargetAngle) {
                a = ANGLES_LIST[Math.floor(Math.random() * ANGLES_LIST.length)];
            }
            return a;
        };

        if (shapeType < 0.50) {
            // Forma 1: Cuadrado 1x1 clásico
            const a1 = getRndAngle();
            tiles.push({ rx: 0, ry: 0, val: a1, color: ANGLE_COLORS[a1] });
        } else if (shapeType < 0.75) {
            // Forma 2: Bloque Horizontal 2x1
            const a1 = getRndAngle();
            const a2 = getRndAngle();
            tiles.push({ rx: 0, ry: 0, val: a1, color: ANGLE_COLORS[a1] });
            tiles.push({ rx: 1, ry: 0, val: a2, color: ANGLE_COLORS[a2] });
        } else {
            // Forma 3: Bloque Vertical 1x2
            const a1 = getRndAngle();
            const a2 = getRndAngle();
            tiles.push({ rx: 0, ry: 0, val: a1, color: ANGLE_COLORS[a1] });
            tiles.push({ rx: 0, ry: 1, val: a2, color: ANGLE_COLORS[a2] });
        }

        tetrisFallingBlock = {
            x: Math.floor(tetrisCols / 2) - 1,
            y: 0,
            tiles: tiles
        };

        // Game Over inmediato si colisiona al nacer
        if (checkTetrisCollision(tetrisFallingBlock.x, tetrisFallingBlock.y, tetrisFallingBlock.tiles)) {
            gameOverTetris();
        }
    }

    function checkTetrisCollision(bx, by, tiles) {
        for (let t of tiles) {
            const gx = bx + t.rx;
            const gy = by + t.ry;

            if (gx < 0 || gx >= tetrisCols || gy >= tetrisRows) {
                return true;
            }
            if (gy >= 0 && tetrisBoard[gy][gx] !== null) {
                return true;
            }
        }
        return false;
    }

    // Callback de Pista Universal en Tetris (Limpia toda la fila inferior para dar respiro)
    function useTetrisHint() {
        // Encontrar la última fila que contenga algún bloque
        let clearedRow = false;
        for (let r = tetrisRows - 1; r >= 0; r--) {
            if (tetrisBoard[r].some(cell => cell !== null)) {
                // Limpiar esta fila entera
                tetrisBoard[r] = Array(tetrisCols).fill(null);
                clearedRow = true;
                break;
            }
        }

        if (clearedRow) {
            sounds.playCorrect();
            confetti.spawn(30);
            drawTetrisGame();
        } else {
            alert("💡 No hay ningún bloque en el tablero para limpiar con la pista.");
        }
    }

    // --------------------------------------------------------------------------
    // Ciclo del Juego y Lógica de Sumas Angular
    // --------------------------------------------------------------------------
    function updateTetrisGame() {
        if (!isTetrisPlaying || !tetrisFallingBlock) return;

        tickCount++;
        // Aceleración incremental cada 35 ticks
        if (tickCount % 35 === 0 && baseSpeed > 350) {
            baseSpeed -= 50;
            clearInterval(tetrisInterval);
            tetrisInterval = setInterval(updateTetrisGame, baseSpeed);
        }

        if (!checkTetrisCollision(tetrisFallingBlock.x, tetrisFallingBlock.y + 1, tetrisFallingBlock.tiles)) {
            tetrisFallingBlock.y++;
        } else {
            lockBlockInPlace();
        }
        drawTetrisGame();
    }

    function lockBlockInPlace() {
        const bx = tetrisFallingBlock.x;
        const by = tetrisFallingBlock.y;
        
        let lockQueue = [];

        // Evaluar colisiones individuales
        tetrisFallingBlock.tiles.forEach(t => {
            const gx = bx + t.rx;
            const gy = by + t.ry;
            
            let cleared = false;
            const underY = gy + 1;

            if (underY < tetrisRows && tetrisBoard[underY][gx] !== null) {
                const bottomBlock = tetrisBoard[underY][gx];
                const total = bottomBlock.value + t.val;

                if (total === tetrisTargetAngle) {
                    cleared = true;
                    tetrisBoard[underY][gx] = null; // Limpiar bloque inferior

                    sounds.playEat();
                    sounds.playCorrect();
                    confetti.spawn(15);

                    tetrisScore += 10;
                    document.getElementById('tetris-score').textContent = tetrisScore;
                    addStars(1);
                    addCoins(15);

                    // Desbloqueos según puntuación
                    const lvl = state.activeGameLevel || 1;
                    if (tetrisScore >= 30) {
                        if (lvl === 1) unlockLevel('tetris', 2);
                        else if (lvl === 2) unlockLevel('tetris', 3);
                        else unlockLevel('barricade', 1); // Desbloquea Barricada Lvl 1
                    }

                    setRandomTargetAngle();
                }
            }

            if (!cleared && gy >= 0) {
                lockQueue.push({ x: gx, y: gy, val: t.val, color: t.color });
            }
        });

        // Guardar bloques fijos no limpiados
        lockQueue.forEach(item => {
            tetrisBoard[item.y][item.x] = {
                value: item.val,
                color: item.color
            };
        });

        sounds.playClick();
        checkRowClears();
        spawnTetrisBlock();
    }

    function checkRowClears() {
        for (let r = tetrisRows - 1; r >= 0; r--) {
            if (tetrisBoard[r].every(cell => cell !== null)) {
                tetrisBoard.splice(r, 1);
                tetrisBoard.unshift(Array(tetrisCols).fill(null));
                
                sounds.playCorrect();
                confetti.spawn(25);
                tetrisScore += 25; // Bonus
                document.getElementById('tetris-score').textContent = tetrisScore;
                addStars(2);
                addCoins(30);
            }
        }
    }

    // --------------------------------------------------------------------------
    // Dibujo en Canvas
    // --------------------------------------------------------------------------
    function drawTetrisGame() {
        if (!tetrisCtx) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const canvasBg = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#1a1a20';
        const gridLine = rootStyle.getPropertyValue('--color-grid-line').trim() || '#262630';
        const boardBorder = rootStyle.getPropertyValue('--color-border').trim() || '#2e2e38';

        tetrisCtx.fillStyle = canvasBg;
        tetrisCtx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

        // Cuadrícula sutil
        tetrisCtx.strokeStyle = gridLine;
        tetrisCtx.lineWidth = 1;
        for (let c = 1; c < tetrisCols; c++) {
            tetrisCtx.beginPath();
            tetrisCtx.moveTo(c * tetrisBlockSize, 0);
            tetrisCtx.lineTo(c * tetrisBlockSize, tetrisCanvas.height);
            tetrisCtx.stroke();
        }
        for (let r = 1; r < tetrisRows; r++) {
            tetrisCtx.beginPath();
            tetrisCtx.moveTo(0, r * tetrisBlockSize);
            tetrisCtx.lineTo(tetrisCanvas.width, r * tetrisBlockSize);
            tetrisCtx.stroke();
        }

        // Dibujar bloques fijos en el tablero
        for (let r = 0; r < tetrisRows; r++) {
            for (let c = 0; c < tetrisCols; c++) {
                const block = tetrisBoard[r][c];
                if (block) {
                    drawBlockSquare(c, r, block.value, block.color, boardBorder);
                }
            }
        }

        // Dibujar bloque que cae
        if (tetrisFallingBlock) {
            tetrisFallingBlock.tiles.forEach(t => {
                drawBlockSquare(tetrisFallingBlock.x + t.rx, tetrisFallingBlock.y + t.ry, t.val, t.color, boardBorder);
            });
        }
    }

    function drawBlockSquare(col, row, angleValue, color, borderColor) {
        const x = col * tetrisBlockSize;
        const y = row * tetrisBlockSize;
        const padding = 2;

        tetrisCtx.fillStyle = color;
        tetrisCtx.strokeStyle = borderColor;
        tetrisCtx.lineWidth = 2;
        
        tetrisCtx.fillRect(x + padding, y + padding, tetrisBlockSize - padding * 2, tetrisBlockSize - padding * 2);
        tetrisCtx.strokeRect(x + padding, y + padding, tetrisBlockSize - padding * 2, tetrisBlockSize - padding * 2);

        // Brillo premium
        tetrisCtx.fillStyle = 'rgba(255,255,255,0.18)';
        tetrisCtx.fillRect(x + padding + 1, y + padding + 1, tetrisBlockSize - padding * 2 - 2, 6);

        // Texto
        tetrisCtx.fillStyle = '#ffffff';
        tetrisCtx.font = '800 13px Outfit';
        tetrisCtx.textAlign = 'center';
        tetrisCtx.textBaseline = 'middle';
        tetrisCtx.shadowColor = 'rgba(0,0,0,0.5)';
        tetrisCtx.shadowBlur = 2;
        tetrisCtx.fillText(`${angleValue}°`, x + tetrisBlockSize / 2, y + tetrisBlockSize / 2);
        tetrisCtx.shadowColor = 'transparent';
        tetrisCtx.shadowBlur = 0;
    }

    function gameOverTetris() {
        stopTetrisGame();
        sounds.playWrong();
        
        const starsBonus = Math.floor(tetrisScore / 10);
        let msg = `Stack superado. Acumulaste ${tetrisScore} puntos.`;
        if (starsBonus > 0) {
            msg += ` ¡Eso te otorga +${starsBonus} estrellas extra! ⭐`;
            addStars(starsBonus);
        }
        
        const lvl = state.activeGameLevel || 1;
        if (tetrisScore >= 30) {
            if (lvl === 1) {
                msg += `\n\n🎉 ¡Felicidades! Completaste Tetris Fácil y desbloqueaste el Nivel 2: Tetris Medio!`;
            } else if (lvl === 2) {
                msg += `\n\n🎉 ¡Felicidades! Completaste Tetris Medio y desbloqueaste el Nivel 3: Tetris Difícil!`;
            } else {
                msg += `\n\n🎉 ¡IMPRESIONANTE! Completaste la ruta de Tetris y desbloqueaste **Barricada Cartesiana (Fácil)**.`;
            }
        } else {
            msg += `\n\n💡 Consejos de Mateo: Coloca los bloques para que la suma del de arriba y abajo sea la meta. ¡Practica de nuevo!`;
        }

        document.getElementById('tetris-overlay-title').textContent = '¡Fin del Juego! 🧱';
        document.getElementById('tetris-overlay-text').innerHTML = msg;
        document.getElementById('tetris-overlay').classList.remove('hidden');
        document.getElementById('btn-start-tetris-game').textContent = 'Volver a Jugar';
    }

    // Teclado
    window.addEventListener('keydown', e => {
        if (!isTetrisPlaying || !tetrisFallingBlock) return;

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            if (!checkTetrisCollision(tetrisFallingBlock.x - 1, tetrisFallingBlock.y, tetrisFallingBlock.tiles)) {
                tetrisFallingBlock.x--;
                drawTetrisGame();
            }
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            if (!checkTetrisCollision(tetrisFallingBlock.x + 1, tetrisFallingBlock.y, tetrisFallingBlock.tiles)) {
                tetrisFallingBlock.x++;
                drawTetrisGame();
            }
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            updateTetrisGame();
        }
    });

    document.getElementById('ctrl-tetris-left')?.addEventListener('click', () => {
        if (isTetrisPlaying && tetrisFallingBlock && !checkTetrisCollision(tetrisFallingBlock.x - 1, tetrisFallingBlock.y, tetrisFallingBlock.tiles)) {
            tetrisFallingBlock.x--;
            drawTetrisGame();
        }
    });

    document.getElementById('ctrl-tetris-right')?.addEventListener('click', () => {
        if (isTetrisPlaying && tetrisFallingBlock && !checkTetrisCollision(tetrisFallingBlock.x + 1, tetrisFallingBlock.y, tetrisFallingBlock.tiles)) {
            tetrisFallingBlock.x++;
            drawTetrisGame();
        }
    });

    document.getElementById('ctrl-tetris-down')?.addEventListener('click', () => {
        if (isTetrisPlaying) updateTetrisGame();
    });

    document.getElementById('btn-start-tetris-game')?.addEventListener('click', startTetrisGamePlay);
    document.getElementById('btn-restart-tetris')?.addEventListener('click', startTetrisGamePlay);

    window.stopTetrisGame = stopTetrisGame;
    window.initTetrisGame = initTetrisGame;
})();
