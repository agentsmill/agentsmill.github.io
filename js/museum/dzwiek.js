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

export function initDzwiek() {
  const Kontekst = window.AudioContext || window.webkitAudioContext;
  if (!Kontekst) return null;
  const ctx = new Kontekst();
  const glowny = ctx.createGain();
  glowny.gain.value = 0.9;
  glowny.connect(ctx.destination);
  const sucha = ctx.createGain();     // magistrala kroków i serca: idzie wprost i przez pogłos
  sucha.connect(glowny);

  /* Pogłos: dwa konwolwery. Zmiana sali liczy nową odpowiedź impulsową do
     nieaktywnego i przenika — podmiana bufora w grającym konwolwerze trzaska. */
  const poglosy = [0, 1].map(() => {
    const c = ctx.createConvolver(), g = ctx.createGain();
    g.gain.value = 0;
    sucha.connect(c); c.connect(g); g.connect(glowny);
    return { c, g };
  });
  let aktywny = 0;
  function odpowiedz(sekundy, zanik) {
    const n = Math.floor(ctx.sampleRate * sekundy);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let k = 0; k < 2; k++) {
      const d = b.getChannelData(k);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, zanik);
    }
    return b;
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
    const objetosc = (s.x1 - s.x0) * (s.z1 - s.z0) * s.H;   // gabinet ~350 m³ → krótki ogon, atrium ~2500 m³ → długi
    const nowy = 1 - aktywny;
    poglosy[nowy].c.buffer = odpowiedz(Math.min(3.2, Math.max(0.6, 0.6 + objetosc / 900)), 3.2);
    poglosy[nowy].g.gain.setTargetAtTime(MOKRO[s.styl] ?? 0.25, t, 0.25);
    poglosy[aktywny].g.gain.setTargetAtTime(0, t, 0.25);
    aktywny = nowy;
    const ton = TON[s.styl] ?? TON.palac;
    filtrTonu.type = ton.typ;
    filtrTonu.frequency.setTargetAtTime(ton.f, t, 0.6);
    glosTonu.gain.setTargetAtTime(ton.g, t, 0.8);
    dron.gain.setTargetAtTime(s.styl === "noc" ? 0.012 : 0, t, 1.2);
  }

  function krok() {
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
    wycisz(tak) {
      wyciszony = tak;
      glowny.gain.setTargetAtTime(tak ? 0 : 0.9, ctx.currentTime, 0.08);
      if (!tak) ctx.resume();
    },
    wyciszony: () => wyciszony,
  };
}
