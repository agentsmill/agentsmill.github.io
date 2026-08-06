import { fmtDate, CAT_HEX } from "muzeum/render.js";
import { interactives } from "muzeum/world.js";

/* ── Tabliczka eksponatu ──────────────────────────────────────────────── */

const plaque = document.getElementById("plaque");
const hudEra = document.getElementById("hud-era");
const hint = document.getElementById("hud-hint");
let moved = false;

/* Wskaźnik sali w HUD: wyliczony z pozycji gracza (nie z curZ ani z otwartej
   tabliczki — fokus po Zadaniu 5 nie przenosi już kamery, więc jedyne
   wiarygodne „gdzie jestem" to gracz.pozycja()). `sale` to budynek.sale
   z building.js ({id, odZ, doZ, srodekZ}); poza amfiladą (atrium, z mniejsze
   niż odZ pierwszej sali) żadna sala nie pasuje — stąd jawny fallback. */
function salaZ(z, sale, ERAS) {
  const s = sale.find((s) => z >= s.odZ && z < s.doZ);
  if (!s) return "Atrium";
  const e = ERAS[s.id - 1];
  return `${s.id}/${sale.length} · ${e.range} — ${e.title}`;
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

function buildList() {
  const body = document.getElementById("list-body");
  body.innerHTML = ERAS.map((era) => {
    const items = interactives
      .filter((h) => h.userData.project.era === era.id)
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
    const hit = interactives.find((h) => h.userData.project.id === btn.dataset.id);
    if (!hit) return;
    closeList();
    endFocus();
    focusHooks.goToHit(hit);
  });
}

export { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, isListOpen, salaZ };
