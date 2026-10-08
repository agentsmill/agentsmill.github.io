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
      sciana: materialPBR("tynk", { kolor: s.kolor, normal: 0.35 }),
      posadzka: materialPBR("parkiet", { szorstkosc: 0.85 }),
      sufit: gladki(0xe9e2d2, 0.92),
    };
    case "biel": return {
      sciana: gladki(0xf2f1ed, 0.93),
      posadzka: materialPBR("beton", { kolor: 0xaeaba5, szorstkosc: 0.62, normal: 0.3, bezKoloru: true }),
      sufit: gladki(0xf1f0ec, 0.95),
    };
    case "noc": {
      // posadzka to nakładka nad lustrem (swiatla.js): przezroczysta od początku, krycie ustawia lustro
      const posadzka = bezOdbic(gladki(0x0d0f14, 0.32));
      posadzka.transparent = true;
      return { sciana: materialPBR("tynk", { kolor: 0x3a4357, normal: 0.7 }), posadzka, sufit: gladki(0x0b0d12, 1) };
    }
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
   o dowolnych proporcjach. */
export function bryla(w, h, d, mat) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // kolejność ścian BoxGeometry: +x, −x, +y, −y, +z, −z — po cztery wierzchołki
  [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].forEach(([a, b], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, (uv.getX(i) * a) / KAFEL, (uv.getY(i) * b) / KAFEL);
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
function polmur(dl, H, otwory, mat) {
  const g = new THREE.Group();
  const odcinek = (u0, u1, y0, y1) => {
    const m = bryla(u1 - u0, y1 - y0, POLMUR, mat);
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
function sciany(s, drzwi, mat) {
  const W = s.x1 - s.x0, D = s.z1 - s.z0;
  const otwory = { "z-": [], "z+": [], "x-": [], "x+": [] };
  for (const d of drzwi) {
    if (d.a !== s.id && d.b !== s.id) continue;
    if (d.os === "z" && blisko(d.z, s.z0)) otwory["z-"].push(d.x - s.x0);
    if (d.os === "z" && blisko(d.z, s.z1)) otwory["z+"].push(d.x - s.x0);
    if (d.os === "x" && blisko(d.x, s.x0)) otwory["x-"].push(d.z - s.z0);
    if (d.os === "x" && blisko(d.x, s.x1)) otwory["x+"].push(d.z - s.z0);
  }
  const zMinus = polmur(W, s.H, otwory["z-"], mat); zMinus.position.set(s.x0, 0, s.z0 + POLMUR / 2);
  const zPlus = polmur(W, s.H, otwory["z+"], mat); zPlus.position.set(s.x0, 0, s.z1 - POLMUR / 2);
  // obrót −π/2 wokół Y: lokalne +X ściany biegnie wzdłuż świata +Z
  const xMinus = polmur(D, s.H, otwory["x-"], mat); xMinus.position.set(s.x0 + POLMUR / 2, 0, s.z0); xMinus.rotation.y = -Math.PI / 2;
  const xPlus = polmur(D, s.H, otwory["x+"], mat); xPlus.position.set(s.x1 - POLMUR / 2, 0, s.z0); xPlus.rotation.y = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(zMinus, zPlus, xMinus, xPlus);
  return { grupa: g, otwory };
}

/* Warstwa kolizyjna: kopie brył w pozycji świata, poza sceną. Brane są bryły
   oznaczone `userData.kolizja`, albo — przy `wszystko` — każda bryła obiektu
   (np. niewidoczny prostopadłościan ławki podany wprost). Octree w player.js
   buduje się wyłącznie z tej warstwy: gdyby wciągnąć całą scenę, gracz
   zaklinowałby się na tabliczce albo chmurze punktów. */
export function dodajKolizje(budynek, obiekt, wszystko = false) {
  obiekt.updateWorldMatrix(true, true);
  obiekt.traverse((o) => {
    if (!o.isMesh || !(wszystko || o.userData.kolizja)) return;
    const k = new THREE.Mesh(o.geometry);
    o.matrixWorld.decompose(k.position, k.quaternion, k.scale);
    budynek.kolizje.add(k);
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
    podlogi: [],                  // płyty posadzek z userData.salaId — cel kliknięć „idź tutaj”
    posadzkiNocy: [],             // nakładki nad lustrem (swiatla.js)
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

    const { grupa: mury, otwory } = sciany(s, plan.drzwi, mat.sciana);
    budynek.otwory.set(s.id, otwory);
    grupa.add(mury);

    const pod = plyta(W, D, mat.posadzka, KAFEL_POSADZKI[s.styl] ?? KAFEL);
    pod.position.set(cx, 0, cz);
    pod.userData.salaId = s.id;
    grupa.add(pod);
    budynek.podlogi.push(pod);
    if (s.styl === "noc") budynek.posadzkiNocy.push(pod);

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
