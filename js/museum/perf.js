/* Degradacja jednokierunkowa: raz wyłączonego efektu nie włączamy z powrotem,
   bo na granicy wydajności scena migotałaby w tę i z powrotem. */
/* Pierwsze klatki życia sceny NIE liczą się do średniej. Kompilacja shaderów,
   wysyłka tekstur na kartę i budowa map cieni potrafią zjeść na telefonie
   kilkaset milisekund na klatkę — i wszystko to mija samo. Degradacja jest
   jednokierunkowa z rozmysłem, więc telefon, który zmierzyłby tylko rozgrzewkę,
   straciłby poświatę (a potem cienie) na stałe, z powodu, którego już nie ma.
   ~120 klatek to około dwie sekundy przy 60 fps i wyraźnie więcej przy
   zadławionym starcie — czyli dokładnie ten okres, którego nie chcemy mierzyć. */
const ROZGRZEWKA = 120;

export function initPerf({ composer, bloom, renderer, komunikat }) {
  let klatki = 0, suma = 0, stopien = 0, rozgrzewka = ROZGRZEWKA;
  return function tick(dt) {
    if (stopien >= 2) return;
    if (rozgrzewka > 0) { rozgrzewka--; return; }
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
