(() => {
  // если battle.js уже запускался — прибьём старые таймеры/рафы
if (typeof window.__battleCleanup === "function") window.__battleCleanup();



// ===== DOM refs (battle.js must be independent) =====
const wrapper = document.querySelector(".game-wrapper");

function getWrapperScale(){
  if (!wrapper) return 1;

  const cs = getComputedStyle(wrapper);

  // 1) CSS-переменная
  const v = parseFloat(cs.getPropertyValue("--ui-scale"));
  if (Number.isFinite(v) && v > 0) return v;

  // 2) fallback: matrix(...) / matrix3d(...)
  const tr = cs.transform;
  if (tr && tr !== "none") {
    const m3 = tr.match(/matrix3d\(([^)]+)\)/);
    if (m3) {
      const a = parseFloat(m3[1].split(",")[0]);
      if (Number.isFinite(a) && a > 0) return a;
    }
    const m2 = tr.match(/matrix\(([^)]+)\)/);
    if (m2) {
      const a = parseFloat(m2[1].split(",")[0]);
      if (Number.isFinite(a) && a > 0) return a;
    }
  }
  return 1;
}
// === DISABLE NORMAL TAPS (урон только от скилла) ===
if (wrapper) {
  const allowSel = [
    "#skillBtn",
    "button",
    ".skills-panel",
    ".bottom-menu",
    ".modal",
    ".full-modal",
    ".fullscreen-screen",
    ".loot-overlay",
    ".item-modal"
  ].join(",");

  const blockTap = (e) => {
    // разрешаем клики только по UI/кнопкам/окнам
    if (e.target && e.target.closest(allowSel)) return;

    // всё остальное по сцене — глушим (чтобы не было обычной атаки по клику)
    e.preventDefault();
    e.stopPropagation();
  };

  wrapper.addEventListener("pointerdown", blockTap, true);
  wrapper.addEventListener("click", blockTap, true);
}


const heroEl = document.querySelector(".hero"); // #hero тоже ок
const inventoryModal = document.getElementById("inventoryModal");
const forgeModal = document.getElementById("forgeModal");
const mapScreen = document.getElementById("mapScreen");
const lootModal = document.getElementById("lootModal");

const nextWaveBtn = null;
const sceneEl = document.getElementById("scene");

const bgA = document.getElementById("bgA");
const bgB = document.getElementById("bgB");

// у тебя в HTML сейчас НЕТ golem/bossImg, но battle.js их дергает — объявляем чтобы не было ReferenceError
const golem = document.getElementById("golem");     // будет null — ок
const bossImg = document.getElementById("bossImg"); // будет null — ок

let mobs = [];
let waveIndex = 0;
let lastWaveTime = performance.now();
let best = null;
let bestD = 1e9;
let isRunning = true;
let bgX1 = 0;
let bgX2 = 0;
let bgSpeed = 100;
let lastBgTime = performance.now();
let heroRunTimer = null;
let heroRunIndex = 0;
let heroIdleTimer = null;
let heroIdleIndex = 0;
let heroAtkTimer = null;
let heroAtkIndex = 0;
let heroIsAttacking = false;
let heroHitTimer = null;
let heroHitIndex = 0;
let heroIsHit = false;
let mobHpWrap = null;
let mobHpFill = null;
let mobHpName = null;
let golemIsHitAnimating = false;
let bossAnimTimer = null;
let bossAnimFrame = 0;
let activeBossId = "golem";
let comboIndex = 0;
let isAttacking = false;
let queuedNext = false;
let lastClickAt = 0;
let attackTimer = null;
let i = 0;
let pendingSkillAttack = false;
let pendingSkillRequest = false;
let pendingSkill2Attack = false;
let pendingSkill2Request = false;
let pendingSkill3Attack = false;
let pendingSkill3Request = false;
let battlePaused = false;

window.__battleBgRafId = window.__battleBgRafId || null;
window.__battleRafId   = window.__battleRafId   || null;

window.__battleCleanup = function(){
  try{
    if (window.__battleBgRafId) cancelAnimationFrame(window.__battleBgRafId);
    if (window.__battleRafId)   cancelAnimationFrame(window.__battleRafId);
  } catch(e){}
  window.__battleBgRafId = null;
  window.__battleRafId   = null;

  // таймеры героя/комбо/босса
  if (heroRunTimer){ clearInterval(heroRunTimer); heroRunTimer = null; }
  if (heroIdleTimer){ clearInterval(heroIdleTimer); heroIdleTimer = null; }
  if (heroAtkTimer){ clearInterval(heroAtkTimer); heroAtkTimer = null; }
  if (heroHitTimer){ clearInterval(heroHitTimer); heroHitTimer = null; }
  if (attackTimer){ clearInterval(attackTimer); attackTimer = null; }
  if (bossAnimTimer){ clearInterval(bossAnimTimer); bossAnimTimer = null; }
};



const SKELETON_WALK = [
  "/static/images/skeleton_sword/walk/walk_1.png",
  "/static/images/skeleton_sword/walk/walk_2.png",
  "/static/images/skeleton_sword/walk/walk_3.png",
  "/static/images/skeleton_sword/walk/walk_4.png",
  "/static/images/skeleton_sword/walk/walk_5.png",
  "/static/images/skeleton_sword/walk/walk_6.png",
];
const SKELETON_IDLE = [
  "/static/images/skeleton_sword/ready/ready_1.png",
  "/static/images/skeleton_sword/ready/ready_2.png",
  "/static/images/skeleton_sword/ready/ready_3.png",
];

const SKELETON_ATK_1 = [
  "/static/images/skeleton_sword/attack1/attack1_1.png",
  "/static/images/skeleton_sword/attack1/attack1_2.png",
  "/static/images/skeleton_sword/attack1/attack1_3.png",
  "/static/images/skeleton_sword/attack1/attack1_4.png",
  "/static/images/skeleton_sword/attack1/attack1_5.png",
  "/static/images/skeleton_sword/attack1/attack1_6.png",
];

const SKELETON_ATK_2 = [
  "/static/images/skeleton_sword/attack2/attack2_1.png",
  "/static/images/skeleton_sword/attack2/attack2_2.png",
  "/static/images/skeleton_sword/attack2/attack2_3.png",
  "/static/images/skeleton_sword/attack2/attack2_4.png",
  "/static/images/skeleton_sword/attack2/attack2_5.png",
  "/static/images/skeleton_sword/attack2/attack2_6.png",
];

const SKELETON_READY = [
  "/static/images/skeleton_sword/ready/ready_1.png",
  "/static/images/skeleton_sword/ready/ready_2.png",
  "/static/images/skeleton_sword/ready/ready_3.png",
];

const SKELETON_HIT = [
  "/static/images/skeleton_sword/hit/hit_1.png",
  "/static/images/skeleton_sword/hit/hit_2.png",
  "/static/images/skeleton_sword/hit/hit_3.png",
];

const SKELETON_DEAD_FAR = [
  "/static/images/skeleton_sword/dead_far/dead_far_1.png",
  "/static/images/skeleton_sword/dead_far/dead_far_2.png",
  "/static/images/skeleton_sword/dead_far/dead_far_3.png",
  "/static/images/skeleton_sword/dead_far/dead_far_4.png",
  "/static/images/skeleton_sword/dead_far/dead_far_5.png",
  "/static/images/skeleton_sword/dead_far/dead_far_6.png",
];

// ===== REAPER (boss lvl 5) =====
// файлы: reaper-move-000.png ... reaper-move-003.png
// лежат тут: /static/images/reaper/
const REAPER_MOVE = [
  "/static/images/reaper/reaper-move-000.png",
  "/static/images/reaper/reaper-move-001.png",
  "/static/images/reaper/reaper-move-002.png",
  "/static/images/reaper/reaper-move-003.png",
];

const REAPER_IDLE = [
  "/static/images/reaper/reaper-idle-000.png",
  "/static/images/reaper/reaper-idle-001.png",
  "/static/images/reaper/reaper-idle-002.png",
  "/static/images/reaper/reaper-idle-003.png",
];

