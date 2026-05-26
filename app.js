/* ==========================================================================
   MathQuest V3 - Core Application Controller, Audio & Game Engine
   Administra el estado, el sistema de medallas por logros, tienda de pistas,
   selector de temas independientes, Mateo AI Scanner y uso universal de pistas.
   ========================================================================== */

// Estado Global de MathQuest V3
const state = {
    stars: 0,
    streak: 1,
    xp: 0,
    userLevel: 1,
    mathCoins: 150,
    activeAvatar: 'cubo',
    currentScreen: 'hub',
    activeTopic: 'algebra', // algebra, geometry, logic
    
    // Niveles desbloqueados (e.g. 'snake_1' (Lvl 1 Fácil), 'snake_2' (Medio), etc.)
    // Por defecto, se desbloquean los niveles 1 (Fácil) de cada juego inicial de cada ruta
    unlockedLevels: ['snake_1', 'tetris_1', 'sudoku_1'],
    
    unlockedSkins: ['standard'],
    equippedSkin: 'standard',
    unlockedBadges: [], // Medallas obtenidas por Logros
    equippedBadge: 'none',
    theme: 'dark',
    hintsAvailable: 2, // Comienza con 2 pistas de regalo en la mochila!
    
    // Estado del juego activo actual
    activeGameId: null,
    activeGameLevel: 1 // 1: Fácil, 2: Medio, 3: Difícil
};

