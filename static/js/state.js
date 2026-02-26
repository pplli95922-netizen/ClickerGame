let USER_ID = 0;
let playerName = "Игрок";

const params = new URLSearchParams(window.location.search);
const uidParam = params.get("uid");
const nameParam = params.get("name");

if (uidParam) {
  USER_ID = parseInt(uidParam, 10);
}
if (nameParam) {
  // имя может прийти с пробелами/кириллицей – декодируем
  playerName = decodeURIComponent(nameParam);
}

if (!USER_ID) {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg && tg.initDataUnsafe) {
    const u = tg.initDataUnsafe.user || tg.initDataUnsafe.chat;
    if (u && u.id) {
      USER_ID = u.id;
      playerName = u.username || u.first_name || playerName;
    }
  }
}

if (!USER_ID) {
  USER_ID = 1;
}

let coins = 0;
let attack = 0;
let player_lvl = 1;
let player_xp = 0;
let player_xp_need = 100;

let hp = 100;
let hp_max = 100;

let mana = 50;
let mana_max = 50;
let boss_dead = false;
let boss_hp = 0;
let boss_max_hp = 0;
let boss_lvl = 0;
let boss_lvl_max_reached = 1;
let weapon_rarity = "common";
let weapon_lvl = 0;
let resources = {"wood": 0, "ore": 0};
let forge_xp = 0;
let forge_lvl = 1;
let weapon_roll = 0;
let pending_loot = null;
let boss_cleared = false;
let trophies_attack = 0;
let inventory = { items: [] };
let prevBossHp = null;
let equipped_weapon_id = null;
let pendingBreakItemId = null;
let pendingBreakArmed = false;
let forgeResultItem = null;
let forge_xp_need = 100;
let selectedWeaponId = null;
let pendingForgeItem = null;
let bossAttackInFlight = false;
let rewardText = "";
let forgeUpgradeInFlight = false;
let skill_cd = 0;
let skill4_cd = 0;
let craft_cost_preview = null;



const bossLvlDown  = document.getElementById("bossLvlDown");
const bossLvlUp    = document.getElementById("bossLvlUp");
const bossLvlInput = document.getElementById("bossLvlInput");
const bossLvlApply = document.getElementById("bossLvlApply");
const bossLvlHint  = document.getElementById("bossLvlHint");

const RARITY_STYLE = {
  common: "Elven",       // комон
  uncommon: "Necrotic",  // анкомон
  rare: "Glacial",       // рар
  epic: "Arcane",        // эпик
  legendary: "Celtic",   // лега
};

function hasRealLoot(loot) {
  if (loot == null) return false;

  // строка
  if (typeof loot === "string") return loot.trim().length > 0;

  // массив
  if (Array.isArray(loot)) return loot.length > 0;

  // объект
  if (typeof loot !== "object") return true;

  const coinsVal = Number(loot.coins ?? 0) || 0;

  // ресурсы могут быть вложенно или прямо в объекте
  const resObj = (loot.resources && typeof loot.resources === "object") ? loot.resources : loot;
  const anyRes = Object.entries(resObj).some(([k, v]) => {
    if (k === "coins" || k === "resources") return false;
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  });

  // предметы/дроп
  const itemsArr =
    loot.items ?? loot.drops ?? loot.drop ?? loot.loot ?? loot.weapons ?? loot.inventory_items;
  const anyItems = Array.isArray(itemsArr) && itemsArr.length > 0;

  return coinsVal > 0 || anyRes || anyItems;
}