const REAPER_ATTACK = [
  "/static/images/reaper/reaper-attack-000.png",
  "/static/images/reaper/reaper-attack-001.png",
  "/static/images/reaper/reaper-attack-002.png",
  "/static/images/reaper/reaper-attack-003.png",
  "/static/images/reaper/reaper-attack-004.png",
];

const REAPER_DIE = [
  "/static/images/reaper/reaper-die-000.png",
  "/static/images/reaper/reaper-die-001.png",
  "/static/images/reaper/reaper-die-002.png",
  "/static/images/reaper/reaper-die-003.png",
  "/static/images/reaper/reaper-die-004.png",
  "/static/images/reaper/reaper-die-005.png",
  "/static/images/reaper/reaper-die-006.png",
  "/static/images/reaper/reaper-die-007.png",
  "/static/images/reaper/reaper-die-008.png",
  "/static/images/reaper/reaper-die-009.png",
  "/static/images/reaper/reaper-die-010.png",
];

// ===== PHANTOM KNIGHT (boss lvl 10) =====
// файлы: phantom-knight-run-00.png ... phantom-knight-run-05.png
// лежат тут: /static/images/phantom_knight/
const PHANTOM_RUN = [
  "/static/images/phantom_knight/phantom-knight-run-00.png",
  "/static/images/phantom_knight/phantom-knight-run-01.png",
  "/static/images/phantom_knight/phantom-knight-run-02.png",
  "/static/images/phantom_knight/phantom-knight-run-03.png",
  "/static/images/phantom_knight/phantom-knight-run-04.png",
  "/static/images/phantom_knight/phantom-knight-run-05.png",
];

const PHANTOM_IDLE = [
  "/static/images/phantom_knight/phantom-knight-idle-00.png",
  "/static/images/phantom_knight/phantom-knight-idle-01.png",
  "/static/images/phantom_knight/phantom-knight-idle-02.png",
  "/static/images/phantom_knight/phantom-knight-idle-03.png",
];

// ===== PHANTOM KNIGHT (boss lvl 10) =====
const PHANTOM_ATTACK1 = [
  "/static/images/phantom_knight/phantom-knight-attack1-00.png",
  "/static/images/phantom_knight/phantom-knight-attack1-01.png",
  "/static/images/phantom_knight/phantom-knight-attack1-02.png",
  "/static/images/phantom_knight/phantom-knight-attack1-03.png",
  "/static/images/phantom_knight/phantom-knight-attack1-04.png",
  "/static/images/phantom_knight/phantom-knight-attack1-05.png",
  "/static/images/phantom_knight/phantom-knight-attack1-06.png",
];

const PHANTOM_HURT = [
  "/static/images/phantom_knight/phantom-knight-hurt-00.png",
  "/static/images/phantom_knight/phantom-knight-hurt-01.png",
  "/static/images/phantom_knight/phantom-knight-hurt-02.png",
];

const PHANTOM_DIE = [
  "/static/images/phantom_knight/phantom-knight-die-00.png",
  "/static/images/phantom_knight/phantom-knight-die-01.png",
  "/static/images/phantom_knight/phantom-knight-die-02.png",
  "/static/images/phantom_knight/phantom-knight-die-03.png",
  "/static/images/phantom_knight/phantom-knight-die-04.png",
  "/static/images/phantom_knight/phantom-knight-die-05.png",
  "/static/images/phantom_knight/phantom-knight-die-06.png",
  "/static/images/phantom_knight/phantom-knight-die-07.png",
];

// чтобы не мерцало при первом проигрывании
SKELETON_DEAD_FAR.forEach(src => { const img = new Image(); img.src = src; });
PHANTOM_RUN.forEach(src => { const img = new Image(); img.src = src; });

function startMobHit(m){
  if (!m || !m.el || !m.alive) return;

  if (m.isDeadAnim) return;

  // если моб сейчас бьёт — ставим хит в очередь (после атаки покажем)
  if (m.isAttacking) {
    m.pendingHit = true;
    return;
  }

  // если уже в hit — не спамим
  if (m.isHit) return;

  m.isHit = true;

  // ✅ кадры хита (важно, иначе tickMobHit второй версии упадёт)
  m.hitFrames = (m.framesHit && m.framesHit.length) ? m.framesHit : SKELETON_HIT;
  m.hitMs = m.hitMs || 90;

  m.hitI = 0;
  m.hitT = 0;
  m.el.style.backgroundImage = `url("${m.hitFrames[0]}")`;
}



function tickMobHit(m, dt){
  if (!m.isHit) return false;

  m.hitT += dt * 1000;
  if (m.hitT >= m.hitMs) {
    m.hitT = 0;
    m.hitI++;

    if (m.hitI >= m.hitFrames.length) {
      // hit закончен
      m.isHit = false;
      m.hitFrames = null;
      m.hitI = 0;
      m.hitT = 0;

      // вернуться в idle (красиво и предсказуемо)
      m.idleI = 0;
      m.idleT = 0;
      m.el.style.backgroundImage = `url("${m.framesIdle[0]}")`;
      return false;
    }

    m.el.style.backgroundImage = `url("${m.hitFrames[m.hitI]}")`;
  }

  return true; // hit всё ещё играет
}


if (nextWaveBtn){
  nextWaveBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    waveIndex++;
    spawnWave();
  });
}
function initBackground() {
  const w = wrapper.clientWidth;
  bgX1 = 0;
  bgX2 = w;

  bgA.style.transform = `translateX(${bgX1}px)`;
  bgB.style.transform = `translateX(${bgX2}px)`;
}

function hitGolem() {
  if (!golem) return;
  if (golemIsHitAnimating) return; // ⛔ блокируем спам

  golemIsHitAnimating = true;
  golem.classList.add("golem--hit");

  setTimeout(() => {
    golem.classList.remove("golem--hit");
    golemIsHitAnimating = false; // ✅ можно снова бить
  }, 150);
}

function updateBackground() {
  const now = performance.now();
  const dt = (now - lastBgTime) / 1000; // секунды
  lastBgTime = now;

  const w = wrapper.clientWidth;
  const dx = (isRunning ? bgSpeed : 0) * dt;

  bgX1 -= dx;
  bgX2 -= dx;

  if (bgX1 <= -w) bgX1 = bgX2 + w;
  if (bgX2 <= -w) bgX2 = bgX1 + w;

  bgA.style.transform = `translateX(${bgX1}px)`;
  bgB.style.transform = `translateX(${bgX2}px)`;

  window.__battleBgRafId = requestAnimationFrame(updateBackground);

}

const HERO_RUN_FRAMES = [
  "/static/images/hero/run/run_1.png",
  "/static/images/hero/run/run_2.png",
  "/static/images/hero/run/run_3.png",
  "/static/images/hero/run/run_4.png",
  "/static/images/hero/run/run_5.png",
  "/static/images/hero/run/run_6.png",
  "/static/images/hero/run/run_7.png",
  "/static/images/hero/run/run_8.png",
];

const HERO_RUN_FPS = 12;

const HERO_IDLE_FRAMES = [
  "/static/images/hero/idle/idle_1.png",
  "/static/images/hero/idle/idle_2.png",
  "/static/images/hero/idle/idle_3.png",
  "/static/images/hero/idle/idle_4.png",
  "/static/images/hero/idle/idle_5.png",
  "/static/images/hero/idle/idle_6.png",
  "/static/images/hero/idle/idle_7.png",
  "/static/images/hero/idle/idle_8.png",
  "/static/images/hero/idle/idle_9.png",
  "/static/images/hero/idle/idle_10.png",
];

const HERO_IDLE_FPS = 8; // idle медленнее, чем бег

const HERO_ATK_FRAMES = [
  "/static/images/hero/attack/1_atk_1.png",
  "/static/images/hero/attack/1_atk_2.png",
  "/static/images/hero/attack/1_atk_3.png",
  "/static/images/hero/attack/1_atk_4.png",
  "/static/images/hero/attack/1_atk_5.png",
  "/static/images/hero/attack/1_atk_6.png",
  "/static/images/hero/attack/1_atk_7.png",
  "/static/images/hero/attack/1_atk_8.png",
];

