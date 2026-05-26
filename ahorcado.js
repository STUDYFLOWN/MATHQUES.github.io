/* ==========================================================================
   MathQuest V3 - Módulo Ahorcado de Conceptos (10-15 Años)
   Ahorcado de vocabulario matemático con 3 sub-niveles (Aritmética, Geometría y Lógica),
   teclado virtual premium en español y soporte de Pistas Globales.
   ========================================================================== */

(function() {
    const ahorcadoCanvas = document.getElementById('ahorcado-canvas');
    const ahorcadoCtx = ahorcadoCanvas?.getContext('2d');

    let currentWord = "";
    let currentRiddle = "";
    let guessedLetters = [];
    let ahorcadoLivesCount = 6;
    let isAhorcadoPlaying = false;
    let ahorcadoScore = 0;

    // Vocabulario por dificultad
    const WORDS_BANK = {
        1: [
            { word: "SUMA", riddle: "Operación de adición que junta o agrega dos cantidades numéricas." },
            { word: "RESTA", riddle: "Operación de sustracción donde quitamos o restamos una cantidad de otra." },
            { word: "ALGEBRA", riddle: "Parte de las matemáticas que usa letras para representar números generales." },
            { word: "VARIABLE", riddle: "Letra (como la x o y) que representa un valor desconocido en una ecuación." },
            { word: "SNAKE", riddle: "El divertido juego de la serpiente donde sumas manzanas para resolver ecuaciones." }
        ],
        2: [
            { word: "ANGULO", riddle: "Abertura formada por dos semirrectas que parten de un mismo punto llamado vértice." },
            { word: "SUDOKU", riddle: "Cuadrícula lógica donde debes colocar números del 1 al 9 sin repetir en filas o columnas." },
            { word: "FRACCION", riddle: "Representación de una parte de un todo, compuesta por numerador y denominador." },
            { word: "TRIANGULO", riddle: "Figura geométrica de tres lados cuyos ángulos internos siempre suman 180 grados." },
            { word: "PITAGORAS", riddle: "Matemático famoso creador del teorema sobre las hipotenusas y los catetos." }
        ],
        3: [
            { word: "HIPOTENUSA", riddle: "El lado más largo de un triángulo rectángulo, opuesto al ángulo recto de 90 grados." },
            { word: "ISOSCELES", riddle: "Tipo de triángulo que tiene exactamente dos lados iguales y uno diferente." },
            { word: "POLINOMIO", riddle: "Expresión algebraica que consta de la suma o resta de varios términos numéricos." },
            { word: "COORDENADAS", riddle: "Pares ordenados (x, y) que nos dicen la ubicación exacta de un punto en el plano." },
            { word: "PROPORCIONAL", riddle: "Dícese de dos magnitudes que mantienen una relación o razón constante entre sí." }
        ]
    };

    function initAhorcadoGame() {
        isAhorcadoPlaying = false;
        ahorcadoLivesCount = 6;
        ahorcadoScore = 0;
        document.getElementById('ahorcado-lives').textContent = '6';

        const lvl = state.activeGameLevel || 1;
        const diffLabels = { 1: "Fácil (Álgebra)", 2: "Medio (Geometría)", 3: "Difícil (Lógica)" };
        document.getElementById('ahorcado-overlay-title').textContent = `Ahorcado Matemático - Nivel ${diffLabels[lvl]}`;
        
        let descText = "";
        if (lvl === 1) {
            descText = "Conceptos de Álgebra y Aritmética básicos. ¡Mateo te guiará con adivinanzas muy sencillas!";
        } else if (lvl === 2) {
            descText = "Conceptos de ángulos, cuadrículas y fracciones. ¡Piensa rápido!";
        } else {
            descText = "Conceptos complejos de secundaria (triángulos avanzados, vectores y expresiones matemáticas).";
        }
        document.getElementById('ahorcado-overlay-text').innerHTML = descText;
        document.getElementById('ahorcado-overlay').classList.remove('hidden');

        // Registrar callback de pista global
        window.registerGameHintCallback(useAhorcadoHint);

        drawGallows();
    }

    function startAhorcadoGamePlay() {
        sounds.playClick();
        document.getElementById('ahorcado-overlay').classList.add('hidden');
        
        ahorcadoLivesCount = 6;
        document.getElementById('ahorcado-lives').textContent = '6';
        guessedLetters = [];
        isAhorcadoPlaying = true;
        
        selectRandomWord();
        renderWordSlots();
        renderVirtualKeyboard();
        drawGallows();
    }

    function selectRandomWord() {
        const lvl = state.activeGameLevel || 1;
        const bank = WORDS_BANK[lvl];
        const item = bank[Math.floor(Math.random() * bank.length)];
        
        currentWord = item.word;
        currentRiddle = item.riddle;

        document.getElementById('ahorcado-hint').innerHTML = `<strong>Adivinanza:</strong><br>${currentRiddle}`;
    }

    // Callback de Pista Universal en Ahorcado (Revela una letra oculta al azar)
    function useAhorcadoHint() {
        if (!isAhorcadoPlaying) return;

        // Encontrar letras de la palabra que no se han adivinado aún
        let unrevealed = [];
        for (let char of currentWord) {
            if (!guessedLetters.includes(char)) {
                unrevealed.push(char);
            }
        }

        if (unrevealed.length > 0) {
            const randomChar = unrevealed[Math.floor(Math.random() * unrevealed.length)];
            handleLetterGuess(randomChar);
        } else {
            alert("💡 ¡Ya has adivinado todas las letras de la palabra!");
        }
    }

    function renderWordSlots() {
        const container = document.getElementById('ahorcado-word-slots');
        if (!container) return;

        container.innerHTML = '';
        for (let char of currentWord) {
            const slot = document.createElement('div');
            slot.className = 'ahorcado-letter-slot';

            // Validar si ya se adivinó o si es un espacio
            if (char === ' ' || char === '-') {
                slot.textContent = char;
                slot.style.borderBottom = 'none';
            } else if (guessedLetters.includes(char)) {
                slot.textContent = char;
            } else {
                slot.textContent = '';
            }

            container.appendChild(slot);
        }
    }

    function renderVirtualKeyboard() {
        const keyboard = document.getElementById('ahorcado-virtual-keyboard');
        if (!keyboard) return;

        keyboard.innerHTML = '';
        const letters = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split('');

        letters.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'ah-key';
            btn.textContent = char;
            btn.dataset.letter = char;

            if (guessedLetters.includes(char)) {
                btn.classList.add('used');
                btn.disabled = true;
            }

            btn.onclick = () => {
                if (!isAhorcadoPlaying) return;
                sounds.playClick();
                btn.classList.add('used');
                btn.disabled = true;
                
                handleLetterGuess(char);
            };

            keyboard.appendChild(btn);
        });
    }

    function handleLetterGuess(char) {
        guessedLetters.push(char);

        // Deshabilitar botón visual correspondiente
        const btn = document.querySelector(`.ah-key[data-letter="${char}"]`);
        if (btn) {
            btn.classList.add('used');
            btn.disabled = true;
        }

        if (currentWord.includes(char)) {
            sounds.playEat();
            renderWordSlots();
            checkAhorcadoWin();
        } else {
            sounds.playWrong();
            ahorcadoLivesCount--;
            document.getElementById('ahorcado-lives').textContent = ahorcadoLivesCount;
            drawGallows();
            
            if (ahorcadoLivesCount <= 0) {
                gameOverAhorcado();
            }
        }
    }

    function checkAhorcadoWin() {
        // Comprobar si se revelaron todas las letras
        const win = currentWord.split('').every(char => char === ' ' || char === '-' || guessedLetters.includes(char));
        
        if (win) {
            isAhorcadoPlaying = false;
            sounds.playWin();
            confetti.spawn(75);

            addStars(15);
            addCoins(40);

            const lvl = state.activeGameLevel || 1;
            setTimeout(() => {
                if (lvl === 1) {
                    unlockLevel('ahorcado', 2);
                    alert("🎉 ¡Adivinaste la palabra! Has superado el Ahorcado Fácil y desbloqueaste Ahorcado Medio.");
                } else if (lvl === 2) {
                    unlockLevel('ahorcado', 3);
                    alert("🎉 ¡Adivinaste la palabra! Has superado Ahorcado Medio y desbloqueaste Ahorcado Difícil.");
                } else {
                    unlockLevel('ahorcado', 3); // Marca completo
                    alert("🏆 ¡CAMPEÓN ABSOLUTO DE RAZONAMIENTO MATEMÁTICO! Has desbloqueado la Medalla de Lógica 🧠. ¡Mateo está sumamente orgulloso de ti!");
                }
                changeScreen('hub');
            }, 1200);
        }
    }

    function gameOverAhorcado() {
        isAhorcadoPlaying = false;
        sounds.playWrong();

        document.getElementById('ahorcado-overlay-title').textContent = '¡Fin del Ahorcado! 🪓';
        document.getElementById('ahorcado-overlay-text').innerHTML = `La palabra secreta era: <strong>${currentWord}</strong>.<br><br>💡 Mateo te aconseja volver a intentarlo para reforzar tu vocabulario de matemáticas. ¡Tú puedes!`;
        document.getElementById('ahorcado-overlay').classList.remove('hidden');
        document.getElementById('btn-start-ahorcado-game').textContent = 'Volver a Intentar';
    }

    // Dibujo del Ahorcado Clásico
    function drawGallows() {
        if (!ahorcadoCtx) return;

        const rootStyle = getComputedStyle(document.documentElement);
        const textMuted = rootStyle.getPropertyValue('--color-text-muted').trim() || '#64748b';
        const coralAccent = rootStyle.getPropertyValue('--color-accent-coral').trim() || '#f43f5e';

        ahorcadoCtx.clearRect(0, 0, ahorcadoCanvas.width, ahorcadoCanvas.height);
        
        // Base de horca
        ahorcadoCtx.strokeStyle = textMuted;
        ahorcadoCtx.lineWidth = 4;
        ahorcadoCtx.lineCap = 'round';

        ahorcadoCtx.beginPath();
        ahorcadoCtx.moveTo(20, 140); ahorcadoCtx.lineTo(100, 140); // Base
        ahorcadoCtx.moveTo(40, 140); ahorcadoCtx.lineTo(40, 20);   // Poste vertical
        ahorcadoCtx.lineTo(120, 20);  // Poste superior horizontal
        ahorcadoCtx.lineTo(120, 35);  // Cuerda
        ahorcadoCtx.stroke();

        // Partes del cuerpo basadas en vidas restantes
        ahorcadoCtx.strokeStyle = coralAccent;
        ahorcadoCtx.lineWidth = 3;

        const errors = 6 - ahorcadoLivesCount;

        if (errors >= 1) {
            // Cabeza
            ahorcadoCtx.beginPath();
            ahorcadoCtx.arc(120, 47, 12, 0, Math.PI * 2);
            ahorcadoCtx.stroke();
        }
        if (errors >= 2) {
            // Tronco
            ahorcadoCtx.beginPath();
            ahorcadoCtx.moveTo(120, 59);
            ahorcadoCtx.lineTo(120, 95);
            ahorcadoCtx.stroke();
        }
        if (errors >= 3) {
            // Brazo izquierdo
            ahorcadoCtx.beginPath();
            ahorcadoCtx.moveTo(120, 68);
            ahorcadoCtx.lineTo(95, 80);
            ahorcadoCtx.stroke();
        }
        if (errors >= 4) {
            // Brazo derecho
            ahorcadoCtx.beginPath();
            ahorcadoCtx.moveTo(120, 68);
            ahorcadoCtx.lineTo(145, 80);
            ahorcadoCtx.stroke();
        }
        if (errors >= 5) {
            // Pierna izquierda
            ahorcadoCtx.beginPath();
            ahorcadoCtx.moveTo(120, 95);
            ahorcadoCtx.lineTo(98, 122);
            ahorcadoCtx.stroke();
        }
        if (errors >= 6) {
            // Pierna derecha
            ahorcadoCtx.beginPath();
            ahorcadoCtx.moveTo(120, 95);
            ahorcadoCtx.lineTo(142, 122);
            ahorcadoCtx.stroke();
        }
    }

    document.getElementById('btn-start-ahorcado-game')?.addEventListener('click', startAhorcadoGamePlay);
    document.getElementById('btn-restart-ahorcado')?.addEventListener('click', startAhorcadoGamePlay);

    window.initAhorcadoGame = initAhorcadoGame;
})();
