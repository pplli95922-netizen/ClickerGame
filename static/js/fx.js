let forgeFxRAF = null;
let forgeFxFrame = 0;
let forgeFxTimer = null;


function playForgeFx(durationMs = 2000){
  if (!forgeEffect) return;

  stopForgeFx();
  forgeEffect.classList.remove("hidden");

  const COLS = 5, TOTAL = 20;
  const FW = 192, FH = 192;

  const t0 = performance.now();

  const tick = (now) => {
    const t = now - t0;
    const p = Math.min(1, t / durationMs);            // 0..1
    const f = Math.min(TOTAL - 1, Math.floor(p * (TOTAL - 1) + 0.00001));

    const col = f % COLS;
    const row = Math.floor(f / COLS);
    forgeEffect.style.backgroundPosition = `${-col*FW}px ${-row*FH}px`;

    if (p < 1) {
      forgeFxRAF = requestAnimationFrame(tick);
    } else {
      stopForgeFx();
    }
  };

  forgeFxRAF = requestAnimationFrame(tick);
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function stopForgeFx(){
  if (forgeFxTimer) clearInterval(forgeFxTimer);
  forgeFxTimer = null;

  if (forgeFxRAF) cancelAnimationFrame(forgeFxRAF);
  forgeFxRAF = null;

  forgeFxFrame = 0;
  if (forgeEffect) {
    forgeEffect.classList.add("hidden");
    forgeEffect.style.backgroundPosition = "0px 0px";
  }
}

// ===== LOOT ICON DROP + INVENTORY GAIN =====
(function(){

  function getWrapper(){
    return document.querySelector(".game-wrapper") || document.body;
  }

  function getScale(wrapper){
    if (!wrapper) return 1;
    const cs = getComputedStyle(wrapper);

    const v = parseFloat(cs.getPropertyValue("--ui-scale"));
    if (Number.isFinite(v) && v > 0) return v;

    const t = cs.transform;
    if (t && t !== "none") {
      const m = t.match(/matrix\(([^)]+)\)/);
      if (m) {
        const a = parseFloat(m[1].split(",")[0]);
        if (Number.isFinite(a) && a > 0) return a;
      }
    }
    return 1;
  }

  // Всплывающий текст над кнопкой
  window.spawnInvGainText = function spawnInvGainText({ targetEl, text }) {
    if (!targetEl) return;

    const wrapper = getWrapper();
    const scale = getScale(wrapper);

    const tr = targetEl.getBoundingClientRect();
    const wr = wrapper.getBoundingClientRect();

    const x = ((tr.left - wr.left) + tr.width / 2) / scale;
    const y = ((tr.top  - wr.top)  - 10) / scale; // чуть выше кнопки

    const el = document.createElement("div");
    el.className = "inv-gain";
    el.textContent = text;

    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;

    wrapper.appendChild(el);
    setTimeout(() => el.remove(), 950);
  };

  // Дроп-иконка (без цифр)
  window.spawnLootIconDrop = function spawnLootIconDrop({ x, y, iconType, targetEl }) {
    const wrapper = getWrapper();
    const scale = getScale(wrapper);

    const el = document.createElement("div");
    el.className = "loot-drop";
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;

    const icon = document.createElement("div");
    icon.className = "loot-drop__icon";

    if (iconType === "wood") {
      icon.textContent = "🪵";
    } else if (iconType === "coins") {
      icon.textContent = "💰";
    } else if (iconType === "ore") {
      // используем ваш готовый ore-ico из hud.css
      const ore = document.createElement("span");
      ore.className = "ore-ico";
      icon.appendChild(ore);
    } else {
      icon.textContent = "✨";
    }

    el.appendChild(icon);
    wrapper.appendChild(el);

    // 1) падение
    const fallY = 34 + Math.random() * 18;
    const fallX = (Math.random() * 18 - 9);

    el.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
    requestAnimationFrame(() => {
      el.classList.add("is-fly");
      el.style.transform = `translate(-50%, -50%) translate(${fallX.toFixed(1)}px, ${fallY.toFixed(1)}px)`;
    });

    // 2) пауза -> полёт в цель
    const fallMs  = 450;
    const pauseMs = 600;

    setTimeout(() => {
      if (!targetEl) {
        el.classList.add("is-fade");
        setTimeout(() => el.remove(), 400);
        return;
      }

      const tr = targetEl.getBoundingClientRect();
      const wr = wrapper.getBoundingClientRect();

      const tx = ((tr.left - wr.left) + tr.width / 2) / scale;
      const ty = ((tr.top  - wr.top)  + tr.height / 2) / scale;

      const dx = tx - x;
      const dy = ty - y;

      el.style.transform = `translate(-50%, -50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      el.classList.add("is-fade");

      setTimeout(() => el.remove(), 650);
    }, fallMs + pauseMs);
  };

})();
