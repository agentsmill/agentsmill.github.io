# Kosmos budowania — projekt gry

**Data:** 12 sierpnia 2026
**Gałąź:** `kosmos`, odcięta od `main`
**Poprzednicy:** portfolio (`index.html`) → muzeum 3D (`museum.html`) → groza (`groza.html`, gałąź `groza`)

## Cel

Trzecia odsłona tego samego wątku: 49 projektów z `js/projects-data.js` jako cele w kosmosie.
Gracz lata rakietą między nimi, odwiedza je i czyta, czym są. Bez przeciwnika, bez paliwa,
bez śmierci — jedynym oporem jest odległość, a jedyną nagrodą widok i licznik odwiedzonych.

Gra ma wyglądać jak prawdziwy kosmos: planety z map NASA i USGS, mgławice ze zdjęć
Hubble'a i Webba, możliwie wiernie wobec oryginałów.

## Rozstrzygnięcia właściciela

Zapadły w rozmowie i nie podlegają renegocjacji przez implementera:

| pytanie | rozstrzygnięcie |
|---|---|
| Treść | projekty z portfolio jako cele, nie czysta arkadówka |
| Rdzeń lotu | nic nie stawia oporu — bez paliwa, kolizji i śmierci |
| Kształt świata | powłoki chronologiczne, mgławice w tle, sześć prawdziwych planet |
| Kamera | z zewnątrz, za rakietą |
| Cel | licznik odwiedzonych, zakończenie po komplecie |
| Mgławice | prawdziwe zdjęcia, możliwie blisko oryginałów |
| Render | Three.js + WebGPU |
| Odseparowanie | gałąź od `main`, zero wspólnego kodu z grozą |

## Świat: chronologia jako geometria

Gwiazda w środku układu. Sześć powłok orbitalnych, promień rośnie z datą. Lot na zewnątrz
jest lotem w przód przez historię autora.

| powłoka | epoka | zakres | planeta | projektów |
|---|---|---|---|---|
| 1 | Pierwsze eksperymenty | III–IV 2025 | Merkury | 5 |
| 2 | Pierwsze cuda z MCP | V–VI 2025 | Wenus | 1 |
| 3 | Narzędzia domenowe | VII–X 2025 | Ziemia | 4 |
| 4 | W stronę produktów | XI 2025 – II 2026 | Mars | 2 |
| 5 | Rok agentów | III–VI 2026 | Jowisz | 20 |
| 6 | Studio jednoosobowe | VII–VIII 2026 | Saturn | 17 |

### Nierówność gęstości jest treścią, nie usterką

Wenus ma jeden projekt, Jowisz dwadzieścia. **Tego nie wolno wyrównywać.** Rzadkość
wczesnych powłok i tłok późnych to prawda o przyspieszeniu autora — im dalej gracz leci,
tym gęstszy robi się kosmos. Sztuczne dosypywanie obiektów do Wenus albo przenoszenie
projektów między epokami jest fałszowaniem danych i jest zabronione.

Kompensacja jest dozwolona wyłącznie w promieniach: powłoki 1–4 blisko siebie, żeby rzadkie
epoki dało się szybko minąć, powłoki 5–6 rozstawione szeroko, żeby dwadzieścia obiektów
miało gdzie stać. Promienie dobiera implementer i uzasadnia pomiarem czasu przelotu.

### Rozmieszczenie na powłoce

Projekty jednej epoki leżą na wspólnym promieniu, rozrzucone po kącie i lekko po wysokości,
żeby powłoka była pasem, a nie płaskim pierścieniem. Kolejność po dacie, zgodnie z ruchem
wskazówek. Rozmieszczenie musi być deterministyczne — ten sam projekt zawsze w tym samym
miejscu, bo gracz ma móc wrócić do zapamiętanego celu. Losowość wyłącznie z ziarna
pochodzącego z `id` projektu, nigdy z `Math.random()`.

## Cele: 49 sond

Każdy projekt to **sonda**: panel ze zrzutem ekranu, świecąca ramka w kolorze kategorii,
podpis z tytułem. Zbliżenie odsłania opis z `desc`, technologie z `tech` i odnośniki z `links`.

