/* Budynek z planu (plan.js): połówki murów z otworami drzwi, posadzki,
   stropy, materiały sal i warstwa kolizyjna. Wystrój stylów (listwy,
   świetliki, szyldy, ławki) dokłada wystroj.js — tu tylko bryła.

   Każda sala stawia własne cztery połówki muru do środka swojego
   prostokąta, więc lico ściany od strony sali ma zawsze materiał TEJ sali:
   sąsiednie sale mogą się różnić stylem, kolorem i wysokością bez
   migotania wspólnych płaszczyzn (sprawdzone na podglądzie z 7 X). */

import * as THREE from "three";
import { POLMUR, DRZWI_SZ, DRZWI_H } from "muzeum/plan.js";
import { materialPBR } from "muzeum/textures.js";
import { srodowisko } from "muzeum/render.js";

const KAFEL = 3;                                          // metry świata na kafel tekstury ścian i stropów
const KAFEL_POSADZKI = { palac: 2.2, biel: 6, zabawy: 2.2 };
/* Atrium (decyzja właściciela z 9 X: „spokojniej, drobniej”): tynk o połowę drobniejszy niż w innych salach.
   Przy kaflu 3 m ciemny pas i jasne krążki mapy koloru stały na wielkich ścianach jak zacieki. */
const KAFEL_SCIAN = { atrium: 1.5 };

/* Ile sala „świeci sama”, gdy nie ma przy niej prawdziwych świateł (patrz
   swiatla.js) — ułamek koloru materiału oddawany jako emisja. */
export const PRZEDSWIETLENIE = { palac: 0.34, biel: 0.6, noc: 0.05, kino: 0.03, zabawy: 0.5 };

export const gladki = (kolor, szorstkosc = 0.8, metal = 0) =>
  new THREE.MeshStandardMaterial({ color: kolor, roughness: szorstkosc, metalness: metal });

/* Bez odbić środowiska: przy ślizgowym kącie — a widok na wylot to sam ślizg —
   Fresnel robił z czarnej posadzki nocy szarą płytę. Mapa ustawiona wprost ma
   pierwszeństwo przed scene.environment, a intensywność 0 ją gasi. */
function bezOdbic(m) { m.envMap = srodowisko; m.envMapIntensity = 0; return m; }

function materialySali(s) {
  switch (s.styl) {
    case "palac": return {
      /* Atrium: tynk równy, bez plam (decyzja właściciela z 9 X) — mapa koloru przy kontraście 0,35, płytsza
         faktura (normalne 0,2 zamiast 0,35), jednolita szorstkość zamiast mapy ARM; drobniejszy kafel — KAFEL_SCIAN. */
      sciana: s.rodzaj === "atrium"
        ? materialPBR("tynk", { kolor: s.kolor, normal: 0.2, kontrast: 0.35, bezArm: true, szorstkosc: 0.93 })
        : materialPBR("tynk", { kolor: s.kolor, normal: 0.35 }),
      posadzka: materialPBR("parkiet", { szorstkosc: 0.85 }),
      sufit: gladki(0xe9e2d2, 0.92),
    };
    case "biel": return {
      sciana: gladki(0xf2f1ed, 0.93),
      posadzka: materialPBR("beton", { kolor: 0xaeaba5, szorstkosc: 0.62, normal: 0.3, bezKoloru: true }),
      sufit: gladki(0xf1f0ec, 0.95),
    };
    case "noc": return {
      sciana: materialPBR("tynk", { kolor: 0x3a4357, normal: 0.7 }),
      // czarna płyta; lustro z swiatla.js przykrywa ją w sali bieżącej i następnej, w pozostałych salach nocy widać ją wprost
      posadzka: bezOdbic(gladki(0x0d0f14, 0.32)),
      sufit: gladki(0x0b0d12, 1),
    };
    case "kino": return {
      sciana: bezOdbic(gladki(0x1d1517, 0.95)),
      posadzka: bezOdbic(gladki(0x2a1d20, 0.98)),
      sufit: gladki(0x0c0a0b, 1),
    };
    case "zabawy": return {
      sciana: gladki(s.kolor, 0.9),
      posadzka: materialPBR("parkiet", { szorstkosc: 0.8 }),
      sufit: gladki(0xfbf7f0, 0.95),
    };
    default: throw new Error(`sale.js: nieznany styl „${s.styl}"`);
  }
}

/* Przedświetlenie: materiał oddaje sam tyle, ile by go oświetliły światła
   sali, więc dalekie sale wyglądają na oświetlone, nie kosztując ani jednego
   światła. Mapa koloru staje się mapą emisji — faktura zostaje. Kolor czytany
   przy każdym ustawieniu: druk, którego obraz dojdzie później, zmienia kolor
   z szarego na biały i woła odswiezPrzedswietlenie(). */
