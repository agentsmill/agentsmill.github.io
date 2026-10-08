/* Warstwa renderowania muzeum: renderer, scena, kamera, kompozytor i drobni
   pomocnicy. Dane: js/projects-data.js (PROJECTS, ERAS, CATEGORIES) — globalne. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

window.__errs = [];
addEventListener("error", (e) => window.__errs.push(String(e.message)));
addEventListener("unhandledrejection", (e) => window.__errs.push(String(e.reason)));

/* ── Podstawy ─────────────────────────────────────────────────────────── */

const host = document.getElementById("scene-host");
const loader = document.getElementById("loader");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}
if (!webglOK()) {
  document.getElementById("no-webgl").hidden = false;
  loader.classList.add("done");
  throw new Error("WebGL unavailable");
}

const ROMAN = { "01":"I","02":"II","03":"III","04":"IV","05":"V","06":"VI","07":"VII","08":"VIII","09":"IX","10":"X","11":"XI","12":"XII" };
const fmtDate = (d) => { const [y, m] = d.split("-"); return `${ROMAN[m]} ${y}`; };
const CAT_HEX = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dotykowy = matchMedia("(pointer: coarse)").matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);

/* Bez mgły: to wnętrza, a widok na wylot przez całą amfiladę (ok. 150 m) jest
   celem projektu. Daleka płaszczyzna z zapasem na tę długość, bliska mała,
   bo gość podchodzi do ram i tabliczek na kilkadziesiąt centymetrów.
   Kolejność YXZ — odchylenie, potem pochylenie — tak liczą PointerLockControls
   i przeciąganie, więc kamera nie przekrzywia się przy rozglądaniu. */
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.05, 220);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
/* Gęstość pikseli zależna od urządzenia: na telefonie limit 1,25 zamiast 1,75
   to ponad dwa razy mniej pikseli na klatkę przy niewidocznej różnicy. */
renderer.setPixelRatio(Math.min(devicePixelRatio, dotykowy ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

// Mapa środowiskowa z kodu — 0 bajtów do pobrania. Siłę per strefa ustawia swiatla.js.
const pmrem = new THREE.PMREMGenerator(renderer);
const srodowisko = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = srodowisko;
scene.environmentIntensity = 0.15;

// go() dostaje ciało w main.js, gdy powstaje gracz — tu tylko nieszkodliwy zaczep.
window.__mz = { renderer, scene, camera, composer: null, bloom: null, go: () => {} };

/* MSAA w celu kompozytora: `antialias` renderera nie obejmuje rysowania do
   celu pośredniego, a bez wygładzania listwy, ramy i opaski drzwi strzępią się. */
const cel = new THREE.WebGLRenderTarget(16, 16, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, cel);
composer.addPass(new RenderPass(scene, camera));
// (rozdzielczość, siła, promień, próg) — wysoki próg: świecą ekrany, szyldy i progi, nie ściany
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
window.__mz.composer = composer;
window.__mz.bloom = bloom;

/* ── Tekst na sprite'ach (już tylko dla eksponatów autorskich; znika w Zadaniu 4) ── */

function textSprite(text, { font = "500 34px 'IBM Plex Mono'", color = "#8C95A8", pad = 18, maxW = 760 } = {}) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = font;
  const w = Math.min(maxW, Math.ceil(ctx.measureText(text).width)) + pad * 2;
  const lineH = parseInt(font.match(/(\d+)px/)[1], 10) * 1.35;
  c.width = w * 2; c.height = Math.ceil(lineH + pad * 2) * 2;
  const ctx2 = c.getContext("2d");
  ctx2.scale(2, 2);
  ctx2.font = font;
  ctx2.fillStyle = color;
  ctx2.textBaseline = "middle";
  ctx2.fillText(text, pad, (lineH + pad * 2) / 2, maxW);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const scale = 0.0075;
  sp.scale.set(c.width * scale / 2, c.height * scale / 2, 1);
  return sp;
}

/* ── Budowniczowie eksponatów ─────────────────────────────────────────── */

const M = {
  body: (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 }),
  glow: (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity }),
  add:  (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
};

function bx(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

export { renderer, scene, camera, composer, bloom, srodowisko, M, textSprite, bx, reduceMotion, dotykowy, CAT_HEX, fmtDate };
