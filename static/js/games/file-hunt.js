function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function buildName(index, level, anomalyType, isTarget) {
  const base = ["note", "memory", "copy", "letter", "log", "desktop", "untitled"][index % 7];
  if (!isTarget) return `${base}_${String(index).padStart(3, "0")}.txt`;
  if (anomalyType === "extension") return `${base}_${String(index).padStart(3, "0")}.txf`;
  if (anomalyType === "name") return `${base}_${String(index).padStart(3, "0")}_dontlook.txt`;
  if (anomalyType === "exe") return `system_note_${level}.exe`;
  return `${base}_${String(index).padStart(3, "0")}.txt`;
}

function makeRound(level) {
  const easyCounts = [18, 24, 30];
  const count = level <= easyCounts.length ? easyCounts[level - 1] : Math.min(30 + (level - 3) * 8, 62);
  const anomalyIndex = Math.floor(Math.random() * count);
  const anomalyTypes = ["extension", "broken", "glitch", "runner", "name", "exe"];
  const anomalyType = anomalyTypes[(level - 1) % anomalyTypes.length];
  const files = [];

  for (let i = 0; i < count; i += 1) {
    const isTarget = i === anomalyIndex;
    const overlap = level > 2 ? randomBetween(-8, 8) : randomBetween(-4, 4);
    files.push({
      id: `file-${level}-${i}`,
      name: buildName(i, level, anomalyType, isTarget),
      x: randomBetween(1, 91),
      y: randomBetween(2, 86),
      dx: overlap,
      dy: level > 3 ? randomBetween(-8, 8) : randomBetween(-4, 4),
      r: randomBetween(-4, 4),
      z: Math.floor(randomBetween(1, 20)),
      anomaly: isTarget,
      decoy: !isTarget && level > 3 && Math.random() < 0.06,
      kind: isTarget ? anomalyType : Math.random() < 0.04 ? "exe" : "txt",
    });
  }

  return { files, anomalyType };
}

window.fileHuntGame = function fileHuntGame() {
  return {
    level: 1,
    score: 0,
    timeLeft: 45,
    timer: null,
    files: [],
    distractions: [],
    brief: "",
    message: "",
    lagging: false,
    dragging: null,
    movedDuringDrag: false,
    topZ: 30,
    easyMaxLevel: 3,
    promptOpen: false,
    codeFragment: "needto",
    extraMode: false,

    init() {
      this.newRound();
      window.addEventListener("pointermove", (event) => this.moveFileDrag(event));
      window.addEventListener("pointerup", () => this.stopFileDrag());
    },

    newRound() {
      clearInterval(this.timer);
      this.promptOpen = false;
      const round = makeRound(this.level);
      this.files = round.files;
      this.distractions = [];
      this.timeLeft = Math.max(18, 48 - this.level * 4);
      this.message = "Найди аномальный файл среди хаоса.";
      this.brief = this.describe(round.anomalyType);
      this.lagging = this.level >= 3;
      this.timer = setInterval(() => this.tick(), 1000);
      if (this.level >= 2) this.queueDistractions();
    },

    restartEasy() {
      clearInterval(this.timer);
      this.level = 1;
      this.score = 0;
      this.extraMode = false;
      this.newRound();
    },

    describe(type) {
      const map = {
        extension: "Один .txt файл имеет неправильное расширение.",
        broken: "Один файл выглядит битым.",
        glitch: "Один файл визуально глючит.",
        runner: "Один файл пытается убежать от курсора.",
        name: "Один файл назван слишком странно.",
        exe: "Один текстовый файл замаскирован под executable.",
      };
      return map[type] || "Один файл отличается от остальных.";
    },

    tick() {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.score = Math.max(0, this.score - 25);
        this.message = "Время вышло. Рабочий стол стал еще грязнее.";
        setTimeout(() => this.newRound(), 900);
      }
    },

    pick(file) {
      if (this.movedDuringDrag) {
        this.movedDuringDrag = false;
        return;
      }
      if (file.anomaly) {
        clearInterval(this.timer);
        this.score += 100 + this.level * 25 + this.timeLeft;
        this.message = `Найдено: ${file.name}`;
        if (!this.extraMode && this.level >= this.easyMaxLevel) {
          this.completeEasyRun();
          return;
        }
        this.level += 1;
        setTimeout(() => this.newRound(), 850);
        return;
      }
      this.score = Math.max(0, this.score - 10);
      file.dx += randomBetween(-16, 16);
      file.dy += randomBetween(-12, 12);
      this.message = "Почти обычный файл. Минус очки.";
    },

    completeEasyRun() {
      this.promptOpen = true;
      this.files = [];
      this.distractions = [];
      this.brief = "Easy mode complete.";
      this.message = `Фрагмент будущего кода сохранен: ${this.codeFragment}`;
      window.localStorage?.setItem("bornagain:file-hunt-code", this.codeFragment);
    },

    continueAfterEasy() {
      this.extraMode = true;
      this.promptOpen = false;
      this.level += 1;
      this.newRound();
    },

    stopAfterEasy() {
      this.promptOpen = false;
      this.message = `FILE_HUNT.EXE завершен. Код: ${this.codeFragment}`;
    },

    evade(file) {
      if (this.dragging) return;
      if (!file.anomaly || file.kind !== "runner") return;
      file.dx += randomBetween(-45, 45);
      file.dy += randomBetween(-35, 35);
      file.r += randomBetween(-8, 8);
    },

    startFileDrag(event, file) {
      file.z = ++this.topZ;
      this.dragging = {
        file,
        startX: event.clientX,
        startY: event.clientY,
        originDx: file.dx,
        originDy: file.dy,
      };
      this.movedDuringDrag = false;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },

    moveFileDrag(event) {
      if (!this.dragging) return;
      const deltaX = event.clientX - this.dragging.startX;
      const deltaY = event.clientY - this.dragging.startY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) this.movedDuringDrag = true;
      this.dragging.file.dx = this.dragging.originDx + deltaX;
      this.dragging.file.dy = this.dragging.originDy + deltaY;
    },

    stopFileDrag() {
      this.dragging = null;
    },

    queueDistractions() {
      const messages = [
        ["Low memory", "Close unused programs to continue."],
        ["Network", "Dial-up connection interrupted."],
        ["Explorer", "This folder may contain hidden files."],
      ];

      setTimeout(() => {
        const item = messages[Math.floor(Math.random() * messages.length)];
        this.distractions.push({
          id: `d-${Date.now()}`,
          title: item[0],
          text: item[1],
          x: randomBetween(8, 70),
          y: randomBetween(10, 68),
        });
      }, randomBetween(3500, 6500));
    },
  };
};

function ensureFileHuntGame() {
  return true;
}

window.ensureFileHuntGame = ensureFileHuntGame;