// SVG de los Avatares Geométricos Redondeados Estilo Premium
const AVATAR_SVGS = {
    cubo: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="25" width="60" height="60" rx="14" fill="#BFDBFE" stroke="var(--color-border)" stroke-width="3"/>
        <polygon points="15,25 35,12 95,12 75,25" fill="#93C5FD" stroke="var(--color-border)" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="75,25 95,12 95,72 75,85" fill="#60A5FA" stroke="var(--color-border)" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="35" cy="55" r="5" fill="#1e1e24"/>
        <circle cx="55" cy="55" r="5" fill="#1e1e24"/>
        <circle cx="37" cy="53" r="1.5" fill="#FFFFFF"/>
        <circle cx="57" cy="53" r="1.5" fill="#FFFFFF"/>
        <path d="M40 66 Q45 70 50 66" stroke="#1e1e24" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="27" cy="61" r="3.5" fill="#FECACA"/>
        <circle cx="63" cy="61" r="3.5" fill="#FECACA"/>
    </svg>`,
    esfera: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="42" fill="#FEF08A" stroke="var(--color-border)" stroke-width="3"/>
        <ellipse cx="35" cy="28" rx="10" ry="5" fill="#FFF" opacity="0.6" transform="rotate(-30 35 28)"/>
        <ellipse cx="36" cy="50" rx="5" ry="7" fill="#1e1e24"/>
        <ellipse cx="64" cy="50" rx="5" ry="7" fill="#1e1e24"/>
        <circle cx="35" cy="47" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="47" r="1.5" fill="#FFFFFF"/>
        <circle cx="50" cy="65" r="5" fill="#1e1e24"/>
        <circle cx="24" cy="57" r="3.5" fill="#FECACA"/>
        <circle cx="76" cy="57" r="3.5" fill="#FECACA"/>
    </svg>`,
    piramide: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,12 12,78 50,88" fill="#E9D5FF" stroke="var(--color-border)" stroke-width="3" stroke-linejoin="round"/>
        <polygon points="50,12 50,88 88,78" fill="#D8B4FE" stroke="var(--color-border)" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="36" cy="54" r="4.5" fill="#1e1e24"/>
        <circle cx="38" cy="52" r="1.5" fill="#FFFFFF"/>
        <circle cx="64" cy="54" r="4.5" fill="#1e1e24"/>
        <circle cx="66" cy="52" r="1.5" fill="#FFFFFF"/>
        <path d="M46 66 Q50 69 54 66" stroke="#1e1e24" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="28" cy="61" r="3" fill="#FECACA"/>
        <circle cx="72" cy="61" r="3" fill="#FECACA"/>
    </svg>`,
    cilindro: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="25" width="50" height="50" fill="#FED7AA" stroke="var(--color-border)" stroke-width="3"/>
        <ellipse cx="50" cy="25" rx="25" ry="9" fill="#FDBA74" stroke="var(--color-border)" stroke-width="3"/>
        <ellipse cx="50" cy="75" rx="25" ry="9" fill="#FED7AA" stroke="var(--color-border)" stroke-width="3"/>
        <polygon points="32,44 48,44 45,51 35,51" fill="#1e1e24" stroke="#1e1e24" stroke-width="2"/>
        <polygon points="52,44 68,44 65,51 55,51" fill="#1e1e24" stroke="#1e1e24" stroke-width="2"/>
        <line x1="48" y1="44" x2="52" y2="44" stroke="#1e1e24" stroke-width="3"/>
        <path d="M45 63 Q50 61 55 63" stroke="#1e1e24" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
};

// Catálogo de la Tienda de MathCoins (Solo Skins y Pistas globales)
const SHOP_ITEMS = [
    {
        id: 'skin_standard',
        type: 'skin',
        name: 'Piel Esmeralda',
        desc: 'Color clásico verde neón para tu gusano o serpiente.',
        price: 0,
        rarity: 'common',
        icon: '🟢',
        skinKey: 'standard'
    },
    {
        id: 'skin_gold',
        type: 'skin',
        name: 'Dragón de Oro',
        desc: 'Deslumbrante piel dorada neón metálica con destellos amarillos.',
        price: 200,
        rarity: 'legendary',
        icon: '👑',
        skinKey: 'gold'
    },
    {
        id: 'skin_cyber',
        type: 'skin',
        name: 'Cyber Morado',
        desc: 'Aspecto tecnológico morado con efectos de neón cibernético.',
        price: 150,
        rarity: 'epic',
        icon: '👾',
        skinKey: 'cyber'
    },
    {
        id: 'powerup_reveal',
        type: 'powerup',
        name: 'Pistas Universales 💡',
        desc: 'Una pista global para usar en cualquier juego (Snake, Sudoku, Tetris, etc.).',
        price: 40,
        rarity: 'common',
        icon: '💡',
        powerupKey: 'reveal'
    }
];

// Medallas y Logros de Perfil por Mérito (NO comprables)
const ACHIEVEMENTS = [
    {
        id: 'badge_algebra',
        name: 'Maestro del Álgebra',
        desc: 'Completa el nivel 3 (Difícil) de Snake y Slither-Fracciones.',
        icon: '🪐',
        badgeKey: 'algebra_pro',
        color: 'var(--color-accent-blue)',
        checkUnlocked: () => state.unlockedLevels.includes('snake_3') && state.unlockedLevels.includes('slider_3')
    },
    {
        id: 'badge_geometry',
        name: 'Pro de la Geometría',
        desc: 'Completa el nivel 3 (Difícil) de Math-Tetris y Barricada.',
        icon: '📐',
        badgeKey: 'geometry_pro',
        color: 'var(--color-accent-purple)',
        checkUnlocked: () => state.unlockedLevels.includes('tetris_3') && state.unlockedLevels.includes('barricade_3')
    },
    {
        id: 'badge_logic',
        name: 'Mago de la Lógica',
        desc: 'Completa el nivel 3 (Difícil) de Sodocu 9x9 y el Ahorcado.',
        icon: '🧠',
        badgeKey: 'logic_pro',
        color: 'var(--color-accent-yellow)',
        checkUnlocked: () => state.unlockedLevels.includes('sudoku_3') && state.unlockedLevels.includes('ahorcado_3')
    },
    {
        id: 'badge_champion',
        name: 'Campeón MathQuest',
        desc: 'Completa absolutamente los 18 niveles de todas las rutas.',
        icon: '👑',
        badgeKey: 'champion_pro',
        color: 'var(--color-accent-coral)',
        checkUnlocked: () => state.unlockedLevels.length >= 18
    }
];

// Emojis y colores para medallas de perfil
const BADGE_DESCRIPTIONS = {
    none: { emoji: '', color: 'transparent', label: 'Sin Medalla' },
    algebra_pro: { emoji: '🪐', color: 'var(--color-accent-blue)', label: 'Maestro Álgebra' },
    geometry_pro: { emoji: '📐', color: 'var(--color-accent-purple)', label: 'Pro Geometría' },
    logic_pro: { emoji: '🧠', color: 'var(--color-accent-yellow)', label: 'Mago Lógica' },
    champion_pro: { emoji: '👑', color: 'var(--color-accent-coral)', label: 'Campeón MathQuest' }
};

// --------------------------------------------------------------------------
// Audio Engine (Sintetizador Web Audio API)
// --------------------------------------------------------------------------
class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(freqs, durations, type = 'sine', slide = false) {
        this.init();
        if (!this.ctx) return;
        
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const now = this.ctx.currentTime;
        let time = now;

        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.frequency.setValueAtTime(freq, time);
            
            if (slide && i > 0) {
                osc.frequency.exponentialRampToValueAtTime(freq, time + durations[i]);
            }

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i] - 0.01);

            osc.start(time);
            osc.stop(time + durations[i]);
            
            time += durations[i];
        });
    }

    playClick() { this.play([450], [0.05], 'sine'); }
    playCorrect() { this.play([523.25, 659.25, 783.99, 1046.50], [0.07, 0.07, 0.07, 0.18], 'triangle'); }
    playWrong() { this.play([200, 130], [0.12, 0.25], 'sawtooth', true); }
    playEat() { this.play([440, 659.25], [0.05, 0.07], 'sine'); }
    playWin() {
        const d = 0.09;
        this.play([523, 523, 523, 659, 523, 784, 1046], [d, d, d, d * 2, d, d, d * 4], 'sine');
    }
    playTrap() { this.play([180, 90], [0.15, 0.3], 'triangle', true); }
}

const sounds = new SoundEngine();

// --------------------------------------------------------------------------
// Confetti Particle Engine
// --------------------------------------------------------------------------
class ConfettiEngine {
    constructor() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationFrame = null;
        this.active = false;
        
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    spawn(count = 70) {
        if (!this.canvas) return;
        this.resizeCanvas();
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * -this.canvas.height - 20,
                size: Math.random() * 8 + 6,
                color: ['#10b981', '#3b82f6', '#8b5cf6', '#eab308', '#f87171', '#FED7AA'][Math.floor(Math.random() * 6)],
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 5 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 4 - 2
            });
        }
        if (!this.active) {
            this.active = true;
            this.animate();
        }
    }

    animate() {
        if (this.particles.length === 0) {
            this.active = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotationSpeed;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();

            if (p.y > this.canvas.height) {
                this.particles.splice(i, 1);
            }
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

let confetti;
window.addEventListener('DOMContentLoaded', () => {
    confetti = new ConfettiEngine();
});

// --------------------------------------------------------------------------
// Generador Matemático Procedural V3 (Fácil, Medio, Difícil)
// --------------------------------------------------------------------------
const mathGen = {
    // 1. Ecuaciones Lineales para Snake
    generateLinearEquation(diff = 1) {
        if (diff === 1) {
            // Fácil: Ecuación sumas simples x + a = b o ax = b
            const x = Math.floor(Math.random() * 6) + 1; // x entre 1 y 6
            const a = Math.floor(Math.random() * 7) + 2; // a entre 2 y 8
            const type = Math.random() > 0.5;

            let equationText = "";
            if (type) {
                equationText = `x + ${a} = ${x + a}`;
            } else {
                equationText = `${a}x = ${a * x}`;
            }
            const options = this.generateOptions(x, 1, 15);
            return { question: `Halla x:`, equation: equationText, correct: x, options };
        } 
        else if (diff === 2) {
            // Medio: ax + b = c o ax - b = c con coeficientes negativos
            const x = Math.floor(Math.random() * 7) + 2; // x: 2 a 8
            const a = Math.floor(Math.random() * 3) + 2; // a: 2 a 4
            const sign = Math.random() > 0.5 ? 1 : -1;
            const b = Math.floor(Math.random() * 8) + 1; // b: 1 a 8
            
            let equationText = "";
            let c = 0;
            if (sign === 1) {
                c = a * x + b;
                equationText = `${a}x + ${b} = ${c}`;
            } else {
                c = a * x - b;
                equationText = `${a}x - ${b} = ${c}`;
            }
            const options = this.generateOptions(x, 1, 20);
            return { question: `Halla x:`, equation: equationText, correct: x, options };
        } 
        else {
            // Difícil: a(x + b) = c o exponentes base^x = c
            const type = Math.random() > 0.5;
            if (type) {
                const x = Math.floor(Math.random() * 5) + 2; // 2 a 6
                const a = Math.floor(Math.random() * 3) + 2; // a: 2 a 4
                const b = Math.floor(Math.random() * 4) + 1; // b: 1 a 4
                const c = a * (x + b);
                const equationText = `${a}(x + ${b}) = ${c}`;
                const options = this.generateOptions(x, 1, 20);
                return { question: `Halla x:`, equation: equationText, correct: x, options };
            } else {
                const bases = [2, 3, 5];
                const base = bases[Math.floor(Math.random() * bases.length)];
                const power = Math.floor(Math.random() * 3) + 2; // base^2 a base^4
                const result = Math.pow(base, power);
                const equationText = `${base}^x = ${result}`;
                const options = this.generateOptions(power, 1, 10);
                return { question: `Halla x:`, equation: equationText, correct: power, options };
            }
        }
    },

    // 2. Fracciones Equivalentes para Slither
    generateFractions(diff = 1) {
        // Fracciones base típicas
        const bases = [
            { num: 1, den: 2, text: "1 / 2" },
            { num: 2, den: 3, text: "2 / 3" },
            { num: 3, den: 4, text: "3 / 4" },
            { num: 3, den: 5, text: "3 / 5" }
        ];
        const base = bases[Math.floor(Math.random() * bases.length)];
        
        if (diff === 1) {
            // Fácil: Multiplicadores sencillos (x2, x3, x4)
            const mult = Math.floor(Math.random() * 3) + 2;
            const fnum = base.num * mult;
            const fden = base.den * mult;
            return {
                num: base.num, den: base.den,
                text: base.text,
                correctNum: fnum, correctDen: fden,
                correctText: `${fnum}/${fden}`
            };
        } 
        else if (diff === 2) {
            // Medio: Multiplicadores más grandes (x5 a x10)
            const mult = Math.floor(Math.random() * 5) + 5;
            const fnum = base.num * mult;
            const fden = base.den * mult;
            return {
                num: base.num, den: base.den,
                text: base.text,
                correctNum: fnum, correctDen: fden,
                correctText: `${fnum}/${fden}`
            };
        } 
        else {
            // Difícil: Decimales equivalentes o multiplicadores primos
            const decimal = base.num / base.den;
            const mult = Math.floor(Math.random() * 6) + 4;
            const fnum = base.num * mult;
            const fden = base.den * mult;
            return {
                num: base.num, den: base.den,
                text: `Decimal ${decimal.toFixed(2)}`,
                correctNum: fnum, correctDen: fden,
                correctText: `${fnum}/${fden}`
            };
        }
    },

    // Distractores de opciones
    generateOptions(correctVal, min = 1, max = 100) {
        const options = new Set([correctVal]);
        while (options.size < 3) {
            const offset = Math.floor(Math.random() * 7) - 3;
            const option = correctVal + offset;
            if (option >= min && option <= max) {
                options.add(option);
            }
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    }
};

// --------------------------------------------------------------------------
// Inicialización del Hub y Persistencia de V3
// --------------------------------------------------------------------------
const MATEO_HUB_MESSAGES = [
    "¡Hola Aventurero! Elige tu ruta preferida en la barra de temas.",
    "¡Supera el nivel 3 de los juegos para ganar medallas de honor por mérito!",
    "¡Mateo IA Scanner puede analizar tus deberes! Sube una foto en la pestaña IA.",
    "¡Ahora puedes comprar Pistas Globales en la Tienda y usarlas en todos los juegos!",
    "¿Podrás resolver el inmenso Sodocu de 9x9 con tus variables algebraicas?"
];

function initApp() {
    // Cargar datos locales V3 (Prefijo mq3_ para ambiente libre de conflictos)
    const savedStars = localStorage.getItem('mq3_stars');
    const savedStreak = localStorage.getItem('mq3_streak');
    const savedXP = localStorage.getItem('mq3_xp');
    const savedLevel = localStorage.getItem('mq3_level');
    const savedCoins = localStorage.getItem('mq3_coins');
    const savedAvatar = localStorage.getItem('mq3_avatar');
    const savedUnlockedLevels = localStorage.getItem('mq3_unlocked');
    const savedUnlockedSkins = localStorage.getItem('mq3_unlocked_skins');
    const savedEquippedSkin = localStorage.getItem('mq3_equipped_skin');
    const savedUnlockedBadges = localStorage.getItem('mq3_unlocked_badges');
    const savedEquippedBadge = localStorage.getItem('mq3_equipped_badge');
    const savedTheme = localStorage.getItem('mq3_theme');
    const savedHints = localStorage.getItem('mq3_hints');

    if (savedStars) state.stars = parseInt(savedStars, 10);
    if (savedStreak) state.streak = parseInt(savedStreak, 10);
    if (savedXP) state.xp = parseInt(savedXP, 10);
    if (savedLevel) state.userLevel = parseInt(savedLevel, 10);
    if (savedCoins) state.mathCoins = parseInt(savedCoins, 10);
    if (savedAvatar) state.activeAvatar = savedAvatar;
    if (savedEquippedSkin) state.equippedSkin = savedEquippedSkin;
    if (savedEquippedBadge) state.equippedBadge = savedEquippedBadge;
    if (savedTheme) state.theme = savedTheme;
    if (savedHints) state.hintsAvailable = parseInt(savedHints, 10);

    if (savedUnlockedLevels) {
        try { state.unlockedLevels = JSON.parse(savedUnlockedLevels); } catch(e) {}
    }
    if (savedUnlockedSkins) {
        try { state.unlockedSkins = JSON.parse(savedUnlockedSkins); } catch(e) {}
    }
    if (savedUnlockedBadges) {
        try { state.unlockedBadges = JSON.parse(savedUnlockedBadges); } catch(e) {}
    }

    // Asegurar compatibilidad de desbloqueo inicial
    if (!state.unlockedLevels.includes('snake_1')) state.unlockedLevels.push('snake_1');
    if (!state.unlockedLevels.includes('tetris_1')) state.unlockedLevels.push('tetris_1');
    if (!state.unlockedLevels.includes('sudoku_1')) state.unlockedLevels.push('sudoku_1');

    // Inicializar UI
    document.documentElement.setAttribute('data-theme', state.theme);
    updateStatsDisplay();
    renderAvatares();
    selectAvatar(state.activeAvatar);
    updatePathUnlocks();
    renderShop();
    renderAchievements();

    // Mensaje de Mateo
    const bubble = document.getElementById('mateo-hub-bubble');
    if (bubble) {
        bubble.textContent = MATEO_HUB_MESSAGES[Math.floor(Math.random() * MATEO_HUB_MESSAGES.length)];
    }

    // --- Control de Pestañas Principales del Hub ---
    const mainTabs = [
        { btn: 'tab-btn-path', view: 'hub-path-view' },
        { btn: 'tab-btn-shop', view: 'hub-shop-view' },
        { btn: 'tab-btn-achievements', view: 'hub-achievements-view' },
        { btn: 'tab-btn-scanner', view: 'hub-scanner-view' }
    ];

    mainTabs.forEach(tab => {
        const btnEl = document.getElementById(tab.btn);
        if (btnEl) {
            btnEl.addEventListener('click', () => {
                sounds.playClick();
                mainTabs.forEach(t => {
                    document.getElementById(t.btn)?.classList.remove('active');
                    document.getElementById(t.view)?.classList.add('hidden');
                });
                btnEl.classList.add('active');
                document.getElementById(tab.view)?.classList.remove('hidden');

                if (tab.btn === 'tab-btn-shop') renderShop();
                if (tab.btn === 'tab-btn-achievements') renderAchievements();
            });
        }
    });

    // --- Selector de Temas de Aprendizaje ---
    const topicBtns = document.querySelectorAll('.topic-selector-btn');
    topicBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sounds.playClick();
            topicBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const topic = btn.getAttribute('data-topic');
            state.activeTopic = topic;

            document.querySelectorAll('.topic-path-container').forEach(c => c.classList.add('hidden'));
            document.getElementById(`path-topic-${topic}`)?.classList.remove('hidden');
        });
    });

    // --- Enlazar Nodos de Ruta Dinámicos ---
    document.querySelectorAll('.path-node').forEach(node => {
        node.addEventListener('click', () => {
            const gameId = node.getAttribute('data-game');
            const levelVal = parseInt(node.getAttribute('data-level'), 10);
            const levelKey = `${gameId}_${levelVal}`;

            if (node.classList.contains('locked')) {
                sounds.playWrong();
                alert("🔒 ¡Nivel bloqueado! Completa los niveles previos del tema en la ruta de MathQuest.");
                return;
            }
            sounds.playClick();
            launchGame(gameId, levelVal);
        });
    });

    // --- Evento de Toggle de Tema ---
    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            sounds.playClick();
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', state.theme);
            localStorage.setItem('mq3_theme', state.theme);
        });
    }

    // Navegación Volver
    const btnBack = document.getElementById('btn-back-menu');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            sounds.playClick();
            changeScreen('hub');
        });
    }
    const logo = document.getElementById('header-logo');
    if (logo) {
        logo.addEventListener('click', () => {
            sounds.playClick();
            changeScreen('hub');
        });
    }

    // Inicializar Simulador de Escáner IA
    initAIScanner();

    // Desbloquear Audio al primer click
    document.body.addEventListener('click', () => { sounds.init(); }, { once: true });
}

// --------------------------------------------------------------------------
// Estadísticas y Persistencia
// --------------------------------------------------------------------------
function updateStatsDisplay() {
    const starCount = document.getElementById('star-count');
    const streakCount = document.getElementById('streak-count');
    const coinsCount = document.getElementById('coins-count');
    const userLevel = document.getElementById('user-level');
    const hintsCount = document.getElementById('global-hints-count');
    const badgeOverlay = document.getElementById('equipped-badge-display');

    if (starCount) starCount.textContent = state.stars;
    if (streakCount) streakCount.textContent = state.streak;
    if (coinsCount) coinsCount.textContent = state.mathCoins;
    if (userLevel) userLevel.textContent = state.userLevel;
    if (hintsCount) hintsCount.textContent = state.hintsAvailable;

    if (badgeOverlay) {
        const currentBadge = BADGE_DESCRIPTIONS[state.equippedBadge || 'none'];
        if (currentBadge && currentBadge.emoji) {
            badgeOverlay.textContent = currentBadge.emoji;
            badgeOverlay.style.background = currentBadge.color;
            badgeOverlay.style.display = 'flex';
        } else {
            badgeOverlay.style.display = 'none';
        }
    }
}

function addStars(count) {
    state.stars += count;
    addXP(count * 15);
    localStorage.setItem('mq3_stars', state.stars);
    updateStatsDisplay();

    const pill = document.querySelector('.stars-pill');
    if (pill) {
        pill.style.transform = 'scale(1.2) rotate(4deg)';
        setTimeout(() => pill.style.transform = 'none', 200);
    }
}

function addCoins(amount) {
    state.mathCoins += amount;
    localStorage.setItem('mq3_coins', state.mathCoins);
    updateStatsDisplay();

    const pill = document.querySelector('.coins-pill');
    if (pill) {
        pill.style.transform = 'scale(1.2) rotate(-4deg)';
        setTimeout(() => pill.style.transform = 'none', 200);
    }
}

function addXP(amount) {
    state.xp += amount;
    localStorage.setItem('mq3_xp', state.xp);

    const newLevel = Math.floor(state.xp / 150) + 1;
    if (newLevel > state.userLevel) {
        state.userLevel = newLevel;
        localStorage.setItem('mq3_level', state.userLevel);
        confetti.spawn(80);
        sounds.playWin();
        openMateoModal("🎉 ¡Subiste de Nivel!", `¡Impresionante! Has alcanzado el **Nivel ${state.userLevel}**. Mateo te felicita por tu asombrosa dedicación. ¡Sigue así! 🚀`);
    }
    updateStatsDisplay();
}

function unlockLevel(gameId, levelVal) {
    const levelKey = `${gameId}_${levelVal}`;
    if (!state.unlockedLevels.includes(levelKey)) {
        state.unlockedLevels.push(levelKey);
        localStorage.setItem('mq3_unlocked', JSON.stringify(state.unlockedLevels));
        updatePathUnlocks();
        confetti.spawn(35);
        
        // Evaluar logros de forma proactiva al desbloquear niveles
        checkAndUnlockAchievements();
    }
}

function updatePathUnlocks() {
    // Definimos el orden por ruta
    const paths = {
        algebra: ['snake_1', 'snake_2', 'snake_3', 'slider_1', 'slider_2', 'slider_3'],
        geometry: ['tetris_1', 'tetris_2', 'tetris_3', 'barricade_1', 'barricade_2', 'barricade_3'],
        logic: ['sudoku_1', 'sudoku_2', 'sudoku_3', 'ahorcado_1', 'ahorcado_2', 'ahorcado_3']
    };

    Object.keys(paths).forEach(topic => {
        const list = paths[topic];
        list.forEach((levelKey, index) => {
            const parts = levelKey.split('_');
            const gameId = parts[0];
            const lvlVal = parts[1];

            const node = document.querySelector(`#path-topic-${topic} .path-node[data-game="${gameId}"][data-level="${lvlVal}"]`);
            if (node) {
                let locked = true;
                if (index === 0) {
                    locked = false; // Primer nivel siempre libre
                } else {
                    // Libre si se desbloqueó o si el anterior está resuelto
                    locked = !state.unlockedLevels.includes(levelKey);
                }

                if (!locked) {
                    node.classList.remove('locked');
                } else {
                    node.classList.add('locked');
                }
            }
        });
    });
}

