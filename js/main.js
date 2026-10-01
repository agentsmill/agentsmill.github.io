/* Renderowanie strony z projects-data.js — zero zależności. */
(function () {
  "use strict";

  /* Napisy przez i18n.js; bez niego zostaje polski tekst podany przy wywołaniu. */
  const t = window.__t || ((klucz, pl) => pl);
  const en = window.__jezyk === "en";
  const wstaw = (wzor, dane) => wzor.replace(/\{(\w+)\}/g, (_, k) => (k in dane ? dane[k] : `{${k}}`));

  /* Polska odmiana liczebnika: 1 miesiąc, 2–4 miesiące (bez 12–14), 5+ miesięcy. */
  const odmiana = (n, [jeden, kilka, wiele]) => {
    if (n === 1) return jeden;
    const j = n % 10, d = n % 100;
    return j >= 2 && j <= 4 && (d < 12 || d > 14) ? kilka : wiele;
  };

  const ROMAN = { "01": "I", "02": "II", "03": "III", "04": "IV", "05": "V", "06": "VI",
    "07": "VII", "08": "VIII", "09": "IX", "10": "X", "11": "XI", "12": "XII" };

  /* Twarda spacja między miesiącem a rokiem: „IX” nie może zostać na końcu linii,
     a „2026” uciec do następnej. */
  const fmtDate = (d) => {
    const [y, m] = d.split("-");
    return `${ROMAN[m]}\u00A0${y}`;
  };
  /* Miesiąc kardiogramu („IX 26”) jako pełna data („IX 2026”). */
  const pelnyMiesiac = (m) => m.replace(/ (\d\d)$/, "\u00A020$1");

  const catColor = (p) => `var(--c-${p.cat[0]})`;
  const strzalka = `<span aria-hidden="true">↗</span>`;

  /* ── Hero: zakres dat, uwaga o Kosmosie, parametry ───────────────────── */
  const OD = pelnyMiesiac(HEARTBEAT[0].m);
  const DO = pelnyMiesiac(HEARTBEAT[HEARTBEAT.length - 1].m);

  /* ── Ile działających wdrożeń? ───────────────────────────────────────────
     Liczba ląduje w pasku parametrów pod kardiogramem, więc jest publiczną
     deklaracją — a to, co jest „działającym wdrożeniem”, to decyzja autora,
     nie kodu. Do dyspozycji: PROJECTS (p.links.live, p.access, p.badge,
     p.wakes, p.cat, p.meta) i ARCHIVE (a.url). Zwraca liczbę albo null —
     null zdejmuje pozycję z paska. */
  function policzWdrozenia() {
    // TODO(Mateusz): co liczymy jako działające wdrożenie? (5–10 linijek)
    return null;
  }

  function buildHero() {
    const eyebrow = document.getElementById("hero-eyebrow");
    if (eyebrow) eyebrow.textContent = `${t("hero.eyebrow", "Karta budowania")} · ${OD} — ${DO}`;

    const uwaga = document.getElementById("hero-uwaga");
    if (uwaga) uwaga.textContent = wstaw(t("hero.uwaga",
      "Kosmiczne portfolio to gra 3D w przeglądarce — {n} projektów jako światy na sześciu " +
      "orbitach. Potrzebuje mocniejszego komputera i nowszej przeglądarki niż reszta strony."),
      { n: PROJECTS.length });

    const vitals = document.getElementById("vitals");
    if (!vitals) return;
    const miesiecy = HEARTBEAT.length;
    const wszystkich = PROJECTS.length + ARCHIVE.length;
    const gwiazdki = Math.max(0, ...PROJECTS.map((p) => p.stars || 0));
    const wdrozenia = policzWdrozenia();
    const pozycje = [
      [miesiecy, en ? t("vitals.miesiecy", "months")
                    : odmiana(miesiecy, ["miesiąc", "miesiące", "miesięcy"])],
      /* „80+”, nie „83”: spis rośnie co tydzień, a zaokrąglenie w dół pozostaje
         prawdziwe do następnej aktualizacji. */
      [`${Math.floor(wszystkich / 10) * 10}+`, t("vitals.projektow", "projektów")],
    ];
    if (Number.isFinite(wdrozenia)) {
      pozycje.push([wdrozenia, en ? t("vitals.wdrozen", "live deployments")
        : odmiana(wdrozenia, ["działające wdrożenie", "działające wdrożenia", "działających wdrożeń"])]);
    }
    if (gwiazdki) pozycje.push([`${gwiazdki}★`, t("vitals.gwiazdek", "na GitHubie")]);
    vitals.innerHTML = pozycje.map(([b, s]) => `<li><b>${b}</b> ${s}</li>`).join("");
  }

  /* ── Kardiogram hero ─────────────────────────────────────────────────── */
  function buildEKG() {
    const host = document.getElementById("ekg-chart");
    if (!host) return;
    const W = 1000, H = 130, BASE = 74, AMP = 34;
    const cellW = W / HEARTBEAT.length;
    let d = `M 0 ${BASE}`;
    HEARTBEAT.forEach((mo, i) => {
      const x0 = i * cellW;
      if (mo.n === 0) {
        d += ` L ${(x0 + cellW * 0.5).toFixed(1)} ${BASE - 1.5} L ${(x0 + cellW).toFixed(1)} ${BASE}`;
        return;
      }
      const beats = mo.n;
      const bw = cellW / (beats + 0.5);
      for (let b = 0; b < beats; b++) {
        const bx = x0 + bw * (b + 0.4);
        const amp = AMP * (0.75 + 0.25 * Math.min(1, beats / 10));
        d += ` L ${bx.toFixed(1)} ${BASE}`
           + ` L ${(bx + bw * 0.22).toFixed(1)} ${(BASE - amp).toFixed(1)}`
           + ` L ${(bx + bw * 0.44).toFixed(1)} ${(BASE + amp * 0.24).toFixed(1)}`
           + ` L ${(bx + bw * 0.6).toFixed(1)} ${BASE}`;
      }
      d += ` L ${(x0 + cellW).toFixed(1)} ${BASE}`;
    });

    /* Pierwszy i ostatni miesiąc liczone z danych — nowy miesiąc w HEARTBEAT
       przesuwa oś sam. Podpisy są w HTML, nie w SVG: preserveAspectRatio="none"
       rozciąga tekst razem z wykresem, a na telefonie ściskał go do 7 px. */
    const ticks = new Set([HEARTBEAT[0].m, "I 26", "VI 26", HEARTBEAT[HEARTBEAT.length - 1].m]);
    const pozycjeTickow = HEARTBEAT.map((mo, i) => ({ m: mo.m, x: i * cellW + cellW / 2 }))
      .filter((mo) => ticks.has(mo.m));
    const tickEls = pozycjeTickow.map(({ x }) =>
      `<line class="ekg-grid" x1="${x}" y1="${BASE + 14}" x2="${x}" y2="${BASE + 20}"></line>`).join("");
    const podpisy = pozycjeTickow.map(({ m, x }) =>
      `<span class="ekg-tick" style="left:${(x / W * 100).toFixed(2)}%">${m}</span>`).join("");

    host.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <line class="ekg-grid" x1="0" y1="${BASE}" x2="${W}" y2="${BASE}" opacity="0.35"></line>
        ${tickEls}
        <path class="ekg-path" d="${d}"></path>
        <path class="ekg-sweep" d="${d}"></path>
      </svg>
      <div class="ekg-ticks" aria-hidden="true">${podpisy}</div>`;

    host.setAttribute("aria-label", wstaw(
      t("a11y.ekg", "Kardiogram: liczba projektów miesięcznie od {od} do {do}"), { od: OD, do: DO }));

    const sweep = host.querySelector(".ekg-sweep");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sweep && !reduce) {
      const L = sweep.getTotalLength();
      sweep.style.strokeDasharray = `70 ${L}`;
      const DUR = 9000;
      const t0 = performance.now();
      /* Pętla śpi, gdy kardiogramu nie widać — nie ma po co rysować klatek
         wykresu przewiniętego daleko w górę. */
      let widac = true, klatka = 0;
      const frame = (ts) => {
        const p = ((ts - t0) % DUR) / DUR;
        sweep.style.strokeDashoffset = String(-p * L);
        klatka = widac ? requestAnimationFrame(frame) : 0;
      };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(([e]) => {
          widac = e.isIntersecting;
          if (widac && !klatka) klatka = requestAnimationFrame(frame);
        }).observe(host);
      }
      klatka = requestAnimationFrame(frame);
    } else if (sweep) {
      sweep.remove();
    }
  }

  /* ── Linki karty ─────────────────────────────────────────────────────── */
  function linksHTML(p) {
    const out = [];
    if (p.links.live) {
      out.push(`<a class="live" href="${p.links.live}" target="_blank" rel="noopener">${t("ui.zobacz", "Zobacz")} ${strzalka}</a>`);
      /* Aplikacja uśpiona (Fly, skalowanie do zera). Liczba w danych to zmierzony czas
         budzenia; `true` znaczy typowe ok. 10 s. */
      if (p.wakes) {
        const s = typeof p.wakes === "number" ? p.wakes : 10;
        out.push(`<span class="wakes" title="${wstaw(t("ui.wakesTytul",
          "Serwer śpi, gdy nikt nie korzysta. Pierwsze wejście trwa do {s} sekund, potem działa normalnie."), { s })}">${
          wstaw(t("ui.wakes", "(start serwera ~{s} s)"), { s }).replace(" s)", "&nbsp;s)")}</span>`);
      }
    }
    if (p.links.tg) out.push(`<a href="${p.links.tg}" target="_blank" rel="noopener">${t("ui.telegram", "Bot na Telegramie")} ${strzalka}</a>`);
    if (p.links.repo) out.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">GitHub</a>`);
    if (p.links.npm) out.push(`<a href="${p.links.npm}" target="_blank" rel="noopener">npm</a>`);
    if (p.badge) out.push(`<span class="badge">${p.badge}</span>`);
    if (p.stars) out.push(`<span class="stars">★ ${p.stars}</span>`);
    if (p.access) out.push(`<span class="access">${p.access}</span>`);
    return out.length ? `<div class="card-links">${out.join("")}</div>` : "";
  }

  /* ── Obraz projektu ──────────────────────────────────────────────────────
     Ścieżkę zna tylko obrazProjektu() z projects-data.js. Zrzut dostaje alt,
     okładka nie: to ilustracja, a tytuł i podpis „wizualizacja AI” stoją tuż
     obok — czytnik ekranu powtarzałby tytuł drugi raz. */
  function obrazHTML(p, klasa) {
    const o = obrazProjektu(p);
    if (!o) return "";
    const alt = o.okladka ? "" : wstaw(t("ui.zrzut", "Zrzut ekranu: {t}"), { t: p.title }).replace(/"/g, "&quot;");
    const znacznik = o.okladka ? `<span class="shot-znacznik">${t("ui.okladka", "wizualizacja AI")}</span>` : "";
    return `<span class="${klasa}${o.okladka ? " shot-okladka" : " zrzut"}">
      <img src="${o.src}" alt="${alt}" width="${o.w}" height="${o.h}" loading="lazy" decoding="async">${znacznik}
    </span>`;
  }

  /* Wyróżniony projekt bez obrazu dostaje tablicę typograficzną w kolorze
     kategorii zamiast dziury w siatce — i nie udaje zrzutu, którego nie ma. */
  function tablicaHTML(p) {
    return `<span class="shot shot-brak" aria-hidden="true">
      <span class="shot-brak-data">${fmtDate(p.date)}</span>
      <span class="shot-brak-tytul">${p.title}</span>
    </span>`;
  }

  /* ── Wyróżnione ──────────────────────────────────────────────────────── */
  const WYROZNIONE = PROJECTS.filter((p) => p.featured).sort((a, b) => a.featured - b.featured);

  function buildFeatured() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;
    const lead = document.getElementById("featured-lead");
    if (lead) lead.textContent = wstaw(t("lead.wyroznione",
      "{n} rzeczy, które warto zobaczyć w pierwszej kolejności — to, co albo działa " +
      "komercyjnie, albo ma najwięcej pracy pod spodem, albo jest po prostu najciekawsze. " +
      "Reszta czeka na osi czasu i w spisie niżej."), { n: WYROZNIONE.length });

    /* Miejsca 1–3 to duże kafle bento: hierarchia z danych, nie z pozycji w DOM. */
    grid.innerHTML = WYROZNIONE.map((p) => `<article class="fcard reveal${p.featured <= 3 ? " duza" : ""}" style="--cat:${catColor(p)}" data-id="${p.id}" data-miejsce="${p.featured}">
        ${obrazHTML(p, "shot") || tablicaHTML(p)}
        <div class="fdate"><span class="fdate-data">${fmtDate(p.date)}</span> · ${p.cat.map((c) => CATEGORIES[c].label).join(" · ")}</div>
        <h3>${p.title}</h3>
        <p class="fdesc">${p.desc}</p>
        ${linksHTML(p)}
      </article>`).join("");
  }

  /* ── Filtry ──────────────────────────────────────────────────────────── */
  let activeFilter = "all";

  function buildFilters() {
    const host = document.getElementById("filters");
    if (!host) return;
    const chips = [`<button class="chip" type="button" data-cat="all" aria-pressed="true">${t("ui.wszystkie", "Wszystkie")}</button>`]
      .concat(Object.entries(CATEGORIES).map(([slug, c]) =>
        `<button class="chip" type="button" data-cat="${slug}" aria-pressed="false">
          <span class="chip-dot" style="background:${c.color}"></span>${c.label}</button>`));
    host.innerHTML = chips.join("");
    host.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      activeFilter = btn.dataset.cat;
      host.querySelectorAll(".chip").forEach((ch) =>
        ch.setAttribute("aria-pressed", String(ch === btn)));
      document.querySelectorAll("#timeline .card").forEach((card) => {
        const match = activeFilter === "all" || card.dataset.cats.split(" ").includes(activeFilter);
        card.classList.toggle("dim", !match);
      });
    });
  }

  /* ── Oś czasu ────────────────────────────────────────────────────────── */
  function buildTimeline() {
    const host = document.getElementById("timeline");
    if (!host) return;
    const podpisOkladki = t("ui.okladka", "wizualizacja AI");
    host.innerHTML = ERAS.map((era) => {
      const items = []
        .concat(MILESTONES.filter((m) => m.era === era.id).map((m) => ({ t: 0, date: m.date, m })))
        .concat(PROJECTS.filter((p) => p.era === era.id).map((p) => ({ t: 1, date: p.date, p })))
        .sort((a, b) => a.date === b.date ? a.t - b.t : (a.date < b.date ? -1 : 1));

      const rows = items.map((it) => {
        if (it.t === 0) {
          const m = it.m;
          return `<div class="milestone reveal${m.personal ? " personal" : ""}">
            <span class="m-date">${fmtDate(m.date)}</span><span>${m.label}</span></div>`;
        }
        const p = it.p;
        return `<article class="card reveal" style="--cat:${catColor(p)}" data-cats="${p.cat.join(" ")}" data-id="${p.id}">
          ${obrazHTML(p, "karta-okladka")}
          <div class="card-top">
            ${p.featured ? `<span class="card-star" title="${t("ui.wyroznione", "Wyróżnione")}">★</span>` : ""}
            <h4>${p.title}</h4>
            <span class="card-date">${fmtDate(p.date)}</span>
          </div>
          <p class="desc">${p.desc}</p>
          <div class="card-tags">${p.tech.map((x) => `<span class="tag">${x}</span>`).join("")}</div>
          ${linksHTML(p)}
        </article>`;
      }).join("");

      /* Plansza epoki to karta tytułowa rozdziału — dekoracja, więc alt="". */
      const plansza = era.plansza ? `<span class="epoka-plansza shot-okladka">
          <img src="assets/epoki/${era.plansza}" alt="" width="1024" height="384" loading="lazy" decoding="async">
          <span class="shot-znacznik">${podpisOkladki}</span>
        </span>` : "";

      return `<div class="era">
        ${plansza}
        <header class="era-head reveal">
          <p class="era-rhythm">${era.range} · ${t("ui.rytm", "rytm")}: ${era.rhythm}</p>
          <h3>${era.title}</h3>
          <p class="era-lead">${era.lead}</p>
        </header>
        ${rows}
      </div>`;
    }).join("");
  }

  /* ── Archiwum ────────────────────────────────────────────────────────── */
  function buildArchive() {
    const host = document.getElementById("archive-list");
    if (!host) return;
    host.innerHTML = ARCHIVE.map((a) => {
      const title = a.url
        ? `<a class="a-title a-link" href="${a.url}" target="_blank" rel="noopener">${a.title} ${strzalka}</a>`
        : `<span class="a-title">${a.title}</span>`;
      return `<div class="arch-row reveal">
        <span class="a-date">${fmtDate(a.date)}</span>
        ${title}
        <span class="a-note"> — ${a.note}</span>
      </div>`;
    }).join("");
  }

  /* ── Rodziny projektów ───────────────────────────────────────────────── */
  function buildLineages() {
    const host = document.getElementById("lineage-list");
    if (!host) return;
    const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
    host.innerHTML = LINEAGES.map((l) => {
      const steps = l.chain.map((s) => {
        const p = s.pid ? byId[s.pid] : null;
        const color = p ? `var(--c-${p.cat[0]})` : "var(--ink-faint)";
        return `<li class="step" style="--dot:${color}">
          <span class="step-date">${fmtDate(s.date)}</span>
          <span class="step-title">${s.title}</span>
        </li>`;
      }).join("");
      return `<article class="lineage reveal">
        <h3>${l.title}</h3>
        <p class="lineage-note">${l.note}</p>
        <ol class="chain">${steps}</ol>
      </article>`;
    }).join("");
  }

  function buildThreads() {
    const host = document.getElementById("thread-grid");
    if (!host) return;
    host.innerHTML = THREADS.map((w) => `
      <article class="thread reveal">
        <h4>${w.label}</h4>
        <p>${w.note}</p>
        <p class="thread-items">${w.items.map((i) => `<span>${i}</span>`).join("")}</p>
      </article>`).join("");
  }

  /* ── Spis wszystkiego: każdy projekt na jednym ekranie, z wyszukiwarką ── */
  /* Bez ogonków: „wspolnik” ma znaleźć Wspólnika. NFD rozkłada ą, ę, ó, ś, ź, ż, ć, ń
     na literę i znak diakrytyczny; ł nie ma rozkładu, więc idzie osobno. */
  const bezOgonkow = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ł/g, "l");

  function buildIndex() {
    const grid = document.getElementById("index-grid");
    if (!grid) return;

    const rows = PROJECTS.map((p) => ({
      date: p.date, title: p.title,
      cat: p.cat[0], best: !!p.featured,
      url: p.links.live || p.links.repo || p.links.tg || null,
      note: p.access || "",
      hay: `${p.title} ${p.desc} ${p.tech.join(" ")} ${p.cat.map((c) => CATEGORIES[c].label).join(" ")}${p.featured ? " wyróżnione najlepsze featured best" : ""}`,
    })).concat(ARCHIVE.map((a) => ({
      date: a.date, title: a.title, cat: null, url: a.url || null, note: a.note,
      hay: `${a.title} ${a.note}`, archived: true,
    })));
    rows.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, en ? "en" : "pl") : (a.date < b.date ? -1 : 1)));

    const best = rows.filter((r) => r.best).length;
    document.getElementById("index-lead").innerHTML = wstaw(t("ui.spisLead",
      "Wszystko, co powstało — <b>{p}</b> projektów opisanych na osi czasu i <b>{a}</b> " +
      "pozycji archiwalnych, razem <b>{r}</b>. <b class=\"lead-star\">★</b> oznacza <b>{b}</b> " +
      "najlepszych — od nich zacznij. Wpisz nazwę, technologię albo kategorię, żeby zawęzić listę."),
      { p: PROJECTS.length, a: ARCHIVE.length, r: rows.length, b: best });

    const tytulGwiazdki = t("ui.wyroznione", "Wyróżnione — od tych zacznij");
    grid.innerHTML = rows.map((r) => {
      const dot = r.cat ? `<span class="ix-dot" style="background:${CATEGORIES[r.cat].color}"></span>` : `<span class="ix-dot ix-dot-arch"></span>`;
      const name = r.url
        ? `<a href="${r.url}" target="_blank" rel="noopener">${r.title} ${strzalka}</a>`
        : `<span>${r.title}</span>`;
      return `<div class="ix-row${r.archived ? " ix-arch" : ""}${r.best ? " ix-best" : ""}" data-hay="${bezOgonkow(r.hay).replace(/"/g, "")}">
        ${dot}<span class="ix-date">${fmtDate(r.date)}</span>
        <span class="ix-name">${r.best ? `<span class="ix-star" title="${tytulGwiazdki}">★</span>` : ""}${name}</span>
        ${r.note ? `<span class="ix-note">${r.note}</span>` : ""}
      </div>`;
    }).join("");

    const input = document.getElementById("index-filter");
    const empty = document.getElementById("index-empty");
    const licznik = document.getElementById("index-count");
    input.addEventListener("input", () => {
      const q = bezOgonkow(input.value.trim());
      let shown = 0;
      grid.querySelectorAll(".ix-row").forEach((row) => {
        const hit = !q || row.dataset.hay.includes(q);
        row.hidden = !hit;
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
      /* Czytnik ekranu słyszy liczbę wyników — bez tego filtrowanie było nieme. */
      if (licznik) licznik.textContent = q ? wstaw(t("ui.wynikow", "Wyniki: {n}"), { n: shown }) : "";
    });
  }

  /* ── Scroll reveal ───────────────────────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach((el) => io.observe(el));
  }

  buildHero();
  buildEKG();
  buildFeatured();
  buildFilters();
  buildTimeline();
  buildLineages();
  buildThreads();
  buildArchive();
  buildIndex();
  initReveal();
})();