const HERO_ATK_FPS = 14;

const HERO_HIT_FRAMES = [
  "/static/images/hero/hit/take_hit_1.png",
  "/static/images/hero/hit/take_hit_2.png",
  "/static/images/hero/hit/take_hit_3.png",
  "/static/images/hero/hit/take_hit_4.png",
  "/static/images/hero/hit/take_hit_5.png",
  "/static/images/hero/hit/take_hit_6.png",
];

const HERO_HIT_FPS = 18;

const HERO_ATK2_FRAMES = [
  "/static/images/hero/attack1/2_atk_1.png",
  "/static/images/hero/attack1/2_atk_2.png",
  "/static/images/hero/attack1/2_atk_3.png",
  "/static/images/hero/attack1/2_atk_4.png",
  "/static/images/hero/attack1/2_atk_5.png",
  "/static/images/hero/attack1/2_atk_6.png",
];

const HERO_ATK2_FPS = 14;


// ✅ preload: держим Image-объекты живыми (иначе Telegram WebView может выгружать/мигать)
window.__preloadImgs = window.__preloadImgs || new Map();

function preloadImages(list){
  for (const src of (list || [])) {
    if (!src) continue;
    if (window.__preloadImgs.has(src)) continue;

    const img = new Image();
    img.decoding = "sync"; // меньше шансов на "пустой" кадр
    img.src = src;

    // форсим декодирование (если поддерживается)
    img.onload = () => { try { img.decode && img.decode(); } catch(e){} };

    window.__preloadImgs.set(src, img);
  }
}

preloadImages([
  ...HERO_RUN_FRAMES,
  ...HERO_IDLE_FRAMES,
  ...HERO_ATK_FRAMES,
  ...HERO_HIT_FRAMES,

  ...SKELETON_WALK,
  ...SKELETON_IDLE,
  ...SKELETON_ATK_1,
  ...SKELETON_ATK_2,
  ...SKELETON_HIT,
  ...SKELETON_READY,
  ...HERO_ATK2_FRAMES,
  ...REAPER_MOVE,
  ...REAPER_IDLE,
  ...REAPER_ATTACK,
  ...REAPER_DIE,
  ...PHANTOM_IDLE,
  ...PHANTOM_ATTACK1,
  ...PHANTOM_HURT,
  ...PHANTOM_DIE,
]);



function playHeroAttack(){
  if (heroIsHit) {
    pendingSkillAttack = true;
    return;
  }
  if (!heroEl) return;
  if (heroIsAttacking) return;

  heroIsAttacking = true;

  // стопаем run и idle
  if (heroRunTimer){
    clearInterval(heroRunTimer);
    heroRunTimer = null;
  }
  if (heroIdleTimer){
    clearInterval(heroIdleTimer);
    heroIdleTimer = null;
  }

  heroEl.classList.remove("hero--run", "hero--idle");
  heroEl.classList.add("hero--atk");

  heroAtkIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_ATK_FRAMES[0]}")`;

  const interval = Math.round(1000 / HERO_ATK_FPS);

  heroAtkTimer = setInterval(() => {
    heroAtkIndex++;

    if (heroAtkIndex >= HERO_ATK_FRAMES.length){
      clearInterval(heroAtkTimer);
      heroAtkTimer = null;
      heroIsAttacking = false;

      // после атаки → idle
      startHeroIdle();
      return;
    }

    heroEl.style.backgroundImage = `url("${HERO_ATK_FRAMES[heroAtkIndex]}")`;
  }, interval);
}

window.playHeroAttack = playHeroAttack;

function playHeroAttack2(){
  if (heroIsHit) {
    pendingSkill2Attack = true;
    return;
  }
  if (!heroEl) return;
  if (heroIsAttacking) return;

  heroIsAttacking = true;

  // стопаем run и idle
  if (heroRunTimer){
    clearInterval(heroRunTimer);
    heroRunTimer = null;
  }
  if (heroIdleTimer){
    clearInterval(heroIdleTimer);
    heroIdleTimer = null;
  }

  heroEl.classList.remove("hero--run", "hero--idle");
  heroEl.classList.add("hero--atk");

  heroAtkIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_ATK2_FRAMES[0]}")`;

  const interval = Math.round(1000 / HERO_ATK2_FPS);

  heroAtkTimer = setInterval(() => {
    heroAtkIndex++;

    if (heroAtkIndex >= HERO_ATK2_FRAMES.length){
      clearInterval(heroAtkTimer);
      heroAtkTimer = null;
      heroIsAttacking = false;

      startHeroIdle();
      return;
    }

    heroEl.style.backgroundImage = `url("${HERO_ATK2_FRAMES[heroAtkIndex]}")`;
  }, interval);
}

window.playHeroAttack2 = playHeroAttack2;


function trySkillAttack(){
  if (battlePaused) return false;

  if (mode !== MODE.FIGHT) return false;

  // на всякий случай: если рядом вообще нет цели
  if (!getNearestMobInRange(160)) return false;
  // если уже ждём — не спамим
  if (pendingSkillRequest) return false;

  // если герой сейчас получает урон — ставим в очередь, но запрос НЕ шлём
  if (heroIsHit) {
    pendingSkillAttack = true;
    pendingSkillRequest = true;
    return false;
  }

  // если уже атакует — не шлём повторно
  if (heroIsAttacking) return false;

  // ✅ стартуем атаку прямо сейчас
  playHeroAttack();

  // ✅ и ТОЛЬКО теперь шлём запрос на навык
  if (typeof window.useSkill === "function") window.useSkill();

  return true;
}

window.trySkillAttack = trySkillAttack;

function trySkill2Attack(){
  if (battlePaused) return false;
  if (mode !== MODE.FIGHT) return false;
  if (!getNearestMobInRange(160)) return false;
  if (pendingSkill2Request) return false;

  if (heroIsHit) {
    pendingSkill2Attack = true;
    pendingSkill2Request = true;
    return false;
  }

  if (heroIsAttacking) return false;

  playHeroAttack2();

  if (typeof window.useSkill === "function") window.useSkill("heavy_blow");


  return true;
}

window.trySkill2Attack = trySkill2Attack;

function trySkill3Attack(){
  if (battlePaused) return false;
  if (mode !== MODE.FIGHT) return false;
  if (!getNearestMobInRange(160)) return false;
  if (pendingSkill3Request) return false;

  if (heroIsHit) {
    pendingSkill3Attack = true;
    pendingSkill3Request = true;
    return false;
  }

  if (heroIsAttacking) return false;

  // анти-реген — визуально используем вторую атаку, чтобы было "каст"
  playHeroAttack2();

  if (typeof window.useSkill === "function") window.useSkill("guard_break");

  return true;
}

window.trySkill3Attack = trySkill3Attack;

function playHeroHit(){
  if (!heroEl) return;
  if (heroIsHit) return;

  heroIsHit = true;

  // стопаем всё
  if (heroRunTimer){
    clearInterval(heroRunTimer);
    heroRunTimer = null;
  }
  if (heroIdleTimer){
    clearInterval(heroIdleTimer);
    heroIdleTimer = null;
  }
  if (heroAtkTimer){
    clearInterval(heroAtkTimer);
    heroAtkTimer = null;
    heroIsAttacking = false;
  }

  heroEl.classList.remove("hero--run", "hero--idle", "hero--atk");
  heroEl.classList.add("hero--hit");

  heroHitIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_HIT_FRAMES[0]}")`;

  const interval = Math.round(1000 / HERO_HIT_FPS);

  heroHitTimer = setInterval(() => {
    heroHitIndex++;

    if (heroHitIndex >= HERO_HIT_FRAMES.length){
      clearInterval(heroHitTimer);
      heroHitTimer = null;
      heroIsHit = false;

// после получения урона — если игрок нажал НАВЫК 2 во время hit
if (pendingSkill2Attack) {
  pendingSkill2Attack = false;

  playHeroAttack2();

  if (pendingSkill2Request) {
    pendingSkill2Request = false;
    if (typeof window.useSkill === "function") window.useSkill("heavy_blow");

  }

  return;
}

if (pendingSkill3Attack) {
  pendingSkill3Attack = false;

  playHeroAttack2();

  if (pendingSkill3Request) {
    pendingSkill3Request = false;
    if (typeof window.useSkill === "function") window.useSkill("guard_break");
  }

  return;
}

if (pendingSkillAttack) {
  pendingSkillAttack = false;

  // 1) запускаем анимацию атаки
  playHeroAttack();

  // 2) и ТОЛЬКО ТЕПЕРЬ отправляем запрос навыка (один раз)
  if (pendingSkillRequest) {
    pendingSkillRequest = false;
    if (typeof window.useSkill === "function") window.useSkill();
  }

  return;
}

// иначе просто idle
startHeroIdle();
return;


    }

    heroEl.style.backgroundImage = `url("${HERO_HIT_FRAMES[heroHitIndex]}")`;
  }, interval);
}

