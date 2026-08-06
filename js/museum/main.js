import * as THREE from "three";
import { renderer, camera, composer, bloom } from "muzeum/render.js";
import { buildCorridor, buildEkg, dlugosciSal, interactives, tickers } from "muzeum/world.js";
import { buildBuilding } from "muzeum/building.js";
import { initPlayer } from "muzeum/player.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, salaZ } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");

window.__mz.interactives = interactives;

/* Strażnik wydajności: degradacja jednokierunkowa (bloom, potem cienie), patrz
   perf.js. `komunikat` to jedyny most między perf.js a DOM-em — perf.js celowo
   nie wie nic o HTML-u. Ten sam kanał (#hud-perf) obsługuje też komunikat
   o ślepym zaułku tury niżej, żeby gość miał jedno miejsce, gdzie szukać
   informacji zwrotnej od muzeum. */
function komunikat(t) {
  const el = document.getElementById("hud-perf");
  el.textContent = t; el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 6000);
}
const perfTick = initPerf({ composer, bloom, renderer, komunikat });

/* ── Gracz, fokus, interakcja ──────────────────────────────────────────────
   Gracz powstaje dopiero razem z budynkiem (potrzebuje jego warstwy kolizyjnej),
   a domknięcia poniżej rejestrują się od razu przy ładowaniu modułu — dlatego
   `gracz` jest tu pustym `let`, wypełnianym w bloku startowym na końcu pliku.

   Chodzeniem, kolizjami i kamerą zajmuje się w całości player.js. Zostało tu
   tylko to, co dotyczy eksponatów: który ma otwartą tabliczkę i jak się do
   niego przenieść. */

let gracz = null;
let budynek = null;         // {kolizje, sale} — z building.js; hoisted, żeby loop() widział budynek.sale
let focus = null;           // {hit} — eksponat z otwartą tabliczką
let byloWTurze = false;     // ostatnio odczytany stan gracz.wTurze() — do wykrywania zmiany w loop()

function focusOn(hit) {
  focus = { hit };
  // Tabliczka to zwykły panel HTML z linkami i przyciskiem „Wróć do spaceru” —
  // przy schowanym kursorze nie da się w nie trafić. Otwarcie tabliczki oddaje
  // więc myszkę; z powrotem w chodzenie wchodzi się kliknięciem w scenę.
  gracz?.odblokuj();
  hit.userData.exhibit?.activate?.();
  openPlaque(hit);
}

bindFocusControl({
  // Po Zadaniu 5 zakończenie fokusu nie rusza kamery: gracz stoi tam, gdzie stoi,
  // i po prostu zamyka tabliczkę. Zostaje samo skasowanie stanu — bez niego
  // ponowne kliknięcie w ten sam eksponat nie otworzyłoby tabliczki drugi raz.
  onFocusEnd: () => { focus = null; },
  goToHit: (hit) => {
    gracz.teleportuj(hit.position.z - 4, hit.position);   // cztery metry przed eksponatem, przodem do niego
    focusOn(hit);
  },
});

// Esc zamyka tabliczkę i listę zawsze, bez warunków. Przy zablokowanym kursorze
// przeglądarka zabiera to naciśnięcie dla siebie (zdejmuje blokadę) i zdarzenie
// zwykle nie dochodzi do strony — ale skoro otwarcie tabliczki i tak oddaje
// myszkę, otwarta tabliczka przy schowanym kursorze się nie zdarza.
addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* wskaźnik + klik przez raycaster */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // to był drag, nie klik
  pick(e);
  if (hovered) { if (focus && hovered === focus.hit) return; endFocus(); focusOn(hovered); }
  else if (focus) endFocus();
  /* Jedyne miejsce w całym muzeum, które zakłada blokadę wskaźnika — stąd
     player.js nie ma już własnego nasłuchu na płótnie. Warunek czytany PO
     rozstrzygnięciu fokusu: w chodzenie wchodzimy tylko wtedy, gdy klik nie
     trafił w eksponat i nie została otwarta żadna tabliczka. Klik w pustkę
     przy otwartej tabliczce zamyka ją (gałąź wyżej) i tym samym kliknięciem
     wraca do spaceru. */
  if (!hovered && !focus) gracz?.zablokuj();
});
renderer.domElement.addEventListener("pointermove", (e) => { pick(e); });

