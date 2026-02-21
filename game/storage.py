# storage.py (SQLite, без миграции)
import json
import os
import sqlite3
from typing import Optional

from .state import PlayerState, create_state
from .logic import forge_xp_needed, get_craft_cost_preview
from .upgrades import BOSSES


# Render Disk: монтируется в /data
# Локально тоже ок — файл создастся рядом, если /data недоступен
DB_PATH = os.environ.get("DB_PATH", "/data/players.db")


def _conn() -> sqlite3.Connection:
    # отдельное соединение на вызов — нормально для FastAPI
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    # если директории нет — создаём (на Render /data будет уже)
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    with _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS players (
                user_id TEXT PRIMARY KEY,
                state_json TEXT NOT NULL
            )
            """
        )
        conn.commit()


_init_db()


def _apply_backfill_and_derived(state: PlayerState) -> PlayerState:
    # boss unlocked max (backfill + clamp)
    if "boss_unlocked_max" not in state:
        state["boss_unlocked_max"] = int(state.get("boss_lvl", 1))
    state["boss_unlocked_max"] = max(1, min(int(state["boss_unlocked_max"]), len(BOSSES)))

    # trophies backfill
    if "trophies" not in state:
        state["trophies"] = []
    if "trophy_attack_bonus" not in state:
        state["trophy_attack_bonus"] = 0

    if "player_energy" not in state:
        state["player_energy"] = 100

    if "player_energy_max" not in state:
        state["player_energy_max"] = 100

    if "player_energy_regen" not in state:
        state["player_energy_regen"] = 5
    
        # adrenaline buff backfill
    if "adrenaline_until" not in state:
        state["adrenaline_until"] = 0.0

    # derived поля
    state["forge_xp_need"] = int(forge_xp_needed(state.get("forge_lvl", 1)))
    state["craft_cost_preview"] = get_craft_cost_preview(state)

    return state


def load_state(user_id: int, name: Optional[str] = None) -> PlayerState:
    user_id = int(user_id)
    key = str(user_id)

    with _conn() as conn:
        row = conn.execute(
            "SELECT state_json FROM players WHERE user_id = ?",
            (key,),
        ).fetchone()

        # есть сохранение
        if row is not None:
            state = json.loads(row["state_json"])
            return _apply_backfill_and_derived(state)

        # игрок новый — создаём
        if name is None:
            name = "Игрок"

        state = create_state(name)
        state = _apply_backfill_and_derived(state)

        conn.execute(
            "INSERT INTO players(user_id, state_json) VALUES(?, ?)",
            (key, json.dumps(state, ensure_ascii=False)),
        )
        conn.commit()

        return state


def save_state(user_id: int, state: PlayerState) -> None:
    user_id = int(user_id)
    key = str(user_id)

    state = _apply_backfill_and_derived(state)

    with _conn() as conn:
        # UPSERT (работает в SQLite >= 3.24, на Render обычно ок)
        conn.execute(
            """
            INSERT INTO players(user_id, state_json)
            VALUES(?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                state_json = excluded.state_json
            """,
            (key, json.dumps(state, ensure_ascii=False)),
        )
        conn.commit()
