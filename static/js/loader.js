// static/js/loader.js
// Полноэкранный экран загрузки + прелоад критичных ассетов.

(function () {
  const LOADER_ID = "loadingScreen";

  /**
   * ВАЖНО: сюда кладём только самые заметные ассеты,
   * чтобы игрок НЕ видел как догружаются навыки/фон/спрайты.
   */
  const CRITICAL_ASSETS = [
    "/static/images/skills/skill3.png",
    "/static/images/skills/skill4.png",

    "/static/images/forge.png",
    "/static/images/inventory-bg.jpg",
    "/static/images/map-bg.jpg",
    "/static/images/dungeon-bg1.jpg",
    "/static/images/dungeon-bg2.jpg",

    // спрайты кузни
    "/static/images/sprites/Forge_animation.png",
    "/static/images/sprites/Smith_forge_full.png",
    "/static/images/sprites/water_animation.png",

    // FX (если файла нет — не страшно, onerror учтён)
    "/static/images/fx/craft_fx.png",
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function setProgress(p) {
    const bar = $("loadingBarFill");
    const txt = $("loadingText");
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, p))}%`;
    if (txt) txt.textContent = `Загрузка… ${Math.round(p)}%`;
  }

  function show() {
    const el = $(LOADER_ID);
    if (!el) return;
    el.classList.remove("hidden");
    setProgress(0);
  }

  function hide() {
    const el = $(LOADER_ID);
    if (!el) return;
    el.classList.add("hidden");
  }

  function preloadImages(urls, onProgress) {
    if (!Array.isArray(urls) || urls.length === 0) {
      onProgress?.(100);
      return Promise.resolve();
    }

    let done = 0;

    return Promise.all(
      urls.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => {
              done += 1;
              const p = (done / urls.length) * 100;
              onProgress?.(p);
              resolve();
            };
            img.src = src;
          })
      )
    ).then(() => void 0);
  }

  async function boot() {
    show();

    // 1) Прелоад картинок/спрайтов
    await preloadImages(CRITICAL_ASSETS, setProgress);

    // 2) Инициализация игры (инициализация стейта с сервера)
    if (typeof window.initGame === "function") {
      await window.initGame();
    }

    // 3) Дать браузеру 1 кадр на отрисовку уже готового UI
    await new Promise((r) => requestAnimationFrame(() => r()));

    hide();
  }

  window.Loader = { boot, show, hide };
})();