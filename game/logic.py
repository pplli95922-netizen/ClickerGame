import random
import time
from typing import Dict, Any

from .state import PlayerState
from .constants import (
    RARITIES,
    RARITY_CHANCE,
    RARITY_MULTIPLIER,
    BASE_WEAPON_ATTACK,
    WEAPON_ATTACK_GROWTH,
    COINS_DROP_CHANCE,
    RESOURCE_DROP_CHANCE,
    FORGE_XP_GROWTH,
    FORGE_XP_PER_CRAFT,
    FORGE_XP_LEVEL_GROWTH,
    CRAFT_COST_GROWTH,
    CORE_STRIKE_ID,
    CORE_STRIKE_CD,
    CORE_STRIKE_STACK_TIMEOUT,
    CORE_STRIKE_STACK_BONUS,
    CORE_STRIKE_MAX_STACKS,
    CRIT_BY_RARITY,
    PLAYER_LIFESTEAL_PCT,
    PLAYER_XP_PER_BOSS_BASE,
    PLAYER_XP_PER_BOSS_GROWTH,
    PLAYER_XP_BASE,
    PLAYER_XP_LEVEL_GROWTH,
    PLAYER_HP_PER_LEVEL,
    HEAVY_BLOW_CD,
    HEAVY_BLOW_DMG_MIN,
    HEAVY_BLOW_DMG_MAX,
    CRAFT_COINS_BASE,
    CRAFT_COINS_GROWTH,


)
from .upgrades import BOSSES, has_boss, get_boss_config


def roll_weapon_attack() -> float:
    return random.uniform(1, 1.25)


def craft_coins_cost(forge_lvl: int) -> int:
    lvl = max(1, int(forge_lvl))
    return int(CRAFT_COINS_BASE * (CRAFT_COINS_GROWTH ** (lvl - 1)))


def get_craft_cost_preview(state: PlayerState) -> dict:
    forge_lvl = int(state.get("forge_lvl", 1))

    # монеты
    coins_base = 10
    coins_cost = scale_cost(coins_base, forge_lvl)

    # ресурсы (твоя текущая логика)
    if forge_lvl >= 4:
        resources_cost = {"wood": 2, "ore": 2}
    else:
        resources_cost = {"wood": 1}

    return {"coins": int(coins_cost), "resources": dict(resources_cost)}


def roll_reward_resources(reward_resources: dict) -> dict:
    """
    Поддерживает оба формата:
    - старый: {"wood": 2, "ore": 1}
    - новый: {"ore": {"qty": 2, "chance": 0.1}}
    Возвращает итоговые ресурсы к начислению.
    """
    out = {}
    for name, spec in (reward_resources or {}).items():
        # старый формат
        if isinstance(spec, (int, float)):
            qty = int(spec)
            if qty > 0:
                out[name] = out.get(name, 0) + qty
            continue

        # новый формат
        if isinstance(spec, dict):
            qty = int(spec.get("qty", 0) or 0)
            chance = float(spec.get("chance", 1.0) or 0.0)
            if qty <= 0:
                continue
            if chance >= 1.0:
                out[name] = out.get(name, 0) + qty
            elif chance > 0.0:
                if random.random() < chance:
                    out[name] = out.get(name, 0) + qty
            continue

    return out


def check_chance(probability_0_to_1: float) -> bool:
    """
    probability_0_to_1: шанс от 0 до 1.
    Пример: 0.85 = 85% шанс
    """
    return random.random() < probability_0_to_1


def scale_cost(base: int, forge_lvl: int) -> int:
    lvl = max(1, int(forge_lvl))
    return int(int(base) * (CRAFT_COST_GROWTH ** (lvl - 1)))



def roll_with_spread(base_amount: int, spread: float = 0.35) -> int:
    """
    Возвращает base_amount с разбросом +/- spread.
    spread=0.35 => примерно 65..135% от base_amount
    """
    if base_amount <= 0:
        return 0

    factor = random.uniform(1.0 - spread, 1.0 + spread)
    result = int(base_amount * factor)

    if result < 0:
        result = 0

    return result