function applyState(st) {
  if (!st || typeof st !== "object") return;

    // для автолута: запоминаем старые значения ДО обновления
  const __oldCoins = Number(coins) || 0;
  const __oldRes = (resources && typeof resources === "object") ? { ...resources } : {};


  // ===== базовое =====
  if (st.name !== undefined) playerName = st.name;

  if (st.coins !== undefined) coins = Number(st.coins) || 0;
  if (st.attack !== undefined) attack = Number(st.attack) || 0;

  // ===== HERO STATS FROM BACKEND =====
if (st.player_lvl !== undefined) player_lvl = Math.max(1, Number(st.player_lvl) || 1);
if (st.player_xp !== undefined) player_xp = Math.max(0, Number(st.player_xp) || 0);

// xp_need может прийти как player_xp_need (если добавите позже) — поддержим сразу
if (st.player_xp_need !== undefined) player_xp_need = Math.max(1, Number(st.player_xp_need) || 1);

// HP
if (st.hp_max !== undefined) hp_max = Math.max(1, Number(st.hp_max) || 1);
if (st.hp !== undefined) hp = Math.max(0, Number(st.hp) || 0);

// MANA (бек присылает player_energy / player_energy_max)
if (st.player_energy_max !== undefined) mana_max = Math.max(1, Number(st.player_energy_max) || 1);
if (st.player_energy !== undefined) mana = Math.max(0, Number(st.player_energy) || 0);

// чтобы ui.js всегда видел актуальные значения
window.mana = mana;
window.mana_max = mana_max;

  const hpRaw =
  st.boss_hp ?? st.mob_hp ?? st.enemy_hp ?? st.current_hp;

const maxRaw =
  st.boss_max_hp ?? st.mob_max_hp ?? st.enemy_max_hp ?? st.max_hp;


// обновляем только если ключ реально пришёл
if (hpRaw !== undefined) boss_hp = Number(hpRaw) || 0;
if (maxRaw !== undefined) boss_max_hp = Number(maxRaw) || 0;

window.boss_hp = boss_hp;
window.boss_max_hp = boss_max_hp;

// смерть тоже иногда приходит под другим ключом
const deadRaw =
  st.boss_dead ?? st.dead ?? st.is_dead ?? st.mob_dead;

if (deadRaw !== undefined) boss_dead = !!deadRaw;
// если dead не пришёл — определим по hp (как у вас уже частично сделано)
else if (hpRaw !== undefined) boss_dead = (Number(hpRaw) <= 0);

  // если сервер не прислал boss_dead — считаем по HP (иначе кнопка "Дальше" залипает)
  if (st.boss_dead === undefined && st.boss_hp !== undefined) {
  boss_dead = (Number(st.boss_hp) <= 0);
}

  // уровень босса: бэк мог прислать под другим ключом
const lvlRaw =
  st.boss_lvl ?? st.boss_level ?? st.level ?? st.lvl ?? st.stage ?? st.wave ?? st.current_lvl ?? st.current_level;

if (lvlRaw !== undefined) boss_lvl = Math.max(1, Number(lvlRaw) || 1);
window.boss_lvl = Math.max(1, Number(boss_lvl) || 1);
boss_lvl = window.boss_lvl;

// ===== adrenaline buff (нужно для уменьшения КД core_strike) =====
const adrUntilRaw =
  st.adrenaline_until ?? st.adr_until ?? st.adrenalineUntil;

if (adrUntilRaw !== undefined) {
  const v = Number(adrUntilRaw);
  if (Number.isFinite(v)) window.adrenaline_until = v; // секунды (как у бэка)
}

// ===== cooldowns from backend (skill_cd_until) =====
if (st.skill_cd_until && typeof st.skill_cd_until === "object") {
  const nowS = Date.now() / 1000;

  const map = {
    core_strike: "skill_cd",
    heavy_blow: "skill2_cd",
    guard_break: "skill3_cd",
    anti_regen: "skill3_cd",
    adrenaline: "skill4_cd",
  };

  for (const [id, field] of Object.entries(map)) {
    const until = Number(st.skill_cd_until[id]);
    if (!Number.isFinite(until)) continue;

    let left = Math.max(0, +(until - nowS).toFixed(2));

// ✅ адреналин режет КД core_strike на 50% пока активен
if (id === "core_strike") {
  const adrUntil = Number(window.adrenaline_until || 0);
  if (Number.isFinite(adrUntil) && adrUntil > nowS) {
    left = +Math.max(0, left * 0.5).toFixed(2);
  }
}

st[field] = left;
window[field] = left;
  }
}
  const cd =
  st.skill_cd ?? st.skill_cd_left ?? st.skillCooldown ?? st.skill_cooldown;

if (cd !== undefined) {
  skill_cd = Math.max(0, Number(cd) || 0);
  window.skill_cd = skill_cd; // ui.js может читать даже если st не прислали
}
const mx =
  st.boss_unlocked_max ??
  st.boss_lvl_max_reached ?? st.boss_level_max_reached ?? st.boss_lvl_max ??
  st.max_boss_lvl ?? st.boss_max_lvl ?? st.max_boss_level ??
  st.max_lvl ?? st.max_level ?? st.max_monster_lvl ?? st.max_monster_level;

if (mx !== undefined) boss_lvl_max_reached = Math.max(boss_lvl_max_reached, Math.max(1, Number(mx) || 1));

const srvMax =
  st.boss_unlocked_max ??
  st.boss_lvl_max_reached ?? st.boss_level_max_reached ?? st.boss_lvl_max ??
  st.max_boss_lvl ?? st.boss_max_lvl ?? st.max_boss_level ??
  st.max_lvl ?? st.max_level ?? st.max_monster_lvl ?? st.max_monster_level;

if (srvMax !== undefined) boss_lvl_max_reached = Math.max(boss_lvl_max_reached, Math.max(1, Number(srvMax) || 1));

// максимум не может быть ниже текущего
boss_lvl_max_reached = Math.max(boss_lvl_max_reached, window.boss_lvl);
window.boss_lvl_max_reached = boss_lvl_max_reached;
const diedNow = (st.boss_dead === true) || (st.boss_hp !== undefined && Number(st.boss_hp) <= 0);
if (diedNow) boss_cleared = true;
else if (hpRaw !== undefined && Number(hpRaw) > 0) boss_cleared = false;
window.boss_cleared = boss_cleared;



  if (st.boss_dead !== undefined) boss_dead = st.boss_dead;

  // ===== оружие/кузня =====
  if (st.weapon_lvl !== undefined) weapon_lvl = st.weapon_lvl;
  if (st.weapon_rarity !== undefined) weapon_rarity = st.weapon_rarity;
  if (st.weapon_roll !== undefined) weapon_roll = st.weapon_roll;

  if (st.forge_lvl !== undefined) forge_lvl = st.forge_lvl;
  if (st.forge_xp !== undefined) forge_xp = st.forge_xp;

  // ===== цена крафта (превью от бэка) =====
if (st.craft_cost_preview !== undefined) craft_cost_preview = st.craft_cost_preview;

  const newNeed = (st.forge_xp_need ?? st.forge_xp_to_next ?? st.forge_xp_max);
  if (newNeed !== undefined) forge_xp_need = Number(newNeed) || 100;

  // ===== ресурсы/инвентарь =====
  if (st.resources !== undefined) resources = st.resources;
  if (!resources || typeof resources !== "object") resources = {};
if (resources.wood === undefined) resources.wood = 0;
if (resources.ore  === undefined) resources.ore  = 0;

  if (st.pending_loot !== undefined) pending_loot = st.pending_loot;

// ✅ Нормализация pending_loot:
// - на босс-уровне держим маркер {} ТОЛЬКО когда босс реально умер
// - когда босс жив — pending_loot всегда null
const __lvl = Math.max(1, Number(boss_lvl) || 1);
const __isBossLvl = (__lvl % 5 === 0);
const __srvSentLootKey = (st.pending_loot !== undefined);

const __dead =
  (st.boss_dead === true) ||
  (st.dead === true) || (st.is_dead === true) || (st.mob_dead === true) ||
  (hpRaw !== undefined && Number(hpRaw) <= 0) ||
  (st.boss_hp !== undefined && Number(st.boss_hp) <= 0);

if (__isBossLvl) {
  if (__dead && __srvSentLootKey) {
    // босс умер: если лут пустой — оставляем маркер {}
    if (
      pending_loot == null || pending_loot === "" ||
      (typeof pending_loot === "object" && Object.keys(pending_loot).length === 0)
    ) {
      pending_loot = {};
    }
  } else {
    // босс жив: маркера быть не должно
    pending_loot = null;
  }
} else {
  // мобы: чистим пустышки
  if (pending_loot && typeof pending_loot === "object" && Object.keys(pending_loot).length === 0) pending_loot = null;
  if (pending_loot === "") pending_loot = null;
  if (!hasRealLoot(pending_loot)) pending_loot = null;
}



  if (st.inventory !== undefined) inventory = st.inventory;

  if (st.equipped_weapon_id !== undefined) equipped_weapon_id = st.equipped_weapon_id;

  // если сервер прислал equipped_weapon объектом
  if (st.equipped_weapon !== undefined) {
    equipped_weapon_id = st.equipped_weapon ? (st.equipped_weapon.id ?? null) : null;
  }

  // ===== вычисления для UI (без DOM) =====
  // 1) посчитать урон по боссу (если хочешь показывать цифры в UI)
  if (typeof prevBossHp !== "undefined") {
    const oldHp = (prevBossHp === null || prevBossHp === undefined) ? null : Number(prevBossHp);
    const curHp = Number(boss_hp);

    // сохраняем “последний урон” в глобал (если он у тебя есть)
    // UI сможет использовать window.lastBossDamage
    if (oldHp !== null && !Number.isNaN(oldHp) && !Number.isNaN(curHp) && curHp < oldHp) {
      window.lastBossDamage = oldHp - curHp;
    } else {
      window.lastBossDamage = 0;
    }

    // флаг “только что умер”
    window.bossJustDied = (oldHp !== null && oldHp > 0 && curHp <= 0);

    prevBossHp = curHp;
  }

    // ===== AUT0-LOOT FLOAT (только мобы, без окна) =====
  try {
    const lvl = Math.max(1, Number(boss_lvl) || 1);
    const isBossLevel = (lvl % 5 === 0);
    const justDied = (window.bossJustDied === true);

    if (justDied && !isBossLevel && (pending_loot == null)) {
      const parts = [];

      const dc = (Number(coins) || 0) - __oldCoins;
      if (dc > 0) parts.push(`💰 +${dc}`);

      const newRes = (resources && typeof resources === "object") ? resources : {};
      const keys = new Set([...Object.keys(__oldRes), ...Object.keys(newRes)]);

      for (const k of keys) {
        const dv = (Number(newRes[k]) || 0) - (Number(__oldRes[k]) || 0);
        if (dv <= 0) continue;

        if (k === "wood") parts.push(`🪵 +${dv}`);
else if (k === "ore") parts.push(`__ORE__ +${dv}`);
else parts.push(`${k}: +${dv}`);

      }

      if (parts.length && typeof window.showLootFloat === "function") {
        window.showLootFloat(parts);
      }
    }
  } catch(e) {
    console.log("[autoloot float] fail:", e);
  }



  // ===== ВАЖНО: UI-обновление в одном месте =====
  if (typeof syncUI === "function") syncUI(st);
}



