import * as THREE from "three";
import { renderer, camera, composer, bloom } from "./render.js";
import { buildCorridor, buildEkg, dlugosciSal, interactives, tickers, eraRanges } from "./world.js";
import { buildBuilding } from "./building.js";
import { initPlayer } from "./player.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl } from "./ui.js";

const loader = document.getElementById("loader");

window.__mz.interactives = interactives;

/* ── Gracz, fokus, interakcja ──────────────────────────────────────────────
   Gracz powstaje dopiero razem z budynkiem (potrzebuje jego warstwy kolizyjnej),
   a domknięcia poniżej rejestrują się od razu przy ładowaniu modułu — dlatego
   `gracz` jest tu pustym `let`, wypełnianym w bloku startowym na końcu pliku.

   Chodzeniem, kolizjami i kamerą zajmuje się w całości player.js. Zostało tu
   tylko to, co dotyczy eksponatów: który ma otwartą tabliczkę i jak się do
   niego przenieść. */

let gracz = null;
let focus = null;           // {hit} — eksponat z otwartą tabliczką

function focusOn(hit) {
  focus = { hit };
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

addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  // Przy zablokowanym kursorze pierwszy Esc należy do przeglądarki — zdejmuje
  // blokadę. Gdyby zamykał przy okazji tabliczkę, nie dałoby się kliknąć jej
  // linków: tabliczka otwiera się w trakcie chodzenia, czyli przy zajętej myszy.
  if (gracz?.zablokowany()) return;
  endFocus();
  closeList();
});

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

function eraAt(z) {
  const r = eraRanges.find((r) => z >= r.from && z < r.to);
  return r ? `${r.era.range} — ${r.era.title}` : "";
}

const clock = new THREE.Clock();
let firstFrame = true;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (gracz) {
    gracz.update(dt);
    // Nazwa epoki idzie za graczem, nie za otwartą tabliczką: fokus już nie
    // przenosi kamery, więc jedyne wiarygodne „gdzie jestem” to jego pozycja.
    // W atrium (z < 8) żaden zakres nie pasuje i pasek zostaje pusty.
    hudEra.textContent = eraAt(gracz.pozycja().z);
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
    const budynek = buildBuilding(dlugosciSal());
    window.__mz.budynek = budynek;
    buildEkg(budynek.sale[0].odZ, budynek.sale.at(-1).doZ);
    buildList();

    gracz = initPlayer(budynek.kolizje);
    gracz.teleportuj(2);                     // dwa metry w głąb atrium, przodem do amfilady
    gracz.controls.addEventListener("lock", dismissHint);   // podpowiedź gaśnie, gdy zwiedzający wejdzie do środka
    window.__mz.gracz = gracz;
    window.__mz.go = (z) => gracz.teleportuj(z);   // dokończenie uchwytu go() zaczętego w render.js
  } catch (err) { console.error("build error:", err); }
  loop();
});
