/* Muzeum Budowania — spacer po szynach przez 16 miesięcy.
   Dane: js/projects-data.js (PROJECTS, ERAS, MILESTONES, HEARTBEAT, CATEGORIES). */

import * as THREE from "three";

/* ── Podstawy ─────────────────────────────────────────────────────────── */

const host = document.getElementById("scene-host");
const loader = document.getElementById("loader");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}
if (!webglOK()) {
  document.getElementById("no-webgl").hidden = false;
  loader.classList.add("done");
  throw new Error("WebGL unavailable");
}

const ROMAN = { "01":"I","02":"II","03":"III","04":"IV","05":"V","06":"VI","07":"VII","08":"VIII","09":"IX","10":"X","11":"XI","12":"XII" };
const fmtDate = (d) => { const [y, m] = d.split("-"); return `${ROMAN[m]} ${y}`; };
const CAT_HEX = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1018);
scene.fog = new THREE.Fog(0x0c1018, 10, 60);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 1.6, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
host.appendChild(renderer.domElement);
window.__mz = { renderer, scene, camera, go: (z) => { targetZ = curZ = z; } };   // uchwyt diagnostyczny (nieszkodliwy)

scene.add(new THREE.AmbientLight(0x8899bb, 0.5));
const hemi = new THREE.HemisphereLight(0x35507a, 0x0c1018, 0.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xf2c46d, 0.35);
key.position.set(3, 8, 2);
scene.add(key);

/* ── Tekst na sprite'ach ──────────────────────────────────────────────── */

function textSprite(text, { font = "500 34px 'IBM Plex Mono'", color = "#8C95A8", pad = 18, maxW = 760 } = {}) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = font;
  const w = Math.min(maxW, Math.ceil(ctx.measureText(text).width)) + pad * 2;
  const lineH = parseInt(font.match(/(\d+)px/)[1], 10) * 1.35;
  c.width = w * 2; c.height = Math.ceil(lineH + pad * 2) * 2;
  const ctx2 = c.getContext("2d");
  ctx2.scale(2, 2);
  ctx2.font = font;
  ctx2.fillStyle = color;
  ctx2.textBaseline = "middle";
  ctx2.fillText(text, pad, (lineH + pad * 2) / 2, maxW);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  const scale = 0.0075;
  sp.scale.set(c.width * scale / 2, c.height * scale / 2, 1);
  return sp;
}

/* ── Budowniczowie eksponatów ─────────────────────────────────────────── */

const M = {
  body: (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 }),
  glow: (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity }),
  add:  (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
};

function bx(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

/* 1. Age of Agents — pikselowy zamek z osadnikami */
function exAgeOfAgents(hex) {
  const g = new THREE.Group();
  const base = M.body(0x2a3550), amber = M.glow(hex, 0.95);
  const blocks = [];
  const plan = [[0,0,0,1.2],[1.1,0,0.2,0.8],[-1.1,0,-0.1,0.9],[0.5,0,-1,0.7],[-0.6,0,0.9,0.6],[0,1.0,0,0.7],[1.1,0.7,0.2,0.5],[-1.1,0.8,-0.1,0.4],[0,1.7,0,0.4]];
  plan.forEach(([x, y, z, s]) => {
    const b = bx(s, s, s, Math.random() > 0.65 ? amber : base);
    b.position.set(x, y + s / 2, z);
    g.add(b); blocks.push(b);
  });
  const settlers = [];
  for (let i = 0; i < 3; i++) {
    const s = bx(0.16, 0.16, 0.16, M.glow(0xffffff, 0.9));
    scenePlace(s, 0, 0.08, 0);
    g.add(s); settlers.push(s);
  }
  return {
    group: g,
    tick(t) {
      settlers.forEach((s, i) => {
        const a = t * 0.5 + i * 2.1;
        s.position.set(Math.cos(a) * 1.9, 0.08, Math.sin(a) * 1.9);
      });
    },
    activate() {
      const s = 0.3 + Math.random() * 0.5;
      const b = bx(s, s, s, Math.random() > 0.4 ? M.glow(hex, 0.95) : M.body(0x2a3550));
      b.position.set((Math.random() - 0.5) * 2.2, 2.1 + Math.random() * 0.7, (Math.random() - 0.5) * 2.2);
      b.userData.pop = 0; blocks.push(b); g.add(b);
    },
    pops: blocks,
  };
}
function scenePlace(o, x, y, z) { o.position.set(x, y, z); }

/* 2. EmpowerHer — plan tygodnia, który się zapala */
function exEmpowerHer(hex) {
  const g = new THREE.Group();
  const board = bx(2.4, 1.6, 0.08, M.body(0x1a2438));
  board.position.y = 1.5; g.add(board);
  const slots = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const s = bx(0.44, 0.34, 0.04, M.glow(hex, 0.16));
    s.position.set(-0.83 + c * 0.55, 1.95 - r * 0.45, 0.07);
    board.add(s); slots.push(s);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 10, 40), M.add(hex, 0.5));
  ring.position.set(0, 1.5, 0.3); g.add(ring);
  let wave = -1;
  return {
    group: g,
    tick(t) {
      ring.rotation.z = t * 0.4;
      slots.forEach((s, i) => {
        const on = Math.sin(t * 1.1 + i * 0.9) > 0.55 || (wave >= 0 && i <= wave);
        s.material.opacity = on ? 0.95 : 0.16;
      });
      if (wave >= 0) { wave += 0.35; if (wave > slots.length + 4) wave = -1; }
    },
    activate() { wave = 0; },
  };
}

