/* Muzeum Budowania — spięcie modułów: plan → budynek → wystrój → gracz, pętla
   klatek i obsługa kliknięć. Każdy moduł ma jedną odpowiedzialność; tu tylko
   kolejność i przewody między nimi. */
import * as THREE from "three";
import { renderer, scene, camera, composer, bloom } from "muzeum/render.js";
import { zbudujPlan, salaPod } from "muzeum/plan.js";
import { zbudujBudynek } from "muzeum/sale.js";
import { urzadz } from "muzeum/wystroj.js";
import { powiesPrace } from "muzeum/zawieszenie.js";
import { PODSTAWY } from "muzeum/exhibits.js";
import { initPlayer } from "muzeum/player.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, opisSali } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");
const celownik = document.getElementById("celownik");

/* Jedno miejsce na komunikaty muzeum (#hud-perf): strażnik wydajności i
   odmowy przycisków. Pamiętany timer — nowy komunikat nie znika przedwcześnie. */
let chowanieId = null;
function komunikat(tekst) {
  const el = document.getElementById("hud-perf");
  el.textContent = tekst;
  el.hidden = false;
  clearTimeout(chowanieId);
  chowanieId = setTimeout(() => { el.hidden = true; }, 6000);
}
const perfTick = initPerf({ composer, bloom, renderer, komunikat });

let plan = null, budynek = null, gracz = null, prace = null;
const interaktywne = [];     // trafienia raycastera: prace (Zadanie 3), eksponaty (Zadanie 4), sale boczne (Zadanie 8)
const tickery = [];          // funkcje (t, dt) wołane co klatkę
let focus = null;            // { hit } — praca z otwartą tabliczką
let bylaSala = null, byloWTurze = false;

/* KOLEJNOŚĆ BEZ ZMIAN względem dawnego main.js: najpierw treść, potem
   przeglądarka. odblokuj() schodzi do exitPointerLock(), którego WebKit na iOS
   nie ma — tabliczka musi się otworzyć, zanim cokolwiek tam rzuci. */
function focusOn(hit) {
  focus = { hit };
  openPlaque(hit);
  try { hit.userData.exhibit?.activate?.(); } catch (err) { console.error("activate error:", err); }
  gracz?.odblokuj();
}

bindFocusControl({
  onFocusEnd: () => { focus = null; },
  // skok z listy: przed pracę, przodem do niej (przejazd zamiast skoku — Zadanie 6)
  goToHit: (hit) => {
    const w = hit.userData.widok;
    gracz.teleportuj(w.pozycja.x, w.pozycja.z, w.cel);
    focusOn(hit);
  },
});

addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* ── Wskazywanie i klik ───────────────────────────────────────────────── */

const ray = new THREE.Raycaster();
ray.far = 14;     // „to, co stoi przede mną" — nie praca z drugiego końca sali
const pointer = new THREE.Vector2();
let hovered = null, bylHovered = false, downAt = null;

// `e` opcjonalne: przy blokadzie wskaźnika celujemy środkiem ekranu (pętla woła bez zdarzenia)
function celuj(e) {
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else if (e) pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  else return;
  ray.setFromCamera(pointer, camera);
  const traf = ray.intersectObjects(interaktywne, false);
  hovered = traf.length ? traf[0].object : null;
  if (!!hovered !== bylHovered) {
    bylHovered = !!hovered;
    renderer.domElement.style.cursor = bylHovered ? "pointer" : "default";
    celownik.classList.toggle("celuje", bylHovered);
  }
}

function obsluzKlik(e) {
  celuj(e);
  if (hovered) { if (focus && hovered === focus.hit) return; endFocus(); focusOn(hovered); }
  else if (focus) endFocus();
  if (!hovered && !focus) gracz?.zablokuj();
}

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // przeciągnięcie, nie klik
  obsluzKlik(e);
});
renderer.domElement.addEventListener("pointermove", (e) => celuj(e));

/* Zmiana sali pod nogami gościa — jedno miejsce, z którego dowiadują się o niej
   wszystkie moduły (HUD; od Zadania 5 światła, potem plan w rogu i dźwięk).
   aria-live na #hud-era ogłasza każde przypisanie, więc tylko przy zmianie. */
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