export function zarejestruj(budynek, salaId, material, poziom) {
  const ustaw = (czynnik) => {
    if (material.map && material.emissiveMap !== material.map) {
      material.emissiveMap = material.map;
      material.needsUpdate = true;     // nowa mapa emisji = inny program shadera, raz
    }
    material.emissive.copy(material.color).multiplyScalar(poziom * czynnik);
    material.userData.czynnik = czynnik;
  };
  material.userData.odswiezPrzedswietlenie = () => ustaw(material.userData.czynnik ?? 1);
  ustaw(1);
  budynek.materialySal.get(salaId).push(ustaw);
}

/* Prostopadłościan z kwadratowymi kaflami na każdej ścianie: gęstość tekstury
   niesie geometria (skalowane UV), więc jeden materiał służy powierzchniom
   o dowolnych proporcjach. `kafel` — metry na kafel (domyślnie KAFEL). */
export function bryla(w, h, d, mat, kafel = KAFEL) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // kolejność ścian BoxGeometry: +x, −x, +y, −y, +z, −z — po cztery wierzchołki
  [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].forEach(([a, b], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, (uv.getX(i) * a) / kafel, (uv.getY(i) * b) / kafel);
  });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

/* Pozioma płyta (posadzka; po obrocie o π wokół X — strop). */
export function plyta(w, d, mat, kafel = KAFEL) {
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / kafel, (uv.getY(i) * d) / kafel);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/* Połówka muru jednej ściany: odcinki między otworami i nadproża. Lokalnie
   ściana biegnie wzdłuż +X od 0 do `dl`, grubość wzdłuż Z (wyśrodkowana). */
function polmur(dl, H, otwory, mat, kafel) {
  const g = new THREE.Group();
  const odcinek = (u0, u1, y0, y1) => {
    const m = bryla(u1 - u0, y1 - y0, POLMUR, mat, kafel);
    /* Faktura biegnie przez całą ścianę, a nie od początku każdego odcinka: oba lica (+z i −z) przesunięte
       o miejsce odcinka na ścianie i nad podłogą. Bez tego nadproże zaczynało teksturę od nowa i nad każdymi
       drzwiami stała jaśniejsza kolumna. Na licu −z BoxGeometry odwraca u, więc tam przesunięcie liczy się
       od drugiego końca ściany. */
    const uv = m.geometry.attributes.uv;
    for (let i = 16; i < 20; i++) uv.setXY(i, uv.getX(i) + u0 / kafel, uv.getY(i) + y0 / kafel);
    for (let i = 20; i < 24; i++) uv.setXY(i, uv.getX(i) + (dl - u1) / kafel, uv.getY(i) + y0 / kafel);
    m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
    m.userData.kolizja = true;
    g.add(m);
  };
  let p = 0;
  for (const c of [...otwory].sort((a, b) => a - b)) {
    const a = c - DRZWI_SZ / 2, b = c + DRZWI_SZ / 2;
    if (a - p > 0.001) odcinek(p, a, 0, H);
    if (H - DRZWI_H > 0.001) odcinek(a, b, DRZWI_H, H);
    p = b;
  }
  if (dl - p > 0.001) odcinek(p, dl, 0, H);
  return g;
}

const blisko = (a, b) => Math.abs(a - b) < 1e-6;

/* Cztery ściany sali z otworami wszystkich drzwi, które jej dotyczą. Środki
   otworów liczone wzdłuż danej ściany — od x0 dla ścian z±, od z0 dla x±.
   Ten sam układ odniesienia ma ramaSciany() w wystroj.js. */
function sciany(s, drzwi, mat, kafel) {
  const W = s.x1 - s.x0, D = s.z1 - s.z0;
  const otwory = { "z-": [], "z+": [], "x-": [], "x+": [] };
  for (const d of drzwi) {
    if (d.a !== s.id && d.b !== s.id) continue;
    if (d.os === "z" && blisko(d.z, s.z0)) otwory["z-"].push(d.x - s.x0);
    if (d.os === "z" && blisko(d.z, s.z1)) otwory["z+"].push(d.x - s.x0);
    if (d.os === "x" && blisko(d.x, s.x0)) otwory["x-"].push(d.z - s.z0);
    if (d.os === "x" && blisko(d.x, s.x1)) otwory["x+"].push(d.z - s.z0);
  }
  const zMinus = polmur(W, s.H, otwory["z-"], mat, kafel); zMinus.position.set(s.x0, 0, s.z0 + POLMUR / 2);
  const zPlus = polmur(W, s.H, otwory["z+"], mat, kafel); zPlus.position.set(s.x0, 0, s.z1 - POLMUR / 2);
  // obrót −π/2 wokół Y: lokalne +X ściany biegnie wzdłuż świata +Z
  const xMinus = polmur(D, s.H, otwory["x-"], mat, kafel); xMinus.position.set(s.x0 + POLMUR / 2, 0, s.z0); xMinus.rotation.y = -Math.PI / 2;
  const xPlus = polmur(D, s.H, otwory["x+"], mat, kafel); xPlus.position.set(s.x1 - POLMUR / 2, 0, s.z0); xPlus.rotation.y = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(zMinus, zPlus, xMinus, xPlus);
  return { grupa: g, otwory };
}

