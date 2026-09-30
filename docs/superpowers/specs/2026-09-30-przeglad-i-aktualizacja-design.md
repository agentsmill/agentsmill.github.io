# Przegląd i aktualizacja karty budowania — 30 IX 2026

Stan wyjściowy: ostatni commit z 25 VIII 2026 (`7b91178`), strona żywa pod
https://agentsmill.github.io/ — karta budowania, Muzeum 3D i Kosmos.

Źródła przeglądu: kod repozytorium; żywa strona w Playwright przy 1440 i 375 px;
GitHub API przez `gh` (konto agentsmill — 88 repozytoriów, 31 publicznych); curl po
wszystkich 60 adresach ze strony; wytyczne Vercel Web Interface Guidelines.

## Co działa i zostaje

- **Koncept.** Karta pacjenta jako metafora, kardiogram z prawdziwych danych,
  technologia po lewej stronie zdarzeń i projekty po prawej, rodziny i wątki. Strona
  pokazuje sposób myślenia, nie tylko listę produktów.
- **Jedno źródło danych** (`js/projects-data.js`) dla trzech widoków: karty, muzeum
  i Kosmosu.
- **Uczciwe podpisy.** „Wizualizacja AI” przy okładkach, etykieta `access` przy
  projektach bez linku, zabawkowe wagi nazwane po imieniu.
- **Pozycjonowanie.** Strona jest kroniką, a klienci trafiają na wdrozenie.ai.
- **Lekkość.** Wszystkie zasoby to ok. 5 MB, karta bez błędów w konsoli, bez
  zepsutych obrazów i bez poziomego przewijania.

## Znalezione problemy

### 1. Kronika zatrzymała się w sierpniu (najwyższy priorytet)

- Brak czterech publicznych, działających projektów: Trener LEK (VIII), Naloty na
  Ukrainę, Wiewiórka Leona i Dźwignia AI (IX).
- Kamienie milowe kończą się na Opus 5 (VII). Brakuje: Claude Fable 5.1 (1 IX),
  GPT-6 Astra (4 IX), Claude Opus 5.5 (22 IX), Claude Sonnet 5.5 (28 IX).
- Liczby, które się zestarzały: 249★ → 263★ (cztery miejsca), Aule Energy
  236 → 336 commitów, „65 repozytoriów” → 88, „16 miesięcy” → 19,
  „III 2025 — VIII 2026”.
- Tekst względny w czasie: Grafiki, „Najświeższy projekt — commity z dziś” (PL i EN).
- Nieścisłość: lead epoki 6 mówi „gra na Steam”, a PETENT nie ma jeszcze strony
  w sklepie.

### 2. Linki

- pawelczuk.com w stopce prowadzi do strony Lovable „Build incomplete” (HTTP 404).
- Token Golf budził się dłużej niż 25 s, a etykieta obiecuje ok. 10 s.
- npm odpowiada curl-owi kodem 403. To ochrona przed botami — paczka istnieje (0.8.1),
  link zostaje.

### 3. Telefon

- Przy 375 px lepki pasek górny ma 264 px wysokości: dziewięć odnośników układa się
  w kolumnę i zasłania trzecią część ekranu przez cały czas przewijania.
- Tytuł hero ma 24,8 px — dokładnie tyle, ile mieści linia „to moje medium.”.

### 4. Udostępnianie

- Brak `og:image`, `twitter:card` i `canonical`: link wklejony na LinkedIn albo
  w Messengerze nie ma podglądu.
- Brak `theme-color` i `color-scheme: dark`.
- Statyczne `<title>` i `og:` zawierają liczby, które się starzeją („16 miesięcy”,
  „4400+ sesji”). Boty podglądu nie uruchamiają JS, więc tych liczb nie da się tam
  wyliczać — trzeba je zapisać tak, żeby się nie starzały.

### 5. Wersja angielska

