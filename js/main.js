/* Renderowanie strony z projects-data.js — zero zależności. */
(function () {
  "use strict";

  const ROMAN = { "01": "I", "02": "II", "03": "III", "04": "IV", "05": "V", "06": "VI",
    "07": "VII", "08": "VIII", "09": "IX", "10": "X", "11": "XI", "12": "XII" };

  const fmtDate = (d) => {
    const [y, m] = d.split("-");
    return `${ROMAN[m]} ${y}`;
  };

  const catColor = (p) => `var(--c-${p.cat[0]})`;

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

    const ticks = ["III 25", "I 26", "VI 26", "VIII 26"];
    const tickEls = HEARTBEAT.map((mo, i) => {
      if (!ticks.includes(mo.m)) return "";
      const x = i * cellW + cellW / 2;
      return `<line class="ekg-grid" x1="${x}" y1="${BASE + 14}" x2="${x}" y2="${BASE + 20}"></line>
              <text class="ekg-tick" x="${x}" y="${BASE + 34}" text-anchor="middle">${mo.m}</text>`;
    }).join("");

    host.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <line class="ekg-grid" x1="0" y1="${BASE}" x2="${W}" y2="${BASE}" opacity="0.35"></line>
        ${tickEls}
        <path class="ekg-path" d="${d}"></path>
        <path class="ekg-sweep" d="${d}"></path>
      </svg>`;

    const sweep = host.querySelector(".ekg-sweep");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sweep && !reduce) {
      const L = sweep.getTotalLength();
      sweep.style.strokeDasharray = `70 ${L}`;
      const DUR = 9000;
      const t0 = performance.now();
      (function frame(t) {
        const p = ((t - t0) % DUR) / DUR;
        sweep.style.strokeDashoffset = String(-p * L);
        requestAnimationFrame(frame);
      })(t0);
    } else if (sweep) {
      sweep.remove();
    }
  }

  /* ── Linki karty ─────────────────────────────────────────────────────── */
  function linksHTML(p) {
    const out = [];
    if (p.links.live) {
      out.push(`<a class="live" href="${p.links.live}" target="_blank" rel="noopener">Zobacz ↗</a>`);
      // Aplikacja uśpiona (Fly, skalowanie do zera) — zmierzone budzenie 7–11 s.
      if (p.wakes) out.push(`<span class="wakes" title="Serwer śpi, gdy nikt nie korzysta. Pierwsze wejście trwa ok. 10 sekund, potem działa normalnie.">(start serwera ~10 s)</span>`);
    }
    if (p.links.tg) out.push(`<a href="${p.links.tg}" target="_blank" rel="noopener">Bot na Telegramie ↗</a>`);
    if (p.links.repo) out.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">GitHub</a>`);
    if (p.links.npm) out.push(`<a href="${p.links.npm}" target="_blank" rel="noopener">npm</a>`);
    if (p.badge) out.push(`<span class="badge">${p.badge}</span>`);
    if (p.stars) out.push(`<span class="stars">★ ${p.stars}</span>`);
    if (p.access) out.push(`<span class="access">${p.access}</span>`);
    return out.length ? `<div class="card-links">${out.join("")}</div>` : "";
  }

  /* Zrzut ekranu projektu; jeśli pliku nie ma, kafelek znika bez śladu. */
  function shotHTML(p) {
    if (p.shot === false) return "";
    const file = p.shot || `${p.id}.jpeg`;
    return `<span class="shot">
      <img src="assets/shots/${file}" alt="Zrzut ekranu: ${p.title}" loading="lazy" decoding="async"
           onerror="this.closest('.shot').remove()">
    </span>`;
  }

  /* ── Wyróżnione ──────────────────────────────────────────────────────── */
  const FEATURED_ORDER = ["age-of-agents", "wspolnik", "empowerher", "bajarz", "aog-game",
    "reverie", "ekspres-leona", "token-drag-race", "lastbox", "naszwhisper", "anatomy"];

  function buildFeatured() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;
    const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
    grid.innerHTML = FEATURED_ORDER.map((id) => {
      const p = byId[id];
      if (!p) return "";
      return `<article class="fcard reveal" style="--cat:${catColor(p)}">
        ${shotHTML(p)}
        <div class="fdate">${fmtDate(p.date)} · ${p.cat.map((c) => CATEGORIES[c].label).join(" · ")}</div>
        <h3>${p.title}</h3>
        <p class="fdesc">${p.desc}</p>
        ${linksHTML(p)}
      </article>`;
    }).join("");
  }

  /* ── Filtry ──────────────────────────────────────────────────────────── */
  let activeFilter = "all";

  function buildFilters() {
    const host = document.getElementById("filters");
    if (!host) return;
    const chips = [`<button class="chip" data-cat="all" aria-pressed="true">Wszystkie</button>`]
      .concat(Object.entries(CATEGORIES).map(([slug, c]) =>
        `<button class="chip" data-cat="${slug}" aria-pressed="false">
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
        return `<article class="card reveal" style="--cat:${catColor(p)}" data-cats="${p.cat.join(" ")}">
          <div class="card-top">
            ${p.featured ? `<span class="card-star" title="Wyróżnione">★</span>` : ""}
            <h4>${p.title}</h4>
            <span class="card-date">${fmtDate(p.date)}</span>
          </div>
          <p class="desc">${p.desc}</p>
          <div class="card-tags">${p.tech.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
          ${linksHTML(p)}
        </article>`;
      }).join("");

      return `<div class="era">
        <header class="era-head reveal">
          <p class="era-rhythm">${era.range} · rytm: ${era.rhythm}</p>
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
        ? `<a class="a-title a-link" href="${a.url}" target="_blank" rel="noopener">${a.title} ↗</a>`
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
    host.innerHTML = THREADS.map((t) => `
      <article class="thread reveal">
        <h4>${t.label}</h4>
        <p>${t.note}</p>
        <p class="thread-items">${t.items.map((i) => `<span>${i}</span>`).join("")}</p>
      </article>`).join("");
  }

  /* ── Spis wszystkiego: każdy projekt na jednym ekranie, z wyszukiwarką ── */
  function buildIndex() {
    const grid = document.getElementById("index-grid");
    if (!grid) return;

    const rows = PROJECTS.map((p) => ({
      date: p.date, title: p.title,
      cat: p.cat[0], best: !!p.featured,
      url: p.links.live || p.links.repo || p.links.tg || null,
      note: p.access || "",
      hay: `${p.title} ${p.desc} ${p.tech.join(" ")} ${p.cat.map((c) => CATEGORIES[c].label).join(" ")}${p.featured ? " wyróżnione najlepsze" : ""}`.toLowerCase(),
    })).concat(ARCHIVE.map((a) => ({
      date: a.date, title: a.title, cat: null, url: a.url || null, note: a.note,
      hay: `${a.title} ${a.note}`.toLowerCase(), archived: true,
    })));
    rows.sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title, "pl") : (a.date < b.date ? -1 : 1)));

    const best = rows.filter((r) => r.best).length;
    document.getElementById("index-lead").innerHTML =
      `Wszystko, co powstało — <b>${PROJECTS.length}</b> projektów opisanych na osi czasu i
       <b>${ARCHIVE.length}</b> pozycji archiwalnych, razem <b>${rows.length}</b>.
       <b class="lead-star">★</b> oznacza <b>${best}</b> najlepszych — od nich zacznij.
       Wpisz nazwę, technologię albo kategorię, żeby zawęzić listę.`;

    grid.innerHTML = rows.map((r) => {
      const dot = r.cat ? `<span class="ix-dot" style="background:${CATEGORIES[r.cat].color}"></span>` : `<span class="ix-dot ix-dot-arch"></span>`;
      const name = r.url
        ? `<a href="${r.url}" target="_blank" rel="noopener">${r.title} ↗</a>`
        : `<span>${r.title}</span>`;
      return `<div class="ix-row${r.archived ? " ix-arch" : ""}${r.best ? " ix-best" : ""}" data-hay="${r.hay.replace(/"/g, "")}">
        ${dot}<span class="ix-date">${fmtDate(r.date)}</span>
        <span class="ix-name">${r.best ? `<span class="ix-star" title="Wyróżnione — od tych zacznij">★</span>` : ""}${name}</span>
        ${r.note ? `<span class="ix-note">${r.note}</span>` : ""}
      </div>`;
    }).join("");

    const input = document.getElementById("index-filter");
    const empty = document.getElementById("index-empty");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      grid.querySelectorAll(".ix-row").forEach((row) => {
        const hit = !q || row.dataset.hay.includes(q);
        row.hidden = !hit;
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
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