function buildState() {
  return {
    // базовое
    name: playerName,

    // экономика/ресурсы
    coins: coins,
    resources: resources,

    // бой/босс
    attack: attack,
    player_lvl: player_lvl,
player_xp: player_xp,
player_xp_need: player_xp_need,
hp: hp,
hp_max: hp_max,
mana: mana,
mana_max: mana_max,
    boss_lvl: boss_lvl,

// ✅ то, что реально есть у бэка
boss_hp: boss_hp,
boss_max_hp: boss_max_hp,
boss_unlocked_max: boss_lvl_max_reached,

// ✅ оставляем старые ключи (на всякий)
boss_level_max_reached: boss_lvl_max_reached,
boss_lvl_max_reached: boss_lvl_max_reached,


    // оружие/кузница
    weapon_lvl: weapon_lvl,
    weapon_rarity: weapon_rarity,
    weapon_roll: weapon_roll,
    forge_xp: forge_xp,
    forge_lvl: forge_lvl,
    craft_cost_preview: craft_cost_preview,

    // лут/трофеи
    boss_dead: boss_dead,
    pending_loot: pending_loot,
    trophies_attack: trophies_attack,

    // инвентарь/экип (если сервер это хранит)
    inventory: inventory,
    equipped_weapon_id: equipped_weapon_id,
    skill_cd: (typeof window.skill_cd === "number" ? window.skill_cd : skill_cd),
skill2_cd: (typeof window.skill2_cd === "number" ? window.skill2_cd : undefined),
skill3_cd: (typeof window.skill3_cd === "number" ? window.skill3_cd : undefined),
skill4_cd: (typeof window.skill4_cd === "number" ? window.skill4_cd : undefined)

  };
}


function getItemAtk(it){
  if (!it) return 0;

  // 1) прямые поля
  const v =
    it.atk ?? it.attack ??
    it.weapon_atk ?? it.weapon_attack ??
    it.base_attack ?? it.dmg ?? it.power ??
    (it.stats ? (it.stats.base_atk ?? it.stats.atk ?? it.stats.attack ?? it.stats.dmg) : undefined);

  return Number(v) || 0;
}


function pickStateFromResponse(data){
  if (!data || typeof data !== "object") return null;

  // самый частый кейс: { state: {...} }
  if (data.state && typeof data.state === "object") {
    // кейс: { state: { state: {...} } }
    if (data.state.state && typeof data.state.state === "object") {
      return data.state.state;
    }
    return data.state;
  }

  // на крайний случай
  return data;
}

// ======================
// ======================
// Server tick (1s poll)
// ======================
let __serverTickTimer = null;
let __serverTickInFlight = false;

function startServerTick(){
  if (__serverTickTimer) return;
  __serverTickTimer = setInterval(serverTickOnce, 1000);
}

async function serverTickOnce(){
  if (__serverTickInFlight) return;
  if (document.hidden) return;
  if (window.__mobDeathAnimating) return;

  __serverTickInFlight = true;
  try {
    const res = await fetch("https://clickergame-0wae.onrender.com/tick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID) })
    });
    if (!res.ok) return;

    const data = await res.json();

    // tick возвращает { state, event }
    const st = pickStateFromResponse(data) || (data.state || data);
    if (st) applyState(st);

    // на всякий случай обновим HP бар сразу
    if (typeof updateBossHpBar === "function") updateBossHpBar();
  } catch (e) {
    // молча
  } finally {
    __serverTickInFlight = false;
  }
}

// ======================
let __hpSyncTimer = null;
let __hpSyncInFlight = false;

function startHpRegenSync(){
  if (__hpSyncTimer) return;
  __hpSyncTimer = setInterval(syncHpFromServer, 5000);
}

