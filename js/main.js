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
      const flyNote = p.badge === "fly" ? ` title="Aplikacja na Fly.io — może wybudzać się kilka sekund"` : "";
      out.push(`<a class="live" href="${p.links.live}" target="_blank" rel="noopener"${flyNote}>Zobacz ↗</a>`);
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
  const FEATURED_ORDER = ["age-of-agents", "empowerher", "bajarz", "reverie", "ekspres-leona",
    "token-drag-race", "lastbox", "naszwhisper", "anatomy"];

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

  /* ── Rachunek tokenów ────────────────────────────────────────────────── */
  const nf = new Intl.NumberFormat("pl-PL");
  function big(n) {
    if (n >= 1e9) return { v: (n / 1e9).toFixed(2).replace(".", ","), u: "mld" };
    if (n >= 1e6) return { v: (n / 1e6).toFixed(1).replace(".", ","), u: "mln" };
    if (n >= 1e3) return { v: Math.round(n / 1e3).toString(), u: "tys." };
    return { v: nf.format(n), u: "" };
  }

  function buildBill() {
    const host = document.getElementById("bill-figures");
    if (!host || typeof TOKENS === "undefined") return;

    const figures = [
      { n: TOKENS.grand, label: "tokenów przetworzonych", sub: `${TOKENS.window} · Claude Code + Codex` },
      { n: TOKENS.grandOutput, label: "tokenów napisanych przez AI", sub: "kod, testy, analizy, rozmowy" },
      { n: TOKENS.messages, label: "odpowiedzi modeli", sub: `w ${nf.format(TOKENS.sessions)} plikach sesji` },
      { money: TOKENS.apiCost, label: "tyle kosztowałby sam Claude Code", sub: "w cenniku API, gdyby nie abonament" },
    ];
    host.innerHTML = figures.map((f) => {
      const b = f.money
        ? { v: "$" + nf.format(f.money).replace(/ /g, " "), u: "" }
        : big(f.n);
      return `<div class="figure reveal">
        <b>${b.v}<span class="unit">${b.u}</span></b>
        <span class="figure-label">${f.label}</span>
        <span class="figure-sub">${f.sub}</span>
      </div>`;
    }).join("");

    // Proporcja: ile z tego to ponowne czytanie kontekstu
    const cachePct = (TOKENS.grandCache / TOKENS.grand) * 100;
    const bar = document.getElementById("ratio-bar");
    bar.innerHTML = `<span class="seg-cache" style="width:${cachePct.toFixed(2)}%"></span>
                     <span class="seg-fresh" style="width:${(100 - cachePct).toFixed(2)}%"></span>`;
    const ratio = Math.round(TOKENS.grand / TOKENS.grandOutput);
    document.getElementById("ratio-caption").innerHTML =
      `<b>${cachePct.toFixed(1).replace(".", ",")}%</b> to ponowne odczyty tego samego kontekstu —
       model raz po raz wczytuje projekt, żeby dopisać kolejny fragment.
       Na każdy <b>1</b> napisany token przypada <b>${ratio}</b> przeczytanych.`;

    const barList = (el, rows) => {
      const max = Math.max(...rows.map((r) => r.tokens));
      el.innerHTML = rows.map((r) => {
        const b = big(r.tokens);
        return `<div class="bar-row reveal">
          <span class="bar-name">${r.name}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${(r.tokens / max * 100).toFixed(1)}%"></span></span>
          <span class="bar-val">${b.v} ${b.u}</span>
        </div>`;
      }).join("");
    };
    barList(document.getElementById("bill-top"), TOKENS.top);
    barList(document.getElementById("bill-models"), TOKENS.models);

    const a = TOKENS.archive;
    document.getElementById("bill-note").innerHTML =
      `Dokładnie ${nf.format(TOKENS.grand)} tokenów, deduplikowanych po identyfikatorze wiadomości. ` +
      `Do tego zachował się osobny ślad z <b>${a.window}</b> — lokalny cache statystyk pamięta ` +
      `${big(a.total).v} ${big(a.total).u} tokenów w ${a.sessions} sesjach, choć same transkrypty ` +
      `dawno skasowano. Reszty pierwszego roku nie da się już odtworzyć: powstawała na innym komputerze.`;
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
  buildBill();
  initReveal();
})();