// --------------------------------------------------------------------------
// Achievements & Medallas de Perfil (Solo por Mérito)
// --------------------------------------------------------------------------
function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    container.innerHTML = '';

    ACHIEVEMENTS.forEach(badge => {
        const isUnlocked = badge.checkUnlocked();
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

        let btnHtml = '';
        if (isUnlocked) {
            const isEquipped = state.equippedBadge === badge.badgeKey;
            btnHtml = `<button class="btn ${isEquipped ? 'btn-equipped' : 'btn-secondary'} w-100" id="btn-equip-badge-${badge.id}">
                ${isEquipped ? 'Equipado' : 'Equipar'}
            </button>`;
        } else {
            btnHtml = `<button class="btn btn-secondary w-100" disabled style="opacity:0.4; cursor:not-allowed;">Bloqueado</button>`;
        }

        card.innerHTML = `
            <div class="achievement-icon">${badge.icon}</div>
            <h4>${badge.name}</h4>
            <p>${badge.desc}</p>
            ${btnHtml}
        `;

        container.appendChild(card);

        if (isUnlocked) {
            const btn = card.querySelector(`#btn-equip-badge-${badge.id}`);
            btn?.addEventListener('click', () => {
                sounds.playClick();
                if (state.equippedBadge === badge.badgeKey) {
                    state.equippedBadge = 'none';
                } else {
                    state.equippedBadge = badge.badgeKey;
                }
                localStorage.setItem('mq3_equipped_badge', state.equippedBadge);
                updateStatsDisplay();
                renderAchievements();
            });
        }
    });
}

