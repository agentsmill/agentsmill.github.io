/* Rakieta Kosmosu: lot 6DOF na kwaternionie i kamera podążająca z zewnątrz.
   Model statku to sonda Voyager z NASA 3D Resources (domena publiczna) — wpis
   w assets/kosmos/LICENSES.md. Gdy model nie wstanie, gra dostaje zastępczy stożek;
   bez rakiety nie zostaje nigdy. */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { scene, camera } from "kosmos/render.js";
import { POWLOKI, PROMIEN_PLANETY } from "kosmos/swiat.js";
import { sondy } from "kosmos/cele.js";

const TEMPO_OBROTU = 1.8;     // rad/s przy pełnym wychyleniu
const TEMPO_MAX = 900;        // m/s w pustce
const TEMPO_MIN = 90;         // m/s blisko obiektów
const WYGLADZANIE = 4.0;      // im wyżej, tym szybciej rakieta nadąża za zamiarem

const ODLEGLOSC_KAMERY = 34;
const WYSOKOSC_KAMERY = 11;

const DLUGOSC_STATKU = 16;    // jednostki sceny; ramka sondy ma promień 30

/* Start tuż za gwiazdą (promień 420), nie w jej wnętrzu. Kamera z render.js stoi
   domyślnie 263 jednostki od środka, czyli WEWNĄTRZ gwiazdy — gdyby rakieta startowała
   w tym samym miejscu, pierwszy kadr byłby wnętrzem kuli z wyciętymi ścianami.
   Powłoka 1 leży na 1200, więc 760 to pustka między gwiazdą a pierwszą epoką. */
const START = new THREE.Vector3(0, 60, 760);

/* ────────────────────────────────────────────────────────────────────────────
   Odległość do najbliższego obiektu — planety albo sondy, odwiedzonej czy nie.
   To co innego niż najblizszaNieodwiedzona() z cele.js, która celowo pomija
   odwiedzone, bo służy nawigacji. Funkcja mieszka tutaj, bo cele.js jest
   właścicielem sond, swiat.js planet, a żaden z nich nie jest właścicielem
   pojęcia „najbliższe cokolwiek".

   PROMIEN_PLANETY przychodzi z swiat.js, nie jest tu przepisany. Dwie kopie tej
   samej liczby rozjeżdżają się przy pierwszym strojeniu i wtedy rakieta zwalnia
   w innym miejscu, niż kończy się planeta.

   Zwraca odległość do POWIERZCHNI, nie do środka — inaczej rakieta zwalniałaby
   przy dużej planecie 130 metrów za wcześnie, a przy sondzie 30 metrów za późno.
   ──────────────────────────────────────────────────────────────────────────── */
export function dystansDoNajblizszego(poz) {
  let naj = Infinity;
  for (const p of POWLOKI) {
    if (!p.pozycjaPlanety) continue;
    naj = Math.min(naj, poz.distanceTo(p.pozycjaPlanety) - PROMIEN_PLANETY);
  }
  for (const s of sondy) {
    naj = Math.min(naj, poz.distanceTo(s.pozycja) - 30);
  }
  return Math.max(naj, 0);
}

/* ────────────────────────────────────────────────────────────────────────────
   Wejście. UWAGA na błąd, który w poprzedniej grze zabił całą klawiaturę i przeszedł
   niewykryty: NIE scalaj obiektów wejścia rozproszeniem, jeśli którykolwiek z nich
   definiuje te same klucze jako false. Zapis {...klawisze, ...dotyk} nadpisał tam
   prawdziwe wciśnięcia zerami z warstwy dotykowej, a test przez kanał diagnostyczny
   tego nie zobaczył, bo hak siedział PO warstwie dotykowej w kolejności rozproszenia.

   Tutaj jeden zbiór wciśniętych klawiszy, czytany jawnie, plus myszka, która
   DODAJE wychylenie zamiast je nadpisywać. Sumowanie z klamrowaniem nie potrafi
   wyzerować prawdziwego wciśnięcia — nadpisanie potrafiło.
   ──────────────────────────────────────────────────────────────────────────── */
const klawisze = new Set();
addEventListener("keydown", (e) => klawisze.add(e.code));
addEventListener("keyup", (e) => klawisze.delete(e.code));
/* Utrata ostrości okna nie zwalnia klawiszy — bez tego alt-tab przy wciśniętym W
   zostawia ciąg włączony na zawsze. */
addEventListener("blur", () => klawisze.clear());

