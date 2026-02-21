const playerNameTxt = document.getElementById("playerNameTxt");
const coinsTxt = document.getElementById("coinsTxt");
const wrapper = document.querySelector(".game-wrapper");

// блокируем pull-to-refresh / растягивание страницы в Chrome
const __stop = (e) => e.preventDefault();

document.addEventListener("touchmove", __stop, { passive: false });
document.addEventListener("wheel", __stop, { passive: false });

// iOS: убираем жесты масштабирования (на всякий)
document.addEventListener("gesturestart", __stop, { passive: false });
document.addEventListener("gesturechange", __stop, { passive: false });
document.addEventListener("gestureend", __stop, { passive: false });

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready?.();
  tg.expand?.();
  tg.disableVerticalSwipes?.();
  tg.setBackgroundColor?.("#000000");
  tg.setHeaderColor?.("#000000");

  // fullscreen сработает только после жеста
  document.addEventListener("pointerdown", () => tg.requestFullscreen?.(), { once: true });
}



const DESIGN_W = 430;
const DESIGN_H = 932;

function applyUiScale(){
  const tg = window.Telegram?.WebApp;
  const vv = window.visualViewport;

  const vw =
    tg?.viewportWidth ??
    (vv ? vv.width : window.innerWidth);

  const vh =
    Math.max(
      tg?.viewportHeight ?? 0,
      tg?.viewportStableHeight ?? 0,
      (vv ? vv.height : window.innerHeight)
    );

  // ✅ ВАЖНО: убрали "1", теперь может увеличиваться
  const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);

  document.documentElement.style.setProperty("--ui-scale", String(scale));
}



// запуск + обновление при ресайзе/повороте/адресной строке Chrome
applyUiScale();
window.addEventListener("resize", applyUiScale);
window.addEventListener("orientationchange", applyUiScale);
if (window.visualViewport) window.visualViewport.addEventListener("resize", applyUiScale);
window.Telegram?.WebApp?.onEvent?.("viewportChanged", applyUiScale);
window.Telegram?.WebApp?.onEvent?.("fullscreenChanged", applyUiScale);

const bossHpFill = document.getElementById("bossHpFill");
const bossHpText = document.getElementById("bossHpLabel");
const forgeBtn = document.getElementById("forgeBtn");
const forgeModal = document.getElementById("forgeModal");
const closeForge = document.getElementById("closeForge");
const inventoryBtn = document.getElementById("inventoryBtn");
const inventoryModal = document.getElementById("inventoryModal");
const inventoryCloseBtn = document.getElementById("inventoryCloseBtn");
const mapBtn = document.getElementById("mapBtn");
const mapScreen = document.getElementById("mapScreen");
const mapCloseBtn = document.getElementById("mapCloseBtn");
const hero = document.querySelector(".hero");
const heroEl = document.querySelector(".hero");
const craftBtn = document.getElementById("craftBtn");
const lootModal = document.getElementById("lootModal");
const lootText  = document.getElementById("lootText");
const collectBtn = document.getElementById("collectBtn");
const woodTxt = document.getElementById("woodTxt");
const heroHudLvl = document.getElementById("heroHudLvl");
const heroHpFill = document.getElementById("heroHpFill");
const heroHpText = document.getElementById("heroHpText");
const heroMpFill = document.getElementById("heroMpFill");
const heroMpText = document.getElementById("heroMpText");
const heroExpFill = document.getElementById("heroExpFill");
const heroXpText = document.getElementById("heroXpText");
const itemModal = document.getElementById("itemModal");
const itemModalBackdrop = document.getElementById("itemModalBackdrop");
const itemModalClose = document.getElementById("itemModalClose");
const itemModalCard = document.getElementById("itemModalCard");

const itemModalLvl = document.getElementById("itemModalLvl");
const itemModalRarity = document.getElementById("itemModalRarity");
const itemModalImg = document.getElementById("itemModalImg");
const itemModalAtk = document.getElementById("itemModalAtk");
const itemModalMod = document.getElementById("itemModalMod");
const itemModalMeta = document.getElementById("itemModalMeta");
const itemModalEquipBtn = document.getElementById("itemModalEquipBtn");
const craftResult = document.getElementById("craftResult");
const weaponCard  = document.getElementById("weaponCard");
const weaponImg   = document.getElementById("weaponImg");
const weaponName  = document.getElementById("weaponName");
const weaponAtk   = document.getElementById("weaponAtk");
const weaponMeta  = document.getElementById("weaponMeta");

const invGrid = document.getElementById("invGrid");
const invWeaponCard = document.getElementById("invWeaponCard");
const invWeaponImg  = document.getElementById("invWeaponImg");
const invWeaponName = document.getElementById("invWeaponName");
const invWeaponAtk  = document.getElementById("invWeaponAtk");
const invWeaponMeta = document.getElementById("invWeaponMeta");
const invEquipBtn   = document.getElementById("invEquipBtn");
const forgeLvlTxt = document.getElementById("forgeLvlTxt");
const forgeXpFill = document.getElementById("forgeXpFill");
const forgeXpTxt  = document.getElementById("forgeXpTxt");
const forgeCoinsTxt = document.getElementById("forgeCoinsTxt");
const forgeWoodTxt  = document.getElementById("forgeWoodTxt");
const forgeUpgradeBtn = document.getElementById("forgeUpgradeBtn");
const itemModalBreakBtn = document.getElementById("itemModalBreakBtn");
const forgeDrop = document.getElementById("forgeDrop");
const forgeDropImg = document.getElementById("forgeDropImg");
const forgeDropName = document.getElementById("forgeDropName");
const forgeDropMeta = document.getElementById("forgeDropMeta");
const forgeDropTakeBtn = document.getElementById("forgeDropTakeBtn");
const forgeDropSlot = document.getElementById("forgeDropSlot");
const bossImg = document.getElementById("bossImg");
const forgeEffect = document.getElementById("forgeEffect");
const skillBtn = document.getElementById("skillBtn");
const skillBtn2 = document.getElementById("skillBtn2");
const skillBtn3 = document.getElementById("skillBtn3");
const nextWaveBtn = document.getElementById("nextWaveBtn");
const sceneEl = document.getElementById("scene");
const bgA = document.getElementById("bgA");
const bgB = document.getElementById("bgB");
const golem = document.getElementById("golem");
const bossLvlValue = document.getElementById("bossLvlValue");
const mapToast = document.getElementById("mapToast");
// ===== NEW MAP UI (scroll levels + preview) =====
const dselTitle = document.getElementById("dselTitle");
const dselSub = document.getElementById("dselSub");
const dselDesc = document.getElementById("dselDesc");
const dselPreviewImg = document.getElementById("dselPreviewImg");
const dselList = document.getElementById("dselList");
const dselEnterBtn = document.getElementById("dselEnterBtn");

