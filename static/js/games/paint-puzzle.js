/* Pixel restoration mini-game.
   Target image is a 12x12 sprite encoded as a flat string of palette indices.
   Player fills empty cells using the active palette swatch.
   Completed when canvas matches target. */

const PAINT_PALETTE = [
  { name: "void",   color: "#0a0810" },
  { name: "cherry", color: "#1d566f" },
  { name: "pink",   color: "#4ea8c9" },
  { name: "hot",    color: "#6cc7e6" },
  { name: "ink",    color: "#d8c4d8" },
  { name: "cream",  color: "#dbe6f0" },
  { name: "cyan",   color: "#6fd6c2" },
  { name: "warn",   color: "#d2b85a" },
];

const PAINT_TARGETS = [
  /* a small bat sprite, 12x12 */
  [
    "000000000000",
    "010000000010",
    "011000000110",
    "011100001110",
    "011110011110",
    "011111111110",
    "011144441110",
    "011144441110",
    "011144441110",
    "001144441100",
    "000114411000",
    "000001100000",
  ],
  /* a small heart 12x12 */
  [
    "000000000000",
    "002200022000",
    "023320233200",
    "233332333320",
    "233333333320",
    "233333333320",
    "023333333200",
    "002333332000",
    "000233320000",
    "000023200000",
    "000002000000",
    "000000000000",
  ],
  /* tiny crt screen */
  [
    "000000000000",
    "066666666660",
    "066444444660",
    "066444444660",
    "066444444660",
    "066444444660",
    "066444444660",
    "066666666660",
    "002222222200",
    "022222222220",
    "000000000000",
    "000000000000",
  ],
];

function paintCellColor(idx) {
  return PAINT_PALETTE[idx]?.color || "transparent";
}

function bootPaintPuzzle(root) {
  const games = root.querySelectorAll?.('[data-game="paint-puzzle"]') || [];
  games.forEach((game) => {
    if (game.dataset.ready === "1") return;
    game.dataset.ready = "1";
    initPaintInstance(game);
  });
}

function initPaintInstance(game) {
  const targetGrid = game.querySelector("[data-paint-target]");
  const playerGrid = game.querySelector("[data-paint-player]");
  const swatchBar  = game.querySelector("[data-paint-swatches]");
  const counter    = game.querySelector("[data-paint-counter]");
  const message    = game.querySelector("[data-paint-message]");
  const newBtn     = game.querySelector("[data-paint-new]");
  const clearBtn   = game.querySelector("[data-paint-clear]");
  const eraseBtn   = game.querySelector("[data-paint-erase]");

  if (!targetGrid || !playerGrid) return;

  const size = 12;
  let activeIndex = 1;
  let target = pickRandomTarget();
  let playerState = new Array(size * size).fill(null);

  function pickRandomTarget() {
    const pick = PAINT_TARGETS[Math.floor(Math.random() * PAINT_TARGETS.length)];
    const flat = [];
    pick.forEach((row) => {
      for (const ch of row) flat.push(parseInt(ch, 10));
    });
    return flat;
  }

  function renderTarget() {
    targetGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    targetGrid.innerHTML = "";
    target.forEach((v) => {
      const cell = document.createElement("div");
      cell.className = "paint-cell target";
      cell.style.background = paintCellColor(v);
      targetGrid.appendChild(cell);
    });
  }

  function renderPlayer() {
    playerGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    playerGrid.innerHTML = "";
    playerState.forEach((v, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "paint-cell";
      cell.dataset.idx = i;
      cell.style.background = v == null ? paintCellColor(0) : paintCellColor(v);
      cell.addEventListener("click", () => paintCell(i));
      playerGrid.appendChild(cell);
    });
  }

  function paintCell(i) {
    playerState[i] = activeIndex < 0 ? null : activeIndex;
    const cell = playerGrid.children[i];
    if (cell) cell.style.background = playerState[i] == null
      ? paintCellColor(0)
      : paintCellColor(playerState[i]);
    updateCounter();
  }

  function updateCounter() {
    const total = size * size;
    let match = 0;
    for (let i = 0; i < total; i += 1) {
      const t = target[i];
      const p = playerState[i];
      if (t === 0 && p == null) { match += 1; continue; }
      if (t === p) match += 1;
    }
    const pct = Math.round((match / total) * 100);
    if (counter) counter.textContent = `${match}/${total} · ${pct}%`;
    if (message) {
      if (match === total) {
        message.textContent = "Picture restored. The file remembered itself.";
        message.style.color = "var(--ok)";
      } else {
        message.textContent = `${total - match} pixels left.`;
        message.style.color = "";
      }
    }
  }

  function renderSwatches() {
    if (!swatchBar) return;
    swatchBar.innerHTML = "";
    PAINT_PALETTE.forEach((p, i) => {
      const sw = document.createElement("button");
      sw.type = "button";
      sw.className = "swatch" + (i === activeIndex ? " active" : "");
      sw.style.background = p.color;
      sw.title = p.name;
      sw.addEventListener("click", () => {
        activeIndex = i;
        renderSwatches();
      });
      swatchBar.appendChild(sw);
    });
  }

  newBtn?.addEventListener("click", () => {
    target = pickRandomTarget();
    playerState = new Array(size * size).fill(null);
    renderTarget();
    renderPlayer();
    updateCounter();
  });
  clearBtn?.addEventListener("click", () => {
    playerState = new Array(size * size).fill(null);
    renderPlayer();
    updateCounter();
  });
  eraseBtn?.addEventListener("click", () => {
    activeIndex = -1;
    renderSwatches();
  });

  renderTarget();
  renderPlayer();
  renderSwatches();
  updateCounter();
}

window.bootPaintPuzzle = bootPaintPuzzle;

const prevBootGames = window.bootDesktopGames;
window.bootDesktopGames = function bootDesktopGames(root = document) {
  if (prevBootGames) prevBootGames(root);
  if (window.bootPaintPuzzle) window.bootPaintPuzzle(root);
};
document.addEventListener("DOMContentLoaded", () => window.bootDesktopGames(document));
