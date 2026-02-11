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