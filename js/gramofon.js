/* Gramofon dla „Akordów Zmierzchu”.

   Ten projekt jest kompozycją — jedyny na całej stronie, którego nie da się
   ocenić wzrokiem. Do tej pory miał tylko odnośnik do repozytorium, więc
   odwiedzający mógł o nim przeczytać i nie mógł go usłyszeć. Płyta na karcie
   zamyka tę lukę: kliknięcie gra, drugie kliknięcie zatrzymuje.

   DŹWIĘK IDZIE Z YOUTUBE, ale odtwarzacz jest ukryty, a na wierzchu stoi własna
   płyta. Powód jest prosty: gotowy embed przyniósłby cudzy interfejs w środek
   karty, a karta ma wyglądać jak reszta strony.

   SKRYPT YOUTUBE WCZYTUJE SIĘ DOPIERO PRZY NAJECHANIU NA PŁYTĘ ALBO KLIKNIĘCIU,
   nigdy przy wejściu na stronę. Zwykłe osadzenie iframe kontaktuje się z Google
   u każdego, kto otworzy kartę budowania, niezależnie od tego, czy chce słuchać;
   tutaj kontakt zaczyna się dopiero przy płycie.

   Uczciwie o granicy tej obietnicy: najechanie bywa PRZYPADKOWE — przewijanie
   strony potrafi wsunąć płytę pod nieruchomy kursor i wtedy rozgrzewka ruszy bez
   świadomego zamiaru. Zmierzone, nie zgadnięte. To cena za granie od pierwszego
   kliknięcia (patrz komentarz przy rozgrzewce niżej) i wciąż znacznie mniej niż
   kontakt przy każdym wejściu na stronę. */