/* 3. Reverie — gałęzie rosnące ku uwadze */
function exReverie(hex) {
  const g = new THREE.Group();
  const pts = [], segs = [];
  function grow(from, dir, depth) {
    if (depth <= 0) return;
    const len = 0.32 + Math.random() * 0.4;
    const to = from.clone().add(dir.clone().multiplyScalar(len));
    segs.push([from, to]);
    pts.push(to);
    const n = Math.random() > 0.4 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const d2 = dir.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.55, (Math.random() - 0.5) * 0.9)).normalize();
      grow(to, d2, depth - 1);
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 6);
  const geo = new THREE.BufferGeometry().setFromPoints(segs.flat());
  const line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending }));
  g.add(line);
  const pgeo = new THREE.BufferGeometry().setFromPoints(pts);
  const points = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(points);
  const total = segs.length * 2;
  let reveal = 0;
  geo.setDrawRange(0, 0);
  return {
    group: g,
    tick() {
      if (reveal < total) { reveal += 3; geo.setDrawRange(0, Math.min(total, Math.floor(reveal))); }
      line.rotation.y += 0.0016; points.rotation.y += 0.0016;
    },
    activate() { reveal = 0; },
  };
}

/* 4. Strażacki Ekspres Leona — kolejka, pożar i woda */
function exEkspres(hex) {
  const g = new THREE.Group();
  const track = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.045, 8, 60), M.body(0x3a4258));
  track.rotation.x = Math.PI / 2; track.position.y = 0.05; g.add(track);
  const train = new THREE.Group();
  const loco = bx(0.5, 0.34, 0.3, M.glow(hex, 0.98)); loco.position.y = 0.28; train.add(loco);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.16, 8), M.body(0x2a3550));
  chimney.position.set(0.16, 0.52, 0); train.add(chimney);
  [1, 2].forEach((i) => {
    const w = bx(0.38, 0.26, 0.26, M.body(0x4a5470)); w.position.set(-0.5 * i, 0.24, 0); train.add(w);
  });
  g.add(train);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 8), M.add(0xff7043, 0.95));
  fire.position.set(2.15, 0.2, 0); g.add(fire);
  const drops = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 26 }, () => new THREE.Vector3())),
    new THREE.PointsMaterial({ color: 0x6fc3ff, size: 0.06, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  g.add(drops);
  let speed = 0.55, dousing = 0, fireScale = 1;
  return {
    group: g,
    tick(t, dt) {
      const a = t * speed;
      train.position.set(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5);
      train.rotation.y = -a - Math.PI / 2;
      fire.scale.setScalar(fireScale * (1 + Math.sin(t * 9) * 0.12));
      if (dousing > 0) {
        dousing -= dt;
        drops.material.opacity = Math.min(1, dousing * 2);
        const pos = drops.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const f = (t * 3 + i * 0.37) % 1;
          pos.setXYZ(i,
            THREE.MathUtils.lerp(train.position.x, fire.position.x, f),
            0.45 + Math.sin(f * Math.PI) * 0.75,
            THREE.MathUtils.lerp(train.position.z, fire.position.z, f) + (Math.random() - 0.5) * 0.05);
        }
        pos.needsUpdate = true;
        fireScale = Math.max(0.12, fireScale - dt * 0.4);
      } else {
        drops.material.opacity = Math.max(0, drops.material.opacity - dt);
        speed = THREE.MathUtils.lerp(speed, 0.55, dt);
        fireScale = Math.min(1, fireScale + dt * 0.12);
      }
    },
    activate() { speed = 1.5; dousing = 2.6; },
  };
}

