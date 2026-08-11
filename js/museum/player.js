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
import { camera, renderer, reduceMotion } from "muzeum/render.js";

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

// Martwa strefa joysticka — poniżej tego wychylenia kciuk nie liczy się jako naciśnięty kierunek.
const MARTWA_STREFA = 0.15;

/* ── Stałe trybu „Oprowadź mnie” — kamera jedzie środkiem amfilady i
   zatrzymuje się w środku każdej sali. */
const PROG_DOJAZDU = 0.3;    // [m] — bliżej celu niż to uznajemy dojazd za zakończony
const POSTOJ_TURY = 2.5;     // [s] — ile stoi w środku sali, zanim ruszy dalej
const TEMPO_TURY = 3.5 * (reduceMotion ? 0.6 : 1);   // [m/s] jazdy; zwolniona 40% przy prefers-reduced-motion

/* Górny limit kroku całkowania. Przy 0,05 s i biegu (9,9 m/s) kapsuła przesuwa
   się o 0,49 m na klatkę, a żeby przeskoczyć ścianę o grubości 0,4 m musiałaby
   pokonać ponad 1,1 m (0,4 grubości + dwa promienie kapsuły) — zapas jest
   dwukrotny. Dłuższa klatka (przełączona karta, zapchany wątek) zjadłaby ten
   margines i gracz wyszedłby przez ścianę, dlatego limit pilnujemy tutaj, a nie
   tylko po stronie pętli w main.js. */
const MAX_KROK = 0.05;

/* ── Dotyk: joystick i rozglądanie ────────────────────────────────────────
   Telefon nie ma PointerLockControls, więc to jedyna droga ruchu: lewa połowa
   ekranu to analogowy joystick (naRuch(dx, dy) karmi wcisniete() niżej),
   prawa obraca kamerę jak przeciągnięcie myszą przy zablokowanym kursorze.
   Każdy gest śledzi WŁASNY identifier dotyku, więc działają jednocześnie.

   Nasłuch wisi na całym oknie, więc naUi() jest konieczne: bez niego
   przewijanie listy eksponatów albo dotknięcie tabliczki/nagłówka HUD
   kręciłoby kamerą albo pchało joystick zamiast obsłużyć się samo. */
