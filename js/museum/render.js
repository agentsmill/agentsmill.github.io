/* Muzeum Budowania — spacer po szynach przez 16 miesięcy.
   Dane: js/projects-data.js (PROJECTS, ERAS, MILESTONES, HEARTBEAT, CATEGORIES). */

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

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1018);
scene.fog = new THREE.Fog(0x0c1018, 10, 60);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 1.6, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

// Mapa środowiskowa generowana proceduralnie — 0 bajtów do pobrania, a bez niej
// materiały z metalness nie mają czego odbijać i wyglądają jak matowy plastik.
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;   // muzeum ma być ciemne; pełna siła je rozmywa

// go() dostaje właściwe ciało w main.js, gdy powstaje gracz i jego teleportuj() —
// tutaj tylko placeholder, żeby klucz istniał od razu i był nieszkodliwy dopóty,
// dopóki nie ma jeszcze warstwy kolizyjnej, po której miałby kogo przenosić.
window.__mz = { renderer, scene, camera, composer: null, bloom: null, go: () => {} };   // uchwyt diagnostyczny (nieszkodliwy)

scene.add(new THREE.AmbientLight(0x8899bb, 0.5));
const hemi = new THREE.HemisphereLight(0x35507a, 0x0c1018, 0.55);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xf2c46d, 0.35);
key.position.set(3, 8, 2);
scene.add(key);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// (rozdzielczość, siła, promień, próg) — kolejność zweryfikowana w źródle r169
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.4, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
window.__mz.composer = composer;
window.__mz.bloom = bloom;

/* ── Tekst na sprite'ach ──────────────────────────────────────────────── */

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
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sp = new THREE.Sprite(mat);
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

export { renderer, scene, camera, composer, bloom, M, textSprite, bx, reduceMotion, CAT_HEX, fmtDate };
