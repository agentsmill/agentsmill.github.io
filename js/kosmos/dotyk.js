/* Sterowanie dotykiem dla Kosmosu.

   Wzorzec przeniesiony z muzeum (js/museum/player.js), bo tamten przeszedł już
   próbę na prawdziwych telefonach — ale KOD jest osobny. Ograniczenie globalne:
   dzielimy dane, nie kod; zero importów z js/museum/. Muzeum to chodzenie po
   płaszczyźnie, Kosmos to lot 6DOF, więc wspólny byłby i tak tylko szkielet.

   Podział ekranu:
   - lewa połowa: drążek sterowania — pochylenie i odchylenie, dokładnie te same
     osie, którymi na komputerze steruje mysz;
   - prawa strona: przyciski ciągu, dopalacza i hamowania.

   Trzy lekcje z muzeum, każda kosztowała tam osobną usterkę:
   1. `touchcancel` zwalnia identycznie jak `touchend` — iOS wysyła cancel, gdy
      dotyk przechodzi w gest systemowy (przesunięcie od lewej krawędzi, czyli
      dokładnie tam, gdzie mieszka drążek). Bez tego identyfikator blokuje się
      na zawsze i sterowanie zamiera do przeładowania strony.
   2. Samoleczenie: jeśli identyfikator dotyku zniknął z listy `e.touches`,
      zwalniamy go przy następnym dotknięciu, zamiast czekać na zdarzenie,
      które już nie przyjdzie.
   3. Dotknięcia HUD (tabliczka, panel źródeł, przyciski nagłówka) nie sterują
      rakietą — inaczej przewijanie panelu źródeł kręciłoby statkiem. */

const DRAZEK_ZASIEG = 64;      // px pełnego wychylenia
const KCIUK_ZASIEG = 26;       // px, o ile przesuwa się wskaźnik kciuka

/* Stan czytany przez rakieta.js. Mutowany w miejscu, nigdy przypisywany na nowo,
   żeby import przez nazwaną wartość zawsze widział aktualną zawartość. */
export const dotyk = {
  aktywny: false,              // czy urządzenie w ogóle dotykało ekranu
  pochylenie: 0,               // -1..1
  odchylenie: 0,               // -1..1
  ciag: 0,                     // -1, 0 albo 1
  dopalacz: false,
};

function naHud(t) {
  return !!t.target?.closest?.(".k-tabliczka, .k-zrodla, .k-hud-gora, .k-dotyk-przycisk");
}

export function zbudujDotyk() {
  const drazek = document.getElementById("k-drazek");
  const kciuk = document.getElementById("k-drazek-kciuk");
  const panel = document.getElementById("k-dotyk");

  let id = null, sx = 0, sy = 0;

  const pokazSterowanie = () => {
    if (dotyk.aktywny) return;
    dotyk.aktywny = true;
    panel.hidden = false;
    /* Podpowiedź dla klawiatury i myszy nie dotyczy telefonu — na ekranie
       dotykowym mówiłaby o klawiszach, których tam nie ma. */
    document.getElementById("k-sterowanie")?.classList.add("k-znika");
    document.getElementById("k-celownik")?.setAttribute("hidden", "");
  };

  const zywy = (lista, i) => i === null || [...lista].some((x) => x.identifier === i);

  addEventListener("touchstart", (e) => {
    if (!zywy(e.touches, id)) { id = null; zwolnijDrazek(); }
    for (const t of e.changedTouches) {
      if (naHud(t)) continue;
      pokazSterowanie();
      if (t.clientX <= innerWidth / 2 && id === null) {
        id = t.identifier; sx = t.clientX; sy = t.clientY;
        drazek.style.left = `${sx}px`;
        drazek.style.top = `${sy}px`;
        drazek.hidden = false;
      }
    }
  }, { passive: true });

  addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== id) continue;
      const dx = Math.max(-1, Math.min(1, (t.clientX - sx) / DRAZEK_ZASIEG));
      const dy = Math.max(-1, Math.min(1, (t.clientY - sy) / DRAZEK_ZASIEG));
      kciuk.style.transform = `translate(${dx * KCIUK_ZASIEG}px, ${dy * KCIUK_ZASIEG}px)`;
      dotyk.odchylenie = dx;
      dotyk.pochylenie = dy;
    }
  }, { passive: true });

  function zwolnijDrazek() {
    dotyk.odchylenie = 0;
    dotyk.pochylenie = 0;
    kciuk.style.transform = "";
    drazek.hidden = true;
  }

  const pusc = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) { id = null; zwolnijDrazek(); }
    }
  };
  addEventListener("touchend", pusc, { passive: true });
  addEventListener("touchcancel", pusc, { passive: true });   // iOS: patrz lekcja 1

  /* Przyciski ciągu. Trzymane, nie przełączane — pilot ma czuć przepustnicę.
     pointerdown/up zamiast touchstart/end, bo przyciski mają działać także
     pod myszą (tester na komputerze) i pod rysikiem. */
  const przycisk = (idEl, wcisnij, pusc2) => {
    const el = document.getElementById(idEl);
    const start = (ev) => { ev.preventDefault(); pokazSterowanie(); el.classList.add("wcisniety"); wcisnij(); };
    const stop = () => { el.classList.remove("wcisniety"); pusc2(); };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    el.addEventListener("pointerleave", stop);
  };

  przycisk("k-btn-ciag", () => { dotyk.ciag = 1; }, () => { dotyk.ciag = 0; });
  przycisk("k-btn-wstecz", () => { dotyk.ciag = -1; }, () => { dotyk.ciag = 0; });
  przycisk("k-btn-dopalacz", () => { dotyk.dopalacz = true; }, () => { dotyk.dopalacz = false; });

  /* Utrata widoczności karty zwalnia wszystko — inaczej powrót do gry zastaje
     wciśnięty ciąg, tak samo jak alt-tab na klawiaturze. */
  addEventListener("visibilitychange", () => {
    if (document.hidden) { id = null; zwolnijDrazek(); dotyk.ciag = 0; dotyk.dopalacz = false; }
  });

  return dotyk;
}
