import * as THREE from "three";
import { M, bx as bxSurowe, textSprite, fmtDate } from "./render.js";

/* Bryły eksponatów w oświetlonych salach muszą rzucać cień — inaczej wiszą
   nad podłogą jak naklejki. Ale tylko te z materiału „body": M.glow i M.add są
   przezroczyste albo addytywne, a three.js liczy cień z samej głębokości
   i wyciąłby spod poświaty pełną, czarną plamę. */
function bx(w, h, d, mat) {
  const m = bxSurowe(w, h, d, mat);
  m.castShadow = m.receiveShadow = mat.isMeshStandardMaterial === true;
  return m;
}

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
  track.rotation.x = Math.PI / 2; track.position.y = 0.05; track.castShadow = true; g.add(track);
  const train = new THREE.Group();
  const loco = bx(0.5, 0.34, 0.3, M.glow(hex, 0.98)); loco.position.y = 0.28; train.add(loco);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.16, 8), M.body(0x2a3550));
  chimney.position.set(0.16, 0.52, 0); chimney.castShadow = true; train.add(chimney);
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
  mast.position.y = 1.5; mast.castShadow = true; g.add(mast);
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
  mic.position.y = 1.7; mic.castShadow = true; g.add(mic);
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

/* Oprawiony zrzut ekranu — ładowany asynchronicznie, znika jeśli pliku brak. */
const texLoader = new THREE.TextureLoader();
function framedShot(p, w = 2.2) {
  const g = new THREE.Group();
  const file = p.shot || `${p.id}.jpeg`;
  texLoader.load(
    `assets/shots/${file}`,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const ar = (tex.image?.width || 16) / (tex.image?.height || 10);
      const h = w / ar;
      const frame = bx(w + 0.12, h + 0.12, 0.05, M.body(0x0a0e16));
      const edge = bx(w + 0.16, h + 0.16, 0.02, M.glow(0x2a3550, 1));
      edge.position.z = -0.02;
      const pic = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })
      );
      pic.position.z = 0.031;
      g.add(edge, frame, pic);
      // delikatna poświata pod obrazem
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.7, h + 0.7),
        M.add(0xf2c46d, 0.05));
      halo.position.z = -0.05;
      g.add(halo);
    },
    undefined,
    () => {}          // brak pliku — po prostu nic nie dodajemy
  );
  return g;
}

/* Postument z hologramem dla pozostałych projektów */
function plinth(p, hex) {
  const g = new THREE.Group();
  const ped = bx(0.7, 0.9, 0.7, M.body(0x1a2438)); ped.position.y = 0.45; g.add(ped);
  const edge = bx(0.74, 0.03, 0.74, M.glow(hex, 0.8)); edge.position.y = 0.92; g.add(edge);
  const shot = framedShot(p, 1.5);
  shot.position.y = 2.05; g.add(shot);
  const label = textSprite(p.title, { font: "600 30px 'Schibsted Grotesk'", color: "#E9EDF5" });
  label.position.y = 1.45; g.add(label);
  const date = textSprite(fmtDate(p.date), { font: "400 22px 'IBM Plex Mono'", color: "#8C95A8" });
  date.position.y = 1.14; g.add(date);
  return {
    group: g,
    tick(t) {
      label.position.y = 1.45 + Math.sin(t * 0.8 + g.position.z) * 0.03;
      shot.position.y = 2.05 + Math.sin(t * 0.6 + g.position.z) * 0.04;
    },
    activate() {},
  };
}

export { EXHIBIT_BUILDERS, framedShot, plinth };