function enableDragScroll(el){
  if (!el || el.__dragScrollEnabled) return;
  el.__dragScrollEnabled = true;

  let isDown = false;
  let startY = 0;
  let startScrollTop = 0;
  let dragging = false;
  const THRESHOLD = 12; // если клики всё ещё режутся — поставь 16

  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isDown = true;
    dragging = false;
    startY = e.clientY;
    startScrollTop = el.scrollTop;
  });

  el.addEventListener("pointermove", (e) => {
    if (!isDown) return;

    const dy = e.clientY - startY;

    // пока не прошли порог — это ТАП, ничего не делаем (клик должен работать)
    if (!dragging) {
      if (Math.abs(dy) < THRESHOLD) return;

      // только теперь считаем это "перетаскивание" и начинаем перехват
      dragging = true;
      el.setPointerCapture?.(e.pointerId);
    }

    // реальная прокрутка при drag
    el.scrollTop = startScrollTop - dy;
    e.preventDefault();
  }, { passive: false });

  el.addEventListener("pointerup", (e) => {
    isDown = false;

    // если был drag — глушим "случайный" клик после отпускания
    if (dragging) {
      // самое надёжное: гасим следующий клик только ОДИН раз
      const stopClickOnce = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        el.removeEventListener("click", stopClickOnce, true);
      };
      el.addEventListener("click", stopClickOnce, true);
    }

    dragging = false;
  });

  el.addEventListener("pointercancel", () => {
    isDown = false;
    dragging = false;
  });
}

let __selectedBossLvl = 1;

// Сколько уровней рисовать в списке (пока фикс 100)
const BOSS_LEVEL_CAP = 100;

function getMaxReachedBossLvl(){
  const mxRaw =
    (window.boss_lvl_max_reached !== undefined)
      ? window.boss_lvl_max_reached
      : (typeof boss_lvl_max_reached !== "undefined" ? boss_lvl_max_reached : 1);

  return Math.max(1, Number(mxRaw) || 1);
}

// пока каркас: одна картинка, позже сделаем разные
function previewImageForLevel(lvl){
  // потом сделаем массив картинок по диапазонам/биомам
  return "/static/images/dungeon-bg1.jpg";
}

function setSelectedBossLvl(lvl){
  __selectedBossLvl = Math.max(1, Number(lvl) || 1);

  if (dselSub) dselSub.textContent = `LVL ${__selectedBossLvl}`;
  if (dselPreviewImg) dselPreviewImg.src = previewImageForLevel(__selectedBossLvl);

  // подсветка в списке
  if (dselList){
    const items = dselList.querySelectorAll(".dsel-item");
    items.forEach(el => {
      const v = Number(el.dataset.lvl) || 0;
      el.classList.toggle("dsel-item--selected", v === __selectedBossLvl);
    });
  }
}

function renderBossLevelList(){
  if (!dselList) return;

  const maxReached = getMaxReachedBossLvl();

  dselList.innerHTML = "";
  const frag = document.createDocumentFragment();

  for (let lvl = 1; lvl <= BOSS_LEVEL_CAP; lvl++){
    const locked = lvl > maxReached;

    const el = document.createElement("div");
    el.className = "dsel-item" + (locked ? " dsel-item--locked" : "");
    el.dataset.lvl = String(lvl);

    el.innerHTML = `
      <div class="dsel-item__left">
        <div class="dsel-item__lvl">BOSS LVL ${lvl}</div>
        <div class="dsel-item__tag">${locked ? "Закрыто" : "Доступно"}</div>
      </div>
      <div class="dsel-item__lock">${locked ? "🔒" : ""}</div>
    `;

    frag.appendChild(el);
  }

  dselList.appendChild(frag);
  enableDragScroll(dselList);

  // event delegation
  dselList.onclick = (e) => {
    const item = e.target.closest(".dsel-item");
    if (!item) return;

    const lvl = Number(item.dataset.lvl) || 1;
    setSelectedBossLvl(lvl);

    // автоскролл чтобы выбранный был виден
    item.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  // подсветить текущий
  setSelectedBossLvl(__selectedBossLvl);

  // прокрутить к выбранному
  const curEl = dselList.querySelector(`.dsel-item[data-lvl="${__selectedBossLvl}"]`);
  if (curEl) curEl.scrollIntoView({ block: "center", behavior: "instant" });
}

async function enterSelectedBossLevel(){
  const lvl = Math.max(1, Number(__selectedBossLvl) || 1);
  const maxReached = getMaxReachedBossLvl();

  if (lvl > maxReached){
    showMapToast(`Нельзя выбрать LVL ${lvl}.\nТвой максимум: LVL ${maxReached}`, 2000);
    return;
  }

  if (!dselEnterBtn) return;

  const old = dselEnterBtn.textContent;
  dselEnterBtn.disabled = true;
  dselEnterBtn.textContent = "⏳";

  try{
    if (typeof window.setBossLevel === "function"){
      await window.setBossLevel(lvl);
    }

    if (typeof window.resetEncounter === "function") {
      window.resetEncounter({ startMode: "approach", keepBackground: true });
    }

    // закрыть карту
    if (mapScreen) mapScreen.style.display = "none";
    if (typeof syncOverlayFlag === "function") syncOverlayFlag();
  }catch(err){
    console.log("enterSelectedBossLevel error:", err);
    if (typeof showErrorToast === "function") showErrorToast("Не удалось войти");
  }finally{
    dselEnterBtn.disabled = false;
    dselEnterBtn.textContent = old;
  }
}

if (dselEnterBtn){
  dselEnterBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    enterSelectedBossLevel();
  };
}

const craftCostTxt = document.getElementById("craftCostTxt");
const oreTxt = document.getElementById("oreTxt");
const forgeOreTxt = document.getElementById("forgeOreTxt");

function syncOverlayFlag() {
  const open =
    (forgeModal && forgeModal.classList.contains("active")) ||
    (inventoryModal && inventoryModal.style.display === "flex") ||
    (mapScreen && mapScreen.style.display === "flex") ||
    (lootModal && !lootModal.classList.contains("hidden")) ||
    (itemModal && !itemModal.classList.contains("hidden"));
    
    // ✅ пауза главного экрана только для: кузница / инвентарь / карта
const pauseMain =
  (forgeModal && forgeModal.classList.contains("active")) ||
  (inventoryModal && inventoryModal.style.display === "flex") ||
  (mapScreen && mapScreen.style.display === "flex");

if (typeof window.setBattlePaused === "function") {
  window.setBattlePaused(!!pauseMain);
}

  document.body.classList.toggle("ui-overlay-open", !!open);

  // жёстко прячем hp/имя моба при любых оверлеях
window.__forceHideMobHp = !!open;

const mobHpWrap = document.getElementById("mobHpWrap");
const mobHpName = document.getElementById("mobHpName");

if (open) {
  if (mobHpWrap) mobHpWrap.style.display = "none";
  if (mobHpName) mobHpName.style.display = "none";
}

}

// на старте тоже синхронизируем
syncOverlayFlag();


forgeBtn.onclick = () => {
  forgeModal.classList.add("active");
  syncOverlayFlag();
  if (typeof renderForgeHud === "function") renderForgeHud(buildState());
};


closeForge.onclick = () => {
  forgeModal.classList.remove("active");
  syncOverlayFlag();
};

inventoryBtn.onclick = () => {
  renderInventory();
  inventoryModal.style.display = "flex";
  syncOverlayFlag();
};

inventoryCloseBtn.onclick = () => {
  inventoryModal.style.display = "none";
  syncOverlayFlag();
};

