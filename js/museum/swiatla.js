/* Światło muzeum: stała pula świateł, przedświetlenie dalekich sal, lustro
   posadzki nocy, wypełnienie i adaptacja oka.

   Forward renderer three.js wlicza KAŻDE światło sceny do KAŻDEGO shadera,
   a zmiana ich liczby rekompiluje programy wszystkich materiałów. Dlatego
   liczba świateł jest stała przez całą wizytę: pula przesiada się na kotwice
   bieżącej sali i jej sąsiadów (kotwice zostawiają wystroj.js, zawieszenie.js
   i exhibits.js), a reszta budynku świeci „na niby” — przedświetleniem
   materiałów (sale.js) i plamami snopów na ścianach (zawieszenie.js). */

import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { scene, renderer, camera, bloom, reduceMotion } from "muzeum/render.js";

RectAreaLightUniformsLib.init();

// Na strefę (styl bieżącej sali): ekspozycja oka, siła odbić otoczenia, półkula, „słońce” przez strop.
const EKSPOZYCJA = { palac: 1.0, biel: 0.95, noc: 1.25, kino: 1.2, zabawy: 0.95 };
const SRODOWISKO = { palac: 0.22, biel: 0.36, noc: 0.04, kino: 0, zabawy: 0.3 };
const POLKULA = {
  palac: [0xfff1de, 0x3b2a1c, 0.3], biel: [0xffffff, 0xd6d1c7, 0.3], noc: [0x2c3a58, 0x07080b, 0.3],
  kino: [0x2a1f22, 0x050404, 0.15], zabawy: [0xfff6ec, 0xd8c9b8, 0.4],
};
const SLONCE = { palac: 0.3, biel: 0.3, noc: 0, kino: 0, zabawy: 0.35 };
/* Poświata (próg, siła) na strefę. W bieli białe ściany same przekraczają próg
   i poświata zalewała salę mleczną mgłą — tam praktycznie znika; w nocy świecą
   ekrany i szyldy, więc jest najmocniejsza. */
const POSWIATA = { palac: [0.85, 0.3], biel: [1.6, 0.15], noc: [0.8, 0.45], kino: [0.8, 0.4], zabawy: [1.2, 0.2] };
const CZAS_OKA = 0.4;          // stała czasowa adaptacji [s] — ok. 1,2 s do pełnego dojścia
const CZAS_PRZEJSCIA = 0.3;    // przedświetlenie i plamy [s]
/* Sala z prawdziwymi światłami zostawia sobie odrobinę udawania: wypełnia
   cienie odbitego światła, którego i tak nie liczymy. */
const RESZTKA_UDAWANIA = 0.12;

const wykladniczo = (dt, tau) => (reduceMotion ? 1 : 1 - Math.exp(-dt / tau));