async function syncHpFromServer(){
  if (__hpSyncInFlight) return;
  if (document.hidden) return;
  if (window.__mobDeathAnimating) return; // не трогаем во время анимации смерти

  __hpSyncInFlight = true;
  try {
    const res = await fetch("https://clickergame-0wae.onrender.com/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID), name: playerName })
    });

    if (!res.ok) return;

    const data = await res.json();
    const st = pickStateFromResponse(data) || (data.state || data);
    if (!st || typeof st !== "object") return;

    const hpRaw  = st.boss_hp ?? st.mob_hp ?? st.enemy_hp ?? st.current_hp;
    const maxRaw = st.boss_max_hp ?? st.mob_max_hp ?? st.enemy_max_hp ?? st.max_hp;
    const lvlRaw = st.boss_lvl ?? st.level ?? st.mob_lvl ?? st.enemy_lvl;
    const deadRaw = st.boss_dead ?? st.dead ?? st.is_dead ?? st.mob_dead;

    if (hpRaw !== undefined)  boss_hp = Number(hpRaw) || 0;
    if (maxRaw !== undefined) boss_max_hp = Number(maxRaw) || 0;
    if (lvlRaw !== undefined) boss_lvl = Number(lvlRaw) || boss_lvl;
    if (deadRaw !== undefined) boss_dead = !!deadRaw;

    window.boss_hp = boss_hp;
    window.boss_max_hp = boss_max_hp;
    window.boss_lvl = boss_lvl;
    window.boss_dead = boss_dead;

    if (typeof updateBossHpBar === "function") updateBossHpBar();
  } catch (e) {
    // тихо, без тостов
  } finally {
    __hpSyncInFlight = false;
  }
}

// ✅ боссовая награда приходит в pending_loot: это главный признак, что босса УЖЕ убили
function hasRealLoot(loot){
  if (loot == null) return false;
  if (typeof loot === "string") return loot.trim().length > 0;
  if (typeof loot !== "object") return true;

  const coinsVal = Number(loot.coins ?? 0) || 0;
  const resObj = (loot.resources && typeof loot.resources === "object") ? loot.resources : null;
  const anyRes = resObj ? Object.values(resObj).some(v => (Number(v) || 0) > 0) : false;
  const hasOther = Object.keys(loot).some(k => k !== "coins" && k !== "resources");
  return coinsVal > 0 || anyRes || hasOther;
}


async function nextLevel(){
  const prevLvl = Number(boss_lvl) || 0;

  const outState = buildState();

// ✅ если босс/моб был убит (даже если сервер уже "откатил" hp на фулл) — говорим бэку что он мёртв
const mustAdvance =
  (boss_cleared === true) ||
  (outState.boss_dead === true) ||
  (Number(outState.boss_hp) <= 0) ||
  (outState.pending_loot != null) ||
  (window.bossJustDied === true);

if (mustAdvance) {
  outState.boss_dead = true;
  outState.boss_hp = 0;
}


  const res = await fetch("https://clickergame-0wae.onrender.com/next_level", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: String(USER_ID), state: outState })
  });

  if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();

  // 🔥 правильный парс как в use_skill
  const st = pickStateFromResponse(data) || (data.state || data);

  if (st) applyState(st);
  window.__bossHpLockedHidden = false;
if (typeof window.setBossHpVisible === "function") window.setBossHpVisible(true);
  if (typeof window.resetEncounter === "function") window.resetEncounter();

  // ✅ принудительно переспавнить босса под текущий boss_lvl (иначе он обновится только через карту)
try {
  if (typeof window.setBossLevel === "function") {
    await window.setBossLevel(boss_lvl || (prevLvl + 1));
  }
} catch (e3) {
  console.log("setBossLevel after next_level failed:", e3);
}

// ✅ перезапуск “выбегания” героя/фона/мобов
if (typeof window.resetEncounter === "function") window.resetEncounter();


  // если реально перешли — сбрасываем флаг
  if ((Number(boss_lvl) || 0) > prevLvl) {
    boss_cleared = false;
    window.boss_cleared = false;
  }
}


window.nextLevel = nextLevel;


async function initGame() {
  try {
    const res = await fetch("https://clickergame-0wae.onrender.com/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(USER_ID)
,
        name: playerName
      })
    });

    if (!res.ok) throw new Error("INIT HTTP " + res.status);

    const data = await res.json();
    const st = pickStateFromResponse(data) || (data.state || data);


    // 1) имя
    if (st.name) playerName = st.name;

    // 2) применяем стейт
    if (typeof applyState === "function") {
      applyState(st);
      window.__bossHpLockedHidden = false;
if (typeof window.setBossHpVisible === "function") window.setBossHpVisible(true);

    } else {
      if (st.coins !== undefined) coins = st.coins;
      if (st.attack !== undefined) attack = st.attack;

      if (st.boss_hp !== undefined) boss_hp = st.boss_hp;
      if (st.boss_max_hp !== undefined) boss_max_hp = st.boss_max_hp;
      if (st.boss_lvl !== undefined) boss_lvl = st.boss_lvl;

      if (st.weapon_lvl !== undefined) weapon_lvl = st.weapon_lvl;
      if (st.weapon_rarity !== undefined) weapon_rarity = st.weapon_rarity;

      if (st.resources !== undefined) resources = st.resources;
      if (st.forge_lvl !== undefined) forge_lvl = st.forge_lvl;
      if (st.forge_xp !== undefined) forge_xp = st.forge_xp;
    }

    // 3) ВСЕГДА обновляем UI после init
    if (playerNameTxt) playerNameTxt.textContent = playerName;
    if (typeof updateBossHpBar === "function") updateBossHpBar();
    if (typeof renderStats === "function") renderStats();

    startServerTick();     // ✅ тик каждую секунду
startHpRegenSync();    // ✅ (опционально) синк раз в 5 сек, у тебя он тоже не запускался
    
  } catch (err) {
    console.log("INIT ERROR", err);
    if (typeof showErrorToast === "function") {
      showErrorToast("Нет связи. Перезайди в игру.");
    }
  }
}

async function bossAttack() {
  // ❌ Обычные клики отключены. Урон только от use_skill
  return;
}