/* 5. Token Drag Race — auta w rytmie chunków */
function exDragRace(hex) {
  const g = new THREE.Group();
  const colors = [hex, 0xb48cf2, 0x5cc8db];
  const cars = [], progress = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const lane = bx(3.4, 0.03, 0.5, M.body(0x1a2438));
    lane.position.set(0, 0.02, -0.6 + i * 0.6); g.add(lane);
    const car = bx(0.34, 0.16, 0.3, M.glow(colors[i], 0.98));
    car.position.set(-1.55, 0.14, -0.6 + i * 0.6);
    g.add(car); cars.push(car);
  }
  return {
    group: g,
    tick(t, dt) {
      cars.forEach((c, i) => {
        if (Math.random() < 0.16 + i * 0.05) progress[i] += Math.random() * 0.9;
        c.position.x = -1.55 + Math.min(3.1, progress[i] * dt * 6 + (c.position.x + 1.55));
        if (c.position.x >= 1.55) { c.position.x = -1.55; progress[i] = 0; }
        progress[i] *= 0.9;
      });
    },
    activate() { cars.forEach((c) => (c.position.x = -1.55)); },
  };
}

/* 6. LastBox — maszt LoRa nadaje */
function exLastBox(hex) {
  const g = new THREE.Group();
  const box = bx(0.7, 0.4, 0.5, M.body(0x2a3550)); box.position.y = 0.2; g.add(box);
  const led = bx(0.08, 0.08, 0.02, M.glow(hex, 1)); led.position.set(0.2, 0.32, 0.26); g.add(led);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), M.body(0x4a5470));
  mast.position.y = 1.5; g.add(mast);
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 36), M.add(hex, 0.0));
    r.position.y = 2.6; r.rotation.x = Math.PI / 2;
    g.add(r); rings.push(r);
  }
  let burst = 0;
  return {
    group: g,
    tick(t, dt) {
      led.material.opacity = 0.4 + 0.6 * (Math.sin(t * 2.2) > 0.7 ? 1 : 0.2);
      rings.forEach((r, i) => {
        const f = ((t * (burst > 0 ? 0.9 : 0.28) + i / 4) % 1);
        r.scale.setScalar(0.4 + f * 3.2);
        r.material.opacity = (1 - f) * (burst > 0 ? 0.8 : 0.35);
      });
      if (burst > 0) burst -= dt;
    },
    activate() { burst = 3; },
  };
}

/* 7. NaszWhisper — fala głosu zamienia się w tekst */
function exWhisper(hex) {
  const g = new THREE.Group();
  const mic = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.3, 6, 14), M.body(0x4a5470));
  mic.position.y = 1.7; g.add(mic);
  const bars = [];
  for (let i = 0; i < 16; i++) {
    const b = bx(0.08, 0.3, 0.08, M.glow(hex, 0.85));
    b.position.set(-0.9 + i * 0.12, 1.0, 0);
    g.add(b); bars.push(b);
  }
  const lines = [];
  for (let i = 0; i < 3; i++) {
    const l = bx(1.3 - i * 0.25, 0.07, 0.04, M.glow(0xe9edf5, 0));
    l.position.set(0, 0.55 - i * 0.16, 0);
    g.add(l); lines.push(l);
  }
  let mode = 0, mt = 0;
  return {
    group: g,
    tick(t, dt) {
      mic.position.y = 1.7 + Math.sin(t * 0.9) * 0.05;
      if (mode === 0) {
        bars.forEach((b, i) => { b.scale.y = 0.4 + Math.abs(Math.sin(t * 2.4 + i * 0.7)) * 1.6; });
        lines.forEach((l) => (l.material.opacity = Math.max(0, l.material.opacity - dt)));
      } else {
        mt += dt;
        bars.forEach((b) => (b.scale.y = Math.max(0.1, b.scale.y - dt * 3)));
        lines.forEach((l, i) => { if (mt > 0.3 + i * 0.35) l.material.opacity = Math.min(0.95, l.material.opacity + dt * 2); });
        if (mt > 3.2) { mode = 0; mt = 0; }
      }
    },
    activate() { mode = 1; mt = 0; },
  };
}

