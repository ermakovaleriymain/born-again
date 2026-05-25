function bootFlappyBat(root) {
  const games = root.querySelectorAll?.('[data-game="flappy-bat"]') || [];
  games.forEach((game) => {
    if (game.dataset.ready === "1") return;
    game.dataset.ready = "1";

    const canvas = game.querySelector("[data-flappy-canvas]");
    const ctx = canvas.getContext("2d");
    const scoreEl = game.querySelector("[data-flappy-score]");
    const button = game.querySelector("[data-flappy-start]");
    const messageEl = game.querySelector("[data-flappy-message]");
    let state = null;
    let raf = null;
    let score = 0;

    function setScore(value) {
      score = value;
      scoreEl.textContent = String(score);
    }

    function resize() {
      const width = Math.max(300, Math.min(540, canvas.parentElement.clientWidth - 18));
      canvas.width = width;
      canvas.height = Math.floor(width * 0.62);
    }

    function drawBackground(frame = 0) {
      const width = canvas.width;
      const height = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#0a1018");
      grad.addColorStop(1, "#04070b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "rgba(180,220,240,0.55)";
      for (let i = 0; i < 28; i += 1) {
        const x = (i * 47 + frame * 0.18) % width;
        const y = (i * 31) % height;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.fillStyle = "rgba(29,86,111,0.18)";
      ctx.beginPath();
      ctx.arc(width * 0.78, height * 0.22, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawBat(x, y, frame) {
      ctx.save();
      ctx.translate(x, y);
      const wingUp = Math.sin(frame * 0.35) * 8;
      ctx.shadowColor = "rgba(78, 168, 201, 0.5)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#1c2735";
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#2a3a4d";
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.quadraticCurveTo(-20, -10 + wingUp, -26, 2);
      ctx.quadraticCurveTo(-18, 8, -4, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(20, -10 + wingUp, 26, 2);
      ctx.quadraticCurveTo(18, 8, 4, 4);
      ctx.fill();
      ctx.fillStyle = "#1c2735";
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.lineTo(-12, -18);
      ctx.lineTo(-4, -8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(8, -8);
      ctx.lineTo(12, -18);
      ctx.lineTo(4, -8);
      ctx.fill();
      ctx.fillStyle = "#6cc7e6";
      ctx.beginPath();
      ctx.arc(-4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#04070b";
      ctx.beginPath();
      ctx.arc(-4, -2, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -2, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPipe(x, topH) {
      const height = canvas.height;
      const pW = state.pipeW;
      const botY = topH + state.gap;
      ctx.fillStyle = "#2a3a4d";
      ctx.fillRect(x, 0, pW, topH);
      ctx.fillRect(x, botY, pW, height - botY);
      ctx.fillStyle = "#1d566f";
      ctx.fillRect(x - 4, topH - 14, pW + 8, 14);
      ctx.fillRect(x - 4, botY, pW + 8, 14);
      ctx.fillStyle = "rgba(78,168,201,0.15)";
      ctx.fillRect(x, 0, 2, topH);
      ctx.fillRect(x, botY, 2, height - botY);
    }

    function drawOverlay(title, sub) {
      const width = canvas.width;
      const height = canvas.height;
      ctx.save();
      ctx.fillStyle = "rgba(10, 6, 18, 0.92)";
      ctx.fillRect(width / 2 - 104, height / 2 - 32, 208, 64);
      ctx.strokeStyle = "#4ea8c9";
      ctx.strokeRect(width / 2 - 103.5, height / 2 - 31.5, 207, 63);
      ctx.fillStyle = "#dbe6f0";
      ctx.textAlign = "center";
      ctx.font = "bold 16px 'MS Sans Serif', Arial";
      ctx.fillText(title, width / 2, height / 2 - 5);
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillStyle = "#6cc7e6";
      ctx.fillText(sub, width / 2, height / 2 + 15);
      ctx.restore();
    }

    function drawScore() {
      ctx.save();
      ctx.fillStyle = "rgba(10, 6, 18, 0.85)";
      ctx.fillRect(8, 8, 134, 44);
      ctx.strokeStyle = "#4ea8c9";
      ctx.strokeRect(8.5, 8.5, 133, 43);
      ctx.fillStyle = "#dbe6f0";
      ctx.font = "bold 13px 'MS Sans Serif', Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 18, 28);
      ctx.font = "11px 'Courier New', monospace";
      ctx.fillStyle = "#6cc7e6";
      ctx.fillText(score >= 10 ? "goal reached" : "goal: 10", 18, 45);
      ctx.restore();
    }

    function drawIdle() {
      drawBackground();
      drawBat(canvas.width * 0.23, canvas.height * 0.44, 0);
      drawOverlay("BAT_SLEEP.EXE", "Press Start");
    }

    function spawnPipe() {
      const minH = canvas.height * 0.12;
      const maxH = canvas.height * 0.55;
      state.pipes.push({ x: canvas.width + 10, topH: minH + Math.random() * (maxH - minH), scored: false });
    }

    function end() {
      if (!state) return;
      state.running = false;
      button.textContent = "Try again";
      if (state.won) {
        window.localStorage?.setItem("bornagain:flappy-code", "gowitht");
        messageEl.textContent = "Crashed. Code fragment: gowitht";
        drawOverlay("Code: gowitht", `Score: ${score}`);
        return;
      }
      messageEl.textContent = `Crashed. Score: ${score}`;
      drawOverlay("Crashed", `Score: ${score}`);
    }

    function loop() {
      if (!state?.running || !canvas.isConnected) return;
      state.frame += 1;
      state.batFrame += 1;
      drawBackground(state.frame);

      if (state.frame % 96 === 0) spawnPipe();
      state.pipes.forEach((pipe) => {
        pipe.x -= state.pipeSpeed;
        if (!pipe.scored && pipe.x + state.pipeW < state.bat.x) {
          pipe.scored = true;
          setScore(score + 1);
          if (score >= 10 && !state.won) {
            state.won = true;
            messageEl.textContent = "Goal reached. Lose after this to receive the code.";
          }
        }
      });
      state.pipes = state.pipes.filter((pipe) => pipe.x > -55);
      state.pipes.forEach((pipe) => drawPipe(pipe.x, pipe.topH));

      state.bat.vy += state.gravity;
      state.bat.y += state.bat.vy;
      drawBat(state.bat.x, state.bat.y, state.batFrame);
      drawScore();

      const bx = state.bat.x;
      const by = state.bat.y;
      const br = state.bat.r - 10;
      if (by - br < 0 || by + br > canvas.height) return end();

      for (const pipe of state.pipes) {
        const pipePadding = 8;
        const inX = bx + br > pipe.x + pipePadding && bx - br < pipe.x + state.pipeW - pipePadding;
        const outsideGap = by - br < pipe.topH - pipePadding || by + br > pipe.topH + state.gap + pipePadding;
        if (inX && outsideGap) return end();
      }

      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (raf) cancelAnimationFrame(raf);
      resize();
      setScore(0);
      button.textContent = "Running";
      messageEl.textContent = "Keep the bat between the corrupted pipes.";
      state = {
        running: true,
        won: false,
        bat: { x: canvas.width * 0.23, y: canvas.height * 0.44, vy: 0, r: 18 },
        pipes: [],
        frame: 0,
        batFrame: 0,
        pipeW: 38,
        gap: canvas.height * 0.46,
        pipeSpeed: 1.65,
        gravity: 0.2,
        jumpV: -5,
      };
      raf = requestAnimationFrame(loop);
    }

    function jump() {
      if (!state?.running) {
        start();
        return;
      }
      state.bat.vy = state.jumpV;
    }

    button.addEventListener("click", start);
    canvas.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      jump();
    });
    window.addEventListener("resize", () => {
      if (!canvas.isConnected || state?.running) return;
      resize();
      drawIdle();
    });

    resize();
    drawIdle();
  });
}

window.bootFlappyBat = bootFlappyBat;

window.bootDesktopGames = function bootDesktopGames(root = document) {
  if (window.bootFlappyBat) window.bootFlappyBat(root);
  if (window.bootMemoryCards) window.bootMemoryCards(root);
  if (window.bootExplorerMaze) window.bootExplorerMaze(root);
  if (window.bootCmdGame) window.bootCmdGame(root);
};

document.addEventListener("DOMContentLoaded", () => window.bootDesktopGames(document));
