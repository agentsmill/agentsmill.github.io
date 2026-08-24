/* Gwiazda w środku układu. Do Zadania 9 była płaską kremową kulą z MeshBasicMaterial —
   przy tekście zakończenia „jedna gwiazda" i przy sześciu powłokach, które wokół niej
   krążą, to było najsłabsze miejsce kadru.

   Powierzchnia liczona w TSL, więc działa na OBU backendach: WebGPURenderer kompiluje
   te same węzły do WGSL albo do GLSL. Tier z obraz.js dotyczy wyłącznie postprocessingu,
   nie materiałów — inaczej mielibyśmy dwa równoległe potoki artystyczne do utrzymania. */

import * as THREE from "three";
import {
  vec3, float, mix, time, positionLocal, normalWorld, positionWorld,
  cameraPosition, mx_fractal_noise_float,
} from "three/tsl";
import { scene } from "kosmos/render.js";

export const PROMIEN_GWIAZDY = 420;

/* Korona sięga poza tarczę; przy ODLEGLOSC_KAMERY = 34 gracz i tak nigdy nie zobaczy
   jej z zewnątrz w całości, ale sylwetka na tle mgławic musi mieć miękką krawędź. */
const SKALA_KORONY = 1.34;

/* Barwy fotosfery. Ciepły środek i chłodniejsze granulki dają wrażenie wrzenia.
   Mnożnik trzyma się TUŻ nad progiem bloomu (1.12 przy progu 0.80): gwiazda świeci
   sama z siebie, ale nie zalewa kadru. Pierwsza wersja miała 2.4 przy progu 0.55 —
   zrzut ekranu pokazał białą plamę na cały ekran, w której ginęła granulacja,
   pociemnienie brzegowe i wszystko, co za gwiazdą. Sam stan sceny był wtedy
   POPRAWNY: to jest dokładnie ta klasa usterek, których nie łapie żaden pomiar. */
const GORACY = vec3(1.0, 0.96, 0.84);
const CHLODNY = vec3(1.0, 0.52, 0.16);

function fotosfera() {
  const mat = new THREE.MeshBasicNodeMaterial();

  /* Granulacja: szum ułamkowy po pozycji lokalnej, powoli przesuwany w czasie.
     Skala 0.004 dobrana do promienia 420 — przy większej liczbie ziarno jest
     tak drobne, że po kompresji do piksela zlewa się w jednolitą płaszczyznę. */
  const wspolrzedne = positionLocal.mul(0.004).add(vec3(0.0, time.mul(0.05), 0.0));
  const szum = mx_fractal_noise_float(wspolrzedne, 4, 2.0, 0.5).mul(0.5).add(0.5);

  /* Pociemnienie brzegowe: prawdziwe gwiazdy są ciemniejsze przy krawędzi tarczy,
     bo patrzymy tam przez chłodniejsze, wyższe warstwy. Bez tego kula wygląda
     jak naklejka — to jeden efekt, który najbardziej odróżnia gwiazdę od koła. */
  const doOka = cameraPosition.sub(positionWorld).normalize();
  const brzeg = normalWorld.dot(doOka).abs().clamp(0.0, 1.0);
  const pociemnienie = brzeg.pow(0.45).mul(0.75).add(0.25);

  mat.colorNode = mix(CHLODNY, GORACY, szum.pow(1.6)).mul(pociemnienie).mul(1.12);
  return mat;
}

function korona() {
  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });

  /* Powłoka oglądana od wewnątrz (BackSide), więc świeci najmocniej tam, gdzie
     patrzymy przez nią stycznie — czyli dokładnie wokół sylwetki tarczy.
     depthWrite:false, żeby korona nie wycinała dziur w niczym za nią. */
  const doOka = cameraPosition.sub(positionWorld).normalize();
  const stycznie = normalWorld.dot(doOka).abs().oneMinus().clamp(0.0, 1.0);

  mat.colorNode = mix(vec3(1.0, 0.42, 0.12), vec3(1.0, 0.86, 0.55), stycznie.pow(3.0)).mul(0.85);
  mat.opacityNode = stycznie.pow(2.6).mul(0.5);
  return mat;
}

export function zbudujGwiazde() {
  const grupa = new THREE.Group();
  grupa.name = "gwiazda";

  const tarcza = new THREE.Mesh(new THREE.SphereGeometry(PROMIEN_GWIAZDY, 64, 32), fotosfera());
  tarcza.name = "gwiazda-tarcza";
  grupa.add(tarcza);

  const otoczka = new THREE.Mesh(
    new THREE.SphereGeometry(PROMIEN_GWIAZDY * SKALA_KORONY, 48, 24), korona());
  otoczka.name = "gwiazda-korona";
  otoczka.renderOrder = 2;      // po tarczy, żeby dodawanie liczyło się na gotowym tle
  grupa.add(otoczka);

  scene.add(grupa);
  return { grupa, tarcza, otoczka };
}

/* Atmosfera planety — ta sama sztuczka ze stycznym spojrzeniem, tylko chłodniejsza
   i cieńsza. Kosztuje jedno wywołanie rysowania na planetę (sześć łącznie) i jest
   różnicą między „teksturowaną kulą" a planetą. */
export function atmosfera(promienPlanety, barwa) {
  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  const doOka = cameraPosition.sub(positionWorld).normalize();
  const stycznie = normalWorld.dot(doOka).abs().oneMinus().clamp(0.0, 1.0);

  mat.colorNode = vec3(barwa.r, barwa.g, barwa.b);
  /* Wykładnik 2.4 zamiast 3.2 i grubsza powłoka (9% zamiast 5,5%): przy cienkiej
     powłoce i ostrym wykładniku pas świecenia jest tak wąski, że czyta się jak
     OBRYS wycięty wokół planety, a nie jak atmosfera. Widoczne na zrzucie przy
     Wenus — kremowa obwódka zamiast poświaty. */
  mat.opacityNode = stycznie.pow(2.4).mul(0.55);

  const siatka = new THREE.Mesh(new THREE.SphereGeometry(promienPlanety * 1.09, 48, 24), mat);
  siatka.renderOrder = 1;
  return siatka;
}
