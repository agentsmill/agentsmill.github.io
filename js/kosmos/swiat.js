/* Świat Kosmosu: gwiazda w środku i sześć powłok orbitalnych z prawdziwymi planetami.
   Promień powłoki rośnie z datą — lot na zewnątrz jest lotem w przód przez historię autora. */

import * as THREE from "three";
import { scene } from "kosmos/render.js";
import { zbudujGwiazde, atmosfera } from "kosmos/gwiazda.js";

/* Sześć powłok. Promień rośnie z datą — lot na zewnątrz jest lotem w przód przez historię.
   Liczby projektów pochodzą z js/projects-data.js i są tu tylko komentarzem; prawdziwe
   źródło zliczania to Zadanie 5, które czyta dane. */
export const POWLOKI = [
  { nr: 1, epoka: 1, nazwa: "Pierwsze eksperymenty", promien:  1200, planeta: "merkury", otoczka: 0x6b6257 },  //  5 projektów
  { nr: 2, epoka: 2, nazwa: "Pierwsze cuda z MCP",   promien:  2000, planeta: "wenus"  , otoczka: 0xd8b070 },  //  1 projekt
  { nr: 3, epoka: 3, nazwa: "Narzędzia domenowe",    promien:  2900, planeta: "ziemia" , otoczka: 0x4a9fe0 },  //  4 projekty
  { nr: 4, epoka: 4, nazwa: "W stronę produktów",    promien:  3900, planeta: "mars"   , otoczka: 0xc4643a },  //  2 projekty
  { nr: 5, epoka: 5, nazwa: "Rok agentów",           promien:  6200, planeta: "jowisz" , otoczka: 0xd2a878 },  // 20 projektów
  { nr: 6, epoka: 6, nazwa: "Studio jednoosobowe",   promien:  9000, planeta: "pluton" , otoczka: 0x7fa8c8 },  // 17 projektów
];

/* Granica między powłokami leży w połowie odległości między ich promieniami.
   Poniżej pierwszej granicy jesteś w powłoce 1, powyżej ostatniej — w 6. */
export function powlokaDlaPromienia(r) {
  for (let i = 0; i < POWLOKI.length - 1; i++) {
    const granica = (POWLOKI[i].promien + POWLOKI[i + 1].promien) / 2;
    if (r < granica) return POWLOKI[i].nr;
  }
  return POWLOKI[POWLOKI.length - 1].nr;
}

const teksturomat = new THREE.TextureLoader();

/* Promień planety jest ozdobny, nie skalowy — prawdziwe proporcje dałyby
   niewidoczne kropki przy tych odległościach. */
export const PROMIEN_PLANETY = 130;

function planeta(nazwa, barwaOtoczki) {
  const geo = new THREE.SphereGeometry(PROMIEN_PLANETY, 64, 32);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0.0 });
  const siatka = new THREE.Mesh(geo, mat);

  teksturomat.load(
    `assets/kosmos/planety/${nazwa}.webp`,
    (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; mat.map = t; mat.needsUpdate = true; },
    undefined,
    () => window.__bledy.push(`brak mapy planety: ${nazwa}`)
  );

  /* Atmosfera jako dziecko planety: jedna transformacja, jedna pozycja, zero szans
     na rozjechanie się otoczki z globem przy późniejszym strojeniu orbit. */
  siatka.add(atmosfera(PROMIEN_PLANETY, new THREE.Color(barwaOtoczki)));

  siatka.name = `planeta-${nazwa}`;
  return siatka;
}

export function zbudujSwiat() {
  /* Gwiazda mieszka w osobnym module: jest shaderowa i jest centrum kadru,
     a swiat.js ma zostać plikiem o geometrii układu, nie o wyglądzie fotosfery. */
  const { grupa: gwiazda } = zbudujGwiazde();

  const swiatlo = new THREE.PointLight(0xfff2d0, 3.0, 0, 0.0);
  scene.add(swiatlo);
  scene.add(new THREE.AmbientLight(0x334455, 0.35));

  const planety = POWLOKI.map((p, i) => {
    const kat = (i / POWLOKI.length) * Math.PI * 2;
    const m = planeta(p.planeta, p.otoczka);
    m.position.set(Math.cos(kat) * p.promien, 0, Math.sin(kat) * p.promien);
    scene.add(m);
    p.pozycjaPlanety = m.position.clone();
    return m;
  });

  return { powloki: POWLOKI, planety, gwiazda };
}
