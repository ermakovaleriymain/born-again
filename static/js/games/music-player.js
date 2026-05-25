function bootMusicPlayer(root) {
  const players = root.querySelectorAll?.('[data-game="music-player"]') || [];
  players.forEach((player) => {
    if (player.dataset.ready === "1") return;
    player.dataset.ready = "1";
    initMusicPlayer(player);
  });
}

function initMusicPlayer(player) {
  const dataNode  = player.querySelector(".music-tracks");
  const titleEl   = player.querySelector("[data-music-title]");
  const artistEl  = player.querySelector("[data-music-artist]");
  const curEl     = player.querySelector("[data-music-current]");
  const durEl     = player.querySelector("[data-music-duration]");
  const progress  = player.querySelector("[data-music-progress]");
  const progFill  = player.querySelector("[data-music-progress-fill]");
  const playBtn   = player.querySelector("[data-music-play]");
  const prevBtn   = player.querySelector("[data-music-prev]");
  const nextBtn   = player.querySelector("[data-music-next]");
  const volRange  = player.querySelector("[data-music-volume]");
  const listEl    = player.querySelector("[data-music-list]");
  const audio     = player.querySelector("[data-music-audio]");

  let tracks = [];
  try { tracks = JSON.parse(dataNode.textContent); } catch (_) { tracks = []; }

  let index = 0;

  function format(sec) {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function renderList() {
    listEl.innerHTML = "";
    tracks.forEach((t, i) => {
      const li = document.createElement("li");
      li.className = "music-track" + (i === index ? " active" : "");
      li.innerHTML = `
        <span class="music-track-no">${(i + 1).toString().padStart(2, "0")}</span>
        <span class="music-track-name">
          <strong>${escapeHtml(t.title)}</strong>
          <span>${escapeHtml(t.artist)}</span>
        </span>
      `;
      li.addEventListener("click", () => {
        index = i;
        load(true);
      });
      listEl.appendChild(li);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function load(autoplay) {
    const t = tracks[index];
    if (!t) return;
    audio.src = t.src;
    titleEl.textContent = t.title;
    artistEl.textContent = t.artist;
    progFill.style.width = "0%";
    curEl.textContent = "0:00";
    renderList();
    if (autoplay) audio.play().catch(() => {});
  }

  function togglePlay() {
    if (!audio.src) load(false);
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function next() { index = (index + 1) % tracks.length; load(true); }
  function prev() { index = (index - 1 + tracks.length) % tracks.length; load(true); }

  playBtn?.addEventListener("click", togglePlay);
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);
  volRange?.addEventListener("input", () => { audio.volume = Number(volRange.value) / 100; });

  progress?.addEventListener("click", (event) => {
    if (!audio.duration) return;
    const rect = progress.getBoundingClientRect();
    const pct = (event.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(audio.duration, pct * audio.duration));
  });

  audio.addEventListener("loadedmetadata", () => {
    durEl.textContent = format(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    curEl.textContent = format(audio.currentTime);
    if (audio.duration > 0) {
      progFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });
  audio.addEventListener("play",  () => { playBtn.textContent = "⏸"; });
  audio.addEventListener("pause", () => { playBtn.textContent = "▶"; });
  audio.addEventListener("ended", next);

  audio.volume = Number(volRange?.value || 60) / 100;
  if (tracks.length) load(false);
}

window.bootMusicPlayer = bootMusicPlayer;
