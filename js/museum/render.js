/* Warstwa renderowania muzeum: renderer, scena, kamera, kompozytor i drobni
   pomocnicy. Dane: js/projects-data.js (PROJECTS, ERAS, CATEGORIES) — globalne. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
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

/* ── Poziom jakości ───────────────────────────────────────────────────────
   Start z detekcji: telefon i tablet (pointer: coarse) na niskim, słabszy
   komputer (≤ 4 wątki) na średnim, reszta na wysokim; `?jakosc=` w adresie
   wymusza poziom (testy, porównania). Dalej pilnuje perf.js — degradacja
   jednokierunkowa GTAO → lustro → cienie → rozdzielczość.
   Pomiar (MacBook, 1440 × 900, atrium na wylot — najgorszy kadr): bez GTAO
   79 fps; GTAO w pełnej rozdzielczości 38; w połowie 58–61 przy DPR 1,75
   i 79 przy DPR 1,5. Stąd wysoki = DPR 1,5 i okluzja zawsze w połowie (różnica
   względem pełnej: poniżej 1/255 jasności pod ławką i w narożniku); 8 próbek
   zamiast 16 oszczędzało ledwie 4 %, więc wszędzie, gdzie jest GTAO, jest 16.
   Prostokątów zawsze 4: sala nocy ma ich tyle (podświetlenia ścian i progu),
   a pula przydziela je całymi salami — mniejsza zostawiłaby noc bez świateł. */
const POZIOMY = {
  wysoki: { dpr: 1.5, gtao: true, lustro: 1024, cienie: "pelne", pula: { spot: 12, rect: 4 }, leniwe: false },
  sredni: { dpr: 1.25, gtao: true, lustro: 512, cienie: "slonce", pula: { spot: 8, rect: 4 }, leniwe: false },
  niski: { dpr: 1.25, gtao: false, lustro: 0, cienie: "brak", pula: { spot: 6, rect: 4 }, leniwe: true },
};
const wymuszony = new URLSearchParams(location.search).get("jakosc");
const nazwaPoziomu = Object.hasOwn(POZIOMY, wymuszony) ? wymuszony
  : dotykowy ? "niski" : (navigator.hardwareConcurrency ?? 8) <= 4 ? "sredni" : "wysoki";
const jakosc = { nazwa: nazwaPoziomu, ...POZIOMY[nazwaPoziomu] };

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
/* Gęstość pikseli z poziomu: na telefonie limit 1,25 zamiast natywnych 3 to
   prawie sześć razy mniej pikseli na klatkę przy niewidocznej różnicy. */
renderer.setPixelRatio(Math.min(devicePixelRatio, jakosc.dpr));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = jakosc.cienie !== "brak";
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

/* Utrata kontekstu WebGL (telefon pod presją pamięci, reset sterownika):
   three.js przestaje rysować i zostaje czarne płótno. Zamiast niego prośba
   o odświeżenie — w panelu, którego używa też strażnik ładowania. */
renderer.domElement.addEventListener("webglcontextlost", () => {
  const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);
  const panel = document.getElementById("no-webgl");
  const tekst = document.createElement("p");
  tekst.textContent = t("muz.utrata", "Karta graficzna zgubiła obraz muzeum — na telefonie zdarza się to przy braku pamięci.");
  const odswiez = document.createElement("button");
  odswiez.type = "button";
  odswiez.className = "hud-list";
  odswiez.textContent = t("muz.odswiez", "Odśwież muzeum");
  odswiez.addEventListener("click", () => location.reload());
  const powrot = document.createElement("a");
  powrot.href = "index.html";
  powrot.textContent = t("muz.wrocKarta", "Wróć do karty budowania");
  panel.replaceChildren(tekst, odswiez, powrot);
  panel.hidden = false;
});

// Mapa środowiskowa z kodu — 0 bajtów do pobrania. Siłę per strefa ustawia swiatla.js.
const pmrem = new THREE.PMREMGenerator(renderer);
const srodowisko = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = srodowisko;
scene.environmentIntensity = 0.15;

// go() dostaje ciało w main.js, gdy powstaje gracz — tu tylko nieszkodliwy zaczep.
window.__mz = { renderer, scene, camera, jakosc, composer: null, bloom: null, go: () => {} };

/* MSAA w celu kompozytora: `antialias` renderera nie obejmuje rysowania do
   celu pośredniego, a bez wygładzania listwy, ramy i opaski drzwi strzępią się. */
const cel = new THREE.WebGLRenderTarget(16, 16, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, cel);
composer.addPass(new RenderPass(scene, camera));
/* Okluzja otoczenia (GTAO): miękki cień w narożnikach, pod ławkami i u podstawy
   podestów. To ona odróżnia wnętrze od „płaskiego 3D” — szczególnie w bieli,
   gdzie światło sufitu nie rzuca cieni. Liczona w połowie rozdzielczości
   (razem z przebiegiem normalnych): i tak jest rozmyta, a pikseli 4× mniej —
   w pełnej zjadała ⅓ klatki. Na niskim poziomie nie powstaje wcale (jej cele
   renderowania to pamięć, której telefon nie ma). */
let gtao = null;
if (jakosc.gtao) {
  gtao = new GTAOPass(scene, camera, 16, 16);
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 });
  /* Bez przestrzennego odszumiania (promień 0): przy 16 próbkach okluzja jest
     już gładka, a filtr Poissona kropkował każde załamanie ścian — próbki zza
     narożnika dostają wagę 0, a ich zbiór zmienia się co piksel (widać to było
     w bieli, gdzie okluzja to prawie jedyny cień). */
  gtao.updatePdMaterial({ radius: 0 });
  gtao.blendIntensity = 1;
  const pelna = gtao.setSize.bind(gtao);
  gtao.setSize = (w, h) => pelna(Math.ceil(w / 2), Math.ceil(h / 2));
  composer.addPass(gtao);
}
// (rozdzielczość, siła, promień, próg) — wysoki próg: świecą ekrany, szyldy i progi, nie ściany
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
window.__mz.composer = composer;
window.__mz.bloom = bloom;
window.__mz.gtao = gtao;

/* ── Budowniczowie eksponatów ─────────────────────────────────────────── */

const M = {
  body: (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 }),
  glow: (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity }),
  add:  (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
};

function bx(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

export { renderer, scene, camera, composer, bloom, gtao, jakosc, srodowisko, M, bx, reduceMotion, dotykowy, CAT_HEX, fmtDate };
