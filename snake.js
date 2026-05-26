/* ==========================================================================
   MathQuest V3 - Módulo Snake Algebraico (10-15 Años)
   Lógica corregida de regeneración de manzanas, velocidad incremental con el 
   tiempo y soporte de Pistas Globales (iluminación neón del globo correcto).
   ========================================================================== */

(function() {
    let snakeGameInterval = null;
    const snakeCanvas = document.getElementById('snake-canvas');
    const snakeCtx = snakeCanvas?.getContext('2d');

    const snakeGridSize = 20;
    const snakeTileCount = 20;

    let snakeBody = [];
    let snakeDir = { x: 0, y: 0 };
    let snakeNextDir = { x: 0, y: 0 };
    let snakeApples = [];
    let snakeCurrentQ = null;
    let snakeScoreCount = 0;
    let isSnakeActive = false;
    let snakeLives = 3;
    
    // Velocidad inicial dinámica
    let snakeBaseSpeed = 130; // ms
    let timeElapsed = 0; // en ticks
    let hintActive = false; // si se usó la pista en la pregunta actual

    function initSnakeGame() {
        isSnakeActive = false;
        snakeScoreCount = 0;
        snakeLives = 3;
        timeElapsed = 0;
        hintActive = false;
        document.getElementById('snake-score').textContent = '0';
        updateSnakeHeartsUI();

        // Configurar títulos y reglas según nivel seleccionado
        const lvl = state.activeGameLevel || 1;
        const diffLabels = { 1: "Fácil", 2: "Medio", 3: "Difícil" };
        document.getElementById('snake-overlay-title').textContent = `Álgebra Snake 🍏 - Nivel ${diffLabels[lvl]}`;
        
        let descText = "";
        if (lvl === 1) {
            descText = "Ecuaciones lineales muy sencillas del tipo <code>x + a = b</code> o <code>ax = b</code>. ¡Ideal para calentar motores!";
        } else if (lvl === 2) {
            descText = "Ecuaciones del tipo <code>ax + b = c</code> con signos negativos ocasionales. ¡Ten cuidado con la dirección!";
        } else {
            descText = "Ecuaciones avanzadas con paréntesis <code>a(x + b) = c</code> o exponentes base potencia. ¡Solo para expertos!";
        }
        document.getElementById('snake-overlay-text').innerHTML = descText;
        document.getElementById('snake-overlay').classList.remove('hidden');
        
        // Registrar el callback de pistas universales
        window.registerGameHintCallback(useSnakeHint);

        resetSnakeState();
        drawSnakeGame();
    }

    function startSnakeGamePlay() {
        sounds.playClick();
        document.getElementById('snake-overlay').classList.add('hidden');
        
        snakeLives = 3;
        snakeScoreCount = 0;
        timeElapsed = 0;
        hintActive = false;
        document.getElementById('snake-score').textContent = '0';
        updateSnakeHeartsUI();
        
        resetSnakeState();
        generateSnakeQuestion();
        
        isSnakeActive = true;

        // Velocidad según dificultad
        const lvl = state.activeGameLevel || 1;
        if (lvl === 1) snakeBaseSpeed = 140;
        else if (lvl === 2) snakeBaseSpeed = 120;
        else snakeBaseSpeed = 95; // Súper veloz
        
        if (snakeGameInterval) clearInterval(snakeGameInterval);
        snakeGameInterval = setInterval(updateSnakeGame, snakeBaseSpeed);
    }

    function stopSnakeGame() {
        isSnakeActive = false;
        if (snakeGameInterval) {
            clearInterval(snakeGameInterval);
            snakeGameInterval = null;
        }
    }

    function resetSnakeState() {
        snakeBody = [
            { x: 7, y: 10 },
            { x: 6, y: 10 },
            { x: 5, y: 10 }
        ];
        snakeDir = { x: 1, y: 0 };
        snakeNextDir = { x: 1, y: 0 };
        snakeApples = [];
    }

    function updateSnakeHeartsUI() {
        const box = document.getElementById('snake-hearts-box');
        if (!box) return;
        
        let html = '';
        for (let i = 1; i <= 3; i++) {
            if (i <= snakeLives) {
                html += '<span style="color: var(--color-accent-coral); margin-right: 3px; font-size: 1.3rem;">❤️</span>';
            } else {
                html += '<span style="color: var(--color-text-muted); opacity: 0.4; margin-right: 3px; font-size: 1.3rem;">🖤</span>';
            }
        }
        box.innerHTML = html;
    }

    // --------------------------------------------------------------------------
    // Desafíos Matemáticos y Spawning
    // --------------------------------------------------------------------------
    function generateSnakeQuestion() {
        hintActive = false; // reset
        const lvl = state.activeGameLevel || 1;
        
        snakeCurrentQ = mathGen.generateLinearEquation(lvl);
        document.getElementById('snake-equation').textContent = snakeCurrentQ.equation;
        
        snakeApples = [];
        const colors = ['#f87171', '#3b82f6', '#8b5cf6'];
        const shuffledOptions = [...snakeCurrentQ.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach((option, index) => {
            let pos = getSnakeRandomPosition();
            let attempts = 0;
            while (
                (snakeBody.some(segment => segment.x === pos.x && segment.y === pos.y) ||
                snakeApples.some(apple => apple.x === pos.x && apple.y === pos.y)) && attempts < 100
            ) {
                pos = getSnakeRandomPosition();
                attempts++;
            }

            snakeApples.push({
                x: pos.x,
                y: pos.y,
                value: option,
                color: colors[index % colors.length],
                isCorrect: option === snakeCurrentQ.correct
            });
        });
    }

    function getSnakeRandomPosition() {
        return {
            x: Math.floor(Math.random() * (snakeTileCount - 2)) + 1,
            y: Math.floor(Math.random() * (snakeTileCount - 2)) + 1
        };
    }

    // Callback de Pista Universal en Snake
    function useSnakeHint() {
        hintActive = true;
    }

    // --------------------------------------------------------------------------
    // Ciclo del Juego
    // --------------------------------------------------------------------------
    function updateSnakeGame() {
        if (!isSnakeActive) return;

        timeElapsed++;

        // Aceleración incremental en el tiempo (cada 20 segundos / ~150 ticks a velocidad estándar)
        if (timeElapsed % 120 === 0 && snakeBaseSpeed > 65) {
            snakeBaseSpeed -= 5;
            clearInterval(snakeGameInterval);
            snakeGameInterval = setInterval(updateSnakeGame, snakeBaseSpeed);
        }

        snakeDir = snakeNextDir;
        const head = { x: snakeBody[0].x + snakeDir.x, y: snakeBody[0].y + snakeDir.y };

        // Colisión de Pared
        if (head.x < 0 || head.x >= snakeTileCount || head.y < 0 || head.y >= snakeTileCount) {
            handleSnakeHit();
            return;
        }

        // Colisión Cuerpo
        for (let i = 1; i < snakeBody.length; i++) {
            if (head.x === snakeBody[i].x && head.y === snakeBody[i].y) {
                handleSnakeHit();
                return;
            }
        }

        snakeBody.unshift(head);

        let ateAppleIdx = -1;
        for (let i = 0; i < snakeApples.length; i++) {
            if (head.x === snakeApples[i].x && head.y === snakeApples[i].y) {
                ateAppleIdx = i;
                break;
            }
        }

        if (ateAppleIdx !== -1) {
            const eatenApple = snakeApples[ateAppleIdx];
            
            if (eatenApple.isCorrect) {
                sounds.playEat();
                sounds.playCorrect();
                confetti.spawn(20);
                
                snakeScoreCount++;
                document.getElementById('snake-score').textContent = snakeScoreCount;
                addStars(1);
                addCoins(10);

                // Desbloqueo progresivo del siguiente nivel o Slither
                const lvl = state.activeGameLevel || 1;
                if (snakeScoreCount >= 3) {
                    if (lvl === 1) {
                        unlockLevel('snake', 2);
                    } else if (lvl === 2) {
                        unlockLevel('snake', 3);
                    } else {
                        // Desbloquea Slither Lvl 1 ( slider_1 )
                        unlockLevel('slider', 1);
                    }
                }

                generateSnakeQuestion();
            } else {
                sounds.playWrong();
                shakeSnakeCanvas();
                
                snakeLives--;
                updateSnakeHeartsUI();

                if (snakeLives <= 0) {
                    gameOverSnake();
                    return;
                }

                snakeBody.pop();
                generateSnakeQuestion();
            }
        } else {
            snakeBody.pop();
        }

        drawSnakeGame();
    }

    function handleSnakeHit() {
        sounds.playTrap();
        shakeSnakeCanvas();
        snakeLives--;
        updateSnakeHeartsUI();

        if (snakeLives <= 0) {
            gameOverSnake();
            return;
        }

        // Reinicia la serpiente de forma segura
        resetSnakeState();
        
        // BUG FIX: ¡Re-generar la pregunta para que se vuelvan a pintar las manzanas!
        generateSnakeQuestion();
    }

    function shakeSnakeCanvas() {
        const area = document.querySelector('#screen-snake .game-canvas-area');
        if (area) {
            area.classList.add('shake');
            setTimeout(() => area.classList.remove('shake'), 400);
        }
    }

    // --------------------------------------------------------------------------
    // Dibujo en Canvas
    // --------------------------------------------------------------------------
    function drawSnakeGame() {
        if (!snakeCtx) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const canvasBg = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#1a1a20';
        const gridLine = rootStyle.getPropertyValue('--color-grid-line').trim() || '#262630';
        const boardBorder = rootStyle.getPropertyValue('--color-border').trim() || '#2e2e38';

        snakeCtx.fillStyle = canvasBg;
        snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
        
        // Rejilla
        snakeCtx.strokeStyle = gridLine;
        snakeCtx.lineWidth = 1;
        for (let i = 0; i < snakeTileCount; i++) {
            snakeCtx.beginPath();
            snakeCtx.moveTo(i * snakeGridSize, 0);
            snakeCtx.lineTo(i * snakeGridSize, snakeCanvas.height);
            snakeCtx.stroke();

            snakeCtx.beginPath();
            snakeCtx.moveTo(0, i * snakeGridSize);
            snakeCtx.lineTo(snakeCanvas.width, i * snakeGridSize);
            snakeCtx.stroke();
        }

        // Dibujar Manzanas
        snakeApples.forEach(apple => {
            const px = apple.x * snakeGridSize;
            const py = apple.y * snakeGridSize;

            // DIBUJAR PISTA (Glow neón brillante amarillo en la manzana correcta si se activó)
            if (hintActive && apple.isCorrect) {
                snakeCtx.fillStyle = 'rgba(234, 179, 8, 0.22)';
                snakeCtx.beginPath();
                snakeCtx.arc(px + snakeGridSize / 2, py + snakeGridSize / 2, snakeGridSize * 1.2, 0, Math.PI * 2);
                snakeCtx.fill();

                // Delineado neón
                snakeCtx.strokeStyle = 'var(--color-accent-yellow)';
                snakeCtx.lineWidth = 2.5;
                snakeCtx.beginPath();
                snakeCtx.arc(px + snakeGridSize / 2, py + snakeGridSize / 2, snakeGridSize * 0.9, 0, Math.PI * 2);
                snakeCtx.stroke();
            }

            // Cuerpo Manzana
            snakeCtx.fillStyle = apple.color;
            snakeCtx.strokeStyle = boardBorder;
            snakeCtx.lineWidth = 1.5;
            snakeCtx.beginPath();
            snakeCtx.arc(px + snakeGridSize / 2, py + snakeGridSize / 2, snakeGridSize / 2 - 1.5, 0, Math.PI * 2);
            snakeCtx.fill();
            snakeCtx.stroke();

            // Hoja
            snakeCtx.fillStyle = '#10b981';
            snakeCtx.beginPath();
            snakeCtx.ellipse(px + snakeGridSize / 2 + 2, py + 4, 3, 1.5, Math.PI / 4, 0, Math.PI * 2);
            snakeCtx.fill();

            // Valor
            snakeCtx.fillStyle = '#ffffff';
            snakeCtx.font = '800 11px Fredoka';
            snakeCtx.textAlign = 'center';
            snakeCtx.textBaseline = 'middle';
            snakeCtx.shadowColor = 'rgba(0,0,0,0.5)';
            snakeCtx.shadowBlur = 2;
            snakeCtx.fillText(apple.value, px + snakeGridSize / 2, py + snakeGridSize / 2 + 1);
            snakeCtx.shadowColor = 'transparent';
            snakeCtx.shadowBlur = 0;
        });

        // Configuración de Skins
        let headColor = '#10b981';
        let bodyColor = '#a7f3d0';
        let bodyAccent = '#34d399';

        const currentSkin = state.equippedSkin || 'standard';
        if (currentSkin === 'gold') {
            headColor = '#fbbf24';
            bodyColor = '#fef08a';
            bodyAccent = '#f59e0b';
        } else if (currentSkin === 'cyber') {
            headColor = '#8b5cf6';
            bodyColor = '#ddd6fe';
            bodyAccent = '#a78bfa';
        }

        // Dibujar Serpiente
        snakeBody.forEach((segment, index) => {
            const px = segment.x * snakeGridSize;
            const py = segment.y * snakeGridSize;
            const isHead = index === 0;

            snakeCtx.strokeStyle = boardBorder;
            snakeCtx.lineWidth = 1.5;

            if (isHead) {
                snakeCtx.fillStyle = headColor;
                snakeCtx.beginPath();
                snakeCtx.arc(px + snakeGridSize / 2, py + snakeGridSize / 2, snakeGridSize / 2 - 0.5, 0, Math.PI * 2);
                snakeCtx.fill();
                snakeCtx.stroke();

                // Ojos
                snakeCtx.fillStyle = '#1e1e24';
                let ex1, ey1, ex2, ey2;
                if (snakeDir.x === 1) {
                    ex1 = px + 12; ey1 = py + 6; ex2 = px + 12; ey2 = py + 14;
                } else if (snakeDir.x === -1) {
                    ex1 = px + 8; ey1 = py + 6; ex2 = px + 8; ey2 = py + 14;
                } else if (snakeDir.y === 1) {
                    ex1 = px + 6; ey1 = py + 12; ex2 = px + 14; ey2 = py + 12;
                } else {
                    ex1 = px + 6; ey1 = py + 8; ex2 = px + 14; ey2 = py + 8;
                }
                snakeCtx.beginPath();
                snakeCtx.arc(ex1, ey1, 2, 0, Math.PI * 2);
                snakeCtx.arc(ex2, ey2, 2, 0, Math.PI * 2);
                snakeCtx.fill();
            } else {
                const ratio = 1 - (index / snakeBody.length) * 0.35;
                snakeCtx.fillStyle = index % 2 === 0 ? bodyColor : bodyAccent;
                snakeCtx.beginPath();
                snakeCtx.arc(px + snakeGridSize / 2, py + snakeGridSize / 2, (snakeGridSize / 2 - 1) * ratio, 0, Math.PI * 2);
                snakeCtx.fill();
                snakeCtx.stroke();
            }
        });
    }

    function gameOverSnake() {
        stopSnakeGame();
        sounds.playWrong();
        
        const starsBonus = Math.floor(snakeScoreCount / 2);
        let msg = `Comiste ${snakeScoreCount} manzanas correctas.`;
        if (starsBonus > 0) {
            msg += ` ¡Eso te otorga +${starsBonus} estrellas extra! ⭐`;
            addStars(starsBonus);
        }
        
        const lvl = state.activeGameLevel || 1;
        if (snakeScoreCount >= 3) {
            if (lvl === 1) {
                msg += `\n\n🎉 ¡Has completado con éxito Snake Fácil y desbloqueaste el Nivel 2: Snake Medio!`;
            } else if (lvl === 2) {
                msg += `\n\n🎉 ¡Has completado Snake Medio y desbloqueaste el Nivel 3: Snake Difícil!`;
            } else {
                msg += `\n\n🎉 ¡IMPRESIONANTE! Completaste toda la ruta de Snake y desbloqueaste **Slither-Fracciones (Fácil)**.`;
            }
        } else {
            msg += `\n\n💡 Consejos de Mateo: Resuelve la ecuación en la barra lateral para saber cuál manzana comer. ¡Inténtalo de nuevo!`;
        }

        document.getElementById('snake-overlay-title').textContent = '¡Fin de la Partida! 💥';
        document.getElementById('snake-overlay-text').innerHTML = msg;
        document.getElementById('snake-overlay').classList.remove('hidden');
        document.getElementById('btn-start-snake-game').textContent = 'Volver a Jugar';
    }

    // Teclado virtual
    window.addEventListener('keydown', e => {
        if (!isSnakeActive) return;
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (snakeDir.y === 0) snakeNextDir = { x: 0, y: -1 };
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (snakeDir.y === 0) snakeNextDir = { x: 0, y: 1 };
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (snakeDir.x === 0) snakeNextDir = { x: -1, y: 0 };
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (snakeDir.x === 0) snakeNextDir = { x: 1, y: 0 };
                break;
        }
    });

    document.getElementById('ctrl-up')?.addEventListener('click', () => { if (isSnakeActive && snakeDir.y === 0) snakeNextDir = { x: 0, y: -1 }; });
    document.getElementById('ctrl-down')?.addEventListener('click', () => { if (isSnakeActive && snakeDir.y === 0) snakeNextDir = { x: 0, y: 1 }; });
    document.getElementById('ctrl-left')?.addEventListener('click', () => { if (isSnakeActive && snakeDir.x === 0) snakeNextDir = { x: -1, y: 0 }; });
    document.getElementById('ctrl-right')?.addEventListener('click', () => { if (isSnakeActive && snakeDir.x === 0) snakeNextDir = { x: 1, y: 0 }; });

    document.getElementById('btn-start-snake-game')?.addEventListener('click', startSnakeGamePlay);
    document.getElementById('btn-restart-snake')?.addEventListener('click', startSnakeGamePlay);

    window.stopSnakeGame = stopSnakeGame;
    window.initSnakeGame = initSnakeGame;
})();
