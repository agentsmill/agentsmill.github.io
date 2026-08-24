/* Rakieta Kosmosu: lot 6DOF na kwaternionie, silniki i kamera podążająca z zewnątrz.
   Model to Saturn V z NASA 3D Resources (domena publiczna) — wpis w LICENSES.md.
   Gdy model nie wstanie, gra dostaje zastępczy stożek; bez rakiety nie zostaje nigdy. */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import * as NarzedziaGeometrii from "three/addons/utils/BufferGeometryUtils.js";
import { vec3, float, uniform, mix, time, positionLocal, mx_noise_float } from "three/tsl";
import { scene, camera, zasob } from "kosmos/render.js";
import { POWLOKI, PROMIEN_PLANETY } from "kosmos/swiat.js";
import { sondy } from "kosmos/cele.js";

/* Obrót podkręcony z 1.8: przy poprzedniej wartości zawrócenie do minietej sondy
   zajmowało blisko dwie sekundy i sterowanie sprawiało wrażenie ciężkiego. */
const TEMPO_OBROTU = 2.6;     // rad/s przy pełnym wychyleniu
const TEMPO_MAX = 900;        // m/s w pustce
const TEMPO_MIN = 90;         // m/s blisko obiektów
const WYGLADZANIE = 4.0;      // im wyżej, tym szybciej rakieta nadąża za zamiarem

/* Kamera wyżej i dalej niż przy sondzie Voyager. Saturn V to smukły ołówek:
   oglądany dokładnie od tyłu pokazuje wyłącznie denko z dyszami, czyli kółko —
   i dokładnie tak wyglądał na pierwszym zrzucie. Podniesienie kamery daje widok
   z góry pod kątem ~21°, w którym widać całą długość rakiety. */
const ODLEGLOSC_KAMERY = 52;
const WYSOKOSC_KAMERY = 20;

/* Punkt celowania kamery: 25 jednostek przed dziobem, nie 60. Przy dalekim celu
   oś patrzenia kładła się niemal równolegle do osi rakiety i znów wychodziło denko. */
const WYPRZEDZENIE_KAMERY = 25;

const DLUGOSC_STATKU = 30;    // jednostki sceny; ramka sondy ma promień 30

/* Start tuż za gwiazdą (promień 420), nie w jej wnętrzu. Powłoka 1 leży na 1200,
   więc 760 to pustka między gwiazdą a pierwszą epoką. */
const START = new THREE.Vector3(0, 60, 760);

/* ────────────────────────────────────────────────────────────────────────────
   Odległość do najbliższego obiektu — planety albo sondy, odwiedzonej czy nie.
   To co innego niż najblizszaNieodwiedzona() z cele.js, która celowo pomija
   odwiedzone, bo służy nawigacji. Funkcja mieszka tutaj, bo cele.js jest
   właścicielem sond, swiat.js planet, a żaden z nich nie jest właścicielem
   pojęcia „najbliższe cokolwiek".

   Zwraca odległość do POWIERZCHNI, nie do środka — inaczej rakieta zwalniałaby
   przy dużej planecie 130 metrów za wcześnie, a przy sondzie 30 metrów za późno.
   ──────────────────────────────────────────────────────────────────────────── */
export function dystansDoNajblizszego(poz) {
  let naj = Infinity;
  for (const p of POWLOKI) {
    if (!p.pozycjaPlanety) continue;
    naj = Math.min(naj, poz.distanceTo(p.pozycjaPlanety) - PROMIEN_PLANETY);
  }
  /* Promień KAŻDEGO świata z osobna, nie stała 30. Od chwili, gdy projekty stały
     się bryłami o promieniach 42..78, stała kazałaby rakiecie zwalniać dopiero
     kilkadziesiąt metrów POD powierzchnią większych z nich. */
  for (const s of sondy) {
    naj = Math.min(naj, poz.distanceTo(s.pozycja) - s.promien);
  }
  return Math.max(naj, 0);
}

/* ────────────────────────────────────────────────────────────────────────────
   Wejście

   UWAGA na błąd, który w poprzedniej grze zabił całą klawiaturę i przeszedł
   niewykryty: NIE scalaj obiektów wejścia rozproszeniem, jeśli którykolwiek
   z nich definiuje te same klucze jako false. Zapis {...klawisze, ...dotyk}
   nadpisał tam prawdziwe wciśnięcia zerami z warstwy dotykowej. Tutaj jeden
   zbiór klawiszy, czytany jawnie, plus mysz, która DODAJE wychylenie.
   ──────────────────────────────────────────────────────────────────────────── */