mapBtn.onclick = () => {
  mapScreen.style.display = "flex";
  syncOverlayFlag();

  const cur = Math.max(1, Number(boss_lvl) || 1);
  __selectedBossLvl = cur;

  if (dselTitle) dselTitle.textContent = "Forsaken Cathedral"; // потом поменяешь на свои локации
  if (dselDesc) dselDesc.textContent = "Выберите уровень справа";

  renderBossLevelList();
};



mapCloseBtn.onclick = (e) => {
  e.stopPropagation();
  mapScreen.style.display = "none";
  syncOverlayFlag();
};

if (skillBtn2) {
  skillBtn2.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (skill2CdLeft > 0 || skillBtn2.disabled) {
      if (typeof showErrorToast === "function") showErrorToast("Навык в КД");
      return;
    }

    const ok = (typeof window.trySkill2Attack === "function") ? window.trySkill2Attack() : false;

    // fallback КД (если бэк не пришлёт отдельный)
    if (ok) startSkill2CooldownUI(20000);
  });
}

if (skillBtn3) {
  skillBtn3.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();

    if (skill3CdLeft > 0 || skillBtn3.disabled) {
      if (typeof showErrorToast === "function") showErrorToast("Навык в КД");
      return;
    }

    const ok = (typeof window.trySkill3Attack === "function") ? window.trySkill3Attack() : false;

    // fallback КД (если бэк не пришлёт отдельный)
    if (ok) startSkill3CooldownUI(18000);
  });
}

skillBtn.addEventListener("click", function (e) {
  e.preventDefault();
  e.stopPropagation();
  // если КД идёт — не запускаем анимацию и не шлём запрос
  if (skillCdLeft > 0 || skillBtn.disabled) {
      // 🚫 если скелет ещё не дошёл — навык не даём
  if (typeof window.canUseSkillNow === "function" && !window.canUseSkillNow()) {
    if (typeof showErrorToast === "function") showErrorToast("Скелет далеко");
    return;
  }
    if (typeof showErrorToast === "function") showErrorToast("Навык в КД");
    return;
  }

  if (typeof window.trySkillAttack === "function") {
    window.trySkillAttack();
  }
});


itemModalBreakBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  const it = window.__openedItem;
  if (!it) return;

  // 1-й клик: просим подтверждение
  if (!pendingBreakArmed) {
    pendingBreakArmed = true;
    itemModalBreakBtn.textContent = "Подтвердить";
    return;
  }

  // 2-й клик: отправляем на сервер
  const id = (it.id ?? it.weapon_id ?? it.uid);
  if (!id) {
    pendingBreakArmed = false;
    itemModalBreakBtn.textContent = "Сломать";
    return;
  }

  // (опционально) если пытаешься сломать надетое — запретим на фронте
  if (equipped_weapon_id === id) {
    pendingBreakArmed = false;
    itemModalBreakBtn.textContent = "Сломать";
    if (typeof showErrorToast === "function") showErrorToast("Сначала сними оружие");
    return;
  }

  const oldText = itemModalBreakBtn.textContent;
  itemModalBreakBtn.disabled = true;
  itemModalBreakBtn.textContent = "⏳";

  try {
    const data = await dismantleWeapon(id);
    const st = data.state || data;

    applyState(st);     // ✅ сервер — источник правды
    renderStats();
    renderInventory();

    // сброс
    pendingBreakArmed = false;
    itemModalBreakBtn.textContent = "Сломать";
    itemModalBreakBtn.disabled = false;
    window.__openedItem = null;

    closeItemModal();

    // если хочешь — покажем что выпало (если бэк прислал event)
    if (data.event && typeof showErrorToast === "function") {
      // без “портянки”: просто коротко
      if (typeof data.event === "string") showErrorToast(data.event);
      else if (data.event.text) showErrorToast(data.event.text);
    }

  } catch (err) {
    console.log("dismantle_weapon error:", err);
    pendingBreakArmed = false;
    itemModalBreakBtn.disabled = false;
    itemModalBreakBtn.textContent = oldText || "Сломать";
    if (typeof showErrorToast === "function") showErrorToast("Не удалось сломать");
  }
});

function refreshNextBtn(){
  if (!nextWaveBtn) return;

  const lvl = Math.max(1, Number(window.boss_lvl ?? boss_lvl) || 1);
const lootLvl = Math.max(1, Number(window.__loot_lvl ?? lvl) || 1);
  const maxReached = Number(window.boss_lvl_max_reached ?? boss_lvl_max_reached) || 1;

  const hp = Number(window.boss_hp ?? boss_hp);
  const died = (boss_dead === true) || (!Number.isNaN(hp) && hp <= 0);

  const isBossLevel = (lootLvl % 5 === 0);
const hasLoot = false; // временно: награда босса начисляется сразу, окна нет


  // ✅ если maxReached >= lvl+1 — значит этот уровень уже убивали хотя бы раз
  const clearedThisLevelOnce = (maxReached >= (lvl + 1));

  // показываем кнопку если:
  // - есть лут (нужно забрать)
  // - босс умер
  // - уровень уже проходили раньше (кнопка "Дальше" должна быть всегда)
  const show = hasLoot || died || clearedThisLevelOnce;
  nextWaveBtn.classList.toggle("hidden", !show);

  nextWaveBtn.disabled = false;
  nextWaveBtn.textContent = hasLoot ? "Забрать награду" : "➡️ Дальше";
}




if (nextWaveBtn){
  nextWaveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const lvl = Math.max(1, Number(window.boss_lvl ?? boss_lvl) || 1);
const lootLvl = Math.max(1, Number(window.__loot_lvl ?? lvl) || 1);
const isBossLevel = (lootLvl % 5 === 0);


// ✅ временно: на босс-уровнях тоже автосбор (без окна)
if (isBossLevel && pending_loot != null) {
  if (window.__autoBossCollectInFlight) return;
  window.__autoBossCollectInFlight = true;

  try {
    if (typeof setCollectVisible === "function") setCollectVisible(false);

    const res = await fetch("https://pvrs-clicker.ngrok.pro/collect_loot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: String(USER_ID), state: buildState() })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const st = (typeof pickStateFromResponse === "function")
      ? (pickStateFromResponse(data) || (data.state || data))
      : (data.state || data);

    if (typeof applyState === "function" && st) applyState(st);

    pending_loot = null;
    window.__loot_lvl = null;

    if (typeof renderStats === "function") renderStats();
    if (typeof updateBossHpBar === "function") updateBossHpBar();

    if (typeof window.nextLevel === "function") await window.nextLevel();

  } catch (err) {
    console.log("auto collect (boss) from nextWaveBtn failed:", err);
    if (typeof showErrorToast === "function") showErrorToast("Потеря связи, повтори");
  } finally {
    window.__autoBossCollectInFlight = false;
  }

  return;
}


    try{
      if (typeof window.nextLevel === "function"){
        await window.nextLevel();
      }
    }catch(err){
      console.log("nextLevel error:", err);
      if (typeof showErrorToast === "function") showErrorToast("Не удалось перейти дальше");
    }
  });
}

let skillCdLeft = 0;        // секунды (float), используется в клике
let skillCdUntil = 0;       // performance.now() когда КД закончится
let skillCdTotalMs = 0;     // длительность текущего КД в мс
let skillCdRAF = null;

