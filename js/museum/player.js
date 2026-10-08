/* Chodzenie z kolizjami i rozglądanie się. Octree + Capsule z oficjalnego dema
   FPS three.js — ślizganie po ścianach i wchodzenie w otwory drzwi za darmo,
   czego ręczne AABB nie potrafi (zakleszcza się w narożnikach).

   Jedyna odpowiedzialność: gdzie stoi gracz, dokąd idzie, w co uderza i dokąd
   patrzy. Przejazdy („idź tutaj”, „podejdź do pracy”, plan w rogu) liczy
   nawigacja.js i podaje tu tylko prędkość przez sterujZ() — kolizje i
   grawitacja zostają wspólne, więc przejazd nie przenika przez ławki ani
   podesty. Zero interfejsu i zero geometrii budynku. */

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { camera, renderer, reduceMotion } from "muzeum/render.js";

/* ── Stałe ruchu (metry, sekundy) ─────────────────────────────────────── */

const WZROST = 1.7;          // wysokość oczu = środek górnej półkuli kapsuły
const PROMIEN = 0.35;        // otwór drzwi ma 2,4 m — kapsuła mieści się z zapasem
const PREDKOSC = 4.2;        // marsz [m/s] — amfilada ma ok. 150 m, nie 354
const BIEG = 1.9;            // mnożnik przy Shifcie
const GRAWITACJA = 22;       // [m/s²] — ostrzej niż ziemskie; realne spadanie w grze wygląda ślamazarnie
const DOCISK = 0.5;          // stały docisk do podłogi [m/s] — bez niego `naZiemi` migocze 0101…
/* Bezwładność [1/s]: jak szybko prędkość dochodzi do zadanej. Rozpęd szybszy
   niż hamowanie — start ma być żwawy, a zatrzymanie miękkie, jak krok. */
const ROZPED = 9, HAMOWANIE = 7;
const AMPLITUDA_KROKU = 0.022;   // bujanie kamery [m]
const DLUGOSC_KROKU = 0.75;      // [m] — bujanie i dźwięk kroków liczone z drogi, nie z czasu
const MARTWA_STREFA = 0.15;      // joystick
const CZULOSC = 0.0032;          // [rad/px] — przeciąganie myszą i palcem
const MAX_POCHYLENIE = 1.15;     // [rad] ok. 66° w górę i w dół
/* Górny limit kroku całkowania. Przy 0,05 s i biegu (8 m/s) kapsuła przesuwa
   się o 0,4 m na klatkę, a przeskok przez mur 0,4 m wymaga ponad 1,1 m (mur +
   dwa promienie) — zapas jest. Dłuższa klatka (karta w tle) zjadłaby ten
   margines, dlatego limit pilnujemy tutaj, nie tylko w pętli main.js. */
const MAX_KROK = 0.05;

const KLAWISZE_RUCHU = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const naUi = (el) => !!el?.closest?.(".plaque, .list-panel, .hud-top, .minimapa, #wejscie");

/* Wspólne rozglądanie: przeciąganie myszą, prawy kciuk, (w blokadzie) mysz.
   Euler YXZ — odchylenie, potem pochylenie — kamera się nie przekrzywia. */
const eul = new THREE.Euler(0, 0, 0, "YXZ");
function rozejrzyj(dx, dy) {
  eul.setFromQuaternion(camera.quaternion);
  eul.y -= dx * CZULOSC;
  eul.x = THREE.MathUtils.clamp(eul.x - dy * CZULOSC, -MAX_POCHYLENIE, MAX_POCHYLENIE);
  camera.quaternion.setFromEuler(eul);
}

/* ── Dotyk: joystick i rozglądanie ────────────────────────────────────────
   Lewa połowa ekranu to analogowy joystick, prawa obraca kamerę. Każdy gest
   śledzi WŁASNY identifier dotyku, więc działają jednocześnie. Krótkie
   dotknięcie (bez przeciągnięcia) obsługuje main.js jako „idź tutaj” albo
   „podejdź do pracy” — tu tylko gesty ciągłe. */
