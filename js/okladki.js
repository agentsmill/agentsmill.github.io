/* Okładki projektów bez zrzutu ekranu.

   DLACZEGO OSOBNY PLIK, A NIE POPRAWKA W js/main.js: main.js jest na liście
   plików nietykalnych. Jego shotHTML() zawsze wypisuje <img> spod
   assets/shots/{id}.jpeg i kasuje element, gdy plik nie istnieje. Skutek jest
   taki, że 27 projektów bez zrzutu wywołuje 27 nieudanych żądań przy każdym
   wejściu na stronę, a karta zostaje bez obrazu. Ten moduł podmienia adres,
   ZANIM przeglądarka spróbuje pobrać nieistniejący plik — więc jednocześnie
   dokłada okładki i usuwa te 27 czterysta-czwórek.

   UCZCIWOŚĆ. Okładki są generowane modelem (Krea 2 na GB10), nie są zrzutem
   działającego produktu. Dostają więc widoczny podpis „wizualizacja AI"
   i inny alt niż zrzuty. Strona nie ma prawa sugerować, że projekt wygląda
   tak, jak wygląda okładka. */

(function () {
  /* Identyfikatory projektów, dla których wygenerowano okładkę. Lista jest tu,
     a nie w danych, bo js/projects-data.js też jest nietykalny — ta sama zasada
     co przy liście ZRZUTY w js/kosmos/cele.js. */
  const OKLADKI = new Set([
    "akordy-zmierzchu", "aule-v1", "bielik", "flexmarket", "grafiki", "greensolver",
    "krwawy-biznes", "latent-weather", "mansa-musa", "math-garden", "mistrz-promptow",
    "naszwhisper", "neooffice", "npl", "oko-saurona", "omniportfolio", "orthank",
    "petent", "pokemate-engine", "pokescale", "pokesolver", "processor", "robotami",
    "silnik-bess", "stockcast", "stoik", "szkolenia-bank",
  ]);

  const PODPIS = { pl: "wizualizacja AI", en: "AI visualisation" };
  const ALT = {
    pl: (t) => `Okładka wygenerowana modelem AI: ${t}`,
    en: (t) => `AI-generated cover: ${t}`,
  };

  function podmien() {
    const jezyk = window.__jezyk === "en" ? "en" : "pl";

    for (const img of document.querySelectorAll('.shot img[src*="assets/shots/"]')) {
      const m = img.getAttribute("src").match(/assets\/shots\/([^./]+)\.jpeg/);
      if (!m || !OKLADKI.has(m[1])) continue;

      const id = m[1];
      const tytul = (img.getAttribute("alt") || "").replace(/^Zrzut ekranu:\s*/, "").trim();

      /* Zdejmujemy inline'owy onerror z main.js: kasował całą ramkę obrazu,
         a teraz obraz istnieje i ma zostać. */
      img.removeAttribute("onerror");
      img.setAttribute("src", `assets/okladki/${id}.webp`);
      img.setAttribute("alt", ALT[jezyk](tytul));

      const ramka = img.closest(".shot");
      if (ramka && !ramka.querySelector(".shot-znacznik")) {
        ramka.classList.add("shot-okladka");
        const znacznik = document.createElement("span");
        znacznik.className = "shot-znacznik";
        znacznik.textContent = PODPIS[jezyk];
        ramka.appendChild(znacznik);
      }
    }
  }

  /* Karty osi czasu nie mają w main.js żadnego miejsca na obraz — są czystym
     tekstem: tytuł, data, opis, znaczniki. To właśnie tam okładki mają sens,
     bo tam stoją wszystkie 49 projektów, a nie jedenaście wyróżnionych.

     Kartę wiążemy z projektem po TYTULE z <h4>, bo main.js nie zostawia w DOM
     identyfikatora. Tytuły są unikalne, a PROJECTS czytamy PO tłumaczeniu przez
     i18n.js, więc w obu językach porównujemy to, co faktycznie widać na stronie. */
  function ozdobOsCzasu() {
    if (typeof PROJECTS === "undefined") return;
    const jezyk = window.__jezyk === "en" ? "en" : "pl";
    const poTytule = new Map(PROJECTS.map((p) => [p.title, p]));

    for (const karta of document.querySelectorAll(".timeline-section .card")) {
      const h4 = karta.querySelector("h4");
      const projekt = h4 && poTytule.get(h4.textContent.trim());
      if (!projekt || !OKLADKI.has(projekt.id)) continue;
      if (karta.querySelector(".karta-okladka")) continue;

      const ramka = document.createElement("span");
      ramka.className = "karta-okladka shot-okladka";
      const img = document.createElement("img");
      img.src = `assets/okladki/${projekt.id}.webp`;
      img.alt = ALT[jezyk](projekt.title);
      img.loading = "lazy";
      img.decoding = "async";
      const znacznik = document.createElement("span");
      znacznik.className = "shot-znacznik";
      znacznik.textContent = PODPIS[jezyk];
      ramka.append(img, znacznik);
      karta.prepend(ramka);
    }
  }

  /* main.js buduje karty na DOMContentLoaded; ten plik ładuje się PO nim, więc
     jego uchwyt wykona się później i zastanie gotowy DOM. Dodatkowy
     requestAnimationFrame domyka przypadek, w którym main.js dokłada coś
     jeszcze w tej samej klatce. */
  addEventListener("DOMContentLoaded", () => requestAnimationFrame(() => { podmien(); ozdobOsCzasu(); }));
})();