function stopSkillCooldownUI(){
  if (skillCdRAF) cancelAnimationFrame(skillCdRAF);
  skillCdRAF = null;

  skillCdUntil = 0;
  skillCdTotalMs = 0;
  skillCdLeft = 0;
  window.skill_cd = 0;

  if (skillBtn){
    skillBtn.disabled = false;
    skillBtn.textContent = "🔥";
    skillBtn.classList.remove("cooldown");
    skillBtn.style.removeProperty("--cdp");
  }
}

function startSkillCooldownUI(ms){
  const dur = Math.max(0, Number(ms) || 0);
  if (dur <= 0) return stopSkillCooldownUI();

  if (skillCdRAF) cancelAnimationFrame(skillCdRAF);
  skillCdRAF = null;

  skillCdTotalMs = dur;
  skillCdUntil = performance.now() + dur;

  const tick = () => {
    const now = performance.now();
    const leftMs = Math.max(0, skillCdUntil - now);
    const leftSec = leftMs / 1000;

    skillCdLeft = leftSec;
    window.skill_cd = leftSec;

    if (skillBtn){
      if (leftMs > 0){
        skillBtn.disabled = true;
        skillBtn.classList.add("cooldown");

        const pct = Math.max(0, Math.min(100, (leftMs / skillCdTotalMs) * 100));
        skillBtn.style.setProperty("--cdp", pct.toFixed(2) + "%");

        skillBtn.textContent = "⏳" + leftSec.toFixed(1); // 1.3 → 0.0
      } else {
        stopSkillCooldownUI();
        return;
      }
    }

    skillCdRAF = requestAnimationFrame(tick);
  };

  tick();
}

let skill2CdLeft = 0;
let skill2CdUntil = 0;
let skill2CdTotalMs = 0;
let skill2CdRAF = null;

function stopSkill2CooldownUI(){
  if (skill2CdRAF) cancelAnimationFrame(skill2CdRAF);
  skill2CdRAF = null;

  skill2CdUntil = 0;
  skill2CdTotalMs = 0;
  skill2CdLeft = 0;
  window.skill2_cd = 0;

  if (skillBtn2){
    skillBtn2.disabled = false;
    skillBtn2.textContent = "⚡";
    skillBtn2.classList.remove("cooldown");
    skillBtn2.style.removeProperty("--cdp");
  }
}

function startSkill2CooldownUI(ms){
  const dur = Math.max(0, Number(ms) || 0);
  if (dur <= 0) return stopSkill2CooldownUI();

  if (skill2CdRAF) cancelAnimationFrame(skill2CdRAF);
  skill2CdRAF = null;

  skill2CdTotalMs = dur;
  skill2CdUntil = performance.now() + dur;

  const tick = () => {
    const now = performance.now();
    const leftMs = Math.max(0, skill2CdUntil - now);
    const leftSec = leftMs / 1000;

    skill2CdLeft = leftSec;
    window.skill2_cd = leftSec;

    if (skillBtn2){
      if (leftMs > 0){
        skillBtn2.disabled = true;
        skillBtn2.classList.add("cooldown");

        const pct = Math.max(0, Math.min(100, (leftMs / skill2CdTotalMs) * 100));
        skillBtn2.style.setProperty("--cdp", pct.toFixed(2) + "%");

        skillBtn2.textContent = "⏳" + leftSec.toFixed(1);
      } else {
        stopSkill2CooldownUI();
        return;
      }
    }

    skill2CdRAF = requestAnimationFrame(tick);
  };

  tick();
}

let skill3CdLeft = 0;
let skill3CdUntil = 0;
let skill3CdTotalMs = 0;
let skill3CdRAF = null;

function stopSkill3CooldownUI(){
  if (skill3CdRAF) cancelAnimationFrame(skill3CdRAF);
  skill3CdRAF = null;

  skill3CdUntil = 0;
  skill3CdTotalMs = 0;
  skill3CdLeft = 0;
  window.skill3_cd = 0;

  if (skillBtn3){
    skillBtn3.disabled = false;
    skillBtn3.textContent = "🛡️";
    skillBtn3.classList.remove("cooldown");
    skillBtn3.style.removeProperty("--cdp");
  }
}

function startSkill3CooldownUI(ms){
  const dur = Math.max(0, Number(ms) || 0);
  if (dur <= 0) return stopSkill3CooldownUI();

  if (skill3CdRAF) cancelAnimationFrame(skill3CdRAF);
  skill3CdRAF = null;

  skill3CdTotalMs = dur;
  skill3CdUntil = performance.now() + dur;

  const tick = () => {
    const now = performance.now();
    const leftMs = Math.max(0, skill3CdUntil - now);
    const leftSec = leftMs / 1000;

    skill3CdLeft = leftSec;
    window.skill3_cd = leftSec;

    if (skillBtn3){
      if (leftMs > 0){
        skillBtn3.disabled = true;
        skillBtn3.classList.add("cooldown");

        const pct = Math.max(0, Math.min(100, (leftMs / skill3CdTotalMs) * 100));
        skillBtn3.style.setProperty("--cdp", pct.toFixed(2) + "%");

        skillBtn3.textContent = "⏳" + leftSec.toFixed(1);
      } else {
        stopSkill3CooldownUI();
        return;
      }
    }

    skill3CdRAF = requestAnimationFrame(tick);
  };

  tick();
}

