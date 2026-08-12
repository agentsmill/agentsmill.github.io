import * as THREE from "three";
import { renderer, scene, camera, loader } from "kosmos/render.js";

const probny = new THREE.Mesh(
  new THREE.BoxGeometry(40, 40, 40),
  new THREE.MeshBasicMaterial({ color: 0x5cc8db, wireframe: true })
);
probny.name = "probny";
scene.add(probny);
window.__kosmos.probny = probny;

loader.classList.add("gotowe");

const zegar = new THREE.Clock();
function petla() {
  requestAnimationFrame(petla);
  const dt = Math.min(zegar.getDelta(), 0.05);
  probny.rotation.y += dt * 0.6;
  renderer.render(scene, camera);
}
petla();