- Klucze `vitals.*` i `hero.cta*` istnieją w `i18n.js`, ale nic ich nie używa: liczby
  w pasku parametrów i oba przyciski hero zostają po polsku.
- Po polsku zostają też napisy z `main.js` (Zobacz, Wszystkie, rytm, wyszukiwarka,
  lead spisu), rodziny, wątki, kamienie milowe, archiwum, etykiety `access`, sekcja
  Leona, stopka i `<title>`.
- `localStorage` bez `try/catch`. Tam, gdzie przeglądarka go blokuje, wyjątek
  zatrzymuje skrypt, zanim zbuduje przełącznik języka.

### 6. Utrzymanie kodu

- Zasada „pliki nietykalne” z planu Kosmosu (12 VIII) przeżyła swój plan. Jej skutki:
  - listy zrzutów i okładek w trzech kopiach (`okladki.js`, `kosmos/cele.js`,
    `museum/exhibits.js`), już rozjechanych — muzeum ma `autoprocurer.jpeg`,
    Kosmos nie;
  - `okladki.js` i `gramofon.js` wiążą obraz z kartą po widocznym tytule.
- Liczby wpisane na sztywno w HTML: „Jedenaście rzeczy”, „49 projektów jako światy”,
  pasek parametrów.
- Na osi czasu okładkę AI dostają projekty prywatne, a zrzuty działających projektów
  nie pojawiają się wcale — oś promuje to, czego nie da się kliknąć.
- Okładka i gramofon wystają poza ramkę karty osi czasu (margines −1,3 rem przy
  paddingu 1,1 rem).
- Parametr `?v=` przy `projects-data.js` jest inny na każdej ze stron.

### 7. Poza stroną — decyzje właściciela

- `pokemon-agent-v2/config.yaml` (repo prywatne) zawiera klucz OpenRouter jawnym
  tekstem. Do unieważnienia na openrouter.ai i przeniesienia do zmiennej środowiskowej.
- `xtb-replika` jest **publiczna**: replika serwisu prawdziwej firmy maklerskiej
  z nazwą klienta. README zawiera zastrzeżenie, ale publiczny klon interfejsu
  instytucji finansowej to ryzyko wizerunkowe — warto zmienić repo na prywatne.
- Kosmos: three.js 0.185.1 zgłasza trzy przestarzałe API (`PostProcessing`, `Clock`,
  `renderAsync`). Wersja jest przypięta, więc nic się nie psuje; do zrobienia przy
  najbliższej aktualizacji three.js.

## Inwentarz GitHuba (30 IX 2026)

88 repozytoriów (4 VIII: 65). Od 1 VIII powstały 23, ale 11 z nich to kopie zapasowe
wypchnięte jednego dnia (28 VIII). Prawdziwy start liczy się od najstarszego commitu
albo od dat plików na dysku, nie od daty utworzenia repozytorium.

| Repozytorium | Widoczność | Start | Commity | Decyzja |
|---|---|---|---:|---|
| lek-trener | publiczne, Pages | 18 VIII | 3 | nowy projekt, wyróżniony |
| naloty-ukraina | publiczne, Pages | 17 IX | 17 | nowy projekt |
| WiewiorkiLeona | publiczne, Pages | 21 IX | 2 | nowy projekt + karta w sekcji Leona |
| dzwignia | publiczne, Pages | 27 IX | 5 | nowy projekt |
| AutoCompany | prywatne | 24 VI | 99 | nowy projekt, bez linku |
| perfectgym (Poligon) | prywatne | 9 VII | 129 | nowy projekt; tylko domena, bez szczegółów — README zastrzega kod |
| poz-engine | prywatne | 3 IX | 36 | tylko w kardiogramie |
| xtb-replika, xtb-kwadrat | publiczne / prywatne | 27 IX | 34 / 1 | tylko w kardiogramie; nazwa klienta nie trafia na stronę |
| OZEgen (Lumen Drift), pokemate-spike | prywatne | 25 VI | 3 / 21 | bez zmian — kardiogram VI 2026 już je liczy |
| krs-bot, enrichment | prywatne | IV 2026 (pliki) | 1 / 1 | bez zmian — kopia starszej pracy |
| mansa-musa, mansa-musa-app, reachy-stoic | prywatne | — | — | już na stronie (Mansa Musa, Stoik) |
| pokemon-ai-agent, pokemon-agent-v2, llm-pokemon-scaffold-fork, ar-remotion-bench, autoreels | prywatne | — | — | bez zmian (fork albo migawki) |
| pokemafia, wf-img-tmp | prywatne | — | 0 / 1 | puste albo tymczasowe |

