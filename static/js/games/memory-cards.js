function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function bootMemoryCards(root) {
  const games = root.querySelectorAll?.('[data-game="memory-cards"]') || [];
  games.forEach((game) => {
    if (game.dataset.ready === "1") return;
    game.dataset.ready = "1";

    const data = game.querySelector(".memory-photo-data");
    const photos = data ? JSON.parse(data.textContent) : [];
    const board = game.querySelector("[data-memory-board]");
    const matchedEl = game.querySelector("[data-memory-matched]");
    const totalEl = game.querySelector("[data-memory-total]");
    const movesEl = game.querySelector("[data-memory-moves]");
    const messageEl = game.querySelector("[data-memory-message]");
    const shuffleBtn = game.querySelector("[data-memory-shuffle]");

    const state = {
      cards: [],
      flipped: [],
      locked: false,
      matched: 0,
      total: 0,
      moves: 0,
    };

    function renderStatus(message) {
      matchedEl.textContent = String(state.matched);
      totalEl.textContent = String(state.total);
      movesEl.textContent = String(state.moves);
      messageEl.textContent = message;
      board.classList.toggle("locked", state.locked);
    }

    function buildCard(card) {
      const button = document.createElement("button");
      button.className = "memory-card";
      button.type = "button";
      const back = document.createElement("span");
      back.className = "memory-card-face memory-card-back";
      back.innerHTML = '<span class="card-back-icon"></span>';
      const front = document.createElement("span");
      front.className = "memory-card-face memory-card-front";
      const image = document.createElement("img");
      image.src = card.src;
      image.alt = "";
      image.loading = "eager";
      image.addEventListener("error", () => {
        front.classList.add("image-missing");
        front.textContent = "missing";
      });
      front.appendChild(image);
      button.append(back, front);
      button.addEventListener("click", () => flip(card, button));
      card.node = button;
      return button;
    }

    function restart() {
      const selected = shuffle(photos).slice(0, 5);
      const pairs = selected.flatMap((src, index) => [
        { id: index, src, flipped: false, matched: false },
        { id: index, src, flipped: false, matched: false },
      ]);
      state.cards = shuffle(pairs);
      state.flipped = [];
      state.locked = false;
      state.matched = 0;
      state.moves = 0;
      state.total = selected.length;
      board.innerHTML = "";
      state.cards.forEach((card) => board.appendChild(buildCard(card)));
      renderStatus("Find every matching photo pair.");
    }

    function flip(card, node) {
      if (state.locked || card.flipped || card.matched) return;
      card.flipped = true;
      node.classList.add("flipped");
      state.flipped.push(card);

      if (state.flipped.length !== 2) return;
      state.moves += 1;
      state.locked = true;
      renderStatus("Checking files...");
      const [first, second] = state.flipped;

      if (first.id === second.id) {
        setTimeout(() => {
          first.matched = true;
          second.matched = true;
          first.node.classList.add("matched");
          second.node.classList.add("matched");
          state.matched += 1;
          state.flipped = [];
          state.locked = false;
          if (state.matched === state.total) {
            window.localStorage?.setItem("bornagain:memory-code", "heflow");
            renderStatus(`All pairs found in ${state.moves} moves. Code fragment: heflow`);
            return;
          }
          renderStatus("Pair restored.");
        }, 260);
        return;
      }

      setTimeout(() => {
        first.flipped = false;
        second.flipped = false;
        first.node.classList.remove("flipped");
        second.node.classList.remove("flipped");
        state.flipped = [];
        state.locked = false;
        renderStatus("Not this pair.");
      }, 720);
    }

    shuffleBtn.addEventListener("click", restart);
    restart();
  });
}

window.bootMemoryCards = bootMemoryCards;

window.bootDesktopGames = function bootDesktopGames(root = document) {
  if (window.bootFlappyBat) window.bootFlappyBat(root);
  if (window.bootMemoryCards) window.bootMemoryCards(root);
  if (window.bootExplorerMaze) window.bootExplorerMaze(root);
  if (window.bootCmdGame) window.bootCmdGame(root);
};

document.addEventListener("DOMContentLoaded", () => window.bootDesktopGames(document));
