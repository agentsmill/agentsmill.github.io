/* Chodzenie z kolizjami. Octree + Capsule to rozwiązanie z oficjalnego dema FPS
   three.js — daje ślizganie po ścianach i wchodzenie w portale za darmo, czego
   ręczne AABB nie potrafi (zakleszcza się w narożnikach).

   Jedyna odpowiedzialność tego modułu: gdzie stoi gracz, dokąd idzie i w co
   uderza. Zero interfejsu (tabliczka, lista, podpowiedź HUD należą do ui.js
   i main.js) i zero geometrii budynku (building.js) — tutaj wchodzi gotowa
   warstwa kolizyjna i nic poza nią. */

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { camera, renderer, reduceMotion } from "./render.js";

/* ── Stałe ruchu ──────────────────────────────────────────────────────────
   Wszystko w metrach i sekundach świata, tak jak wymiary z building.js. */

const WZROST = 1.7;          // wysokość oczu = środek górnej półkuli kapsuły
const PROMIEN = 0.35;        // promień kapsuły; portal ma 3 m szerokości, więc mieści się z zapasem
const PREDKOSC = 5.2;        // marsz [m/s] — szybki spacer, muzeum ma 329 m długości
const BIEG = 1.9;            // mnożnik prędkości przy wciśniętym Shifcie
const GRAWITACJA = 22;       // [m/s²] — ostrzej niż ziemskie 9,81; realne spadanie w grze wygląda ślamazarnie
const DOCISK = 0.5;          // stały docisk do podłogi [m/s] — patrz komentarz przy naZiemi w update()
const AMPLITUDA_KROKU = 0.025;   // bujanie kamery w pionie [m]
/* Mnożnik czasu dla bujania. Częstotliwość = TEMPO_KROKU · tempo · 1000 / 2π, więc
   przy marszu (5,2 m/s) wychodzi ~3,5 bujnięcia na sekundę — mniej więcej tempo
   kroku dorosłego człowieka — a przy biegu odpowiednio szybciej. */
const TEMPO_KROKU = 0.0042;

/* Górny limit kroku całkowania. Przy 0,05 s i biegu (9,9 m/s) kapsuła przesuwa
   się o 0,49 m na klatkę, a żeby przeskoczyć ścianę o grubości 0,4 m musiałaby
   pokonać ponad 1,1 m (0,4 grubości + dwa promienie kapsuły) — zapas jest
   dwukrotny. Dłuższa klatka (przełączona karta, zapchany wątek) zjadłaby ten
   margines i gracz wyszedłby przez ścianę, dlatego limit pilnujemy tutaj, a nie
   tylko po stronie pętli w main.js. */
const MAX_KROK = 0.05;