async function useSkill(skill_id = "core_strike") {
  try {

    const res = await fetch("https://clickergame-0wae.onrender.com/use_skill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  user_id: String(USER_ID)
,
    skill_id: String(skill_id),
  state: buildState()
})

    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    const st = pickStateFromResponse(data);

    // ✅ event иногда содержит убийство/награду/HP (особенно на heavy_blow)
const ev = (data && data.event) ? data.event : null;
const evBool = (v) => (v === true || v === 1 || v === "1" || v === "true");

if (st && ev && typeof ev === "object") {
  const prevHpBeforeApply  = Number(boss_hp) || 0;
  const prevMaxBeforeApply = Number(boss_max_hp) || 0;

  // урон из event (если есть) — нужен чтобы отличить ev.hp (remaining) от ev.hp (damage)
  const dmgRaw =
    ev.damage_done ?? ev.damage_dealt ?? ev.damageDealt ??
    ev.dmg_done ?? ev.dmg_dealt ?? ev.dmgDealt ??
    ev.damage ?? ev.dmg ?? ev.hit_damage ?? ev.hitDamage ??
    ev.amount ?? ev.value ?? ev.deal;
  const dmgVal = (dmgRaw != null) ? Number(dmgRaw) : NaN;

  // 1) сначала берём “явные” ключи HP after
  let hpEv =
    ev.boss_hp ?? ev.mob_hp ?? ev.enemy_hp ??
    ev.hp_after ?? ev.after_hp ?? ev.remaining_hp ?? ev.hp_left;

  // 2) если пришёл только ev.hp — пытаемся понять, что это remaining_hp
  if (hpEv === undefined && ev.hp !== undefined) {
    const x = Number(ev.hp);
    const maxGuess = Number(st.boss_max_hp ?? prevMaxBeforeApply) || 0;

    if (Number.isFinite(x) && x >= 0 && (maxGuess <= 0 || x <= maxGuess)) {
      if (Number.isFinite(dmgVal) && prevHpBeforeApply > 0) {
        const remaining = prevHpBeforeApply - dmgVal;

        // если x совпал с remaining — это точно HP после удара
        if (Number.isFinite(remaining) && Math.abs(remaining - x) < 1e-6) hpEv = x;

        // иначе: если x НЕ равен dmg и реально меньше прошлого HP — тоже считаем remaining_hp
        else if (Math.abs(dmgVal - x) > 1e-6 && x <= prevHpBeforeApply) hpEv = x;
      } else {
        // без dmg-инфы: принимаем только если HP реально уменьшается
        if (prevHpBeforeApply > 0 && x <= prevHpBeforeApply) hpEv = x;
      }
    }
  }

  if (hpEv !== undefined) {
    const n = Number(hpEv);
    if (Number.isFinite(n)) st.boss_hp = n;
  }

  // MAX HP (если пришло явно)
  const hasExplicitBossMaxKey =
    (ev.boss_max_hp !== undefined) || (ev.mob_max_hp !== undefined) || (ev.enemy_max_hp !== undefined) ||
    (ev.max_hp !== undefined) || (ev.hp_max !== undefined);

  if (hasExplicitBossMaxKey) {
    const maxEv =
      ev.boss_max_hp ?? ev.mob_max_hp ?? ev.enemy_max_hp ??
      ev.max_hp ?? ev.hp_max ?? ev.maxHealth ?? ev.max_hp_value;

    const n = Number(maxEv);
    if (Number.isFinite(n)) st.boss_max_hp = n;
  }

  const deadEv =
    ev.boss_dead ?? ev.dead ?? ev.is_dead ?? ev.mob_dead ?? ev.killed ?? ev.is_kill ??
    ev.killed_now ?? ev.killedNow ?? ev.mob_killed ?? ev.mobKilled;

  if (deadEv !== undefined) st.boss_dead = !!deadEv;

  // Лут НЕ превращаем в pending_loot без факта убийства (иначе снова будет “фейк-смерть”)
  const evLoot =
    ev.pending_loot ?? ev.loot ?? ev.reward ?? ev.drops ?? ev.drop ?? ev.items;

  const killedFlag =
    evBool(deadEv) ||
    evBool(ev.killed) || evBool(ev.dead) || evBool(ev.mob_dead) || evBool(ev.boss_dead) ||
    (hpEv !== undefined && Number(hpEv) <= 0);

  const lvlGuess = Math.max(1, Number(st.boss_lvl ?? boss_lvl) || 1);
  const isBossLevelGuess = (lvlGuess % 5 === 0);

  if (isBossLevelGuess && killedFlag && evLoot !== undefined && st.pending_loot === undefined) {
    st.pending_loot = Array.isArray(evLoot) ? { items: evLoot } : evLoot;
  }

  if (ev.coins !== undefined && st.coins === undefined) st.coins = ev.coins;
  if (ev.resources !== undefined && st.resources === undefined) st.resources = ev.resources;
}

    
// ===== FIX: отдельный КД для каждого навыка =====
const usedId = String(skill_id || "core_strike");

if (st) {
  const evCd =
    data?.event?.skill_cd ?? data?.event?.cooldown ?? data?.event?.cd;

  // приоритет: skill_cd_until (сервер) -> state -> event
const cdUntil =
  (st.skill_cd_until && typeof st.skill_cd_until === "object")
    ? Number(st.skill_cd_until[usedId])
    : NaN;

const cdFromUntil =
  Number.isFinite(cdUntil)
    ? Math.max(0, +(cdUntil - (Date.now() / 1000)).toFixed(2))
    : undefined;

const cdFromState = (st.skill3_cd ?? st.skill2_cd ?? st.skill_cd);
const cd = (cdFromUntil !== undefined) ? cdFromUntil : ((cdFromState !== undefined) ? cdFromState : evCd);
  if (cd !== undefined) {
    if (usedId === "heavy_blow") st.skill2_cd = cd;
    else if (usedId === "guard_break") st.skill3_cd = cd;
    else st.skill_cd = cd;
  }

  // дефолты, если сервер не прислал
  if (usedId === "core_strike" && st.skill_cd === undefined) st.skill_cd = 1.3;
  if (usedId === "heavy_blow"  && st.skill2_cd === undefined) st.skill2_cd = 20;
  if (usedId === "guard_break" && st.skill3_cd === undefined) st.skill3_cd = 18;

  // второй навык не должен трогать КД первого
  if (usedId === "heavy_blow") delete st.skill_cd;
  // третий навык тоже не должен трогать КД первого
  if (usedId === "guard_break") delete st.skill_cd;
}


    if (st) {
      const prevHp = Number(boss_hp) || 0;
const prevCoins = Number(coins) || 0;
const prevRes = (resources && typeof resources === "object") ? { ...resources } : {};

  const lvlBefore = Number(boss_lvl) || 1;
  const isBossLevel = (lvlBefore % 5 === 0);
const prevLootHad = hasRealLoot(pending_loot);

applyState(st);
let lootMarker = (pending_loot != null);
const mobLootPending = (!isBossLevel) && lootMarker;
const killedByLoot = isBossLevel && lootMarker;
let needCollect = isBossLevel && lootMarker;

const lvlAfter = Math.max(1, Number(boss_lvl) || 1);

renderStats();
updateBossHpBar();

let curHp  = Number(st?.boss_hp ?? boss_hp) || 0;
let curMax = Number(st?.boss_max_hp ?? boss_max_hp) || 0;

const curLootHad = hasRealLoot(pending_loot);
const lootAppeared = (!prevLootHad && (curLootHad || lootMarker));

// cooldown: выходим только если реально не было эффекта
const _evUsedFalse = (ev && ev.used === false);


// считаем награду (нужно и для показа лута, и чтобы понять что это "убийство+респавн")
const parts = [];

const dc = (Number(coins) || 0) - prevCoins;
if (dc > 0) parts.push(`💰 +${dc}`);

const newRes = (resources && typeof resources === "object") ? resources : {};
const keys = new Set([...Object.keys(prevRes), ...Object.keys(newRes)]);

for (const k of keys) {
  const dv = (Number(newRes[k]) || 0) - (Number(prevRes[k]) || 0);
  if (dv <= 0) continue;

  if (k === "wood") parts.push(`🪵 +${dv}`);
else if (k === "ore") parts.push(`__ORE__ +${dv}`);
else parts.push(`${k}: +${dv}`);

}

let gotReward = parts.length > 0;

// ✅ если моб дал лут в pending_loot (а coins/resources не обновились) — тихо собираем
if (mobLootPending && !gotReward) {
  try {
    const res2 = await fetch("https://clickergame-0wae.onrender.com/collect_loot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID), state: buildState() })
    });

    if (res2.ok) {
      const data2 = await res2.json();
      const st2 = pickStateFromResponse(data2) || (data2.state || data2);

      if (st2) applyState(st2);
      pending_loot = null;

      window.__loot_lvl = null;

      renderStats();
      updateBossHpBar();

      // пересчёт награды относительно prevCoins/prevRes
      parts.length = 0;

      const dc2 = (Number(coins) || 0) - prevCoins;
      if (dc2 > 0) parts.push(`💰 +${dc2}`);

      const newRes2 = (resources && typeof resources === "object") ? resources : {};
      const keys2 = new Set([...Object.keys(prevRes), ...Object.keys(newRes2)]);
      for (const k of keys2) {
        const dv2 = (Number(newRes2[k]) || 0) - (Number(prevRes[k]) || 0);
        if (dv2 <= 0) continue;
        if (k === "wood") parts.push(`🪵 +${dv}`);
else if (k === "ore") parts.push(`__ORE__ +${dv}`);
else parts.push(`${k}: +${dv}`);

      }

      gotReward = parts.length > 0;

      // обновим hp переменные (на всякий)
      curHp  = Number(boss_hp) || 0;
      curMax = Number(boss_max_hp) || 0;
    }
  } catch (e) {
    console.log("silent collect_loot (mob) failed:", e);
  }
}

const killedByReward = (!isBossLevel && gotReward);


const diedToZero = (prevHp > 0 && curHp <= 0);

const killedByEvent = !!(ev && (
  evBool(ev.killed) || evBool(ev.dead) || evBool(ev.mob_dead) || evBool(ev.boss_dead) ||
  evBool(ev.mob_killed) || evBool(ev.mobKilled) ||
  evBool(ev.killed_now) || evBool(ev.killedNow) ||
  evBool(ev.is_kill) || evBool(ev.isKill) || evBool(ev.kill) ||
  evBool(ev.enemy_dead) || evBool(ev.enemyDead)
));

const evDmgRaw =
  ev?.damage_done ?? ev?.damage_dealt ?? ev?.damageDealt ??
  ev?.dmg_done ?? ev?.dmg_dealt ?? ev?.dmgDealt ??
  ev?.damage ?? ev?.dmg ?? ev?.hit_damage ?? ev?.hitDamage ??
  ev?.amount ?? ev?.value ?? ev?.deal;

const evDmg = (evDmgRaw != null) ? Number(evDmgRaw) : NaN;
const killedByBigDmg = (Number.isFinite(evDmg) && evDmg > 0 && prevHp > 0 && evDmg >= prevHp && curHp <= 0);

const looksLikeRespawn = (curMax > 0) && (curHp >= curMax) && (prevHp > 0) && (curHp > prevHp);

const respawnedInState =
  ((killedByBigDmg || killedByLoot || killedByEvent || diedToZero) || looksLikeRespawn) &&
  (curMax > 0) && (curHp >= curMax);

const killedNow =
  diedToZero ||
  killedByEvent ||
  killedByBigDmg ||
  killedByLoot ||
  killedByReward ||
  respawnedInState ||
  lootAppeared ||
  (boss_dead === true && prevHp > 0)

  if (_evUsedFalse && !killedNow && !gotReward && prevHp === curHp && !lootMarker) return;

// ✅ БОСС: бек уже выдаёт награду и сразу респавнит (boss_hp снова full).
// Значит на фронте нам нужно только: смерть-анимация -> визуальный респавн.
if (killedNow && isBossLevel) {
  // показать награду как у обычных мобов
  if (gotReward && typeof window.showLootFloat === "function") {
    window.showLootFloat(parts);
  }

  // спрятать полоску HP на время смерти, чтобы не прыгала на full мгновенно
  window.__bossHpLockedHidden = true;
  if (typeof updateBossHpBar === "function") updateBossHpBar();

  const pDeath = (typeof window.playMobDeath === "function")
    ? window.playMobDeath({ frameMs: 80, holdMs: 0, fadeMs: 1200 })
    : Promise.resolve(false);

  pDeath.then(() => {
    // визуальный респавн (выбегание нового босса)
    if (!window.__respawnFxInFlight && typeof window.resetEncounter === "function") {
      window.__respawnFxInFlight = true;
      try { window.resetEncounter(); }
      finally { window.__respawnFxInFlight = false; }
    }

    // вернуть HP-полоски
    window.__bossHpLockedHidden = false;
    if (typeof updateBossHpBar === "function") updateBossHpBar();
  });

  return;
}

// 2) Обычные мобы: показываем награду и перезапускаем "выход монстра"
if (killedNow && !needCollect) {
  if (gotReward && typeof window.showLootFloat === "function") {
    window.showLootFloat(parts);
  }

  const doRespawn = () => {
  const serverPreparedNext = respawnedInState || (lvlAfter !== lvlBefore);

  // 1) сервер уже прислал нового — делаем только визуальный респавн
  if (serverPreparedNext && !window.__respawnFxInFlight && typeof window.resetEncounter === "function") {
    window.__respawnFxInFlight = true;
    try { window.resetEncounter(); }
    finally { window.__respawnFxInFlight = false; }
    return;
  }

  // 2) сервер НЕ прислал нового — идём nextLevel (и не молча: с ретраем)
  if (!serverPreparedNext && !window.__autoNextInFlight && typeof window.nextLevel === "function") {
    window.__autoNextInFlight = true;

    (async () => {
      try {
        for (let a = 1; a <= 3; a++) {
          try { await window.nextLevel(); return; }
          catch (e) {
            console.log("auto nextLevel failed attempt", a, e);
            if (a < 3) await new Promise(r => setTimeout(r, 700));
            else throw e;
          }
        }
      } catch (e) {
        if (typeof showErrorToast === "function") showErrorToast("Нет связи — новый моб не пришёл");
      } finally {
        window.__autoNextInFlight = false;
      }
    })();
  }
};


const p = (typeof window.playMobDeath === "function")
  ? window.playMobDeath()
  : Promise.resolve(false);

p.then(doRespawn);

}
  let dmg = null;

const curHp2 = Number(st?.boss_hp ?? boss_hp);
const prevHp2 = Number(prevHp);

// пробуем взять урон из event (ключи часто разные)
// evDmg посчитан выше (number или NaN)
if (Number.isFinite(evDmg)) dmg = evDmg;

else if (killedNow && respawnedInState && !Number.isNaN(prevHp2)) dmg = prevHp2;
 // ваншот/добивание
else if (!Number.isNaN(prevHp2) && !Number.isNaN(curHp2)) dmg = Math.max(0, prevHp2 - curHp2);

// эффект удара: на убийстве тоже делаем hit, даже если hp "отскочило" вверх
if (typeof window.bossVisualHit === "function") {
  if ((dmg && dmg > 0) || killedNow) window.bossVisualHit();
}

if (typeof window.bossShowDamage === "function") {
  if (dmg && dmg > 0) {
    const isCrit = !!(ev && (
      evBool(ev.crit) ||
      evBool(ev.is_crit) || evBool(ev.isCrit) ||
      evBool(ev.critical) || evBool(ev.is_critical) ||
      evBool(ev.was_crit) ||
      evBool(ev.crit_hit) || evBool(ev.critHit)
    ));

    window.bossShowDamage("-" + dmg, { crit: isCrit });
  } else {
    window.bossShowDamage("MISS");
  }
}


} else {
  throw new Error("use_skill: state not found in response");
}



  } catch (err) {
    console.log("use_skill error:", err);
    if (typeof showErrorToast === "function") showErrorToast("Ошибка навыка");
  }
  // ВАЖНО: НЕ включаем кнопку тут обратно всегда.
  // Пусть applyState решает по st.skill_cd (у тебя это уже есть).
}