**22 projekty mają zrzut w `assets/shots`, 27 nie ma.** Te 27 dostaje proceduralny emblemat
budowany z koloru kategorii i skrótu `id` — nigdy pustego panelu i nigdy żądania po
nieistniejący plik. Lista dozwolonych nazw plików siedzi w kodzie na sztywno, wzorem
`js/museum/exhibits.js:302`, bo GitHub Pages odpowiada na brak pliku pełną stroną 404
o wadze ~9,4 kB i przy 27 sondach robi to ćwierć megabajta śmieci na wizytę.

W `assets/shots` leży `autoprocurer.jpeg`, do którego nie pasuje żaden projekt. Implementer
go nie używa i nie usuwa — to plik spoza zakresu tej pracy.

Projekt może mieć kilka kategorii (`cat` jest tablicą; 23 projekty mają `produkty`, 19 `aiml`,
13 `gry`, 10 `sztuka`, 3 `robotyka`, 2 `leon`). Kolor ramki bierze się z **pierwszej**
kategorii w tablicy, żeby wynik był jednoznaczny.

### Zasada nienaruszalności danych

`js/projects-data.js` jest jedynym źródłem prawdy i plikiem nietykalnym. Gra go czyta,
nigdy nie modyfikuje i nigdy nie dubluje jego treści we własnych stałych. Żaden opis,
tytuł ani odnośnik nie jest przepisywany do modułów gry.

Zakaz dopisywania oceny: gra nie nazywa żadnego projektu nieudanym, porzuconym ani
niedokończonym. Pole `access: "repo prywatne"` znaczy tyle, że nie ma odnośnika — nic więcej.

## Rakieta i lot

Sześć stopni swobody, sterowanie arkadowe: gdzie patrzysz, tam lecisz.

- **Orientacja kwaternionem**, nie parą kątów obrotu. Para yaw/pitch traci stopień swobody
  przy locie pionowo w górę lub w dół, a w kosmosie nie ma „góry", więc gracz tam trafi.
- **Wygładzanie wykładnicze** obrotu i przyspieszenia — rakieta ma mieć bezwładność w odbiorze,
  mimo że nie ma fizyki newtonowskiej.
- **Prędkość skalowana odległością do najbliższego obiektu**: wolno przy sondach i planetach,
  szybko w pustce między powłokami. Przelot z powłoki 1 na 6 nie może być karą.
- Zero paliwa, zero kolizji, zero stanu śmierci. Rakieta może przelecieć przez planetę.

Kamera z zewnątrz, za rakietą, z opóźnieniem i lekkim wyprzedzaniem kierunku lotu.
Model rakiety to prawdziwy statek NASA w formacie `.glb` — wybór modelu należy do implementera
z listy zweryfikowanych rozmiarów, przy budżecie do 1 MB.

## Mgławice i tło

**Mgławice są fotograficzne.** Zdjęcia ESA/Hubble i Webba naciągnięte na sferę nieba jako
duże, dalekie płaty mieszane addytywnie — tak, żeby Filary Stworzenia wyglądały jak Filary
Stworzenia, a nie jak szum.

Na pierwszym planie **proceduralny pył liczony w TSL** — dryfujące cząstki blisko kamery,
które dają paralaksę i głębię. Bez nich zdjęcia są płaską tapetą i cały kosmos wygląda na
namalowany na szybie.

### Licencja jest wymogiem funkcjonalnym

Zdjęcia ESA/Hubble są na licencji **CC BY 4.0** — wolno ich użyć, ale wymagają widocznego
podpisu. Materiały NASA/STScI są w domenie publicznej, ale też proszą o podpis.

Z tego wynika twardy wymóg produktowy: **panel „Źródła" dostępny z HUD**, wymieniający każde
zdjęcie z autorem i licencją. `LICENSES.md` w repozytorium nie spełnia warunku „wyraźnie
i widocznie", bo gracz go nie widzi. Plik `assets/kosmos/LICENSES.md` powstaje dodatkowo,
z adresem źródłowym każdego pliku.

