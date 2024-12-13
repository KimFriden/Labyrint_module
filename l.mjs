import * as readlinePromises from "node:readline/promises";
import ANSI from "./ANSI.mjs";
import KeyBoardManager from "./keyboardManager.mjs";
import "./prototypes.mjs";
import { level1, level2 } from "./levels.mjs";
import { MESSAGES } from './dictionary.mjs';

const GAME_CONFIG = {
    FPS: 250,
    HP_MAX: 10,
    MAX_ATTACK: 2,
    LOOT_CHANCE: 0.95,
    EVENT_DURATION: 3000,
    HEALTH_PICKUP: 5
};

const SYMBOLS = {
    WALL: '█',
    EMPTY: ' ',
    HERO: 'H',
    LOOT: '$',
    ENEMY: 'B',
    DOOR: 'D',
    HEALTH: '♥',
    DAGGER: 'd',
    POISON: 'p'
};

const COLORS = {
    [SYMBOLS.WALL]: ANSI.COLOR.LIGHT_GRAY,
    [SYMBOLS.HERO]: ANSI.COLOR.RED,
    [SYMBOLS.LOOT]: ANSI.COLOR.YELLOW,
    [SYMBOLS.ENEMY]: ANSI.COLOR.GREEN,
    [SYMBOLS.DOOR]: ANSI.COLOR.BLUE,
    [SYMBOLS.HEALTH]: ANSI.COLOR.RED,
    [SYMBOLS.DAGGER]: ANSI.COLOR.YELLOW,
    [SYMBOLS.POISON]: ANSI.COLOR.RED
};

const ITEMS = {
    PICKUPS: [
        { name: "Sword", attribute: "attack", value: 5 },
        { name: "Spear", attribute: "attack", value: 3 },
    ]
};

let currentLevel = 1;
let gameLevel = parseLevel(level1);
let isDirty = true;
let playerPos = { row: null, col: null };
let playerStats = { hp: GAME_CONFIG.HP_MAX, cash: 0, attack: 1.1 };
let NPCs = [];
let eventText = "";
let eventTimer = null;

function parseLevel(rawLevel) {
    return rawLevel.split("\n").map(row => row.split(""));
}

function loadLevel(levelNum) {

    const levelData = levelNum === 1 ? level1 : level2;
    gameLevel = parseLevel(levelData);
    playerPos = { row: null, col: null };
    NPCs = [];
    currentLevel = levelNum;
    isDirty = true;
}

function initializeLevel() {
    for (let row = 0; row < gameLevel.length; row++) {

        for (let col = 0; col < gameLevel[row].length; col++) {

            const value = gameLevel[row][col];
            if (value === SYMBOLS.HERO) {

                playerPos.row = row;
                playerPos.col = col;

            } else if (value === SYMBOLS.ENEMY) {

                NPCs.push({
                    hp: Math.round(Math.random() * 6) + 4,
                    attack: 0.7 + Math.random(),
                    row,
                    col
                });
            }
        }
    }
}

function handleMovement() {
    const movement = {
        row: KeyBoardManager.isUpPressed() ? -1 : KeyBoardManager.isDownPressed() ? 1 : 0,
        col: KeyBoardManager.isLeftPressed() ? -1 : KeyBoardManager.isRightPressed() ? 1 : 0
    };

    const targetPos = {
        row: playerPos.row + movement.row,
        col: playerPos.col + movement.col
    };

    const targetSymbol = gameLevel[targetPos.row][targetPos.col];

    if (targetSymbol === SYMBOLS.EMPTY ||
        targetSymbol === SYMBOLS.LOOT ||
        targetSymbol === SYMBOLS.HEALTH ||
        targetSymbol === SYMBOLS.DAGGER ||
        targetSymbol === SYMBOLS.POISON) {
        handlePickup(targetSymbol, targetPos);
        movePlayer(targetPos);
    } else if (targetSymbol === SYMBOLS.ENEMY) {
        handleCombat(targetPos);
    } else if (targetSymbol === SYMBOLS.DOOR) {
        loadLevel(2);
    }
}


function handlePickup(item, pos) {
    if (item === SYMBOLS.LOOT) {
        if (Math.random() < GAME_CONFIG.LOOT_CHANCE) {
            const loot = Math.floor(Math.random() * 5) + 3; // Magiske tall!!! 
            playerStats.cash += loot;
            showEvent(MESSAGES.LOOT.CASH_GAINED(loot));
        } else {
            const item = ITEMS.PICKUPS[Math.floor(Math.random() * ITEMS.PICKUPS.length)];
            playerStats.attack += item.value;
            showEvent(MESSAGES.LOOT.ITEM_FOUND(item));
        }
    } else if (item === SYMBOLS.HEALTH) {
        const healAmount = 2;
        const oldHp = playerStats.hp;
        playerStats.hp = Math.min(GAME_CONFIG.HP_MAX, playerStats.hp + healAmount);
        const actualHeal = playerStats.hp - oldHp;
        showEvent(MESSAGES.HEALING.HEALTH_GAINED(actualHeal));
    } else if (item === SYMBOLS.DAGGER) {
        const attackBonus = Math.floor(Math.random() * 3) + 1;
        playerStats.attack += attackBonus;
        showEvent(MESSAGES.ITEMS.DAGGER_FOUND(attackBonus));
    } else if (item === SYMBOLS.POISON) {
        const poisonDamage = Math.floor(Math.random() * 5) + 2;
        playerStats.hp -= poisonDamage;
        showEvent(MESSAGES.ITEMS.POISON_DAMAGE(poisonDamage));

        if (playerStats.hp <= 0) {
            handlePlayerDeath();
        }
    }
}