async function equipWeapon(weaponId) {
  try {
    const res = await fetch("https://clickergame-0wae.onrender.com/equip_weapon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID)
, weapon_id: weaponId })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const st = data.state || data;

    applyState(st);
  } catch (err) {
    console.log("equip_weapon error:", err);
    if (typeof showErrorToast === "function") showErrorToast("Не удалось надеть");
  }
}

async function dismantleWeapon(weaponId) {
  const res = await fetch("https://clickergame-0wae.onrender.com/dismantle_weapon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: String(USER_ID)
, weapon_id: String(weaponId) })
  });

  if (!res.ok) throw new Error("HTTP " + res.status);

  return await res.json(); // { state, event }
}

function handleActionResult(data) {
  // босс умер → новый босс
  if (data.next_boss !== undefined) {
    boss_hp = data.boss_hp;
    boss_max_hp = data.boss_max_hp;
    updateBossHpBar();
  }

  // крафт
  if (data.success === true && data.weapon_lvl !== undefined) {
    weapon_lvl = data.weapon_lvl;
    showCraftSuccess(data.weapon_lvl);
  }

  if (data.success === false) {
    showCraftFail();
  }

  if (data.finished) {
    showGameFinished();
  }
}

async function upgradeForge() {
  if (forgeUpgradeInFlight) return;
  forgeUpgradeInFlight = true;

  try {
    if (forgeUpgradeBtn) {
      forgeUpgradeBtn.disabled = true;
      forgeUpgradeBtn.textContent = "⏳ Улучшаю...";
    }

    const res = await fetch("https://clickergame-0wae.onrender.com/forge_upgrade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({user_id: String(USER_ID)
, state: buildState() })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
const st = pickStateFromResponse(data);



    if (st) applyState(st);
if (typeof renderForgeHud === "function") renderForgeHud(buildState());


  } catch (err) {
    console.log("upgrade_forge error:", err);
    if (typeof showErrorToast === "function") showErrorToast("Не удалось улучшить кузню");
  } finally {
    forgeUpgradeInFlight = false;
    if (forgeUpgradeBtn) {
      forgeUpgradeBtn.disabled = false;
      forgeUpgradeBtn.textContent = "⬆️ Улучшить";
    }
  }
}