function syncUI(st){
    // ===== cooldown навыка =====
// ===== cooldown навыка (точный, поддерживает 1.3s) =====
if (skillBtn) {
  const raw =
    (st && (st.skill_cd ?? st.skill_cd_left ?? st.skillCooldown ?? st.skill_cooldown));

  // стартуем по серверу, если сервер прислал
  if (raw !== undefined) {
    const v = Math.max(0, Number(raw) || 0);
    const ms = (v > 1000) ? v : (v * 1000); // если вдруг пришли ms
    startSkillCooldownUI(ms);
  } else {
    // если сервер НЕ прислал, но локально уже идёт КД — не перезапускаем
    if (!skillCdRAF && (typeof window.skill_cd === "number") && window.skill_cd > 0) {
      startSkillCooldownUI(window.skill_cd * 1000);
    }
  }
}

if (skillBtn2) {
  const raw =
    (st && (st.skill2_cd ?? st.skill2_cd_left ?? st.skill2Cooldown ?? st.skill2_cooldown));

    if (skillBtn3) {
  const raw =
    (st && (st.skill3_cd ?? st.skill3_cd_left ?? st.skill3Cooldown ?? st.skill3_cooldown));

  if (raw !== undefined) {
    const v = Math.max(0, Number(raw) || 0);
    const ms = (v > 1000) ? v : (v * 1000);
    startSkill3CooldownUI(ms);
  } else {
    if (!skill3CdRAF && (typeof window.skill3_cd === "number") && window.skill3_cd > 0) {
      startSkill3CooldownUI(window.skill3_cd * 1000);
    }
  }
}

  if (raw !== undefined) {
    const v = Math.max(0, Number(raw) || 0);
    const ms = (v > 1000) ? v : (v * 1000);
    startSkill2CooldownUI(ms);
  } else {
    if (!skill2CdRAF && (typeof window.skill2_cd === "number") && window.skill2_cd > 0) {
      startSkill2CooldownUI(window.skill2_cd * 1000);
    }
  }
}

  // дамаг-флоат по изменению HP босса (если используешь prevBossHp из state.js — оставь его там)
  if (typeof renderStats === "function") renderStats();
  if (typeof updateBossHpBar === "function") updateBossHpBar();
  if (typeof renderInventory === "function") renderInventory();

  if (coinsTxt) coinsTxt.textContent = "💰 " + (coins ?? 0);
  if (woodTxt) woodTxt.textContent = (resources && resources.wood) ? resources.wood : 0;
  if (oreTxt) oreTxt.textContent = (resources && resources.ore !== undefined) ? resources.ore : 0;
  // ===== HERO HUD RENDER =====
if (heroHudLvl) heroHudLvl.textContent = `LVL ${Math.max(1, Number(window.player_lvl ?? player_lvl) || 1)}`;

const _hpMax = Math.max(1, Number(window.hp_max ?? hp_max) || 1);
const _hp = Math.max(0, Number(window.hp ?? hp) || 0);
const _hpPct = Math.max(0, Math.min(100, (_hp / _hpMax) * 100));
if (heroHpFill) heroHpFill.style.width = _hpPct + "%";
if (heroHpText) heroHpText.textContent = `${Math.round(_hp)} / ${Math.round(_hpMax)}`;

const _mpMax = Math.max(1, Number(window.mana_max ?? mana_max) || 1);
const _mp = Math.max(0, Number(window.mana ?? mana) || 0);
const _mpPct = Math.max(0, Math.min(100, (_mp / _mpMax) * 100));
if (heroMpFill) heroMpFill.style.width = _mpPct + "%";
if (heroMpText) heroMpText.textContent = `${Math.round(_mp)} / ${Math.round(_mpMax)}`;

const _xpNeed = Math.max(1, Number(window.player_xp_need ?? player_xp_need) || 1);
const _xp = Math.max(0, Number(window.player_xp ?? player_xp) || 0);
const _xpPct = Math.max(0, Math.min(100, (_xp / _xpNeed) * 100));
if (heroExpFill) heroExpFill.style.width = _xpPct + "%";
if (heroXpText) heroXpText.textContent = `XP: ${Math.round(_xp)} / ${Math.round(_xpNeed)}`;

  refreshNextBtn();
}

let mapToastTimer = null;

function showMapToast(text, ms = 1800){
  if (!mapToast) return;

  mapToast.textContent = text;
  mapToast.classList.add("show");

  if (mapToastTimer) clearTimeout(mapToastTimer);
  mapToastTimer = setTimeout(() => {
    mapToast.classList.remove("show");
    mapToastTimer = null;
  }, ms);
}


function renderStats() {
  if (playerNameTxt) {
    playerNameTxt.textContent = playerName;
  }

  if (coinsTxt) {
    coinsTxt.textContent = "💰 " + coins;
  }

  // если у тебя есть вывод атаки — обновляем
  if (typeof powerTxt !== "undefined" && powerTxt) {
    powerTxt.textContent = "⚔️ " + attack;
  }
  if (bossLvlValue){
  const lvl = Math.max(1, Number(boss_lvl) || 1);
  bossLvlValue.textContent = lvl;

  if (typeof bossLvlHint !== "undefined" && bossLvlHint) {
  const cur = Math.max(1, Number(boss_lvl) || 1);

  const mxRaw =
    (window.boss_lvl_max_reached !== undefined)
      ? window.boss_lvl_max_reached
      : (typeof boss_lvl_max_reached !== "undefined" ? boss_lvl_max_reached : 1);

  const mx = Math.max(1, Number(mxRaw) || 1);

  bossLvlHint.textContent = `Текущий: LVL ${cur} • Максимум: LVL ${mx}`;
}

}

}

// Глобальный флаг для HP над мобом (верхнюю полоску мы убрали).
// ВАЖНО: здесь НЕ трогаем display напрямую, чтобы battle.js сам решал,
// когда показывать полоску (дистанция/смерть/анимации).
function setBossHpVisible(visible){
  window.__forceHideMobHp = !visible;
}
window.setBossHpVisible = setBossHpVisible;

function updateBossHpBar() {
  const maxHp = (Number(boss_max_hp) || 0) > 0 ? Number(boss_max_hp) : 1;
  const hp    = Math.max(0, Number(boss_hp) || 0);

  const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  // полоса над мобом (обычные уровни)
  const headFill = document.getElementById("mobHpFill");
  const headTxt  = document.getElementById("mobHpText");
  if (headFill) headFill.style.width = percent + "%";
  if (headTxt)  headTxt.textContent = `${Math.round(hp)} / ${Math.round(maxHp)}`;

  // ✅ босс-уровни: верхняя большая полоса + скрываем над мобом
  const lvl = Math.max(1, Number(window.boss_lvl ?? boss_lvl) || 1);
  const isBossLevel = (lvl % 5 === 0);

  const topWrap = document.getElementById("bossTopHp");
  if (topWrap) topWrap.classList.toggle("hidden", !isBossLevel);

  const locked = (window.__bossHpLockedHidden === true);

  if (typeof window.setBossHpVisible === "function") {
    if (locked || isBossLevel) window.setBossHpVisible(false); // скрыть над мобом
    else window.setBossHpVisible(true);                        // показать над мобом
  }

  // верхняя полоса (если есть в DOM)
  const bar   = document.getElementById("bossHpFill");
  const label = document.getElementById("bossHpLabel");
  if (bar) bar.style.width = percent + "%";
  if (label) {
    label.textContent = isBossLevel
      ? `👹 БОСС LVL ${lvl} • ${Math.round(hp)} / ${Math.round(maxHp)}`
      : `HP: ${Math.round(hp)} / ${Math.round(maxHp)}`;
  }
}



function showDamage(dmg){
  const el = document.createElement("div");
  el.className = "damage-text";
  el.textContent = dmg;
  document.body.appendChild(el);

  // Пытаемся привязаться к ближайшему мобу
  let rect = null;
  if (typeof getNearestMobInRange === "function") {
    const m = getNearestMobInRange(160);
    if (m && m.el) rect = m.el.getBoundingClientRect();
  }

  // Если моба нет — показываем по центру экрана
  if (!rect) {
    rect = { left: window.innerWidth/2 - 1, top: window.innerHeight/2 - 1, width: 2, height: 2 };
  }

  const startX = rect.left + rect.width / 2;
  const startY = rect.top - 10;

  el.style.left = startX + "px";
  el.style.top  = startY + "px";
  el.style.transform = "translateX(-50%) translateY(0)";
  el.style.opacity = "1";

  requestAnimationFrame(() => {
    el.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out";
    el.style.transform = "translateX(-50%) translateY(-40px)";
    el.style.opacity = "0";
  });

  setTimeout(() => el.remove(), 900);
}

// ===== BOSS DEATH ANIM (SKELETON) =====
const SKELETON_DEAD_FRAMES = Array.from({ length: 6 }, (_, i) =>
  `/static/images/skeleton/dead_far_${i + 1}.png`
);

let bossDeathTimer = null;
let bossDeathLocked = false;

function preloadFrames(list) {
  for (const src of list) {
    const im = new Image();
    im.src = src;
  }
}

function stopBossDeathAnim() {
  if (bossDeathTimer) {
    clearInterval(bossDeathTimer);
    bossDeathTimer = null;
  }
  bossDeathLocked = false;
}

