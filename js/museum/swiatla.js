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

/* Opcje z poziomu jakości (render.js: jakosc): `pula` — liczba reflektorów i
   prostokątów, `lustro` — rozdzielczość odbicia posadzki nocy (0 — bez lustra),
   `cienie` — "pelne" (reflektory i słońce), "slonce" (tylko kierunkowe), "brak". */
export function initSwiatla({ plan, budynek, plamy = [], pula = { spot: 12, rect: 4 }, lustro: rozdzielczoscLustra = 1024, cienie = "pelne" }) {
  /* ── Pula ─────────────────────────────────────────────────────────── */
  const spoty = Array.from({ length: pula.spot }, (_, i) => {
    const s = new THREE.SpotLight(0xffffff, 0, 0, 0.5, 0.5, 2);
    if (i < 2 && cienie === "pelne") {   // dwa pierwsze miejsca puli rzucają cień — dostają je kotwice z `cien`
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
  slonce.castShadow = cienie !== "brak";
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
  /* Lustro leży 0,5 mm nad płytami posadzek sali bieżącej i następnej sali nocy
     i je zasłania; czarne płyty widać tam, gdzie lustra nie ma (pozostałe sale)
     oraz po wylaczLustro(). Siłę odbicia wyznacza wyłącznie jego `color`:
     szary 0x9a9a9a mnoży odbity obraz. */
  let lustro = null;
  if (rozdzielczoscLustra && plan.sale.some((s) => s.styl === "noc")) {
    lustro = new Reflector(new THREE.PlaneGeometry(1, 1), { textureWidth: rozdzielczoscLustra, textureHeight: rozdzielczoscLustra, color: 0x9a9a9a, clipBias: 0.003 });
    lustro.rotation.x = -Math.PI / 2;
    lustro.visible = false;
    const oryginal = lustro.onBeforeRender;
    lustro.onBeforeRender = function (r, sc, cam, ...reszta) {
      // przebieg normalnych GTAO renderuje scenę z materiałem zastępczym — odbicie jest już w tej klatce
      if (sc.overrideMaterial) return;
      oryginal.call(this, r, sc, cam, ...reszta);
    };
    scene.add(lustro);
  }
  function ustawLustro(s) {
    if (!lustro) return;
    if (s.styl !== "noc") {
      lustro.visible = false;
      return;
    }
    const nast = plan.sale.find((q) => q.styl === "noc" && Math.abs(q.z0 - s.z1) < 1e-6);
    const z0 = s.z0, z1 = (nast ?? s).z1;
    // dokładnie szerokość sali: połówka muru leży w prostokącie własnej sali, więc brzeg lustra chowa się pod murem i nie wchodzi do sąsiednich pomieszczeń
    lustro.scale.set(s.x1 - s.x0, z1 - z0, 1);
    lustro.position.set((s.x0 + s.x1) / 2, 0.0005, (z0 + z1) / 2);
    lustro.visible = true;
  }

  /* ── Przydział puli przy wejściu do sali ──────────────────────────── */

  /* Przydział po tożsamości: kotwica, która zostaje wybrana, zostaje na swoim
     miejscu puli. Przydział po kolejności (według odległości) dawał prawie
     każdemu miejscu inną kotwicę, a miejsce ze zmienioną kotwicą najpierw gaśnie
     — przy drzwiach gasła więc cała sala, choć te same światła miały świecić dalej
     (dwa świetliki, które tylko zamieniłyby się miejscami, gasły oba). Miejsca,
     których kotwica odpadła, przejmują nowo wybrane (najpierw ciemne, a miejsca
     z cieniem na końcu); reszta gaśnie. `wymagane` to kotwice z cieniem: muszą
     siedzieć na miejscach, których światło rzuca cień (0–1) — liczby świateł z
     cieniem nie wolno zmieniać, to rekompilacja shaderów. Zwykła kotwica na
     takim miejscu im ustępuje. */
  function rozdziel(miejsca, wybrane, wymagane = []) {
    const swieci = (p) => p.moc > 0;
    const zajete = new Set();
    for (const p of miejsca) {
      // światło, które świeci teraz, ma pierwszeństwo przed tym, które dopiero ma przyjść
      const k = [p.obecna, p.nastepna].find((x) => x && wybrane.includes(x) && !zajete.has(x)) ?? null;
      if (k) zajete.add(k);
      p.nastepna = k;
    }
    const cieniste = miejsca.filter((p) => p.swiatlo.castShadow);
    for (const z of wymagane.filter((x) => wybrane.includes(x))) {
      if (cieniste.some((p) => p.nastepna === z)) continue;
      const koszt = (p) => (p.nastepna ? 2 : swieci(p) ? 1 : 0);   // wolne ciemne < wolne gasnące < zajęte przez zwykłą kotwicę
      const p = cieniste.filter((q) => !wymagane.includes(q.nastepna)).sort((a, b) => koszt(a) - koszt(b))[0];
      if (!p) continue;
      for (const q of miejsca) if (q.nastepna === z) q.nastepna = null;   // zwalnia miejsce, na którym siedziała dotąd
      p.nastepna = z;
    }
    const siedzace = new Set(miejsca.map((p) => p.nastepna));
    const nowe = wybrane.filter((k) => !siedzace.has(k));
    const ranga = (p) => (cieniste.includes(p) ? 2 : 0) + (swieci(p) ? 1 : 0);   // miejsca z cieniem zostają dla kotwic z cieniem
    miejsca.filter((p) => !p.nastepna).sort((a, b) => ranga(a) - ranga(b))
      .forEach((p, i) => { p.nastepna = nowe[i] ?? null; });
  }

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
    // reflektory tylko w salach „realnych”: bieżąca najpierw, w sali bliższe kamerze; dwa z cieniem na początku wyboru
    const waga = (k) => (k.salaId === s.id ? 0 : 1000) + k.pozycja.distanceTo(camera.position);
    const kandydaci = budynek.kotwice.filter((k) => k.typ === "spot" && realne.has(k.salaId)).sort((a, b) => waga(a) - waga(b));
    const zCieniem = kandydaci.filter((k) => k.cien).slice(0, 2);
    const przydzSpot = [...zCieniem, ...kandydaci.filter((k) => !zCieniem.includes(k))].slice(0, spoty.length);

    rozdziel(prostokaty, przydzRect);
    rozdziel(spoty, przydzSpot, zCieniem);
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
     kotwicę i rozpala (~0,25 s) — ale tylko miejsce, które zmienia kotwicę (patrz
     rozdziel); kotwica, która zostaje, świeci bez przerwy. Przy ograniczonym ruchu
     zmiana jest natychmiastowa: nowa kotwica obejmuje miejsce w tej samej klatce,
     od razu na pełnej mocy. Liczba świateł nie zmienia się nigdy. */
  function animujPule(p, dt) {
    if (p.obecna !== p.nastepna) {
      if (reduceMotion) {
        p.obecna = p.nastepna;
        ustawGeometrie(p, p.obecna);
        p.moc = p.obecna?.moc ?? 0;
      } else {
        p.moc = Math.max(0, p.moc - dt * 8 * (p.obecna?.moc ?? 1));
        if (p.moc === 0) { p.obecna = p.nastepna; ustawGeometrie(p, p.obecna); }
      }
    } else if (p.obecna) {
      p.moc = Math.min(p.obecna.moc, p.moc + dt * 4 * p.obecna.moc);
    }
    p.swiatlo.intensity = reduceMotion && p.obecna === p.nastepna ? (p.obecna?.moc ?? 0) : p.moc;
  }

  return {
    get lustro() { return lustro; },   // getter: po wyłączeniu przez perf.js ma oddać null, nie stare lustro
    sala: () => biezaca,
    /* Wołane przez main.js przy każdej zmianie sali pod nogami gościa. */
    wejdz(s) {
      biezaca = s;
      przydziel(s);
    },
    /* Wyłączenie lustra na stałe — stopień degradacji z perf.js. Zwraca, czy
       było co wyłączyć (na niskim poziomie lustra nie ma od startu). */
    wylaczLustro() {
      if (!lustro) return false;
      scene.remove(lustro);
      lustro.dispose();
      lustro = null;
      return true;
    },
    /* Wyłączenie cieni na stałe — stopień degradacji z perf.js. Sama flaga
       renderera (shadowMap.enabled) tylko pomija przebieg map cieni: skompilowane
       shadery dalej próbkują ostatnie, zamrożone mapy. Dopiero castShadow = false
       zmienia liczbę świateł z cieniem, więc three.js kompiluje shadery od nowa
       — bez kodu cieni (jedna czkawka, którą strażnik i tak przeczekuje).
       Zwraca, czy coś rzucało cień (na niskim poziomie nic — stopień przechodzi dalej). */
    wylaczCienie() {
      let rzucalo = false;
      for (const p of spoty) if (p.swiatlo.castShadow) { p.swiatlo.castShadow = false; rzucalo = true; }
      if (slonce.castShadow) { slonce.castShadow = false; rzucalo = true; }
      return rzucalo;
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
