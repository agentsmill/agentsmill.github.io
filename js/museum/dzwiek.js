/* Dźwięk muzeum — w całości syntezowany, zero plików. Rdzeń (kroki przez filtr
   pasmowy, pogłos z syntetycznej odpowiedzi impulsowej) przeniesiony z gałęzi
   `groza` (js/groza/dzwiek.js). Doszły: pogłos zależny od sali (dwa konwolwery
   z przenikaniem przy zmianie sali), ton sali w każdej strefie i uderzenie
   serca w atrium — w rytmie świecenia kardiogramu w posadzce (wystroj.js).
   Wszystko cicho i bez nagłych dźwięków: muzeum, nie gra. */

import { OKRES_SERCA } from "muzeum/wystroj.js";

// krok: filtr szumu wg posadzki (parkiet dzwoni wyżej, beton głucho, kamień nisko, wykładzina prawie wcale)
const KROK = {
  palac: { typ: "bandpass", f: 520, q: 1.4, g: 0.2 },
  zabawy: { typ: "bandpass", f: 560, q: 1.3, g: 0.17 },
  biel: { typ: "bandpass", f: 330, q: 1.1, g: 0.2 },
  noc: { typ: "bandpass", f: 240, q: 1.6, g: 0.22 },
  kino: { typ: "lowpass", f: 260, q: 0.7, g: 0.07 },
};
const MOKRO = { palac: 0.32, biel: 0.38, noc: 0.3, kino: 0.06, zabawy: 0.14 };   // udział pogłosu
// ton sali: filtr i głośność zapętlonego szumu; w nocy dochodzi niski dron
const TON = {
  palac: { typ: "lowpass", f: 380, g: 0.045 }, biel: { typ: "bandpass", f: 2400, g: 0.016 },
  noc: { typ: "lowpass", f: 170, g: 0.055 }, kino: { typ: "lowpass", f: 120, g: 0.025 },
  zabawy: { typ: "lowpass", f: 650, g: 0.022 },
};
const SERCE = [0.05, 0.3];   // fazy „lub” i „dub” w okresie — te same co w bicieSerca()
/* Górna warstwa uderzenia (uderzenie()): trójkąt na 3× częstotliwości głębokiego impulsu (186→126 Hz), z tym
   samym atakiem i szybszym zanikiem (`zanik` w sekundach od początku), przy ułamku siły. Głęboki sinus
   (62→42 Hz) niesie serce na słuchawkach; głośniki laptopa i telefonu nie oddają niczego poniżej ok. 150 Hz,
   więc z tej warstwy słyszą cichy, wyższy stuk. Miękko — muzeum, nie gra: wzmocnienie i zanik na dolnym
   skraju dozwolonego zakresu (pomiar offline przez górnoprzepust 150 Hz: szczyt uderzenia nie rośnie,
   a stuk zostaje cichszy od kroku). */
const GORA = { razy: 3, wzmocnienie: 0.2, zanik: 0.10 };
const MAX_ODPOWIEDZI = 6;    // odpowiedzi impulsowe w pamięci podręcznej (największa ma ok. 1,2 MB)