function playBossDeathAnim() {
  const img = document.getElementById("bossImg");
  if (!img) return;

  if (bossDeathLocked) return; // уже проиграли/держим последний кадр
  bossDeathLocked = true;

  preloadFrames(SKELETON_DEAD_FRAMES);

  let i = 0;
  img.src = SKELETON_DEAD_FRAMES[0];

  bossDeathTimer = setInterval(() => {
    i++;

    // дошли до конца -> стоп и держим последний кадр
    if (i >= SKELETON_DEAD_FRAMES.length) {
      clearInterval(bossDeathTimer);
      bossDeathTimer = null;
      img.src = SKELETON_DEAD_FRAMES[SKELETON_DEAD_FRAMES.length - 1];
      return;
    }

    img.src = SKELETON_DEAD_FRAMES[i];
  }, 90); // скорость (мс). Хочешь быстрее: 70, медленнее: 110
}

// dead=true -> запускаем (и в конце держим последний кадр)
// dead=false -> просто снимаем лок (чтобы следующий босс мог нормально рисоваться)
function setBossDeadVisual(dead) {
  if (!dead) {
    stopBossDeathAnim();
    return;
  }
  playBossDeathAnim();
}

window.setBossDeadVisual = setBossDeadVisual;
window.stopBossDeathAnim = stopBossDeathAnim;




function setCollectVisible(visible) {
  if (!lootModal || !lootText || !collectBtn) return;

  if (visible) {
    const lvlRaw = (window.__loot_lvl ?? window.boss_lvl ?? boss_lvl);
const lvl = Math.max(1, Number(lvlRaw) || 1);

// если это не босс-уровень и лута реально нет — просто выходим
if (lvl % 5 !== 0 && pending_loot == null) {
  refreshNextBtn();
  syncOverlayFlag();
  return;
}


    window.__bossHpLockedHidden = true;
if (typeof window.setBossHpVisible === "function") window.setBossHpVisible(false);
    if (wrapper) wrapper.classList.add("loot-open");
if (typeof window.setBattlePaused === "function") window.setBattlePaused(true);
if (typeof window.forceHeroIdleNow === "function") window.forceHeroIdleNow();


    lootModal.classList.remove("hidden");
    lootModal.classList.add("active");

    const lootLine = formatLoot(pending_loot);
    lootText.textContent = lootLine ? ("Награда:\n" + lootLine) : "Награда:";

    collectBtn.style.display = "inline-block";
    collectBtn.disabled = false;
    collectBtn.textContent = "Забрать";

    refreshNextBtn(); // пока окно открыто — "Дальше" будет disabled (в refreshNextBtn)
  } else {
    if (wrapper) wrapper.classList.remove("loot-open");
if (typeof window.setBattlePaused === "function") window.setBattlePaused(false);

    lootModal.classList.add("hidden");
    lootModal.classList.remove("active");

    collectBtn.style.display = "none";
    refreshNextBtn();
    syncOverlayFlag();
  }
}

// НЕ закрываем окно по клику на фон — только через "Забрать"
if (lootModal) {
  lootModal.addEventListener("click", (e) => e.stopPropagation());
}


function formatLoot(loot) {
  if (loot == null) return "";

  // если сервер прислал строку — просто показываем
  if (typeof loot === "string") return loot;

  // если сервер прислал event {coins, resources:{...}}
  if (typeof loot === "object") {
    const parts = [];

    // монеты
    if (loot.coins != null) parts.push(`💰 ${loot.coins}`);

    // ресурсы могут быть ЛИБО прямо (loot.wood), ЛИБО вложенно (loot.resources.wood)
    const resObj = (loot.resources && typeof loot.resources === "object") ? loot.resources : loot;

    for (const [k, v] of Object.entries(resObj)) {
      if (k === "coins" || k === "resources") continue;
      if (v == null) continue;
      if (Number(v) === 0) continue;

      if (k === "wood") parts.push(`🪵 ${v}`);
      else parts.push(`${k}: ${v}`);
    }

    return parts.join("\n");
  }

  return String(loot);
}

function renderForgeHud(st){
  // st необязателен: берём либо из st, либо из текущих переменных
  const lvl = (st && st.forge_lvl !== undefined) ? st.forge_lvl : forge_lvl;
  const xp  = (st && st.forge_xp  !== undefined) ? st.forge_xp  : forge_xp;

   const need =
    (st && (st.forge_xp_need ?? st.forge_xp_to_next ?? st.forge_xp_max)) ??
    forge_xp_need ??
    100;

  const safeNeed = Math.max(1, Number(need) || 100);
  const safeXp   = Math.max(0, Number(xp) || 0);

  const percent = Math.max(0, Math.min(100, (safeXp / safeNeed) * 100));

  if (forgeLvlTxt) forgeLvlTxt.textContent = `Кузня LVL ${lvl}`;
  if (forgeXpFill) forgeXpFill.style.width = percent + "%";
  if (forgeXpTxt)  forgeXpTxt.textContent  = `XP: ${safeXp} / ${safeNeed}`;

  // ресурсы для HUD кузни
  const c = (st && st.coins !== undefined) ? st.coins : coins;

  // wood может быть в st.resources.wood или в текущем resources.wood
  const w =
    (st && st.resources && st.resources.wood !== undefined) ? st.resources.wood :
    (resources && resources.wood !== undefined) ? resources.wood :
    0;

  if (forgeCoinsTxt) forgeCoinsTxt.textContent = c ?? 0;
  if (forgeWoodTxt)  forgeWoodTxt.textContent  = w ?? 0;
  const o =
  (st && st.resources && st.resources.ore !== undefined) ? st.resources.ore :
  (resources && resources.ore !== undefined) ? resources.ore :
  0;

if (forgeOreTxt) forgeOreTxt.textContent = o ?? 0;


  // ===== цена крафта (если бэк прислал) =====
const costObj =
  st?.craft_cost_preview ??
  st?.craft_cost ??
  st?.forge_craft_cost ??
  st?.craft_price ??
  null;

const costRes =
  (costObj && typeof costObj === "object" && costObj.resources && typeof costObj.resources === "object")
    ? costObj.resources
    : null;

const costCoins = Number(
  st?.craft_cost_coins ?? costObj?.coins ?? costObj?.coin ?? 0
) || 0;

const costWood = Number(
  st?.craft_cost_wood ?? costRes?.wood ?? costObj?.wood ?? 0
) || 0;

const costOre = Number(
  st?.craft_cost_ore ?? costRes?.ore ?? costObj?.ore ?? 0
) || 0;

if (craftCostTxt){
  const hasAnyCostField =
    st?.craft_cost_preview !== undefined ||
    st?.craft_cost !== undefined ||
    st?.craft_cost_coins !== undefined ||
    st?.craft_cost_wood !== undefined ||
    st?.craft_cost_ore !== undefined;

  if (!hasAnyCostField) {
    craftCostTxt.textContent = "Стоимость: —";
    craftCostTxt.classList.remove("craft-cost--bad");
  } else {
    const parts = [];
    if (costCoins > 0) parts.push(`💰 ${costCoins}`);
    if (costWood  > 0) parts.push(`🪵 ${costWood}`);
    if (costOre   > 0) parts.push(`<span class="ore-ico" aria-hidden="true"></span> ${costOre}`);

    craftCostTxt.innerHTML = parts.length
      ? `Стоимость: ${parts.join("  ")}`
      : "Стоимость: бесплатно";

    const haveCoins = Number(c) || 0;
    const haveWood  = Number(w) || 0;
    const haveOre   = Number(o) || 0;

    const ok = (haveCoins >= costCoins) && (haveWood >= costWood) && (haveOre >= costOre);
    craftCostTxt.classList.toggle("craft-cost--bad", !ok);
  }
}


}