const klawisze = new Set();
addEventListener("keydown", (e) => klawisze.add(e.code));
addEventListener("keyup", (e) => klawisze.delete(e.code));
addEventListener("blur", () => klawisze.clear());   // alt-tab nie zostawia wciśniętego ciągu

/* DWA tryby myszy i to jest sedno poprawki sterowania.

   Tryb swobodny (domyślny, BEZ klikania): wychylenie bierze się z położenia
   kursora względem środka okna. Działa od pierwszej sekundy, bez odkrywania
   czegokolwiek. Poprzednia wersja ruszała się myszą DOPIERO po kliknięciu
   i przechwyceniu kursora — kto nie kliknął, ten miał do dyspozycji same
   strzałki i słusznie uznał, że sterowanie jest ciężkie.

   Tryb przechwycony (po kliknięciu): klasyczny ruch względny, dla grających
   dłużej. Wychylenie wygasa, więc odłożona mysz znaczy lot prosto.

   MARTWE POLE w środku ekranu: bez niego kursor spoczywający byle gdzie poza
   idealnym środkiem powodowałby nieustanne, powolne dryfowanie kursu. */
const MARTWE_POLE = 0.12;
const CZULOSC_PRZECHWYCONA = 0.0022;
const WYGASANIE_PRZECHWYCONE = 5.0;

const mysz = { x: 0, y: 0, wzgledna: { pochylenie: 0, odchylenie: 0 }, obecna: false };

addEventListener("mousemove", (e) => {
  mysz.obecna = true;
  if (document.pointerLockElement) {
    mysz.wzgledna.odchylenie = THREE.MathUtils.clamp(
      mysz.wzgledna.odchylenie + e.movementX * CZULOSC_PRZECHWYCONA, -1, 1);
    mysz.wzgledna.pochylenie = THREE.MathUtils.clamp(
      mysz.wzgledna.pochylenie + e.movementY * CZULOSC_PRZECHWYCONA, -1, 1);
  } else {
    mysz.x = (e.clientX / innerWidth) * 2 - 1;
    mysz.y = (e.clientY / innerHeight) * 2 - 1;
  }
});
addEventListener("mouseleave", () => { mysz.obecna = false; mysz.x = 0; mysz.y = 0; });

export function wlaczSterowanieMysza(element) {
  element.addEventListener("click", () => {
    if (document.pointerLockElement !== element) element.requestPointerLock?.();
  });
}

/* Martwe pole wycięte i reszta rozciągnięta z powrotem do pełnego zakresu, żeby
   tuż za jego krawędzią sterowanie nie startowało skokiem od razu z dużą wartością. */
function poMartwymPolu(v) {
  const a = Math.abs(v);
  if (a < MARTWE_POLE) return 0;
  return Math.sign(v) * Math.min((a - MARTWE_POLE) / (1 - MARTWE_POLE), 1);
}

function wejscie() {
  const wcisniety = (kod) => (klawisze.has(kod) ? 1 : 0);
  const swobodna = !document.pointerLockElement && mysz.obecna;

  const zMyszyPochylenie = swobodna ? poMartwymPolu(mysz.y) : mysz.wzgledna.pochylenie;
  const zMyszyOdchylenie = swobodna ? poMartwymPolu(mysz.x) : mysz.wzgledna.odchylenie;

  return {
    ciag: wcisniety("KeyW") - wcisniety("KeyS"),
    przechyl: wcisniety("KeyQ") - wcisniety("KeyE"),
    dopalacz: klawisze.has("ShiftLeft") || klawisze.has("ShiftRight"),
    /* Strzałki SUMUJĄ się z myszą i klamrowanie jest jedno, na końcu. Sumowanie
       nie potrafi wyzerować prawdziwego wciśnięcia — nadpisanie potrafiło. */
    pochylenie: THREE.MathUtils.clamp(
      zMyszyPochylenie + wcisniety("ArrowDown") - wcisniety("ArrowUp"), -1, 1),
    odchylenie: THREE.MathUtils.clamp(
      zMyszyOdchylenie + wcisniety("ArrowRight") - wcisniety("ArrowLeft"), -1, 1),
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Model i silniki
   ──────────────────────────────────────────────────────────────────────────── */

function stozekZastepczy() {
  const geo = new THREE.ConeGeometry(DLUGOSC_STATKU * 0.16, DLUGOSC_STATKU, 20);
  geo.rotateX(-Math.PI / 2);            // ConeGeometry celuje w +Y; przód rakiety to -Z
  const stozek = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0xd8dee9, roughness: 0.45, metalness: 0.35,
  }));
  stozek.name = "rakieta-zastepcza";
  return stozek;
}