export function initDzwiek(plan = null) {
  const Kontekst = window.AudioContext || window.webkitAudioContext;
  if (!Kontekst) return null;
  const ctx = new Kontekst();
  const glowny = ctx.createGain();
  glowny.gain.value = 0.9;
  glowny.connect(ctx.destination);
  const sucha = ctx.createGain();     // magistrala kroków i serca: idzie wprost i przez pogłos
  sucha.connect(glowny);

  /* Pogłos: dwa konwolwery. Zmiana sali daje nową odpowiedź impulsową nieaktywnemu
     i przenika — podmiana bufora w grającym konwolwerze trzaska. `klucz` to ogon
     odpowiedzi, którą konwolwer ma w sobie (dziesiąte części sekundy): ten sam ogon
     nie wymaga podmiany bufora, a podmiana to jedyny koszt, który zostaje na progu. */
  const poglosy = [0, 1].map(() => {
    const c = ctx.createConvolver(), g = ctx.createGain();
    g.gain.value = 0;
    sucha.connect(c); c.connect(g); g.connect(glowny);
    return { c, g, klucz: null };
  });
  let aktywny = 0;
  // szum z wykładniczym zanikiem; obwiednia raz na próbkę, wspólna dla obu kanałów
  function odpowiedz(sekundy, zanik) {
    const n = Math.floor(ctx.sampleRate * sekundy);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    const lewy = b.getChannelData(0), prawy = b.getChannelData(1);
    for (let i = 0; i < n; i++) {
      const obwiednia = Math.pow(1 - i / n, zanik);
      lewy[i] = (Math.random() * 2 - 1) * obwiednia;
      prawy[i] = (Math.random() * 2 - 1) * obwiednia;
    }
    return b;
  }
  /* Pamięć podręczna odpowiedzi wg ogona zaokrąglonego do 0,1 s. Najwyżej MAX_ODPOWIEDZI wpisów;
     najdawniej użyty wypada pierwszy (Map trzyma kolejność wstawiania, a każde użycie wstawia wpis
     na koniec). */
  const odpowiedzi = new Map();
  function ogonZPamieci(klucz) {
    let b = odpowiedzi.get(klucz);
    if (b) odpowiedzi.delete(klucz); else b = odpowiedz(klucz / 10, 3.2);
    odpowiedzi.set(klucz, b);
    while (odpowiedzi.size > MAX_ODPOWIEDZI) odpowiedzi.delete(odpowiedzi.keys().next().value);
    return b;
  }
  const kluczOgona = (s) => {
    const objetosc = (s.x1 - s.x0) * (s.z1 - s.z0) * s.H;   // gabinet ~350 m³ → krótki ogon, atrium ~2500 m³ → długi
    return Math.round(Math.min(3.2, Math.max(0.6, 0.6 + objetosc / 900)) * 10);
  };

  /* Po wejściu do sali buduje się w czasie bezczynności odpowiedzi sal połączonych z nią drzwiami (bez
     portalu Kosmosu, za którym nie ma sali): próg następnych drzwi kosztuje wtedy co najwyżej podmianę
     bufora. Jedna odpowiedź na wywołanie; requestIdleCallback z limitem czasu (zajęta klatka bez niego
     głodziłaby budowę), a w Safari, który go nie ma, zwykły czasomierz. */
  const poId = new Map((plan?.sale ?? []).map((q) => [q.id, q]));
  const sasiedzi = new Map();
  for (const d of plan?.drzwi ?? []) {
    if (!d.b) continue;
    for (const [z, do_] of [[d.a, d.b], [d.b, d.a]]) sasiedzi.set(z, [...(sasiedzi.get(z) ?? []), poId.get(do_)]);
  }
  const bezczynnie = typeof requestIdleCallback === "function"
    ? (f) => { const id = requestIdleCallback(f, { timeout: 1000 }); return () => cancelIdleCallback(id); }
    : (f) => { const id = setTimeout(f, 150); return () => clearTimeout(id); };
  let anulujBudowe = null;
  function zbudujSasiadow(s) {
    anulujBudowe?.();                                  // nowa sala: kolejka po poprzedniej jest nieaktualna
    anulujBudowe = null;
    const trzymane = new Set(poglosy.map((p) => p.klucz));
    const kolejka = [...new Set((sasiedzi.get(s.id) ?? []).filter(Boolean).map(kluczOgona))]
      .filter((k) => !odpowiedzi.has(k) && !trzymane.has(k));
    const dalej = () => {
      anulujBudowe = null;
      const k = kolejka.shift();
      if (k === undefined) return;
      if (!odpowiedzi.has(k)) ogonZPamieci(k);
      if (kolejka.length) anulujBudowe = bezczynnie(dalej);
    };
    if (kolejka.length) anulujBudowe = bezczynnie(dalej);
  }

  // ton sali: zapętlony szum brązowy przez filtr strefy
  const szum = ctx.createBufferSource();
  szum.buffer = (() => {
    const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let o = 0;
    for (let i = 0; i < n; i++) { o = (o + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = o * 3.5; }
    return b;
  })();
  szum.loop = true;
  const filtrTonu = ctx.createBiquadFilter();
  const glosTonu = ctx.createGain();
  glosTonu.gain.value = 0;
  szum.connect(filtrTonu); filtrTonu.connect(glosTonu); glosTonu.connect(glowny);
  szum.start();
  const dron = ctx.createGain();
  dron.gain.value = 0;
  dron.connect(glowny);
  for (const f of [55, 82.4]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; g.gain.value = 0.5;
    o.connect(g); g.connect(dron); o.start();
  }

  let styl = "palac", serce = false, nastepneSerce = 0, wyciszony = false;

  function ustawSale(s) {
    styl = s.styl;
    serce = s.rodzaj === "atrium";
    const t = ctx.currentTime;
    const klucz = kluczOgona(s), mokro = MOKRO[s.styl] ?? 0.25;
    if (poglosy[aktywny].klucz === klucz) {
      // ten sam ogon już gra w aktywnym konwolwerze: bez podmiany bufora, tylko nowy udział pogłosu
      poglosy[aktywny].g.gain.setTargetAtTime(mokro, t, 0.25);
    } else {
      const nowy = 1 - aktywny;
      if (poglosy[nowy].klucz !== klucz) { poglosy[nowy].c.buffer = ogonZPamieci(klucz); poglosy[nowy].klucz = klucz; }
      poglosy[nowy].g.gain.setTargetAtTime(mokro, t, 0.25);
      poglosy[aktywny].g.gain.setTargetAtTime(0, t, 0.25);
      aktywny = nowy;
    }
    const ton = TON[s.styl] ?? TON.palac;
    filtrTonu.type = ton.typ;
    filtrTonu.frequency.setTargetAtTime(ton.f, t, 0.6);
    glosTonu.gain.setTargetAtTime(ton.g, t, 0.8);
    dron.gain.setTargetAtTime(s.styl === "noc" ? 0.012 : 0, t, 1.2);
    zbudujSasiadow(s);
  }

  function krok() {
    if (wyciszony || ctx.state !== "running") return;   // wyciszony albo uśpiony kontekst: źródła kroków nie miałyby kiedy się skończyć
    const k = KROK[styl] ?? KROK.palac;
    const n = Math.floor(ctx.sampleRate * 0.09);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const zrodlo = ctx.createBufferSource();
    zrodlo.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = k.typ; f.frequency.value = k.f * (0.92 + Math.random() * 0.16); f.Q.value = k.q;   // każdy krok trochę inny
    const g = ctx.createGain();
    g.gain.value = k.g * (0.85 + Math.random() * 0.3);
    zrodlo.connect(f); f.connect(g); g.connect(sucha);
    zrodlo.start();
  }

  function uderzenie(kiedy, sila) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(62, kiedy);
    o.frequency.exponentialRampToValueAtTime(42, kiedy + 0.16);
    g.gain.setValueAtTime(0.0001, kiedy);
    g.gain.exponentialRampToValueAtTime(sila, kiedy + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, kiedy + 0.22);
    o.connect(g); g.connect(sucha);
    o.start(kiedy); o.stop(kiedy + 0.25);
    // górna warstwa (GORA): ta sama chwila i ten sam atak, szybszy zanik, ułamek siły
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(62 * GORA.razy, kiedy);
    o2.frequency.exponentialRampToValueAtTime(42 * GORA.razy, kiedy + 0.16);
    g2.gain.setValueAtTime(0.0001, kiedy);
    g2.gain.exponentialRampToValueAtTime(sila * GORA.wzmocnienie, kiedy + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.0001, kiedy + GORA.zanik);
    o2.connect(g2); g2.connect(sucha);
    o2.start(kiedy); o2.stop(kiedy + GORA.zanik + 0.03);
  }

  /* Serce planowane z wyprzedzeniem ~0,3 s wg zegara performance.now() —
     tego samego, z którego świeci mosiądz w posadzce, więc biją razem. */
  function tick() {
    if (!serce || wyciszony) return;
    const teraz = performance.now() / 1000;
    if (nastepneSerce < teraz - OKRES_SERCA) nastepneSerce = Math.floor(teraz / OKRES_SERCA) * OKRES_SERCA;
    while (nastepneSerce < teraz + 0.3) {
      SERCE.forEach((faza, i) => {
        const kiedy = nastepneSerce + faza;
        if (kiedy > teraz) uderzenie(ctx.currentTime + (kiedy - teraz), i === 0 ? 0.12 : 0.08);
      });
      nastepneSerce += OKRES_SERCA;
    }
  }

  // karta w tle: kontekst śpi (oszczędza baterię i nie gra nikomu)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) ctx.suspend(); else if (!wyciszony) ctx.resume();
  });

  return {
    ctx, ustawSale, krok, tick,
    wyjscie: glowny,      // wspólne wyjście: tędy wchodzi też dźwięk filmu w Kinie (sale-boczne.js), więc przycisk w HUD go wycisza
    wycisz(tak) {
      wyciszony = tak;
      glowny.gain.setTargetAtTime(tak ? 0 : 0.9, ctx.currentTime, 0.08);
      if (!tak) ctx.resume();
    },
    wyciszony: () => wyciszony,
  };
}
