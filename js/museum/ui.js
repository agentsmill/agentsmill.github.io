import { fmtDate, CAT_HEX } from "muzeum/render.js";
import { odleglosciSal } from "muzeum/plan.js";

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
  const t = window.__t || ((klucz, pl) => pl);
  const p = hit.userData.project;
  const hex = CAT_HEX[p.cat[0]];
  plaque.style.setProperty("--cat", hex);
  document.getElementById("plaque-date").textContent =
    `${fmtDate(p.date)} · ${p.cat.map((c) => CATEGORIES[c].label).join(" · ")}`;
  document.getElementById("plaque-title").textContent = p.title;
  document.getElementById("plaque-desc").textContent = p.desc;
  document.getElementById("plaque-tech").textContent = p.tech.join(" · ");
  const links = [];
  if (p.links.live) links.push(`<a href="${p.links.live}" target="_blank" rel="noopener">${t("muz.naZywo", "Zobacz na żywo")} ↗</a>`);
  if (p.links.tg) links.push(`<a href="${p.links.tg}" target="_blank" rel="noopener">Telegram ↗</a>`);
  if (p.links.repo) links.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">GitHub</a>`);
  if (p.links.npm) links.push(`<a href="${p.links.npm}" target="_blank" rel="noopener">npm</a>`);
  document.getElementById("plaque-links").innerHTML =
    links.join("") || `<span style="color:var(--ink-faint)">${p.access || t("muz.niepubliczny", "projekt niepubliczny")}</span>`;
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
const focusHooks = { onFocusEnd() {}, goToHit() {}, goToRoom() {} };
function bindFocusControl({ onFocusEnd, goToHit, goToRoom }) {
  focusHooks.onFocusEnd = onFocusEnd;
  focusHooks.goToHit = goToHit;
  if (goToRoom) focusHooks.goToRoom = goToRoom;
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

/* Lista eksponatów pogrupowana salami planu, w kolejności spaceru: od wejścia
   przez kolejne drzwi, sale boczne tam, gdzie się do nich wchodzi (Kino i
   Archiwum przy atrium, Pokój Leona między V a VI). Nagłówek sali to przycisk —
   szybka podróż jak z planu w rogu; pozycja — przejazd przed pracę. Praca z
   rzeźbą i obrazem występuje raz, jako rzeźba — tak jak w wycieczce. */
function buildList(lista, plan) {
  const odl = odleglosciSal(plan, plan.sale.find((s) => s.rodzaj === "atrium").id);
  const sale = [...plan.sale].sort((a, b) => odl.get(a.id) - odl.get(b.id) || a.z0 - b.z0 || a.x0 - b.x0);
  const pozycje = [];
  document.getElementById("list-body").innerHTML = sale.map((s) => {
    const wSali = new Map();
    for (const h of lista) {
      const p = h.userData.project;
      if (!p || h.userData.salaId !== s.id) continue;
      if (!wSali.has(p.id) || h.userData.exhibit) wSali.set(p.id, h);
    }
    const items = [...wSali.values()]
      .sort((a, b) => a.userData.project.date.localeCompare(b.userData.project.date))
      .map((h) => {
        const p = h.userData.project;
        pozycje.push(h);
        return `<button class="list-item" type="button" data-i="${pozycje.length - 1}">
          <span class="li-date">${fmtDate(p.date)}</span>${p.title}</button>`;
      }).join("");
    return `<button class="list-sala" type="button" data-sala="${s.id}">${opisSali(s)}</button>${items}`;
  }).join("");
  document.getElementById("list-body").addEventListener("click", (e) => {
    const sala = e.target.closest(".list-sala");
    const poz = e.target.closest(".list-item");
    if (!sala && !poz) return;
    closeList();
    endFocus();
    if (sala) focusHooks.goToRoom(sala.dataset.sala);
    else focusHooks.goToHit(pozycje[Number(poz.dataset.i)]);
  });
}

export { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, isListOpen, opisSali, otworzWpisArchiwum };