Publiczne nowe repozytoria przeszukane pod kątem sekretów (klucze OpenRouter,
Anthropic, GitHub, AWS, Supabase service role, klucze prywatne): czyste. Dźwignia
używa klucza publikowalnego Supabase, który jest przeznaczony do przeglądarki.

## Decyzje właściciela (30 IX)

1. Nowe projekty: cztery publiczne oraz AutoCompany i Poligon. Audyt POZ i Lumen
   Drift nie wchodzą.
2. Epoka 6 rozszerzona do VII–IX 2026. Muzeum zostaje przy sześciu salach, Kosmos
   przy sześciu powłokach.
3. Zakres poprawek: telefon i udostępnianie, jedno źródło prawdy, pełna wersja
   angielska. Bez nowych zrzutów i okładek — nowe projekty zostają bez obrazu.
4. Link do pawelczuk.com ukryty do czasu naprawy buildu w Lovable.
5. „4400+ sesji z AI” znika — z tego samego powodu co rachunek tokenów: lokalny licznik
   obejmuje tylko 2026 rok, a praca z AI trwa od 2022.
6. Tytuł i `og:` bez liczby miesięcy.
7. Trener LEK dołącza do wyróżnionych (razem 12).

## Zakres zmian

### Dane — `js/projects-data.js`

- Sześć nowych projektów. Epoka 6 obejmuje VII–IX 2026 i dostaje nowy rytm i lead;
  lead epoki 5 mówi „ponad 250 gwiazdek” zamiast liczby, która się starzeje.
- MILESTONES: dwa wpisy wrześniowe.
- HEARTBEAT: VIII 26 → 4 (Trener LEK), nowy IX 26 → 6 (poz-engine, naloty,
  wiewiórka, dźwignia i dwa materiały warsztatowe).
- Poprawione opisy: Age of Agents, Aule Energy (oba wpisy), Grafiki, Omniportfolio.
- Obraz jako dane: `shot: "plik.jpeg"` dla 22 projektów ze zrzutem, `cover: true` dla
  27 z okładką. Ścieżki zna tylko `obrazProjektu(p)`.
- ERAS: pole `plansza`. THREADS: pole `id`; wątek „Policz to uczciwie” obejmuje też
  Trener LEK i Naloty na Ukrainę.
- `wakes: 30` dla Token Golf.

### Render — `js/main.js`

- Obrazy z `obrazProjektu()` w wyróżnionych i na osi czasu (zrzut albo okładka
  z podpisem „wizualizacja AI”), plansze epok z danych, `data-id` na kartach,
  `width` i `height` na `<img>`.
- Liczby z danych: pasek parametrów, „12 rzeczy”, liczba światów Kosmosu, zakres dat
  w hero i w opisie kardiogramu.
- Napisy przez `__t()` z `i18n.js`.
- `js/okladki.js` usunięty — jego trzy zadania przejmuje `main.js`.

### Tłumaczenie — `js/i18n.js`

- `__t(klucz, pl)`, parametr `?lang=en|pl` w adresie, `try/catch` wokół `localStorage`.
- Tłumaczenia: nowe projekty, kamienie milowe, rodziny, wątki, archiwum, etykiety
  `access` i tagi, sekcja Leona, stopka, tytuł i opis strony.