export function initPlayer(kolizje) {
  const octree = new Octree().fromGraphNode(kolizje);
  const kapsula = new Capsule(
    new THREE.Vector3(0, PROMIEN, 0),
    new THREE.Vector3(0, WZROST, 0),
    PROMIEN
  );
  const controls = new PointerLockControls(camera, renderer.domElement);
  const klawisze = {};
  const predkosc = new THREE.Vector3();
  // Wektory robocze: liczone co klatkę, więc alokowane raz na całe życie muzeum.
  const przod = new THREE.Vector3(), bok = new THREE.Vector3();
  const ruch = new THREE.Vector3(), krok = new THREE.Vector3();
  let naZiemi = false;

  addEventListener("keydown", (e) => { klawisze[e.code] = true; });
  addEventListener("keyup", (e) => { klawisze[e.code] = false; });

  renderer.domElement.addEventListener("click", () => {
    if (controls.isLocked) return;
    /* Prosimy o blokadę sami, zamiast wołać controls.lock(). To dokładnie ta
       sama operacja (`domElement.requestPointerLock()`), ale mamy dostęp do
       zwracanej obietnicy: Chrome odrzuca ją, gdy klik trafi w ~1,3 s karencji
       po wyjściu Esc, a nieprzechwycone odrzucenie wylądowałoby w window.__errs
       i zaśmiecało weryfikację. Stan blokady i tak śledzą `controls` — przez
       zdarzenie pointerlockchange, niezależnie od tego, kto o nią poprosił.
       Starsze przeglądarki nie zwracają obietnicy, stąd `?.catch?.()`. */
    renderer.domElement.requestPointerLock()?.catch?.(() => {});
  });

  /* Klawisze, które w tej klatce mają prawo ruszyć graczem.

     Bez blokady kursora nie rusza go nic: przed pierwszym kliknięciem gracz stoi
     w atrium, a po Esc (otwarta tabliczka eksponatu albo lista) świat nie ma
     uciekać pod panelem, po którym akurat wodzi się myszą.

     `__mz.testRuch` omija tę bramkę — sonda weryfikacyjna nie ma jak wywołać
     blokady kursora, bo ta wymaga prawdziwego gestu użytkownika. */
  function wcisniete() {
    return { ...(controls.isLocked ? klawisze : null), ...window.__mz?.testRuch };
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

  /* Jedno rozstrzygnięcie kolizji na klatkę wystarcza: `capsuleIntersect` sam
     przechodzi po wszystkich trójkątach, w które kapsuła weszła, i oddaje jeden
     wypadkowy wektor wyjścia. Dlatego narożnik (podłoga i ściana naraz) rozwiązuje
     się poprawnie bez ręcznego iterowania. */
  function kolizja() {
    const w = octree.capsuleIntersect(kapsula);
    naZiemi = false;
    if (!w) return;
    /* Próg celowo luźny (> 0, a nie np. > 0,7). Górne lico bryły podłogi three.js
       dzieli na dwa trójkąty i dokładnie na ich szwie — czyli na osi x = 0, tej
       samej, po której gracz idzie środkiem amfilady — wypadkowa normalna spada
       do ~0,83. Po zaostrzeniu progu gracz przestawałby być „na ziemi” w środku
       sali i zaczynał się zapadać. Zmieniać tylko po ponownym pomiarze normalnej
       w kilku punktach budynku. */
    naZiemi = w.normal.y > 0;
    if (!naZiemi) predkosc.addScaledVector(w.normal, -w.normal.dot(predkosc));
    kapsula.translate(w.normal.multiplyScalar(w.depth));
  }

  return {
    controls,
    zablokowany: () => controls.isLocked,
    naZiemi: () => naZiemi,
    pozycja: () => kapsula.end.clone(),

    /* Skok na wskazane z, na oś amfilady. `patrzNa` (opcjonalne) obraca kamerę
       ku danemu punktowi — używa tego skok do eksponatu z listy, żeby gracz
       lądował przodem do niego, a nie bokiem. */
    teleportuj(z, patrzNa) {
      kapsula.start.set(0, PROMIEN, z);
      kapsula.end.set(0, WZROST, z);
      predkosc.set(0, 0, 0);
      camera.position.copy(kapsula.end);
      /* Domyślna kamera three.js patrzy w -Z, a amfilada biegnie w +Z: bez tego
         obrotu gracz stawałby tyłem do muzeum, twarzą w ścianę atrium. */
      if (patrzNa) camera.lookAt(patrzNa);
      else camera.rotation.set(0, Math.PI, 0);
    },

    update(dt) {
      dt = Math.min(dt, MAX_KROK);       // patrz MAX_KROK: zapas przed przeniknięciem przez ścianę
      const w = wcisniete();
      const d = kierunek(w);
      const tempo = PREDKOSC * (w.ShiftLeft || w.ShiftRight ? BIEG : 1);
      predkosc.x = d.x * tempo;
      predkosc.z = d.z * tempo;
      /* Na ziemi pion nie idzie do zera, tylko do lekkiego docisku w dół.
         Przy dokładnym zerze kapsuła stoi lico w lico z podłogą, więc co druga
         klatka nie ma z nią żadnego przecięcia i `naZiemi` migocze 010101…
         Zmierzone: bujanie kroku, które od `naZiemi` zależy, włączało się wtedy
         co drugą klatkę i kamera skakała o 1,7 cm z częstotliwością 30 Hz.
         Docisk (0,5 m/s, czyli 8 mm na klatkę) utrzymuje stały kontakt, a
         kolizja kasuje go w tej samej klatce — gracz nie opada ani o milimetr. */
      if (naZiemi) predkosc.y = -DOCISK; else predkosc.y -= GRAWITACJA * dt;
      kapsula.translate(krok.copy(predkosc).multiplyScalar(dt));
      kolizja();
      camera.position.copy(kapsula.end);
      // bujanie kroku — wyłączone przy prefers-reduced-motion
      if (!reduceMotion && d.lengthSq() > 0 && naZiemi) {
        camera.position.y += Math.sin(performance.now() * TEMPO_KROKU * tempo) * AMPLITUDA_KROKU;
      }
    },
  };
}
