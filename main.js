/* ══════════════════════════════════════════════
   Ссылки на скачивание.
   Когда приложение будет готово к раздаче — впиши сюда адреса.
   Пустая строка = кнопка показывает «Скоро».
   Пример: apk: "downloads/life-rpg-2.2.0.apk"
   ══════════════════════════════════════════════ */
const DOWNLOAD = {
  apk: "",
  play: "",
};

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Иконки ── */
  if (window.lucide) window.lucide.createIcons();

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
  let anyLink = false;
  document.querySelectorAll("[data-download]").forEach((btn) => {
    const url = DOWNLOAD[btn.dataset.download];
    if (url) {
      anyLink = true;
      btn.href = url;
      if (btn.dataset.download === "apk") btn.setAttribute("download", "");
      else btn.target = "_blank";
    } else {
      btn.setAttribute("aria-disabled", "true");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toast("Скоро! Ссылка появится в день релиза");
      });
    }
  });
  if (!anyLink) document.getElementById("dl-soon").hidden = false;

  /* ── Бегущая строка: дублируем содержимое для бесшовной прокрутки ── */
  document.querySelectorAll("[data-ticker]").forEach((row) => {
    row.innerHTML += row.innerHTML;
  });

  /* ── Появление при прокрутке ── */
  const revealEls = document.querySelectorAll(".reveal, .ranks");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  // Каскад: соседние карточки появляются по очереди
  document.querySelectorAll(".steps, .features, .attr-list, .faq, .numbers-grid, .hero-copy").forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = i * 70 + "ms";
    });
  });
  document.querySelectorAll(".ranks li").forEach((li, i) => {
    li.style.transitionDelay = i * 60 + "ms";
  });

  /* ── Диаграмма характеристик ── */
  const ATTRS = [
    { name: "Сила", color: "#FF9600" },
    { name: "Ловкость", color: "#58CC02" },
    { name: "Восприятие", color: "#1CB0F6" },
    { name: "Выносливость", color: "#CE82FF" },
    { name: "Интеллект", color: "#6C7BFF" },
    { name: "Харизма", color: "#FF5FA2" },
  ];
  const START = [72, 64, 58, 81, 90, 47];
  const MAX = 100; // порог характеристик для перехода с «Адепта» на «Рыцаря»
  const CX = 160, CY = 160, R = 108;
  const NS = "http://www.w3.org/2000/svg";

  const svg = document.querySelector(".radar");
  const gridG = svg.querySelector(".radar-grid");
  const shape = svg.querySelector(".radar-shape");
  const dotsG = svg.querySelector(".radar-dots");
  const labelsG = svg.querySelector(".radar-labels");

  const angle = (i) => (-90 + i * 60) * (Math.PI / 180);
  const pt = (i, r) => [CX + Math.cos(angle(i)) * r, CY + Math.sin(angle(i)) * r];
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // сетка: сначала внешнее кольцо (с заливкой), затем внутренние
  [1, 0.75, 0.5, 0.25].forEach((f) => {
    const pts = ATTRS.map((_, i) => pt(i, R * f).join(",")).join(" ");
    gridG.appendChild(el("polygon", { points: pts }));
  });
  ATTRS.forEach((_, i) => {
    const [x, y] = pt(i, R);
    gridG.appendChild(el("line", { x1: CX, y1: CY, x2: x, y2: y }));
  });

  const dots = ATTRS.map((a) => {
    const c = el("circle", { r: 7, fill: a.color });
    dotsG.appendChild(c);
    return c;
  });
  const valLabels = ATTRS.map((a, i) => {
    const [x, y] = pt(i, R + 30);
    const anchor = Math.abs(x - CX) < 4 ? "middle" : x > CX ? "start" : "end";
    const dx = anchor === "start" ? -10 : anchor === "end" ? 10 : 0;
    const name = el("text", { x: x + dx, y: y - 3, "text-anchor": anchor });
    name.textContent = a.name;
    const val = el("text", { x: x + dx, y: y + 13, "text-anchor": anchor, class: "val", fill: a.color });
    labelsG.append(name, val);
    return val;
  });

  let values = START.map(() => 8);
  function draw(vals) {
    const pts = vals.map((v, i) => pt(i, (Math.min(v, MAX) / MAX) * R));
    shape.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    pts.forEach(([x, y], i) => {
      dots[i].setAttribute("cx", x);
      dots[i].setAttribute("cy", y);
      valLabels[i].textContent = Math.round(vals[i]);
    });
  }

  function animateTo(target, ms = 900) {
    const from = values.slice();
    if (reduceMotion) { values = target.slice(); draw(values); return; }
    const t0 = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      values = from.map((f, i) => f + (target[i] - f) * e);
      draw(values);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  draw(values);

  const radarIO = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) { animateTo(START, 1300); radarIO.disconnect(); }
  }, { threshold: 0.35 });
  radarIO.observe(svg);

  // Кнопка «Выполнить квесты дня»: каждая характеристика получает немного очков
  const radarBtn = document.getElementById("radar-btn");
  const radarNote = document.getElementById("radar-note");
  let days = 0;
  radarBtn.addEventListener("click", () => {
    days++;
    const gains = ATTRS.map(() => 2 + Math.floor(Math.random() * 9));
    let target = values.map((v, i) => v + gains[i]);
    if (target.some((v) => v >= MAX)) {
      target = START.slice();
      days = 0;
      radarNote.textContent = "Порог взят! Пора на испытание ранга. Начинаем заново";
      animateTo(target);
      return;
    }
    animateTo(target, 700);
    gains.forEach((g, i) => {
      const [x, y] = pt(i, (Math.min(target[i], MAX) / MAX) * R);
      const t = el("text", { x, y: y - 14, "text-anchor": "middle", fill: ATTRS[i].color, class: "radar-plus" });
      t.textContent = "+" + g;
      labelsG.appendChild(t);
      setTimeout(() => t.remove(), 1200);
    });
    const total = gains.reduce((a, b) => a + b, 0);
    radarNote.textContent = `День ${days}: +${total} очков характеристик`;
  });

  // Подсветка вершины при наведении на карточку характеристики
  document.querySelectorAll(".attr[data-attr]").forEach((card) => {
    const i = +card.dataset.attr;
    card.addEventListener("mouseenter", () => dots[i].classList.add("hot"));
    card.addEventListener("mouseleave", () => dots[i].classList.remove("hot"));
  });

  /* ── Сундуки: те же шансы, что в приложении (ChestLoot.kt) ── */
  const CHESTS = {
    common: { name: "Обычный сундук", motto: "Сюрприз от системы", table: [700, 920, 990] },
    rare: { name: "Редкий сундук", motto: "Подарок от системы", table: [450, 800, 970] },
    epic: { name: "Эпический сундук", motto: "Благословение системы", table: [230, 560, 930] },
    legendary: { name: "Легендарный сундук", motto: "Любимчик системы", table: [120, 380, 750] },
  };
  const RARITY = [
    { label: "ОБЫЧНАЯ", color: "var(--common)" },
    { label: "РЕДКАЯ", color: "var(--rare)" },
    { label: "ЭПИЧЕСКАЯ", color: "var(--epic)" },
    { label: "ЛЕГЕНДАРНАЯ", color: "var(--legendary)" },
  ];
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function rollRarity(type) {
    const roll = Math.floor(Math.random() * 1000);
    const t = CHESTS[type].table;
    return roll < t[0] ? 0 : roll < t[1] ? 1 : roll < t[2] ? 2 : 3;
  }

  function rollReward(type) {
    const r = rollRarity(type);
    const attr = pick(ATTRS).name;
    const xp = (min, max, desc) => ({ r, title: "Очки: " + attr, val: "+" + rnd(min, max), desc });
    const boost = (m) => ({ r, title: "Буст опыта", val: "×" + m, desc: "Опыт героя из квестов ×" + m + " на 24 часа" });
    const coins = (title, min, max) => ({ r, title, val: rnd(min, max) + " L", desc: "Монеты на новые сундуки и улучшения" });
    if (r === 0) return xp(2, 5, `Немного очков для характеристики «${attr}»`);
    if (r === 1) return Math.random() < 0.5 ? xp(6, 12, `Хороший прирост характеристики «${attr}»`) : boost("1.5");
    if (r === 2) return pick([() => xp(13, 25, `Большой прирост характеристики «${attr}»`), () => boost("2"), () => coins("Монеты", 10, 30)])();
    return pick([
      () => xp(26, 50, `Максимальный прирост характеристики «${attr}»`),
      () => boost("3"),
      () => coins("Куча монет", 40, 100),
      () => ({ r, title: "Лимит замен", val: "×2", desc: "Лимит замен квестов увеличен до 6 навсегда" }),
    ])();
  }

  const stage = document.querySelector(".chest-stage");
  const rewardEl = document.getElementById("reward");
  const openBtn = document.getElementById("chest-open");
  const chestName = document.getElementById("chest-name");
  const tabs = document.querySelectorAll(".chest-tabs button");
  let chestType = "common";
  let busy = false;

  function resetChest() {
    stage.classList.remove("opened", "shaking");
    openBtn.innerHTML = '<i data-lucide="key-round"></i>Открыть сундук';
    if (window.lucide) window.lucide.createIcons();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (busy) return;
      chestType = tab.dataset.chest;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
      stage.dataset.type = chestType;
      const c = CHESTS[chestType];
      chestName.innerHTML = `${c.name} · <em>${c.motto}</em>`;
      resetChest();
    });
  });

  openBtn.addEventListener("click", () => {
    if (busy) return;
    if (stage.classList.contains("opened")) { resetChest(); return; }
    busy = true;
    stage.classList.add("shaking");
    openBtn.textContent = "Открываем сундук…";
    const reward = rollReward(chestType);
    setTimeout(() => {
      const rar = RARITY[reward.r];
      rewardEl.style.setProperty("--rc", rar.color);
      rewardEl.innerHTML =
        `<span class="r-rar">${rar.label}</span>` +
        `<span class="r-title">${reward.title}</span>` +
        `<span class="r-val">${reward.val}</span>` +
        `<span class="r-desc">${reward.desc}</span>`;
      stage.classList.remove("shaking");
      stage.classList.add("opened");
      openBtn.innerHTML = '<i data-lucide="rotate-ccw"></i>Ещё раз';
      if (window.lucide) window.lucide.createIcons();
      if (reward.r === 3) toast("Легендарная награда! Система тебя любит");
      busy = false;
    }, reduceMotion ? 50 : 1200);
  });
})();