/* Warstwa kolizyjna: kopie brył w pozycji świata, poza sceną. Brane są bryły
   oznaczone `userData.kolizja`, albo — przy `wszystko` — każda bryła obiektu
   (np. niewidoczny prostopadłościan ławki podany wprost). Octree w player.js
   buduje się wyłącznie z tej warstwy: gdyby wciągnąć całą scenę, gracz
   zaklinowałby się na tabliczce albo chmurze punktów.
   `zaslania`: bryła trafia też do `budynek.zaslony` — muru, przez który nie
   wolno niczego wskazać ani kliknąć (main.js: zaslonieta). Ławki i podstawy
   eksponatów podają false: bryła kolizyjna podestu (2,6 m) zasłoniłaby rzeźbę
   w środku i obraz nad nią, a ławka — podłogę za sobą. Macierz świata liczona
   od razu: warstwa nie wisi w scenie, więc bez tego do initPlayer() każda
   kopia stałaby dla promienia w początku układu. */
export function dodajKolizje(budynek, obiekt, wszystko = false, zaslania = true) {
  obiekt.updateWorldMatrix(true, true);
  obiekt.traverse((o) => {
    if (!o.isMesh || !(wszystko || o.userData.kolizja)) return;
    const k = new THREE.Mesh(o.geometry);
    o.matrixWorld.decompose(k.position, k.quaternion, k.scale);
    budynek.kolizje.add(k);
    k.updateMatrixWorld();
    if (zaslania) budynek.zaslony.push(k);
  });
}

export function zbudujBudynek(plan) {
  const grupa = new THREE.Group();
  grupa.name = "budynek";
  const kolizje = new THREE.Group();
  kolizje.name = "kolizje";
  kolizje.visible = false;
  const budynek = {
    grupa, kolizje,
    zaslony: [],                  // bryły kolizji, przez które nie da się wskazać (dodajKolizje) — bez ławek i podstaw
    podlogi: [],                  // płyty posadzek z userData.salaId — cel kliknięć „idź tutaj”
    materialySal: new Map(),      // salaId → funkcje ustawiające przedświetlenie
    otwory: new Map(),            // salaId → środki otworów na każdej ścianie (wystroj.js)
    kotwice: [],                  // światła idealne; prawdziwe z puli rozdziela swiatla.js
    tickery: [],
  };

  for (const s of plan.sale) {
    budynek.materialySal.set(s.id, []);
    const mat = materialySali(s);
    for (const m of Object.values(mat)) zarejestruj(budynek, s.id, m, PRZEDSWIETLENIE[s.styl]);
    const W = s.x1 - s.x0, D = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;

    const { grupa: mury, otwory } = sciany(s, plan.drzwi, mat.sciana, KAFEL_SCIAN[s.rodzaj] ?? KAFEL);
    budynek.otwory.set(s.id, otwory);
    grupa.add(mury);

    const pod = plyta(W, D, mat.posadzka, KAFEL_POSADZKI[s.styl] ?? KAFEL);
    pod.position.set(cx, 0, cz);
    pod.userData.salaId = s.id;
    grupa.add(pod);
    budynek.podlogi.push(pod);

    const sufit = plyta(W, D, mat.sufit);
    sufit.rotation.x = Math.PI / 2;
    sufit.position.set(cx, s.H, cz);
    grupa.add(sufit);

    /* Podłoga kolizyjna to bryła pod płytą, nie sama płyta: płaszczyzna nie ma
       objętości i kapsuła potrafiła ją przeskoczyć między klatkami. */
    const podK = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D));
    podK.position.set(cx, -0.2, cz);
    podK.visible = false;
    podK.userData.kolizja = true;
    grupa.add(podK);
  }
  dodajKolizje(budynek, grupa);
  return budynek;
}