(function () {
  const PROJEKT = "akordy-zmierzchu";
  const FILM = "hZLA8pWmTuo";

  const TEKST = {
    pl: { graj: "Odtwórz kompozycję", stop: "Zatrzymaj",
          podpis: "Kompozycja Claude 4 Opus w Ableton Live. Kliknij płytę.",
          laduje: "Wczytuję…", zrodlo: "dźwięk: YouTube" },
    en: { graj: "Play the composition", stop: "Stop",
          podpis: "Composed by Claude 4 Opus in Ableton Live. Click the record.",
          laduje: "Loading…", zrodlo: "audio: YouTube" },
  };

  let odtwarzacz = null;      // instancja YT.Player
  let gotowy = false;
  let chcianyStan = false;    // czego chce gracz, zanim odtwarzacz wstanie

  function jezyk() { return window.__jezyk === "en" ? "en" : "pl"; }

  /* ── Budowa gramofonu ────────────────────────────────────────────────── */
  function zbuduj(karta) {
    const t = TEKST[jezyk()];

    const gramofon = document.createElement("div");
    gramofon.className = "gramofon";

    const plyta = document.createElement("button");
    plyta.type = "button";
    plyta.className = "gramofon-plyta";
    plyta.setAttribute("aria-label", t.graj);
    plyta.setAttribute("aria-pressed", "false");

    /* Etykieta płyty to okładka wygenerowana dla tego projektu — ten sam obraz,
       który stoi na karcie i na świecie w Kosmosie, więc płyta nie wprowadza
       nowego elementu graficznego, tylko przenosi istniejący na środek krążka. */
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
    podpis.textContent = t.podpis;

    const zrodlo = document.createElement("span");
    zrodlo.className = "gramofon-zrodlo";
    zrodlo.textContent = t.zrodlo;

    gramofon.append(plyta, ramie, podpis, zrodlo);
    plyta.addEventListener("click", () => przelacz(gramofon, plyta, podpis));

    /* ROZGRZEWKA przy najechaniu kursorem albo ostrości klawiatury.

       Powód jest konkretny i wyszedł dopiero z pomiaru: pierwsze kliknięcie
       zużywało cały „gest użytkownika" na wczytanie API YouTube, a zanim
       odtwarzacz wstawał, przeglądarka odbierała już prawo do startu dźwięku —
       więc pierwsze kliknięcie NIC nie robiło, a grało dopiero drugie.
       Najechanie kursorem jest wystarczająco mocnym sygnałem zamiaru, żeby
       przygotować odtwarzacz wcześniej. Nie jest sygnałem doskonałym: przewijanie
       potrafi wsunąć płytę pod nieruchomy kursor. Świadomy wybór — martwe pierwsze
       kliknięcie jest gorsze dla odwiedzającego niż wcześniejszy kontakt z YouTube
       u kogoś, kto i tak zatrzymał się nad płytą. */
    const rozgrzej = () => { if (!odtwarzacz) wczytajApi(() => stworzOdtwarzacz(gramofon, plyta, podpis)); };
    plyta.addEventListener("pointerenter", rozgrzej, { once: true });
    plyta.addEventListener("focus", rozgrzej, { once: true });

    return gramofon;
  }

  /* ── Sterowanie ──────────────────────────────────────────────────────── */
  function ustawStan(gramofon, plyta, gra) {
    const t = TEKST[jezyk()];
    gramofon.classList.toggle("gra", gra);
    plyta.setAttribute("aria-pressed", String(gra));
    plyta.setAttribute("aria-label", gra ? t.stop : t.graj);
  }

  function przelacz(gramofon, plyta, podpis) {
    const t = TEKST[jezyk()];

    if (!odtwarzacz) {
      chcianyStan = true;
      podpis.textContent = t.laduje;
      gramofon.classList.add("czeka");
      wczytajApi(() => stworzOdtwarzacz(gramofon, plyta, podpis));
      return;
    }
    if (!gotowy) { chcianyStan = !chcianyStan; return; }

    const stan = odtwarzacz.getPlayerState();
    if (stan === 1) { odtwarzacz.pauseVideo(); ustawStan(gramofon, plyta, false); }
    else { odtwarzacz.playVideo(); ustawStan(gramofon, plyta, true); }
  }

  /* Skrypt YouTube dokładamy raz, na żądanie. onYouTubeIframeAPIReady jest
     globalną nazwą wymaganą przez to API — nie da się jej uniknąć, więc
     szanujemy ewentualną cudzą definicję i wołamy ją dalej. */
  let apiWczytywane = false;
  const kolejka = [];
  function wczytajApi(gdyGotowe) {
    kolejka.push(gdyGotowe);
    if (window.YT && window.YT.Player) { kolejka.splice(0).forEach((f) => f()); return; }
    if (apiWczytywane) return;
    apiWczytywane = true;

    const poprzedni = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof poprzedni === "function") poprzedni();
      kolejka.splice(0).forEach((f) => f());
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  }

  function stworzOdtwarzacz(gramofon, plyta, podpis) {
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
          gramofon.classList.remove("czeka");
          podpis.textContent = TEKST[jezyk()].podpis;
          if (!chcianyStan) return;
          odtwarzacz.playVideo();
          /* Nie ogłaszamy grania na wyrost. Jeśli po sekundzie odtwarzacz nadal
             nie gra, znaczy to, że przeglądarka odrzuciła start bez świeżego
             gestu (tak dzieje się na dotyku, gdzie nie ma najechania kursorem).
             Wtedy mówimy wprost, co zrobić, zamiast zostawiać martwy przycisk. */
          setTimeout(() => {
            if (odtwarzacz.getPlayerState() === 1) { ustawStan(gramofon, plyta, true); return; }
            ustawStan(gramofon, plyta, false);
            podpis.textContent = jezyk() === "en"
              ? "Ready — tap the record to play."
              : "Gotowe — dotknij płyty, żeby zagrać.";
          }, 1000);
        },
        /* Stan czytamy z odtwarzacza, a nie tylko z własnych kliknięć: film
           potrafi się skończyć albo zatrzymać sam (buforowanie, polityka
           autoodtwarzania), a wtedy kręcąca się płyta kłamałaby. */
        onStateChange: (e) => {
          if (e.data === 1) ustawStan(gramofon, plyta, true);
          if (e.data === 2 || e.data === 0) ustawStan(gramofon, plyta, false);
        },
        onError: () => {
          gramofon.classList.remove("czeka", "gra");
          podpis.textContent = jezyk() === "en"
            ? "Playback unavailable — open on YouTube."
            : "Nie udało się odtworzyć — otwórz na YouTube.";
        },
      },
    });
  }

  /* ── Wstawienie na kartę projektu ────────────────────────────────────── */
  function wstaw() {
    if (typeof PROJECTS === "undefined") return;
    const projekt = PROJECTS.find((p) => p.id === PROJEKT);
    if (!projekt) return;

    for (const karta of document.querySelectorAll(".timeline-section .card")) {
      const h4 = karta.querySelector("h4");
      if (!h4 || h4.textContent.trim() !== projekt.title) continue;
      if (karta.querySelector(".gramofon")) return;

      /* Płyta zastępuje statyczną okładkę na tej jednej karcie: ta sama grafika
         wraca jako etykieta krążka, więc nic nie znika, a karta zyskuje dźwięk. */
      karta.querySelector(".karta-okladka")?.remove();
      karta.prepend(zbuduj(karta));
      return;
    }
  }

  addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => requestAnimationFrame(wstaw)));
})();