function movePlayer(newPos) {
    gameLevel[playerPos.row][playerPos.col] = SYMBOLS.EMPTY;
    gameLevel[newPos.row][newPos.col] = SYMBOLS.HERO;
    playerPos.row = newPos.row;
    playerPos.col = newPos.col;
    isDirty = true;
}


function handleCombat(targetPos) {
    const enemy = NPCs.find(npc => npc.row === targetPos.row && npc.col === targetPos.col);
    if (!enemy) return;

    const playerDamage = ((Math.random() * GAME_CONFIG.MAX_ATTACK) * playerStats.attack).toFixed(2);
    enemy.hp -= playerDamage;

    let message = MESSAGES.COMBAT.PLAYER_DAMAGE(playerDamage);

    if (enemy.hp <= 0) {
        message += " " + MESSAGES.COMBAT.ENEMY_DIED;
        gameLevel[targetPos.row][targetPos.col] = SYMBOLS.EMPTY;
        NPCs = NPCs.filter(npc => npc !== enemy);
    } else {
        const enemyDamage = ((Math.random() * GAME_CONFIG.MAX_ATTACK) * enemy.attack).toFixed(2);
        playerStats.hp -= enemyDamage;
        message += "\n" + MESSAGES.COMBAT.ENEMY_DAMAGE(enemyDamage);
    }

    showEvent(message);
    isDirty = true;

    if (playerStats.hp <= 0) {
        handlePlayerDeath();
    }
}


function handlePlayerDeath() {
    isDirty = false;
    showGameOverScreen();
}


function showEvent(text) {

    eventText = text;
    if (eventTimer) clearTimeout(eventTimer);

    eventTimer = setTimeout(() => {
        eventText = "";
        isDirty = true;

    }, GAME_CONFIG.EVENT_DURATION);
}


function update() {
    if (playerPos.row === null) {
        initializeLevel();
    }
    handleMovement();
}


function renderHUD() {
    let heartCount = Math.max(1, Math.floor(playerStats.hp));
    if (playerStats.hp <= 0) heartCount = 0;

    const hearts = `${MESSAGES.GAME_SYMBOLS.GS_HEART_FULL}`.repeat(heartCount);
    const emptyHearts = `${MESSAGES.GAME_SYMBOLS.GS_HEART_EMPTY}`.repeat(GAME_CONFIG.HP_MAX - heartCount);

    const hpBar = `[${ANSI.COLOR.RED}${hearts}${ANSI.COLOR_RESET}${ANSI.COLOR.BLUE}${emptyHearts}${ANSI.COLOR_RESET}]`;
    const cash = `$:${playerStats.cash}`;
    return `${hpBar} ${cash}\n`;
}


function draw() {
    if (!isDirty) return;
    isDirty = false;

    console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
    let rendering = renderHUD();

    for (let row = 0; row < gameLevel.length; row++) {
        for (let col = 0; col < gameLevel[row].length; col++) {
            const symbol = gameLevel[row][col];
            const color = COLORS[symbol];
            rendering += color ? `${color}${symbol}${ANSI.COLOR_RESET}` : symbol;
        }
        rendering += "\n";
    }

    console.log(rendering);
    if (eventText) console.log(eventText);
}


function gameLoop() {
    update();
    draw();
}


function showGameOverScreen() {
    console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
    console.log(MESSAGES.SCREENS.GAME_OVER(playerStats.cash));

    return new Promise(resolve => {

        const handleKeyPress = (str, key) => {
            if (key.name === 'return' || key.name === 'escape') {

                process.stdin.removeListener('keypress', handleKeyPress);
                console.log(ANSI.CLEAR_SCREEN);
                process.exit();
            }
        };
        process.stdin.on('keypress', handleKeyPress);
    });
}


function showSplashScreen() {

    console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);
    console.log(MESSAGES.SCREENS.SPLASH);

    return new Promise(resolve => {
        const handleKeyPress = (str, key) => {

            process.stdin.removeListener('keypress', handleKeyPress);
            resolve();
        };

        process.stdin.on('keypress', handleKeyPress);
    });
}


async function initGame() {

    const rl = readlinePromises.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    await showSplashScreen();
    setInterval(gameLoop, GAME_CONFIG.FPS);
}


initGame();