/* Warstwa renderowania Kosmosu. WebGPU z automatycznym zapasem na WebGL 2.
   Kształt import mapy i wymóg await init() opisane w kosmos.html. */

import * as THREE from "three";

window.__bledy = [];
addEventListener("error", (e) => window.__bledy.push(String(e.message)));
addEventListener("unhandledrejection", (e) => window.__bledy.push(String(e.reason)));

const host = document.getElementById("scene-host");
const loader = document.getElementById("k-loader");

/* Wymuszenie WebGL służy WYŁĄCZNIE kontroli negatywnej w testach: ?webgl=1 w adresie
   ma przełączyć plakietkę na "WebGL 2". Bez tego nie da się udowodnić, że wykrycie
   backendu w ogóle działa, a nie zwraca na stałe jednej wartości. */
const WYMUS_WEBGL = new URLSearchParams(location.search).has("webgl");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050c);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.5, 200000);
camera.position.set(0, 40, 260);

let renderer, backend;

try {
  renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: WYMUS_WEBGL });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  /* KLUCZOWE: WebGPURenderer startuje asynchronicznie. setAnimationLoop() załatwiłby to
     sam, ale main.js prowadzi własną pętlę na requestAnimationFrame — bez tej linijki
     pierwsza klatka trafia w niezainicjowany renderer i ekran zostaje czarny
     BEZ błędu w konsoli, czyli w najgorszy możliwy do zdiagnozowania sposób. */
  await renderer.init();

  backend = renderer.backend.isWebGPUBackend ? "WebGPU" : "WebGL 2";
  host.appendChild(renderer.domElement);
} catch (e) {
  window.__bledy.push("renderer: " + e.message);
  document.getElementById("k-brak-webgpu").hidden = false;
  loader.classList.add("gotowe");
  throw e;
}

document.getElementById("k-backend").textContent = backend;

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

window.__kosmos = { renderer, scene, camera, backend };

export { renderer, scene, camera, backend, host, loader };