function checkAndUnlockAchievements() {
    ACHIEVEMENTS.forEach(badge => {
        if (badge.checkUnlocked() && !state.unlockedBadges.includes(badge.badgeKey)) {
            state.unlockedBadges.push(badge.badgeKey);
            localStorage.setItem('mq3_unlocked_badges', JSON.stringify(state.unlockedBadges));
            
            // Auto equipar de inmediato
            state.equippedBadge = badge.badgeKey;
            localStorage.setItem('mq3_equipped_badge', state.equippedBadge);

            sounds.playWin();
            confetti.spawn(90);
            
            openMateoModal(`🏅 ¡Logro Desbloqueado!`, `¡Espectacular! Has ganado la medalla de honor **${badge.name}** (${badge.icon}) tras completar el nivel difícil de los desafíos correspondientes. ¡Ya adorna tu perfil! 🌟`);
            updateStatsDisplay();
        }
    });
}

// --------------------------------------------------------------------------
// Gestión de Avatares
// --------------------------------------------------------------------------
function renderAvatares() {
    Object.keys(AVATAR_SVGS).forEach(key => {
        const opt = document.getElementById(`avatar-opt-${key}`);
        if (opt) {
            opt.innerHTML = AVATAR_SVGS[key];
            opt.addEventListener('click', () => {
                sounds.playClick();
                selectAvatar(key);
            });
        }
    });
}

