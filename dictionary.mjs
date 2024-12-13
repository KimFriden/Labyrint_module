export const MESSAGES = {
    COMBAT: {
        PLAYER_DAMAGE: (damage) => `Player dealt ${damage} points of damage`,
        ENEMY_DIED: "and the enemy died",
        ENEMY_DAMAGE: (damage) => `Enemy deals ${damage} back`,
    },
    GAME_SYMBOLS: {
        GS_HEART_FULL: `♥`,
        GS_HEART_EMPTY: `♡`
    },
    LOOT: {
        CASH_GAINED: (amount) => `Player gained ${amount}$`,
        ITEM_FOUND: (item) => `Player found a ${item.name}, ${item.attribute} is changed by ${item.value}`,
    },
    HEALING: {
        HEALTH_GAINED: (amount) => `Player healed for ${amount} HP!`,
    },
    ITEMS: {
        DAGGER_FOUND: (bonus) => `Found a dagger! Attack increased by ${bonus}!`,
        POISON_DAMAGE: (damage) => `Ouch! Poison deals ${damage} damage!`
    },
    SCREENS: {
        SPLASH: `
    ╔══════════════════════════════════╗
    ║         LABYRINTH GAME           ║
    ║                                  ║
    ║    Press any button to start..   ║
    ║                                  ║
    ║    Controls:                     ║
    ║    Arrow Keys - Move             ║
    ║    ESC        - Exit             ║
    ╚══════════════════════════════════╝`,
        GAME_OVER: (cash) => `
    ╔══════════════════════════════════╗
    ║           GAME OVER              ║
    ║                                  ║
    ║      Final Score: $${cash}          ║
    ║                                  ║
    ║      Thanks for playing!         ║
    ╚══════════════════════════════════╝`
    }
};
