/* Legacy hook left in place — only fires on the old empty-folder layout.
   The new game uses the x-data Alpine component below. */
function bootExplorerMaze(root) {
  const games = root.querySelectorAll?.('[data-game="explorer-maze"]') || [];
  games.forEach((game) => {
    if (game.dataset.ready === "1") return;
    game.dataset.ready = "1";

    const address = game.querySelector("[data-explorer-address]");
    const rootView = game.querySelector("[data-explorer-root]");
    const emptyView = game.querySelector("[data-explorer-empty]");
    if (!address || !rootView || !emptyView) return;
    const basePath = "C:\\Desktop\\Folders\\New Folder (17)\\Almost\\";

    game.querySelectorAll("[data-open-empty]").forEach((button) => {
      button.addEventListener("click", () => {
        const folder = button.dataset.openEmpty;
        address.textContent = `${basePath}${folder}\\`;
        rootView.hidden = true;
        emptyView.hidden = false;
      });
    });
  });
}
window.bootExplorerMaze = bootExplorerMaze;

/* =========================================================
   Explorer Maze v2 — Alpine component.
   The filesystem is a tree of nodes:
     { kind, label, id, children?, ... }
   kinds: folder | trap | note | exit | back
   ========================================================= */
window.explorerMazeGame = function explorerMazeGame() {
  const TREE = makeTree();
  return {
    root: TREE,
    path: [],
    steps: 0,
    message: "Найди папку EXIT. Некоторые двери возвращают в начало. Не доверяй именам.",
    modal: { open: false, title: "", body: "" },

    init() { /* no-op */ },

    get currentNode() {
      let n = this.root;
      for (const idx of this.path) n = n.children[idx];
      return n;
    },
    get currentEntries() {
      return this.currentNode.children || [];
    },
    get breadcrumbs() {
      const crumbs = ["C:", this.root.label];
      let n = this.root;
      for (const idx of this.path) {
        n = n.children[idx];
        crumbs.push(n.label);
      }
      return crumbs;
    },

    open(entry) {
      this.steps += 1;
      if (entry.kind === "folder") {
        const idx = this.currentEntries.indexOf(entry);
        if (idx >= 0) this.path.push(idx);
        this.message = `Открыта папка ${entry.label}.`;
        return;
      }
      if (entry.kind === "trap") {
        this.message = entry.message || "Папка съела сама себя. Возврат в корень.";
        this.path = [];
        document.body.classList.add("site-glitching");
        setTimeout(() => document.body.classList.remove("site-glitching"), 320);
        return;
      }
      if (entry.kind === "note") {
        this.modal = { open: true, title: entry.label, body: entry.text };
        this.message = `Прочитано ${entry.label}.`;
        return;
      }
      if (entry.kind === "exit") {
        this.modal = {
          open: true,
          title: "EXIT.lnk",
          body: `<p>Ты прошла лабиринт за <strong>${this.steps}</strong> шагов.</p><p>Файл сам открыл дверь. Можно идти.</p>`,
        };
        this.message = "Выход найден.";
        return;
      }
    },

    back() {
      if (this.path.length === 0) return;
      this.path.pop();
      this.steps += 1;
      this.message = "На уровень выше.";
    },

    reset() {
      this.path = [];
      this.steps = 0;
      this.message = "Лабиринт сброшен.";
      this.closeModal();
    },

    closeModal() { this.modal.open = false; },
  };
};

function makeTree() {
  let auto = 0;
  const id = () => `n-${++auto}`;
  const folder = (label, children) => ({ id: id(), kind: "folder", label, children });
  const trap   = (label, message)  => ({ id: id(), kind: "trap",   label, message });
  const note   = (label, text)     => ({ id: id(), kind: "note",   label, text });
  const exit   = (label)           => ({ id: id(), kind: "exit",   label });

  return folder("Папки", [
    folder("New Folder (1)", [
      folder("New Folder (2)", [
        trap("New Folder (3)", "Папка зациклилась сама в себя. Тебя выкинуло на стол."),
        note("заметка_01.txt", "<p>я оставил здесь подсказку и забыл какую.</p>"),
      ]),
      folder("Мемы", [
        folder("images", [
          note("подсказка.txt", "<p>Выход всегда в той папке, которая называется не так, как ты ожидаешь.</p>"),
        ]),
        trap("delete_me", "Файл сработал как ловушка. Возврат в корень."),
      ]),
    ]),
    folder("Almost", [
      folder("Almost-2", [
        folder("Almost-3", [
          folder("Almost-4", [
            note("almost.txt", "<p>почти. но не сейчас.</p>"),
            trap("not_here", "Похоже, не здесь."),
          ]),
        ]),
      ]),
      note("крошка.txt", "<p>в Almost ничего не лежит. Кроме напоминания.</p>"),
    ]),
    folder("system32_backup", [
      trap("rundll32.exe", "Файл выполнился сам. Сессия сброшена."),
      folder("hidden", [
        folder("deeper", [
          folder("deepest", [
            note("свет.txt", "<p>тёплая папка. но не выход.</p>"),
            exit("EXIT"),
          ]),
        ]),
      ]),
    ]),
    note("readme.txt", "<p>В лабиринте 3 ветви. Только в одной есть EXIT.</p><p>Подсказки разбросаны по веткам.</p><p>Ловушки возвращают в корень.</p>"),
  ]);
}

window.bootDesktopGames = function bootDesktopGames(root = document) {
  if (window.bootFlappyBat) window.bootFlappyBat(root);
  if (window.bootMemoryCards) window.bootMemoryCards(root);
  if (window.bootExplorerMaze) window.bootExplorerMaze(root);
  if (window.bootCmdGame) window.bootCmdGame(root);
};

document.addEventListener("DOMContentLoaded", () => window.bootDesktopGames(document));