function renderCraftResult(st) {
  if (!craftResult || !weaponCard) return;

  craftResult.classList.remove("hidden"); // ✅ ВАЖНО

  // ✅ если крафт неудачный — показываем fail-картинку вместо оружия
  if (st && st._craftFail) {
    weaponCard.className = "weapon-card craft-fail";

    weaponName.textContent = "Крафт неудачный";
    weaponAtk.textContent = "";
    weaponMeta.textContent = "";

    weaponImg.style.display = "";
    weaponImg.onerror = () => { weaponImg.style.display = "none"; };
    weaponImg.src = "/static/images/forge_fail.png"; // <-- положи картинку сюда

    weaponCard.removeAttribute("data-lvl");
    return;
  }

  const w = st.equipped_weapon ? st.equipped_weapon : st;

  const rarity = w.rarity || "common";
  const weaponLvl = w.lvl ?? 0;
  const roll = w.roll ?? 1.0;
  const attackVal = getItemAtk(w);

  weaponCard.className = "weapon-card rarity-" + rarity;

  weaponName.textContent = `Оружие (${rarity})`;
  weaponAtk.textContent = `+${attackVal} атаки`;
  weaponMeta.textContent = `lvl ${weaponLvl}`; // roll убираем (ты не хочешь)

  weaponImg.onerror = () => { weaponImg.style.display = "none"; };
weaponImg.style.display = "";
weaponImg.src = weaponSpriteUrl(rarity, weaponLvl);

weaponCard.setAttribute("data-lvl", "LVL " + weaponLvl);

}

function showForgeDrop(item){
  pendingForgeItem = item;

  forgeDropSlot.classList.remove(
    "rarity-common","rarity-uncommon","rarity-rare","rarity-epic","rarity-legendary"
  );

  forgeDrop.classList.remove("hidden");

  // ✅ редкость на слот (как в инвентаре)
  const r = String(item.rarity || "common").toLowerCase();

  forgeDropSlot.classList.remove(
    "rarity-common","rarity-uncommon","rarity-rare","rarity-epic","rarity-legendary"
  );
  forgeDropSlot.classList.add(`rarity-${r}`);

  forgeDropSlot.innerHTML = `
    <img 
      src="${item.icon}" 
      class="forge-drop-item"
      alt=""
    />
    <div class="item-level">UR ${item.level}</div>
  `;


  img.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    takeForgeDrop();
  });
}

function clampBossLvl(v){
  const n = parseInt(v, 10);
  return Math.max(1, Number.isFinite(n) ? n : 1);
}

if (bossLvlDown && bossLvlInput){
  bossLvlDown.onclick = () => {
    bossLvlInput.value = clampBossLvl(bossLvlInput.value) - 1;
    bossLvlInput.value = clampBossLvl(bossLvlInput.value);
  };
}

if (bossLvlUp && bossLvlInput){
  bossLvlUp.onclick = () => {
    bossLvlInput.value = clampBossLvl(bossLvlInput.value) + 1;
  };
}

if (bossLvlApply && bossLvlInput){
  bossLvlApply.onclick = async () => {
    const lvl = clampBossLvl(bossLvlInput.value);

    const maxReached = Math.max(1, Number(window.boss_lvl_max_reached || 1));

if (lvl > maxReached){
  if (bossLvlInput) bossLvlInput.value = maxReached; // откатить инпут
  showMapToast(`Нельзя выбрать LVL ${lvl}.\nТвой максимум: LVL ${maxReached}`, 2000);
  return;
}


    const old = bossLvlApply.textContent;
    bossLvlApply.disabled = true;
    bossLvlApply.textContent = "⏳";

    try{
      if (typeof window.setBossLevel === "function"){
        await window.setBossLevel(lvl);
        if (typeof window.resetEncounter === "function") {
  window.resetEncounter({ startMode: "approach", keepBackground: true });
}
        const cur = Math.max(1, Number(boss_lvl || lvl) || 1);

const mxRaw =
  (window.boss_lvl_max_reached !== undefined)
    ? window.boss_lvl_max_reached
    : (typeof boss_lvl_max_reached !== "undefined" ? boss_lvl_max_reached : 1);

const mx = Math.max(1, Number(mxRaw) || 1);

if (bossLvlHint) bossLvlHint.textContent = `Текущий: LVL ${cur} • Максимум: LVL ${mx}`;

      }
    }catch(e){
      console.log("setBossLevel error:", e);
      if (typeof showErrorToast === "function") showErrorToast("Не удалось сменить уровень");
    }finally{
      bossLvlApply.disabled = false;
      bossLvlApply.textContent = old;
    }
  };
}


function hideForgeDrop(){
  pendingForgeItem = null;
  forgeDrop.classList.add("hidden");
}

function placeForgeUpgradeBtn() { 
  if (!hud || !btn) return;

  // расстояние между HUD и кнопкой
  const GAP = 10;

  const top = hud.offsetTop + hud.offsetHeight + GAP;
  btn.style.top = top + "px";
}

if (forgeUpgradeBtn) {
  forgeUpgradeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    upgradeForge();
  });
}

function takeForgeDrop(){
  if (!pendingForgeItem) {
    console.log("[forge] click, but pendingForgeItem is null");
    return;
  }

  const items = Array.isArray(inventory)
    ? inventory
    : (inventory.items ?? (inventory.items = []));

  items.push(pendingForgeItem);

  pendingForgeItem = null;

  hideForgeDrop();
  renderInventory();

  console.log("[forge] taken -> inventory");
}

if (craftResult) {
  craftResult.addEventListener("click", takeCraftedFromForgeUI);
}
if (weaponCard) {
  weaponCard.addEventListener("click", takeCraftedFromForgeUI);
}

function takeCraftedFromForgeUI(e){
  if (e) { e.preventDefault(); e.stopPropagation(); }

  if (!pendingForgeItem) return;

  // предмет уже мог быть в инвентаре (потому что applyState(st) его туда кладёт)
  // поэтому тут мы НЕ пушим в inventory, чтобы не было дублей

  pendingForgeItem = null;

  // спрятать центральный слот (то, что ты видишь)
  if (craftResult) craftResult.classList.add("hidden");

  // на всякий случай обновить инвентарь (если надо)
  if (typeof renderInventory === "function") renderInventory();
}

// ЛОВИМ КЛИК ДО ВСЕХ ДРУГИХ обработчиков (capture=true)
document.addEventListener("click", (e) => {
  // меняй селектор под твой реальный слот/картинку:
  const hit = e.target.closest("#forgeDropSlot, #forgeDropImg, .forge-drop-slot, .forge-drop-item");
  if (!hit) return;

  console.log("[forge] click captured on", hit);

  e.preventDefault();
  e.stopPropagation();

  takeForgeDrop();
}, true);