function selectAvatar(key) {
    state.activeAvatar = key;
    localStorage.setItem('mq3_avatar', key);

    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    const activeOpt = document.getElementById(`avatar-opt-${key}`);
    if (activeOpt) activeOpt.classList.add('selected');

    const display = document.getElementById('active-avatar-display');
    if (display) display.innerHTML = AVATAR_SVGS[key];
}

// --------------------------------------------------------------------------
// Tienda de Pistas y Skins
// --------------------------------------------------------------------------
function renderShop() {
    const containerSkins = document.getElementById('shop-container-skins');
    const containerPowerups = document.getElementById('shop-container-powerups');

    if (!containerSkins || !containerPowerups) return;

    containerSkins.innerHTML = '';
    containerPowerups.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const card = document.createElement('div');
        card.className = `shop-item-card`;
        const rarityBadge = `<span class="rarity-badge ${item.rarity}">${item.rarity}</span>`;
        
        let actionBtnText = `Comprar`;
        let actionBtnClass = `btn btn-primary w-100`;
        let isEquipped = false;

        if (item.type === 'skin') {
            const hasSkin = state.unlockedSkins.includes(item.skinKey);
            const isEquippedSkin = state.equippedSkin === item.skinKey;
            
            if (isEquippedSkin) {
                actionBtnText = `Equipado`;
                actionBtnClass = `btn btn-equipped w-100`;
                isEquipped = true;
            } else if (hasSkin) {
                actionBtnText = `Equipar`;
                actionBtnClass = `btn btn-secondary w-100`;
            }
        } else if (item.type === 'powerup') {
            actionBtnText = `Comprar (Mochila: ${state.hintsAvailable})`;
            actionBtnClass = `btn btn-primary w-100`;
        }

        if (isEquipped) card.classList.add('equipped');

        card.innerHTML = `
            ${rarityBadge}
            <div class="shop-item-header">
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                </div>
            </div>
            <div class="shop-item-footer">
                <div class="shop-item-price">
                    <span>🪙</span>
                    <span>${item.price}</span>
                </div>
                <div style="flex:1; margin-left: 15px;">
                    <button class="${actionBtnClass}" id="btn-shop-${item.id}">${actionBtnText}</button>
                </div>
            </div>
        `;

        if (item.type === 'skin') {
            containerSkins.appendChild(card);
        } else {
            containerPowerups.appendChild(card);
        }

        const btn = card.querySelector(`#btn-shop-${item.id}`);
        btn?.addEventListener('click', () => triggerShopAction(item));
    });
}

