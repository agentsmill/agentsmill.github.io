/* Degradacja jednokierunkowa: raz wyłączonego efektu nie włączamy z powrotem,
   bo na granicy wydajności scena migotałaby w tę i z powrotem. */
export function initPerf({ composer, bloom, renderer, komunikat }) {
  let klatki = 0, suma = 0, stopien = 0;
  return function tick(dt) {
    if (stopien >= 2) return;
    suma += dt; klatki++;
    if (klatki < 90) return;
    const fps = klatki / suma;
    klatki = 0; suma = 0;
    if (fps >= 25) return;
    if (stopien === 0) {
      composer.removePass(bloom);
      komunikat("Wyłączyłem poświatę, żeby złapać płynność.");
    } else {
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.needsUpdate = true;
      komunikat("Wyłączyłem też cienie — ten sprzęt nie wyrabia.");
    }
    stopien++;
  };
}