window.playHeroHit = playHeroHit;


function startHeroIdle(){
  if (!heroEl) return;

  // ✅ чтобы не мигал: стопаем run-таймер, если он остался
  if (heroRunTimer){
    clearInterval(heroRunTimer);
    heroRunTimer = null;
  }

  if (heroIdleTimer) return;

  heroEl.classList.remove("hero--run", "hero--atk");
  heroEl.classList.add("hero--idle");

  heroIdleIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_IDLE_FRAMES[0]}")`;

  const interval = Math.round(1000 / HERO_IDLE_FPS);

  heroIdleTimer = setInterval(() => {
    heroIdleIndex = (heroIdleIndex + 1) % HERO_IDLE_FRAMES.length;
    heroEl.style.backgroundImage = `url("${HERO_IDLE_FRAMES[heroIdleIndex]}")`;
  }, interval);
}


function startHeroRun(){
  if (!heroEl) return;

  // ✅ чтобы не мигал: стопаем idle-таймер, если он остался
  if (heroIdleTimer){
    clearInterval(heroIdleTimer);
    heroIdleTimer = null;
  }

  if (heroRunTimer) return;

  heroEl.classList.remove("hero--idle", "hero--atk");
  heroEl.classList.add("hero--run");

  heroRunIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_RUN_FRAMES[0]}")`;

  const interval = Math.round(1000 / HERO_RUN_FPS);

  heroRunTimer = setInterval(() => {
    heroRunIndex = (heroRunIndex + 1) % HERO_RUN_FRAMES.length;
    heroEl.style.backgroundImage = `url("${HERO_RUN_FRAMES[heroRunIndex]}")`;
  }, interval);
}


function stopHeroRun(){
  if (!heroEl) return;

  if (heroRunTimer){
    clearInterval(heroRunTimer);
    heroRunTimer = null;
  }

  startHeroIdle();
}

// ✅ форсируем герою idle (когда открывается лут, чтобы не зависал на кадре атаки)
function forceHeroIdleNow(){
  if (!heroEl) return;
  heroEl.style.removeProperty("background-position");


  // стопаем все таймеры героя
  if (heroRunTimer){ clearInterval(heroRunTimer); heroRunTimer = null; }
  if (heroIdleTimer){ clearInterval(heroIdleTimer); heroIdleTimer = null; }
  if (heroAtkTimer){ clearInterval(heroAtkTimer); heroAtkTimer = null; heroIsAttacking = false; }
  if (heroHitTimer){ clearInterval(heroHitTimer); heroHitTimer = null; heroIsHit = false; }

  // на всякий случай: стопаем старую sprite-анимацию атаки (если где-то используется)
  if (attackTimer){ clearInterval(attackTimer); attackTimer = null; }
  isAttacking = false;
  queuedNext = false;

  pendingSkillAttack = false;
  pendingSkillRequest = false;

  heroEl.classList.remove("hero--run","hero--idle","hero--atk","hero--hit");
  heroEl.classList.add("hero--idle");

  heroIdleIndex = 0;
  heroEl.style.backgroundImage = `url("${HERO_IDLE_FRAMES[0]}")`;

  startHeroIdle();
}

window.forceHeroIdleNow = forceHeroIdleNow;


const ATK_COLS = 7;
const ATK_FRAME_W = 220;
const ATK_FRAME_H = 148;
const FRAME_MS = 28;    
const COMBO_RESET_MS = 450;

const COMBO = [
  { start: 0,  count: 11 }, // удар 1: 0–10
  { start: 11, count: 9  }, // удар 2: 11–19
  { start: 20, count: 9  }, // удар 3: 20–28
  { start: 29, count: 10 }, // удар 4: 29–38
];

function setAttackFrame(frameIndex) {
  const col = frameIndex % ATK_COLS;
  const row = Math.floor(frameIndex / ATK_COLS);

  const x = -col * ATK_FRAME_W;
  const y = -row * ATK_FRAME_H;

  heroEl.style.backgroundPosition = `${x}px ${y}px`;
}

function switchToIdle() {
  heroEl.classList.remove("hero--atk", "hero--run");
  heroEl.classList.add("hero--idle");
  heroEl.style.removeProperty("background-position");

}

function switchToAtk() {
  heroEl.classList.remove("hero--idle", "hero--run");
  heroEl.classList.add("hero--atk");
}

function playComboHit() {
  const now = Date.now();

  // если была пауза — начинаем комбо сначала
  if (now - lastClickAt > COMBO_RESET_MS) {
    comboIndex = 0;
  }
  lastClickAt = now;

  // если удар уже идёт — просто буферим следующий
  if (isAttacking) {
    queuedNext = true;
    return;
  }

  // стартуем удар
  isAttacking = true;
  queuedNext = false;

  const seg = COMBO[comboIndex];
  comboIndex = (comboIndex + 1) % COMBO.length;
  
  stopHeroRun();
  switchToAtk();

  // сразу ставим первый кадр сегмента
  setAttackFrame(seg.start);

    i = 0;

  attackTimer = setInterval(() => {
    i++;

    if (i >= seg.count) {
      clearInterval(attackTimer);
      attackTimer = null;
      isAttacking = false;

      // если кликали во время анимации — сразу следующий удар
      if (queuedNext) {
        queuedNext = false;
        playComboHit();
      } else {
        // иначе возвращаем idle
        switchToIdle();
      }
      return;
    }

    setAttackFrame(seg.start + i);
  }, FRAME_MS);
}

const MODE = {
  APPROACH: "approach",
  FIGHT: "fight",
  LOOT: "loot",
  ADVANCE: "advance",
  WAIT: "wait",       // герой стоит, моб подходит
};

let mode = MODE.APPROACH;


function setMode(m){
  mode = m;

  if (m === MODE.WAIT) {
  setModeRun(false); // фон стоп + герой idle, но мобы идут
}

  if (m === MODE.APPROACH) {
    if (nextWaveBtn) nextWaveBtn.classList.add("hidden");
    setModeRun(true); // фон едет + герой бежит
  }

  if (m === MODE.FIGHT) {
    setModeRun(false); // стоп
  }

  if (m === MODE.ADVANCE) {
    setModeRun(true); // “подбегаем”
  }

  if (m === MODE.LOOT) {
    setModeRun(false);
    if (nextWaveBtn) nextWaveBtn.classList.remove("hidden");
  }
}

const WAVE_LIST = [
  ["melee"]
];