function triggerShopAction(item) {
    sounds.playClick();

    if (item.type === 'skin') {
        const hasSkin = state.unlockedSkins.includes(item.skinKey);
        if (hasSkin) {
            state.equippedSkin = item.skinKey;
            localStorage.setItem('mq3_equipped_skin', item.skinKey);
            renderShop();
            return;
        }
    }

    if (state.mathCoins < item.price) {
        sounds.playWrong();
        openMateoModal("🪙 Monedas Insuficientes", `¡Oh-oh! Necesitas **${item.price} MathCoins** para adquirir este artículo. Completa desafíos en tus caminos para ganar más.`);
        return;
    }

    state.mathCoins -= item.price;
    localStorage.setItem('mq3_coins', state.mathCoins);
    sounds.playCorrect();
    confetti.spawn(30);

    if (item.type === 'skin') {
        state.unlockedSkins.push(item.skinKey);
        state.equippedSkin = item.skinKey;
        localStorage.setItem('mq3_unlocked_skins', JSON.stringify(state.unlockedSkins));
        localStorage.setItem('mq3_equipped_skin', item.skinKey);
        openMateoModal("🐍 ¡Nueva Skin Obtenida!", `¡Felicidades! Desbloqueaste la skin **${item.name}**. Tus gusanos y serpientes lucirán este aspecto premium.`);
    } else if (item.type === 'powerup') {
        state.hintsAvailable += 1;
        localStorage.setItem('mq3_hints', state.hintsAvailable);
        openMateoModal("💡 ¡Pista Global Obtenida!", `Has adquirido 1 **Pista Global**. Podrás usarla haciendo clic en el foco dentro de cualquier nivel de los 6 juegos. ¡Úsala inteligentemente!`);
    }

    updateStatsDisplay();
    renderShop();
}

