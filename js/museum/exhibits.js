import * as THREE from "three";
import { M, bx as bxSurowe, CAT_HEX } from "muzeum/render.js";
import { dodajKolizje, zarejestruj, PRZEDSWIETLENIE } from "muzeum/sale.js";
import { plotno } from "muzeum/textures.js";

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

/* 9. Akordy Zmierzchu — gramofon. Płyta kręci się, gdy kompozycja naprawdę gra:
   stan odtwarzacza ogłasza js/gramofon.js w window.__gramofonGra. */
function exGramofon(hex) {
  const g = new THREE.Group();
  const baza = bx(0.48, 0.09, 0.38, M.body(0x4a2a18)); baza.position.y = 0.045; g.add(baza);
  const talerz = new THREE.Group();
  const plyta = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 48), new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.22 }));
  const etykieta = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.009, 32), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5 }));
  /* Płyta i etykieta to współosiowe walce jednego koloru — obrócone wokół osi wyglądają
     w każdym kącie tak samo, więc obrotu nie byłoby widać. Stąd nadruk na etykiecie:
     kremowy półksiężyc zachodzącego słońca z tytułem, nic w nim nie jest symetryczne.
     Przesunięcie głębi chroni przed migotaniem z górną ścianą walca etykiety. */
  const nadruk = new THREE.Mesh(new THREE.CircleGeometry(0.05, 48), new THREE.MeshStandardMaterial({
    roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    map: plotno(256, 256, (c) => {
      c.fillStyle = `#${new THREE.Color(hex).getHexString()}`; c.fillRect(0, 0, 256, 256);
      c.fillStyle = "#fff3d6"; c.beginPath(); c.arc(128, 128, 124, Math.PI, 2 * Math.PI); c.fill();
      c.fillStyle = "#2a1d12"; c.font = "600 30px 'Schibsted Grotesk'"; c.textAlign = "center";
      c.fillText("AKORDY", 128, 76, 190); c.fillText("ZMIERZCHU", 128, 112, 210);
      c.fillStyle = "#14110d"; c.beginPath(); c.arc(128, 128, 7, 0, 7); c.fill();   // otwór na trzpień
    }),
  }));
  nadruk.rotation.x = -Math.PI / 2; nadruk.position.y = 0.0047;
  talerz.add(plyta, etykieta, nadruk);
  talerz.position.set(-0.05, 0.095, 0);
  g.add(talerz);
  const ramie = bx(0.25, 0.012, 0.012, new THREE.MeshStandardMaterial({ color: 0xcfd2d8, roughness: 0.25, metalness: 1 }));
  ramie.position.set(0.1, 0.115, 0.1); ramie.rotation.y = 0.5; g.add(ramie);
  const tuba = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xb08a4a, roughness: 0.3, metalness: 1, side: THREE.DoubleSide }));
  tuba.position.set(0.16, 0.4, -0.1); tuba.rotation.set(0.9, 0, -0.5); tuba.castShadow = true; g.add(tuba);
  let obrot = 0;
  return {
    group: g,
    tick(t, dt) { if (window.__gramofonGra === true) obrot += dt * 3.49; talerz.rotation.y = -obrot; },   // 33⅓ obr./min = 3,49 rad/s
    activate() {},
  };
}

/* Jak stoi każdy eksponat autorski — czyta to plan.js, rezerwując na ścianie
   szerszy slot i miejsce na podstawę. „podest” — niska platforma 3 × 3 m pod
   dużą rzeźbą; „cokol” — wysoki postument pod małym przedmiotem. W pokoju
   Leona plan zamienia podest kolejki na tor dookoła pokoju („tor”). */
const PODSTAWY = {
  "age-of-agents": "podest", "empowerher": "podest", "reverie": "podest", "ekspres-leona": "podest",
  "token-drag-race": "podest", "lastbox": "podest", "naszwhisper": "podest", "anatomy": "podest",
  "akordy-zmierzchu": "cokol",
};

const EXHIBIT_BUILDERS = {
  "age-of-agents": exAgeOfAgents, "empowerher": exEmpowerHer, "reverie": exReverie,
  "ekspres-leona": exEkspres, "token-drag-race": exDragRace, "lastbox": exLastBox,
  "naszwhisper": exWhisper, "anatomy": exAnatomy, "akordy-zmierzchu": exGramofon,
};

// kolor i szorstkość podstawy w stylu sali
const PODSTAWA_STYLU = { palac: [0xe8e2d6, 0.28], biel: [0xf3f2ee, 0.9], noc: [0x0e1015, 0.35], zabawy: [0xfff4e6, 0.7], kino: [0x1a1416, 0.9] };

/* Eksponaty z planu: podstawa w stylu sali, eksponat przodem do osi sali,
   bryła kolizyjna (na widoczną masę, nie na poświatę — uwaga z 6 VIII:
   kolider poświaty zostawiał przy ścianie szczelinę), trafienie z punktem
   widoku i kotwica reflektora rzucającego cień. Kolejka w pokoju Leona
   („tor”) jeździ dookoła dywanu, bez podstawy i bez kolizji — to zabawka
   na podłodze. */