function swordIndexByLvl(lvl){
  const L = Math.max(1, Number(lvl || 1));
  const idx = Math.floor((L - 1) / 5) + 1; // 1..∞
  return Math.max(1, Math.min(10, idx));  // 1..10
}

function pad2(n){ return String(n).padStart(2, "0"); }

function weaponSpriteUrl(rarity, lvl){
  const r = String(rarity || "common").toLowerCase();
  const style = RARITY_STYLE[r] || "Celtic";
  const idx = pad2(swordIndexByLvl(lvl));
  return `/static/images/PixelArt_Swords_64/${style}/64/PixelArt_Swords_${style}_64_${idx}.png`;
}

craftBtn.onclick = async (event) => {
  // 0) если предмет уже лежит в кузне — не даём крафтить дальше
  if (pendingForgeItem) {
    showErrorToast("Сначала забери предмет из кузни");
    return;
  }

  try {
    const res = await fetch("https://clickergame-0wae.onrender.com/craft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID)
, state: buildState() })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

// ✅ beforeIds нужно снять ДО applyState (чтобы найти новый предмет)
const beforeIds = new Set(
  ((Array.isArray(inventory) ? inventory : (inventory?.items || [])) || [])
    .map(x => x?.id)
    .filter(Boolean)
);

const st = pickStateFromResponse(data);
const ev = data.event || null;

if (st) applyState(st);
if (typeof renderForgeHud === "function") renderForgeHud(buildState());
if (typeof renderStats === "function") renderStats();

const craftFailed =
  data.success === false ||
  ev?.success === false ||
  ev?.ok === false ||
  ev?.result === "fail" ||
  ev?.type === "craft_fail";

if (craftFailed) {
  pendingForgeItem = null;

  if (craftResult) craftResult.classList.add("hidden");
  playForgeFx(1500);
  await sleep(1500);

  renderCraftResult({ _craftFail: true });
  return;
}

    renderForgeHud(st);

        // 2) ищем НОВЫЙ предмет, который добавился в инвентарь после крафта
    const afterItems = (st.inventory?.items || (Array.isArray(inventory) ? inventory : (inventory?.items || [])) || []);
    const newlyCrafted = afterItems.find(x => x && x.id && !beforeIds.has(x.id));
    let item = ev?.crafted_item || ev?.item || ev?.weapon || newlyCrafted || null;



  // ✅ если в предмете нет атаки — пробуем взять её из ответа (state/event) и записать в item + inventory
if (item && getItemAtk(item) === 0) {
  const a = Number(
    ev?.crafted_item?.attack ?? ev?.crafted_item?.atk ?? ev?.crafted_item?.base_atk ??
    ev?.attack ?? ev?.weapon_attack ?? ev?.weapon_atk ??
    st.weapon_attack ?? st.weapon_atk ?? st.base_atk ?? st.attack
  ) || 0;

  if (a) {
    item.attack = a;
    item.base_atk = a;

    // если newlyCrafted реально лежит в inventory — тоже обновляем его
    if (newlyCrafted && newlyCrafted.id && item.id && newlyCrafted.id === item.id) {
      newlyCrafted.attack = a;
      newlyCrafted.base_atk = a;
    }
  }
}

    // ✅ гарантия, что у item есть атака
const a = Number(
  item?.attack ?? item?.atk ?? item?.base_atk ?? item?.weapon_atk ??
  st.weapon_attack ?? st.weapon_atk ?? st.base_atk
) || 0;

if (item) {
  if (!item.attack && a) item.attack = a;
  if (!item.base_atk && a) item.base_atk = a;
}

// ✅ и главное: ПРОПИСАТЬ ЭТУ АТАКУ В ПРЕДМЕТЕ В ИНВЕНТАРЕ (который ты рендеришь)
const invItems = Array.isArray(inventory)
  ? inventory
  : (inventory?.items || []);

const invIt = invItems.find(x => x && x.id && item && x.id === item.id);
if (invIt && a) {
  invIt.attack = a;
  invIt.base_atk = a;
}

    // 4) если сервер вообще не отдаёт предмет объектом — создаём временный (пока бэк не пришлёт)
    if (!item) {
      const a = Number(st.weapon_attack ?? st.weapon_atk ?? st.base_atk ?? st.attack ?? 0) || 0;

      item = {
        id: "tmp_" + Date.now(),
        rarity: st.weapon_rarity || "common",
        lvl: st.weapon_lvl ?? 0,
        attack: a,
        base_atk: a,
        roll: st.weapon_roll ?? 1.0,

};
    }

    pendingForgeItem = item;

if (craftResult) craftResult.classList.add("hidden");
playForgeFx(1500);
await sleep(1500);

renderCraftResult({ equipped_weapon: item });
return;

  } catch (err) {
    console.log(err);
    showErrorToast("Потеря связи, повторите клик");
  }
};