def calc_attack(state: PlayerState) -> int:
    # базовая атака от уровня оружия
    base = BASE_WEAPON_ATTACK * (WEAPON_ATTACK_GROWTH ** (state["weapon_lvl"] - 1))

    # множитель редкости
    rarity_mult = RARITY_MULTIPLIER[state["weapon_rarity"]]

    # трофеи (в %)
    trophy_mult = 1 + state["trophies_attack"] / 100.0

    # итог с разбросом (weapon_roll)
    attack = base * rarity_mult * trophy_mult * state["weapon_roll"]
    return int(attack)


def calc_weapon_item_attack(lvl: int, rarity: str, roll: float) -> int:
    """
    Атака конкретного оружия (для отображения в инвентаре/модалке).
    ВАЖНО: без trophies_attack, потому что это не “урон игрока в бою”, а стат предмета.
    """
    base = BASE_WEAPON_ATTACK * (WEAPON_ATTACK_GROWTH ** (max(1, int(lvl)) - 1))
    rarity_mult = RARITY_MULTIPLIER.get(str(rarity), 1.0)
    return int(base * rarity_mult * float(roll))




def forge_xp_needed(forge_lvl: int) -> int:
    lvl = max(1, int(forge_lvl))
    return int(FORGE_XP_GROWTH * (FORGE_XP_LEVEL_GROWTH ** (lvl - 1)))


def collect_loot(state: PlayerState) -> dict:
    return {"ok": False, "reason": "auto_loot_enabled"}



def handle_craft(state: PlayerState, recipe_id: str) -> dict:
    """
    Крафт предмета в кузнице.
    - списывает ресурсы и монеты
    - даёт ХР кузнице ВСЕГДА
    - при успехе: создаёт оружие и кладёт в инвентарь
    """

    # временный рецепт (позже вынесешь)
    forge_lvl = int(state.get("forge_lvl", 1))

    # базовая цена монет (как обычно — масштабируется)
    coins_cost = craft_coins_cost(forge_lvl)

    # ресурсы: с 4 lvl кузницы — 2 типа ресурсов (фиксированные количества)
    if forge_lvl >= 4:
        resources_cost = {"wood": 2, "ore": 2}
    else:
        resources_cost = {"wood": 1}

    success_chance = 0.8
    # --- проверки ---
    for res, qty in resources_cost.items():
        if state["resources"].get(res, 0) < qty:
            return {"ok": False, "reason": "not_enough_resources"}

    if state["coins"] < coins_cost:
        return {"ok": False, "reason": "not_enough_coins"}

    # --- списываем стоимость ---
    state["coins"] -= coins_cost
    for res, qty in resources_cost.items():
        
        state["resources"][res] -= qty

    # --- ХР кузнице даём всегда, но НЕ выше лимита текущего уровня ---
    xp_need = forge_xp_needed(int(state.get("forge_lvl", 1)))
    cur_xp = int(state.get("forge_xp", 0))

    if cur_xp < xp_need:
        add = min(int(FORGE_XP_PER_CRAFT), xp_need - cur_xp)
        state["forge_xp"] = cur_xp + add
    else:
        # уже набрано — не копим дальше
        state["forge_xp"] = xp_need

    # --- шанс успеха ---
    success = check_chance(success_chance)

    if not success:
        return {
            "ok": True,
            "success": False,
            "forge_xp": state["forge_xp"],
            "cost": {"coins": int(coins_cost), "resources": dict(resources_cost)},
        }

    # --- УСПЕХ: создаём оружие ---
    # уровень оружия: уровень кузницы или уровень-1
    if state["forge_lvl"] > 1 and check_chance(0.5):
        weapon_lvl = state["forge_lvl"] - 1
    else:
        weapon_lvl = state["forge_lvl"]

    rarity = roll_rarity()

    craft_event = craft_success_add_weapon(
        state=state,
        lvl=weapon_lvl,
        rarity=rarity,
        cost_coins=int(coins_cost),
        cost_resources=dict(resources_cost),
    )

    return {
        "ok": True,
        "success": True,
        "craft": craft_event,
        "forge_xp": state["forge_xp"],
        "cost": {"coins": int(coins_cost), "resources": dict(resources_cost)},
    }