function dotyk({ naRuch, naRozgladanie }) {
  const host = document.createElement("div");
  host.className = "joy"; host.hidden = true;
  host.innerHTML = '<span class="joy-kciuk"></span>';
  document.body.appendChild(host);
  const kciuk = host.querySelector(".joy-kciuk");
  let id = null, sx = 0, sy = 0;
  let idRozgladania = null, ostatniX = 0, ostatniY = 0;

  addEventListener("touchstart", (e) => {
    // samoleczenie: zgubione touchend nie blokuje nowego dotyku
    const zywy = (i) => i === null || [...e.touches].some((x) => x.identifier === i);
    if (!zywy(id)) id = null;
    if (!zywy(idRozgladania)) idRozgladania = null;
    for (const t of e.changedTouches) {
      if (naUi(t.target)) continue;
      host.hidden = false;
      if (t.clientX <= innerWidth / 2) {
        if (id !== null) continue;
        id = t.identifier; sx = t.clientX; sy = t.clientY;
        host.style.left = `${sx}px`; host.style.top = `${sy}px`;
        host.classList.add("aktywny");
      } else if (idRozgladania === null) {
        idRozgladania = t.identifier; ostatniX = t.clientX; ostatniY = t.clientY;
      }
    }
  }, { passive: true });

  addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) {
        const dx = THREE.MathUtils.clamp((t.clientX - sx) / 60, -1, 1);
        const dy = THREE.MathUtils.clamp((t.clientY - sy) / 60, -1, 1);
        kciuk.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
        naRuch(dx, -dy);
      } else if (t.identifier === idRozgladania) {
        naRozgladanie(t.clientX - ostatniX, t.clientY - ostatniY);
        ostatniX = t.clientX; ostatniY = t.clientY;
      }
    }
  }, { passive: true });

  // touchcancel jak touchend — iOS wysyła cancel przy geście systemowym od lewej krawędzi
  const pusc = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) { id = null; kciuk.style.transform = ""; host.classList.remove("aktywny"); naRuch(0, 0); }
      else if (t.identifier === idRozgladania) idRozgladania = null;
    }
  };
  addEventListener("touchend", pusc, { passive: true });
  addEventListener("touchcancel", pusc, { passive: true });
}

