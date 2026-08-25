/* Gramofon dla „Akordów Zmierzchu” — jeden odtwarzacz, dwie twarze.

   Ten projekt jest kompozycją: jedyny w portfolio, którego nie da się ocenić
   wzrokiem. Miał wyłącznie odnośnik do repozytorium, więc odwiedzający mógł
   o nim przeczytać i nie mógł go usłyszeć.

   TWARZ 1 — karta budowania: płyta winylowa na karcie osi czasu.
   TWARZ 2 — muzeum: przycisk na tabliczce eksponatu.

   Rdzeń odtwarzacza jest WSPÓLNY. Dwa osobne odtwarzacze znaczyłyby dwa miejsca
   do naprawienia przy każdej zmianie zachowania — a to już raz kosztowało
   usterkę (patrz ROZGRZEWKA niżej).

   Muzeum nie jest w tym celu modyfikowane: przycisk dokłada się przez
   OBSERWACJĘ tabliczki, więc js/museum/ui.js zostaje nietknięty.

   SKRYPT YOUTUBE WCZYTUJE SIĘ DOPIERO PRZY PŁYCIE (najechanie albo kliknięcie),
   nigdy przy wejściu na stronę — zwykłe osadzenie iframe kontaktuje się
   z Google u każdego, kto otworzy stronę. Uczciwie o granicy tej obietnicy:
   najechanie bywa PRZYPADKOWE, bo przewijanie potrafi wsunąć płytę pod
   nieruchomy kursor. Zmierzone, nie zgadnięte. */