function pick(e) {
  // Przy zablokowanym kursorze mysz nie ma pozycji na ekranie (jej zdarzenia
  // niosą już tylko przesunięcia), więc celujemy środkiem ekranu — tam, gdzie
  // gracz patrzy. Bez tego wskaźnik zamarzałby w miejscu ostatniego kliknięcia.
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hitList = ray.intersectObjects(interactives, false);
  hovered = hitList.length ? hitList[0].object : null;
  renderer.domElement.style.cursor = hovered ? "pointer" : "default";
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

const clock = new THREE.Clock();
let firstFrame = true;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // Niezależne od gracz/budynek — strażnik wydajności patrzy tylko na dt
  // i composer/renderer, więc mierzy klatki nawet gdyby budowa sceny padła.
  perfTick(dt);

  if (gracz) {
    gracz.update(dt);
    // Wskaźnik sali idzie za pozycją gracza, nie za otwartą tabliczką: fokus
    // już nie przenosi kamery, więc jedyne wiarygodne „gdzie jestem” to jego
    // pozycja, przepuszczona przez salaZ() (ui.js) i sale z budynek.js.
    hudEra.textContent = salaZ(gracz.pozycja().z, budynek.sale, ERAS);
    // Widoczny sygnał, że tura trwa, i jak ją przerwać: etykieta przycisku sama
    // się zmienia. Czytane co klatkę, ale zapisywane do DOM tylko przy zmianie.
    const wTurze = gracz.wTurze();
    if (wTurze !== byloWTurze) {
      byloWTurze = wTurze;
      btnTura.textContent = wTurze ? "Przerwij zwiedzanie" : "Oprowadź mnie";
    }
  }
  for (const fn of tickers) {
    try { fn(t, dt); } catch (err) { console.error("tick error:", err); }
  }
  composer.render();
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});

/* ── Start ────────────────────────────────────────────────────────────── */

Promise.all([
  document.fonts.load("700 46px Syne"),
  document.fonts.load("400 24px 'IBM Plex Mono'"),
  document.fonts.load("600 30px 'Schibsted Grotesk'"),
]).catch(() => {}).finally(() => {
  try {
    // Kolejność jest wiążąca: dopiero rozstawione eksponaty wiedzą, jak długa
    // ma być każda sala, a dopiero gotowy budynek zna zasięg linii EKG.
    buildCorridor();
    budynek = buildBuilding(dlugosciSal());   // przypisanie do zmiennej z modułu — patrz deklaracja `let budynek` wyżej
    window.__mz.budynek = budynek;
    buildEkg(budynek.sale[0].odZ, budynek.sale.at(-1).doZ);
    buildList();

    gracz = initPlayer(budynek.kolizje);
    gracz.teleportuj(2);                     // dwa metry w głąb atrium, przodem do amfilady
    gracz.controls.addEventListener("lock", dismissHint);   // podpowiedź gaśnie, gdy zwiedzający wejdzie do środka
    window.__mz.gracz = gracz;
    window.__mz.go = (z) => gracz.teleportuj(z);   // dokończenie uchwytu go() zaczętego w render.js

    // Przycisk działa jak przełącznik: w trakcie tury przerywa ją (tak samo jak
    // klawisz albo joystick), poza turą — startuje ją. Zamyka ewentualną otwartą
    // tabliczkę przed startem, bo tura przejmuje kamerę całkowicie.
    btnTura.addEventListener("click", () => {
      if (gracz.wTurze()) { gracz.przerwijTure(); return; }
      endFocus();
      // Jedyny przypadek, w którym przycisk nic nie robi: gość stoi za środkiem
      // ostatniej sali i oprowadz() (player.js) odmawia startu (tura nigdy nie
      // cofa). Bez komunikatu wyglądałoby to jak zepsuty przycisk.
      const ruszylo = gracz.oprowadz(budynek.sale);
      if (!ruszylo) komunikat("Jesteś już na końcu ekspozycji — nie ma czego zwiedzać do przodu.");
    });
  } catch (err) { console.error("build error:", err); }
  loop();
});
