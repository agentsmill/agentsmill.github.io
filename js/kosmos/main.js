import * as THREE from "three";
import { renderer, scene, camera, loader, backend } from "kosmos/render.js";
import { zbudujSwiat } from "kosmos/swiat.js";
import { zbudujNiebo, zbudujPyl } from "kosmos/mglawica.js";
import { zbudujCele, najblizszaNieodwiedzona, oznaczOdwiedzona, PROG_ODWIEDZENIA } from "kosmos/cele.js";
import { zbudujRakiete, wlaczSterowanieMysza } from "kosmos/rakieta.js";

zbudujSwiat();
zbudujNiebo();

/* Przy zapasie na WebGL 2 obniżamy liczbę cząstek, ale NIE usuwamy mgławic ani pyłu —
   gra ma być grywalna na obu backendach, tylko wolniej. */
const ILE_PYLU = backend === "WebGPU" ? 20000 : 6000;
const pyl = zbudujPyl(ILE_PYLU);

/* 49 sond z danych portfolio — jedna na projekt, deterministycznie na powłokach epok.
   sondy/licznik dopisane do window.__kosmos (stworzonego w render.js) dla diagnostyki
   i przyszłych zadań; renderer/scene/camera/backend zostają nietknięte. */
const { sondy, licznik } = zbudujCele();

/* Rakieta powstaje PO zbudujSwiat() i zbudujCele(), bo dystansDoNajblizszego() czyta
   POWLOKI[].pozycjaPlanety (wypełniane w zbudujSwiat) oraz tablicę sond. Przy odwrotnej
   kolejności rakieta na pierwszej klatce nie widziałaby żadnej przeszkody i ruszałaby
   pełną prędkością tuż obok gwiazdy. */
const rakieta = zbudujRakiete();
wlaczSterowanieMysza(renderer.domElement);

Object.assign(window.__kosmos, { sondy, licznik, rakieta });

loader.classList.add("gotowe");

const zegar = new THREE.Clock();

function petla() {
  requestAnimationFrame(petla);

  /* Klamrowanie dt: karta w tle wstrzymuje requestAnimationFrame, a po powrocie
     pierwsza klatka miałaby dt liczone w sekundach. Rakieta przeskoczyłaby wtedy
     kilkaset metrów w jednym kroku, minęła sondy bez zaliczenia i mogłaby wylądować
     w środku planety. */
  const dt = Math.min(zegar.getDelta(), 0.1);

  rakieta.aktualizuj(dt);
  pyl.aktualizuj(camera);

  /* Odległość mierzona od RAKIETY, nie od kamery. Kamera stoi 34 jednostki za
     statkiem i 11 nad nim, więc przy progu 90 zaliczenie wypadałoby z opóźnieniem
     i niesymetrycznie — sonda mijana z przodu liczyłaby się później niż ta sama
     sonda mijana od tyłu. */
  const najblizsza = najblizszaNieodwiedzona(rakieta.pozycja());
  if (najblizsza && najblizsza.dystans < PROG_ODWIEDZENIA) oznaczOdwiedzona(najblizsza.sonda);

  renderer.render(scene, camera);
}
petla();