export function initPlayer(kolizje) {
  const octree = new Octree().fromGraphNode(kolizje);
  const kapsula = new Capsule(new THREE.Vector3(0, PROMIEN, 0), new THREE.Vector3(0, WZROST, 0), PROMIEN);
  const controls = new PointerLockControls(camera, renderer.domElement);
  const klawisze = {};
  const predkosc = new THREE.Vector3(), zadana = new THREE.Vector3();
  const przod = new THREE.Vector3(), bok = new THREE.Vector3(), ruch = new THREE.Vector3(), krok = new THREE.Vector3();
  const sluchaczeKrokow = new Set();
  let naZiemi = false, joyX = 0, joyY = 0;
  let zewnetrzna = null;      // prędkość zadana przez nawigacja.js (x, z) albo null
  let aktywnosc = -1e9;       // chwila ostatniego czynnego wejścia gościa — przerywa przejazd
  let droga = 0;              // przebyta droga w bieżącym kroku [m]
  let przeciaganie = null;    // { x, y } — przeciąganie myszą bez blokady

  const lista = () => !!document.querySelector(".list-panel:not([hidden])");

  addEventListener("keydown", (e) => {
    if (lista()) return;
    klawisze[e.code] = true;
    /* Pierwszy klawisz ruchu wchodzi w tryb gry: mysz rozgląda się bez
       przytrzymania. Klik zostaje dla „idź tutaj”. keydown jest gestem
       użytkownika, więc przeglądarka zgadza się na blokadę. */
    if (KLAWISZE_RUCHU.has(e.code) && !controls.isLocked) {
      renderer.domElement.requestPointerLock?.()?.catch?.(() => {});   // odmowa (np. Esc w trakcie) jest zwyczajna — zostaje tryb myszy
    }
  });
  addEventListener("keyup", (e) => { klawisze[e.code] = false; });
  addEventListener("blur", () => { for (const k in klawisze) klawisze[k] = false; });   // puszczony klawisz poza oknem nie może jechać dalej

  dotyk({
    naRuch: (dx, dy) => { joyX = dx; joyY = dy; },
    naRozgladanie: (dx, dy) => { rozejrzyj(dx, dy); aktywnosc = performance.now(); },
  });

  // przeciąganie myszą: rozglądanie bez blokady wskaźnika (klik bez ruchu obsługuje main.js)
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || controls.isLocked || e.button !== 0) return;
    przeciaganie = { x: e.clientX, y: e.clientY };
  });
  addEventListener("pointermove", (e) => {
    if (!przeciaganie || e.pointerType === "touch") return;
    const dx = e.clientX - przeciaganie.x, dy = e.clientY - przeciaganie.y;
    przeciaganie = { x: e.clientX, y: e.clientY };
    if (dx || dy) { rozejrzyj(dx, dy); aktywnosc = performance.now(); }
  });
  addEventListener("pointerup", () => { przeciaganie = null; });
  controls.addEventListener("change", () => { aktywnosc = performance.now(); });   // mysz w blokadzie

  /* Klawisze i joystick, które w tej klatce mają prawo ruszyć graczem.
     KRYTYCZNE: dotyk wpisuje TYLKO aktywne (true) klucze — scalenie niżej to
     suma źródeł; wpisane false zerowałoby prawdziwe WASD. `__mz.testRuch`
     symuluje klawisz w testach (blokada wymaga prawdziwego gestu). */
  function wcisniete() {
    const z = {};
    if (joyY > MARTWA_STREFA) z.KeyW = true;
    if (joyY < -MARTWA_STREFA) z.KeyS = true;
    if (joyX > MARTWA_STREFA) z.KeyD = true;
    if (joyX < -MARTWA_STREFA) z.KeyA = true;
    return { ...klawisze, ...z, ...window.__mz?.testRuch };
  }

  function kierunek(w) {
    camera.getWorldDirection(przod);
    przod.y = 0; przod.normalize();
    bok.crossVectors(przod, camera.up).normalize();
    const d = ruch.set(0, 0, 0);
    if (w.KeyW || w.ArrowUp) d.add(przod);
    if (w.KeyS || w.ArrowDown) d.sub(przod);
    if (w.KeyD || w.ArrowRight) d.add(bok);
    if (w.KeyA || w.ArrowLeft) d.sub(bok);
    return d.normalize();
  }

  /* Jedno rozstrzygnięcie kolizji na klatkę: capsuleIntersect oddaje jeden
     wypadkowy wektor wyjścia, więc narożnik (podłoga i ściana) rozwiązuje się
     poprawnie. Próg `normal.y > 0` celowo luźny — na szwie trójkątów podłogi
     wypadkowa normalna spada do ~0,83 (pomiar z sierpnia). */
  function kolizja() {
    const w = octree.capsuleIntersect(kapsula);
    naZiemi = false;
    if (!w) return;
    naZiemi = w.normal.y > 0;
    if (!naZiemi) predkosc.addScaledVector(w.normal, -w.normal.dot(predkosc));
    kapsula.translate(w.normal.multiplyScalar(w.depth));
  }

  return {
    controls,
    zablokowany: () => controls.isLocked,
    naZiemi: () => naZiemi,
    pozycja: () => kapsula.end.clone(),
    pozycjaDo: (v) => v.copy(kapsula.end),
    pozycjaX: () => kapsula.end.x,
    pozycjaZ: () => kapsula.end.z,
    predkosc: () => Math.hypot(predkosc.x, predkosc.z),
    /* Czy gość sam coś zrobił przed chwilą (klawisz, joystick, przeciągnięcie,
       mysz w blokadzie) — wtedy nawigacja.js oddaje mu ster. */
    aktywneWejscie: () => performance.now() - aktywnosc < 150,
    naKrok: (f) => sluchaczeKrokow.add(f),

    /* Prędkość zadana z zewnątrz (nawigacja.js) albo null — wtedy znowu klawisze. */
    sterujZ(vx, vz) { zewnetrzna = vx === null || vx === undefined ? null : { x: vx, z: vz }; },

    zablokuj() { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); },   // odmowa blokady jest zwyczajna — zostaje tryb myszy
    /* Świadomie NIE controls.unlock(): w r169 to gołe exitPointerLock(), którego
       WebKit na iOS nie ma — TypeError w środku otwierania tabliczki. */
    odblokuj() { renderer.domElement.ownerDocument.exitPointerLock?.(); },

    /* Skok w punkt (x, z) planu; `patrzNa` (opcjonalne) obraca kamerę ku punktowi. */
    teleportuj(x, z, patrzNa) {
      kapsula.start.set(x, PROMIEN, z);
      kapsula.end.set(x, WZROST, z);
      predkosc.set(0, 0, 0);
      zewnetrzna = null;
      camera.position.copy(kapsula.end);
      // domyślna kamera patrzy w −Z, amfilada biegnie w +Z — bez obrotu gość stałby tyłem do muzeum
      if (patrzNa) camera.lookAt(patrzNa.x, patrzNa.y ?? WZROST, patrzNa.z);   // Vector3 albo zwykłe { x, z } (na wysokości oczu)
      else camera.rotation.set(0, Math.PI, 0);
    },

    update(dt) {
      dt = Math.min(dt, MAX_KROK);
      const w = wcisniete();
      const d = kierunek(w);
      if (d.lengthSq() > 0) { aktywnosc = performance.now(); zewnetrzna = null; }
      const tempo = PREDKOSC * (w.ShiftLeft || w.ShiftRight ? BIEG : 1);
      if (zewnetrzna) zadana.set(zewnetrzna.x, 0, zewnetrzna.z);
      else zadana.set(d.x * tempo, 0, d.z * tempo);
      const k = 1 - Math.exp(-dt * (zadana.lengthSq() > 0 ? ROZPED : HAMOWANIE));
      predkosc.x += (zadana.x - predkosc.x) * k;
      predkosc.z += (zadana.z - predkosc.z) * k;
      if (naZiemi) predkosc.y = -DOCISK; else predkosc.y -= GRAWITACJA * dt;
      kapsula.translate(krok.copy(predkosc).multiplyScalar(dt));
      kolizja();
      camera.position.copy(kapsula.end);
      // kroki: z przebytej drogi — szybszy chód to częstsze kroki; bujanie wyłączone przy reduced motion
      const v = Math.hypot(predkosc.x, predkosc.z);
      if (naZiemi && v > 0.4) {
        droga += v * dt;
        if (droga >= DLUGOSC_KROKU) { droga -= DLUGOSC_KROKU; for (const f of sluchaczeKrokow) f(); }
        if (!reduceMotion) camera.position.y += Math.sin((droga / DLUGOSC_KROKU) * Math.PI * 2) * AMPLITUDA_KROKU * Math.min(1, v / PREDKOSC);
      }
    },
  };
}