/* 8. Anatomy of a Thought — kula atencji */
function exAnatomy(hex) {
  const g = new THREE.Group();
  const N = 220, pts = [];
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(0.9 + Math.random() * 0.35);
    pts.push(v);
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ color: hex, size: 0.045, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  cloud.position.y = 1.6; g.add(cloud);
  const linePts = [];
  for (let i = 0; i < 26; i++) linePts.push(new THREE.Vector3(0, 0, 0), pts[Math.floor(Math.random() * N)]);
  const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending }));
  lines.position.y = 1.6; g.add(lines);
  let pulse = 0;
  return {
    group: g,
    tick(t, dt) {
      cloud.rotation.y += dt * (pulse > 0 ? 0.9 : 0.15);
      lines.rotation.y = cloud.rotation.y;
      if (pulse > 0) { pulse -= dt; cloud.material.size = 0.045 + Math.sin(pulse * 6) * 0.02; lines.material.opacity = 0.18 + pulse * 0.2; }
    },
    activate() { pulse = 2.5; },
  };
}

const EXHIBIT_BUILDERS = {
  "age-of-agents": exAgeOfAgents, "empowerher": exEmpowerHer, "reverie": exReverie,
  "ekspres-leona": exEkspres, "token-drag-race": exDragRace, "lastbox": exLastBox,
  "naszwhisper": exWhisper, "anatomy": exAnatomy,
};

/* Postument z hologramem dla pozostałych projektów */
function plinth(p, hex) {
  const g = new THREE.Group();
  const ped = bx(0.7, 0.9, 0.7, M.body(0x1a2438)); ped.position.y = 0.45; g.add(ped);
  const edge = bx(0.74, 0.03, 0.74, M.glow(hex, 0.8)); edge.position.y = 0.92; g.add(edge);
  const label = textSprite(p.title, { font: "600 30px 'Schibsted Grotesk'", color: "#E9EDF5" });
  label.position.y = 1.45; g.add(label);
  const date = textSprite(fmtDate(p.date), { font: "400 22px 'IBM Plex Mono'", color: "#8C95A8" });
  date.position.y = 1.14; g.add(date);
  return {
    group: g,
    tick(t) { label.position.y = 1.45 + Math.sin(t * 0.8 + g.position.z) * 0.03; },
    activate() {},
  };
}

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
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, total + 40),
    new THREE.MeshStandardMaterial({ color: 0x0e1420, roughness: 0.95, metalness: 0 })
  );
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

/* ── Szyny kamery, fokus, interakcja ─────────────────────────────────── */

let targetZ = 0, curZ = 0;
let focus = null;           // {hit, savedZ}
const maxZ = () => zCursor - 2;

const plaque = document.getElementById("plaque");
const hudEra = document.getElementById("hud-era");
const hint = document.getElementById("hud-hint");
let moved = false;

function openPlaque(hit) {
  const p = hit.userData.project;
  const hex = CAT_HEX[p.cat[0]];
  plaque.style.setProperty("--cat", hex);
  document.getElementById("plaque-date").textContent =
    `${fmtDate(p.date)} · ${p.cat.map((c) => CATEGORIES[c].label).join(" · ")}`;
  document.getElementById("plaque-title").textContent = p.title;
  document.getElementById("plaque-desc").textContent = p.desc;
  document.getElementById("plaque-tech").textContent = p.tech.join(" · ");
  const links = [];
  if (p.links.live) links.push(`<a href="${p.links.live}" target="_blank" rel="noopener">Zobacz na żywo ↗</a>`);
  if (p.links.tg) links.push(`<a href="${p.links.tg}" target="_blank" rel="noopener">Telegram ↗</a>`);
  if (p.links.repo) links.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">GitHub</a>`);
  if (p.links.npm) links.push(`<a href="${p.links.npm}" target="_blank" rel="noopener">npm</a>`);
  document.getElementById("plaque-links").innerHTML =
    links.join("") || `<span style="color:var(--ink-faint)">${p.access || "projekt niepubliczny"}</span>`;
  plaque.hidden = false;
}

function focusOn(hit) {
  focus = { hit, savedZ: targetZ };
  hit.userData.exhibit?.activate?.();
  openPlaque(hit);
}
function endFocus() {
  plaque.hidden = true;
  if (focus) { targetZ = focus.savedZ; focus = null; }
}
document.getElementById("plaque-close").addEventListener("click", endFocus);
addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* wejście: kółko / dotyk / klawiatura */
addEventListener("wheel", (e) => {
  if (focus || !listPanel.hidden) return;
  targetZ = THREE.MathUtils.clamp(targetZ + e.deltaY * 0.02, 0, maxZ());
  dismissHint();
}, { passive: true });

