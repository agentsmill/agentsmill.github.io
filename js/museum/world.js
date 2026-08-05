import * as THREE from "three";
import { scene, M, bx, textSprite, CAT_HEX, fmtDate } from "./render.js";
import { EXHIBIT_BUILDERS, framedShot, plinth } from "./exhibits.js";
import { SZER_ATRIUM, SZER_SALI } from "./building.js";

/* ── Rozstawienie eksponatów w salach ─────────────────────────────────────
   Amfilada biegnie w stronę DODATNIEGO Z: atrium kończy się na z = 8, tam
   zaczyna się sala pierwsza i dalej sala po sali. Wszystkie pozycje są więc
   dodatnie — budynek z building.js rośnie w tę samą stronę. */

const interactives = [];   // {mesh hitbox, project, exhibit, viewZ, side}
const tickers = [];
let zCursor = 0;
const eraRanges = [];

/* Kroki wzdłuż osi Z. Ich suma w obrębie epoki JEST długością jej sali
   (patrz dlugosciSal()) — dzięki temu ściany działowe wypadają dokładnie
   w przerwach między epokami, a nie w środku ekspozycji. */
const POCZATEK = SZER_ATRIUM / 2;      // pierwsza sala zaczyna się tuż za ścianą atrium
const MARGINES_WEJSCIA = 2;            // brama epoki nie może tkwić w ścianie działowej
const KROK_BRAMY = 5;
const KROK_KAMIENIA = 2.5;
/* Eksponaty stoją na przemian przy lewej i prawej ścianie, więc na jednej
   ścianie wypadają co dwa kroki. Zagęszczenie (dwa eksponaty w jednym rzędzie,
   po jednym przy każdej ścianie) skróciłoby amfiladę o jedną trzecią, ale
   podpisy pod eksponatami na tej samej ścianie zaczynają wtedy na siebie
   nachodzić — sprite tytułu bywa szerszy niż 4 m. Zostają odstępy z korytarza. */
const KROK_PRZED_AUTORSKIM = 3.5;
const KROK_PO_AUTORSKIM = 6.5;
const KROK_COKOLU = 3.4;
const MARGINES_KONCA = 4;
const MIN_DL_SALI = 20;                // krótka epoka też ma wyglądać na salę, nie na wnękę

/* Pozycje w poprzek sali. Ściany stoją na ±7 (SZER_SALI/2), ich wewnętrzne
   lico na ±6,8 — napisy i ramki muszą się zmieścić przed nim. */
const X_AUTORSKI = 3.6;
/* POPRAWKA po przeglądzie Zadania 4: przy 4,6 najdłuższe podpisy cokołów
   (36 znaków, np. „Age of Agents: The Game → Token Golf") mierzą realnie do
   559 px przy foncie „600 30px Schibsted Grotesk" — sprite wychodzi ~4,46 m
   szeroki, więc jego zewnętrzna krawędź (±2,23 m od osi cokołu) sięgała 6,83 m,
   za lico ściany (6,8 m). Zejście do 4,4 daje krawędź 6,63 m — margines ~17 cm. */
const X_COKOL = 4.4;
const X_KAMIEN = 3.0;                  // sprite kamienia milowego bywa 7 m szeroki
const Y_KAMIEN = 3.2;                  // nad głowami: pas dat pod stropem, a nie baner przed nosem
const X_RAMKI = SZER_SALI / 2 - 0.3;   // ramka płasko na ścianie, z zapasem na poświatę

function addHit(project, group, radius, side, focusDist) {
  const hit = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(group.position); hit.position.y += 1;
  hit.userData = { project, side, focusDist };
  scene.add(hit);
  interactives.push(hit);
  return hit;
}

/* Jeden eksponat na bieżącej pozycji zCursor, przy lewej (side = -1) albo
   prawej (side = 1) ścianie sali. */
function postawEksponat(p, side) {
  const hex = new THREE.Color(CAT_HEX[p.cat[0]]).getHex();
  if (EXHIBIT_BUILDERS[p.id]) {
    const ex = EXHIBIT_BUILDERS[p.id](hex);
    ex.group.position.set(side * X_AUTORSKI, 0, zCursor);
    // Zwiedzający idzie w stronę +Z, więc widzi ścianę -Z eksponatu: obrót o π
    // odwraca go przodem do widza, a ±0,4 dokłada skręt ku środkowi sali.
    ex.group.rotation.y = Math.PI + side * 0.4;
    scene.add(ex.group);
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.72, 48), M.add(hex, 0.28));
    ring.rotation.x = -Math.PI / 2; ring.position.set(side * X_AUTORSKI, 0.02, zCursor);
    scene.add(ring);
    const lab = textSprite(p.title, { font: "700 34px Syne", color: "#E9EDF5" });
    lab.position.set(side * X_AUTORSKI, 3.1, zCursor);
    scene.add(lab);
    // Obraz w ramie — płasko na ścianie bocznej, tuż za eksponatem.
    const wall = framedShot(p, 2.6);
    wall.position.set(side * X_RAMKI, 2.5, zCursor);
    wall.rotation.y = -side * Math.PI / 2;
    scene.add(wall);
    if (ex.tick) tickers.push(ex.tick);
    addHit(p, ex.group, 2.3, side, 4.6).userData.exhibit = ex;
  } else {
    const ex = plinth(p, hex);
    ex.group.position.set(side * X_COKOL, 0, zCursor);
    ex.group.rotation.y = Math.PI + side * 0.7;
    scene.add(ex.group);
    tickers.push(ex.tick);
    addHit(p, ex.group, 1.3, side, 3.4).userData.exhibit = ex;
  }
}