/* Model z NASA przychodzi w nieznanej skali, nieznanym środku i nieznanej osi.
   Zamiast wpisywać magiczne liczby, MIERZYMY pudełko otaczające: najdłuższa oś
   to oś rakiety, obracamy ją na -Z (przód lotu) i skalujemy do DLUGOSC_STATKU.
   Dzięki temu podmiana modelu na inny plik z tego samego repozytorium nie wymaga
   strojenia niczego — a przy tej pracy model zmienił się już raz, z Voyagera
   na Saturna V, i ta funkcja przyjęła to bez zmian. */
/* Model NASA przychodzi rozbity na dziesiątki siatek — Saturn V ma ich 52, czyli
   52 wywołania rysowania na sam statek. To był największy pojedynczy udziałowiec
   w liczniku (200 przy progu „poniżej 200" z Zadania 8), większy niż wszystkie
   49 światów projektów razem wzięte po zinstancjonowaniu pierścieni.

   Siatki dzielą między sobą garść materiałów, więc scalamy geometrie w grupy po
   materiale. Warunkiem scalenia jest identyczny zestaw atrybutów — geometrie
   bez UV nie połączą się z tymi, które je mają, więc kluczem jest para
   (materiał, zestaw atrybutów). Grupy, których nie da się scalić, zostają
   nietknięte: lepiej kilka wywołań więcej niż zgubiona część rakiety. */
function scalPoMaterialach(model) {
  model.updateMatrixWorld(true);
  const grupy = new Map();

  model.traverse((o) => {
    if (!o.isMesh) return;
    const atrybuty = Object.keys(o.geometry.attributes).sort().join(",");
    const klucz = `${o.material.uuid}|${atrybuty}`;
    if (!grupy.has(klucz)) grupy.set(klucz, { material: o.material, siatki: [] });
    grupy.get(klucz).siatki.push(o);
  });

  const wynik = new THREE.Group();
  let przed = 0, po = 0;

  for (const { material, siatki } of grupy.values()) {
    przed += siatki.length;
    const geometrie = siatki.map((m) => {
      const g = m.geometry.clone();
      g.applyMatrix4(m.matrixWorld);        // scalone geometrie muszą być w jednej przestrzeni
      return g;
    });
    let scalona = null;
    try { scalona = NarzedziaGeometrii.mergeGeometries(geometrie, false); } catch { scalona = null; }

    if (scalona) {
      wynik.add(new THREE.Mesh(scalona, material));
      po += 1;
      geometrie.forEach((g) => g.dispose());
    } else {
      /* Nie dało się scalić — wstawiamy oryginały, żeby nic nie zniknęło. */
      siatki.forEach((m) => { const k = m.clone(); k.matrixAutoUpdate = false; wynik.add(k); });
      po += siatki.length;
      geometrie.forEach((g) => g.dispose());
    }
  }

  wynik.userData.siatekPrzed = przed;
  wynik.userData.siatekPo = po;
  return wynik;
}

function znormalizuj(model) {
  const pudelko = new THREE.Box3().setFromObject(model);
  const rozmiar = pudelko.getSize(new THREE.Vector3());
  const srodek = pudelko.getCenter(new THREE.Vector3());

  const nosnik = new THREE.Group();
  model.position.sub(srodek);           // środek modelu do zera nośnika
  nosnik.add(model);

  const osie = [
    { nazwa: "x", dlugosc: rozmiar.x },
    { nazwa: "y", dlugosc: rozmiar.y },
    { nazwa: "z", dlugosc: rozmiar.z },
  ].sort((a, b) => b.dlugosc - a.dlugosc);
  const os = osie[0];

  /* Saturn V stoi wzdłuż +Y (jak na wyrzutni). Obrót o -90° wokół X kładzie
     go dziobem w -Z. Model wzdłuż X kładziemy obrotem wokół Y. Model już
     wzdłuż Z zostaje. */
  if (os.nazwa === "y") nosnik.rotation.x = -Math.PI / 2;
  else if (os.nazwa === "x") nosnik.rotation.y = Math.PI / 2;

  nosnik.scale.setScalar(DLUGOSC_STATKU / (os.dlugosc || 1));
  nosnik.name = "rakieta-model";
  nosnik.userData.osDluga = os.nazwa;
  nosnik.userData.siatekPrzed = model.userData.siatekPrzed;
  nosnik.userData.siatekPo = model.userData.siatekPo;
  nosnik.userData.dlugoscZrodlowa = os.dlugosc;
  return nosnik;
}