def roll_weapon_level(forge_lvl: int) -> int:
    """
    Привязка forge_lvl -> weapon_lvl:
    - Если forge_lvl = 1: weapon_lvl всегда 1
    - Если forge_lvl >= 2: weapon_lvl = forge_lvl ИЛИ forge_lvl - 1

    Шанс получить "актуальный" уровень:
    - на forge_lvl=2: 60%
    - к forge_lvl=100: 90%
    """
    forge_lvl = max(1, forge_lvl)

    if forge_lvl == 1:
        return 1

    # 0.60 -> 0.90 плавно от 2 до 100
    p_current = 0.60 + (forge_lvl - 2) * (0.30 / 98)
    p_current = max(0.60, min(p_current, 0.90))

    if random.random() < p_current:
        return forge_lvl
    return forge_lvl - 1


def roll_rarity() -> str:
    roll = random.random()  # число 0.0..1.0
    cumulative = 0.0

    for rarity in RARITIES:
        cumulative += RARITY_CHANCE[rarity]
        if roll <= cumulative:
            return rarity

    # страховка на случай, если сумма шансов не ровно 1.0 из-за округления
    return "common"


def upgrade_forge(state: PlayerState) -> dict:
    """
    Улучшение кузницы:
    - проверяем, хватает ли forge_xp
    - проверяем, хватает ли coins
    - если всё ок → апаем forge_lvl и списываем coins
    """

    current_lvl = state["forge_lvl"]
    next_lvl = current_lvl + 1

    # сколько XP нужно для апа
    xp_needed = forge_xp_needed(current_lvl)

    # цена апа кузницы (простая и прозрачная формула)
    coins_cost = xp_needed * 2

    if state["forge_xp"] < xp_needed:
        return {
            "ok": False,
            "reason": "not_enough_forge_xp",
            "needed_xp": xp_needed,
            "current_xp": state["forge_xp"],
        }

    if state["coins"] < coins_cost:
        return {
            "ok": False,
            "reason": "not_enough_coins",
            "needed_coins": coins_cost,
            "current_coins": state["coins"],
        }

    # списываем монеты
    state["coins"] -= coins_cost
    # XP после апа всегда сбрасываем
    state["forge_xp"] = 0

    # апаем кузницу
    state["forge_lvl"] = next_lvl

    return {
    "ok": True,
    "forge_lvl": next_lvl,
    "forge_xp": state["forge_xp"],
    "xp_spent": xp_needed,
    "next_need": forge_xp_needed(next_lvl),
    "coins_spent": coins_cost,
}


def craft_success_add_weapon(
    state: PlayerState,
    lvl: int,
    rarity: str,
    cost_coins: int = 0,
    cost_resources: Dict[str, int] | None = None,
) -> Dict[str, Any]:

    """
    Создаёт оружие и добавляет в инвентарь.

    Требования к state:
    - state["inventory"] : list
    - state["equipped_weapon"] : dict (опционально, если хочешь авто-надевать)
    - roll оружия делаем с разбросом 0.75..1.25 (как ты хотел)
    """

    # 1) гарантируем, что inventory существует
    if "inventory" not in state or state["inventory"] is None:
        state["inventory"] = []

    # 2) генерируем roll атаки (разброс)
    roll = random.uniform(0.75, 1.25)

    # 3) делаем простой уникальный id (хватит для тестов)
    weapon_id = f"w{random.randint(100000, 999999)}"

    crit_data = CRIT_BY_RARITY.get(str(rarity), None)

    weapon = {
        "id": weapon_id,
        "lvl": int(lvl),
        "rarity": str(rarity),
        "roll": float(roll),
        "atk": calc_weapon_item_attack(lvl, rarity, roll),

        "crit_chance": float(crit_data["chance"]) if crit_data else 0.0,
        "crit_mult": float(crit_data["mult"]) if crit_data else 1.0,

        "cost": {
            "coins": int(cost_coins),
            "resources": dict(cost_resources or {}),
        },
    }


    # 4) кладём в инвентарь
    state["inventory"].append(weapon)

    # 5) (необязательно) если нет экипированного — надеваем первое
    if "equipped_weapon" not in state or state["equipped_weapon"] is None:
        state["equipped_weapon"] = weapon
        state["weapon_lvl"] = int(weapon["lvl"])
        state["weapon_rarity"] = str(weapon["rarity"])
        state["weapon_roll"] = float(weapon["roll"])
        state["attack"] = float(calc_attack(state))


    return {
        "ok": True,
        "weapon": weapon,           # что именно выпало
        "inventory_size": len(state["inventory"]),
        "equipped": state.get("equipped_weapon"),
    }