(function () {
  const PROJEKT = "akordy-zmierzchu";
  const FILM = "hZLA8pWmTuo";

  const TEKST = {
    pl: { graj: "Odtwórz kompozycję", stop: "Zatrzymaj", laduje: "Wczytuję…",
          podpis: "Kompozycja Claude 4 Opus w Ableton Live. Kliknij płytę.",
          zrodlo: "dźwięk: YouTube",
          gotowe: "Gotowe — dotknij płyty, żeby zagrać.",
          blad: "Nie udało się odtworzyć — otwórz na YouTube.",
          muzGraj: "Włącz płytę", muzStop: "Zatrzymaj płytę" },
    en: { graj: "Play the composition", stop: "Stop", laduje: "Loading…",
          podpis: "Composed by Claude 4 Opus in Ableton Live. Click the record.",
          zrodlo: "audio: YouTube",
          gotowe: "Ready — tap the record to play.",
          blad: "Playback unavailable — open on YouTube.",
          muzGraj: "Play the record", muzStop: "Stop the record" },
  };
  const jezyk = () => (window.__jezyk === "en" ? "en" : "pl");
  const t = () => TEKST[jezyk()];

  /* ── RDZEŃ: jeden odtwarzacz YouTube na całą stronę ───────────────────── */
  let odtwarzacz = null, gotowy = false, chciany = false;
  const sluchacze = new Set();
  const naStan = (f) => sluchacze.add(f);
  const ogloszStan = (gra) => sluchacze.forEach((f) => f(gra, undefined));
  const ogloszTekst = (s) => sluchacze.forEach((f) => f(undefined, s));

  let apiWczytywane = false;
  const kolejka = [];
  function wczytajApi(gdyGotowe) {
    kolejka.push(gdyGotowe);
    if (window.YT && window.YT.Player) { kolejka.splice(0).forEach((f) => f()); return; }
    if (apiWczytywane) return;
    apiWczytywane = true;
    /* onYouTubeIframeAPIReady to globalna nazwa wymagana przez to API — nie da
       się jej uniknąć, więc szanujemy ewentualną cudzą definicję. */
    const poprzedni = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof poprzedni === "function") poprzedni();
      kolejka.splice(0).forEach((f) => f());
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }

  function przygotuj() {
    if (odtwarzacz) return;
    wczytajApi(() => {
      if (odtwarzacz) return;
      const host = document.createElement("div");
      host.id = "gramofon-yt";
      host.className = "gramofon-yt";
      document.body.appendChild(host);

      odtwarzacz = new YT.Player(host, {
        videoId: FILM,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onReady: () => {
            gotowy = true;
            ogloszTekst(t().podpis);
            if (!chciany) return;
            odtwarzacz.playVideo();
            /* Nie ogłaszamy grania na wyrost: jeśli po sekundzie odtwarzacz nadal
               nie gra, przeglądarka odrzuciła start bez świeżego gestu (tak jest
               na dotyku, gdzie nie ma najechania). Wtedy mówimy wprost, co zrobić,
               zamiast zostawiać martwy przycisk. */
            setTimeout(() => {
              if (odtwarzacz.getPlayerState() === 1) { ogloszStan(true); return; }
              ogloszStan(false);
              ogloszTekst(t().gotowe);
            }, 1000);
          },
          /* Stan czytamy z odtwarzacza, nie tylko z własnych kliknięć: film może
             się skończyć albo zatrzymać sam, a wtedy kręcąca się płyta kłamałaby. */
          onStateChange: (e) => {
            if (e.data === 1) ogloszStan(true);
            if (e.data === 2 || e.data === 0) ogloszStan(false);
          },
          onError: () => { ogloszStan(false); ogloszTekst(t().blad); },
        },
      });
    });
  }

  function przelacz() {
    if (!odtwarzacz) { chciany = true; ogloszTekst(t().laduje); przygotuj(); return; }
    if (!gotowy) { chciany = !chciany; return; }
    if (odtwarzacz.getPlayerState() === 1) { odtwarzacz.pauseVideo(); ogloszStan(false); }
    else { odtwarzacz.playVideo(); ogloszStan(true); }
  }

  /* ── Styl. Komponent niesie własny wygląd, bo karta budowania ładuje
     css/main.css, a muzeum css/museum.css — reguły w jednym byłyby niewidoczne
     na drugiej stronie. Ta sama lekcja co przy przełączniku języka. ───────── */
  function wstrzyknijStyl() {
    if (document.getElementById("gramofon-styl")) return;
    const st = document.createElement("style");
    st.id = "gramofon-styl";
    st.textContent = `
      .gramofon-yt{position:fixed;left:-9999px;top:0;width:320px;height:180px;opacity:0;pointer-events:none}
      .muz-plyta{display:inline-flex;align-items:center;gap:.55rem;margin-top:.7rem;
        padding:.5rem .9rem;cursor:pointer;font:inherit;font-size:.74rem;
        letter-spacing:.06em;color:#F2C46D;background:rgba(242,196,109,.08);
        border:1px solid rgba(242,196,109,.4);border-radius:99px;
        transition:background .18s ease,color .18s ease}
      .muz-plyta:hover{background:rgba(242,196,109,.18);color:#fff}
      .muz-plyta[aria-pressed="true"]{background:rgba(242,196,109,.22);color:#fff}
      .muz-plyta-krazek{width:14px;height:14px;border-radius:50%;flex:0 0 auto;
        background:repeating-radial-gradient(circle at 50% 50%,
          rgba(255,255,255,.5) 0 1px,transparent 1px 2.5px),#1a1d24;
        box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
      .muz-plyta[aria-pressed="true"] .muz-plyta-krazek{animation:muz-obrot 1.8s linear infinite}
      @keyframes muz-obrot{to{transform:rotate(360deg)}}
      @media (prefers-reduced-motion: reduce){
        .muz-plyta[aria-pressed="true"] .muz-plyta-krazek{animation:none}}`;
    document.head.appendChild(st);
  }

  /* ── TWARZ 1: płyta na karcie budowania ──────────────────────────────── */
  function zbudujGramofon() {
    const gramofon = document.createElement("div");
    gramofon.className = "gramofon";

    const plyta = document.createElement("button");
    plyta.type = "button";
    plyta.className = "gramofon-plyta";
    plyta.setAttribute("aria-label", t().graj);
    plyta.setAttribute("aria-pressed", "false");

    /* Etykietą krążka jest okładka wygenerowana dla tego projektu — ten sam
       obraz, który stoi w muzeum i w Kosmosie, przeniesiony na środek. */
    const etykieta = document.createElement("span");
    etykieta.className = "plyta-etykieta";
    etykieta.style.backgroundImage = `url(assets/okladki/${PROJEKT}.webp)`;
    const trzpien = document.createElement("span");
    trzpien.className = "plyta-trzpien";
    plyta.append(etykieta, trzpien);

    const ramie = document.createElement("span");
    ramie.className = "gramofon-ramie";
    ramie.setAttribute("aria-hidden", "true");

    const podpis = document.createElement("p");
    podpis.className = "gramofon-podpis";
    podpis.textContent = t().podpis;

    const zrodlo = document.createElement("span");
    zrodlo.className = "gramofon-zrodlo";
    zrodlo.textContent = t().zrodlo;

    gramofon.append(plyta, ramie, podpis, zrodlo);
    plyta.addEventListener("click", przelacz);

    /* ROZGRZEWKA przy najechaniu i ostrości. Wyszło z pomiaru: pierwsze
       kliknięcie zużywało cały gest użytkownika na wczytanie API YouTube,
       a zanim odtwarzacz wstawał, przeglądarka odbierała już prawo do startu
       dźwięku — więc pierwsze kliknięcie NIC nie robiło, grało dopiero drugie. */
    plyta.addEventListener("pointerenter", przygotuj, { once: true });
    plyta.addEventListener("focus", przygotuj, { once: true });

    naStan((gra, tekst) => {
      if (tekst !== undefined) podpis.textContent = tekst;
      if (gra === undefined) return;
      gramofon.classList.toggle("gra", gra);
      plyta.setAttribute("aria-pressed", String(gra));
      plyta.setAttribute("aria-label", gra ? t().stop : t().graj);
    });
    return gramofon;
  }

  function wstawNaKarte() {
    if (typeof PROJECTS === "undefined") return;
    const projekt = PROJECTS.find((p) => p.id === PROJEKT);
    if (!projekt) return;
    for (const karta of document.querySelectorAll(".timeline-section .card")) {
      const h4 = karta.querySelector("h4");
      if (!h4 || h4.textContent.trim() !== projekt.title) continue;
      if (karta.querySelector(".gramofon")) return;
      karta.querySelector(".karta-okladka")?.remove();
      karta.prepend(zbudujGramofon());
      return;
    }
  }

  /* ── TWARZ 2: przycisk na tabliczce w muzeum ─────────────────────────────
     Tabliczka jest jedna i wypełniana na nowo przy każdym eksponacie, więc
     zamiast wpinać się w kod muzeum, OBSERWUJEMY ją: gdy pokaże „Akordy
     Zmierzchu”, dokładamy przycisk; przy każdym innym eksponacie go zdejmujemy.
     Dzięki temu js/museum/ui.js pozostaje nietknięty. */
  function podepnijMuzeum() {
    const tabliczka = document.getElementById("plaque");
    const tytul = document.getElementById("plaque-title");
    const linki = document.getElementById("plaque-links");
    if (!tabliczka || !tytul || !linki) return;

    const przycisk = document.createElement("button");
    przycisk.type = "button";
    przycisk.className = "muz-plyta";
    przycisk.setAttribute("aria-pressed", "false");
    const krazek = document.createElement("span");
    krazek.className = "muz-plyta-krazek";
    const napis = document.createElement("span");
    przycisk.append(krazek, napis);
    przycisk.addEventListener("click", przelacz);
    przycisk.addEventListener("pointerenter", przygotuj, { once: true });

    const odswiezNapis = () => {
      napis.textContent = przycisk.getAttribute("aria-pressed") === "true"
        ? t().muzStop : t().muzGraj;
    };
    naStan((gra) => {
      if (gra === undefined) return;
      przycisk.setAttribute("aria-pressed", String(gra));
      odswiezNapis();
    });
    odswiezNapis();

    const nasz = () => {
      const projekt = typeof PROJECTS !== "undefined" && PROJECTS.find((p) => p.id === PROJEKT);
      return !!projekt && tytul.textContent.trim() === projekt.title;
    };
    const odswiez = () => {
      if (!tabliczka.hidden && nasz()) {
        if (!linki.contains(przycisk)) linki.appendChild(przycisk);
      } else if (przycisk.parentNode) {
        przycisk.remove();
      }
    };

    new MutationObserver(odswiez).observe(tabliczka, {
      attributes: true, attributeFilter: ["hidden"],
      subtree: true, childList: true, characterData: true,
    });
    odswiez();
  }

  function start() {
    wstrzyknijStyl();
    if (document.getElementById("plaque")) podepnijMuzeum();   // muzeum
    else wstawNaKarte();                                        // karta budowania
  }
  /* Podwójna klatka: na karcie budowania main.js i okladki.js budują DOM na tym
     samym zdarzeniu, a płyta zastępuje okładkę, która musi już istnieć. */
  addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => requestAnimationFrame(start)));
})();