function getBossSkinByLevel(lvl){
  // lvl 5 = первый босс "reaper"
  if (Number(lvl) === 5) {
    return {
      id: "reaper",
      className: "mob--reaper",
      startFrame: REAPER_MOVE[0],
      walk: REAPER_MOVE,
      idle: REAPER_IDLE,
      hit:  [REAPER_MOVE[0]],
      dead: REAPER_DIE,
      atk1: REAPER_ATTACK,
      atk2: REAPER_ATTACK,
      walkMs: 110,
      idleMs: 180,
      hitMs: 70,
      atkMs: 90,
    };
    
  }
     // lvl 10 = phantom knight
  if (Number(lvl) === 10) {
    return {
      id: "phantom_knight",
      className: "mob--phantom",
      yOffset: 10,
      stopDist: 25, // ✅ чем меньше — тем ближе к герою (например 15–40)
      startFrame: PHANTOM_RUN[0],
      walk: PHANTOM_RUN,
      idle: PHANTOM_IDLE,          // пока нет idle — используем run
      hit: PHANTOM_HURT,     // пока нет hit — один кадр
      dead: PHANTOM_DIE,    // пока нет die — временно скелет (потом заменишь)
      atk1: PHANTOM_ATTACK1,          // пока нет attack — временно run
      atk2: PHANTOM_ATTACK1,
      walkMs: 140,
      idleMs: 240,
      hitMs: 100,
      atkMs: 105,
    };
  }

  // дефолт = скелет
  return {
    id: "skeleton",
    className: "",
    startFrame: SKELETON_READY[0],
    walk: SKELETON_WALK,
    idle: SKELETON_IDLE,
    hit:  SKELETON_HIT,
    dead: SKELETON_DEAD_FAR,
    atk1: SKELETON_ATK_1,
    atk2: SKELETON_ATK_2,
    walkMs: 120,
    idleMs: 180,
    hitMs: 55,
    atkMs: 90,
  };
}


function setModeRun(on){
  isRunning = !!on;
  if (on) startHeroRun();
  else stopHeroRun();
}

function getHeroX(){
  const w = wrapper.clientWidth || 360;
  return Math.round(w * 0.30);
}

function clearMobs(){
  mobs.forEach(m => {
    if (!m) return;

    if (m.deathTimer) { clearInterval(m.deathTimer); m.deathTimer = null; }
    if (m.deathHoldTimeout) { clearTimeout(m.deathHoldTimeout); m.deathHoldTimeout = null; }
    if (m.deathFadeTimeout) { clearTimeout(m.deathFadeTimeout); m.deathFadeTimeout = null; }

    if (m.el) m.el.remove();
  });
  mobs = [];
}


function spawnWave(startMode = MODE.APPROACH){
  clearMobs();

  const w = wrapper.clientWidth || 360;
  const types = WAVE_LIST[waveIndex % WAVE_LIST.length];
  const lvl = Number(window.boss_lvl) || 1;
const skin = getBossSkinByLevel(lvl);

  types.forEach((kind, i) => {
        const el = document.createElement("div");
    el.className = "mob " + kind;
    el.style.position = "absolute";
    el.style.bottom = "365px";
    if (typeof skin.yOffset === "number") {
  el.style.bottom = (365 + skin.yOffset) + "px";
}         // на земле, как герой
    el.style.left = (w + 80 + i*70) + "px";
    el.style.zIndex = "15";
    el.style.pointerEvents = "none";

    const stand0 = (skin.idle && skin.idle.length) ? skin.idle[0] : (skin.startFrame || skin.walk[0]);
el.style.backgroundImage = `url("${stand0}")`;

    el.style.backgroundRepeat = "no-repeat";
    el.classList.add("mob--flip");
    if (skin.className) el.classList.add(skin.className);

    sceneEl.appendChild(el);

    mobs.push({
  id: "m" + i,
  kind,
  name: "Скелет",
  hp: kind === "melee" ? 120 : 180,
  x: w + 80 + i*70,
  speed: bgSpeed,
  stopDist: (typeof skin.stopDist === "number") ? skin.stopDist : (kind === "melee" ? 50 : 180),
  alive: true,
  el,

  // ✅ ВАЖНО: именно skin.* (а не SKELETON_*)
  framesWalk: (skin.idle && skin.idle.length) ? skin.idle : skin.walk,
  frameI: 0,
  frameT: 0,
  frameMs: (skin.idleMs || skin.walkMs), 

  framesIdle: skin.idle,
  idleI: 0,
  idleT: 0,
  idleMs: skin.idleMs,

  framesAtk1: skin.atk1,
  framesAtk2: skin.atk2,
  atkCooldown: 3000,
  atkTimer: 0,
  isAttacking: false,
  atkFrames: null,
  atkI: 0,
  atkT: 0,
  atkMs: skin.atkMs,
  hitDone: false,

  framesHit: skin.hit,
  isHit: false,
  pendingHit: false,
  hitFrames: null,
  hitI: 0,
  hitT: 0,
  hitMs: skin.hitMs,

  framesDead: skin.dead,
      
    });
  });
setMode(startMode);
}

window.resetEncounter = function resetEncounter(opts = {}){
  window.__mobDeathAnimating = false;
  if (!wrapper || !heroEl) return;

  battlePaused = false;

  const startMode = (typeof opts === "string")
    ? opts
    : (opts.startMode || opts.mode || MODE.APPROACH);

  // сброс таймеров героя
  if (heroRunTimer){ clearInterval(heroRunTimer); heroRunTimer = null; }
  if (heroIdleTimer){ clearInterval(heroIdleTimer); heroIdleTimer = null; }
  if (heroAtkTimer){ clearInterval(heroAtkTimer); heroAtkTimer = null; heroIsAttacking = false; }
  if (heroHitTimer){ clearInterval(heroHitTimer); heroHitTimer = null; heroIsHit = false; }

  // герой: RUN или IDLE
  heroEl.classList.remove("hero--run","hero--idle","hero--atk","hero--hit");
  if (startMode === MODE.WAIT) startHeroIdle();
  else startHeroRun();

  // фон НЕ сбрасываем по умолчанию (чтобы не было поддёргивания)
const keepBg = (opts && opts.keepBackground !== undefined) ? !!opts.keepBackground : true;
if (!keepBg) initBackground();
lastBgTime = performance.now();


  // сброс мобов/волны
  waveIndex = 0;
  clearMobs();
  spawnWave(startMode);
  lastWaveTime = performance.now();
};



function ensureMobHp(){
  if (mobHpWrap) return;

  mobHpWrap = document.createElement("div");
  mobHpWrap.id = "mobHpWrap";

  mobHpFill = document.createElement("div");
  mobHpFill.id = "mobHpFill";

  mobHpWrap.appendChild(mobHpFill);
  const mobHpText = document.createElement("div");
mobHpText.id = "mobHpText";
mobHpWrap.appendChild(mobHpText);

  wrapper.appendChild(mobHpWrap);

  mobHpName = document.createElement("div");
mobHpName.id = "mobHpName";
wrapper.appendChild(mobHpName);

}

