import * as THREE from "three";
import { renderer, camera, loader, backend } from "kosmos/render.js";
import { zbudujSwiat, powlokaDlaPromienia } from "kosmos/swiat.js";
import { zbudujNiebo, zbudujPyl } from "kosmos/mglawica.js";
import {
  zbudujCele, najblizszaNieodwiedzona, najblizsza, aktualizujCele,
  oznaczOdwiedzona, wysokoscNad, PROG_ODWIEDZENIA,
} from "kosmos/cele.js";
import { zbudujRakiete, wlaczSterowanieMysza } from "kosmos/rakieta.js";
import { zbudujObraz } from "kosmos/obraz.js";
import { zbudujHud } from "kosmos/hud.js";

zbudujSwiat();
zbudujNiebo();

/* Przy zapasie na WebGL 2 obniżamy liczbę cząstek, ale NIE usuwamy mgławic ani pyłu —
   gra ma być grywalna na obu backendach, tylko wolniej. */
const ILE_PYLU = backend === "WebGPU" ? 20000 : 6000;
const pyl = zbudujPyl(ILE_PYLU);

/* 49 sond z danych portfolio — jedna na projekt, deterministycznie na powłokach epok.
   sondy/licznik dopisane do window.__kosmos (stworzonego w render.js) dla diagnostyki;
   renderer/scene/camera/backend zostają nietknięte. */
const { sondy, licznik } = zbudujCele();

/* Rakieta powstaje PO zbudujSwiat() i zbudujCele(), bo dystansDoNajblizszego() czyta
   POWLOKI[].pozycjaPlanety (wypełniane w zbudujSwiat) oraz tablicę sond. Przy odwrotnej
   kolejności rakieta na pierwszej klatce nie widziałaby żadnej przeszkody i ruszałaby
   pełną prędkością tuż obok gwiazdy. */
const rakieta = zbudujRakiete();
wlaczSterowanieMysza(renderer.domElement);

const hud = zbudujHud();
hud.ustawLicznik(licznik.odwiedzonych, licznik.wszystkich);

/* Warstwa obrazu powstaje NA KOŃCU: pass(scene, camera) zapamiętuje scenę, więc
   wszystko, co ma być widoczne, musi już w niej stać. */
const obraz = zbudujObraz();

Object.assign(window.__kosmos, { sondy, licznik, rakieta, obraz, hud });

loader.classList.add("gotowe");

/* Podpowiedź sterowania znika po pierwszym ruchu gracza — jest instrukcją, nie
   elementem kadru, a kadr jest tu treścią. */
let podpowiedzZnikla = false;
function schowajPodpowiedz() {
  if (podpowiedzZnikla) return;
  podpowiedzZnikla = true;
  document.getElementById("k-sterowanie").classList.add("k-znika");
}
addEventListener("keydown", schowajPodpowiedz, { once: true });
addEventListener("mousedown", schowajPodpowiedz, { once: true });

/* ────────────────────────────────────────────────────────────────────────────
   Tabliczka: kiedy się pokazuje i kiedy znika

   Plan podaje pokazTabliczke() i schowajTabliczke(), ale świadomie nie mówi, KIEDY
   je wołać — a to decyzja o odczuciu z gry, nie detal techniczny. Wybrane tutaj:
   tabliczka pojawia się w promieniu czytania i znika po wyjściu z niego, więc jest
   informacją o TYM, obok czego właśnie jesteś, a nie ostatnim, co minąłeś.

   Dwa różne progi (histereza) są konieczne, nie ozdobne: przy jednym progu sonda
   mijana dokładnie na granicy właczałaby i wyłączała tabliczkę co klatkę, dając
   migotanie. Pokazujemy przy 260, chowamy dopiero przy 340.

   Alternatywa, gdyby to miało być muzeum, a nie lot: zatrzasnąć tabliczkę do czasu
   zbliżenia się do NASTĘPNEJ sondy — wtedy zawsze da się dokończyć czytanie, kosztem
   tego, że w kadrze wisi opis czegoś, co jest już daleko za plecami. */
const PROMIEN_CZYTANIA = 240;
const PROMIEN_SCHOWANIA = 330;

const zegar = new THREE.Clock();

async function petla() {
  requestAnimationFrame(petla);

  /* Sprawdzenie NA POCZĄTKU klatki, przed aktualizacją rakiety — inaczej rakieta
     przesunie się jeszcze o jedną klatkę po pokazaniu ekranu zakończenia. */
  if (hud.czyZamrozony()) {
    await obraz.renderuj();
    return;
  }

  /* Klamrowanie dt: karta w tle wstrzymuje requestAnimationFrame, a po powrocie
     pierwsza klatka miałaby dt liczone w sekundach. Rakieta przeskoczyłaby wtedy
     kilkaset metrów w jednym kroku, minęła sondy bez zaliczenia i mogłaby wylądować
     w środku planety. */
  const dt = Math.min(zegar.getDelta(), 0.1);

  rakieta.aktualizuj(dt);
  pyl.aktualizuj(camera);

  const poz = rakieta.pozycja();

  /* Odległość mierzona od RAKIETY, nie od kamery. Kamera stoi 34 jednostki za
     statkiem i 11 nad nim, więc przy progu 90 zaliczenie wypadałoby z opóźnieniem
     i niesymetrycznie — sonda mijana z przodu liczyłaby się później niż ta sama
     sonda mijana od tyłu. */
  const nieodwiedzona = najblizszaNieodwiedzona(poz);
  if (nieodwiedzona && wysokoscNad(nieodwiedzona.sonda, nieodwiedzona.dystans) < PROG_ODWIEDZENIA) {
    if (oznaczOdwiedzona(nieodwiedzona.sonda)) {
      hud.ustawLicznik(licznik.odwiedzonych, licznik.wszystkich);
      if (licznik.odwiedzonych >= licznik.wszystkich) hud.zwyciestwo();
    }
  }

  hud.ustawEpoke(powlokaDlaPromienia(poz.length()));
  hud.ustawKierunek(nieodwiedzona?.sonda ?? null,
    nieodwiedzona ? Math.max(0, wysokoscNad(nieodwiedzona.sonda, nieodwiedzona.dystans)) : 0);

  /* Także mierzone nad powierzchnią: przy świecie o promieniu 78 próg liczony
     od środka zapalałby tabliczkę, gdy gracz jest jeszcze 160 m nad gruntem,
     a przy najmniejszym dopiero po wlocie w bryłę. */
  const przy = najblizsza(poz);
  const wysokosc = przy ? wysokoscNad(przy.sonda, przy.dystans) : Infinity;
  if (przy && wysokosc < PROMIEN_CZYTANIA) hud.pokazTabliczke(przy.sonda.projekt);
  else if (wysokosc > PROMIEN_SCHOWANIA) hud.schowajTabliczke();

  aktualizujCele(camera);

  obraz.ustawTempo(rakieta.tempoWzgledne());
  await obraz.renderuj();
}
petla();