function joystick(naRuch) {
  const host = document.createElement("div");
  host.className = "joy"; host.hidden = true;
  host.innerHTML = '<span class="joy-kciuk"></span>';
  document.body.appendChild(host);
  const kciuk = host.querySelector(".joy-kciuk");
  let id = null, sx = 0, sy = 0;
  let idRozgladania = null, ostatniX = 0;

  const naUi = (t) => !!t.target.closest?.(".plaque, .list-panel, .hud-top");

  addEventListener("touchstart", (e) => {
    // Samoleczenie: gdyby touchend/touchcancel i tak zaginęło, nowy dotyk się nie blokuje.
    const zywy = (i) => i === null || [...e.touches].some((x) => x.identifier === i);
    if (!zywy(id)) id = null;
    if (!zywy(idRozgladania)) idRozgladania = null;
    for (const t of e.changedTouches) {
      if (naUi(t)) continue;
      host.hidden = false;                       // pokaż dopiero przy pierwszym dotyku
      if (t.clientX <= innerWidth / 2) {
        if (id !== null) continue;
        id = t.identifier; sx = t.clientX; sy = t.clientY;
        host.style.left = `${sx}px`; host.style.top = `${sy}px`;
        host.classList.add("aktywny");
      } else if (idRozgladania === null) {
        idRozgladania = t.identifier; ostatniX = t.clientX;
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
        camera.rotation.y -= (t.clientX - ostatniX) * 0.004;
        ostatniX = t.clientX;
      }
    }
  }, { passive: true });

  // touchend i touchcancel zwalniają identycznie — iOS wysyła cancel zamiast end,
  // gdy dotyk przechodzi w gest systemowy (np. „wstecz” od lewej krawędzi, czyli
  // dokładnie tam, gdzie mieszka joystick); bez tego `id` blokował się na zawsze.
  const pusc = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) {
        id = null; kciuk.style.transform = ""; host.classList.remove("aktywny");
        naRuch(0, 0);
      } else if (t.identifier === idRozgladania) {
        idRozgladania = null;
      }
    }
  };
  addEventListener("touchend", pusc, { passive: true });
  addEventListener("touchcancel", pusc, { passive: true });
}

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
  let joyX = 0, joyY = 0;    // wychylenie joysticka: X = bok, Y = przód (dodatnie = do przodu)
  let tura = null;           // stan trybu „Oprowadź mnie” — patrz oprowadz()/updateTura()

  addEventListener("keydown", (e) => { klawisze[e.code] = true; });
  addEventListener("keyup", (e) => { klawisze[e.code] = false; });
  joystick((dx, dy) => { joyX = dx; joyY = dy; });

  /* Klawisze i dotyk, które w tej klatce mają prawo ruszyć graczem.

     Klawiatura rusza tylko po blokadzie kursora; dotyk (`dotyk` niżej) NIE
     jest tak bramkowany — telefon nie zna blokady, a joystick i tak pokazuje
     się tylko na urządzeniach dotykowych (media query w museum.css).
     Wychylenie poniżej MARTWA_STREFA liczy się jako brak kierunku.

     KRYTYCZNE: `dotyk` wpisuje TYLKO aktywne (`true`) klucze, nigdy `false` —
     scalenie niżej jest sumą źródeł, nie nadpisaniem. Wersja, która wpisywała
     tu też `false`, zerowała realne WASD w tym samym spreadzie i klawiatura
     nie działała NIGDY na desktopie; strzałki przeżyły tylko dlatego, że
     `dotyk` ich nie definiowało.

     `__mz.testRuch` omija resztę bramki — wymaga symulacji, bo blokada
     potrzebuje prawdziwego gestu użytkownika. */
  function wcisniete() {
    const dotyk = {};
    if (joyY > MARTWA_STREFA) dotyk.KeyW = true;
    if (joyY < -MARTWA_STREFA) dotyk.KeyS = true;
    if (joyX > MARTWA_STREFA) dotyk.KeyD = true;
    if (joyX < -MARTWA_STREFA) dotyk.KeyA = true;
    return { ...(controls.isLocked ? klawisze : null), ...dotyk, ...window.__mz?.testRuch };
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

  /* Krok trybu „Oprowadź mnie”: jazda środkiem amfilady do środka kolejnej
     sali, POSTOJ_TURY sekund postoju, dalej. Celowo bez kolizja()/grawitacji —
     jazda na szynach, nie fizyka. Zwraca true, dopóki tura trwa — update(dt)
     wtedy pomija resztę swojej logiki. */
  function updateTura(dt) {
    if (!tura) return false;
    const cel = tura.sale[tura.i];
    if (!cel) { tura = null; return false; }        // ostatnia sala minęła postój — koniec trasy
    if (tura.faza === "jazda") {
      const dz = cel.srodekZ - kapsula.end.z;
      if (Math.abs(dz) < PROG_DOJAZDU) { tura.faza = "postoj"; tura.czas = 0; }
      else kapsula.translate(new THREE.Vector3(0, 0, Math.sign(dz) * Math.min(TEMPO_TURY * dt, Math.abs(dz))));
    } else {
      tura.czas += dt;
      if (tura.czas > POSTOJ_TURY) { tura.i++; tura.faza = "jazda"; }
    }
    camera.position.copy(kapsula.end);
    return true;
  }

  return {
    controls,
    zablokowany: () => controls.isLocked,
    naZiemi: () => naZiemi,
    pozycja: () => kapsula.end.clone(),
    /* Samo z — bez alokacji. `pozycja()` klonuje Vector3, a wskaźnik sali
       w main.js potrzebuje z pozycji gracza w KAŻDEJ klatce; klon na śmietnik
       60 razy na sekundę to jedyny koszt, jaki ten odczyt miał. */
    pozycjaZ: () => kapsula.end.z,
    wTurze: () => !!tura,   // main.js zmienia etykietę przycisku, patrz oprowadz()

    /* Wejście w tryb chodzenia i wyjście z niego. Ten moduł CELOWO nie nasłuchuje
       już kliknięć na płótnie: o tym, czy dany klik ma zabrać myszkę, decyduje
       main.js, bo tylko on wie, czy klik trafił w eksponat i czy jest otwarta
       tabliczka. Gdy nasłuchy były dwa (tutaj `click`, tam `pointerup`),
       koordynowała je wyłącznie kolejność zdarzeń w przeglądarce i jedno
       kliknięcie w eksponat naraz otwierało tabliczkę i chowało kursor. */
    zablokuj() {
      if (controls.isLocked) return;
      /* Prosimy o blokadę wprost, zamiast przez controls.lock(). To ta sama
         operacja (`domElement.requestPointerLock()`), ale mamy dostęp do
         zwracanej obietnicy: Chrome odrzuca ją, gdy klik trafi w ~1,3 s karencji
         po wyjściu Esc, a nieprzechwycone odrzucenie wylądowałoby w window.__errs
         i zaśmiecało weryfikację. Stan blokady i tak śledzą `controls` — przez
         zdarzenie pointerlockchange, niezależnie od tego, kto o nią poprosił.
         Starsze przeglądarki nie zwracają obietnicy, stąd `?.catch?.()`.

         `requestPointerLock?.()` — bo są przeglądarki bez Pointer Lock API
         w ogóle (WebKit na iOS): tam ta metoda nie istnieje i gołe wywołanie
         rzuciłoby TypeError. Brak blokady na telefonie niczego nie psuje —
         ruch idzie joystickiem, który blokady nie potrzebuje. */
      renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
    },

    /* Świadomie NIE wołamy `controls.unlock()`. W three.js r169 to gołe
       `this.domElement.ownerDocument.exitPointerLock()` — bez `?.` i bez
       try/catch, a zmienić tego nie możemy, bo to kod biblioteki. WebKit na
       iOS nie udostępnia Pointer Lock API, więc `exitPointerLock` jest tam
       `undefined` i wywołanie rzuca TypeError w środku otwierania tabliczki.
       Tu robimy dokładnie tę samą operację, tylko zabezpieczoną. Stan blokady
       śledzi i tak `controls` — przez zdarzenie pointerlockchange, niezależnie
       od tego, kto o zdjęcie blokady poprosił. */
    odblokuj() {
      renderer.domElement.ownerDocument.exitPointerLock?.();
    },

    /* Skok na wskazane z, na oś amfilady. `patrzNa` (opcjonalne) obraca kamerę
       ku danemu punktowi — używa tego skok do eksponatu z listy, żeby gracz
       lądował przodem do niego, a nie bokiem. */
    teleportuj(z, patrzNa) {
      tura = null;   // skok kamery z innego powodu niż tura — np. klik w eksponat z listy — ma nad nią wygrywać
      kapsula.start.set(0, PROMIEN, z);
      kapsula.end.set(0, WZROST, z);
      predkosc.set(0, 0, 0);
      camera.position.copy(kapsula.end);
      /* Domyślna kamera three.js patrzy w -Z, a amfilada biegnie w +Z: bez tego
         obrotu gracz stawałby tyłem do muzeum, twarzą w ścianę atrium. */
      if (patrzNa) camera.lookAt(patrzNa);
      else camera.rotation.set(0, Math.PI, 0);
    },

    /* Autopilot: `sale` to budynek.sale z building.js. Patrz prosto w głąb,
       zanim ruszy. Nigdy nie cofa: jedzie tylko przez sale, których środek
       jest PRZED graczem (albo dokładnie tam, gdzie stoi) — kto już przeszedł
       kawałek pieszo, ma jechać dalej, nie tyłem przez zwiedzone sale. Za
       środkiem ostatniej sali nie ma dokąd jechać — tura się nie uruchamia.
       Przerwanie: czynny ruch (update()) albo ponowny klik (przerwijTure()).

       Zwraca true/false — czy tura faktycznie ruszyła. Gość za środkiem
       ostatniej sali dostaje false: main.js wtedy pokazuje komunikat w
       #hud-perf, bo inaczej klik nie daje żadnego widocznego skutku. */
    oprowadz(sale) {
      const przedGraczem = sale.filter((s) => s.srodekZ >= kapsula.end.z);
      if (!przedGraczem.length) return false;
      camera.rotation.set(0, Math.PI, 0);
      tura = { i: 0, faza: "jazda", czas: 0, sale: przedGraczem };
      return true;
    },
    przerwijTure() { tura = null; },

    update(dt) {
      dt = Math.min(dt, MAX_KROK);       // patrz MAX_KROK: zapas przed przeniknięciem przez ścianę
      const w = wcisniete();
      const d = kierunek(w);
      /* Dowolny czynny ruch (klawisz albo joystick, oba przez `d`) przerywa
         turę. Rozglądanie się NIE przeszkadza z premedytacją — ma działać
         jak patrzenie przez okno jadącego pociągu, nie wysiadanie z niego. */
      const ruszaSie = d.lengthSq() > 0;
      if (ruszaSie) tura = null;
      if (updateTura(dt)) return;
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
      if (!reduceMotion && ruszaSie && naZiemi) {
        camera.position.y += Math.sin(performance.now() * TEMPO_KROKU * tempo) * AMPLITUDA_KROKU;
      }
    },
  };
}
