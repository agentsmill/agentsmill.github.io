import { renderer, scene, camera, loader } from "kosmos/render.js";
import { zbudujSwiat } from "kosmos/swiat.js";

zbudujSwiat();

loader.classList.add("gotowe");

function petla() {
  requestAnimationFrame(petla);
  renderer.render(scene, camera);
}
petla();