## Renderowanie

- `three@0.185.1` przez import mapę. **Kształt mapy jest narzucony i nie podlega zmianie** —
  przepisany z oficjalnego podręcznika three.js:

  ```json
  "three":         "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.webgpu.js",
  "three/webgpu":  "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.webgpu.js",
  "three/tsl":     "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.tsl.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"
  ```

  Kluczowe: **`three` wskazuje na `three.webgpu.js`**, nie na `three.module.js`. Gdyby
  wskazywało na zwykły build, a `three/webgpu` na WebGPU, przeglądarka wczytałaby dwie kopie
  biblioteki. Wtedy obiekt zbudowany przez dodatek nie jest tym samym typem, co obiekt
  oczekiwany przez renderer, `instanceof` cicho zwraca fałsz, a scena jest pusta bez jednego
  błędu w konsoli.

- **`WebGPURenderer` uruchamia się asynchronicznie.** `setAnimationLoop()` załatwia to sam,
  ale muzeum i groza mają własną pętlę na `requestAnimationFrame` — jeśli implementer
  przeniesie ten wzorzec, **musi wywołać `await renderer.init()`** przed pierwszą klatką
  i przed jakimkolwiek dotknięciem renderera w kodzie startowym. Pominięcie daje czarny
  ekran bez błędu, czyli najgorszy możliwy rodzaj awarii do zdiagnozowania.

- `WebGPURenderer` z **automatycznym zapasem na WebGL 2**. Jeden renderer, dwa backendy,
  wybór w czasie działania. Shadery pisane raz w TSL kompilują się do WGSL albo GLSL.
- **Backend widoczny w HUD** (`WebGPU` albo `WebGL 2`). To jedyny uczciwy sposób, żeby
  wiedzieć, co się faktycznie uruchomiło — i jedyny sposób, żeby weryfikacja mogła to sprawdzić.
- Gra musi być grywalna na obu backendach. Przy WebGL 2 wolno obniżyć liczbę cząstek pyłu,
  ale nie wolno usunąć mgławic, planet ani sond.

Biblioteka w wersji WebGPU waży 652 kB zminifikowane wobec ~170 kB dla samego WebGL.
To świadomy koszt, zaakceptowany przez właściciela.

## Moduły

```
kosmos.html
css/kosmos.css
js/kosmos/render.js     — WebGPURenderer, wykrycie backendu, postprocessing
js/kosmos/swiat.js      — sześć powłok, planety, gwiazda
js/kosmos/mglawica.js   — sfera nieba ze zdjęć + pył proceduralny w TSL
js/kosmos/cele.js       — 49 sond z projects-data.js, emblematy zastępcze
js/kosmos/rakieta.js    — lot 6DOF, kamera podążająca
js/kosmos/hud.js        — nawigacja, licznik, tabliczki, panel źródeł
js/kosmos/main.js       — spięcie modułów i pętla
assets/kosmos/planety/  — sześć map WebP
assets/kosmos/mglawice/ — zdjęcia WebP
assets/kosmos/LICENSES.md
```

Każdy moduł ma jedną odpowiedzialność i daje się czytać osobno. Wzorem muzeum wersja plików
idzie przez import mapę w `kosmos.html` — stempel `?v=` **w jednym miejscu**, nie przy każdym
imporcie.

Uchwyt diagnostyczny: `window.__kosmos`. Nigdy `window.__mz` ani `window.__groza`.

## Odseparowanie od grozy i muzeum

Właściciel postawił ten warunek wprost. Konkretnie znaczy on:

1. **Gałąź `kosmos` odchodzi od `main`**, nie od `grozy`. Groza została odcięta od
   `muzeum-ps1` i przez to ciągnie wariant PS1 za sobą — tego błędu się nie powtarza.
   Zweryfikowane przy tworzeniu gałęzi: w drzewie roboczym nie ma `groza.html`,
   `muzeum-ps1.html`, `js/groza/`, `js/museum/ps1.js` ani obu arkuszy CSS.