/* Myszka steruje pochyleniem i odchyleniem po zablokowaniu kursora. Wychylenie
   wygasa samo, więc odłożona myszka oznacza lot prosto. */
const mysz = { pochylenie: 0, odchylenie: 0 };
const CZULOSC_MYSZY = 0.0016;
const WYGASANIE_MYSZY = 6.0;

addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === null) return;
  mysz.odchylenie = THREE.MathUtils.clamp(mysz.odchylenie + e.movementX * CZULOSC_MYSZY, -1, 1);
  mysz.pochylenie = THREE.MathUtils.clamp(mysz.pochylenie + e.movementY * CZULOSC_MYSZY, -1, 1);
});

export function wlaczSterowanieMysza(element) {
  element.addEventListener("click", () => {
    if (document.pointerLockElement !== element) element.requestPointerLock?.();
  });
}

/* Strzałki robią to samo co myszka — gra jest przechodnia bez blokady kursora,
   a testy nie muszą udawać ruchu myszy. Wartości SUMUJĄ się z myszą i są
   klamrowane raz, na końcu, w jednym miejscu. */
function wejscie() {
  const wcisniety = (kod) => (klawisze.has(kod) ? 1 : 0);
  return {
    ciag: wcisniety("KeyW") - wcisniety("KeyS"),
    przechyl: wcisniety("KeyQ") - wcisniety("KeyE"),
    dopalacz: klawisze.has("ShiftLeft") || klawisze.has("ShiftRight"),
    pochylenie: THREE.MathUtils.clamp(
      mysz.pochylenie + wcisniety("ArrowDown") - wcisniety("ArrowUp"), -1, 1),
    odchylenie: THREE.MathUtils.clamp(
      mysz.odchylenie + wcisniety("ArrowRight") - wcisniety("ArrowLeft"), -1, 1),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Budowa rakiety
   ──────────────────────────────────────────────────────────────────────────── */

function stozekZastepczy() {
  const geo = new THREE.ConeGeometry(DLUGOSC_STATKU * 0.28, DLUGOSC_STATKU, 16);
  /* Stożek z ConeGeometry celuje w +Y; obracamy go, żeby celował w -Z, czyli tam,
     gdzie leci rakieta. */
  geo.rotateX(-Math.PI / 2);
  const stozek = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x5cc8db, emissive: 0x184a55, roughness: 0.4, metalness: 0.3,
  }));
  stozek.name = "rakieta-zastepcza";
  return stozek;
}

/* Model z NASA przychodzi w nieznanej skali i nieznanym środku. Zamiast wpisywać
   magiczne liczby, mierzymy pudełko otaczające i normalizujemy: środek do zera,
   największy wymiar do DLUGOSC_STATKU. Dzięki temu podmiana modelu na inny plik
   z tego samego repozytorium nie wymaga strojenia niczego. */
function znormalizuj(model) {
  const pudelko = new THREE.Box3().setFromObject(model);
  const rozmiar = pudelko.getSize(new THREE.Vector3());
  const srodek = pudelko.getCenter(new THREE.Vector3());
  const najwiekszy = Math.max(rozmiar.x, rozmiar.y, rozmiar.z) || 1;
  const skala = DLUGOSC_STATKU / najwiekszy;
  model.position.sub(srodek).multiplyScalar(skala);
  model.scale.setScalar(skala);
  return model;
}

