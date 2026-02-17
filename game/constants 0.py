# ---------- Редкости оружия ----------
RARITIES = [
    "common",
    "uncommon",
    "rare",
    "epic",
    "legendary",
]

RARITY_MULTIPLIER = {
    "common": 1.0,
    "uncommon": 1.2,
    "rare": 1.4,
    "epic": 1.6,
    "legendary": 2,
}

RARITY_CHANCE = {
    "common": 0.60,      # 60%
    "uncommon": 0.20,    # 20%
    "rare": 0.12,        # 12%
    "epic": 0.07,       # 7%
    "legendary": 0.01,  # 1%
}

# Персонаж
PLAYER_LIFESTEAL_PCT = 0.01  # 1% от нанесенного урона

# ---------- Базовые параметры ----------
BASE_WEAPON_ATTACK = 10.0
WEAPON_ATTACK_GROWTH = 1.25   # рост атаки за уровень оружия

# ---------- Кузница ----------
FORGE_XP_PER_CRAFT = 10
FORGE_XP_GROWTH = 50          # множитель для XP апа кузницы
FORGE_XP_LEVEL_GROWTH = 1.20 #rost po mere lvl

# ---------- Стоимость крафта ----------
CRAFT_COST_GROWTH = 1.1  # +10% к цене за каждый lvl кузницы


# ---------- Боссы ----------
BOSS_HP_GROWTH = 1.35
BOSS_REWARD_GROWTH = 1.30

COINS_DROP_CHANCE = 0.99
RESOURCE_DROP_CHANCE = 0.99


# ---------- Core skill ----------
CORE_STRIKE_ID = "core_strike"
CORE_STRIKE_CD = 1.2

# ---------- Heavy Blow ----------
HEAVY_BLOW_CD = 20.0        # Секунды
HEAVY_BLOW_DMG_MIN = 5.0    # 500%
HEAVY_BLOW_DMG_MAX = 15.0   # 1500%

# ---------- Player XP / Level ----------
PLAYER_XP_PER_BOSS_BASE = 20
PLAYER_XP_PER_BOSS_GROWTH = 1.18

PLAYER_XP_BASE = 50
PLAYER_XP_LEVEL_GROWTH = 1.25
PLAYER_HP_PER_LEVEL = 10


# ---------- Coins - Craft ----------
CRAFT_COINS_BASE = 10          # базовая цена крафта на forge_lvl=1
CRAFT_COINS_GROWTH = 1.35      # рост цены за уровень кузни (монеты)




# ---------- Weapon crit ----------
CRIT_BY_RARITY = {
    "rare": {
        "chance": 0.02,   # 10%
        "mult": 2.0,      # 150% урона
    },
    "epic": {
        "chance": 0.05,   # 18%
        "mult": 2.5,
    },
    "legendary": {
        "chance": 0.10,   # 25%
        "mult": 3.0,
    },
}


# ---------- Weapon modifiers (1 of 10): Bleeding Edge ----------
WEAPON_MODIFIER_IDS = [
    "bleeding_edge",
    # дальше добавим остальные 9
]

# параметры bleed зависят от rarity оружия
BLEEDING_EDGE_BY_RARITY = {
    "common":    {"chance": 0.10, "dps_pct": 0.03, "duration": 4.0, "max_stacks": 1},
    "uncommon":  {"chance": 0.12, "dps_pct": 0.04, "duration": 4.0, "max_stacks": 1},
    "rare":      {"chance": 0.15, "dps_pct": 0.06, "duration": 5.0, "max_stacks": 2},
    "epic":      {"chance": 0.18, "dps_pct": 0.08, "duration": 5.0, "max_stacks": 3},
    "legendary": {"chance": 0.22, "dps_pct": 0.10, "duration": 6.0, "max_stacks": 4},
}