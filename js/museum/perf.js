/* Strażnik wydajności. Degradacja jednokierunkowa: raz wyłączonego efektu nie
   włączamy z powrotem, bo na granicy wydajności scena migotałaby w tę i z
   powrotem. Stopnie podaje main.js — od najdroższego przy najmniejszej stracie
   wyglądu: GTAO → lustro → cienie → rozdzielczość. Stopień, którego nie ma już
   czym wykonać (np. lustro na niskim poziomie), oddaje kolejkę następnemu. */

/* Pierwsze klatki życia sceny NIE liczą się do średniej. Kompilacja shaderów,
   wysyłka tekstur na kartę i budowa map cieni potrafią zjeść na telefonie
   kilkaset milisekund na klatkę — i wszystko to mija samo. Degradacja jest
   jednokierunkowa z rozmysłem, więc telefon, który zmierzyłby tylko rozgrzewkę,
   straciłby efekty na stałe, z powodu, którego już nie ma.
   ~120 klatek to około dwie sekundy przy 60 fps i wyraźnie więcej przy
   zadławionym starcie — czyli dokładnie ten okres, którego nie chcemy mierzyć. */
const ROZGRZEWKA = 120;
const PO_ZMIANIE = 60;    // wyłączenie cieni rekompiluje shadery — ta czkawka też nie jest pomiarem
const OKNO = 90;          // klatek na jeden pomiar
const PROG_FPS = 25;

/* stopnie: [{ nazwa, wykonaj() → czy było co wyłączyć, tekst() → komunikat }] */
export function initPerf({ stopnie, komunikat }) {
  let klatki = 0, suma = 0, i = 0, rozgrzewka = ROZGRZEWKA;
  const wykonane = [];

  function degraduj() {
    while (i < stopnie.length) {
      const s = stopnie[i++];
      if (s.wykonaj()) {
        wykonane.push(s.nazwa);
        komunikat(s.tekst());
        rozgrzewka = PO_ZMIANIE;
        return true;
      }
    }
    return false;
  }

  return {
    degraduj,                            // także dla testów: wymusza następny stopień
    wykonane: () => [...wykonane],
    tick(dt) {
      if (i >= stopnie.length) return;
      if (rozgrzewka > 0) { rozgrzewka--; return; }
      suma += dt; klatki++;
      if (klatki < OKNO) return;
      const fps = klatki / suma;
      klatki = 0; suma = 0;
      if (fps < PROG_FPS) degraduj();
    },
  };
}
