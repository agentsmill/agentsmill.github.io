/* Budynek muzeum: atrium i amfilada sześciu sal.

   Jedyna odpowiedzialność tego modułu to geometria budynku i jego oświetlenie.
   Eksponaty rozstawia world.js, graczem zajmuje się main.js — tu nie ma ani
   jednego, ani drugiego.

   Geometria dzieli się na dwie warstwy: widoczną (ściany z teksturą, stropy,
   portale, napisy epok) i kolizyjną (gołe bryły bez materiału, trzymane poza
   sceną). Octree Zadania 5 buduje się WYŁĄCZNIE z warstwy kolizyjnej: gdyby
   wciągnąć do niej całą scenę, gracz zaklinowałby się na hologramie albo na
   tabliczce z podpisem. */

import * as THREE from "three";
import { scene, M, bx, textSprite } from "./render.js";
import { loadPBR } from "./textures.js";

/* ── Wymiary ──────────────────────────────────────────────────────────────
   Wszystkie w metrach świata. Współdzielone z world.js (pozycje eksponatów)
   i z Zadaniem 5 (wysokość oczu, promień kolizji gracza). */

export const SZER_SALI = 14, WYS_SALI = 5, SZER_PORTALU = 3, WYS_PORTALU = 2.8;
export const SZER_ATRIUM = 16, WYS_ATRIUM = 9;

const GRUB = 0.4;          // grubość ścian, stropów i nadproży
const KAFEL = 4;           // metry świata na jeden kafel tekstury
const SWIETLIK = 6;        // bok kwadratowej dziury w stropie atrium
const ODSTEP_REFLEKTOROW = 16;   // co ile metrów sali stawiać reflektor
const MAX_REFLEKTOROW = 3;       // dłuższa sala i tak ginie we mgle (10–60 m)

/* Twardy limit, nie kwestia gustu: fragment shader ma 16 jednostek tekstur.
   Pięć zjada sam materiał PBR (kolor, normalna, AO, roughness, metalness),
   szóstą mapa środowiskowa — na mapy cieni zostaje ledwie dziesięć. Powyżej
   tego materiał NIE kompiluje się wcale („texture image units count exceeds
   MAX_TEXTURE_IMAGE_UNITS”) i gasną wszystkie ściany naraz. Dlatego cień
   rzuca jeden reflektor na salę plus świetlik atrium (razem siedem) — reszta
   reflektorów świeci bez cienia, co nic nie kosztuje w jednostkach tekstur. */
const MAX_MAP_CIENI = 8;
let mapCieni = 0;

function zCieniem(swiatlo) {
  if (mapCieni >= MAX_MAP_CIENI) return swiatlo;
  swiatlo.castShadow = true;
  swiatlo.shadow.mapSize.set(1024, 1024);   // wyżej nie — mapy cieni to też pamięć
  swiatlo.shadow.bias = -0.0005;            // bez tego cienie „pasiakują" na płaskich ścianach
  mapCieni++;
  return swiatlo;
}

/* ── Kafle i bryły ────────────────────────────────────────────────────────
   Kafle mają wychodzić kwadratowe na każdej powierzchni, a powierzchnie mają
   tu kilkanaście różnych proporcji (ściana 5 × 68 m, strop 14 × 20 m, podłoga
   16 × 16 m). Każde inne powtórzenie w loadPBR to osobny wpis pamięci
   podręcznej, czyli kolejne trzy tekstury 1024² w pamięci karty — przy tylu
   wariantach szłoby to w setki megabajtów. Dlatego materiał jest JEDEN na
   zestaw (powtórzenie 1×1), a gęstość kafli niesie geometria: skalujemy jej
   współrzędne UV. Materiał z cache pozostaje nietknięty. */

function skalujUV(geo, skalaU, skalaV) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * skalaU, uv.getY(i) * skalaV);
  // aoMap czyta drugi zestaw UV (uv1) — bez tej linii mapa AO jest po cichu
  // ignorowana, bez błędu i bez ostrzeżenia.
  geo.setAttribute("uv1", uv);
  return geo;
}

/* Bryła budynku: sześcian z kwadratowymi kaflami na każdej ścianie, rzucający
   i przyjmujący cień, oznaczony jako element warstwy kolizyjnej. */
