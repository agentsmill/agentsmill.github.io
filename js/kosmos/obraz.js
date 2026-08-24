/* Obraz Kosmosu — potok postprocessingu i jedyne miejsce, w którym mieszka podział
   na dwa poziomy jakości.

   ZASADA PODZIAŁU: materiały (gwiazda w TSL, atmosfery, pył) są WSPÓLNE dla obu
   backendów, bo WebGPURenderer kompiluje te same węzły do WGSL albo do GLSL.
   Dzieli się wyłącznie postprocessing. Dzięki temu nie ma dwóch potoków
   artystycznych do utrzymania — jest jeden świat i jedna klamra na jego końcu.

   Postprocessing NIE dotyka lotu, sterowania ani kamery. Swobodny lot 6DOF zostaje
   dokładnie taki, jaki był w Zadaniu 6; zmienia się to, jak kadr wygląda, nie to,
   co gracz może zrobić. */

import * as THREE from "three";
import { pass, uniform, screenUV, vec2, float, mix } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { renderer, scene, camera, backend } from "kosmos/render.js";

/* Próg bloomu wysoko: kosmos jest w większości czarny, więc próg sam zaznacza
   to, co ma świecić — fotosferę (mnożnik 1.12), koronę, ramki sond i mgławice —
   bez maszynerii bloomu selektywnego i bez drugiego przebiegu sceny. */
const SILA_BLOOMU = 0.52;
const PROMIEN_BLOOMU = 0.62;
const PROG_BLOOMU = 0.80;

/* Smugi prędkości: cztery odczyty tekstury ciągnięte do środka ekranu. Przy tempie
   zero siła wynosi zero, więc wszystkie odczyty trafiają w ten sam piksel i obraz
   jest nietknięty — efekt pojawia się dopiero wtedy, gdy gracz naprawdę pędzi. */
const SILA_SMUG = 0.05;

export function zbudujObraz() {
  /* Poziom prosty: rysujemy wprost do ekranu. Gra ma być przechodnia na WebGL 2
     w całości — tylko bez kosztownej klamry. */
  if (backend !== "WebGPU") {
    return {
      poziom: "prosty",
      renderuj: () => { renderer.render(scene, camera); },
      ustawTempo: () => {},
    };
  }

  const post = new THREE.PostProcessing(renderer);
  const przebieg = pass(scene, camera);
  const kolor = przebieg.getTextureNode();

  /* Znormalizowane tempo 0..1 wchodzi z main.js. Uniform, nie stała — inaczej
     smugi i winieta musiałyby przebudowywać graf węzłów przy każdej zmianie
     prędkości, czyli przy każdej klatce. */
  const tempo = uniform(0);

  const doSrodka = screenUV.sub(vec2(0.5));
  const sila = tempo.mul(SILA_SMUG);
  const smugi = kolor.sample(screenUV.sub(doSrodka.mul(sila.mul(0.25))))
    .add(kolor.sample(screenUV.sub(doSrodka.mul(sila.mul(0.50)))))
    .add(kolor.sample(screenUV.sub(doSrodka.mul(sila.mul(0.75)))))
    .add(kolor.sample(screenUV.sub(doSrodka.mul(sila))))
    .div(4.0);

  /* Wykładnik 1.8 zamiast liniowego przejścia: przy zwykłym locie (tempo ~0.3)
     obraz zostaje ostry i czytelny, a rozmycie wchodzi dopiero przy prawdziwym
     dopalaczu. Liniowo smugi zaczynały zjadać czytelność już przy krążeniu
     między sondami, czyli tam, gdzie gracz akurat czegoś szuka. */
  const podstawa = mix(kolor, smugi, tempo.clamp(0.0, 1.0).pow(1.8));
  const kwiat = bloom(podstawa, SILA_BLOOMU, PROMIEN_BLOOMU, PROG_BLOOMU);

  /* Winieta zaciska się z prędkością — krawędzie ciemnieją, środek zostaje czysty.
     Stała składowa 0.22 jest zawsze, żeby HUD miał na czym siedzieć. */
  const promienEkranu = doSrodka.length();
  const winieta = float(1.0)
    .sub(promienEkranu.pow(2.0).mul(tempo.mul(0.85).add(0.22)))
    .clamp(0.0, 1.0);

  post.outputNode = podstawa.add(kwiat).mul(winieta);

  return {
    poziom: "pelny",
    renderuj: () => post.renderAsync(),
    ustawTempo: (v) => { tempo.value = v; },
  };
}
