/* Cele Kosmosu: 49 sond zbudowanych z prawdziwych danych portfolio, jedna na projekt.
   PROJECTS/ERAS/CATEGORIES przychodzą jako globalne (wczytane zwykłym <script> przed
   modułami w kosmos.html) — nie importujemy ich, bo nie są modułem. Dzielimy dane,
   nie kod: zero importów z js/groza/ i js/museum/. */

import * as THREE from "three";
import { scene, zasob } from "kosmos/render.js";
import { POWLOKI } from "kosmos/swiat.js";

/* Zrzuty, które FAKTYCZNIE leżą w assets/shots. Ta lista siedzi tutaj, a nie w danych,
   bo js/projects-data.js jest plikiem nietykalnym.
   PRZY DODAWANIU ZRZUTU: wrzuć plik do assets/shots ORAZ dopisz nazwę poniżej. */
const ZRZUTY = new Set([
  "age-of-agents.jpeg", "ai-video-portfolio.jpeg", "anatomy.jpeg", "aule-energy.jpeg",
  "bajarz.jpeg", "bilans-tokenow.jpeg", "ekspres-leona.jpeg", "empowerher.jpeg",
  "korpolajf.jpeg", "lastbox.jpeg", "open-droids.jpeg", "oze-developer-manager.jpeg",
  "pokemate-hub.jpeg", "residual-stream.jpeg", "reverie.jpeg", "slyd.jpeg",
  "szkola-claude.jpeg", "tibijka.jpeg", "token-drag-race.jpeg", "token-golf.jpeg",
  "wdrozenie-ai.jpeg", "wspolnik.jpeg",
]);

/* Okładki wygenerowane modelem (Krea 2 na GB10) dla projektów bez zrzutu ekranu.
   Ta sama zasada co przy ZRZUTY: lista siedzi tutaj, bo js/projects-data.js jest
   nietykalny. Dzięki nim 27 światów przestaje być bryłami bez ekranu — a że to
   ilustracje, a nie zrzuty działających produktów, panel źródeł mówi o tym wprost. */
const OKLADKI = new Set([
  "akordy-zmierzchu", "aule-v1", "bielik", "flexmarket", "grafiki", "greensolver",
  "krwawy-biznes", "latent-weather", "mansa-musa", "math-garden", "mistrz-promptow",
  "naszwhisper", "neooffice", "npl", "oko-saurona", "omniportfolio", "orthank",
  "petent", "pokemate-engine", "pokescale", "pokesolver", "processor", "robotami",
  "silnik-bess", "stockcast", "stoik", "szkolenia-bank",
]);

/* Ziarno z identyfikatora projektu. Math.random() jest zabroniony: gracz ma móc wrócić
   do zapamiętanego celu, a przy losowaniu ten sam projekt leżałby gdzie indziej
   po każdym odświeżeniu. */
function ziarno(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;   // 0..1
}

/* Sondy jednej epoki leżą na wspólnym promieniu, rozłożone po kącie w kolejności daty.
   Wysokość rozrzucona ziarnem, żeby powłoka była pasem, a nie płaskim pierścieniem.

   POPRAWKA (runda 1 przeglądu): +0.5 do indeksu przesuwa CAŁY pierścień o pół slotu,
   jednolicie dla każdej epoki i każdego indeksu — kolejność chronologiczna i rozkład po
   epokach zostają bez zmian, zmienia się tylko kąt startowy. Bez tego przesunięcia sonda
   o indeks=0 (pierwszy chronologicznie projekt epoki) zawsze lądowała pod kątem 0°, a
   swiat.js (poza zakresem tego zadania, nietknięty) stawia PIERWSZĄ planetę (Merkury) też
   pod kątem 0° — sonda oze-developer-manager (epoka 1, indeks 0) wypadała 59,885 jedn. od
   środka Merkurego przy sumie promieni planety i sondy 161,4 (promień planety 130 +
   zasięg torusa 30+1,4), czyli w całości WEWNĄTRZ planety i trwale niewidoczna. Po
   przesunięciu minimalny margines w całym zbiorze 49 sond wynosi 268,2 (zob. raport). */
function pozycjaSondy(projekt, indeks, ile, powloka) {
  const kat = ((indeks + 0.5) / Math.max(ile, 1)) * Math.PI * 2;
  const r = powloka.promien;
  const y = (ziarno(projekt.id) - 0.5) * r * 0.16;
  return new THREE.Vector3(Math.cos(kat) * r, y, Math.sin(kat) * r);
}

const KOLORY = Object.fromEntries(
  Object.entries(CATEGORIES).map(([k, v]) => [k, new THREE.Color(v.color)])
);

/* Kolor bierze się z PIERWSZEJ kategorii w tablicy `cat` — projekt może mieć ich kilka
   (23 mają "produkty", 19 "aiml"), więc bez tej reguły wynik byłby niejednoznaczny. */
function kolorProjektu(p) {
  return KOLORY[p.cat?.[0]] ?? new THREE.Color(0x8899aa);
}

