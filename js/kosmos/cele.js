/* Cele Kosmosu: 49 sond zbudowanych z prawdziwych danych portfolio, jedna na projekt.
   PROJECTS/ERAS/CATEGORIES przychodzą jako globalne (wczytane zwykłym <script> przed
   modułami w kosmos.html) — nie importujemy ich, bo nie są modułem. Dzielimy dane,
   nie kod: zero importów z js/groza/ i js/museum/. */

import * as THREE from "three";
import { scene } from "kosmos/render.js";
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

function sonda(projekt) {
  const grupa = new THREE.Group();
  const kolor = kolorProjektu(projekt);

  // Ramka — zawsze, niezależnie od tego, czy jest zrzut.
  const ramka = new THREE.Mesh(
    new THREE.TorusGeometry(30, 1.4, 8, 4),
    new THREE.MeshBasicMaterial({ color: kolor })
  );
  ramka.rotation.z = Math.PI / 4;
  grupa.add(ramka);

  const plik = projekt.shot || `${projekt.id}.jpeg`;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 25),
    new THREE.MeshBasicMaterial({ color: kolor, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  grupa.add(panel);

  if (ZRZUTY.has(plik)) {
    new THREE.TextureLoader().load(`assets/shots/${plik}`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      panel.material.map = t;
      panel.material.opacity = 1;
      panel.material.color.set(0xffffff);
      panel.material.needsUpdate = true;
    });
  }
  // 27 projektów bez zbioru zostaje z barwnym panelem i ramką — nigdy z pustką
  // i nigdy z żądaniem po nieistniejący plik.

  grupa.name = `sonda-${projekt.id}`;
  grupa.userData.projekt = projekt;
  return grupa;
}

/* Stan modułu — mutowany w miejscu (nie przypisywany na nowo), żeby importy przez
   nazwaną wartość (Zadanie 6: `import { sondy } from "kosmos/cele.js"`) zawsze widziały
   aktualną zawartość. */
export const sondy = [];
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
      const grupa = sonda(projekt);
      grupa.position.copy(pozycja);
      scene.add(grupa);
      sondy.push({ projekt, grupa, odwiedzona: false, pozycja });
    });
  }

  licznik.wszystkich = sondy.length;
  licznik.odwiedzonych = 0;

  return { sondy, licznik };
}

export function najblizszaNieodwiedzona(poz) {
  let naj = null, najD = Infinity;
  for (const s of sondy) {
    if (s.odwiedzona) continue;
    const d = poz.distanceTo(s.pozycja);
    if (d < najD) { najD = d; naj = s; }
  }
  return naj ? { sonda: naj, dystans: najD } : null;
}

/* Eksportowany (poza literą interfejsu z briefu), żeby main.js — jedyne miejsce, gdzie
   kamera faktycznie się porusza — porównywało z TĄ SAMĄ liczbą, a nie duplikowało 90
   jako drugą magiczną stałą, która mogłaby się z czasem rozjechać. */
export const PROG_ODWIEDZENIA = 90;   // metry sceny; sonda ma promień ramki 30

export function oznaczOdwiedzona(s) {
  if (s.odwiedzona) return false;
  s.odwiedzona = true;
  licznik.odwiedzonych++;
  s.grupa.children[0].material.color.multiplyScalar(2.2);   // ramka rozjaśnia się na stałe
  return true;                                              // true = to była nowa sonda
}