const clock = new THREE.Clock();
let firstFrame = true;
function petla() {
  requestAnimationFrame(petla);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  perfTick(dt);
  if (gracz) {
    gracz.update(dt);
    if (gracz.zablokowany()) celuj();
    const s = salaPod(plan, gracz.pozycjaX(), gracz.pozycjaZ());
    if (s && s !== bylaSala) { bylaSala = s; naZmianeSali(s); }
    const wTurze = gracz.wTurze();
    if (wTurze !== byloWTurze) {
      byloWTurze = wTurze;
      btnTura.textContent = wTurze ? "Przerwij zwiedzanie" : "Oprowadź mnie";
    }
  }
  for (const fn of tickery) {
    try { fn(t, dt); } catch (err) { console.error("tick error:", err); }
  }
  composer.render();
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); window.__mzOtwarte?.(); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ── Budowa ───────────────────────────────────────────────────────────── */

function zbudujMuzeum() {
  plan = zbudujPlan({ ERAS, PROJECTS, autorskie: new Map(Object.entries(PODSTAWY)) });
  budynek = zbudujBudynek(plan);
  urzadz(plan, budynek);
  prace = powiesPrace(plan, budynek);
  interaktywne.push(...prace.interaktywne);
  for (const o of prace.obrazy) o.wczytaj();   // wszystkie od razu; salami — Zadanie 10
  scene.add(budynek.grupa);
  tickery.push(...budynek.tickery);

  gracz = initPlayer(budynek.kolizje);         // po wszystkich kolizjach — Octree buduje się raz
  gracz.teleportuj(plan.start.x, plan.start.z);
  gracz.controls.addEventListener("lock", dismissHint);
  addEventListener("touchstart", dismissHint, { once: true, passive: true });
  gracz.controls.addEventListener("lock", () => { celownik.hidden = false; });
  gracz.controls.addEventListener("unlock", () => {
    celownik.hidden = true;
    celownik.classList.remove("celuje");
    bylHovered = false;
  });

  /* Uchwyt tylko się rozszerza: `interactives` (nazwa z czasów korytarza) to ta sama
     tablica co `interaktywne`, a go(z) z jednym argumentem, jak dawniej, stawia
     gracza na osi amfilady (x = 0). */
  Object.assign(window.__mz, {
    plan, budynek, gracz, prace, interaktywne, interactives: interaktywne,
    go: (x, z) => (z === undefined ? gracz.teleportuj(0, x) : gracz.teleportuj(x, z)),
  });

  // „Oprowadź mnie” po środkach sal epok — do Zadania 6, które zastąpi to wycieczką po wyróżnionych
  btnTura.addEventListener("click", () => {
    if (gracz.wTurze()) { gracz.przerwijTure(); return; }
    endFocus();
    const sale = plan.sale.filter((s) => s.rodzaj === "epoka").map((s) => ({ srodekZ: (s.z0 + s.z1) / 2 }));
    if (!gracz.oprowadz(sale)) komunikat("Jesteś już na końcu ekspozycji — nie ma czego zwiedzać do przodu.");
  });

  buildList(interaktywne);
}

/* Bez tekstu w drugim argumencie document.fonts.load() ściąga tylko kroje
   podstawowej łaciny, a polskie litery (ą ć ę ł ń ś ź ż) leżą w osobnym
   latin-ext — na płótnach szyldów wpadałyby w pismo zastępcze. Próbka ma
   litery z obu zakresów. */
const PROBKA_PL = "Aa ĄąĆćĘęŁłŃńÓóŚśŹźŻż";

Promise.all([
  document.fonts.load("700 46px Syne", PROBKA_PL),
  document.fonts.load("400 24px 'IBM Plex Mono'", PROBKA_PL),
  document.fonts.load("600 30px 'Schibsted Grotesk'", PROBKA_PL),
  document.fonts.load("600 92px 'Cormorant Garamond'", PROBKA_PL),
]).catch((err) => console.warn("muzeum: krój pisma nie doszedł —", err)).finally(() => {
  try { zbudujMuzeum(); } catch (err) { console.error("build error:", err); }
  petla();
});