def equip_weapon(state: PlayerState, weapon_id: str) -> dict:
    """
    Надевает оружие из инвентаря по id.
    Синхронизирует legacy-поля weapon_lvl/weapon_rarity/weapon_roll,
    пересчитывает attack через calc_attack().
    """
    inv = state.get("inventory") or []
    if not inv:
        return {"ok": False, "error": "inventory_empty"}

    # найти оружие
    weapon = None
    for w in inv:
        if str(w.get("id")) == str(weapon_id):
            weapon = w
            break

    if weapon is None:
        return {"ok": False, "error": "weapon_not_found", "weapon_id": weapon_id}
    if "atk" not in weapon:
        weapon["atk"] = calc_weapon_item_attack(
            weapon.get("lvl", 1),
            weapon.get("rarity", "common"),
            weapon.get("roll", 1.0),
    )


    # надеть
    state["equipped_weapon"] = weapon

    # синхронизируем поля, на которых сейчас держится calc_attack()
    state["weapon_lvl"] = int(weapon.get("lvl", state.get("weapon_lvl", 1)))
    state["weapon_rarity"] = str(weapon.get("rarity", state.get("weapon_rarity", "common")))
    state["weapon_roll"] = float(weapon.get("roll", state.get("weapon_roll", 1.0)))

    # пересчёт атаки
    state["attack"] = float(calc_attack(state))

    return {
        "ok": True,
        "equipped_weapon": state["equipped_weapon"],
        "attack": state["attack"],
    }


def dismantle_weapon(state: PlayerState, weapon_id: str) -> dict:
    """
    Разборка оружия из инвентаря.
    Возвращает 30% от cost (coins + resources). Возврат всегда int (округление вниз).
    """

    inv = state.get("inventory") or []
    if not inv:
        return {"ok": False, "error": "inventory_empty"}

    # нельзя разбирать экипированное (чтобы не ломать текущий урон/поля)
    eq = state.get("equipped_weapon")
    if eq and str(eq.get("id")) == str(weapon_id):
        return {"ok": False, "error": "cannot_dismantle_equipped"}

    # найти предмет
    idx = None
    weapon = None
    for i, w in enumerate(inv):
        if str(w.get("id")) == str(weapon_id):
            idx = i
            weapon = w
            break

    if weapon is None:
        return {"ok": False, "error": "weapon_not_found", "weapon_id": weapon_id}

    cost = weapon.get("cost") or {}
    cost_coins = int(cost.get("coins", 0))
    cost_res = cost.get("resources") or {}

    refund_rate = 0.30

    refund_coins = int(cost_coins * refund_rate)
    refund_resources: Dict[str, int] = {}

    for res_name, qty in cost_res.items():
        qty = int(qty)
        back = int(qty * refund_rate)
        if back > 0:
            refund_resources[str(res_name)] = back

    # начислить возврат
    state["coins"] = int(state.get("coins", 0)) + refund_coins

    if "resources" not in state or state["resources"] is None:
        state["resources"] = {}

    for res_name, qty in refund_resources.items():
        state["resources"][res_name] = int(state["resources"].get(res_name, 0)) + int(qty)

    # удалить предмет из инвентаря
    inv.pop(idx)

    return {
        "ok": True,
        "weapon_id": weapon_id,
        "refund": {
            "coins": refund_coins,
            "resources": refund_resources,
        },
    }