if (collectBtn) {
  collectBtn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    collectBtn.disabled = true;
collectBtn.textContent = "⏳";

    try {
      const res = await fetch("https://clickergame-0wae.onrender.com/collect_loot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: String(USER_ID)
, state: buildState() })
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();

      const st = pickStateFromResponse(data) || (data.state || data);

      applyState(st);
      renderStats();
      updateBossHpBar();
      // ✅ это сбор награды с босса — дальше всегда должен сработать /next_level
boss_cleared = true;
window.boss_cleared = true;


      // ✅ лут собран — чистим локально
pending_loot = null;
window.__loot_lvl = null;


// закрываем окно лута (1 раз)
if (typeof setCollectVisible === "function") setCollectVisible(false);

// ✅ после сбора награды идём на следующий уровень
if (typeof window.nextLevel === "function") {
  await window.nextLevel();
}


    } catch (err) {
      console.log("collect_loot error:", err);
      if (typeof showErrorToast === "function") showErrorToast("Потеря связи, повторите");
    }
  };
}

async function setBossLevel(newLvl){
  const lvl = Math.max(1, parseInt(newLvl, 10) || 1);

  // ВАЖНО: если у брата другой URL/роут — поменяй тут одну строку
  const res = await fetch("https://clickergame-0wae.onrender.com/set_boss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: String(USER_ID)
,
      boss_lvl: lvl,
      boss_level: lvl,
      state: buildState() // чтобы бэку было удобно (может игнорить)
    })
  });

  if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();
  const st = pickStateFromResponse(data) || (data.state || data);
  if (st) applyState(st);
  if (typeof window.resetEncounter === "function") {
  window.resetEncounter({ startMode: "approach", keepBackground: true });
}

  window.__bossHpLockedHidden = false;
if (typeof window.setBossHpVisible === "function") window.setBossHpVisible(true);

  if (st) 
    (st); // сервер = источник правды
  return data;
}

window.setBossLevel = setBossLevel;