// --------------------------------------------------------------------------
// Uso de Pistas Universales
// --------------------------------------------------------------------------
// Los juegos individuales definen sus propios callbacks a window.onUseHintCallback
let globalHintCallback = null;

function registerGameHintCallback(cb) {
    globalHintCallback = cb;
}

document.querySelectorAll('.btn-use-hint').forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.hintsAvailable <= 0) {
            sounds.playWrong();
            alert("❌ ¡No tienes pistas disponibles en tu mochila! Cómpralas en la Tienda con tus MathCoins.");
            return;
        }

        if (globalHintCallback) {
            state.hintsAvailable--;
            localStorage.setItem('mq3_hints', state.hintsAvailable);
            updateStatsDisplay();
            sounds.playCorrect();
            
            // Disparar pista del juego actual
            globalHintCallback();
        } else {
            alert("💡 No hay ninguna celda o manzana seleccionable para aplicar la pista en este momento.");
        }
    });
});

// --------------------------------------------------------------------------
// Router de Pantallas y Lanzamientos
// --------------------------------------------------------------------------
function changeScreen(screenId) {
    state.currentScreen = screenId;
    document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
    
    if (screenId === 'hub') {
        document.getElementById('btn-back-menu')?.classList.add('hidden');
        globalHintCallback = null; // Limpiar

        // Detener bucles
        if (window.stopSnakeGame) window.stopSnakeGame();
        if (window.stopTetrisGame) window.stopTetrisGame();
        if (window.stopSliderGame) window.stopSliderGame();
        if (window.stopSudokuGame) window.stopSudokuGame();

        const bubble = document.getElementById('mateo-hub-bubble');
        if (bubble) {
            bubble.textContent = MATEO_HUB_MESSAGES[Math.floor(Math.random() * MATEO_HUB_MESSAGES.length)];
        }
    } else {
        document.getElementById('btn-back-menu')?.classList.remove('hidden');
    }

    const active = document.getElementById(`screen-${screenId}`);
    if (active) active.classList.remove('hidden');
}

function launchGame(gameId, levelVal) {
    state.activeGameId = gameId;
    state.activeGameLevel = levelVal;

    changeScreen(gameId);

    // Ejecutar inicializadores particulares
    if (gameId === 'snake' && window.initSnakeGame) {
        window.initSnakeGame();
    } else if (gameId === 'tetris' && window.initTetrisGame) {
        window.initTetrisGame();
    } else if (gameId === 'slider' && window.initSliderGame) {
        window.initSliderGame();
    } else if (gameId === 'sudoku' && window.initSudokuGame) {
        window.initSudokuGame();
    } else if (gameId === 'barricade' && window.initBarricadeGame) {
        window.initBarricadeGame();
    } else if (gameId === 'ahorcado' && window.initAhorcadoGame) {
        window.initAhorcadoGame();
    }
}

// Modal Informativo de Mateo
function openMateoModal(title, text) {
    const modal = document.getElementById('math-modal');
    if (!modal) return;
    
    const prompt = document.getElementById('modal-equation-prompt');
    const eqBox = document.getElementById('modal-equation');
    const optionsGrid = document.getElementById('modal-options');
    const feedback = document.getElementById('modal-feedback');

    prompt.innerHTML = text;
    eqBox.textContent = "";
    feedback.classList.add('hidden');
    optionsGrid.innerHTML = '';

    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-mascot-emoji').textContent = "🦖";

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-primary btn-large w-100';
    closeBtn.textContent = '¡Entendido!';
    closeBtn.addEventListener('click', () => {
        sounds.playClick();
        modal.classList.add('hidden');
        document.getElementById('modal-title').textContent = "¡Desafío Rápido!";
        document.getElementById('modal-mascot-emoji').textContent = "💡";
    });
    optionsGrid.appendChild(closeBtn);

    modal.classList.remove('hidden');
}