function bryla(w, h, d, mat) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // Kolejność ścian w BoxGeometry: +x, -x, +y, -y, +z, -z (po cztery wierzchołki),
  // każda o innych wymiarach w płaszczyźnie — stąd osobna skala na ścianę.
  [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].forEach(([a, b], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, uv.getX(i) * a / KAFEL, uv.getY(i) * b / KAFEL);
  });
  geo.setAttribute("uv1", uv);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = true;
  m.userData.kolizja = true;     // znacznik warstwy kolizyjnej (patrz buildBuilding)
  return m;
}

/* Pozioma płyta podłogi. Widoczna, ale sama w sobie bez objętości — kolizję
   dokłada osobna, niewidoczna bryła poniżej (patrz `podlogaKolizja`). */
function plyta(szer, dl, mat) {
  const m = new THREE.Mesh(skalujUV(new THREE.PlaneGeometry(szer, dl), szer / KAFEL, dl / KAFEL), mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/* POPRAWKA po przeglądzie Zadania 4: `plyta()` powyżej jest PlaneGeometry —
   bez grubości i bez `userData.kolizja` — więc żadna z siedmiu podłóg (atrium
   i sześć sal) nie trafiała do warstwy kolizyjnej. Zadanie 5 liczy `naZiemi`
   z `octree.capsuleIntersect`: bez podłogi w Octree kapsula gracza nigdy nie
   dostanie przecięcia z normalną skierowaną w górę i gracz spadałby przez
   podłogę od pierwszej klatki, w nieskończoność. Sama płaszczyzna by nie
   wystarczyła nawet ze znacznikiem — jest nieskończenie cienka, a szybko
   poruszająca się kapsuła potrafi ją "przelecieć" między klatkami. Octree
   potrzebuje objętości, więc pod każdą płytą kładziemy cienką bryłę o
   grubości GRUB, której górne lico wypada dokładnie na y = 0 (środek na
   -GRUB/2) — tuż pod widoczną podłogą. `visible = false` wyłącza ją z
   renderowania, więc nie ma mowy o z-fightingu z płytą nad nią; `root.traverse()`
   niżej w tym pliku i tak ją znajdzie, bo (w odróżnieniu od `traverseVisible`)
   nie sprawdza widoczności — trafi więc do warstwy kolizyjnej jak każda ściana. */
function podlogaKolizja(szer, dl, mat) {
  const m = bx(szer, GRUB, dl, mat);
  m.position.y = -GRUB / 2;
  m.visible = false;
  m.userData.kolizja = true;
  return m;
}

/* Ściana z prostokątną dziurą = cztery bryły: lewa, prawa, nadproże i (gdy
   dziura nie sięga podłogi) parapet. Prostsze i tańsze niż CSG, a Octree i tak
   potrzebuje brył wypukłych. `dolDziury` liczone od dołu ściany. */
function scianaZDziura(szer, wys, szerDziury, wysDziury, mat, dolDziury = 0) {
  const g = new THREE.Group();
  const bok = (szer - szerDziury) / 2;
  const gora = wys - dolDziury - wysDziury;
  const l = bryla(bok, wys, GRUB, mat); l.position.set(-(szerDziury + bok) / 2, wys / 2, 0);
  const p = bryla(bok, wys, GRUB, mat); p.position.set((szerDziury + bok) / 2, wys / 2, 0);
  g.add(l, p);
  if (gora > 0.001) {
    const n = bryla(szerDziury, gora, GRUB, mat);
    n.position.y = dolDziury + wysDziury + gora / 2;
    g.add(n);
  }
  if (dolDziury > 0.001) {
    const d = bryla(szerDziury, dolDziury, GRUB, mat);
    d.position.y = dolDziury / 2;
    g.add(d);
  }
  return g;
}

/* ── Atrium ───────────────────────────────────────────────────────────────
   Kwadratowy hol 16 × 16 × 9 m ze świetlikiem w stropie. Trzy ściany pełne,
   czwarta (od strony amfilady) z portalem do pierwszej sali. */

function atrium(matPodloga, matSciana) {
  const g = new THREE.Group();
  g.add(plyta(SZER_ATRIUM, SZER_ATRIUM, matPodloga));
  g.add(podlogaKolizja(SZER_ATRIUM, SZER_ATRIUM, matPodloga));

  [-1, 1].forEach((sx) => {
    const s = bryla(GRUB, WYS_ATRIUM, SZER_ATRIUM, matSciana);
    s.position.set(sx * SZER_ATRIUM / 2, WYS_ATRIUM / 2, 0);
    g.add(s);
  });
  const tyl = bryla(SZER_ATRIUM, WYS_ATRIUM, GRUB, matSciana);
  tyl.position.set(0, WYS_ATRIUM / 2, -SZER_ATRIUM / 2);
  g.add(tyl);

  // Czwarta ściana — z przejściem w amfiladę.
  const wyjscie = scianaZDziura(SZER_ATRIUM, WYS_ATRIUM, SZER_PORTALU, WYS_PORTALU, matSciana);
  wyjscie.position.z = SZER_ATRIUM / 2;
  g.add(wyjscie);

  // Strop ze świetlikiem. Ten sam budowniczy co ściana z dziurą, tylko
  // położony płasko: obrót -90° wokół X przenosi lokalne Y na światowe -Z,
  // więc przesunięcie o pół boku ustawia płytę dokładnie nad atrium, a dziura
  // wypada pośrodku (dolDziury = połowa reszty).
  const strop = scianaZDziura(SZER_ATRIUM, SZER_ATRIUM, SWIETLIK, SWIETLIK, matSciana, (SZER_ATRIUM - SWIETLIK) / 2);
  strop.rotation.x = -Math.PI / 2;
  strop.position.set(0, WYS_ATRIUM, SZER_ATRIUM / 2);
  g.add(strop);

  // Światło dzienne przez świetlik. Stożek jest szerszy niż dziura, więc to
  // strop wycina na podłodze kwadratową plamę — o ile rzuca cień (rzuca).
  // Źródło musi wisieć wysoko NAD stropem: z bliska plama rozlewa się na całe
  // atrium (rzut dziury rośnie proporcjonalnie do stosunku odległości) i po
  // świetliku nie zostaje ślad.
  const dzien = zCieniem(new THREE.SpotLight(0xbcd0ff, 130, 34, Math.PI / 11, 0.25, 1));
  dzien.position.set(0, WYS_ATRIUM + 12, 0);
  dzien.target.position.set(0, 0, 1);
  g.add(dzien, dzien.target);

  // Nazwa pierwszej epoki nad wejściem w amfiladę.
  g.add(...napisPortalu(ERAS[0], SZER_ATRIUM / 2 - 0.3));
  return g;
}

/* ── Sale ─────────────────────────────────────────────────────────────── */

/* Napis nad portalem: tytuł epoki i jej zakres dat. Bez tego amfilada nie
   mówi, przez co się właśnie przechodzi. */
function napisPortalu(era, z) {
  const napis = textSprite(era.title, { font: "700 40px Syne", color: "#E9EDF5" });
  napis.position.set(0, WYS_PORTALU + 0.55, z);
  const podpis = textSprite(era.range, { font: "400 22px 'IBM Plex Mono'", color: "#C79A4B" });
  podpis.position.set(0, WYS_PORTALU + 0.18, z);
  return [napis, podpis];
}

/* Kolor epoki = kolor pierwszej kategorii jej pierwszego projektu. Jedyne
   miejsce, w którym budynek zagląda do danych (globalne PROJECTS i CATEGORIES
   z js/projects-data.js) — listwy nad podłogą mają świecić barwą epoki. */
function kolorEpoki(idEpoki) {
  const p = PROJECTS.find((x) => x.era === idEpoki);
  return new THREE.Color(CATEGORIES[p?.cat?.[0]]?.color || "#F2C46D").getHex();
}

/* Reflektory wycelowane w ściany boczne (tam wiszą ramki) plus dwie emisyjne
   listwy u podstawy ścian. Listwy nie kosztują ani jednego światła, a długiej
   sali dają ciągłą linię w barwie epoki — reflektory świecą tylko punktowo. */
function swiatloSali(sala, dl, hex) {
  const ile = Math.min(MAX_REFLEKTOROW, Math.max(2, Math.round(dl / ODSTEP_REFLEKTOROW)));
  const srodkowy = Math.floor(ile / 2);       // środek sali — tam eksponaty stoją najgęściej
  for (let i = 0; i < ile; i++) {
    const s = i % 2 ? 1 : -1;                 // na przemian w lewą i prawą ścianę
    const z = dl * (i + 0.5) / ile;
    const sp = new THREE.SpotLight(0xfff0d8, 18, 16, Math.PI / 5, 0.4, 1.6);
    sp.position.set(s * 3, WYS_SALI - 0.6, z);
    // Celujemy nie w samą ścianę, tylko w pas przy niej: tam stoją cokoły
    // i wiszą ramki, więc stożek obejmuje jedno i drugie, a cokół rzuca cień.
    sp.target.position.set(s * 5.6, 1.4, z + 1);
    if (i === srodkowy) zCieniem(sp);         // jeden cień na salę — patrz MAX_MAP_CIENI
    sala.add(sp, sp.target);
  }
  [-1, 1].forEach((s) => {
    const listwa = bx(0.06, 0.04, dl - 0.6, M.add(hex, 0.9));
    listwa.position.set(s * (SZER_SALI / 2 - 0.25), 0.03, dl / 2);
    sala.add(listwa);
  });
}

/* ── Spięcie ──────────────────────────────────────────────────────────── */

export function buildBuilding(dlugosciSal) {
  const matBeton = loadPBR("beton", 1), matParkiet = loadPBR("parkiet", 1), matTynk = loadPBR("tynk", 1);
  mapCieni = 0;
  const root = new THREE.Group();
  root.name = "budynek";
  root.add(atrium(matBeton, matTynk));

  const sale = [];
  let z = SZER_ATRIUM / 2;                     // amfilada zaczyna się za ścianą atrium
  dlugosciSal.forEach((dl, i) => {
    const odZ = z;
    const ostatnia = i === dlugosciSal.length - 1;
    const sala = new THREE.Group();
    sala.name = `sala-${i + 1}`;
    sala.position.z = z;

    const pod = plyta(SZER_SALI, dl, matParkiet);
    pod.position.z = dl / 2;
    sala.add(pod);
    const podKolizja = podlogaKolizja(SZER_SALI, dl, matParkiet);
    podKolizja.position.z = dl / 2;
    sala.add(podKolizja);

    [-1, 1].forEach((s) => {
      const w = bryla(GRUB, WYS_SALI, dl, matTynk);
      w.position.set(s * SZER_SALI / 2, WYS_SALI / 2, dl / 2);
      sala.add(w);
    });

    const strop = bryla(SZER_SALI, GRUB, dl, matTynk);
    strop.position.set(0, WYS_SALI, dl / 2);
    sala.add(strop);

    // Ściana zamykająca salę: z portalem do następnej, a w ostatniej pełna.
    const tyl = ostatnia
      ? bryla(SZER_SALI, WYS_SALI, GRUB, matTynk)
      : scianaZDziura(SZER_SALI, WYS_SALI, SZER_PORTALU, WYS_PORTALU, matTynk);
    if (ostatnia) tyl.position.y = WYS_SALI / 2;
    tyl.position.z = dl;
    sala.add(tyl);

    if (!ostatnia) sala.add(...napisPortalu(ERAS[i + 1], dl - 0.3));   // portal prowadzi do NASTĘPNEJ epoki
    swiatloSali(sala, dl, kolorEpoki(i + 1));

    root.add(sala);
    sale.push({ id: i + 1, odZ, doZ: z + dl, srodekZ: z + dl / 2 });
    z += dl;
  });

  scene.add(root);

  /* Warstwa kolizyjna: te same bryły, bez materiałów, poza sceną (nie rysuje
     się jej ani razu). Kopiujemy pozycje w świecie, więc macierze muszą być
     policzone — scene.add() samo tego nie robi aż do pierwszej klatki. */
  root.updateWorldMatrix(false, true);
  const kolizje = new THREE.Group();
  kolizje.name = "kolizje";
  kolizje.visible = false;
  root.traverse((o) => {
    if (!o.userData.kolizja) return;
    const k = new THREE.Mesh(o.geometry);        // geometria współdzielona — Octree tylko ją czyta
    o.getWorldPosition(k.position);
    o.getWorldQuaternion(k.quaternion);
    o.getWorldScale(k.scale);      // POPRAWKA po przeglądzie: dziś wszędzie 1, ale bez tego
                                    // kolizje rozjadą się z obrazem, gdyby ktoś kiedyś
                                    // przeskalował `sala` albo `root`
    kolizje.add(k);
  });

  return { kolizje, sale };
}
