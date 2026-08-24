/* HUD Kosmosu: licznik, wskaźnik epoki, nawigacja do najbliższej sondy, tabliczka
   projektu, panel źródeł i ekran zakończenia.

   ERAS i PROJECTS przychodzą jako globalne z js/projects-data.js (zwykły <script>
   przed modułami) — pliku nietykalnego, tylko do odczytu. */

import * as THREE from "three";
import { camera } from "kosmos/render.js";
import { ZRODLA } from "kosmos/mglawica.js";
import { POWLOKI } from "kosmos/swiat.js";

/* ────────────────────────────────────────────────────────────────────────────
   Panel źródeł — wymóg licencyjny, nie ozdoba
   ──────────────────────────────────────────────────────────────────────────── */

/* Planety i rakieta mają własne wpisy, bo nie pochodzą z mglawica.js. Zdjęć mgławic
   NIE przepisujemy: dublowanie danych licencyjnych to gwarancja, że kiedyś się
   rozjadą i podpis przestanie być prawdziwy. Panel czyta ZRODLA. */
const ZRODLA_POZOSTALE = [
  { plik: "planety/*.webp",     tytul: "Mapy Merkurego, Wenus, Marsa i Plutona", autor: "USGS Astrogeology Science Center",   licencja: "domena publiczna" },
  { plik: "planety/ziemia.webp", tytul: "Blue Marble",                            autor: "NASA Earth Observatory",             licencja: "domena publiczna" },
  { plik: "planety/jowisz.webp", tytul: "Mapa walcowa Jowisza (Cassini)",         autor: "NASA/JPL/Space Science Institute",   licencja: "domena publiczna" },
  { plik: "rakieta.glb",         tytul: "Model statku — sonda Voyager",           autor: "NASA 3D Resources",                  licencja: "domena publiczna" },
];

function budujZrodla() {
  const panel = document.getElementById("k-zrodla-tresc");
  panel.replaceChildren();
  for (const z of [...ZRODLA, ...ZRODLA_POZOSTALE]) {
    const li = document.createElement("li");
    li.className = "k-zrodlo";
    li.textContent = `${z.tytul} — ${z.autor} (${z.licencja})`;
    panel.append(li);
  }
}

export function pokazZrodla() {
  document.getElementById("k-zrodla").hidden = false;
}

export function schowajZrodla() {
  document.getElementById("k-zrodla").hidden = true;
}

/* ────────────────────────────────────────────────────────────────────────────
   Epoka i licznik
   ──────────────────────────────────────────────────────────────────────────── */

let ostatniaEpoka = null;

/* Nazwa epoki bierze się z ERAS (js/projects-data.js), nie z POWLOKI[].nazwa.
   Obie tablice mają dziś te same tytuły, ale prawdziwym źródłem są dane portfolio;
   POWLOKI służy tu wyłącznie do zamiany numeru powłoki na numer epoki. */
export function ustawEpoke(nr) {
  if (nr === ostatniaEpoka) return;          // bez tego przepisujemy DOM co klatkę
  ostatniaEpoka = nr;

  const powloka = POWLOKI.find((p) => p.nr === nr);
  const epoka = ERAS.find((e) => e.id === powloka?.epoka);
  const el = document.getElementById("k-epoka");
  if (!epoka) { el.textContent = ""; return; }

  el.replaceChildren();
  const numer = document.createElement("span");
  numer.className = "k-epoka-numer";
  numer.textContent = `Epoka ${epoka.id}`;
  const tytul = document.createElement("span");
  tytul.className = "k-epoka-tytul";
  tytul.textContent = epoka.title;
  const zakres = document.createElement("span");
  zakres.className = "k-epoka-zakres";
  zakres.textContent = epoka.range;
  el.append(numer, tytul, zakres);

  /* Klasa restartuje animację wejścia: nazwa epoki ma się „wstawić" przy przekroczeniu
     granicy powłoki, bo inaczej zmiana w rogu ekranu przechodzi niezauważona. */
  el.classList.remove("k-wchodzi");
  void el.offsetWidth;
  el.classList.add("k-wchodzi");
}

export function ustawLicznik(ile, zIlu) {
  document.getElementById("k-licznik").textContent = `${ile}/${zIlu}`;
}

/* ────────────────────────────────────────────────────────────────────────────
   Nawigacja do najbliższej nieodwiedzonej sondy
   ──────────────────────────────────────────────────────────────────────────── */

const pomocniczy = new THREE.Vector3();

