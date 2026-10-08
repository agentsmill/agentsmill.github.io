import { fmtDate, CAT_HEX } from "muzeum/render.js";

/* ── Tabliczka eksponatu ──────────────────────────────────────────────── */

const plaque = document.getElementById("plaque");
const hudEra = document.getElementById("hud-era");
const hint = document.getElementById("hud-hint");
let moved = false;

/* Wskaźnik sali w HUD: sala z planu (plan.js), w której stoi gracz. Sala
   epoki podzielona na części dostaje numer części — „V (1/2)". */
function opisSali(s) {
  const t = window.__t || ((klucz, pl) => pl);
  if (s.rodzaj === "epoka") return `${s.nr}${s.czesc ? ` (${s.czesc}/${s.czesci})` : ""} · ${s.zakres} — ${s.nazwa}`;
  return t(`muz.sala.${s.id}`, s.nazwa);
}

function openPlaque(hit) {
  const p = hit.userData.project;
  const hex = CAT_HEX[p.cat[0]];
  plaque.style.setProperty("--cat", hex);
  document.getElementById("plaque-date").textContent =
    `${fmtDate(p.date)} · ${p.cat.map((c) => CATEGORIES[c].label).join(" · ")}`;
  document.getElementById("plaque-title").textContent = p.title;
  document.getElementById("plaque-desc").textContent = p.desc;
  document.getElementById("plaque-tech").textContent = p.tech.join(" · ");
  const links = [];
  if (p.links.live) links.push(`<a href="${p.links.live}" target="_blank" rel="noopener">Zobacz na żywo ↗</a>`);
  if (p.links.tg) links.push(`<a href="${p.links.tg}" target="_blank" rel="noopener">Telegram ↗</a>`);
  if (p.links.repo) links.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">GitHub</a>`);
  if (p.links.npm) links.push(`<a href="${p.links.npm}" target="_blank" rel="noopener">npm</a>`);
  document.getElementById("plaque-links").innerHTML =
    links.join("") || `<span style="color:var(--ink-faint)">${p.access || "projekt niepubliczny"}</span>`;
  plaque.hidden = false;
}

/* Wpis archiwum (szuflada w sali Archiwum, sale-boczne.js) w tej samej
   tabliczce co projekty: data, tytuł, notka i odnośnik, jeśli istnieje. */
function otworzWpisArchiwum(wpis) {
  const t = window.__t || ((klucz, pl) => pl);
  plaque.style.setProperty("--cat", "var(--pulse-dim)");
  document.getElementById("plaque-date").textContent = `${fmtDate(wpis.date)} · ${t("muz.sala.archiwum", "Archiwum")}`;
  document.getElementById("plaque-title").textContent = wpis.title;
  document.getElementById("plaque-desc").textContent = wpis.note;
  document.getElementById("plaque-tech").textContent = "";
  const link = document.getElementById("plaque-links");
  link.textContent = "";
  if (wpis.url) {
    const a = document.createElement("a");
    a.href = wpis.url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = `${t("muz.zobacz", "Zobacz")} ↗`;
    link.appendChild(a);
  }
  plaque.hidden = false;
}

// Port do wstrzyknięcia sterowania kamerą: ui.js celowo nie wie, jak porusza się kamera
// ani co znaczy „fokus" po stronie main.js — mechanika ruchu (dziś szyny scroll/dotyk/
// klawiatura) zostanie wymieniona w kolejnym zadaniu na swobodny spacer, a ten port ma
// przetrwać tę wymianę bez zmian.
const focusHooks = { onFocusEnd() {}, goToHit() {} };
function bindFocusControl({ onFocusEnd, goToHit }) {
  focusHooks.onFocusEnd = onFocusEnd;
  focusHooks.goToHit = goToHit;
}

function endFocus() {
  plaque.hidden = true;
  focusHooks.onFocusEnd();
}
document.getElementById("plaque-close").addEventListener("click", endFocus);

function dismissHint() { if (!moved) { moved = true; setTimeout(() => hint.classList.add("gone"), 1200); } }

/* ── Lista eksponatów ─────────────────────────────────────────────────── */

const listPanel = document.getElementById("list-panel");
document.getElementById("btn-list").addEventListener("click", () => {
  listPanel.hidden = false;
});
function closeList() { listPanel.hidden = true; }
document.getElementById("list-close").addEventListener("click", closeList);

// Czytane przez main.js, żeby scroll/dotyk/klawiatura nie ruszały kamery, gdy lista jest otwarta.
function isListOpen() { return !listPanel.hidden; }

function buildList(lista) {
  const body = document.getElementById("list-body");
  body.innerHTML = ERAS.map((era) => {
    const items = lista
      .filter((h) => h.userData.project?.era === era.id)
      .map((h) => {
        const p = h.userData.project;
        return `<button class="list-item" data-id="${p.id}">
          <span class="li-date">${fmtDate(p.date)}</span>${p.title}</button>`;
      }).join("");
    return `<p class="list-era">${era.range} · ${era.title}</p>${items}`;
  }).join("");
  body.addEventListener("click", (e) => {
    const btn = e.target.closest(".list-item");
    if (!btn) return;
    const hit = lista.find((h) => h.userData.project.id === btn.dataset.id);
    if (!hit) return;
    closeList();
    endFocus();
    focusHooks.goToHit(hit);
  });
}

export { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, isListOpen, opisSali, otworzWpisArchiwum };
