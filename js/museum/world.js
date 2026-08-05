import * as THREE from "three";
import { scene, M, bx, textSprite, CAT_HEX, fmtDate } from "./render.js";
import { EXHIBIT_BUILDERS, framedShot, plinth } from "./exhibits.js";
import { loadPBR } from "./textures.js";

/* ── Układ korytarza ──────────────────────────────────────────────────── */

const interactives = [];   // {mesh hitbox, project, exhibit, viewZ, side}
const tickers = [];
let zCursor = 0;
const eraRanges = [];

function addHit(project, group, radius, side, focusDist) {
  const hit = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.copy(group.position); hit.position.y += 1;
  hit.userData = { project, side, focusDist };
  scene.add(hit);
  interactives.push(hit);
  return hit;
}

function buildCorridor() {
  const byEra = (id) => PROJECTS.filter((p) => p.era === id).sort((a, b) => a.date < b.date ? -1 : 1);

  ERAS.forEach((era) => {
    const start = zCursor;

    // Portal epoki
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
    portal.position.z = -zCursor;
    scene.add(portal);
    zCursor += 5;

    // Kamienie milowe tej epoki
    MILESTONES.filter((m) => m.era === era.id).forEach((m) => {
      const side = Math.random() > 0.5 ? 1 : -1;
      const sp = textSprite(`◆ ${fmtDate(m.date)} — ${m.label}`, { font: "400 24px 'IBM Plex Mono'", color: m.personal ? "#F2C46D" : "#8C95A8", maxW: 900 });
      sp.position.set(side * 5.2, 2.3, -zCursor);
      scene.add(sp);
      zCursor += 2.5;
    });

    // Projekty epoki
    let side = 1;
    byEra(era.id).forEach((p) => {
      const hex = new THREE.Color(CAT_HEX[p.cat[0]]).getHex();
      if (EXHIBIT_BUILDERS[p.id]) {
        zCursor += 3.5;
        const ex = EXHIBIT_BUILDERS[p.id](hex);
        ex.group.position.set(side * 4.4, 0, -zCursor);
        ex.group.rotation.y = -side * 0.5;
        scene.add(ex.group);
        const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 2.72, 48), M.add(hex, 0.28));
        ring.rotation.x = -Math.PI / 2; ring.position.set(side * 4.4, 0.02, -zCursor);
        scene.add(ring);
        const lab = textSprite(p.title, { font: "700 34px Syne", color: "#E9EDF5" });
        lab.position.set(side * 4.4, 3.1, -zCursor);
        scene.add(lab);
        // obraz w ramie na ścianie za eksponatem
        const wall = framedShot(p, 2.6);
        wall.position.set(side * 7.6, 2.5, -zCursor);
        wall.rotation.y = -side * Math.PI / 2.6;
        scene.add(wall);
        if (ex.tick) tickers.push(ex.tick);
        addHit(p, ex.group, 2.3, side, 4.6).userData.exhibit = ex;
        zCursor += 6.5;
      } else {
        const ex = plinth(p, hex);
        ex.group.position.set(side * 6.6, 0, -zCursor);
        ex.group.rotation.y = -side * 0.7;
        scene.add(ex.group);
        tickers.push(ex.tick);
        addHit(p, ex.group, 1.3, side, 3.4).userData.exhibit = ex;
        zCursor += 3.4;
      }
      side *= -1;
    });

    zCursor += 4;
    eraRanges.push({ era, from: start, to: zCursor });
  });

  // Finał
  const endSp = textSprite("— sierpień 2026 · koniec ekspozycji (na razie) —", { font: "400 26px 'IBM Plex Mono'", color: "#5A6376", maxW: 1000 });
  endSp.position.set(0, 1.8, -(zCursor + 4));
  scene.add(endSp);
  zCursor += 6;
}

/* ── Podłoga i linia EKG ──────────────────────────────────────────────── */

function buildFloor(total) {
  const geo = new THREE.PlaneGeometry(40, total + 40);
  // aoMap czyta drugi zestaw UV (uv1) — bez tej linii mapa AO z zestawu
  // "beton" byłaby po cichu ignorowana, bez błędu i bez ostrzeżenia.
  geo.setAttribute("uv1", geo.attributes.uv);
  // Płyta jest prostokątna (40 × total+40), więc jeden wspólny skalar
  // powtórzeń rozciągałby kafle — liczymy osobno z obu rzeczywistych
  // wymiarów geometrii (nie z samego "total"), tak żeby kafel betonu
  // wyszedł ~kafelSwiata × kafelSwiata niezależnie od proporcji płyty.
  const kafelSwiata = 4;
  const powtX = Math.round(geo.parameters.width / kafelSwiata);
  const powtY = Math.round(geo.parameters.height / kafelSwiata);
  const floor = new THREE.Mesh(geo, loadPBR("beton", [powtX, powtY]));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -total / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(Math.max(60, total + 40), Math.floor((total + 40) / 2), 0x1a2233, 0x141b2a);
  grid.position.z = -total / 2;
  grid.position.y = 0.01;
  scene.add(grid);

  // EKG wzdłuż całego korytarza — HEARTBEAT rozciągnięty na długość spaceru
  const pts = [];
  const months = HEARTBEAT.length;
  const mLen = total / months;
  let z = 2;
  HEARTBEAT.forEach((mo) => {
    const beats = mo.n;
    if (beats === 0) {
      pts.push(new THREE.Vector3(0, 0.03, -z - mLen / 2));
      z += mLen;
      return;
    }
    const bw = mLen / (beats + 0.5);
    for (let b = 0; b < beats; b++) {
      const bz = z + bw * (b + 0.4);
      pts.push(new THREE.Vector3(0, 0.03, -bz));
      pts.push(new THREE.Vector3(-0.85, 0.03, -(bz + bw * 0.22)));
      pts.push(new THREE.Vector3(0.3, 0.03, -(bz + bw * 0.44)));
      pts.push(new THREE.Vector3(0, 0.03, -(bz + bw * 0.6)));
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
export { buildCorridor, buildFloor, interactives, tickers, eraRanges };
