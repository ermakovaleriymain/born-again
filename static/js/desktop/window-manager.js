function cloneRegistry() {
  const node = document.getElementById("window-registry");
  return node ? JSON.parse(node.textContent) : {};
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const ICON_POS_KEY = "bornagain:icon-positions:v1";

function loadIconPositions() {
  try {
    const raw = localStorage.getItem(ICON_POS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (_) {
    return {};
  }
}
function saveIconPositions(map) {
  try { localStorage.setItem(ICON_POS_KEY, JSON.stringify(map)); } catch (_) {}
}

function applySavedIconPositions() {
  const positions = loadIconPositions();
  document.querySelectorAll(".desktop-icon").forEach((icon) => {
    const id = icon.dataset.iconId || icon.dataset.windowId;
    if (!id || !positions[id]) return;
    icon.style.left = `${positions[id].x}px`;
    icon.style.top  = `${positions[id].y}px`;
  });
}

function attachIconDrag() {
  let drag = null;
  let suppressClickUntil = 0;

  document.addEventListener("pointerdown", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (!icon) return;
    if (event.button !== 0) return;
    const area = icon.parentElement;
    const areaRect = area.getBoundingClientRect();
    const rect = icon.getBoundingClientRect();
    drag = {
      el: icon,
      id: icon.dataset.iconId || icon.dataset.windowId || "anon",
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      areaRect,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
    };
    try { icon.setPointerCapture(event.pointerId); } catch (_) {}
  }, true);

  document.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 4) {
      drag.moved = true;
      drag.el.classList.add("dragging");
    }
    if (!drag.moved) return;
    const x = clamp(event.clientX - drag.areaRect.left - drag.offsetX, 0, drag.areaRect.width  - drag.el.offsetWidth);
    const y = clamp(event.clientY - drag.areaRect.top  - drag.offsetY, 0, drag.areaRect.height - drag.el.offsetHeight);
    drag.el.style.left = `${x}px`;
    drag.el.style.top  = `${y}px`;
  });

  function endDrag(event) {
    if (!drag) return;
    if (drag.moved) {
      const x = parseFloat(drag.el.style.left) || 0;
      const y = parseFloat(drag.el.style.top)  || 0;
      const positions = loadIconPositions();
      positions[drag.id] = { x, y };
      saveIconPositions(positions);
      suppressClickUntil = Date.now() + 250;
    }
    drag.el.classList.remove("dragging");
    try { drag.el.releasePointerCapture(drag.pointerId); } catch (_) {}
    drag = null;
  }
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);

  document.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil) {
      event.stopPropagation();
      event.preventDefault();
    }
  }, true);
}

