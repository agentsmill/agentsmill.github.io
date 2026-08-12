import { renderer, scene, camera, loader, backend } from "kosmos/render.js";
import { zbudujSwiat } from "kosmos/swiat.js";
import { zbudujNiebo, zbudujPyl } from "kosmos/mglawica.js";

zbudujSwiat();
zbudujNiebo();

/* Przy zapasie na WebGL 2 obniżamy liczbę cząstek, ale NIE usuwamy mgławic ani pyłu —
   gra ma być grywalna na obu backendach, tylko wolniej. */
const ILE_PYLU = backend === "WebGPU" ? 20000 : 6000;
const pyl = zbudujPyl(ILE_PYLU);

loader.classList.add("gotowe");

function petla() {
  requestAnimationFrame(petla);
  pyl.aktualizuj(camera);
  renderer.render(scene, camera);
}
petla();