/* Strzałka obraca się ku sondzie w przestrzeni EKRANU, więc działa też wtedy, gdy
   cel jest za plecami: rzutowanie daje wtedy punkt za kamerą, który odwracamy,
   zamiast pokazywać strzałkę w przypadkową stronę. */
export function ustawKierunek(sonda, dystans) {
  const el = document.getElementById("k-nawigacja");
  if (!sonda) { el.hidden = true; return; }
  el.hidden = false;

  document.getElementById("k-nawigacja-nazwa").textContent = sonda.projekt.title;
  document.getElementById("k-nawigacja-dystans").textContent = `${Math.round(dystans)} m`;

  pomocniczy.copy(sonda.pozycja).project(camera);
  const zaPlecami = pomocniczy.z > 1;
  const x = zaPlecami ? -pomocniczy.x : pomocniczy.x;
  const y = zaPlecami ? -pomocniczy.y : pomocniczy.y;

  const kat = Math.atan2(x, y) * (180 / Math.PI);
  document.getElementById("k-nawigacja-strzalka").style.rotate = `${kat}deg`;
}

/* ────────────────────────────────────────────────────────────────────────────
   Tabliczka projektu
   ──────────────────────────────────────────────────────────────────────────── */

let pokazanyProjekt = null;

/* Tabliczka czyta z obiektu projektu i NIC nie dopisuje od siebie. Zakaz z ograniczeń
   globalnych: gra nie nazywa żadnego projektu nieudanym, porzuconym ani niedokończonym.
   `access: "repo prywatne"` znaczy tyle, że nie ma odnośnika — nic więcej, i nie wolno
   z tego robić adnotacji o jakości projektu. */
export function pokazTabliczke(p) {
  if (pokazanyProjekt === p.id) return;      // ta sama sonda nie przebudowuje DOM
  pokazanyProjekt = p.id;

  const el = document.getElementById("k-tabliczka");
  el.querySelector(".k-t-tytul").textContent = p.title;
  el.querySelector(".k-t-opis").textContent = p.desc;
  el.querySelector(".k-t-tech").textContent = (p.tech || []).join(" · ");

  const linki = el.querySelector(".k-t-linki");
  linki.replaceChildren();
  for (const [etykieta, klucz] of [["Zobacz na żywo", "live"], ["Repozytorium", "repo"]]) {
    const url = p.links?.[klucz];
    if (!url) continue;                       // brak odnośnika = brak przycisku, bez komentarza
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = etykieta;
    linki.append(a);
  }
  el.hidden = false;
}

export function schowajTabliczke() {
  pokazanyProjekt = null;
  document.getElementById("k-tabliczka").hidden = true;
}

/* ────────────────────────────────────────────────────────────────────────────
   Zakończenie
   ──────────────────────────────────────────────────────────────────────────── */

/* Zakończenie zamraża świat. Wzorzec z poprzedniej gry: ekran NIE MA metody chowającej
   i nie reaguje na Escape ani na kliknięcie obok — jedyne wyjście to odnośnik. Dzięki
   temu nie da się przypadkiem wrócić do zamrożonej gry i zobaczyć nieruchomego kosmosu. */
let zamrozony = false;
export function czyZamrozony() { return zamrozony; }

export function zwyciestwo() {
  if (zamrozony) return;
  zamrozony = true;
  document.exitPointerLock?.();              // inaczej kursor zostaje złapany nad ekranem końca
  document.getElementById("k-tabliczka").hidden = true;
  document.getElementById("k-nawigacja").hidden = true;
  document.getElementById("k-koniec").hidden = false;
}

/* ────────────────────────────────────────────────────────────────────────────
   Podpięcie
   ──────────────────────────────────────────────────────────────────────────── */

export function zbudujHud() {
  budujZrodla();

  document.getElementById("k-btn-zrodla").addEventListener("click", pokazZrodla);
  document.getElementById("k-zrodla-zamknij").addEventListener("click", schowajZrodla);

  /* Escape zamyka panel źródeł. Ekranu zakończenia NIE dotyczy — ten wychodzi
     wyłącznie odnośnikiem, zgodnie z wzorcem powyżej. */
  addEventListener("keydown", (e) => {
    if (e.code === "Escape") schowajZrodla();
  });

  return {
    ustawEpoke, ustawLicznik, ustawKierunek,
    pokazTabliczke, schowajTabliczke,
    pokazZrodla, schowajZrodla,
    zwyciestwo, czyZamrozony,
  };
}