export function zbudujRakiete() {
  const obiekt = new THREE.Group();
  obiekt.name = "rakieta";

  /* Zastępczy stożek wchodzi OD RAZU, a nie dopiero w obsłudze błędu. Gdyby
     wchodził w onError, gra przez cały czas wczytywania modelu (i przy każdym
     powolnym łączu) byłaby bez rakiety. Model, gdy dojdzie, zastępuje stożek. */
  const stozek = stozekZastepczy();
  obiekt.add(stozek);

  /* Modele z repozytorium NASA są skompresowane Draco — sam GLTFLoader odbija się
     od nich komunikatem „No DRACOLoader instance provided" i gra zostaje na stożku.
     Dekoder idzie z tego samego CDN co three.js, więc nadal zero kroku budowania
     i zero npm; do assets/ nie dokładamy 250 kB, które i tak liczyłyby się do budżetu. */
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/gltf/");

  new GLTFLoader().setDRACOLoader(draco).load(
    "assets/kosmos/rakieta.glb",
    (gltf) => {
      obiekt.remove(stozek);
      stozek.geometry.dispose();
      stozek.material.dispose();
      const model = znormalizuj(gltf.scene);
      model.name = "rakieta-model";
      obiekt.add(model);
      draco.dispose();   // jeden model na całą grę — wątki dekodera nie mają po co żyć dalej
    },
    undefined,
    (e) => window.__bledy.push("brak modelu rakiety: " + (e?.message ?? e))
  );

  scene.add(obiekt);

  const pozycja = START.clone();
  const kierunek = new THREE.Vector3(0, 0, -1);
  const obrot = new THREE.Quaternion();
  const chwilowy = new THREE.Quaternion();
  const OS_X = new THREE.Vector3(1, 0, 0);
  const OS_Y = new THREE.Vector3(0, 1, 0);
  const OS_Z = new THREE.Vector3(0, 0, 1);
  const gora = new THREE.Vector3();
  const za = new THREE.Vector3();
  const cel = new THREE.Vector3();
  let tempo = 0;

  /* Start zwrócony na zewnątrz, od gwiazdy ku powłokom — obrót o 180° wokół osi Y
     zamienia domyślne -Z na +Z, czyli na kierunek od środka układu. */
  obrot.setFromAxisAngle(OS_Y, Math.PI);
  kierunek.set(0, 0, -1).applyQuaternion(obrot);

  function ustawKamere(dt) {
    za.set(0, WYSOKOSC_KAMERY, ODLEGLOSC_KAMERY).applyQuaternion(obrot).add(pozycja);
    camera.position.lerp(za, Math.min(1, 3.5 * dt));

    /* Kamera dziedziczy PION Z RAKIETY, nie ze świata. camera.lookAt() liczy bazę
       z camera.up, a domyślne (0,1,0) degeneruje się przy locie prosto w górę —
       kadr zaczyna wirować i przechył w ogóle nie widać. Kwaternion lotu byłby
       wtedy poprawny, a gra wyglądałaby na zablokowaną na osi, czyli dokładnie
       tak, jak usterka, której to zadanie ma zapobiec. */
    gora.set(0, 1, 0).applyQuaternion(obrot);
    camera.up.copy(gora);

    cel.copy(pozycja).addScaledVector(kierunek, 60);
    camera.lookAt(cel);
  }

  function aktualizuj(dt) {
    const we = wejscie();

    // Obrót: pochylenie i odchylenie z myszy albo strzałek, Q/E przechył wokół osi lotu.
    chwilowy.setFromAxisAngle(OS_X, -we.pochylenie * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    chwilowy.setFromAxisAngle(OS_Y, -we.odchylenie * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    chwilowy.setFromAxisAngle(OS_Z, we.przechyl * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    obrot.normalize();          // bez tego kwaternion dryfuje i skaluje scenę

    // Wychylenie myszy wygasa, żeby odłożona myszka znaczyła lot prosto.
    const zanik = Math.min(1, WYGASANIE_MYSZY * dt);
    mysz.pochylenie -= mysz.pochylenie * zanik;
    mysz.odchylenie -= mysz.odchylenie * zanik;

    /* Prędkość skalowana odległością do najbliższego obiektu: wolno przy sondach
       i planetach, szybko w pustce. Bez tego przelot z powłoki 1 na 6 (7800 metrów)
       trwałby ponad minutę i byłby karą, a nie podróżą. */
    const blisko = dystansDoNajblizszego(pozycja);
    const docelowe = we.dopalacz ? TEMPO_MAX : THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(blisko, 120, 1500, TEMPO_MIN, TEMPO_MAX),
      TEMPO_MIN, TEMPO_MAX
    );
    tempo += (docelowe * we.ciag - tempo) * Math.min(1, WYGLADZANIE * dt);

    kierunek.set(0, 0, -1).applyQuaternion(obrot);
    pozycja.addScaledVector(kierunek, tempo * dt);

    obiekt.position.copy(pozycja);
    obiekt.quaternion.copy(obrot);

    ustawKamere(dt);
  }

  // Pierwsze ustawienie kamery bez wygładzania, żeby kadr startowy był od razu za rakietą.
  obiekt.position.copy(pozycja);
  obiekt.quaternion.copy(obrot);
  ustawKamere(1);
  camera.position.copy(za);

  return {
    obiekt,
    aktualizuj,
    pozycja: () => pozycja,
    predkosc: () => tempo,
    /* Na potrzeby testu blokady osi z planu: pozwala wymusić orientację bez
       udawania dwóch sekund ruchu myszą. Sterowania tym NIE testujemy. */
    ustawOrientacje: (q) => { obrot.copy(q).normalize(); kierunek.set(0, 0, -1).applyQuaternion(obrot); },
  };
}
