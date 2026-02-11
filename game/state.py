# ---------- Чертёж состояния игрока ----------
from typing import TypedDict, List, Dict, Any
from .upgrades import BOSSES
class PlayerState(TypedDict):
    name: str
    coins: int
    weapon_lvl: int # weapon - оружие
    weapon_rarity: str  # "common", "uncommon", ...
    weapon_roll: float
    attack: float
    forge_lvl: int #forge - кузница
    forge_xp: int
    trophies_attack: float  # трофеи в %
    boss_lvl: int
    boss_hp: int
    boss_max_hp: int
    resources: dict[str, int]
    craft_cost_preview: dict
    boss_dead: bool
    pending_loot: dict  # {"coins": int, "resources": {"wood": int, ...}}
    inventory: list[dict]
    equipped_weapon: dict | None
    boss_unlocked_max: int



# ---------- Логика игры (мозг) ----------

def create_state(name: str) -> PlayerState:
    first_boss = BOSSES[0]
    return {
        "name": name,
        "coins": 0,

        # ---- player stats ----
        "player_lvl": 1,
        "player_xp": 0,

        "hp_max": 100,
        "hp": 100,

        "player_evasion": 0.05,  # 5%

        # оружие
        "weapon_lvl": 1,
        "weapon_rarity": "common",
        "weapon_roll": 1.0,
        "attack": 10.0,

        # кузница
        "forge_lvl": 1,
        "forge_xp": 0,

        # трофеи
        "trophies_attack": 0.0,

        # босс
        "boss_lvl": 1,                     # индекс в BOSSES
        "boss_unlocked_max": 1,
        "boss_hp": first_boss["hp"],       # ТЕКУЩЕЕ HP
        "boss_max_hp": first_boss["hp"],   # МАКС HP
        "boss_last_regen_ts": 0.0,         # Таймер регенерации
    

        # ресурсы
        "resources": {
            "wood": 0,
            "ore": 0,
            "crystal": 0,
        },

        "boss_dead": False,
        "pending_loot": {"coins": 0, "resources": {}},
        "inventory": [],
        "equipped_weapon": None,
        
        "craft_cost_preview": {"coins": 0, "resources": {}},

        # скилы
        "skills": {
            "core_strike": {
                "lvl": 1,
                "stacks": 0,
                "last_use_ts": 0.0,
            }
        },
        "skill_cd_until": {
            "core_strike": 0.0
        },
        
    }

#Фронт всегда может смотреть на boss_lvl, boss_hp, boss_max_hp и отрисовывать полоску хп