function buildCorridor() {
  const byEra = (id) => PROJECTS.filter((p) => p.era === id).sort((a, b) => a.date < b.date ? -1 : 1);
  zCursor = POCZATEK;

  ERAS.forEach((era) => {
    const start = zCursor;
    zCursor += MARGINES_WEJSCIA;

    // Brama epoki — już za progiem sali, żeby jej kolumny nie tkwiły w ścianie.
    const portal = new THREE.Group();
    [-1, 1].forEach((s) => {
      const col = bx(0.22, 3.4, 0.22, M.body(0x1a2438)); col.position.set(2.6 * s, 1.7, 0); portal.add(col);
      const glow = bx(0.06, 3.4, 0.06, M.add(0xf2c46d, 0.5)); glow.position.set(2.6 * s - 0.14 * s, 1.7, 0); portal.add(glow);
    });
    const lintel = bx(5.6, 0.22, 0.22, M.body(0x1a2438)); lintel.position.y = 3.5; portal.add(lintel);
    const title = textSprite(era.title, { font: "700 46px Syne", color: "#E9EDF5" });
    title.position.y = 4.15; portal.add(title);
    const sub = textSprite(`${era.range} · ${era.rhythm}`, { font: "400 22px 'IBM Plex Mono'", color: "#C79A4B" });
    sub.position.y = 3.0; portal.add(sub);
    portal.position.z = zCursor;
    scene.add(portal);
    zCursor += KROK_BRAMY;

    // Kamienie milowe tej epoki
    MILESTONES.filter((m) => m.era === era.id).forEach((m) => {
      const side = Math.random() > 0.5 ? 1 : -1;
      const sp = textSprite(`◆ ${fmtDate(m.date)} — ${m.label}`, { font: "400 24px 'IBM Plex Mono'", color: m.personal ? "#F2C46D" : "#8C95A8", maxW: 900 });
      sp.position.set(side * X_KAMIEN, Y_KAMIEN, zCursor);
      scene.add(sp);
      zCursor += KROK_KAMIENIA;
    });

    // Projekty epoki, na przemian przy prawej i lewej ścianie.
    let side = 1;
    byEra(era.id).forEach((p) => {
      const autorski = !!EXHIBIT_BUILDERS[p.id];
      zCursor += autorski ? KROK_PRZED_AUTORSKIM : 0;
      postawEksponat(p, side);
      zCursor += autorski ? KROK_PO_AUTORSKIM : KROK_COKOLU;
      side *= -1;
    });

    zCursor += MARGINES_KONCA;
    if (zCursor - start < MIN_DL_SALI) zCursor = start + MIN_DL_SALI;
    eraRanges.push({ era, from: start, to: zCursor });
  });

  // Finał — jeszcze wewnątrz ostatniej sali, przed jej ścianą zamykającą.
  // Jaśniejszy niż w korytarzu: wcześniej napis wisiał na czerni, teraz ma za
  // sobą szary tynk i w dawnym kolorze (#5A6376) zlewałby się ze ścianą.
  const endSp = textSprite("— sierpień 2026 · koniec ekspozycji (na razie) —", { font: "400 26px 'IBM Plex Mono'", color: "#A7B0C0", maxW: 1000 });
  endSp.position.set(0, 1.8, zCursor - 2.5);
  scene.add(endSp);
  zCursor += 6;   // zapas na szynę kamery: maxZ() cofa ją i tak przed ścianę
}

/* Długości sal dla building.js — dokładnie tyle, ile zajmuje ekspozycja epoki.
   Bez dodatkowego zapasu: gdyby sala była dłuższa od swojej epoki, każda
   następna przesuwałaby się względem eksponatów o skumulowaną różnicę i pod
   koniec amfilady eksponaty stałyby o kilkadziesiąt metrów przed swoją salą. */
export function dlugosciSal() {
  return eraRanges.map((r) => r.to - r.from);
}

/* ── Linia EKG pod stopami ────────────────────────────────────────────────
   Rytm miesięcy (HEARTBEAT) rozciągnięty na całą amfiladę. Wcześniej ta
   funkcja stawiała też betonową płytę 40 × N i siatkę pomocniczą — po
   wejściu budynku obie leżałyby dokładnie w płaszczyźnie podłóg sal i biły
   się o piksele (z-fighting), a poza budynkiem i tak nikt ich nie zobaczy. */
function buildEkg(odZ, doZ) {
  const pts = [];
  const mLen = (doZ - odZ) / HEARTBEAT.length;
  let z = odZ;
  HEARTBEAT.forEach((mo) => {
    const beats = mo.n;
    if (beats === 0) {
      pts.push(new THREE.Vector3(0, 0.03, z + mLen / 2));
      z += mLen;
      return;
    }
    const bw = mLen / (beats + 0.5);
    for (let b = 0; b < beats; b++) {
      const bz = z + bw * (b + 0.4);
      pts.push(new THREE.Vector3(0, 0.03, bz));
      pts.push(new THREE.Vector3(-0.85, 0.03, bz + bw * 0.22));
      pts.push(new THREE.Vector3(0.3, 0.03, bz + bw * 0.44));
      pts.push(new THREE.Vector3(0, 0.03, bz + bw * 0.6));
    }
    z += mLen;
  });
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.min(2400, pts.length * 5), 0.025, 5, false),
    M.add(0xf2c46d, 0.8)
  );
  scene.add(tube);
}

// zCursor jest mutowane wewnątrz buildCorridor(); eksport przez getter zamiast
// „export let", żeby main.js zawsze czytał żywą, aktualną wartość.
export function totalLength() { return zCursor; }
export { buildCorridor, buildEkg, interactives, tickers, eraRanges };