/* Promień świata projektu. Zakres, nie stała: pole 49 jednakowych kul wygląda
   jak wysypane koraliki. Ziarno z identyfikatora, więc ten sam projekt ma zawsze
   ten sam rozmiar. Górna granica trzyma się wyraźnie poniżej PROMIEN_PLANETY (130):
   planety epok mają zostać większe od projektów, bo to one dzielą historię na
   rozdziały. */
const PROMIEN_MIN = 42;
const PROMIEN_MAX = 78;

/* Nierówność powierzchni z sumy sinusoid — gładka, deterministyczna i bez tablic
   szumu. Trzy oktawy wystarczają, żeby sylwetka przestała być idealną kulą:
   to sylwetka, nie tekstura, decyduje, czy obiekt czyta się jako świat. */
function garb(x, y, z, f, faza) {
  return Math.sin(x * f + faza) * Math.sin(y * f * 1.31 + faza * 1.7) * Math.sin(z * f * 0.89 + faza * 2.3);
}

function ukształtuj(geo, promien, nasiono) {
  const poz = geo.attributes.position;
  const faza = nasiono * 31.4;
  const v = new THREE.Vector3();
  for (let i = 0; i < poz.count; i++) {
    v.fromBufferAttribute(poz, i).normalize();
    const g =
      garb(v.x, v.y, v.z, 1.7, faza) * 0.13 +
      garb(v.x, v.y, v.z, 3.4, faza * 1.6) * 0.06 +
      garb(v.x, v.y, v.z, 6.9, faza * 2.2) * 0.03;
    v.multiplyScalar(promien * (1 + g));
    poz.setXYZ(i, v.x, v.y, v.z);
  }
  poz.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/* Jeden projekt = jeden świat, do którego warto podlecieć: bryła o własnym
   kształcie, pierścień w barwie kategorii i — gdy istnieje zrzut — ekran nad
   biegunem. Wcześniej projekt był płaskim panelem 40x25 z cienką obręczą, czyli
   niczym, do czego dałoby się polecieć. */
function sonda(projekt) {
  const grupa = new THREE.Group();
  const kolor = kolorProjektu(projekt);
  const nasiono = ziarno(projekt.id);
  const promien = PROMIEN_MIN + nasiono * (PROMIEN_MAX - PROMIEN_MIN);

  const glob = new THREE.Mesh(
    ukształtuj(new THREE.IcosahedronGeometry(promien, 3), promien, nasiono),
    new THREE.MeshStandardMaterial({
      color: kolor.clone().multiplyScalar(0.55),
      roughness: 0.88, metalness: 0.08, flatShading: false,
    })
  );
  glob.name = "glob";
  grupa.add(glob);

  /* Ekran ze zrzutem stoi nad biegunem i ZAWSZE zwraca się do kamery: gracz
     nadlatuje z dowolnej strony, a zrzut ma być czytelny, nie ustawiony bokiem.
     Obracany w aktualizujCele(). */
  let ekran = null;
  const plik = projekt.shot || `${projekt.id}.jpeg`;
  const zrodloEkranu = ZRZUTY.has(plik)
    ? `assets/shots/${plik}`
    : (OKLADKI.has(projekt.id) ? `assets/okladki/${projekt.id}.webp` : null);
  if (zrodloEkranu) {
    ekran = new THREE.Mesh(
      new THREE.PlaneGeometry(promien * 1.5, promien * 0.94),
      new THREE.MeshBasicMaterial({ color: 0x8899aa, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ekran.position.y = promien * 1.75;
    ekran.name = "ekran";
    grupa.add(ekran);

    new THREE.TextureLoader().load(zasob(zrodloEkranu), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      ekran.material.map = t;
      ekran.material.opacity = 1;
      ekran.material.color.set(0xffffff);
      ekran.material.needsUpdate = true;
    });
  }
  // Każdy z 49 światów ma teraz ekran: 22 ze zrzutem działającego produktu,
  // 27 z okładką wygenerowaną modelem. Nigdy pustka i nigdy żądanie po plik,
  // którego nie ma — obie listy są jawne i sprawdzane przed użyciem.

  grupa.name = `sonda-${projekt.id}`;
  grupa.userData.projekt = projekt;
  return { grupa, promien, kolor, nasiono, ekran };
}

/* Stan modułu — mutowany w miejscu (nie przypisywany na nowo), żeby importy przez
   nazwaną wartość (Zadanie 6: `import { sondy } from "kosmos/cele.js"`) zawsze widziały
   aktualną zawartość. */
export const sondy = [];

/* Pierścienie wszystkich 49 światów w JEDNYM wywołaniu rysowania.

   Osobne siatki kosztowały 49 wywołań i podbijały licznik do 218, czyli ponad
   próg 200 z Zadania 8. Torus jest dla każdego świata ten sam co do kształtu —
   różni się wyłącznie położeniem, nachyleniem, skalą i barwą, a to wszystko
   mieści się w macierzy instancji i w barwie instancji. Dokładnie ten zabieg
   przewidywał plan („Panele sond przez InstancedMesh"). */
export let pierscienie = null;

function zbudujPierscienie(lista) {
  /* Torus o promieniu 1: całą wielkość niesie skala instancji, więc jedna
     geometria obsługuje światy o promieniach od 42 do 78. */
  const geo = new THREE.TorusGeometry(1, 0.0226, 8, 48);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.82 });

  const siatka = new THREE.InstancedMesh(geo, mat, lista.length);
  siatka.name = "pierscienie";
  siatka.frustumCulled = false;   // instancje rozsiane po całym układzie
  siatka.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const skala = new THREE.Vector3();

  lista.forEach((s, i) => {
    /* Nachylenie z ziarna — pole równoległych pierścieni wyglądałoby jak wydruk,
       nie jak układ. */
    e.set(Math.PI / 2 + (s.nasiono - 0.5) * 1.1, 0, s.nasiono * Math.PI);
    q.setFromEuler(e);
    skala.setScalar(s.promien * 1.55);
    m.compose(s.pozycja, q, skala);
    siatka.setMatrixAt(i, m);
    siatka.setColorAt(i, s.kolor);
    s.indeksPierscienia = i;
  });
  siatka.instanceMatrix.needsUpdate = true;
  siatka.instanceColor.needsUpdate = true;
  scene.add(siatka);
  return siatka;
}
export const licznik = { wszystkich: 0, odwiedzonych: 0 };

/* Buduje 49 sond z PROJECTS, grupuje po epoce (nie po kolejności w tablicy — projekty
   spoza jednej epoki NIE sąsiadują w PROJECTS), sortuje każdą grupę po dacie i rozmieszcza
   po kącie na promieniu właściwej powłoki. */
export function zbudujCele() {
  const poEpokach = new Map();
  for (const projekt of PROJECTS) {
    if (!poEpokach.has(projekt.era)) poEpokach.set(projekt.era, []);
    poEpokach.get(projekt.era).push(projekt);
  }
  for (const lista of poEpokach.values()) lista.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  for (const powloka of POWLOKI) {
    const projekty = poEpokach.get(powloka.epoka) || [];
    projekty.forEach((projekt, indeks) => {
      const pozycja = pozycjaSondy(projekt, indeks, projekty.length, powloka);
      const { grupa, promien, kolor, nasiono, ekran } = sonda(projekt);
      grupa.position.copy(pozycja);
      scene.add(grupa);
      sondy.push({ projekt, grupa, odwiedzona: false, pozycja, promien, kolor, nasiono, ekran });
    });
  }

  pierscienie = zbudujPierscienie(sondy);

  licznik.wszystkich = sondy.length;
  licznik.odwiedzonych = 0;

  return { sondy, licznik };
}

/* Jedna pętla dla obu pytań. Nawigacja pyta o nieodwiedzone (bo prowadzi do tego,
   czego gracz jeszcze nie widział), a tabliczka o dowolną najbliższą (bo do sondy
   wolno wrócić i przeczytać ją drugi raz). Dwie osobne pętle rozjechałyby się
   przy pierwszej zmianie definicji „najbliższej". */
function szukaj(poz, pomijajOdwiedzone) {
  let naj = null, najD = Infinity;
  for (const s of sondy) {
    if (pomijajOdwiedzone && s.odwiedzona) continue;
    const d = poz.distanceTo(s.pozycja);
    if (d < najD) { najD = d; naj = s; }
  }
  return naj ? { sonda: naj, dystans: najD } : null;
}

export function najblizszaNieodwiedzona(poz) { return szukaj(poz, true); }
export function najblizsza(poz) { return szukaj(poz, false); }

/* Próg liczony NAD POWIERZCHNIĄ świata, nie od jego środka. Światy mają teraz
   promienie 42..78, więc stała liczona od środka zaliczałaby mały świat z daleka,
   a przy dużym kazałaby wlecieć w grunt. */
export const PROG_ODWIEDZENIA = 85;   // metry nad powierzchnią

export function wysokoscNad(sonda, dystansOdSrodka) {
  return dystansOdSrodka - sonda.promien;
}

/* Ekrany zwrócone do kamery. 49 obrotów na klatkę to koszt pomijalny, a bez tego
   zrzut oglądany z boku jest niewidoczny — czyli dokładnie wtedy, gdy gracz
   dolatuje, żeby go obejrzeć. */
export function aktualizujCele(kamera) {
  for (const s of sondy) {
    if (s.ekran) s.ekran.lookAt(kamera.position);
  }
}

export function oznaczOdwiedzona(s) {
  if (s.odwiedzona) return false;
  s.odwiedzona = true;
  licznik.odwiedzonych++;
  /* Barwa instancji, nie materiału: materiał jest wspólny dla wszystkich 49
     pierścieni, więc zmiana na nim rozjaśniłaby cały układ naraz. */
  s.kolor.multiplyScalar(2.4);
  pierscienie.setColorAt(s.indeksPierscienia, s.kolor);
  pierscienie.instanceColor.needsUpdate = true;
  return true;                                              // true = to była nowa sonda
}
