# storage.py
import json
import os
from typing import Dict
from .state import PlayerState, create_state
from .logic import forge_xp_needed, get_craft_cost_preview
from .upgrades import BOSSES

SAVE_FILE = "players.json"


def _load_all() -> Dict[str, PlayerState]:
    """
    Внутренняя функция: грузим весь словарь игрок -> state из JSON.
    Ключи храним как строки (для JSON).
    """
    if not os.path.exists(SAVE_FILE):
        return {}

    with open(SAVE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        # json.load вернёт dict[str, dict]
        return data


def _save_all(data: Dict[str, PlayerState]) -> None:
    """
    Внутренняя функция: сохраняем весь словарь обратно в JSON.
    """
    with open(SAVE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_state(user_id: int, name: str | None = None) -> PlayerState:
    """
    Загружает состояние по user_id.
    Если нет сохранения — создаёт новое состояние через create_state.
    """
    all_data = _load_all()
    key = str(user_id)

    if key in all_data:
        state = all_data[key]

        # --- backfill для старых сейвов ---
        if "boss_unlocked_max" not in state:
            state["boss_unlocked_max"] = int(state.get("boss_lvl", 1))

        state["boss_unlocked_max"] = max(1, min(int(state["boss_unlocked_max"]), len(BOSSES)))

        state["forge_xp_need"] = int(forge_xp_needed(state.get("forge_lvl", 1)))
        state["craft_cost_preview"] = get_craft_cost_preview(state)

        return state

    # если игрок новый — создаём
    if name is None:
        name = "Игрок"

    state = create_state(name)
    state["boss_unlocked_max"] = max(1, min(int(state.get("boss_unlocked_max", 1)), len(BOSSES)))
    # derived поле: сколько XP нужно для апа кузницы
    state["forge_xp_need"] = int(forge_xp_needed(state.get("forge_lvl", 1)))
    state["craft_cost_preview"] = get_craft_cost_preview(state)
    all_data[key] = state
    _save_all(all_data)
    
    return state


def save_state(user_id: int, state: PlayerState) -> None:
    all_data = _load_all()
    key = str(user_id)

    # boss unlocked max (backfill + clamp)
    if "boss_unlocked_max" not in state:
        state["boss_unlocked_max"] = int(state.get("boss_lvl", 1))
    state["boss_unlocked_max"] = max(1, min(int(state["boss_unlocked_max"]), len(BOSSES)))

    # derived forge xp need
    state["forge_xp_need"] = int(forge_xp_needed(state.get("forge_lvl", 1)))
    state["craft_cost_preview"] = get_craft_cost_preview(state)

    all_data[key] = state
    _save_all(all_data)