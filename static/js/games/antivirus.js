window.antivirusGame = function antivirusGame() {
  const pool = [
    { name: "kernel32.dll",         iconKind: "exe", malicious: false, hint: "system" },
    { name: "explorer.exe",         iconKind: "exe", malicious: false, hint: "system" },
    { name: "ntoskrnl.exe",         iconKind: "exe", malicious: false, hint: "system" },
    { name: "user32.dll",           iconKind: "exe", malicious: false, hint: "system" },
    { name: "alenushka.jpg",        iconKind: "img", malicious: false, hint: "photo" },
    { name: "memory_03.png",        iconKind: "img", malicious: false, hint: "photo" },
    { name: "backup_letter.txt",    iconKind: "txt", malicious: false, hint: "text" },
    { name: "readme_first.txt",     iconKind: "txt", malicious: false, hint: "text" },
    { name: "updater.tmp",          iconKind: "txt", malicious: false, hint: "temp" },

    { name: "svch0st.exe",          iconKind: "exe", malicious: true,  hint: "zero, not o" },
    { name: "explor3r.scr",         iconKind: "exe", malicious: true,  hint: ".scr is a screensaver/exec" },
    { name: "helper64.exe.exe",     iconKind: "exe", malicious: true,  hint: "double extension" },
    { name: "system32.exe.bin",     iconKind: "exe", malicious: true,  hint: "weird extension" },
    { name: "kerne1.dll",           iconKind: "exe", malicious: true,  hint: "one, not L" },
    { name: "task_helper.scr",      iconKind: "exe", malicious: true,  hint: ".scr executes" },
    { name: "def_not_keylogger.dat",iconKind: "txt", malicious: true,  hint: "obvious" },
    { name: "ImageViewer.exe.lnk",  iconKind: "exe", malicious: true,  hint: "shortcut bait" },
  ];

  function shuffled(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickRoster() {
    const malware  = pool.filter((p) => p.malicious);
    const clean    = pool.filter((p) => !p.malicious);
    const roster = shuffled(malware).slice(0, 4).concat(shuffled(clean).slice(0, 8));
    return shuffled(roster).map((entry, idx) => ({
      ...entry,
      id: `f-${idx}-${entry.name}`,
      scannedAs: null,
      deleted: false,
    }));
  }

  return {
    files: [],
    scanProgress: 0,
    scanning: false,
    finalized: false,
    message: "Нажми «Сканировать» чтобы проверить диск.",
    meterLabel: "ОЖИДАНИЕ",

    init() {
      this.files = pickRoster();
    },

    restart() {
      this.scanning = false;
      this.finalized = false;
      this.scanProgress = 0;
      this.message = "Новая сессия. Нажми «Сканировать».";
      this.files = pickRoster();
    },

    rescan() {
      if (this.scanning) return;
      this.scanning = true;
      this.finalized = false;
      this.scanProgress = 0;
      this.meterLabel = "СКАНИРОВАНИЕ СЕКТОР 0x00";
      this.files.forEach((f) => { f.scannedAs = null; });

      let step = 0;
      const total = this.files.length;
      const tick = () => {
        step += 1;
        const pct = Math.min(100, Math.round((step / total) * 100));
        this.scanProgress = pct;
        this.meterLabel = `СКАНИРОВАНИЕ СЕКТОР 0x${(step * 31).toString(16).padStart(2, "0").toUpperCase()}`;
        if (step <= total) {
          const target = this.files[step - 1];
          if (target) {
            const truth = target.malicious;
            const lie   = Math.random() < 0.15;
            target.scannedAs = (truth !== lie) ? "suspicious" : "safe";
          }
          setTimeout(tick, 220 + Math.random() * 160);
        } else {
          this.scanning = false;
          this.meterLabel = "СКАНИРОВАНИЕ ЗАВЕРШЕНО";
          this.message = "Готово. Помеченные файлы перепроверь и нажми «Подтвердить».";
        }
      };
      setTimeout(tick, 200);
    },

    toggleQuarantine(file) {
      if (this.scanning || this.finalized) return;
      file.deleted = !file.deleted;
    },

    finalize() {
      if (this.scanning || this.finalized) return;
      this.finalized = true;
      const correctKills = this.files.filter((f) => f.malicious && f.deleted).length;
      const wrongKills   = this.files.filter((f) => !f.malicious && f.deleted).length;
      const missed       = this.files.filter((f) => f.malicious && !f.deleted).length;
      const score = correctKills * 2 - wrongKills * 3 - missed;
      let verdict;
      if (missed === 0 && wrongKills === 0) {
        verdict = "Чисто. Все вирусы пойманы, ничего лишнего не удалено.";
      } else if (missed > 0 && wrongKills === 0) {
        verdict = `Выжили. ${missed} угроз(а) всё ещё в системе. Не спи.`;
      } else if (wrongKills > 0 && missed === 0) {
        verdict = `Система нестабильна. В карантин ушло ${wrongKills} здоровых файл(ов).`;
      } else {
        verdict = `Скомпрометировано. Пропущено: ${missed}, сломано: ${wrongKills}. Попробуй ещё раз.`;
      }
      this.message = `${verdict}   очки: ${score}`;
    },

    get quarantined() {
      return this.files.filter((f) => f.deleted).length;
    },
    get threatsLeft() {
      return this.files.filter((f) => f.malicious && !f.deleted).length;
    },

    statusLabel(file) {
      if (file.deleted)                    return "[В КАРАНТИНЕ]";
      if (!file.scannedAs)                 return "?";
      if (file.scannedAs === "suspicious") return "ПОДОЗРИТЕЛЬНЫЙ";
      return "в норме";
    },
  };
};
