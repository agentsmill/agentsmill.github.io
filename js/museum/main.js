/* Muzeum Budowania — spięcie modułów: plan → budynek → wystrój → prace →
   eksponaty → gracz → światła → nawigacja, pętla klatek i obsługa kliknięć.
   Każdy moduł ma jedną odpowiedzialność; tu tylko kolejność i przewody. */
import * as THREE from "three";
import { renderer, scene, camera, composer, bloom } from "muzeum/render.js";
import { zbudujPlan, salaPod } from "muzeum/plan.js";
import { zbudujBudynek } from "muzeum/sale.js";
import { urzadz } from "muzeum/wystroj.js";
import { powiesPrace } from "muzeum/zawieszenie.js";
import { PODSTAWY, postawEksponaty } from "muzeum/exhibits.js";
import { initPlayer } from "muzeum/player.js";
import { initNawigacja } from "muzeum/nawigacja.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, opisSali } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";
import { initSwiatla } from "muzeum/swiatla.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");
const celownik = document.getElementById("celownik");
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

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

let plan = null, budynek = null, gracz = null, prace = null, swiatla = null, nawigacja = null;
const interaktywne = [];     // trafienia raycastera: prace, eksponaty, sale boczne (Zadanie 8)
const tickery = [];          // funkcje (t, dt) wołane co klatkę
let focus = null;            // { hit } — praca z otwartą tabliczką
let bylaSala = null, byloWycieczka = false;

/* KOLEJNOŚĆ: najpierw treść, potem przeglądarka. odblokuj() schodzi do
   exitPointerLock(), którego WebKit na iOS nie ma — tabliczka musi się
   otworzyć, zanim cokolwiek tam rzuci. */
function focusOn(hit) {
  focus = { hit };
  openPlaque(hit);
  try { hit.userData.exhibit?.activate?.(); } catch (err) { console.error("activate error:", err); }
  gracz?.odblokuj();
}

/* Podejście do pracy: przejazd przez drzwi, na miejscu tabliczka. */
function podejdz(hit) {
  endFocus();
  nawigacja.podejdzDo(hit, () => focusOn(hit));
}

bindFocusControl({
  onFocusEnd: () => { focus = null; },
  goToHit: (hit) => podejdz(hit),     // pozycja z listy eksponatów
});

addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* ── Wskazywanie i klik ───────────────────────────────────────────────────
   Klik w pracę → podejdź do niej. Klik w podłogę → idź tam (znacznik na
   posadzce pokazuje dokąd, zanim się kliknie). Przy blokadzie wskaźnika
   (tryb klawiatury) celuje środek ekranu. */

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const ZASIEG_PRAC = 14, ZASIEG_PODLOGI = 40;
let hovered = null, punktPodlogi = null, bylHovered = false, downAt = null;
const znacznik = new THREE.Mesh(
  new THREE.RingGeometry(0.2, 0.28, 40),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2c46d).multiplyScalar(1.4), transparent: true, opacity: 0.85, depthWrite: false })
);
znacznik.rotation.x = -Math.PI / 2;
znacznik.visible = false;
scene.add(znacznik);

/* Czy promień trafia w widoczną bryłę eksponatu: siatki wprost, linie i punkty z
   ciasnym progiem — domyślny próg linii w three.js to 1 m, czyli „trafienie” obok
   rzeźby. Reverie i Anatomy nie mają żadnej siatki, same linie i punkty. */
function trafiaRzezbe(grupa) {
  const czesci = [];
  grupa.traverse((o) => { if (o.isMesh || o.isLine || o.isPoints) czesci.push(o); });
  const { Line, Points } = ray.params;
  const [progLinii, progPunktow] = [Line.threshold, Points.threshold];
  Line.threshold = 0.05; Points.threshold = 0.08;
  const trafia = ray.intersectObjects(czesci, false).length > 0;
  Line.threshold = progLinii; Points.threshold = progPunktow;
  return trafia;
}

function celuj(e) {
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else if (e) pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  else return;
  ray.setFromCamera(pointer, camera);
  ray.far = ZASIEG_PRAC;
  const traf = ray.intersectObjects(interaktywne, false);
  /* Pośredniki eksponatów (niewidoczne kule i walec toru) są większe od samych rzeźb,
     więc promień mierzący w obraz za nimi albo w podłogę obok trafiałby najpierw w nie.
     Pośrednik liczy się tylko, gdy ten sam promień trafia w widoczną bryłę eksponatu
     (trafiaRzezbe). Gdy nic nie przejdzie, wygrywa podłoga; dopiero bez podłogi —
     pierwszy pośrednik z brzegu. */
  const wybrane = traf.find((t) => !t.object.userData.exhibit || trafiaRzezbe(t.object.userData.exhibit.group));
  hovered = wybrane ? wybrane.object : null;
  punktPodlogi = null;
  if (!hovered && budynek) {
    ray.far = ZASIEG_PODLOGI;
    const p = ray.intersectObjects(budynek.podlogi, false)[0];
    if (p) punktPodlogi = p.point;
    else if (traf.length) hovered = traf[0].object;
  }
  znacznik.visible = !!punktPodlogi;
  if (punktPodlogi) znacznik.position.set(punktPodlogi.x, 0.012, punktPodlogi.z);
  const aktywny = !!hovered || !!punktPodlogi;
  if (aktywny !== bylHovered) {
    bylHovered = aktywny;
    renderer.domElement.style.cursor = aktywny ? "pointer" : "default";
  }
  celownik.classList.toggle("celuje", !!hovered);
}

