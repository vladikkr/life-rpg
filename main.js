/* ══════════════════════════════════════════════
   Ссылка на скачивание.
   Когда приложение будет готово к раздаче — впиши сюда адрес APK.
   Пустая строка = кнопки показывают подсказку «Скоро».
   Пример: apk: "downloads/life-rpg-1.0.0.apk"
   ══════════════════════════════════════════════ */
const DOWNLOAD = {
  apk: "",
};

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const icons = () => { if (window.lucide) window.lucide.createIcons(); };
  icons();

  /* ── Тост ── */
  const toastEl = document.getElementById("toast");
  let toastTimer;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }

  /* ── Кнопки скачивания ── */
  document.querySelectorAll("[data-download]").forEach((btn) => {
    if (DOWNLOAD.apk) {
      btn.href = DOWNLOAD.apk;
      btn.setAttribute("download", "");
      return;
    }
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toast("Скоро! Ссылка появится в день релиза");
    });
  });

  /* ── Сундуки: те же шансы, что в приложении (ChestLoot.kt) ── */
  const CHESTS = {
    common: { name: "Обычный сундук", table: [700, 920, 990] },
    rare: { name: "Редкий сундук", table: [450, 800, 970] },
    epic: { name: "Эпический сундук", table: [230, 560, 930] },
    legendary: { name: "Легендарный сундук", table: [120, 380, 750] },
  };
  const RARITY = [
    ["ОБЫЧНАЯ", "var(--common)"],
    ["РЕДКАЯ", "var(--blue)"],
    ["ЭПИЧЕСКАЯ", "var(--purple)"],
    ["ЛЕГЕНДАРНАЯ", "var(--orange)"],
  ];
  const ATTRS = ["Сила", "Ловкость", "Восприятие", "Выносливость", "Интеллект", "Харизма"];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const odds = (t) => [t[0], t[1] - t[0], t[2] - t[1], 1000 - t[2]].map((v) => v / 10);

  function rollReward(type) {
    const x = Math.floor(Math.random() * 1000);
    const t = CHESTS[type].table;
    const r = x < t[0] ? 0 : x < t[1] ? 1 : x < t[2] ? 2 : 3;
    const a = pick(ATTRS);
    const xp = (min, max) => ({ r, title: "Очки: " + a, val: "+" + rnd(min, max), desc: "Для характеристики «" + a + "»" });
    const boost = (m) => ({ r, title: "Буст опыта", val: "×" + m, desc: "Опыт из квестов на 24 часа" });
    const coins = (min, max) => ({ r, title: "Монеты", val: rnd(min, max) + " L", desc: "На новые сундуки и улучшения" });
    if (r === 0) return xp(2, 5);
    if (r === 1) return Math.random() < 0.5 ? xp(6, 12) : boost("1.5");
    if (r === 2) return pick([() => xp(13, 25), () => boost("2"), () => coins(10, 30)])();
    return pick([
      () => xp(26, 50),
      () => boost("3"),
      () => coins(40, 100),
      () => ({ r, title: "Лимит замен", val: "×2", desc: "До 6 замен квестов навсегда" }),
    ])();
  }

  const stage = document.getElementById("stage");
  const rewardEl = document.getElementById("reward");
  const openBtn = document.getElementById("open");
  const tabs = document.querySelectorAll(".tabs button");
  let type = "common";
  let busy = false;

  function showOdds() {
    const o = odds(CHESTS[type].table);
    document.getElementById("odds-title").textContent = CHESTS[type].name;
    o.forEach((v, i) => {
      document.querySelector(`[data-o="${i}"]`).style.width = v + "%";
      document.querySelector(`[data-v="${i}"]`).textContent = (v % 1 ? v.toFixed(1) : v) + "%";
    });
  }

  function resetChest() {
    stage.classList.remove("opened", "shaking");
    openBtn.innerHTML = '<i data-lucide="key-round"></i>Открыть сундук';
    icons();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (busy) return;
      type = tab.dataset.c;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      stage.dataset.c = type;
      showOdds();
      resetChest();
    });
  });

  openBtn.addEventListener("click", () => {
    if (busy) return;
    if (stage.classList.contains("opened")) { resetChest(); return; }
    busy = true;
    stage.classList.add("shaking");
    openBtn.textContent = "Открываем…";
    const reward = rollReward(type);
    setTimeout(() => {
      const [label, color] = RARITY[reward.r];
      rewardEl.style.setProperty("--rc", color);
      rewardEl.innerHTML =
        `<span class="rr">${label}</span>` +
        `<span class="rt">${reward.title}</span>` +
        `<span class="rv">${reward.val}</span>` +
        `<span class="rd">${reward.desc}</span>`;
      stage.classList.remove("shaking");
      stage.classList.add("opened");
      openBtn.innerHTML = '<i data-lucide="rotate-ccw"></i>Ещё раз';
      icons();
      if (reward.r === 3) toast("Легендарная награда!");
      busy = false;
    }, reduceMotion ? 50 : 1100);
  });

  showOdds();
})();
