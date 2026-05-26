/* ==========================================================================
   MathQuest V3 - Módulo Barricada Geométrica (10-15 Años)
   Lógica refinada con 3 sub-niveles progresivos (Cuadrante I, 4 Cuadrantes y Pitágoras),
   dibujo adaptativo y soporte de Pistas Globales (auto-completado de la respuesta correcta).
   ========================================================================== */

(function() {
    const barBoardCanvas = document.getElementById('barricade-board-canvas');
    const barBoardCtx = barBoardCanvas?.getContext('2d');
    const geomCanvas = document.getElementById('geometry-render-canvas');
    const geomCtx = geomCanvas?.getContext('2d');

    let barricadeNodes = [];
    let barricadePlayerNodeIdx = 0;
    let activeBarricadeNodeIdx = null;
    let currentBarricadeQuestion = null;
    let isBarricadeActive = false;

    function initBarricadeGame() {
        isBarricadeActive = false;
        document.getElementById('barricade-score').textContent = '0';
        document.getElementById('barricade-question-box')?.classList.add('hidden');

        const lvl = state.activeGameLevel || 1;
        const diffLabels = { 1: "Fácil", 2: "Medio", 3: "Difícil" };
        
        let overlayTitle = document.querySelector('#screen-barricade #barricade-overlay h3');
        if (overlayTitle) overlayTitle.textContent = `Barricada Cartesiana 🏰 - Nivel ${diffLabels[lvl]}`;
        
        document.getElementById('barricade-overlay')?.classList.remove('hidden');

        // Registrar callback de pista global
        window.registerGameHintCallback(useBarricadeHint);

        setupBarricadeBoard();
        drawBarricadeBoard();
    }

    function startBarricadeGamePlay() {
        sounds.playClick();
        document.getElementById('barricade-overlay')?.classList.add('hidden');
        
        setupBarricadeBoard();
        barricadePlayerNodeIdx = 0;
        document.getElementById('barricade-score').textContent = '0';
        isBarricadeActive = true;
        
        drawBarricadeBoard();
    }

    // Configuración del Tablero
    function setupBarricadeBoard() {
        barricadeNodes = [];
        const nodeCoords = [
            { x: 50, y: 220, isLocked: false, isCastle: false },
            { x: 120, y: 150, isLocked: true, isCastle: false },  // Barricada 1
            { x: 200, y: 230, isLocked: false, isCastle: false },
            { x: 260, y: 130, isLocked: true, isCastle: false },  // Barricada 2
            { x: 320, y: 210, isLocked: false, isCastle: false },
            { x: 360, y: 80, isLocked: true, isCastle: true }     // Barricada final (Castillo)
        ];

        nodeCoords.forEach((coord, idx) => {
            barricadeNodes.push({
                id: idx,
                x: coord.x,
                y: coord.y,
                isLocked: coord.isLocked,
                isCastle: coord.isCastle,
                label: idx === 0 ? "Inicio" : coord.isCastle ? "Castillo" : coord.isLocked ? "🛡️" : ""
            });
        });
    }

    // Click en la ruta
    barBoardCanvas?.addEventListener('click', e => {
        if (!isBarricadeActive) return;

        const rect = barBoardCanvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        barricadeNodes.forEach((node, idx) => {
            const dist = Math.hypot(mx - node.x, my - node.y);
            if (dist < 26) {
                if (idx === barricadePlayerNodeIdx + 1) {
                    sounds.playClick();
                    if (node.isLocked) {
                        activeBarricadeNodeIdx = idx;
                        triggerGeometryChallenge();
                    } else {
                        barricadePlayerNodeIdx = idx;
                        document.getElementById('barricade-score').textContent = barricadePlayerNodeIdx;
                        sounds.playEat();
                        checkBarricadeWin();
                        drawBarricadeBoard();
                    }
                } else if (idx !== barricadePlayerNodeIdx) {
                    sounds.playWrong();
                    shakeBarricadeBoard();
                }
            }
        });
    });

    // Desafíos Cartesianos Dinámicos
    function triggerGeometryChallenge() {
        const lvl = state.activeGameLevel || 1;

        if (lvl === 1) {
            // Fácil: Coordenadas sencillas en Cuadrante I (Solo positivos)
            currentBarricadeQuestion = mathGen.generateCoordinates();
            // Restringir a positivos
            while (currentBarricadeQuestion.shapeData.px < 0 || currentBarricadeQuestion.shapeData.py < 0) {
                currentBarricadeQuestion = mathGen.generateCoordinates();
            }
        } else if (lvl === 2) {
            // Medio: Coordenadas de los 4 cuadrantes (Positivos y Negativos)
            currentBarricadeQuestion = mathGen.generateCoordinates();
        } else {
            // Difícil: Teorema de Pitágoras e Hipotenusa
            currentBarricadeQuestion = mathGen.generatePythagoras();
        }

        const desc = document.getElementById('barricade-q-desc');
        if (desc) desc.textContent = currentBarricadeQuestion.equation;

        const qBox = document.getElementById('barricade-question-box');
        qBox?.classList.remove('hidden');

        drawGeometryFigure(currentBarricadeQuestion.shapeData);

        const inputArea = document.getElementById('barricade-input-area');
        const optionsContainer = document.getElementById('barricade-options-container');
        const manualInput = document.getElementById('barricade-manual-input');

        if (inputArea) inputArea.style.display = 'flex';
        if (optionsContainer) optionsContainer.innerHTML = '';
        if (manualInput) {
            manualInput.value = '';
            manualInput.focus();
        }
    }

    // Callback de Pista Universal en Barricada (Escribe la respuesta correcta)
    function useBarricadeHint() {
        const manualInput = document.getElementById('barricade-manual-input');
        if (manualInput && currentBarricadeQuestion) {
            manualInput.value = currentBarricadeQuestion.correct;
            manualInput.focus();
        }
    }

    document.getElementById('btn-submit-barricade-input')?.addEventListener('click', validateManualAnswer);
    document.getElementById('barricade-manual-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') validateManualAnswer();
    });

    function validateManualAnswer() {
        const manualInput = document.getElementById('barricade-manual-input');
        if (!manualInput || !currentBarricadeQuestion) return;

        const userInput = manualInput.value.trim().replace(/\s+/g, '').toLowerCase();
        const correctInput = String(currentBarricadeQuestion.correct).trim().replace(/\s+/g, '').toLowerCase();

        if (userInput === correctInput) {
            sounds.playCorrect();
            confetti.spawn(25);

            barricadeNodes[activeBarricadeNodeIdx].isLocked = false;
            barricadeNodes[activeBarricadeNodeIdx].label = "";
            barricadePlayerNodeIdx = activeBarricadeNodeIdx;

            document.getElementById('barricade-score').textContent = barricadePlayerNodeIdx;
            document.getElementById('barricade-question-box')?.classList.add('hidden');

            addCoins(20);
            addStars(2);

            checkBarricadeWin();
            drawBarricadeBoard();
        } else {
            sounds.playWrong();
            shakeQuestionBox();
            alert(`❌ ¡Oops! Esa no es la respuesta. Mateo te sopla que la respuesta correcta es: ${currentBarricadeQuestion.correct}.`);
            document.getElementById('barricade-question-box')?.classList.add('hidden');
        }
    }

    function shakeQuestionBox() {
        const box = document.getElementById('barricade-question-box');
        if (box) {
            box.classList.add('shake');
            setTimeout(() => box.classList.remove('shake'), 400);
        }
    }

    function shakeBarricadeBoard() {
        const area = document.querySelector('#screen-barricade .game-canvas-area');
        if (area) {
            area.classList.add('shake');
            setTimeout(() => area.classList.remove('shake'), 400);
        }
    }

    // Dibujo en Canvas
    function drawGeometryFigure(data) {
        if (!geomCtx || !data) return;

        geomCtx.fillStyle = 'var(--color-card-secondary)';
        geomCtx.fillRect(0, 0, geomCanvas.width, geomCanvas.height);

        geomCtx.strokeStyle = 'var(--color-text)';
        geomCtx.fillStyle = 'var(--color-text)';
        geomCtx.lineWidth = 2.5;

        if (data.type === 'right-triangle') {
            geomCtx.beginPath();
            geomCtx.moveTo(60, 120);
            geomCtx.lineTo(170, 120);
            geomCtx.lineTo(60, 30);
            geomCtx.closePath();
            geomCtx.stroke();

            geomCtx.strokeStyle = 'var(--color-accent-coral)';
            geomCtx.strokeRect(60, 110, 10, 10);

            geomCtx.fillStyle = 'var(--color-text)';
            geomCtx.font = '800 12px Fredoka';
            geomCtx.fillText(`a = ${data.catA}`, 15, 80);
            geomCtx.fillText(`b = ${data.catB}`, 100, 137);
            geomCtx.fillText(`c = ${data.hyp}`, 120, 70);

        } else if (data.type === 'coordinate') {
            const cx = geomCanvas.width / 2;
            const cy = geomCanvas.height / 2;
            const scale = 22;

            geomCtx.strokeStyle = 'var(--color-grid-line)';
            geomCtx.lineWidth = 0.8;
            for (let x = -4; x <= 4; x++) {
                const rx = cx + x * scale;
                geomCtx.beginPath(); geomCtx.moveTo(rx, 10); geomCtx.lineTo(rx, geomCanvas.height - 10); geomCtx.stroke();
            }
            for (let y = -3; y <= 3; y++) {
                const ry = cy - y * scale;
                geomCtx.beginPath(); geomCtx.moveTo(10, ry); geomCtx.lineTo(geomCanvas.width - 10, ry); geomCtx.stroke();
            }

            geomCtx.strokeStyle = 'var(--color-text-muted)';
            geomCtx.lineWidth = 2;
            geomCtx.beginPath();
            geomCtx.moveTo(10, cy); geomCtx.lineTo(geomCanvas.width - 10, cy);
            geomCtx.moveTo(cx, 10); geomCtx.lineTo(cx, geomCanvas.height - 10);
            geomCtx.stroke();

            const px = cx + data.px * scale;
            const py = cy - data.py * scale;

            geomCtx.fillStyle = 'var(--color-accent-blue)';
            geomCtx.strokeStyle = '#ffffff';
            geomCtx.lineWidth = 2;
            
            geomCtx.beginPath();
            geomCtx.arc(px, py, 6, 0, Math.PI * 2);
            geomCtx.fill();
            geomCtx.stroke();

            geomCtx.fillStyle = 'var(--color-text)';
            geomCtx.font = '800 13px Fredoka';
            geomCtx.fillText(`P`, px + 8, py - 4);
        }
    }

    function drawBarricadeBoard() {
        if (!barBoardCtx) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const canvasBg = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#1a1a20';
        const gridLine = rootStyle.getPropertyValue('--color-grid-line').trim() || '#262630';
        const boardBorder = rootStyle.getPropertyValue('--color-border').trim() || '#2e2e38';

        barBoardCtx.fillStyle = canvasBg;
        barBoardCtx.fillRect(0, 0, barBoardCanvas.width, barBoardCanvas.height);

        barBoardCtx.strokeStyle = gridLine;
        barBoardCtx.lineWidth = 1;
        for (let i = 0; i < barBoardCanvas.width; i += 40) {
            barBoardCtx.beginPath(); barBoardCtx.moveTo(i, 0); barBoardCtx.lineTo(i, barBoardCanvas.height); barBoardCtx.stroke();
        }
        for (let j = 0; j < barBoardCanvas.height; j += 40) {
            barBoardCtx.beginPath(); barBoardCtx.moveTo(0, j); barBoardCtx.lineTo(barBoardCanvas.width, j); barBoardCtx.stroke();
        }

        barBoardCtx.strokeStyle = boardBorder;
        barBoardCtx.lineWidth = 8;
        barBoardCtx.lineCap = 'round';
        barBoardCtx.beginPath();
        barricadeNodes.forEach((node, idx) => {
            if (idx === 0) barBoardCtx.moveTo(node.x, node.y);
            else barBoardCtx.lineTo(node.x, node.y);
        });
        barBoardCtx.stroke();

        barricadeNodes.forEach((node, idx) => {
            const isCurrent = idx === barricadePlayerNodeIdx;

            if (node.isCastle) barBoardCtx.fillStyle = 'var(--color-accent-yellow)';
            else if (node.isLocked) barBoardCtx.fillStyle = 'var(--color-accent-red)';
            else barBoardCtx.fillStyle = 'var(--color-accent-green)';

            barBoardCtx.strokeStyle = boardBorder;
            barBoardCtx.lineWidth = 3;
            
            barBoardCtx.beginPath();
            barBoardCtx.arc(node.x, node.y, 22, 0, Math.PI * 2);
            barBoardCtx.fill();
            barBoardCtx.stroke();

            barBoardCtx.fillStyle = '#ffffff';
            barBoardCtx.font = '800 13px Fredoka';
            barBoardCtx.textAlign = 'center';
            barBoardCtx.textBaseline = 'middle';

            if (node.isCastle) barBoardCtx.fillText("🏰", node.x, node.y);
            else if (node.isLocked) barBoardCtx.fillText("🛡️", node.x, node.y);
            else barBoardCtx.fillText(node.label || "✓", node.x, node.y);

            if (isCurrent) {
                let avatarColor = '#eab308';
                if (state.activeAvatar === 'cubo') avatarColor = '#93c5fd';
                else if (state.activeAvatar === 'esfera') avatarColor = '#fef08a';
                else if (state.activeAvatar === 'piramide') avatarColor = '#c084fc';
                else if (state.activeAvatar === 'cilindro') avatarColor = '#fda4af';

                barBoardCtx.fillStyle = avatarColor;
                barBoardCtx.strokeStyle = boardBorder;
                barBoardCtx.lineWidth = 2.5;

                const py = node.y - 32;
                barBoardCtx.beginPath();
                barBoardCtx.arc(node.x, py, 13, 0, Math.PI * 2);
                barBoardCtx.fill();
                barBoardCtx.stroke();

                barBoardCtx.fillStyle = '#1e1e24';
                barBoardCtx.beginPath();
                barBoardCtx.arc(node.x - 4, py - 3, 1.8, 0, Math.PI * 2);
                barBoardCtx.arc(node.x + 4, py - 3, 1.8, 0, Math.PI * 2);
                barBoardCtx.fill();

                barBoardCtx.beginPath();
                barBoardCtx.arc(node.x, py + 2, 4, 0, Math.PI);
                barBoardCtx.stroke();

                barBoardCtx.strokeStyle = boardBorder;
                barBoardCtx.beginPath();
                barBoardCtx.moveTo(node.x, node.y - 19);
                barBoardCtx.lineTo(node.x, py + 13);
                barBoardCtx.stroke();
            }
        });
    }

    function checkBarricadeWin() {
        const finalNode = barricadeNodes[barricadeNodes.length - 1];
        if (barricadePlayerNodeIdx === finalNode.id) {
            isBarricadeActive = false;
            sounds.playWin();
            confetti.spawn(60);
            addStars(5);
            addCoins(50);

            const lvl = state.activeGameLevel || 1;
            
            setTimeout(() => {
                if (lvl === 1) {
                    unlockLevel('barricade', 2);
                    alert("🏆 ¡IMPRESIONANTE! Completaste Barricada Fácil y desbloqueaste Barricada Medio.");
                } else if (lvl === 2) {
                    unlockLevel('barricade', 3);
                    alert("🏆 ¡IMPRESIONANTE! Completaste Barricada Medio y desbloqueaste Barricada Difícil.");
                } else {
                    unlockLevel('barricade', 3); // Marca completo
                    alert("🏆 ¡RUTA DE GEOMETRÍA COMPLETA! Has ganado la Medalla de Geometría 📐. ¡Mateo te felicita!");
                }
                changeScreen('hub');
            }, 1200);
        }
    }

    document.getElementById('btn-start-barricade-game')?.addEventListener('click', startBarricadeGamePlay);
    document.getElementById('btn-restart-barricade')?.addEventListener('click', startBarricadeGamePlay);

    window.initBarricadeGame = initBarricadeGame;
})();
