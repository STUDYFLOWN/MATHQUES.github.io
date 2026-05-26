/* ==========================================================================
   MathQuest V3 - Módulo Slither-Fracciones (Proporciones Equivalentes)
   Física de movimiento constante, aceleración Boost real al hacer click (consumiendo cola),
   oponentes IA dinámicos y soporte de Pistas Globales (halo neón en el globo correcto).
   ========================================================================== */

(function() {
    let sliderInterval = null;
    const sliderCanvas = document.getElementById('slider-canvas');
    const sliderCtx = sliderCanvas?.getContext('2d');

    let sliderPlayer = {
        x: 250,
        y: 200,
        segments: [],
        length: 8,
        angle: 0,
        speed: 3,
        size: 14
    };

    let sliderAIList = [];
    let sliderFoodList = [];
    let sliderCurrentTask = null;
    let sliderScoreCount = 0;
    let isSliderActive = false;
    let mousePos = { x: 250, y: 200 };
    
    // Variables de Aceleración Boost
    let isBoosting = false;
    let boostTick = 0;
    let baseSpeedLimit = 3;
    let hintActiveBalloonIdx = null;

    function initSliderGame() {
        isSliderActive = false;
        sliderScoreCount = 0;
        isBoosting = false;
        boostTick = 0;
        hintActiveBalloonIdx = null;
        document.getElementById('slider-score').textContent = '0';

        const lvl = state.activeGameLevel || 1;
        const diffLabels = { 1: "Fácil", 2: "Medio", 3: "Difícil" };
        document.getElementById('slider-overlay-title').textContent = `Slither-Fracciones 🐛 - Nivel ${diffLabels[lvl]}`;
        
        let descText = "";
        if (lvl === 1) {
            descText = "Devora globos con fracciones equivalentes a denominadores sencillos. ¡Velocidad relajada de aprendizaje!";
        } else if (lvl === 2) {
            descText = "Denominadores y numeradores más grandes. ¡Usa el **impulso haciendo click** para adelantarte a tus rivales!";
        } else {
            descText = "Conversiones de **decimales a fracciones** (ej: 0.50 = 2/4). ¡Oponentes altamente competitivos y veloces!";
        }
        document.getElementById('slider-overlay-text').innerHTML = descText;
        document.getElementById('slider-overlay').classList.remove('hidden');

        // Registrar callback de pista global
        window.registerGameHintCallback(useSliderHint);

        resetSliderState();
        drawSliderGame();
    }

    function startSliderGamePlay() {
        sounds.playClick();
        document.getElementById('slider-overlay').classList.add('hidden');
        
        resetSliderState();
        sliderScoreCount = 0;
        isBoosting = false;
        boostTick = 0;
        hintActiveBalloonIdx = null;
        document.getElementById('slider-score').textContent = '0';
        generateSliderTask();
        
        isSliderActive = true;
        
        if (sliderInterval) clearInterval(sliderInterval);
        sliderInterval = setInterval(updateSliderGame, 1000 / 40);
    }

    function stopSliderGame() {
        isSliderActive = false;
        isBoosting = false;
        if (sliderInterval) {
            clearInterval(sliderInterval);
            sliderInterval = null;
        }
    }

    function resetSliderState() {
        const lvl = state.activeGameLevel || 1;
        
        sliderPlayer.x = 250;
        sliderPlayer.y = 200;
        sliderPlayer.length = 8;
        sliderPlayer.segments = [];
        sliderPlayer.speed = lvl === 3 ? 3.5 : 2.8;
        baseSpeedLimit = sliderPlayer.speed;

        for (let i = 0; i < sliderPlayer.length; i++) {
            sliderPlayer.segments.push({ x: 250 - i * 8, y: 200 });
        }
        sliderPlayer.angle = 0;
        mousePos = { x: 250, y: 200 };

        // Oponentes IA dinámicos según dificultad
        sliderAIList = [];
        const aiNames = ["Flippy AI", "Wormy AI", "Glider Pro", "Mathy Snake"];
        const aiColors = ['#8b5cf6', '#fbbf24', '#f43f5e', '#10b981'];
        
        let aiCount = lvl === 1 ? 2 : lvl === 2 ? 3 : 4;
        for (let i = 0; i < aiCount; i++) {
            let rx = Math.random() * (sliderCanvas.width - 100) + 50;
            let ry = Math.random() * (sliderCanvas.height - 100) + 50;
            sliderAIList.push({
                x: rx,
                y: ry,
                segments: [{x: rx, y: ry}, {x: rx-8, y: ry}, {x: rx-16, y: ry}],
                angle: Math.random() * Math.PI * 2,
                speed: lvl === 3 ? 2.3 : 1.8,
                size: 11,
                color: aiColors[i % aiColors.length],
                name: aiNames[i % aiNames.length],
                timer: 0
            });
        }

        sliderFoodList = [];
    }

    // --------------------------------------------------------------------------
    // Misiones Equivalentes y Spawning
    // --------------------------------------------------------------------------
    function generateSliderTask() {
        hintActiveBalloonIdx = null;
        const lvl = state.activeGameLevel || 1;
        
        sliderCurrentTask = mathGen.generateFractions(lvl);
        document.getElementById('slider-target-equation').textContent = sliderCurrentTask.text;

        spawnSliderFoods();
    }

    function spawnSliderFoods() {
        sliderFoodList = [];
        const colors = ['#f87171', '#3b82f6', '#8b5cf6', '#eab308', '#10b981'];

        for (let i = 0; i < 6; i++) {
            let fnum = 1;
            let fden = 2;
            let isCorrect = false;

            if (i < 2) {
                // Manzanas equivalentes correctas
                fnum = sliderCurrentTask.correctNum;
                fden = sliderCurrentTask.correctDen;
                isCorrect = true;
            } else {
                // Distractores incorrectos
                let attempts = 0;
                while (attempts < 100) {
                    const mult = Math.floor(Math.random() * 8) + 2;
                    const offset = Math.random() > 0.5 ? 1 : -1;
                    fnum = sliderCurrentTask.num * mult + offset;
                    fden = sliderCurrentTask.den * mult;
                    
                    if (fnum * sliderCurrentTask.den !== fden * sliderCurrentTask.num && fnum > 0) {
                        break;
                    }
                    attempts++;
                }
            }

            let fx = Math.random() * (sliderCanvas.width - 60) + 30;
            let fy = Math.random() * (sliderCanvas.height - 60) + 30;

            sliderFoodList.push({
                x: fx,
                y: fy,
                num: fnum,
                den: fden,
                text: `${fnum}/${fden}`,
                color: colors[i % colors.length],
                size: 18,
                isCorrect: isCorrect
            });
        }
    }

    // Callback de Pista Universal en Slither (Ilumina la respuesta correcta)
    function useSliderHint() {
        for (let i = 0; i < sliderFoodList.length; i++) {
            if (sliderFoodList[i].isCorrect) {
                hintActiveBalloonIdx = i; // Guardar índice
                break;
            }
        }
    }

    // --------------------------------------------------------------------------
    // Ciclo de Física
    // --------------------------------------------------------------------------
    function updateSliderGame() {
        if (!isSliderActive) return;

        // Física de Boost (aceleración clickeada)
        let speedMultiplier = 1;
        if (isBoosting && sliderPlayer.length > 5) {
            speedMultiplier = 1.7;
            boostTick++;

            // Consumir cola cada 20 ticks
            if (boostTick % 20 === 0) {
                sliderPlayer.length = Math.max(5, sliderPlayer.length - 0.2);
            }
        }

        // 1. Desplazamiento CONSTANTE del Jugador
        const dx = mousePos.x - sliderPlayer.x;
        const dy = mousePos.y - sliderPlayer.y;
        const dist = Math.hypot(dx, dy);

        // Si el cursor se desplaza a más de 5px, actualiza el rumbo; si no, ¡sigue adelante constante!
        if (dist > 5) {
            sliderPlayer.angle = Math.atan2(dy, dx);
        }

        sliderPlayer.x += Math.cos(sliderPlayer.angle) * baseSpeedLimit * speedMultiplier;
        sliderPlayer.y += Math.sin(sliderPlayer.angle) * baseSpeedLimit * speedMultiplier;

        // Colisión contra bordes
        if (sliderPlayer.x < 10 || sliderPlayer.x > sliderCanvas.width - 10 ||
            sliderPlayer.y < 10 || sliderPlayer.y > sliderCanvas.height - 10) {
            gameOverSlider("¡Chocaste con el campo electromagnético de la arena!");
            return;
        }

        // Actualizar segmentos del cuerpo
        sliderPlayer.segments.unshift({ x: sliderPlayer.x, y: sliderPlayer.y });
        while (sliderPlayer.segments.length > sliderPlayer.length * 4) {
            sliderPlayer.segments.pop();
        }

        // 2. Desplazar Oponentes IA
        sliderAIList.forEach(ai => {
            ai.timer++;
            if (ai.timer > 40) {
                ai.angle += (Math.random() - 0.5) * 1.6;
                ai.timer = 0;
            }

            ai.x += Math.cos(ai.angle) * ai.speed;
            ai.y += Math.sin(ai.angle) * ai.speed;

            if (ai.x < 20 || ai.x > sliderCanvas.width - 20) ai.angle = Math.PI - ai.angle;
            if (ai.y < 20 || ai.y > sliderCanvas.height - 20) ai.angle = -ai.angle;

            ai.segments.unshift({ x: ai.x, y: ai.y });
            if (ai.segments.length > 25) ai.segments.pop();

            // Colisión del jugador con segmentos enemigos
            ai.segments.forEach((seg, idx) => {
                if (idx > 2 && Math.hypot(sliderPlayer.x - seg.x, sliderPlayer.y - seg.y) < sliderPlayer.size + ai.size - 6) {
                    gameOverSlider(`¡Chocaste contra la cola de ${ai.name}!`);
                }
            });
        });

        // 3. Colisión y Consumo de Globos
        for (let i = sliderFoodList.length - 1; i >= 0; i--) {
            const food = sliderFoodList[i];
            const distFood = Math.hypot(sliderPlayer.x - food.x, sliderPlayer.y - food.y);

            if (distFood < sliderPlayer.size + food.size) {
                const correct = food.isCorrect;
                sliderFoodList.splice(i, 1);

                if (correct) {
                    sounds.playEat();
                    sounds.playCorrect();
                    confetti.spawn(15);

                    sliderScoreCount++;
                    document.getElementById('slider-score').textContent = sliderScoreCount;
                    addStars(1);
                    addCoins(12);

                    sliderPlayer.length += 2; // Crecimiento
                    
                    const lvl = state.activeGameLevel || 1;
                    if (sliderScoreCount >= 3) {
                        if (lvl === 1) {
                            unlockLevel('slider', 2);
                        } else if (lvl === 2) {
                            unlockLevel('slider', 3);
                        } else {
                            // Completado difícil
                            unlockLevel('slider', 3); // Marca completo
                            alert("🏆 ¡Ruta de Álgebra y Aritmética Completa! Obtuviste la Medalla de Álgebra 🪐");
                        }
                    }

                    generateSliderTask();
                } else {
                    sounds.playWrong();
                    shakeSliderCanvas();

                    sliderPlayer.length = Math.max(5, sliderPlayer.length - 2); // Encogimiento
                    generateSliderTask();
                }
                break;
            }
        }

        drawSliderGame();
    }

    function shakeSliderCanvas() {
        const area = document.querySelector('#screen-slider .game-canvas-area');
        if (area) {
            area.classList.add('shake');
            setTimeout(() => area.classList.remove('shake'), 400);
        }
    }

    // --------------------------------------------------------------------------
    // Dibujo en Canvas
    // --------------------------------------------------------------------------
    function drawSliderGame() {
        if (!sliderCtx) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const canvasBg = rootStyle.getPropertyValue('--color-canvas-bg').trim() || '#1a1a20';
        const gridLine = rootStyle.getPropertyValue('--color-grid-line').trim() || '#262630';
        const boardBorder = rootStyle.getPropertyValue('--color-border').trim() || '#2e2e38';

        sliderCtx.fillStyle = canvasBg;
        sliderCtx.fillRect(0, 0, sliderCanvas.width, sliderCanvas.height);

        // Cuadrícula sutil
        sliderCtx.strokeStyle = gridLine;
        sliderCtx.lineWidth = 1;
        for (let i = 0; i < sliderCanvas.width; i += 30) {
            sliderCtx.beginPath(); sliderCtx.moveTo(i, 0); sliderCtx.lineTo(i, sliderCanvas.height); sliderCtx.stroke();
        }
        for (let j = 0; j < sliderCanvas.height; j += 30) {
            sliderCtx.beginPath(); sliderCtx.moveTo(0, j); sliderCtx.lineTo(sliderCanvas.width, j); sliderCtx.stroke();
        }

        // Dibujar Globos de Fracciones
        sliderFoodList.forEach((food, idx) => {
            // DIBUJAR PISTA (Glow neón brillante amarillo)
            if (hintActiveBalloonIdx === idx) {
                sliderCtx.fillStyle = 'rgba(234, 179, 8, 0.2)';
                sliderCtx.beginPath();
                sliderCtx.arc(food.x, food.y, food.size * 1.6, 0, Math.PI * 2);
                sliderCtx.fill();

                sliderCtx.strokeStyle = 'var(--color-accent-yellow)';
                sliderCtx.lineWidth = 2.5;
                sliderCtx.beginPath();
                sliderCtx.arc(food.x, food.y, food.size * 1.3, 0, Math.PI * 2);
                sliderCtx.stroke();
            }

            // Cuerpo del Globo
            sliderCtx.fillStyle = food.color;
            sliderCtx.strokeStyle = boardBorder;
            sliderCtx.lineWidth = 2;
            sliderCtx.beginPath();
            sliderCtx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
            sliderCtx.fill();
            sliderCtx.stroke();

            // Hilo
            sliderCtx.strokeStyle = boardBorder;
            sliderCtx.lineWidth = 1.2;
            sliderCtx.beginPath();
            sliderCtx.moveTo(food.x, food.y + food.size);
            const floatOffset = Math.sin(Date.now() / 150 + food.x) * 4;
            sliderCtx.quadraticCurveTo(food.x + floatOffset, food.y + food.size + 6, food.x, food.y + food.size + 12);
            sliderCtx.stroke();

            // Fracción
            sliderCtx.fillStyle = '#ffffff';
            sliderCtx.font = '800 11px Outfit';
            sliderCtx.textAlign = 'center';
            sliderCtx.textBaseline = 'middle';
            sliderCtx.shadowColor = 'rgba(0,0,0,0.5)';
            sliderCtx.shadowBlur = 2;
            sliderCtx.fillText(food.text, food.x, food.y);
            sliderCtx.shadowColor = 'transparent';
            sliderCtx.shadowBlur = 0;
        });

        // Dibujar Oponentes IA
        sliderAIList.forEach(ai => {
            ai.segments.forEach((seg, idx) => {
                const ratio = 1 - (idx / ai.segments.length) * 0.45;
                sliderCtx.fillStyle = ai.color;
                sliderCtx.strokeStyle = boardBorder;
                sliderCtx.lineWidth = 1.5;
                sliderCtx.beginPath();
                sliderCtx.arc(seg.x, seg.y, ai.size * ratio, 0, Math.PI * 2);
                sliderCtx.fill();
                sliderCtx.stroke();
            });
            
            sliderCtx.fillStyle = 'var(--color-text-muted)';
            sliderCtx.font = '700 8px Outfit';
            sliderCtx.fillText(ai.name, ai.x - 18, ai.y - ai.size - 4);
        });

        // Dibujar Serpiente del Jugador
        let headColor = '#3b82f6';
        let bodyColor = '#93c5fd';
        let bodyAccent = '#60a5fa';

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

        sliderPlayer.segments.forEach((seg, idx) => {
            if (idx % 4 === 0) {
                const bodyIdx = Math.floor(idx / 4);
                const ratio = 1 - (bodyIdx / sliderPlayer.length) * 0.4;
                const isHead = bodyIdx === 0;

                sliderCtx.strokeStyle = boardBorder;
                sliderCtx.lineWidth = 2;

                if (isHead) {
                    sliderCtx.fillStyle = headColor;
                    sliderCtx.beginPath();
                    sliderCtx.arc(seg.x, seg.y, sliderPlayer.size, 0, Math.PI * 2);
                    sliderCtx.fill();
                    sliderCtx.stroke();

                    // Lentes
                    sliderCtx.fillStyle = '#1e1e24';
                    sliderCtx.beginPath();
                    sliderCtx.fillRect(seg.x - 6, seg.y - 3, 5, 4);
                    sliderCtx.fillRect(seg.x + 1, seg.y - 3, 5, 4);
                    sliderCtx.strokeRect(seg.x - 6, seg.y - 3, 5, 4);
                    sliderCtx.strokeRect(seg.x + 1, seg.y - 3, 5, 4);
                } else {
                    sliderCtx.fillStyle = bodyIdx % 2 === 0 ? bodyColor : bodyAccent;
                    sliderCtx.beginPath();
                    sliderCtx.arc(seg.x, seg.y, sliderPlayer.size * ratio, 0, Math.PI * 2);
                    sliderCtx.fill();
                    sliderCtx.stroke();
                }
            }
        });
    }

    function gameOverSlider(reason) {
        stopSliderGame();
        sounds.playWrong();

        let msg = `${reason}\n\nComiste ${sliderScoreCount} globos equivalentes.`;
        const lvl = state.activeGameLevel || 1;
        if (sliderScoreCount >= 3) {
            if (lvl === 1) {
                msg += `\n\n🎉 ¡Felicidades! Completaste Slither Fácil y desbloqueaste el Nivel 2: Slither Medio!`;
            } else if (lvl === 2) {
                msg += `\n\n🎉 ¡Felicidades! Completaste Slither Medio y desbloqueaste el Nivel 3: Slither Difícil!`;
            } else {
                msg += `\n\n🎉 ¡IMPRESIONANTE! Has culminado todo el planeta de Álgebra y Aritmética. ¡Medalla desbloqueada!`;
            }
        } else {
            msg += `\n\n💡 Consejos de Mateo: Multiplica numerador y denominador de la diana para saber qué número comer. ¡Practica de nuevo!`;
        }

        document.getElementById('slider-overlay-title').textContent = '¡Fin del Juego! 🐛';
        document.getElementById('slider-overlay-text').innerHTML = msg;
        document.getElementById('slider-overlay').classList.remove('hidden');
        document.getElementById('btn-start-slider-game').textContent = 'Volver a Jugar';
    }

    // Registrar Eventos Boost click
    sliderCanvas.addEventListener('mousedown', () => isBoosting = true);
    sliderCanvas.addEventListener('mouseup', () => isBoosting = false);
    sliderCanvas.addEventListener('touchstart', () => isBoosting = true);
    sliderCanvas.addEventListener('touchend', () => isBoosting = false);

    // Mouse positions
    sliderCanvas.addEventListener('mousemove', e => {
        const rect = sliderCanvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    });

    sliderCanvas.addEventListener('touchmove', e => {
        if (e.touches.length > 0) {
            const rect = sliderCanvas.getBoundingClientRect();
            mousePos.x = e.touches[0].clientX - rect.left;
            mousePos.y = e.touches[0].clientY - rect.top;
            e.preventDefault();
        }
    }, { passive: false });

    document.getElementById('btn-start-slider-game')?.addEventListener('click', startSliderGamePlay);
    document.getElementById('btn-restart-slider')?.addEventListener('click', startSliderGamePlay);

    window.stopSliderGame = stopSliderGame;
    window.initSliderGame = initSliderGame;
})();