export function initSwiatla({ plan, budynek, plamy = [], pula = { spot: 12, rect: 4 }, lustro: zLustrem = true }) {
  /* ── Pula ─────────────────────────────────────────────────────────── */
  const spoty = Array.from({ length: pula.spot }, (_, i) => {
    const s = new THREE.SpotLight(0xffffff, 0, 0, 0.5, 0.5, 2);
    if (i < 2) {   // dwa pierwsze miejsca puli rzucają cień — dostają je kotwice z `cien`
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
      s.shadow.bias = -0.0004;
    }
    scene.add(s, s.target);
    return { swiatlo: s, obecna: null, nastepna: null, moc: 0 };
  });
  const prostokaty = Array.from({ length: pula.rect }, () => {
    const r = new THREE.RectAreaLight(0xffffff, 0, 1, 1);
    scene.add(r);
    return { swiatlo: r, obecna: null, nastepna: null, moc: 0 };
  });
  const slonce = new THREE.DirectionalLight(0xfff6ea, 0);
  slonce.castShadow = true;
  slonce.shadow.mapSize.set(1024, 1024);
  slonce.shadow.bias = -0.0005;
  slonce.shadow.radius = 4;
  scene.add(slonce, slonce.target);
  const polkula = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);
  scene.add(polkula);

  /* ── Stan przejść ─────────────────────────────────────────────────── */
  const sale = new Map(plan.sale.map((s) => [s.id, { teraz: 1, cel: 1 }]));
  const plamyStan = plamy.map((m) => ({ m, baza: m.material.opacity, cel: m.material.opacity }));
  let biezaca = null;
  const celPolkuli = { niebo: new THREE.Color(), ziemia: new THREE.Color(), sila: 0.3 };
  let celSlonca = 0;

  /* ── Lustro posadzki nocy ─────────────────────────────────────────── */
  const nakladki = budynek.posadzkiNocy;
  let lustro = null;
  if (zLustrem && nakladki.length) {
    lustro = new Reflector(new THREE.PlaneGeometry(1, 1), { textureWidth: 1024, textureHeight: 1024, color: 0x9a9a9a, clipBias: 0.003 });
    lustro.rotation.x = -Math.PI / 2;
    lustro.visible = false;
    const oryginal = lustro.onBeforeRender;
    lustro.onBeforeRender = function (r, sc, cam, ...reszta) {
      // przebieg normalnych GTAO renderuje scenę z materiałem zastępczym — odbicie jest już w tej klatce
      if (sc.overrideMaterial) return;
      for (const n of nakladki) n.visible = false;      // nakładka nad lustrem nie może się w nim odbić
      oryginal.call(this, r, sc, cam, ...reszta);
      for (const n of nakladki) n.visible = true;
    };
    scene.add(lustro);
  }
  function ustawLustro(s) {
    if (!lustro) return;
    if (s.styl !== "noc") {
      lustro.visible = false;
      for (const n of nakladki) n.material.opacity = 1;
      return;
    }
    const nast = plan.sale.find((q) => q.styl === "noc" && Math.abs(q.z0 - s.z1) < 1e-6);
    const z0 = s.z0, z1 = (nast ?? s).z1;
    lustro.scale.set(s.x1 - s.x0 + 2, z1 - z0, 1);
    lustro.position.set((s.x0 + s.x1) / 2, 0.0005, (z0 + z1) / 2);
    lustro.visible = true;
    for (const n of nakladki) n.material.opacity = n.userData.salaId === s.id || n.userData.salaId === nast?.id ? 0.84 : 1;
  }

  /* ── Przydział puli przy wejściu do sali ──────────────────────────── */
  function przydziel(s) {
    const sasiedzi = new Set([s.id]);
    for (const d of plan.drzwi) {
      if (d.a === s.id && d.b) sasiedzi.add(d.b);
      if (d.b === s.id) sasiedzi.add(d.a);
    }
    const odl = (q) => Math.hypot((q.x0 + q.x1) / 2 - camera.position.x, (q.z0 + q.z1) / 2 - camera.position.z);
    const kolejnosc = [s, ...plan.sale.filter((q) => q !== s && sasiedzi.has(q.id)).sort((a, b) => odl(a) - odl(b))];

    // wypełnienie (prostokąty): cała sala albo nic — inaczej pół sali świeciłoby podwójnie
    const realne = new Set();
    const przydzRect = [];
    for (const q of kolejnosc) {
      const k = budynek.kotwice.filter((x) => x.salaId === q.id && x.typ === "rect");
      if (przydzRect.length + k.length <= prostokaty.length) { przydzRect.push(...k); realne.add(q.id); }
    }
    // reflektory tylko w salach „realnych”: bieżąca najpierw, w sali bliższe kamerze; dwa z cieniem na początek puli
    const waga = (k) => (k.salaId === s.id ? 0 : 1000) + k.pozycja.distanceTo(camera.position);
    const kandydaci = budynek.kotwice.filter((k) => k.typ === "spot" && realne.has(k.salaId)).sort((a, b) => waga(a) - waga(b));
    const zCieniem = kandydaci.filter((k) => k.cien).slice(0, 2);
    const przydzSpot = [...zCieniem, ...kandydaci.filter((k) => !zCieniem.includes(k))].slice(0, spoty.length);

    prostokaty.forEach((p, i) => { p.nastepna = przydzRect[i] ?? null; });
    spoty.forEach((p, i) => { p.nastepna = przydzSpot[i] ?? null; });
    const swiecace = new Set(przydzSpot);
    for (const p of plamyStan) p.cel = swiecace.has(p.m.userData.kotwica) ? 0 : p.baza;
    for (const [id, st] of sale) st.cel = realne.has(id) ? RESZTKA_UDAWANIA : 1;

    // „słońce” przez strop bieżącej sali: cień ławek i podestów
    const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, r = Math.max(s.x1 - s.x0, s.z1 - s.z0) / 2 + 1;
    slonce.position.set(cx + 2, s.H + 6, cz + 3);
    slonce.target.position.set(cx, 0, cz);
    slonce.target.updateMatrixWorld();
    Object.assign(slonce.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: s.H + 14 });
    slonce.shadow.camera.updateProjectionMatrix();
    celSlonca = SLONCE[s.styl] ?? 0;
    const [niebo, ziemia, sila] = POLKULA[s.styl];
    celPolkuli.niebo.setHex(niebo); celPolkuli.ziemia.setHex(ziemia); celPolkuli.sila = sila;
    ustawLustro(s);
  }

  function ustawGeometrie(p, k) {
    const l = p.swiatlo;
    if (!k) return;
    l.color.setHex(k.kolor);
    l.position.copy(k.pozycja);
    if (l.isRectAreaLight) {
      l.width = k.szer; l.height = k.wys;
      if (k.kierunek === "dol") l.rotation.set(-Math.PI / 2, 0, 0); else l.lookAt(k.cel);
    } else {
      l.angle = k.kat; l.penumbra = k.polcien; l.distance = k.zasieg ?? 0;
      l.target.position.copy(k.cel);
      l.target.updateMatrixWorld();
    }
  }

  /* Przesiadka bez skoku: światło gaśnie (~0,12 s), przenosi się na nową
     kotwicę i rozpala (~0,25 s). Liczba świateł nie zmienia się nigdy. */
  function animujPule(p, dt) {
    if (p.obecna !== p.nastepna) {
      p.moc = Math.max(0, p.moc - dt * 8 * (p.obecna?.moc ?? 1));
      if (p.moc === 0) { p.obecna = p.nastepna; ustawGeometrie(p, p.obecna); }
    } else if (p.obecna) {
      p.moc = Math.min(p.obecna.moc, p.moc + dt * 4 * p.obecna.moc);
    }
    p.swiatlo.intensity = reduceMotion && p.obecna === p.nastepna ? (p.obecna?.moc ?? 0) : p.moc;
  }

  return {
    lustro,
    sala: () => biezaca,
    /* Wołane przez main.js przy każdej zmianie sali pod nogami gościa. */
    wejdz(s) {
      biezaca = s;
      przydziel(s);
    },
    /* Wyłączenie lustra na stałe — stopień degradacji z perf.js (Zadanie 10). */
    wylaczLustro() {
      if (!lustro) return;
      scene.remove(lustro);
      lustro = null;
      for (const n of nakladki) n.material.opacity = 1;
    },
    aktualizuj(dt) {
      if (!biezaca) return;
      for (const p of spoty) animujPule(p, dt);
      for (const p of prostokaty) animujPule(p, dt);
      const k = wykladniczo(dt, CZAS_PRZEJSCIA);
      for (const [id, st] of sale) {
        if (Math.abs(st.cel - st.teraz) < 0.001) continue;
        st.teraz += (st.cel - st.teraz) * k;
        if (Math.abs(st.cel - st.teraz) < 0.001) st.teraz = st.cel;
        for (const ustaw of budynek.materialySal.get(id)) ustaw(st.teraz);
      }
      for (const p of plamyStan) p.m.material.opacity += (p.cel - p.m.material.opacity) * k;
      // adaptacja oka i nastrój strefy
      const oko = wykladniczo(dt, CZAS_OKA);
      renderer.toneMappingExposure += ((EKSPOZYCJA[biezaca.styl] ?? 1) - renderer.toneMappingExposure) * oko;
      scene.environmentIntensity += ((SRODOWISKO[biezaca.styl] ?? 0.2) - scene.environmentIntensity) * oko;
      polkula.color.lerp(celPolkuli.niebo, oko);
      polkula.groundColor.lerp(celPolkuli.ziemia, oko);
      polkula.intensity += (celPolkuli.sila - polkula.intensity) * oko;
      slonce.intensity += (celSlonca - slonce.intensity) * oko;
      const [prog, sila] = POSWIATA[biezaca.styl] ?? [0.85, 0.35];
      bloom.threshold += (prog - bloom.threshold) * oko;
      bloom.strength += (sila - bloom.strength) * oko;
    },
  };
}
