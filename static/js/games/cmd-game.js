function durationSinceMeeting(now = new Date()) {
  const start = new Date(2026, 2, 10, 19, 57, 0);
  let months = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  const anchor = new Date(start);
  anchor.setMonth(start.getMonth() + months);
  if (anchor > now) {
    months -= 1;
    anchor.setMonth(start.getMonth() + months);
  }
  let diff = Math.max(0, now - anchor);
  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  return `${months} месяцев, ${days} дней, ${minutes} минут, ${seconds} секунд`;
}

function bootCmdGame(root) {
  const games = root.querySelectorAll?.('[data-game="cmd-game"]') || [];
  games.forEach((game) => {
    if (game.dataset.ready === "1") return;
    game.dataset.ready = "1";

    const output = game.querySelector("[data-cmd-output]");
    const form = game.querySelector("[data-cmd-form]");
    const input = game.querySelector("[data-cmd-input]");

    function print(line = "") {
      output.textContent += `\n${line}`;
      output.scrollTop = output.scrollHeight;
    }

    function run(command) {
      const normalized = command.trim().toLowerCase();
      print(`C:\\OLD_PC> ${command}`);
      if (!normalized) return;

      if (normalized === "help") {
        print("date                  time since 10.03.2026 19:57");
        print("goodtoseeyou          open note");
        print("needtogowiththeflow   open final letter");
        print("help                  show commands");
        return;
      }

      if (normalized === "date") {
        print(durationSinceMeeting(new Date()));
        return;
      }

      if (normalized === "goodtoseeyou") {
        print("Opening goodtoseeyou.txt...");
        window.desktopOpenWindow?.("goodtoseeyou-note");
        return;
      }

      if (normalized === "needtogowiththeflow") {
        print("Opening final letter...");
        window.desktopOpenWindow?.("final-letter");
        return;
      }

      print(`Bad command or file name: ${command}`);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      run(input.value);
      input.value = "";
    });

    setTimeout(() => input.focus(), 50);
  });
}

window.bootCmdGame = bootCmdGame;

window.bootDesktopGames = function bootDesktopGames(root = document) {
  if (window.bootFlappyBat) window.bootFlappyBat(root);
  if (window.bootMemoryCards) window.bootMemoryCards(root);
  if (window.bootExplorerMaze) window.bootExplorerMaze(root);
  if (window.bootCmdGame) window.bootCmdGame(root);
  if (window.bootMusicPlayer) window.bootMusicPlayer(root);
};

document.addEventListener("DOMContentLoaded", () => window.bootDesktopGames(document));