def apply_boss_regen(state: PlayerState, now: float) -> int:
    cfg = get_boss_config(int(state.get("boss_lvl", 1)))
    if not cfg:
        return 0

    regen_pct = float(cfg.get("regen_pct", 0.0) or 0.0)
    interval = float(cfg.get("regen_interval", 0.0) or 0.0)
    if regen_pct <= 0 or interval <= 0:
        return 0

    last = float(state.get("boss_last_regen_ts", 0.0) or 0.0)
    if now - last < interval:
        return 0

    max_hp = int(state.get("boss_max_hp", 0) or 0)
    cur_hp = int(state.get("boss_hp", 0) or 0)
    if max_hp <= 0 or cur_hp <= 0:
        state["boss_last_regen_ts"] = now
        return 0

    heal = int(max_hp * regen_pct)
    if heal <= 0:
        state["boss_last_regen_ts"] = now
        return 0

    new_hp = min(max_hp, cur_hp + heal)
    healed = new_hp - cur_hp
    state["boss_hp"] = new_hp
    state["boss_last_regen_ts"] = now
    return healed


def use_core_strike(state: PlayerState) -> dict:
    now = time.time()

    regen_heal = apply_boss_regen(state, now)
    skills = state.setdefault("skills", {})
    cds = state.setdefault("skill_cd_until", {})

    skill = skills.setdefault(CORE_STRIKE_ID, {
        "lvl": 1,
        "stacks": 0,
        "last_use_ts": 0.0,
    })

    cd_until = float(cds.get(CORE_STRIKE_ID, 0))
    if now < cd_until:
        return {
            "ok": False,
            "reason": "cooldown",
            "remain": round(cd_until - now, 2),
        }

    # сброс стаков по таймауту
    last_use = float(skill.get("last_use_ts", 0))
    if last_use > 0 and now - last_use > CORE_STRIKE_STACK_TIMEOUT:
        skill["stacks"] = 0

    # увеличиваем стаки
    stacks = min(int(skill.get("stacks", 0)) + 1, CORE_STRIKE_MAX_STACKS)
    skill["stacks"] = stacks

    # расчёт урона
    base_atk = float(state.get("attack", 0))
    dmg_mult = 1.0 + stacks * CORE_STRIKE_STACK_BONUS

    damage = int(base_atk * dmg_mult)

    # ----- крит -----
    eq = state.get("equipped_weapon") or {}
    crit_chance = float(eq.get("crit_chance", 0.0))
    crit_mult = float(eq.get("crit_mult", 1.0))

    is_crit = False
    if crit_chance > 0 and random.random() < crit_chance:
        damage = int(damage * crit_mult)
        is_crit = True

    # нанести урон боссу
    dodged = False
    damage_done = 0

    if state.get("boss_hp", 0) > 0:
        cfg = get_boss_config(int(state.get("boss_lvl", 1)))
        boss_evasion = float(cfg.get("evasion", 0.0) or 0.0) if cfg else 0.0

        if boss_evasion > 0 and random.random() < boss_evasion:
            dodged = True
            damage_done = 0
        else:
            damage_done = damage
            state["boss_hp"] = max(0, int(state["boss_hp"]) - damage_done)
    
    
    # --- смерть босса: сразу выдаём награду и респавним босса ---
    if state.get("boss_hp", 0) <= 0 and not state.get("boss_dead", False):
        state["boss_dead"] = True

        boss_lvl = int(state.get("boss_lvl", 1))
        cfg = get_boss_config(boss_lvl) or {}

        # 1) coins
        reward_coins = int(cfg.get("reward_coins", 0) or 0)
        state["coins"] = int(state.get("coins", 0)) + reward_coins

        # 2) resources
        reward_res = roll_reward_resources(cfg.get("reward_resources", {}) or {})
        if "resources" not in state or state["resources"] is None:
            state["resources"] = {}
        for res_name, qty in reward_res.items():
            qty = int(qty or 0)
            if qty > 0:
                state["resources"][res_name] = int(state["resources"].get(res_name, 0)) + qty

        # 3) XP по формуле (у тебя уже есть calc_boss_xp_reward + add_player_xp)
        xp_gain = calc_boss_xp_reward(boss_lvl)
        xp_event = add_player_xp(state, xp_gain)

        # 4) открыть следующего босса (автоматически при убийстве)
        cur = boss_lvl
        max_unlocked = int(state.get("boss_unlocked_max", 1))
        if cur == max_unlocked and has_boss(cur + 1):
            state["boss_unlocked_max"] = cur + 1

        # 5) очистить сундук (чтобы фронт не показывал кнопку)
        state["pending_loot"] = {"coins": 0, "resources": {}}

        # 6) респавн текущего босса (остаёмся на том же boss_lvl)
        hp = int(cfg.get("hp", 0) or 0)
        if hp > 0:
            state["boss_max_hp"] = hp
            state["boss_hp"] = hp
            state["boss_last_regen_ts"] = 0.0

        state["boss_dead"] = False

    # обновляем тайминги
    skill["last_use_ts"] = now
    cds[CORE_STRIKE_ID] = now + CORE_STRIKE_CD

    return {
    "ok": True,
    "skill": CORE_STRIKE_ID,
    "damage": int(damage_done),
    "stacks": stacks,
    "crit": is_crit,
    "dodged": dodged,

    "boss_hp": int(state.get("boss_hp", 0)),
    "boss_max_hp": int(state.get("boss_max_hp", 0)),
    "boss_regen": int(regen_heal),
}