function updateMobHpBar(){
  ensureMobHp();
// ✅ глобальные принудительные скрытия (лут-окно/анимация смерти)
if (window.__forceHideMobHp === true || window.__mobDeathAnimating === true) {
  mobHpWrap.style.display = "none";
if (mobHpName) mobHpName.style.display = "none";
return;

}

// ✅ БОСС-уровни (каждые 5 LVL): над головой НЕ показываем полосу вообще
const lvlRaw = (window.__loot_lvl != null) ? window.__loot_lvl : window.boss_lvl;
const lvl = Math.max(1, Number(lvlRaw) || 1);
if (lvl % 5 === 0) {
  mobHpWrap.style.display = "none";
if (mobHpName) mobHpName.style.display = "none";
return;

}


const hpRaw = Number(window.boss_hp);
const deadNow = (window.boss_dead === true) || (!Number.isNaN(hpRaw) && hpRaw <= 0);
if (deadNow) {
  mobHpWrap.style.display = "none";
if (mobHpName) mobHpName.style.display = "none";
return;

}

  const m = getNearestMobInRange(160);
  if (!m || !m.el || !m.alive){
    mobHpWrap.style.display = "none";
if (mobHpName) mobHpName.style.display = "none";
return;

  }

  const serverMax = (typeof window.boss_max_hp === "number" && window.boss_max_hp > 0) ? window.boss_max_hp : null;
const serverHp  = (typeof window.boss_hp === "number") ? window.boss_hp : null;

const maxHp = serverMax ?? ((m.kind === "melee") ? 120 : 180);
const hp    = Math.max(0, serverHp ?? m.hp);

// ✅ чтобы работало ДО первого удара (когда hp ещё не пришёл/NaN)
const maxSafe = (Number.isFinite(maxHp) && maxHp > 0) ? maxHp : 1;
const hpSafe  = Number.isFinite(hp) ? hp : maxSafe;

const percent = Math.max(0, Math.min(100, (hpSafe / maxSafe) * 100));
mobHpFill.style.width = percent + "%";

// ✅ цифры внутри полоски
const txt = document.getElementById("mobHpText");
if (txt) txt.textContent = `${Math.round(hpSafe)} / ${Math.round(maxSafe)}`;


  // позиция внутри wrapper (не прыгает при смене кадров)
  const MOB_W = 128;          // у тебя .mob width/height 128px в scene.css
  const MOB_H = 128;
  const GROUND_BOTTOM = 365; 

  const barW = 90;
  const xCenter = m.x + (MOB_W / 2);
  const yTop = (wrapper.clientHeight - GROUND_BOTTOM) - MOB_H - 14;

  mobHpWrap.style.left = Math.round(xCenter - barW/2) + "px";
  mobHpWrap.style.top  = Math.round(yTop) + "px";
  mobHpWrap.style.display = "block";
  if (mobHpName) {
  mobHpName.textContent = m.name || "Скелет";
  mobHpName.style.left = Math.round(xCenter) + "px";
  mobHpName.style.top  = Math.round(yTop - 16) + "px";
  mobHpName.style.display = "block";
}

}

function waveTick(){
  const now = performance.now();

if (battlePaused) {
  lastWaveTime = now;
  window.__battleRafId = requestAnimationFrame(waveTick);

  return;
}

  const dt = (now - lastWaveTime) / 1000;
  lastWaveTime = now;

  const heroX = getHeroX();

  mobs.forEach(m => {
  if (!m.alive) return;

  if (m.isDeadAnim) return;

  // ===== HIT ANIMATION (когда герой ударил моба) =====
if (m.isHit) {
  tickMobHit(m, dt);
  updateMobHpBar();
  return; // пока hit играет — не крутим idle/walk
}
updateMobHpBar();

  // ===== ATTACK TIMER =====
m.atkTimer += dt * 1000;

// если можем атаковать (в бою, рядом, не атакуем сейчас)
const heroX = getHeroX();
const inAttackRange = Math.abs(m.x - heroX) <= m.stopDist + 10;

if (
  mode === MODE.FIGHT &&
  inAttackRange &&
  !m.isAttacking &&
  m.atkTimer >= m.atkCooldown
) {
  // старт атаки
  m.isAttacking = true;
  m.el.classList.add("mob--atk");
  m.atkTimer = 0;

  const a1 = (m.framesAtk1 && m.framesAtk1.length) ? m.framesAtk1 : SKELETON_ATK_1;
const a2 = (m.framesAtk2 && m.framesAtk2.length) ? m.framesAtk2 : SKELETON_ATK_2;
m.atkFrames = Math.random() < 0.5 ? a1 : a2;
  m.atkI = 0;
  m.atkT = 0;

  m.el.style.backgroundImage = `url("${m.atkFrames[0]}")`;
  m.hitDone = false;

}


  const stopX = getHeroX() + m.stopDist;

  // двигаться можно только в APPROACH/ADVANCE
  const canMove = (mode === MODE.APPROACH || mode === MODE.ADVANCE || mode === MODE.WAIT);

  const wasMoving = m.isMoving;
  m.isMoving = canMove && (m.x > stopX);
  // ===== ATTACK ANIMATION =====
if (m.isAttacking) {
  m.atkT += dt * 1000;
  if (m.atkT >= m.atkMs) {
    m.atkT = 0;
    m.atkI++;

    // 💥 УДАР — на 3 кадре
if (m.atkI === 2 && !m.hitDone) {
  m.hitDone = true;
}


    if (m.atkI >= m.atkFrames.length) {
      // атака закончилась
      m.isAttacking = false;
      m.el.classList.remove("mob--atk");
      m.atkFrames = null;
      m.atkI = 0;
      m.atkT = 0;

      // сразу в idle
      m.el.style.backgroundImage = `url("${m.framesIdle[0]}")`;
      if (window.playHeroHit) window.playHeroHit();

            // если игрок попал по скелету во время его атаки — проиграем hit сразу после
      if (m.pendingHit) {
        m.pendingHit = false;
        startMobHit(m);
      }



    } else {
      m.el.style.backgroundImage = `url("${m.atkFrames[m.atkI]}")`;
    }
  }
  updateMobHpBar();

  return; // ⬅️ ВАЖНО: пока атакует — НИЧЕГО ДРУГОГО НЕ ДЕЛАЕМ
}


  if (m.isMoving) {
    const moveSpeed = isRunning ? bgSpeed : m.speed; // когда фон едет — монстр едет с той же скоростью
m.x -= moveSpeed * dt;

    if (m.x < stopX) m.x = stopX;
    m.el.style.left = Math.round(m.x) + "px";

    // WALK
    m.frameT += dt * 1000;
    if (m.frameT >= m.frameMs) {
      m.frameT = 0;
      m.frameI = (m.frameI + 1) % m.framesWalk.length;
      m.el.style.backgroundImage = `url("${m.framesWalk[m.frameI]}")`;
    }
  } else {
    // если только что остановился — сразу показать первый idle кадр
    if (wasMoving) {
      m.idleI = 0;
      m.idleT = 0;
      m.el.style.backgroundImage = `url("${m.framesIdle[0]}")`;
    }

    // IDLE (в том числе когда mode=FIGHT)
    m.idleT += dt * 1000;
    if (m.idleT >= m.idleMs) {
      m.idleT = 0;
      m.idleI = (m.idleI + 1) % m.framesIdle.length;
      m.el.style.backgroundImage = `url("${m.framesIdle[m.idleI]}")`;
    }
  }
});

  // 2) если хотя бы 1 melee дошёл — бой
  if (mode === MODE.APPROACH || mode === MODE.WAIT) {
    const meleeReached = mobs.some(m => m.alive && m.kind === "melee" && m.x <= heroX + m.stopDist + 0.5);
    if (meleeReached) setMode(MODE.FIGHT);
  }

  // 3) если все melee умерли, но есть ranged — “подбежать”
  if (mode === MODE.FIGHT) {
    const meleeAlive = mobs.some(m => m.alive && m.kind === "melee");
    const rangedAlive = mobs.some(m => m.alive && m.kind === "ranged");
    if (!meleeAlive && rangedAlive) setMode(MODE.ADVANCE);
  }

  // 4) если подбежали так, что ranged в радиусе — бой
  if (mode === MODE.ADVANCE) {
    const rangedInRange = getNearestMobInRange(160) != null; // радиус удара
    if (rangedInRange) setMode(MODE.FIGHT);
  }

  // 5) если все мобы умерли — лут/дальше
  const aliveAny = mobs.some(m => m.alive);
  if (!aliveAny && mode !== MODE.LOOT) {
    setMode(MODE.LOOT);
  }

  window.__battleRafId = requestAnimationFrame(waveTick);

}

function getNearestMobInRange(rangePx){
  const heroX = getHeroX();
  let best = null;
  let bestD = Infinity;

  for (const m of mobs) {
    if (!m.alive) continue;
    if (m.isDeadAnim) continue;
    const d = Math.abs(m.x - heroX);
    if (d <= rangePx && d < bestD) {
      best = m;
      bestD = d;
    }
  }
  return best;
}


window.bossVisualHit = function(){
  // ✅ дёргаем именно того, кто возле героя (на экране)
  const m = getNearestMobInRange(220) || mobs[0];
  if (!m) return;
  startMobHit(m);
};