### Strony — `index.html`, `museum.html`, `kosmos.html`

- `og:image` (`assets/og.jpg`, 1200×630, hero z kardiogramem), `twitter:card`,
  `canonical`, `theme-color`.
- Karta „Wiewiórka Leona” w sekcji Leona.
- Stopka: pawelczuk.com przeniesiony do komentarza, data aktualizacji.
- Jednakowy `?v=` dla `projects-data.js` na wszystkich trzech stronach.

### Style — `css/main.css`

- Telefon: pasek w jednym rzędzie, nawigacja przewijana w poziomie, odnośnik GitHub
  schowany (jest w stopce); większy tytuł hero z `text-wrap: balance`.
- `color-scheme: dark`, `scroll-padding-top` pod lepki pasek.
- Okładka i gramofon w ramce karty — ujemny margines równy paddingowi karty.

### Muzeum i Kosmos

- `framedShot()` i ekrany światów czytają `obrazProjektu()`; listy ZRZUTY i OKLADKI
  znikają.
- `gramofon.js` szuka karty po `data-id`, nie po tytule.

## Audyt według Web Interface Guidelines — co dochodzi do zakresu

Audyt kodu (z pomiarami w Chromium przy 320, 375 i 1280 px) znalazł dwa błędy
funkcjonalne i kilka tanich poprawek dostępności. Wchodzą do tej aktualizacji, bo są
usterkami, nie nowymi funkcjami:

- **Filtry osi czasu nie działają.** `.reveal.in { opacity: 1 }` stoi w arkuszu po
  `.card.dim { opacity: .16 }` przy tej samej specyficzności i wygrywa — po kliknięciu
  kategorii nic się nie przygasza.
- **Skoki z nawigacji lądują pod lepkim paskiem** — brak `scroll-padding-top`.
- 320 px: `minmax(310px, 1fr)` w rodzinach i pasek górny dają 27 px przewijania
  w bok (WCAG 1.4.10).
- `--ink-faint` ma kontrast 3,16:1; po zmianie na `#7F889B` przechodzi 4,5:1 na
  wszystkich trzech tłach.
- Brak odnośnika „przejdź do treści”; ukryty odtwarzacz YouTube w gramofonie łapie
  fokus klawiatury i ładuje się z domeny ustawiającej ciasteczka.
- „Zobacz ↗” i odnośniki muzeum i Kosmosu tracą stan `:hover` przez kolejność reguł
  i `!important`.
- Wyszukiwarka nie znajduje „wspolnik” bez ogonków, nie ogłasza liczby wyników, a przy
  13,6 px iOS przybliża stronę przy fokusie.
- Podpisy osi kardiogramu są ściskane przez `preserveAspectRatio="none"` (7,4 px przy
  375 px) — przechodzą z SVG do HTML.
- Plansze epok to dekoracja (`alt=""`), a alt okładek dublował tytuł karty.

Poza zakresem, do decyzji później: rzymskie miesiące w wersji EN (świadomy styl
strony), pauza animacji kardiogramu, filtr i zapytanie w adresie URL, `user-scalable=no`
w muzeum (chroni gesty joysticka), bezpieczne marginesy w Kosmosie.

Do właściciela: klip UGC „format podcastowy” w sekcji wideo **nie ma ścieżki
dźwiękowej** (pomiar ffprobe), a showreel ma 30 s dźwięku bez napisów — jeśli to mowa,
potrzebuje ich.

## Weryfikacja

- Lokalny serwer i Playwright: karta po polsku i po angielsku przy 1440 i 375 px, zero
  błędów w konsoli, zero żądań 404, zgodne liczby (55 kart na osi czasu, 12
  wyróżnionych, 83 pozycje w spisie).
- Muzeum i Kosmos ładują się bez błędów, nowe projekty są w danych obu widoków.
- curl po wszystkich adresach z danych przed publikacją.
- Publikacja (push na `main`) dopiero po zgodzie właściciela.