# Уровень босса
def set_boss(state: PlayerState, boss_lvl: int) -> dict:
    boss_lvl = int(boss_lvl)
    unlocked = int(state.get("boss_unlocked_max", 1))

    if boss_lvl < 1 or boss_lvl > unlocked:
        return {"ok": False, "reason": "boss_locked", "unlocked_max": unlocked}

    cfg = get_boss_config(boss_lvl)
    if not cfg:
        return {"ok": False, "reason": "boss_not_found"}

    state["boss_lvl"] = boss_lvl
    state["boss_max_hp"] = int(cfg["hp"])
    state["boss_hp"] = int(cfg["hp"])
    state["boss_last_regen_ts"] = 0.0
    state["boss_dead"] = False

    return {"ok": True, "boss_lvl": boss_lvl}


def calc_boss_xp_reward(boss_lvl: int) -> int:
    lvl = max(1, int(boss_lvl))
    return int(PLAYER_XP_PER_BOSS_BASE * (PLAYER_XP_PER_BOSS_GROWTH ** (lvl - 1)))


def player_xp_needed(lvl: int) -> int:
    lvl = max(1, int(lvl))
    return int(PLAYER_XP_BASE * (PLAYER_XP_LEVEL_GROWTH ** (lvl - 1)))


def add_player_xp(state: PlayerState, xp_gain: int) -> dict:
    xp_gain = int(xp_gain or 0)
    if xp_gain <= 0:
        lvl_now = int(state.get("player_lvl", 1))
        return {
            "xp_gain": 0,
            "leveled_up": False,
            "levels_gained": 0,
            "lvl_before": lvl_now,
            "lvl_after": lvl_now,
            "xp_now": int(state.get("player_xp", 0)),
            "xp_need": int(player_xp_needed(lvl_now)),
        }

    state["player_xp"] = int(state.get("player_xp", 0)) + xp_gain

    lvl_before = int(state.get("player_lvl", 1))
    levels_gained = 0

    while True:
        lvl = int(state.get("player_lvl", 1))
        need = int(player_xp_needed(lvl))
        cur_xp = int(state.get("player_xp", 0))

        if cur_xp < need:
            break

        # level up
        state["player_xp"] = cur_xp - need
        state["player_lvl"] = lvl + 1
        levels_gained += 1

        # бонусы за уровень
        state["hp_max"] = int(state.get("hp_max", 100)) + int(PLAYER_HP_PER_LEVEL)
        state["hp"] = int(state.get("hp_max", 100))  # фулл хил при апе

    lvl_after = int(state.get("player_lvl", 1))
    return {
        "xp_gain": xp_gain,
        "leveled_up": levels_gained > 0,
        "levels_gained": levels_gained,
        "lvl_before": lvl_before,
        "lvl_after": lvl_after,
        "xp_now": int(state.get("player_xp", 0)),
        "xp_need": int(player_xp_needed(lvl_after)),
    }