/* Silniki. Właściciel: „nie widzę napędów w swojej rakiecie".

   Płomień to stożek zwrócony do TYŁU (+Z), addytywny i bez zapisu głębi, więc
   zawsze świeci, nigdy nie wycina dziur. Jasność powyżej 1 wchodzi w próg bloomu
   z obraz.js, dzięki czemu dysza rozświetla się sama, bez dokładania światła
   do sceny. Długość i jasność sterowane ciągiem — silnik ma być odczytem
   przepustnicy, a nie stałą ozdobą. */
function zbudujPlomien() {
  const grupa = new THREE.Group();
  grupa.name = "rakieta-silniki";

  const sila = uniform(0);              // 0..1, ustawiane co klatkę z ciągu

  const geo = new THREE.ConeGeometry(DLUGOSC_STATKU * 0.085, DLUGOSC_STATKU * 0.9, 20, 1, true);
  geo.rotateX(Math.PI / 2);             // ostrze stożka w +Z, czyli za rakietę
  geo.translate(0, 0, DLUGOSC_STATKU * 0.5);

  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  /* Migotanie z szumu po czasie: równy płomień wygląda jak plastikowy stożek.
     positionLocal.z rośnie ku końcowi dyszy, więc służy zarówno do wygaszania
     ogona, jak i do przesuwania szumu wzdłuż strugi. */
  const wzdluz = positionLocal.z.div(DLUGOSC_STATKU).clamp(0.0, 1.0);
  const migot = mx_noise_float(vec3(positionLocal.z.mul(0.6), time.mul(9.0), 0.0)).mul(0.5).add(0.75);

  const rdzen = vec3(0.75, 0.88, 1.0);      // biało-błękitny rdzeń
  const ogon  = vec3(1.0, 0.55, 0.2);       // pomarańczowy ogon
  mat.colorNode = mix(rdzen, ogon, wzdluz.pow(0.7)).mul(migot).mul(sila.mul(2.4).add(0.15));
  mat.opacityNode = wzdluz.oneMinus().pow(1.5).mul(sila).mul(0.95);

  const plomien = new THREE.Mesh(geo, mat);
  plomien.name = "rakieta-plomien";
  plomien.frustumCulled = false;
  grupa.add(plomien);

  /* Poświata samej dyszy — mała kula tuż za rakietą. Zostaje widoczna nawet przy
     zerowym ciągu (silnik na biegu jałowym), żeby rakieta nigdy nie wyglądała
     na martwy obiekt dryfujący w próżni. */
  const zarzenie = new THREE.Mesh(
    new THREE.SphereGeometry(DLUGOSC_STATKU * 0.055, 16, 10),
    new THREE.MeshBasicNodeMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  zarzenie.material.colorNode = mix(vec3(0.5, 0.65, 0.95), vec3(1.0, 0.8, 0.5), sila).mul(sila.mul(2.0).add(0.35));
  zarzenie.material.opacityNode = sila.mul(0.5).add(0.12);
  zarzenie.position.z = DLUGOSC_STATKU * 0.5;
  zarzenie.name = "rakieta-dysza";
  grupa.add(zarzenie);

  return { grupa, ustawSile: (v) => { sila.value = v; } };
}

export function zbudujRakiete() {
  const obiekt = new THREE.Group();
  obiekt.name = "rakieta";

  /* Zastępczy stożek wchodzi OD RAZU, a nie dopiero w obsłudze błędu — inaczej
     gra przez cały czas wczytywania modelu byłaby bez rakiety. */
  const stozek = stozekZastepczy();
  obiekt.add(stozek);

  const silniki = zbudujPlomien();
  obiekt.add(silniki.grupa);

  /* Reflektor statku. Jedyne światło w scenie to gwiazda w środku układu, więc
     lecąc na zewnątrz rakieta ma je ZA sobą i od strony kamery jest czarną
     sylwetką — na zrzucie wyglądała jak ciemna drzazga. Światło jest dzieckiem
     rakiety, więc leci razem z nią i oświetla ją tak samo w każdym miejscu
     układu. Mały zasięg, żeby nie rozjaśniało planet ani sond. */
  const reflektor = new THREE.PointLight(0xdce8ff, 3.2, DLUGOSC_STATKU * 6, 1.6);
  reflektor.position.set(DLUGOSC_STATKU * 0.5, DLUGOSC_STATKU * 0.45, DLUGOSC_STATKU * 0.35);
  reflektor.name = "rakieta-reflektor";
  obiekt.add(reflektor);

  const wypelnienie = new THREE.PointLight(0x6f86b0, 1.5, DLUGOSC_STATKU * 5, 1.6);
  wypelnienie.position.set(-DLUGOSC_STATKU * 0.5, -DLUGOSC_STATKU * 0.3, DLUGOSC_STATKU * 0.2);
  wypelnienie.name = "rakieta-wypelnienie";
  obiekt.add(wypelnienie);

  /* Modele NASA są skompresowane Draco — sam GLTFLoader odbija się od nich
     komunikatem „No DRACOLoader instance provided". Dekoder z tego samego CDN
     co three.js, więc nadal zero kroku budowania i nic nie dochodzi do assets/. */
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/gltf/");

  new GLTFLoader().setDRACOLoader(draco).load(
    zasob("assets/kosmos/rakieta.glb"),
    (gltf) => {
      obiekt.remove(stozek);
      stozek.geometry.dispose();
      stozek.material.dispose();
      obiekt.add(znormalizuj(scalPoMaterialach(gltf.scene)));
      draco.dispose();   // jeden model na całą grę
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

  /* Start zwrócony na zewnątrz, od gwiazdy ku powłokom. */
  obrot.setFromAxisAngle(OS_Y, Math.PI);
  kierunek.set(0, 0, -1).applyQuaternion(obrot);

  function ustawKamere(dt) {
    za.set(0, WYSOKOSC_KAMERY, ODLEGLOSC_KAMERY).applyQuaternion(obrot).add(pozycja);
    camera.position.lerp(za, Math.min(1, 3.5 * dt));

    /* Kamera dziedziczy PION Z RAKIETY, nie ze świata. camera.lookAt() liczy bazę
       z camera.up, a domyślne (0,1,0) degeneruje się przy locie prosto w górę —
       kadr zaczyna wirować i przechyłu w ogóle nie widać. */
    gora.set(0, 1, 0).applyQuaternion(obrot);
    camera.up.copy(gora);

    cel.copy(pozycja).addScaledVector(kierunek, WYPRZEDZENIE_KAMERY);
    camera.lookAt(cel);
  }

  function aktualizuj(dt) {
    const we = wejscie();

    chwilowy.setFromAxisAngle(OS_X, -we.pochylenie * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    chwilowy.setFromAxisAngle(OS_Y, -we.odchylenie * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    chwilowy.setFromAxisAngle(OS_Z, we.przechyl * TEMPO_OBROTU * dt);
    obrot.multiply(chwilowy);
    obrot.normalize();          // bez tego kwaternion dryfuje i skaluje scenę

    // Wychylenie trybu przechwyconego wygasa; tryb swobodny czyta pozycję kursora wprost.
    if (document.pointerLockElement) {
      const zanik = Math.min(1, WYGASANIE_PRZECHWYCONE * dt);
      mysz.wzgledna.pochylenie -= mysz.wzgledna.pochylenie * zanik;
      mysz.wzgledna.odchylenie -= mysz.wzgledna.odchylenie * zanik;
    }

    /* Prędkość skalowana odległością do najbliższego obiektu: wolno przy sondach
       i planetach, szybko w pustce. Bez tego przelot z powłoki 1 na 6 (7800 metrów)
       byłby karą, a nie podróżą. */
    const blisko = dystansDoNajblizszego(pozycja);
    const docelowe = we.dopalacz ? TEMPO_MAX : THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(blisko, 120, 1500, TEMPO_MIN, TEMPO_MAX),
      TEMPO_MIN, TEMPO_MAX
    );
    tempo += (docelowe * we.ciag - tempo) * Math.min(1, WYGLADZANIE * dt);

    kierunek.set(0, 0, -1).applyQuaternion(obrot);
    pozycja.addScaledVector(kierunek, tempo * dt);

    /* Silniki czytają ZAMIAR (wciśnięty ciąg), nie samą prędkość: przy hamowaniu
       i przy locie z rozpędu bez ciągu dysza ma gasnąć, choć rakieta wciąż leci. */
    const przepustnica = Math.max(0, we.ciag) * (we.dopalacz ? 1 : 0.62);
    silniki.ustawSile(przepustnica);

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
    /* Tempo 0..1 dla warstwy obrazu. Liczone TUTAJ, żeby TEMPO_MAX zostało
       prywatne — gdyby obraz.js dzielił przez własną kopię tej stałej, smugi
       nasycałyby się przy innej prędkości, niż rakieta faktycznie osiąga. */
    tempoWzgledne: () => Math.min(Math.abs(tempo) / TEMPO_MAX, 1),
    /* Na potrzeby testu blokady osi: pozwala wymusić orientację bez udawania
       dwóch sekund ruchu myszą. Sterowania tym NIE testujemy. */
    ustawOrientacje: (q) => { obrot.copy(q).normalize(); kierunek.set(0, 0, -1).applyQuaternion(obrot); },
  };
}