function obsluzKlik(e) {
  celuj(e);
  if (hovered) {
    if (focus && hovered === focus.hit) return;
    podejdz(hovered);
  } else if (punktPodlogi) {
    endFocus();
    nawigacja.idzDo(punktPodlogi.x, punktPodlogi.z);
  } else if (focus) endFocus();
}

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // przeciągnięcie (rozglądanie), nie klik
  obsluzKlik(e);
});
renderer.domElement.addEventListener("pointermove", (e) => { if (!downAt) celuj(e); });
renderer.domElement.addEventListener("pointerleave", () => { znacznik.visible = false; });

/* Zmiana sali pod nogami gościa — jedno miejsce, z którego dowiadują się o
   niej wszystkie moduły. aria-live na #hud-era ogłasza każde przypisanie,
   więc tylko przy zmianie. */
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
  swiatla?.wejdz(s);
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

const clock = new THREE.Clock();
let firstFrame = true;
function petla() {
  requestAnimationFrame(petla);
  const dt = Math.min(clock.getDelta(), 0.05);
  const czas = clock.elapsedTime;      // nie `t` — to nazwa tłumacza napisów wyżej
  perfTick(dt);
  if (gracz) {
    nawigacja.update(dt);              // najpierw ster przejazdu, potem ruch z kolizjami
    gracz.update(dt);
    if (gracz.zablokowany()) celuj();
    const s = salaPod(plan, gracz.pozycjaX(), gracz.pozycjaZ());
    if (s && s !== bylaSala) { bylaSala = s; naZmianeSali(s); }
    const w = nawigacja.trwaWycieczka();
    if (w !== byloWycieczka) {
      byloWycieczka = w;
      btnTura.textContent = w ? t("muz.przerwij", "Przerwij zwiedzanie") : t("muz.tura", "Oprowadź mnie");
    }
  }
  for (const fn of tickery) {
    try { fn(czas, dt); } catch (err) { console.error("tick error:", err); }
  }
  swiatla?.aktualizuj(dt);
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

/* Trafienie dla wycieczki: przy pracy z rzeźbą wolimy rzeźbę (jej widok
   obejmuje i rzeźbę, i obraz nad nią). */
function znajdzTrafienie(idProjektu) {
  const kandydaci = interaktywne.filter((h) => h.userData.project?.id === idProjektu);
  return kandydaci.find((h) => h.userData.exhibit) ?? kandydaci[0] ?? null;
}

function zbudujMuzeum() {
  plan = zbudujPlan({ ERAS, PROJECTS, autorskie: new Map(Object.entries(PODSTAWY)) });
  budynek = zbudujBudynek(plan);
  urzadz(plan, budynek);
  prace = powiesPrace(plan, budynek);
  interaktywne.push(...prace.interaktywne);
  for (const o of prace.obrazy) o.wczytaj();   // wszystkie od razu; salami — Zadanie 10
  const eksponaty = postawEksponaty(plan, budynek);   // przed graczem: dokłada kolizje podestów
  interaktywne.push(...eksponaty.interaktywne);
  tickery.push(...eksponaty.tickery);
  scene.add(budynek.grupa);
  tickery.push(...budynek.tickery);

  gracz = initPlayer(budynek.kolizje);         // po wszystkich kolizjach — Octree buduje się raz
  gracz.teleportuj(plan.start.x, plan.start.z);
  swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy });
  nawigacja = initNawigacja({ plan, gracz, zaslona: document.getElementById("zaslona") });

  // podpowiedź gaśnie przy pierwszym czynnym ruchu; celownik żyje tylko w trybie klawiatury
  gracz.controls.addEventListener("lock", dismissHint);
  addEventListener("touchstart", dismissHint, { once: true, passive: true });
  renderer.domElement.addEventListener("pointerup", dismissHint, { once: true });
  gracz.controls.addEventListener("lock", () => { celownik.hidden = false; });
  gracz.controls.addEventListener("unlock", () => { celownik.hidden = true; celownik.classList.remove("celuje"); });

  /* Uchwyt tylko się rozszerza: `interactives` (nazwa z czasów korytarza) to ta sama
     tablica co `interaktywne`, a go(z) z jednym argumentem, jak dawniej, stawia
     gracza na osi amfilady (x = 0). */
  Object.assign(window.__mz, {
    plan, budynek, gracz, prace, swiatla, nawigacja, interaktywne, interactives: interaktywne,
    go: (x, z) => (z === undefined ? gracz.teleportuj(0, x) : gracz.teleportuj(x, z)),
  });

  // „Oprowadź mnie” = wycieczka po wyróżnionych; w trakcie ten sam przycisk ją przerywa
  btnTura.addEventListener("click", () => {
    if (nawigacja.trwaWycieczka()) { nawigacja.przerwij(); endFocus(); return; }
    closeList();
    const ruszyla = nawigacja.rozpocznijWycieczke({
      znajdz: znajdzTrafienie,
      otworz: (hit) => focusOn(hit),
      zamknij: () => endFocus(),
    });
    if (!ruszyla) komunikat(t("muz.brakWycieczki", "Nie ma wyróżnionych prac do pokazania."));
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
  document.fonts.load("500 24px 'IBM Plex Mono'", PROBKA_PL),   // podpisy szyldów i tabliczek — bez tej linii 500 doszłoby tylko przypadkiem, z HUD-u
  document.fonts.load("600 30px 'Schibsted Grotesk'", PROBKA_PL),
  document.fonts.load("600 92px 'Cormorant Garamond'", PROBKA_PL),
]).catch((err) => console.warn("muzeum: krój pisma nie doszedł —", err)).finally(() => {
  try { zbudujMuzeum(); } catch (err) { console.error("build error:", err); }
  petla();
});