function postawEksponaty(plan, budynek) {
  const wynik = { interaktywne: [], tickery: [] };
  for (const s of plan.sale) for (const b of s.podstawy) {
    const budowniczy = EXHIBIT_BUILDERS[b.projekt.id];
    if (!budowniczy) continue;
    const p = b.projekt;
    const ex = budowniczy(new THREE.Color(CAT_HEX[p.cat[0]]).getHex());
    const [kolor, szorst] = PODSTAWA_STYLU[s.styl];
    const matPodstawy = new THREE.MeshStandardMaterial({ color: kolor, roughness: szorst });
    zarejestruj(budynek, s.id, matPodstawy, PRZEDSWIETLENIE[s.styl]);
    const g = new THREE.Group();
    g.position.set(b.x, 0, b.z);
    let wys = 0, kolizja = null;
    if (b.rodzaj === "podest") {
      const podest = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 3.0), matPodstawy);
      podest.position.y = 0.06; podest.castShadow = podest.receiveShadow = true; g.add(podest);
      if (s.styl === "noc") {   // bursztynowa linia u podstawy — podest unosi się w półmroku
        const kraw = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.025, 3.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2c46d).multiplyScalar(0.8) }));
        kraw.position.y = 0.0125; g.add(kraw);
      }
      wys = 0.12;
      kolizja = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 3.0));
      kolizja.position.set(b.x, 1.3, b.z);
    } else if (b.rodzaj === "cokol") {
      const cokol = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.02, 0.7), matPodstawy);
      cokol.position.y = 0.51; cokol.castShadow = cokol.receiveShadow = true; g.add(cokol);
      wys = 1.02;
      kolizja = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.6, 0.75));
      kolizja.position.set(b.x, 0.8, b.z);
    } else {
      ex.group.scale.setScalar(1.8);
    }
    ex.group.position.y = wys;
    // lokalne +Z eksponatu to jego przód (patrz dawny world.js): obracamy go ku osi sali
    if (b.sciana === "x+") g.rotation.y = -Math.PI / 2;
    else if (b.sciana === "x-") g.rotation.y = Math.PI / 2;
    g.add(ex.group);
    budynek.grupa.add(g);
    if (kolizja) dodajKolizje(budynek, kolizja, true, false);   // nie zasłania: bryła kolizyjna obejmuje rzeźbę (podest do 2,6 m), więc zakryłaby ją i obraz nad podestem
    if (ex.tick) wynik.tickery.push(ex.tick);

    const promien = b.rodzaj === "podest" ? 1.7 : b.rodzaj === "cokol" ? 0.6 : 3.0;
    /* Pośrednik pod kliknięcie: niewidoczna bryła większa od samego eksponatu. Kula jest
       jednostronna, więc od środka promień jej nie trafia — a po pokoju Leona chodzi się
       po dywanie, czyli wewnątrz toru. Tor dostaje więc niski walec dwustronny; 1,2 m
       sięga ponad komin lokomotywy (1,08 m), więc obejmuje cały pociąg. */
    const traf = b.rodzaj === "tor"
      ? new THREE.Mesh(new THREE.CylinderGeometry(promien, promien, 1.2, 32), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }))
      : new THREE.Mesh(new THREE.SphereGeometry(promien, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    traf.position.set(b.x, b.rodzaj === "tor" ? 0.6 : wys + (b.rodzaj === "cokol" ? 0.3 : 1.1), b.z);
    const kier = b.sciana === "x+" ? -1 : b.sciana === "x-" ? 1 : 0;
    const odl = b.rodzaj === "podest" ? 3.9 : 2.0;
    traf.userData = {
      project: p, salaId: s.id, exhibit: ex,
      widok: b.rodzaj === "tor"
        ? { pozycja: new THREE.Vector3(s.x0 + 1.4, 1.65, (s.z0 + s.z1) / 2), cel: new THREE.Vector3(b.x, 0.3, b.z) }
        : { pozycja: new THREE.Vector3(b.x + kier * odl, 1.65, b.z), cel: new THREE.Vector3(b.x, wys + 0.9, b.z) },
    };
    budynek.grupa.add(traf);
    wynik.interaktywne.push(traf);
    if (b.rodzaj !== "tor") {
      budynek.kotwice.push({
        salaId: s.id, typ: "spot", cien: true,
        pozycja: new THREE.Vector3(b.x + kier * 1.2, s.H - 0.25, b.z), cel: new THREE.Vector3(b.x, wys + 0.6, b.z),
        kat: 0.55, polcien: 0.6, zasieg: 0, kolor: 0xffe2b8, moc: 45,
      });
    }
  }
  return wynik;
}

export { EXHIBIT_BUILDERS, PODSTAWY, postawEksponaty };
