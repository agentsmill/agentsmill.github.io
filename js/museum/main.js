import * as THREE from "three";
import { renderer, camera, composer, bloom, reduceMotion } from "./render.js";
import { buildCorridor, buildEkg, dlugosciSal, interactives, tickers, eraRanges, totalLength } from "./world.js";
import { buildBuilding } from "./building.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, isListOpen } from "./ui.js";

const loader = document.getElementById("loader");

window.__mz.interactives = interactives;

/* ── Szyny kamery, fokus, interakcja ─────────────────────────────────── */

let targetZ = 0, curZ = 0;
window.__mz.go = (z) => { targetZ = curZ = z; };   // dokończenie uchwytu go() zaczętego w render.js
let focus = null;           // {hit, savedZ}
const maxZ = () => totalLength() - 2;

function focusOn(hit) {
  focus = { hit, savedZ: targetZ };
  hit.userData.exhibit?.activate?.();
  openPlaque(hit);
}

bindFocusControl({
  onFocusEnd() { if (focus) { targetZ = focus.savedZ; focus = null; } },
  goToHit(hit) {
    targetZ = THREE.MathUtils.clamp(hit.position.z - 4, 0, maxZ());
    focusOn(hit);
  },
});

addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* wejście: kółko / dotyk / klawiatura */
addEventListener("wheel", (e) => {
  if (focus || isListOpen()) return;
  targetZ = THREE.MathUtils.clamp(targetZ + e.deltaY * 0.02, 0, maxZ());
  dismissHint();
}, { passive: true });

let touchY = null;
addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener("touchmove", (e) => {
  if (focus || isListOpen() || touchY === null) return;
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  targetZ = THREE.MathUtils.clamp(targetZ + dy * 0.05, 0, maxZ());
  dismissHint();
}, { passive: true });

addEventListener("keydown", (e) => {
  if (focus || isListOpen()) return;
  const step = e.key === "PageDown" || e.key === "PageUp" ? 12 : 3;
  if (["ArrowDown", "ArrowRight", "PageDown", "w", "W"].includes(e.key)) targetZ = Math.min(maxZ(), targetZ + step);
  if (["ArrowUp", "ArrowLeft", "PageUp", "s", "S"].includes(e.key)) targetZ = Math.max(0, targetZ - step);
  dismissHint();
});

/* wskaźnik + klik przez raycaster */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let downAt = null;

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // to był drag, nie klik
  pick(e);
  if (hovered) { if (focus && hovered === focus.hit) return; endFocus(); focusOn(hovered); }
  else if (focus) endFocus();
});
renderer.domElement.addEventListener("pointermove", (e) => { pick(e); });

function pick(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hitList = ray.intersectObjects(interactives, false);
  hovered = hitList.length ? hitList[0].object : null;
  renderer.domElement.style.cursor = hovered ? "pointer" : "default";
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

function eraAt(z) {
  const r = eraRanges.find((r) => z >= r.from && z < r.to);
  return r ? `${r.era.range} — ${r.era.title}` : "";
}

const clock = new THREE.Clock();
let firstFrame = true;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const ease = reduceMotion ? 0.5 : 0.06;
  if (focus) {
    const h = focus.hit;
    const side = h.userData.side;
    // Amfilada biegnie w stronę +Z, więc kamera staje PRZED eksponatem, czyli
    // po jego stronie mniejszego Z — inaczej oglądałaby go od tyłu, zza ściany.
    const goal = new THREE.Vector3(h.position.x - side * h.userData.focusDist * 0.55, 1.55, h.position.z - h.userData.focusDist);
    camera.position.lerp(goal, reduceMotion ? 1 : 0.08);
    const look = h.position.clone(); look.y = 1.2;
    camera.lookAt(look);
  } else {
    curZ += (targetZ - curZ) * ease;
    const sway = reduceMotion ? 0 : Math.sin(curZ * 0.3) * 0.4;
    camera.position.set(sway, 1.6, curZ - 6);
    camera.lookAt(sway * 0.5, 1.35, curZ + 6);
  }

  hudEra.textContent = eraAt(focus ? focus.hit.position.z : curZ);
  for (const fn of tickers) {
    try { fn(t, dt); } catch (err) { console.error("tick error:", err); }
  }
  composer.render();
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});

/* ── Start ────────────────────────────────────────────────────────────── */

Promise.all([
  document.fonts.load("700 46px Syne"),
  document.fonts.load("400 24px 'IBM Plex Mono'"),
  document.fonts.load("600 30px 'Schibsted Grotesk'"),
]).catch(() => {}).finally(() => {
  try {
    // Kolejność jest wiążąca: dopiero rozstawione eksponaty wiedzą, jak długa
    // ma być każda sala, a dopiero gotowy budynek zna zasięg linii EKG.
    buildCorridor();
    const budynek = buildBuilding(dlugosciSal());
    window.__mz.budynek = budynek;
    buildEkg(budynek.sale[0].odZ, budynek.sale.at(-1).doZ);
    buildList();
  } catch (err) { console.error("build error:", err); }
  loop();
});