// --------------------------------------------------------------------------
// Simulador de Escáner IA de Mateo 📸
// --------------------------------------------------------------------------
function initAIScanner() {
    const dragArea = document.getElementById('image-drag-area');
    const fileInput = document.getElementById('scanner-file-input');
    const btnRun = document.getElementById('btn-run-scanner');
    const progressBar = document.getElementById('scan-progress-box');
    const progressFill = document.getElementById('scan-progress-bar');
    const statusText = document.getElementById('scan-status-text');
    const previewContainer = document.getElementById('scanner-preview-container');
    const previewImg = document.getElementById('scanner-preview-img');
    const btnRemove = document.getElementById('btn-remove-photo');
    const outputCard = document.getElementById('scanner-output-card');
    const outputText = document.getElementById('scanner-output-text');
    const btnPlayCustom = document.getElementById('btn-play-custom-game');

    let loadedPreset = null;

    // Clicks en drag area
    dragArea?.addEventListener('click', (e) => {
        if (e.target !== btnRemove && !previewContainer.classList.contains('hidden') === false) {
            fileInput?.click();
        }
    });

    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadCustomPhoto(file);
        }
    });

    btnRemove?.addEventListener('click', (e) => {
        e.stopPropagation();
        previewContainer.classList.add('hidden');
        previewImg.src = '';
        fileInput.value = '';
        loadedPreset = null;
        outputCard.classList.add('hidden');
    });

    // presets cards
    const presetCards = document.querySelectorAll('.preset-card');
    presetCards.forEach(card => {
        card.addEventListener('click', () => {
            sounds.playClick();
            presetCards.forEach(c => c.style.borderColor = 'var(--color-border)');
            card.style.borderColor = 'var(--color-accent-purple)';

            const key = card.getAttribute('data-preset');
            loadedPreset = key;

            // Simular carga de imagen preset
            previewContainer.classList.remove('hidden');
            if (key === 'equation') {
                previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="monospace" font-size="28">3x - 5 = 10</text></svg>';
            } else if (key === 'pythagoras') {
                previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="100%" height="100%" fill="%231e293b"/><polygon points="80,120 220,120 80,40" fill="none" stroke="white" stroke-width="4"/><text x="140" y="140" fill="white" font-size="16">b = 8</text><text x="40" y="90" fill="white" font-size="16">a = 6</text><text x="160" y="70" fill="white" font-size="16">c = ?</text></svg>';
            } else if (key === 'fractions') {
                previewImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="100%" height="100%" fill="%231e293b"/><circle cx="150" cy="75" r="45" fill="none" stroke="white" stroke-width="4"/><path d="M150,75 L150,30 A45,45 0 0,1 189,98 Z" fill="%23f43f5e"/><text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="16">¿Qué fracción representa?</text></svg>';
            }
            outputCard.classList.add('hidden');
        });
    });

    function loadCustomPhoto(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.classList.remove('hidden');
            previewImg.src = e.target.result;
            loadedPreset = 'custom';
            outputCard.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    // Ejecutar Escaneo
    btnRun?.addEventListener('click', () => {
        if (!loadedPreset && previewImg.src === '') {
            sounds.playWrong();
            alert("📸 Por favor, carga una foto o selecciona uno de los presets primero.");
            return;
        }

        sounds.playClick();
        progressBar.classList.remove('hidden');
        progressFill.style.width = '0%';
        statusText.textContent = "Iniciando Mateo AI Scanner...";

        let percent = 0;
        const interval = setInterval(() => {
            percent += 10;
            progressFill.style.width = `${percent}%`;

            if (percent === 30) statusText.textContent = "Filtrando ruidos de la imagen...";
            if (percent === 60) statusText.textContent = "Aplicando reconocimiento óptico OCR...";
            if (percent === 80) statusText.textContent = "Mateo IA está deduciendo los conceptos clave...";

            if (percent >= 100) {
                clearInterval(interval);
                progressBar.classList.add('hidden');
                sounds.playCorrect();
                confetti.spawn(20);

                revealAIResults();
            }
        }, 200);
    });

    function revealAIResults() {
        outputCard.classList.remove('hidden');

        let text = "";
        let targetGame = "snake";
        let targetLvl = 2;

        if (loadedPreset === 'equation') {
            text = `<strong>Ecuación lineal detectada:</strong> <code>3x - 5 = 10</code><br><br>
            <strong>Explicación de Mateo:</strong> Para resolver, suma 5 a ambos lados (<code>3x = 15</code>), y divide entre 3. ¡El resultado es <strong>x = 5</strong>!<br><br>
            <strong>Reto recomendado:</strong> He generado un nivel de <strong>Ecuación-Snake (Álgebra)</strong> adaptado para practicar ecuaciones de despejes lineales.`;
            targetGame = "snake";
            targetLvl = 2;
        } 
        else if (loadedPreset === 'pythagoras') {
            text = `<strong>Triángulo Rectángulo detectado:</strong> Catetos de longitudes <code>6</code> y <code>8</code>.<br><br>
            <strong>Explicación de Mateo:</strong> Aplicando el teorema de Pitágoras (<code>c² = a² + b²</code>), sumamos <code>36 + 64 = 100</code>. La raíz es <strong>c = 10</strong>.<br><br>
            <strong>Reto recomendado:</strong> He preparado una partida personalizada en el juego <strong>Barricada Cartesiana (Geometría)</strong> resolviendo teoremas de Pitágoras.`;
            targetGame = "barricade";
            targetLvl = 3;
        } 
        else if (loadedPreset === 'fractions' || loadedPreset === 'custom') {
            text = `<strong>Fracción visual detectada:</strong> Sector de <code>2/3</code> o proporción equivalente.<br><br>
            <strong>Explicación de Mateo:</strong> Para hallar una fracción equivalente, multiplica numerador y denominador por el mismo número (ej: <code>2/3 = 4/6 = 6/9</code>).<br><br>
            <strong>Reto recomendado:</strong> Jugarás una arena personalizada en <strong>Slither-Fracciones (Aritmética)</strong> devorando globos equivalentes a <code>2/3</code>.`;
            targetGame = "slider";
            targetLvl = 2;
        }

        outputText.innerHTML = text;

        btnPlayCustom.onclick = () => {
            sounds.playClick();
            launchGame(targetGame, targetLvl);
        };
    }
}

window.addEventListener('DOMContentLoaded', initApp);
window.registerGameHintCallback = registerGameHintCallback;
window.sounds = sounds;
window.confetti = confetti;
window.mathGen = mathGen;
window.state = state;
window.addStars = addStars;
window.addCoins = addCoins;
window.addXP = addXP;
window.unlockLevel = unlockLevel;
window.changeScreen = changeScreen;
window.openMateoModal = openMateoModal;
