

BOSSES = [
    # пример: reward_coins + reward_resources
    {"code": 1,  "name": "Леший",            "hp": 250, "evasion": 0.05, "regen_pct": 0.02, "regen_interval": 5.0, "reward_coins": 15, "reward_resources": {"wood": 2, "ore": {"qty": 1, "chance": 0.15}}},
    {"code": 2,  "name": "Волк-альфа",       "hp": 350, "evasion": 0.05, "regen_pct": 0.03, "regen_interval": 5.0, "reward_coins": 20,  "reward_resources": {"wood": 3, "ore": {"qty": 2, "chance": 0.1}}},
    {"code": 3,  "name": "Древень",          "hp": 500, "evasion": 0.05, "regen_pct": 0.04, "regen_interval": 5.0, "reward_coins": 25,  "reward_resources": {"wood": 4, "ore": {"qty": 3, "chance": 0.1}}},
    {"code": 4,  "name": "Шаман леса",       "hp": 700, "evasion": 0.05, "regen_pct": 0.05, "regen_interval": 5.0, "reward_coins": 30,  "reward_resources": {"wood": 6, "ore": {"qty": 4, "chance": 0.1}}},
    {"code": 5,  "name": "Страж рощи",       "hp": 3500, "evasion": 0.1, "regen_pct": 0.05, "regen_interval": 5.0, "reward_coins": 100,  "reward_resources": {"wood": 20, "ore": {"qty": 5, "chance": 0.1}}},

    {"code": 6,  "name": "Костяной рыцарь",  "hp": 1000, "evasion": 0.05, "regen_pct": 0.02, "regen_interval": 5.0, "reward_coins": 45,  "reward_resources": {"ore": {"qty": 2, "chance": 0.75}, "wood": 1, "crystal": {"qty": 1, "chance": 0.02}}},
    {"code": 7,  "name": "Пожиратель",       "hp": 1200, "evasion": 0.05, "regen_pct": 0.03, "regen_interval": 5.0, "reward_coins": 60, "reward_resources": {"ore": {"qty": 3, "chance": 0.75}, "wood": 1, "crystal": {"qty": 1, "chance": 0.02}}},
    {"code": 8,  "name": "Владыка ямы",      "hp": 1400, "evasion": 0.05, "regen_pct": 0.04, "regen_interval": 5.0, "reward_coins": 75, "reward_resources": {"ore": {"qty": 4, "chance": 0.75}, "wood": 2, "crystal": {"qty": 1, "chance": 0.02}}},
    {"code": 9,  "name": "Владыка ямы 2",    "hp": 1600, "evasion": 0.05, "regen_pct": 0.05, "regen_interval": 5.0, "reward_coins": 90, "reward_resources": {"ore": {"qty": 6, "chance": 0.75}, "wood": 3, "crystal": {"qty": 1, "chance": 0.02}}},
    {"code": 10, "name": "Король подземья",  "hp": 8000, "evasion": 0.1, "regen_pct": 0.06, "regen_interval": 5.0, "reward_coins": 300, "reward_resources": {"ore": {"qty": 30, "chance": 0.25}, "wood": {"qty": 15, "chance": 0.5}, "crystal": {"qty": 2, "chance": 0.1}}},
    

    {"code": 11,  "name": "Костяной рыцарь 1",  "hp": 2400, "evasion": 0.05, "regen_pct": 0.03, "regen_interval": 5.0, "reward_coins": 125, "reward_resources": {"ore": {"qty": 5, "chance": 0.25}, "wood": {"qty": 10, "chance": 0.5}, "crystal": {"qty": 2, "chance": 0.05}}},
    {"code": 12,  "name": "Пожиратель 1",       "hp": 2700, "evasion": 0.05, "regen_pct": 0.04, "regen_interval": 5.0, "reward_coins": 150, "reward_resources": {"ore": {"qty": 7, "chance": 0.25}, "wood": {"qty": 12, "chance": 0.5}, "crystal": {"qty": 2, "chance": 0.05}}},
    {"code": 13,  "name": "Владыка ямы 1",      "hp": 3000, "evasion": 0.05, "regen_pct": 0.05, "regen_interval": 5.0, "reward_coins": 175, "reward_resources": {"ore": {"qty": 9, "chance": 0.25}, "wood": {"qty": 14, "chance": 0.5}, "crystal": {"qty": 2, "chance": 0.05}}},
    {"code": 14,  "name": "Голем 1",            "hp": 3300, "evasion": 0.05, "regen_pct": 0.06, "regen_interval": 5.0, "reward_coins": 200, "reward_resources": {"ore": {"qty": 11, "chance": 0.25}, "wood": {"qty": 16, "chance": 0.5}, "crystal": {"qty": 2, "chance": 0.05}}},
    {"code": 15,  "name": "Король подземья 1",  "hp": 17500, "evasion": 0.1, "regen_pct": 0.07, "regen_interval": 5.0, "reward_coins": 600, "reward_resources": {"ore": {"qty": 30, "chance": 0.25}, "wood": {"qty": 15, "chance": 0.5}, "crystal": {"qty": 4, "chance": 0.2}}},
]

def has_boss(lvl: int) -> bool:
    return 1 <= lvl <= len(BOSSES)

def get_boss_config(lvl: int):
    lvl = int(lvl)
    if not has_boss(lvl):
        return None
    return BOSSES[lvl - 1]