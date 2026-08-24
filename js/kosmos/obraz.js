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
      stopienDegradacji: () => 0,
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

  /* ──────────────────────────────────────────────────────────────────────────
     Degradacja MIERZONA, nie zgadywana.

     Do tej pory poziom jakości wybierał backend: WebGPU dostawał pełny potok,
     WebGL 2 prosty. To jest przybliżenie zdolności, a nie jej pomiar — słaby
     laptop z WebGPU dostawał wszystko, a mocny telefon na WebGL 2 nic. Teraz
     poziom ustala liczba klatek, tak jak w muzeum (js/museum/perf.js).

     Dwie zasady przejęte stamtąd jako wiedza, nie jako import:
     - ROZGRZEWKA: pierwsze klatki nie liczą się do średniej. Kompilacja shaderów
       i wysyłka tekstur potrafią zjeść setki milisekund na klatkę i mijają same;
       bez tego telefon zmierzyłby wyłącznie rozgrzewkę i straciłby efekty na
       stałe, z powodu, którego już nie ma.
     - JEDNOKIERUNKOWOŚĆ: raz zdjętego efektu nie przywracamy. Na granicy
       wydajności obraz migotałby w tę i z powrotem.

     Kolejność zdejmowania jest kolejnością „najmniejsza strata w obrazie za
     największy zysk w klatkach": najpierw gęstość pikseli (prawie niewidoczna),
     dopiero potem cała klamra postprocessingu (widoczna od razu). */
  const ROZGRZEWKA = 120;
  const PROG_KLATEK = 30;
  let rozgrzewka = ROZGRZEWKA, klatki = 0, suma = 0, stopien = 0;
  let uzyjPotoku = true;

  function zmierz(dt) {
    if (stopien >= 2 || rozgrzewka-- > 0) return;
    suma += dt; klatki++;
    if (klatki < 90) return;
    const fps = klatki / suma;
    klatki = 0; suma = 0;
    if (fps >= PROG_KLATEK) return;

    if (stopien === 0) {
      renderer.setPixelRatio(1);
      renderer.setSize(innerWidth, innerHeight);
    } else {
      uzyjPotoku = false;          // koniec z bloomem, smugami i winietą
    }
    stopien++;
    window.__kosmos.poziomJakosci = stopien;
  }

  return {
    poziom: "pelny",
    stopienDegradacji: () => stopien,
    renderuj: (dt = 0) => {
      zmierz(dt);
      return uzyjPotoku ? post.renderAsync() : renderer.render(scene, camera);
    },
    ustawTempo: (v) => { tempo.value = v; },
  };
}