window.bossShowDamage = function(value, meta){
  // ✅ цифры тоже над тем, кто возле героя
  const m = getNearestMobInRange(220) || mobs[0];
  if (!m) return;

  const isCrit = (() => {
    if (!meta) return false;
    if (typeof meta === "object") return !!(meta.crit ?? meta.isCrit ?? meta.is_crit);
    return !!meta; // если передали просто true/false вторым аргументом
  })();

  showDamageOverMob(m, value, isCrit);
};

function showDamageOverMob(m, text, isCrit){
  if (!wrapper || !m || !m.el) return;

  const el = document.createElement("div");
  el.className = "damage-float" + (isCrit ? " damage-float--crit" : "");
  el.textContent = String(text);

  const mobRect = m.el.getBoundingClientRect();
  const wrapRect = wrapper.getBoundingClientRect();
  const scale = getWrapperScale();

  const x = ((mobRect.left - wrapRect.left) + (mobRect.width / 2)) / scale;
  const y = ((mobRect.top  - wrapRect.top)  + (mobRect.height * 0.2)) / scale;


  el.style.left = Math.round(x) + "px";
  el.style.top  = Math.round(y) + "px";

  wrapper.appendChild(el);

  setTimeout(() => { if (el && el.parentNode) el.remove(); }, 1200);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[ch]));
}

function lootToHtml(s){
  return escapeHtml(s).replace(/__ORE__/g,
    '<span class="ore-ico loot-ico" aria-hidden="true"></span>'
  );
}

function showLootOverMob(m, text, stackIndex = 0){
  if (!wrapper) return;

  const el = document.createElement("div");
  el.className = "loot-float";
  const s = String(text ?? "");
if (s.includes("__ORE__")) el.innerHTML = lootToHtml(s).replace(/\n/g, "<br>");
else el.textContent = s;


  // позиция: над мобом, как у урона
  let x, y;

  if (m && m.el) {
    const mobRect  = m.el.getBoundingClientRect();
    const wrapRect = wrapper.getBoundingClientRect();

    const scale = getWrapperScale();
  x = ((mobRect.left - wrapRect.left) + (mobRect.width / 2)) / scale;
  y = ((mobRect.top  - wrapRect.top)  + (mobRect.height * 0.2)) / scale;


    y -= 34;
    y -= stackIndex * 18;
  } else {
    // fallback: центр экрана
    x = wrapper.clientWidth / 2;
    y = wrapper.clientHeight / 2;
  }

  el.style.left = Math.round(x) + "px";
  el.style.top  = Math.round(y) + "px";

  wrapper.appendChild(el);

  setTimeout(() => { if (el && el.parentNode) el.remove(); }, 2200);
}

window.showLootFloat = function(parts){
  const m = getNearestMobInRange(220) || mobs[0] || null;

  const arr = Array.isArray(parts) ? parts.filter(Boolean) : [String(parts ?? "")].filter(Boolean);
  if (!arr.length) return;

  const invBtn = document.getElementById("inventoryBtn");
  const canDrop = (typeof window.spawnLootIconDrop === "function") && invBtn;

  // если вдруг нет fx — оставляем старое поведение
  if (!canDrop) {
    const text = arr.join("\n");
    setTimeout(() => showLootOverMob(m, text, 0), 1000);
    return;
  }

  // стартовая позиция (около моба)
  let x, y;
  if (m && m.el && wrapper) {
    const mobRect  = m.el.getBoundingClientRect();
    const wrapRect = wrapper.getBoundingClientRect();

    const cs = getComputedStyle(wrapper);
    let scale = parseFloat(cs.getPropertyValue("--ui-scale"));
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    x = ((mobRect.left - wrapRect.left) + (mobRect.width  / 2)) / scale;
    y = ((mobRect.top  - wrapRect.top)  + (mobRect.height * 0.55)) / scale;
  } else {
    x = (wrapper?.clientWidth  || 300) / 2;
    y = (wrapper?.clientHeight || 600) / 2;
  }

  // парсим лут и накапливаем суммы
  const gain = { coins: 0, wood: 0, ore: 0 };
  const drops = [];

  for (const s of arr) {
    // 🪵 +12
    let m1 = String(s).match(/^🪵\s*\+(\d+)/);
    if (m1) { gain.wood += parseInt(m1[1], 10); drops.push("wood"); continue; }

    // __ORE__ +7
    let m2 = String(s).match(/^__ORE__\s*\+(\d+)/);
    if (m2) { gain.ore += parseInt(m2[1], 10); drops.push("ore"); continue; }

    // coins: +15  (или coins +15)
    let m3 = String(s).match(/^coins\s*:?\s*\+(\d+)/i);
    if (m3) { gain.coins += parseInt(m3[1], 10); drops.push("coins"); continue; }
  }

  if (!drops.length) {
    // если пришли неизвестные строки — показываем как раньше
    const text = arr.join("\n");
    setTimeout(() => showLootOverMob(m, text, 0), 1000);
    return;
  }

  setTimeout(() => {

  const spreadRadius = 28; // радиус рассыпания

  drops.forEach((type, i) => {

    // равномерное распределение по окружности
    const angle = (i / drops.length) * Math.PI * 2;

    const offsetX = Math.cos(angle) * spreadRadius;
    const offsetY = Math.sin(angle) * (spreadRadius * 0.6);

    window.spawnLootIconDrop({
      x: x + offsetX,
      y: y + offsetY,
      iconType: type,
      targetEl: invBtn
    });
  });

}, 250);


  // 2) когда "долетели" — показать текст над инвентарём (один раз суммарно)
  const arriveMs = 250 + 450 + 600 + 1000; // delay + fall + pause + небольшой запас
  setTimeout(() => {
    const parts2 = [];
    if (gain.coins) parts2.push(`💰 +${gain.coins}`);
    if (gain.wood)  parts2.push(`🪵 +${gain.wood}`);
    if (gain.ore)   parts2.push(`⛏ +${gain.ore}`);

    const text = parts2.join("   ");
    if (text && typeof window.spawnInvGainText === "function") {
      window.spawnInvGainText({ targetEl: invBtn, text });
    }
  }, arriveMs);
};


window.bossShowLoot = window.showLootFloat;


window.playMobDeath = function playMobDeath(opts = {}) {
  const m = getNearestMobInRange(220) || mobs[0] || null;
  if (!m || !m.el) return Promise.resolve(false);
  if (m.isDeadAnim) return Promise.resolve(true);

  window.__mobDeathAnimating = true;

    // ===== loot ticker: start after 0.5s from death start =====
  const pendingParts = window.__pendingDeathLootParts;
  if (pendingParts != null) {
    window.__pendingDeathLootParts = null;

    const lootDelayMs = (opts.lootDelayMs ?? 500);
    const lootTypeMs  = (opts.lootTypeMs  ?? 2600);

    showLootTickerOverMob(m, pendingParts, lootDelayMs, lootTypeMs);
  }


    // ✅ спрятать полоску ХП сразу (не ждать waveTick)
  const hpEl = document.getElementById("mobHpWrap");
  if (hpEl) hpEl.style.display = "none";
  // ✅ спрятать ИМЯ тоже сразу
const hpNameEl = document.getElementById("mobHpName");
if (hpNameEl) hpNameEl.style.display = "none";

  const frames = (m.framesDead && m.framesDead.length) ? m.framesDead : SKELETON_DEAD_FAR;
  const frameMs = (opts.frameMs ?? 90);
  const holdMs  = (opts.holdMs  ?? 2000);
  const fadeMs  = (opts.fadeMs  ?? 1200);

  m.isDeadAnim = true;
m.isAttacking = false;
m.isHit = false;
m.pendingHit = false;
m.atkFrames = null;
m.hitFrames = null;

// ✅ ФИКС РАСТЯЖЕНИЯ: смерть не должна наследовать "atk"-раздув
m.el.classList.remove("mob--atk");

// сбрасываем всё, что могло зафиксироваться инлайном
m.el.style.width = "";
m.el.style.height = "";
m.el.style.marginLeft = "";
m.el.style.transform = "";
m.el.style.backgroundSize = "";
m.el.style.backgroundPosition = "";



  // сброс визуальных стилей перед смертью
  m.el.style.transition = "none";
  m.el.style.opacity = "1";

  let i = 0;
  m.el.style.backgroundImage = `url("${frames[0]}")`;

  return new Promise((resolve) => {
    m.deathTimer = setInterval(() => {
      i += 1;

      if (i >= frames.length) {
        clearInterval(m.deathTimer);
        m.deathTimer = null;

        // держим последний кадр
        m.el.style.backgroundImage = `url("${frames[frames.length - 1]}")`;

        m.deathHoldTimeout = setTimeout(() => {
          m.deathHoldTimeout = null;

          // плавно исчезаем на месте
          m.el.style.transition = `opacity ${fadeMs}ms linear`;
          m.el.style.opacity = "0";

          m.deathFadeTimeout = setTimeout(() => {
            m.deathFadeTimeout = null;
            window.__mobDeathAnimating = false;
            resolve(true);
          }, fadeMs);

        }, holdMs);

        return;
      }

      m.el.style.backgroundImage = `url("${frames[i]}")`;
    }, frameMs);
  });
};