2. **Zero importów z `js/groza/` i `js/museum/`.** Dzielimy dane, nie kod. Jedyny wspólny
   plik to `js/projects-data.js` i jest tylko do odczytu. Jeśli implementer potrzebuje
   czegoś na wzór `js/museum/perf.js`, pisze własne — 32 linijki nie są warte sprzężenia.
3. **Zero wspólnych globali i selektorów CSS.** Klasy w `css/kosmos.css` mają własny
   przedrostek i nie nadpisują niczego z `css/museum.css` ani `css/main.css`.
4. **Zero wspólnych assetów poza `assets/shots`**, który jest współdzielony i tylko do odczytu.

## Nawigacja i cel gry

- HUD pokazuje: aktualną powłokę i nazwę epoki, licznik **odwiedzonych 0/49**, kierunek do
  najbliższej nieodwiedzonej sondy, backend renderera.
- Odwiedzenie = zbliżenie się do sondy poniżej progu. Odwiedzona sonda zapala się na stałe
  i zostaje zapalona do końca sesji.
- Po komplecie 49 krótkie zakończenie i odnośnik do `index.html`, wzorem ekranu zwycięstwa
  z grozy.
- Postęp żyje w pamięci sesji. Bez `localStorage` — zapis stanu na dysku gracza to osobna
  decyzja, której nikt nie podjął.

## Budżet i wydajność

| pozycja | budżet |
|---|---|
| sześć map planet, WebP | ~1,2 MB |
| cztery do sześciu mgławic, WebP | ~0,9 MB |
| model rakiety `.glb` | ≤ 1 MB |
| zrzuty projektów (już w repozytorium) | 1,4 MB |
| **razem `assets/`** | **≤ 5 MB** |

Biblioteka z CDN nie wlicza się do budżetu repozytorium.

**Ryzyko liczby wywołań rysowania.** Muzeum przy 49 eksponatach miało 162 wywołania.
Tutaj dochodzą planety, sfera nieba i pył. Panele sond idą przez `InstancedMesh`, podpisy
tekstowe powstają tylko dla sond bliższych niż próg. Docelowo: **poniżej 200 wywołań
i 60 klatek na sekundę na komputerze**, zmierzone, nie oszacowane.

## Sposób weryfikacji

Reguły wypracowane na muzeum i grozie, obowiązujące w każdym zadaniu:

1. **Playwright, nie panel przeglądarki.** Panel wbudowany zwraca rozmiar okna 0×0
   i unieważnia każdy pomiar układu. Przed zaufaniem jakiemukolwiek pomiarowi sprawdzić
   `innerWidth > 0`.
2. **Kontrola negatywna obowiązkowa.** Zanim uznasz test za dowód, cofnij poprawkę i sprawdź,
   czy test potrafi oblać. Cztery z pięciu usterek w planie grozy siedziały w kodzie testów,
   nie w kodzie gry.
3. **Nie testuj przez kanał diagnostyczny**, jeśli sprawdzasz sterowanie. Test przez
   `window.__kosmos` nie zobaczy, że prawdziwa klawiatura jest zasłonięta — dokładnie tak
   przeszła niewykryta martwa klawiatura w muzeum. Używaj prawdziwych zdarzeń.
4. **Wyłącz pamięć podręczną przy kontrolach negatywnych.** Moduł spod tego samego `?v=`
   potrafi zostać stary i zamienić kontrolę w fałszywie negatywną.
5. **Backend renderera sprawdzany jawnie** — test musi potwierdzić, że w Chromium poszło
   WebGPU, a nie cicha awaria do WebGL 2.

## Ograniczenia globalne

- **Pliki nietykalne:** `index.html`, `museum.html`, `js/museum/**`, `js/main.js`,
  `js/projects-data.js`, `css/main.css`, `css/museum.css`. Muzeum i portfolio są wdrożone
  na żywej stronie publicznej.
- **Zero kroku budowania.** Statyczne HTML/CSS/JS, moduły ES przez import mapę, bez npm
  i bez pakowania.