window.desktopOS = function desktopOS() {
  return {
    registry: {},
    windows: [],
    focusedWindow: null,
    selectedIcon: null,
    zCounter: 20,
    clock: "",
    popups: [],
    drag: null,

    boot() {
      document.documentElement.dataset.desktopReady = "alpine";
      window.desktopOpenWindow = (id) => this.openWindow(id);
      this.registry = cloneRegistry();
      this.tickClock();
      setInterval(() => this.tickClock(), 1000);
      setTimeout(() => {
        document.querySelector("[data-boot-screen]")?.classList.add("hidden");
      }, 1900);
      setTimeout(() => this.openWindow("readme"), 350);
      setTimeout(() => this.spawnPopup("System32", "Восстановление сессии завершено с ошибками."), 1800);
      this.scheduleAmbience();

      requestAnimationFrame(() => {
        applySavedIconPositions();
        attachIconDrag();
      });

      document.body.addEventListener("dblclick", (event) => {
        const icon = event.target.closest(".desktop-icon");
        if (icon?.dataset.windowId) this.openWindow(icon.dataset.windowId);
      });
      document.body.addEventListener("click", (event) => {
        const opener = event.target.closest("[data-open-window]");
        if (opener?.dataset.openWindow) this.openWindow(opener.dataset.openWindow);
        if (event.target.closest("[data-trash-glitch]")) this.triggerSiteGlitch(1600);
      });
      window.addEventListener("pointermove", (event) => this.onDrag(event));
      window.addEventListener("pointerup", () => this.stopDrag());
      document.body.addEventListener("htmx:afterSwap", (event) => {
        if (window.Alpine) window.Alpine.initTree(event.target);
        if (window.bootDesktopGames) window.bootDesktopGames(event.target);
      });
    },

    tickClock() {
      this.clock = new Intl.DateTimeFormat("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    },

    clearFocus(event) {
      if (event.target.closest(".desktop-icon, .win98-window, .taskbar, .system-popup")) return;
      this.selectedIcon = null;
    },

    selectIcon(id) { this.selectedIcon = id; },

    openWindow(id) {
      const existing = this.windows.find((win) => win.id === id);
      if (existing) {
        existing.minimized = false;
        this.focusWindow(id);
        return;
      }
      const def = this.registry[id];
      if (!def) return;
      const width = Math.min(def.width || 520, window.innerWidth - 18);
      const height = Math.min(def.height || 360, window.innerHeight - 58);
      const win = {
        ...def,
        id,
        width,
        height,
        x: clamp(def.x || 80, 4, Math.max(4, window.innerWidth - width - 8)),
        y: clamp(def.y || 60, 4, Math.max(4, window.innerHeight - height - 48)),
        z: ++this.zCounter,
        minimized: false,
        maximized: false,
        prev: null,
      };
      this.windows.push(win);
      this.focusedWindow = id;
    },

    focusWindow(id) {
      const win = this.windows.find((item) => item.id === id);
      if (!win) return;
      win.z = ++this.zCounter;
      this.focusedWindow = id;
    },

    closeWindow(id) {
      this.windows = this.windows.filter((win) => win.id !== id);
      if (this.focusedWindow === id) {
        this.focusedWindow = this.windows.length ? this.windows[this.windows.length - 1].id : null;
      }
    },

    minimizeWindow(id) {
      const win = this.windows.find((item) => item.id === id);
      if (!win) return;
      win.minimized = true;
      this.focusedWindow = null;
    },

    restoreOrFocus(id) {
      const win = this.windows.find((item) => item.id === id);
      if (!win) return;
      win.minimized = false;
      this.focusWindow(id);
    },

    toggleMaximize(id) {
      const win = this.windows.find((item) => item.id === id);
      if (!win) return;
      if (win.maximized) {
        Object.assign(win, win.prev);
        win.maximized = false;
        return;
      }
      win.prev = { x: win.x, y: win.y, width: win.width, height: win.height };
      win.x = 4;
      win.y = 4;
      win.width = window.innerWidth - 8;
      win.height = window.innerHeight - 48;
      win.maximized = true;
      this.focusWindow(id);
    },

    windowStyle(win) {
      return `left:${win.x}px; top:${win.y}px; width:${win.width}px; height:${win.height}px; z-index:${win.z}`;
    },

    startDrag(event, win) {
      if (win.maximized) return;
      this.focusWindow(win.id);
      this.drag = {
        id: win.id,
        startX: event.clientX,
        startY: event.clientY,
        originX: win.x,
        originY: win.y,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },

    onDrag(event) {
      if (!this.drag) return;
      const win = this.windows.find((item) => item.id === this.drag.id);
      if (!win) return;
      win.x = clamp(this.drag.originX + event.clientX - this.drag.startX, -win.width + 80, window.innerWidth - 40);
      win.y = clamp(this.drag.originY + event.clientY - this.drag.startY, 0, window.innerHeight - 54);
    },

    stopDrag() { this.drag = null; },

    spawnPopup(title, message) {
      const w = 248;
      const h = 96;
      const maxX = Math.max(20, window.innerWidth - w - 20);
      const maxY = Math.max(20, window.innerHeight - h - 60);
      this.popups.push({
        id: `popup-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        message,
        x: Math.round(20 + Math.random() * (maxX - 20)),
        y: Math.round(20 + Math.random() * (maxY - 20)),
        z: ++this.zCounter,
      });
    },

    dismissPopup(id) {
      this.popups = this.popups.filter((popup) => popup.id !== id);
    },

    triggerSiteGlitch(duration = 280) {
      document.body.classList.add("site-glitching");
      setTimeout(() => document.body.classList.remove("site-glitching"), duration);
    },

    triggerScreenTear() {
      const root = document.body;
      root.style.setProperty("--tear-y", `${Math.round(10 + Math.random() * 80)}%`);
      root.style.setProperty("--tear-x", `${Math.round((Math.random() * 12) - 6)}px`);
      root.classList.add("screen-tear");
      setTimeout(() => root.classList.remove("screen-tear"), 220 + Math.random() * 180);
    },

    shudderRandomIcon() {
      const icons = document.querySelectorAll(".desktop-icon");
      if (!icons.length) return;
      const node = icons[Math.floor(Math.random() * icons.length)];
      node.classList.remove("shudder");
      void node.offsetWidth;
      node.classList.add("shudder");
      setTimeout(() => node.classList.remove("shudder"), 360);
    },

    chromaticBurst() {
      const cands = document.querySelectorAll(".win-title, .ambient-note, .start-button, .tray");
      if (!cands.length) return;
      const node = cands[Math.floor(Math.random() * cands.length)];
      node.classList.remove("chromatic");
      void node.offsetWidth;
      node.classList.add("chromatic");
      setTimeout(() => node.classList.remove("chromatic"), 180);
    },

    scheduleAmbience() {
      const whispers = [
        ["NTFS.sys",     "Файл смотрит в ответ."],
        ["explorer.exe", "Я пересобрал рабочий стол. Иконки помнят, где стояли."],
        ["MEMORY.DMP",   "Фрагмент голоса восстановлен. Источник: deleted_letters/03.wav"],
        ["taskmgr",      "Процесс, который ты не запускал, завершился штатно."],
        ["chkdsk",       "Сектор 0x9A — ещё тёплый."],
        ["winlogon",     "Сессия 03:17 не была закрыта корректно."],
        ["dwm.exe",      "Один кадр не отрисован. Уже не отрисуется."],
        ["svchost",      "Слышу клавиши. Кто-то печатает поверх тебя."],
      ];

      const ambienceTick = () => {
        const delay = 12000 + Math.random() * 18000;
        setTimeout(() => {
          const [t, m] = whispers[Math.floor(Math.random() * whispers.length)];
          this.spawnPopup(t, m);
          ambienceTick();
        }, delay);
      };

      const glitchTick = () => {
        const delay = 6000 + Math.random() * 9000;
        setTimeout(() => {
          const r = Math.random();
          if (r < 0.35) {
            this.triggerSiteGlitch(200 + Math.random() * 220);
          } else if (r < 0.65) {
            this.triggerScreenTear();
          } else if (r < 0.85) {
            this.shudderRandomIcon();
          } else {
            this.chromaticBurst();
          }
          glitchTick();
        }, delay);
      };

      ambienceTick();
      glitchTick();
    },
  };
};

function bootVanillaFallback() {
  if (document.documentElement.dataset.desktopReady) return;
  const registry = cloneRegistry();
  const desktop = document.querySelector(".desktop-area");
  const taskbarItems = document.querySelector(".taskbar-items");
  if (!desktop) return;

  let zCounter = 100;
  const openWindows = new Map();

  applySavedIconPositions();
  attachIconDrag();

  function loadContent(win, body) {
    const url = win.load === "htmx" ? win.url : `/windows/${win.id}/`;
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        body.innerHTML = html;
        if (window.Alpine) window.Alpine.initTree(body);
        if (window.bootDesktopGames) window.bootDesktopGames(body);
      })
      .catch(() => {
        body.innerHTML = '<div class="notepad"><p>Window content failed to load.</p></div>';
      });
  }

  function focusWindow(node) {
    zCounter += 1;
    node.style.zIndex = zCounter;
    document.querySelectorAll(".win98-window").forEach((item) => item.classList.remove("focused"));
    node.classList.add("focused");
  }

  function addTask(win, node) {
    if (!taskbarItems) return;
    const task = document.createElement("button");
    task.className = "taskbar-item active";
    task.type = "button";
    task.textContent = win.title;
    task.addEventListener("click", () => {
      node.style.display = "";
      focusWindow(node);
    });
    taskbarItems.appendChild(task);
    node.dataset.taskId = win.id;
  }

  function openWindow(id) {
    if (openWindows.has(id)) {
      const existing = openWindows.get(id);
      existing.style.display = "";
      focusWindow(existing);
      return;
    }

    const def = registry[id];
    if (!def) return;
    const win = { ...def, id };
    const node = document.createElement("article");
    node.className = "win98-window focused";
    node.style.left = `${Math.min(win.x || 80, window.innerWidth - 300)}px`;
    node.style.top = `${Math.min(win.y || 60, window.innerHeight - 210)}px`;
    node.style.width = `${Math.min(win.width || 520, window.innerWidth - 18)}px`;
    node.style.height = `${Math.min(win.height || 360, window.innerHeight - 58)}px`;
    node.style.zIndex = ++zCounter;
    node.innerHTML = `
      <header class="win-titlebar">
        <div class="win-title"><span class="win-title-icon"></span><span></span></div>
        <div class="win-buttons">
          <button class="win-btn" type="button" data-action="minimize">_</button>
          <button class="win-btn" type="button" data-action="maximize">□</button>
          <button class="win-btn win-btn-close" type="button" data-action="close">×</button>
        </div>
      </header>
      <div class="win-toolbar"><button>File</button><button>Edit</button><button>View</button><button>Help</button></div>
      <section class="win-content"></section>
    `;
    node.querySelector(".win-title span:last-child").textContent = win.title;
    const body = node.querySelector(".win-content");
    desktop.appendChild(node);
    openWindows.set(id, node);
    addTask(win, node);
    loadContent(win, body);
    focusWindow(node);

    let drag = null;
    const titlebar = node.querySelector(".win-titlebar");
    titlebar.addEventListener("pointerdown", (event) => {
      drag = {
        x: event.clientX,
        y: event.clientY,
        left: parseFloat(node.style.left),
        top: parseFloat(node.style.top),
      };
      focusWindow(node);
    });
    window.addEventListener("pointermove", (event) => {
      if (!drag) return;
      node.style.left = `${drag.left + event.clientX - drag.x}px`;
      node.style.top = `${Math.max(0, drag.top + event.clientY - drag.y)}px`;
    });
    window.addEventListener("pointerup", () => { drag = null; });

    node.addEventListener("pointerdown", () => focusWindow(node));
    node.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      if (action === "close") {
        openWindows.delete(id);
        node.remove();
        taskbarItems?.querySelectorAll(".taskbar-item").forEach((item) => {
          if (item.textContent === win.title) item.remove();
        });
      }
      if (action === "minimize") node.style.display = "none";
      if (action === "maximize") {
        node.style.left = "4px";
        node.style.top = "4px";
        node.style.width = `${window.innerWidth - 8}px`;
        node.style.height = `${window.innerHeight - 48}px`;
      }
    });
  }

  window.desktopOpenWindow = openWindow;

  document.body.addEventListener("dblclick", (event) => {
    const icon = event.target.closest(".desktop-icon");
    if (icon?.dataset.windowId) openWindow(icon.dataset.windowId);
  });
  document.body.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-window]");
    if (opener?.dataset.openWindow) openWindow(opener.dataset.openWindow);
    if (event.target.closest("[data-trash-glitch]")) {
      document.body.classList.add("site-glitching");
      setTimeout(() => document.body.classList.remove("site-glitching"), 1800);
    }
  });

  document.querySelector(".start-button")?.addEventListener("click", () => openWindow("readme"));
  setTimeout(() => {
    document.querySelector("[data-boot-screen]")?.classList.add("hidden");
  }, 1900);
  setTimeout(() => openWindow("readme"), 350);
}

window.addEventListener("load", () => {
  setTimeout(bootVanillaFallback, 800);
});
