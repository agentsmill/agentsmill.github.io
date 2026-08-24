/* Mgławice ESA/Hubble na sferze nieba i pył pierwszego planu liczony w TSL.
   ZRODLA jest jedynym źródłem podpisów — wymóg licencji CC BY 4.0, nie ozdoba.
   Zasila panel „Źródła" z Zadania 7; nie dubluj tych danych w hud.js. */

import * as THREE from "three";
import { vec3, uniform, instanceIndex, hash, smoothstep, float, uv, texture } from "three/tsl";
import { scene, zasob } from "kosmos/render.js";

export const ZRODLA = [
  { plik: "filary.webp",       tytul: "Filary Stworzenia (Mgławica Orzeł, M16)", autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
  { plik: "orion.webp",        tytul: "Mgławica Oriona (M42)",                    autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
  { plik: "carina.webp",       tytul: "Mgławica Kila — narodziny gwiazd",         autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
  { plik: "konska-glowa.webp", tytul: "Mgławica Koński Łeb w podczerwieni",       autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
  { plik: "westerlund2.webp",  tytul: "Westerlund 2",                             autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
  { plik: "galaktyka.webp",    tytul: "Galaktyka spiralna z poprzeczką",          autor: "NASA, ESA/Hubble", licencja: "CC BY 4.0" },
];

const PROMIEN_NIEBA = 120000;   // tuż pod dalszą płaszczyzną kamery (200000)

/* Zdjęcia wiszą jako duże, dalekie płaty na wewnętrznej stronie sfery, mieszane
   addytywnie. Kluczowe: depthWrite:false i renderOrder ujemne, żeby nic ich nie
   przesłaniało i żeby same nie przesłaniały świata. */
export function zbudujNiebo() {
  const teksturomat = new THREE.TextureLoader();

  /* Rozmieszczenie deterministyczne: sześć płatów rozłożonych po sferze kątem
     wyprowadzonym z indeksu, nigdy Math.random(). Płaty CELOWO zachodzą na siebie
     (phiLength 1.9 przy odstępie 1.05) i sięgają różnych wysokości, bo przy sześciu
     rozłącznych prostokątach dolna półkula zostawała czarną dziurą. */
  const POCZATEK_THETA = [0.22, 1.18, 0.62, 1.62, 0.38, 1.34];

  const platy = ZRODLA.map((z, i) => {
    const mat = new THREE.MeshBasicNodeMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });

    /* KLUCZOWE dla wrażenia nieba, a nie tapety: wygaszenie przy krawędziach płata.
       Bez tego każde zdjęcie kończy się ostrą pionową i poziomą krechą — sześć
       prostokątów widocznych jak naklejki na szybie. Zanik po obu osiach UV zamienia
       twardy brzeg w miękkie przejście, a nakładające się płaty zlewają się w jedno.
       Liczone w TSL, więc kosztuje tyle samo na WebGPU i na WebGL 2. */
    const w = uv();
    const zanik = smoothstep(0.0, 0.30, w.x)
      .mul(smoothstep(1.0, 0.70, w.x))
      .mul(smoothstep(0.0, 0.26, w.y))
      .mul(smoothstep(1.0, 0.74, w.y));

    /* Dopóki zdjęcie nie dojdzie, płat jest całkowicie przezroczysty — inaczej
       przez pierwsze klatki na niebie wisi sześć jednolitych białych prostokątów. */
    mat.opacityNode = float(0.0);

    teksturomat.load(
      zasob(`assets/kosmos/mglawice/${z.plik}`),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        mat.colorNode = texture(t, w);
        mat.opacityNode = zanik.mul(0.85);
        mat.needsUpdate = true;
      },
      undefined,
      () => window.__bledy.push(`brak mgławicy: ${z.plik}`)
    );

    const faza = (i / ZRODLA.length) * Math.PI * 2;
    const geo = new THREE.SphereGeometry(
      PROMIEN_NIEBA, 32, 24, faza, 1.9, POCZATEK_THETA[i], 1.5);
    const plat = new THREE.Mesh(geo, mat);
    plat.renderOrder = -10;
    plat.frustumCulled = false;
    plat.name = `mglawica-${z.plik}`;
    scene.add(plat);
    return plat;
  });
  return { platy };
}

/* Pył daje zdjęciom paralaksę. Bez niego mgławice są płaską tapetą i cały kosmos
   wygląda na namalowany na szybie tuż przed kamerą. */
export function zbudujPyl(ile = 20000) {
  const poz = new Float32Array(ile * 3);
  const ZASIEG = 4000;
  for (let i = 0; i < ile; i++) {
    /* Deterministycznie z indeksu, nie z Math.random() — ten sam pył w każdym uruchomieniu. */
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233)  * 43758.5453;
    const c = Math.sin(i * 39.425)  * 43758.5453;
    poz[i * 3]     = ((a - Math.floor(a)) - 0.5) * ZASIEG;
    poz[i * 3 + 1] = ((b - Math.floor(b)) - 0.5) * ZASIEG;
    poz[i * 3 + 2] = ((c - Math.floor(c)) - 0.5) * ZASIEG;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(poz, 3));

  const mat = new THREE.PointsNodeMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const jasnosc = uniform(0.55);
  mat.colorNode = vec3(0.55, 0.72, 0.85).mul(jasnosc).mul(
    hash(instanceIndex).mul(0.6).add(0.4)
  );
  mat.opacityNode = smoothstep(0.0, 1.0, hash(instanceIndex.add(7))).mul(0.5);

  const punkty = new THREE.Points(geo, mat);
  punkty.name = "pyl";
  punkty.frustumCulled = false;
  scene.add(punkty);

  /* Pył podąża za kamerą, żeby nigdy się nie skończył — przesuwamy chmurę skokowo
     o pełny zasięg, gdy kamera wyjdzie poza jej połowę. Dzięki temu 20 000 punktów
     wystarcza na cały układ zamiast wypełniać 9000 metrów promienia. */
  function aktualizuj(kamera) {
    punkty.position.x = Math.round(kamera.position.x / ZASIEG) * ZASIEG;
    punkty.position.y = Math.round(kamera.position.y / ZASIEG) * ZASIEG;
    punkty.position.z = Math.round(kamera.position.z / ZASIEG) * ZASIEG;
  }
  return { punkty, aktualizuj, jasnosc };
}