- **Assety wyłącznie z jasną licencją** — domena publiczna albo CC BY z podpisem. Każdy plik
  wpisany do `assets/kosmos/LICENSES.md` z adresem źródła. Zakaz assetów ze sklepu Unity:
  licencja zabrania redystrybucji w publicznym repozytorium.
- **Zero nazw klientów i pracodawców** w repozytorium publicznym; prace klienckie opisane ogólnie.
- **Zero adresów IP i szczegółów infrastruktury** na stronie publicznej.
- **Zero odnośników do prywatnych repozytoriów** — dla odwiedzającego dają 404.
- **Zero liczników tokenów** — rozliczenie tokenów zostało usunięte ze strony decyzją
  właściciela (commit `d221f65`) i nie wraca.
- **Bez `git push` i bez scalania do `main`** w trakcie pracy podagentów. GitHub Pages buduje
  z `main`, więc każde wypchnięcie jest wdrożeniem na żywo.
- **Bez pobierania pełnych map naukowych.** `Mercury_MESSENGER_ClrMosaic_global_665m_v3.tif`
  waży 760 MB. Używamy wersji podglądowych 1024×512 albo 2048×1024, przeskalowanych i
  przekonwertowanych na WebP.

## Zweryfikowane fakty źródłowe

Sprawdzone przed napisaniem tej specyfikacji, nie przyjęte na słowo:

- **three.js 0.185.1** jest najnowszy na jsDelivr. `build/three.webgpu.min.js` = 652 kB,
  `build/three.tsl.js` = 33 kB, oba HTTP 200.
- **NASA 3D Resources** zawiera **257 plików `.glb`** — glTF binarne, czytane przez
  `GLTFLoader` bez konwersji, domena publiczna. Mediana 805 kB. Saturn V 905 kB,
  Voyager Probe (A) 279 kB, Cassini-Huygens (B) 404 kB, Parker Solar Probe 433 kB,
  Space Shuttle (B) 11 kB.
- **USGS Astropedia** wystawia mapy równoodległościowe planet z adnotacją
  „Access Constraints: public domain". Merkury 1024×512 JPEG = 120 kB (zweryfikowane
  pobraniem, proporcja 2,00). Wenus i Mars mają analogiczne strony.
- **ESA/Hubble**: „released under the Creative Commons Attribution 4.0 International license
  and may on a non-exclusive basis be reproduced without fee provided they are clearly and
  visibly credited". Filary Stworzenia w wersji ekranowej 1280 px = 0,3 MB
  (pełna 25,6 MB — nie pobieramy).
- W repozytorium NASA mapy powierzchni są dobrze pokryte **tylko dla Ziemi i Księżyca**
  (`Earth (B).tif` 49 MB, mapy Księżyca 26–49 MB). Pozostałe planety biorą się z USGS.
- **Podręcznik three.js** podaje kształt import mapy dla WebGPU (przepisany wyżej dosłownie)
  oraz wymóg `await renderer.init()` przy własnej pętli renderowania.

## Otwarte pytanie do właściciela

Strona głosi „16 miesięcy budowania z AI", licząc od marca 2025 — tyle pokrywają dane
w `js/projects-data.js`. Właściciel pracuje z AI od 2022 roku, więc liczba opisuje
udokumentowany wycinek, nie całość. Pytanie zadane trzykrotnie, bez odpowiedzi; nie blokuje
tej gry, bo `index.html` jest nietykalny, ale wraca przy każdym projekcie opartym o te dane.

## Poza zakresem

- Zapis postępu między sesjami.
- Sterowanie dotykowe. Gra jest na komputer; wersja na telefon to osobna decyzja.
- Dźwięk i muzyka. Jeśli mają być, to osobna specyfikacja — groza pokazała, że warstwa
  dźwiękowa to pełne zadanie, nie dodatek.
- Fizyka orbitalna, grawitacja i proca grawitacyjna. Właściciel wybrał lot bez oporu.
- Odnośnik do gry z `index.html`. To plik nietykalny; dodanie odnośnika jest osobną decyzją
  właściciela po obejrzeniu gotowej gry.
