from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from game.logic import (
    handle_craft,
    collect_loot,
    upgrade_forge,
    equip_weapon,
    dismantle_weapon,
    use_core_strike,
    set_boss,
    use_heavy_blow,
)
from game.storage import load_state, save_state

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_index():
    return FileResponse("index.html")


@app.post("/init")
def api_init(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    name = str(payload.get("name") or "Игрок")
    
    state = load_state(user_id, name=name)
    return {"state": state}


@app.post("/collect_loot")
def api_collect_loot(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])

    state = load_state(user_id)
    event = collect_loot(state)
    save_state(user_id, state)

    return {"state": state, "event": event}


@app.post("/craft")
def api_craft(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    recipe_id = str(payload.get("recipe_id") or "default")

    state = load_state(user_id)
    event = handle_craft(state, recipe_id)
    save_state(user_id, state)

    return {"state": state, "event": event}


@app.post("/forge_upgrade")
def api_forge_upgrade(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])

    state = load_state(user_id)
    event = upgrade_forge(state)
    save_state(user_id, state)

    return {"state": state, "event": event}


@app.post("/equip_weapon")
def api_equip_weapon(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    weapon_id = str(payload.get("weapon_id") or "")

    state = load_state(user_id)
    event = equip_weapon(state, weapon_id)
    save_state(user_id, state)

    return {"state": state, "event": event}


@app.post("/dismantle_weapon")
def api_dismantle_weapon(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    weapon_id = str(payload.get("weapon_id") or "")

    state = load_state(user_id)
    event = dismantle_weapon(state, weapon_id)
    save_state(user_id, state)

    return {"state": state, "event": event}

# Базовый скил
@app.post("/use_skill")
def api_use_skill(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    skill_id = str(payload.get("skill_id") or "").strip()

    state = load_state(user_id)

    if skill_id == "core_strike":
        event = use_core_strike(state)

    elif skill_id == "heavy_blow":
        event = use_heavy_blow(state)

    else:
        # важно: всегда возвращаем state, чтобы фронт не ломался
        return {"state": state, "event": {"ok": False, "error": "unknown_skill", "skill_id": skill_id}}
    save_state(user_id, state)

    return {"state": state, "event": event}



@app.post("/set_boss")
def api_set_boss(payload: Dict[str, Any]):
    user_id = int(payload["user_id"])
    boss_lvl = int(payload["boss_lvl"])

    state = load_state(user_id)
    event = set_boss(state, boss_lvl)
    save_state(user_id, state)

    return {"state": state, "event": event}