let touchY = null;
addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener("touchmove", (e) => {
  if (focus || !listPanel.hidden || touchY === null) return;
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  targetZ = THREE.MathUtils.clamp(targetZ + dy * 0.05, 0, maxZ());
  dismissHint();
}, { passive: true });

addEventListener("keydown", (e) => {
  if (focus || !listPanel.hidden) return;
  const step = e.key === "PageDown" || e.key === "PageUp" ? 12 : 3;
  if (["ArrowDown", "ArrowRight", "PageDown", "w", "W"].includes(e.key)) targetZ = Math.min(maxZ(), targetZ + step);
  if (["ArrowUp", "ArrowLeft", "PageUp", "s", "S"].includes(e.key)) targetZ = Math.max(0, targetZ - step);
  dismissHint();
});

function dismissHint() { if (!moved) { moved = true; setTimeout(() => hint.classList.add("gone"), 1200); } }

/* wskaźnik + klik przez raycaster */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // to był drag, nie klik
  pick(e);
  if (hovered) { if (focus && hovered === focus.hit) return; endFocus(); focusOn(hovered); }
  else if (focus) endFocus();
});
renderer.domElement.addEventListener("pointermove", (e) => { pick(e); });

function pick(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hitList = ray.intersectObjects(interactives, false);
  hovered = hitList.length ? hitList[0].object : null;
  renderer.domElement.style.cursor = hovered ? "pointer" : "default";
}

/* ── Lista eksponatów ─────────────────────────────────────────────────── */

const listPanel = document.getElementById("list-panel");
document.getElementById("btn-list").addEventListener("click", () => {
  listPanel.hidden = false;
});
function closeList() { listPanel.hidden = true; }
document.getElementById("list-close").addEventListener("click", closeList);

function buildList() {
  const body = document.getElementById("list-body");
  body.innerHTML = ERAS.map((era) => {
    const items = interactives
      .filter((h) => h.userData.project.era === era.id)
      .map((h) => {
        const p = h.userData.project;
        return `<button class="list-item" data-id="${p.id}">
          <span class="li-date">${fmtDate(p.date)}</span>${p.title}</button>`;
      }).join("");
    return `<p class="list-era">${era.range} · ${era.title}</p>${items}`;
  }).join("");
  body.addEventListener("click", (e) => {
    const btn = e.target.closest(".list-item");
    if (!btn) return;
    const hit = interactives.find((h) => h.userData.project.id === btn.dataset.id);
    if (!hit) return;
    closeList();
    endFocus();
    targetZ = THREE.MathUtils.clamp(-hit.position.z - 4, 0, maxZ());
    focusOn(hit);
  });
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

function eraAt(z) {
  const r = eraRanges.find((r) => z >= r.from && z < r.to);
  return r ? `${r.era.range} — ${r.era.title}` : "";
}

const clock = new THREE.Clock();
let firstFrame = true;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const ease = reduceMotion ? 0.5 : 0.06;
  if (focus) {
    const h = focus.hit;
    const side = h.userData.side;
    const goal = new THREE.Vector3(h.position.x - side * h.userData.focusDist * 0.55, 1.55, h.position.z + h.userData.focusDist);
    camera.position.lerp(goal, reduceMotion ? 1 : 0.08);
    const look = h.position.clone(); look.y = 1.2;
    camera.lookAt(look);
  } else {
    curZ += (targetZ - curZ) * ease;
    const sway = reduceMotion ? 0 : Math.sin(curZ * 0.3) * 0.4;
    camera.position.set(sway, 1.6, -curZ + 6);
    camera.lookAt(sway * 0.5, 1.35, -curZ - 6);
  }

  hudEra.textContent = eraAt(focus ? -focus.hit.position.z : curZ);
  for (const fn of tickers) {
    try { fn(t, dt); } catch (err) { console.error("tick error:", err); }
  }
  renderer.render(scene, camera);
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ── Start ────────────────────────────────────────────────────────────── */

Promise.all([
  document.fonts.load("700 46px Syne"),
  document.fonts.load("400 24px 'IBM Plex Mono'"),
  document.fonts.load("600 30px 'Schibsted Grotesk'"),
]).catch(() => {}).finally(() => {
  try {
    buildCorridor();
    buildFloor(zCursor);
    buildList();
  } catch (err) { console.error("build error:", err); }
  loop();
});