def use_heavy_blow(state: PlayerState) -> dict:
    now = time.time()

    # --- CD ---
    cd_until = float(state.get("skill_cd_until", {}).get("heavy_blow", 0))
    if now < cd_until:
        return {"ok": False, "reason": "cooldown"}

    # --- если босс мёртв ---
    if state.get("boss_dead", False):
        return {"ok": False, "reason": "boss_dead"}

    boss_lvl = int(state.get("boss_lvl", 1))
    cfg = get_boss_config(boss_lvl) or {}

    # --- уклон босса ---
    boss_evasion = float(cfg.get("evasion", 0))
    if check_chance(boss_evasion):
        # промах
        state.setdefault("skill_cd_until", {})["heavy_blow"] = now + HEAVY_BLOW_CD
        return {
            "ok": True,
            "skill": "heavy_blow",
            "damage": 0,
            "dodged": True,
            "boss_hp": int(state.get("boss_hp", 0)),
        }

    # --- расчёт урона ---
    atk = int(state.get("attack", 1))
    dmg_mult = random.uniform(HEAVY_BLOW_DMG_MIN, HEAVY_BLOW_DMG_MAX)
    damage = int(atk * dmg_mult)

    # --- применяем урон ---
    state["boss_hp"] = max(0, int(state.get("boss_hp", 0)) - damage)

    # --- смерть босса: сразу выдаём награду и респавним босса ---
    if state.get("boss_hp", 0) <= 0 and not state.get("boss_dead", False):
        state["boss_dead"] = True

        boss_lvl = int(state.get("boss_lvl", 1))
        cfg = get_boss_config(boss_lvl) or {}

        # 1) coins
        reward_coins = int(cfg.get("reward_coins", 0) or 0)
        state["coins"] = int(state.get("coins", 0)) + reward_coins

        # 2) resources
        reward_res = roll_reward_resources(cfg.get("reward_resources", {}) or {})
        if "resources" not in state or state["resources"] is None:
            state["resources"] = {}
        for res_name, qty in reward_res.items():
            qty = int(qty or 0)
            if qty > 0:
                state["resources"][res_name] = int(state["resources"].get(res_name, 0)) + qty

        # 3) XP по формуле (у тебя уже есть calc_boss_xp_reward + add_player_xp)
        xp_gain = calc_boss_xp_reward(boss_lvl)
        xp_event = add_player_xp(state, xp_gain)

        # 4) открыть следующего босса (автоматически при убийстве)
        cur = boss_lvl
        max_unlocked = int(state.get("boss_unlocked_max", 1))
        if cur == max_unlocked and has_boss(cur + 1):
            state["boss_unlocked_max"] = cur + 1

        # 5) очистить сундук (чтобы фронт не показывал кнопку)
        state["pending_loot"] = {"coins": 0, "resources": {}}

        # 6) респавн текущего босса (остаёмся на том же boss_lvl)
        hp = int(cfg.get("hp", 0) or 0)
        if hp > 0:
            state["boss_max_hp"] = hp
            state["boss_hp"] = hp
            state["boss_last_regen_ts"] = 0.0

        state["boss_dead"] = False


    # --- ставим CD ---
    state.setdefault("skill_cd_until", {})["heavy_blow"] = now + HEAVY_BLOW_CD

    return {
        "ok": True,
        "skill": "heavy_blow",
        "damage": damage,
        "dodged": False,
        "boss_hp": int(state.get("boss_hp", 0)),
        "boss_max_hp": int(state.get("boss_max_hp", 0)),
    }
