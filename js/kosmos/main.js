import { renderer, scene, camera, loader, backend } from "kosmos/render.js";
import { zbudujSwiat } from "kosmos/swiat.js";
import { zbudujNiebo, zbudujPyl } from "kosmos/mglawica.js";
import { zbudujCele, najblizszaNieodwiedzona, oznaczOdwiedzona, PROG_ODWIEDZENIA } from "kosmos/cele.js";

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
Object.assign(window.__kosmos, { sondy, licznik });

loader.classList.add("gotowe");

function petla() {
  requestAnimationFrame(petla);
  pyl.aktualizuj(camera);

  /* Sonda w zasięgu progu zapala ramkę i podbija licznik dokładnie raz — idempotencję
     pilnuje sama oznaczOdwiedzona() przez flagę `odwiedzona`, więc powtórne wejście w tę
     samą klatkę (albo wiele klatek w tym samym miejscu) nie liczy drugi raz. */
  const najblizsza = najblizszaNieodwiedzona(camera.position);
  if (najblizsza && najblizsza.dystans < PROG_ODWIEDZENIA) oznaczOdwiedzona(najblizsza.sonda);

  renderer.render(scene, camera);
}
petla();