function showLootTickerOverMob(m, parts, delayMs = 500, typeMs = 1500){
  if (!wrapper) return;

  const arr = Array.isArray(parts) ? parts.filter(Boolean) : [String(parts)];
  if (!arr.length) return;

  setTimeout(() => {
    const el = document.createElement("div");
    el.className = "loot-ticker";
    el.style.setProperty("--lootDur", typeMs + "ms");
    el.textContent = "";

    // позиция как у урона/лута
    let x, y;
    if (m && m.el) {
      const mobRect  = m.el.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      x = (mobRect.left - wrapRect.left) + (mobRect.width / 2);
      y = (mobRect.top  - wrapRect.top)  + (mobRect.height * 0.2);
    } else {
      x = wrapper.clientWidth / 2;
      y = wrapper.clientHeight / 2;
    }

    el.style.left = Math.round(x) + "px";
    el.style.top  = Math.round(y) + "px";
    wrapper.appendChild(el);

    // “по очереди” в одну строку за 1.5s
    const step = Math.max(60, Math.floor(typeMs / arr.length));
    let i = 0;

    const pushNext = () => {
      if (i >= arr.length) return;
      el.textContent += (i === 0 ? "" : "  •  ") + arr[i];
      i++;
      if (i < arr.length) setTimeout(pushNext, step);
    };

    pushNext();

    setTimeout(() => { if (el.parentNode) el.remove(); }, typeMs + 200);
  }, delayMs);
}


function hitNearestMob(dmg){
  const target = getNearestMobInRange(160);
  if (!target) return false;

target.hp -= dmg;
updateMobHpBar();

// 🔥 ВОТ ТУТ
startMobHit(target);

  if (target.hp <= 0) {
    target.alive = false;
    target.el.style.opacity = "0.15";
  }
  updateMobHpBar();
  return true;
}

function stopBossFrames(){
  if (bossAnimTimer) clearInterval(bossAnimTimer);
  bossAnimTimer = null;
}

function setBossFrame(src){
  if (!bossImg) return;
  bossImg.src = src;
}


function playBossFrames(frames, { loop=true, frameMs=90, onDone=null } = {}){
  if (!golem) return;
  stopBossFrames();
  bossAnimFrame = 0;

  if (!frames || !frames.length) return;

  setBossFrame(frames[0]);

  bossAnimTimer = setInterval(() => {
    bossAnimFrame++;

    if (bossAnimFrame >= frames.length){
      if (loop){
        bossAnimFrame = 0;
      } else {
        stopBossFrames();
        if (typeof onDone === "function") onDone();
        return;
      }
    }

    setBossFrame(frames[bossAnimFrame]);
  }, frameMs);
}

function setActiveBoss(bossId){
  if (!golem) return;

  // остановить PNG-анимации на переключении
  stopBossFrames();

  activeBossId = bossId;

  // Сброс визуала
  golem.style.backgroundImage = ""; // чтобы голем не мешал скелету кадрами

  // Снимаем классы голема, чтобы не было конфликтов
  golem.classList.remove("golem--idle", "golem--hit");

  golem.classList.remove("boss--golem", "boss--skeleton");

if (bossId === "golem") {
  golem.classList.add("boss--golem");
}

if (bossId === "skeleton") {
  golem.classList.add("boss--skeleton");
}

  if (bossId === "golem"){
    // возвращаем голема "как раньше"
    golem.classList.add("golem--idle");
  }

  if (bossId === "skeleton"){
    // запускаем ready-loop кадрами
    playBossFrames(SKELETON_READY, { loop: true, frameMs: 120 });
  }
}

function hitBoss(){
  if (!golem) return;
  if (golemIsHitAnimating) return;
  golemIsHitAnimating = true;

  if (activeBossId === "golem"){
    // ТВОЯ СТАРАЯ ЛОГИКА ГОЛЕМА (классы)
    golem.classList.remove("golem--idle");
    golem.classList.add("golem--hit");

    setTimeout(() => {
      golem.classList.remove("golem--hit");
      golem.classList.add("golem--idle");
      golemIsHitAnimating = false;
    }, 420);

    return;
  }
  window.hitBoss = hitBoss;


  if (activeBossId === "skeleton"){
    // СКЕЛЕТ: hit один раз -> обратно ready
    playBossFrames(SKELETON_HIT, {
      loop: false,
      frameMs: 60,
      onDone: () => {
        golemIsHitAnimating = false;
        playBossFrames(SKELETON_READY, { loop: true, frameMs: 120 });
      }
    });

    return;
  }

  // если неизвестный босс
  golemIsHitAnimating = false;
}

window.setBattlePaused = function(on){
  battlePaused = !!on;
  window.__battle_paused = battlePaused;

  if (battlePaused){
    // фон + мобы стоп
    isRunning = false;

    // чтобы не улетали запросы/очереди атак пока в меню
    pendingSkillAttack = false;
    pendingSkillRequest = false;
    pendingSkill2Attack = false;
    pendingSkill2Request = false;

    // стопаем таймеры героя и фиксируем кадр
    if (heroRunTimer){ clearInterval(heroRunTimer); heroRunTimer = null; }
    if (heroIdleTimer){ clearInterval(heroIdleTimer); heroIdleTimer = null; }
    if (heroAtkTimer){ clearInterval(heroAtkTimer); heroAtkTimer = null; }
    if (heroHitTimer){ clearInterval(heroHitTimer); heroHitTimer = null; }
    if (attackTimer){ clearInterval(attackTimer); attackTimer = null; }

    heroIsAttacking = false;
    heroIsHit = false;
    isAttacking = false;
    queuedNext = false;

    if (heroEl){
      heroEl.classList.remove("hero--run","hero--atk","hero--hit");
      heroEl.classList.add("hero--idle");
      heroEl.style.backgroundPosition = "0px 0px";
      heroEl.style.backgroundImage = `url("${HERO_IDLE_FRAMES[0]}")`;
    }

    return;
  }

  // RESUME
  const shouldRun = (mode === MODE.APPROACH || mode === MODE.ADVANCE);
  isRunning = shouldRun;

  // чтобы не было скачка времени после паузы
  lastWaveTime = performance.now();
  lastBgTime = performance.now();

  // вернуть анимацию героя по текущему режиму
  if (shouldRun) startHeroRun();
  else startHeroIdle();
};



console.log("[battle] loaded");

if (typeof initGame !== "function") console.log("[battle] initGame missing");
if (!window.wrapper) console.log("[battle] wrapper missing");

(async () => {
  try {
    await initGame();
    console.log("[battle] initGame ok");

    initBackground();
    window.__battleBgRafId = requestAnimationFrame(updateBackground);


    spawnWave();
    window.__battleRafId = requestAnimationFrame(waveTick);


    console.log("[battle] started");
  } catch (e) {
    console.log("[battle] boot error:", e);
  }
})();
// === DEBUG EXPORTS (чтобы вызывать из Console и из ui.js) ===
window.playHeroHit = playHeroHit;
window.playHeroAttack = playHeroAttack;

})();