forgeDropTakeBtn.addEventListener("click", () => {
  if (!pendingForgeItem) return;

  // 1) кладём в инвентарь (учёт твоей структуры)
  if (Array.isArray(inventory)) {
    inventory.push(pendingForgeItem);
  } else {
    if (!inventory || typeof inventory !== "object") inventory = {};
    if (!Array.isArray(inventory.items)) inventory.items = [];
    inventory.items.unshift(pendingForgeItem);

  }

  // 2) скрываем дроп и обновляем инвентарь
  hideForgeDrop();
  renderInventory();
});

forgeDropSlot.addEventListener("click", () => {
  if (!pendingForgeItem) return;

  // 1) добавить предмет в инвентарь
  if (Array.isArray(inventory)) {
    inventory.push(pendingForgeItem);
  } else {
    inventory.items.push(pendingForgeItem);
  }

  // 2) очистить слот кузни
  pendingForgeItem = null;

  hideForgeDrop();      // у тебя уже есть
  renderInventory();   // у тебя уже есть
});

function closeItemModal(){
  if (!itemModal) return;
  itemModal.classList.add("hidden");
  syncOverlayFlag();
  window.__openedItem = null;
pendingBreakArmed = false;
if (itemModalBreakBtn) itemModalBreakBtn.textContent = "Сломать";
}

function formatWeaponModifierLine(it){
  if (!it) return "";

  const rarity = String(it.rarity || "common");
  const mod = it.modifier || {};
  const modId = (typeof mod === "string") ? mod : mod.id;

  if (!modId) return "";

  if (modId === "bleeding_edge"){
    const CFG = {
      common:    { chance: 0.10, dps_pct: 0.03, duration: 4 },
      uncommon:  { chance: 0.12, dps_pct: 0.035, duration: 4 },
      rare:      { chance: 0.14, dps_pct: 0.04, duration: 5 },
      epic:      { chance: 0.16, dps_pct: 0.05, duration: 5 },
      legendary: { chance: 0.20, dps_pct: 0.06, duration: 6 },
    };

    const c = CFG[rarity] || CFG.common;
    const chance = Math.round(c.chance * 100);
    const percent = Math.round(c.dps_pct * 100);

    return `С шансом ${chance}% накладывает на противника кровотечение: ${percent}% от базового урона оружия в секунду в течение ${c.duration} сек.`;
  }

  return `Модификатор: ${modId}`;
}


function openItemModal(it){
  if (!itemModal) return;
  window.__openedItem = it;
  console.log("OPEN ITEM OBJ =", it);
pendingBreakArmed = false;
if (itemModalBreakBtn) itemModalBreakBtn.textContent = "Сломать";
  const id = it.id ?? it.weapon_id ?? it.uid;
  const rarity = it.rarity ?? "common";
  const lvl = it.lvl ?? 0;
  const atk = getItemAtk(it);


  // подсветка окна под редкость
  if (itemModalCard) itemModalCard.className = `item-modal__card rarity-${rarity}`;

 const RARITY_RU = {
  common: "Обычный",
  uncommon: "Необычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

if (itemModalLvl) itemModalLvl.textContent = `Ур. ${lvl}`;
if (itemModalRarity) itemModalRarity.textContent = RARITY_RU[rarity] || "Обычный";


  // контент
  if (itemModalAtk) itemModalAtk.textContent = `${atk} Атаки`;
  if (itemModalMod){
  const line = formatWeaponModifierLine(it);
  itemModalMod.textContent = line;
  itemModalMod.style.display = line ? "" : "none";
}

  if (itemModalMeta) itemModalMeta.textContent = "";

  if (itemModalImg) {
    itemModalImg.onerror = () => { itemModalImg.style.display = "none"; };
    itemModalImg.style.display = "";
    itemModalImg.src = weaponSpriteUrl(rarity, lvl);
  }

  // кнопка экипа
  const isEq = (equipped_weapon_id !== null && equipped_weapon_id === id);
  if (itemModalEquipBtn) {
    itemModalEquipBtn.disabled = isEq;
    itemModalEquipBtn.textContent = isEq ? "Надето" : "Надеть";

    itemModalEquipBtn.onclick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (equipped_weapon_id === id) return;

      // мгновенно меняем UI
      equipped_weapon_id = id;
      itemModalEquipBtn.disabled = true;
      itemModalEquipBtn.textContent = "Надето";

      // сброс подтверждения "сломать"
pendingBreakItemId = it.id;
pendingBreakArmed = false;
if (itemModalBreakBtn){
  itemModalBreakBtn.textContent = "Сломать";
  itemModalBreakBtn.disabled = false;
}

      renderInventory();
      await equipWeapon(id);
    };
  }

  itemModal.classList.remove("hidden");
  syncOverlayFlag();
}

function showWeaponDetails(it){
  if (!it || !invWeaponCard) return;

  const rarity = (it.rarity ?? "common");
  const lvl = (it.lvl ?? 0);

  invWeaponCard.style.display = "flex";
  if (invWeaponImg) invWeaponImg.src = weaponSpriteUrl(rarity, lvl);
  if (invWeaponName) invWeaponName.textContent = (it.name ?? "Оружие");
  if (invWeaponAtk) invWeaponAtk.textContent = `ATK: ${getItemAtk(it)}`;
  if (invWeaponMeta) invWeaponMeta.textContent = `${rarity} • lvl ${lvl}`;
}

function renderInventory() {
  if (!invGrid) return;

  const items = Array.isArray(inventory)
    ? inventory
    : (inventory && Array.isArray(inventory.items) ? inventory.items : []);

  invGrid.innerHTML = "";

  const SLOTS = 35; // 5 x 7

  for (let i = 0; i < SLOTS; i++) {
    const it = items[i] || null;

        const slot = document.createElement("div");
    const img = document.createElement("img");


    slot.className = "inv-slot"; // базовый класс

    // пустой слот
    if (!it) {
      invGrid.appendChild(slot);
      continue;
    }

    // ✅ данные предмета (после проверки it!)
    const id = (it.id ?? it.weapon_id ?? it.uid ?? `slot_${i}`);
    const rarity = (it.rarity ?? "common");
    const lvl = (it.lvl ?? 0);

    // ✅ редкость подсвечивается ВСЕГДА
    slot.className = `inv-slot filled rarity-${rarity}`;

    slot.innerHTML = `<div class="slot-level">lvl ${lvl}</div>`;

img.className = "slot-img";
img.src = weaponSpriteUrl(rarity, lvl);
img.onerror = () => img.remove();
slot.appendChild(img);

    // авто-выбор первого предмета
    if (selectedWeaponId === null) {
      selectedWeaponId = id;
      showWeaponDetails(it);
    }

    // выделение выбранного
    if (selectedWeaponId === id) slot.classList.add("selected");

    // клик по слоту
    slot.onclick = () => {
  selectedWeaponId = id;
  renderInventory();
  openItemModal(it);
  };

    invGrid.appendChild(slot);
  }

  // если инвентарь пустой — скрываем карточку
  if (!items.length) {
    selectedWeaponId = null;
    if (invWeaponCard) invWeaponCard.style.display = "none";
  }
}

if (itemModalBackdrop) itemModalBackdrop.onclick = closeItemModal;
if (itemModalClose) itemModalClose.onclick = closeItemModal;