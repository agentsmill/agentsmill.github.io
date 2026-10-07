# Muzeum Budowania 3.0 — amfilada, która dojrzewa

**Data:** 2026-10-07
**Status:** projekt zatwierdzony w rozmowie 7 X 2026, przed planem wdrożenia
**Zastępuje:** budynek i ekspozycję z `2026-08-05-muzeum-3d-design.md` (sekcje 2, 4, 5, 6 i 7).
Zostają z niego: kolizje Octree + Capsule, blokada wskaźnika z poprawkami pod iOS, joystick,
tabliczki DOM, lista eksponatów, strażnik ładowania i komunikat bez WebGL.

## Cel

Muzeum ma zachwycać tym samym, czym zachwyca prawdziwe muzeum: salami, światłem i drogą przez
nie, a nie korytarzem. Właściciel chce zostać przy formule „chodzisz po muzeum jak po muzeum”.
Zmienia się jakość podróżowania: zamiast 354 m jednej tuby są prawdziwe sale w amfiladzie,
ruch jest płynny i nie wymaga przemierzania wszystkiego pieszo, a sam budynek po drodze
opowiada upływ czasu.

## Diagnoza stanu obecnego (pomiar na żywej stronie, 7 X)

| obserwacja | skąd się bierze |
|---|---|
| amfilada kończy się na z = 354 m, sala „Rok agentów” ma 129 m | `world.js` stawia eksponaty kursorem `zCursor`, a `dlugosciSal()` robi z sumy kroków długość sali. Sala jest tak długa, ile ma eksponatów — nie ma rozmiaru własnego |
| wszędzie to samo równe światło, beton, tynk i parkiet | jeden zestaw materiałów na cały budynek, reflektory co 16 m |
| napisy wiszą w powietrzu i nachodzą na siebie („Strażacki Ekspres Leona” na „Age of Agents”) | podpisy to sprite'y obracające się do kamery, bez ściany i bez kolizji między sobą |
| 47 z 55 prac to identyczne czarne cokoły z obrazkiem nad nimi | jedna funkcja `plinth()` na wszystko, co nie ma eksponatu autorskiego |
| żeby zobaczyć tegoroczne prace, trzeba przejść ponad 250 m | jedyne skróty to lista i tura, oba teleportują albo prowadzą wzdłuż całej osi |

## Decyzje (potwierdzone z właścicielem 7 X)

| # | decyzja | odrzucone | uzasadnienie / słowa właściciela |
|---|---|---|---|
| M1 | **Spacer po muzeum zostaje** | trzy kierunki abstrakcyjne: „Spirala czasu” (rotunda z rampą), „Puls” (linia EKG jako budynek), „Teatr anatomiczny” | „Ani ta, ani ta, ani ta (...) nie chcę odchodzić od takiej formacji, że chodzi się jak po muzeum” |
| M2 | **Plan A: amfilada sal** — sale jedna za drugą, wszystkie drzwi na jednej osi | B „Rotunda” (skrzydła wokół kopuły), C „Dom twórcy” (pokoje tematyczne zamiast epok) | chronologia zostaje kręgosłupem; z atrium widać na wylot całą drogę |
| M3 | **Styl D: architektura dojrzewa** — atrium, I–II pałac; III–IV biała galeria; V–VI muzeum nocą | A sama noc, B sam pałac, C sama biała galeria | budynek sam opowiada czas; podgląd na żywo z prawdziwymi pracami oceniony przez właściciela |
| M4 | **Dźwięk opt-in w drzwiach**: „Wejdź z dźwiękiem” / „Wejdź w ciszy” | tylko gramofon; cisza | kroki, pogłos i ton sali budują wrażenie miejsca; gość decyduje sam |
| M5 | **Przebudowa na obecnych fundamentach**: three r169, WebGL, światło liczone na żywo | WebGPU jak w Kosmosie; światło wypiekane w Blenderze | `projects-data.js` jest jedynym źródłem prawdy — nowy projekt ma przebudować muzeum sam. Wypiekane mapy światła byłyby drugim źródłem, które się rozjeżdża przy każdej zmianie rozmiaru sali |

## 1. Budynek

**Kolejność:** atrium → I → II → III → IV → V (dwie sale) → VI (dwie sale) → drzwi do Kosmosu.
Wszystkie przejścia między salami leżą na osi x = 0, więc z atrium widać amfiladę na wylot:
ciepłe sale pałacu, białą salę, ciemność rozświetloną ekranami i na samym końcu świecące drzwi
do Kosmosu. Długość od wejścia do końca ok. 140 m (dziś 354 m).

**Sale powstają z danych, nie z ręki.** Plan budynku liczy moduł `plan.js` z `ERAS` i
`PROJECTS` przy każdym wejściu:

1. Prace epoki (bez projektów Leona, patrz niżej) sortowane po dacie.
2. Pojemność sali to `POJ = 10` prac, licząc eksponaty autorskie — te stoją na cokołach
   wzdłuż sali poza osią przejścia, reszta wisi na ścianach. Epoka z więcej niż `POJ` pracami
   dzieli się na `ceil(n / POJ)` sal po równo, chronologicznie (V i VI dają dziś po dwie sale
   po 10 prac).
3. Szerokość sali zależy od strefy (pałac 12 m, biel 12 m, noc 14 m). Długość wynika z
   potrzebnej długości ściany: prace wiszą na obu ścianach bocznych co
   `max(szerokość pracy + 1,4 m; 3,4 m)`, z marginesem 1,5 m od narożników; minimum 10 m.
   Sala z jedną pracą to gabinet 8 × 8 m (dziś: II z „Akordami Zmierzchu”).
4. Nowa epoka albo nowy projekt nie wymaga żadnej zmiany w kodzie muzeum — plan przelicza się
   sam, a sala, która przestaje się mieścić, dzieli się na dwie.

**Atrium** (16 × 16 m, pałac, ciepły kamień): kardiogram 19 miesięcy wpuszczony w posadzkę
jako mosiężna linia prowadząca do drzwi sali I; z boków drzwi do Kina i Archiwum.

**Sale boczne:**

| sala | gdzie | zawartość |
|---|---|---|
| **Kino** | lewa ściana atrium | ciemna sala, kilka ławek, duży ekran: showreel z `ai-video-portfolio` (3,8 MB, CORS `*` sprawdzone 7 X) jako `VideoTexture`, plus mniejsze ekrany z dwoma ujęciami z GB10 (`assets/wideo/`). Wideo wczytuje się dopiero przy wejściu do sali |
| **Archiwum** | prawa ściana atrium | szafa z 28 szufladami — po jednej na wpis `ARCHIVE`, z mosiężną etykietą; kliknięcie otwiera panel z wpisem (tytuł, data, notka, odnośnik, jeśli jest) |
| **Pokój Leona** | ściana boczna drugiej sali V | trzy projekty z kategorią `leon` (Strażacki Ekspres Leona, Wiewiórka Leona, Robotami/Józef). W salach epok ich nie ma — są tu, chronologicznie po sąsiedzku. Kolejka z eksponatu autorskiego jeździ dookoła całego pokoju |

**Drzwi do Kosmosu** zamykają oś za drugą salą VI: rozgwieżdżony otwór, po zbliżeniu
przycisk „Wejdź do Kosmosu” → przejście (zaciemnienie) na `kosmos.html`.

## 2. Wygląd stref (styl D)

Strefa wynika z numeru epoki: 1–2 pałac, 3–4 biel, 5 i każda następna noc (teraźniejszość jest
zawsze nocą). Mapowanie siedzi w jednej tabeli w `sale.js`.

| | **Pałac** (atrium, I, II, Archiwum) | **Biała galeria** (III, IV) | **Noc** (V, VI, Kino) |
|---|---|---|---|
| ściany | każda sala w swoim kolorze (I butelkowa zieleń, II wiśnia, atrium ciepły kamień), lamperia w ciemniejszym odcieniu, białe listwy, gzyms | biel, bez faktury | granatowy tynk |
| posadzka | parkiet (`parkiet_*`) | jasny polerowany beton (faktura z `beton_*`, bez brązowej mapy koloru) | czarne lustro: `Reflector` pod półprzezroczystą płytą |
| sufit i światło | świetlik z mullionami: świecąca tafla + `RectAreaLight`; mosiężne lampki nad pracami | świecący sufit w kratownicę + `RectAreaLight` | ciemny strop, szyny z reflektorami: snop ciepłego światła na każdą pracę; bursztynowa listwa przy podłodze; ciepłe podświetlenie ściany z drzwiami |
| drzwi | białe opaski z nadprożem, nazwa epoki złotą antykwą (Cormorant Garamond) | goły otwór; napis winylowy na ścianie obok: cyfra, tytuł, zakres dat | bursztynowy próg; nazwa epoki świeci nad drzwiami (Syne) |
| ławki | aksamit na drewnianych nogach | blok jasnego dębu | czarna skóra, stal |

**Szyld epoki ma styl ściany, na której wisi**, a nie sali, do której prowadzi (sprawdzone w
podglądzie: złoty szyld pałacu nad drzwiami do białej sali). Przejścia między strefami
(II → III, IV → V) są celowe: po stronie pałacu opaski, po stronie bieli goły otwór, po
stronie nocy próg świetlny.

**Adaptacja oka.** Każda strefa ma docelową ekspozycję; przy przejściu ekspozycja dochodzi do
niej płynnie w ok. 1,2 s, jak oko wchodzące z jasnej sali do ciemnej. Mapowanie tonów jedno
na cały budynek: ACES Filmic. Przy `prefers-reduced-motion` adaptacja jest natychmiastowa.

**Pokój Leona** to wariant białej galerii: ciepła pastelowa ściana i okrągły dywan.
**Kino** to wariant nocy bez lustra, z wykładziną.

## 3. Eksponaty i zawieszenie

- **Zrzut ekranu wisi jako ekran**: obudowa urządzenia, obraz świecący sam (`emissiveMap`),
  lekki połysk szkła. **Okładka AI wisi jako druk**: oświetlana z zewnątrz, w ramie stylu sali
  (złota rama z passe-partout w pałacu, czarna listwa w nocy, dibond z cieniem w bieli).
  Zasada uczciwości z karty budowania — zrzut i ilustracja różnią się od pierwszego spojrzenia.
- **Tabliczka na ścianie** obok każdej pracy: tytuł, data, „zrzut działającej rzeczy” albo
  „wizualizacja AI”. Pełny opis (opis, technologie, odnośniki, `access`) w tabliczce DOM jak
  dziś — otwiera się po podejściu do pracy. Sprite'y znikają z muzeum całkowicie.
- **Kolejność wieszania**: chronologicznie, na przemian ściana lewa i prawa, od wejścia do
  wyjścia z sali.
- **Wyróżnione (12, `featured`)** zostają na swoim miejscu w kolejności, ale dostają większy
  format (2,6 m zamiast 1,9 m) i własne, mocniejsze światło.
- **Eksponaty autorskie (8)** z `exhibits.js` zostają: przechodzą na materiały strefy, stoją na
  cokołach poza osią przejścia (x = ±2,6 m) i dostają kolizję (bryła wymierzona na widoczną
  masę, nie na pierścień poświaty — uwaga z domknięcia specyfikacji z 6 VIII).
- **Gramofon** (nowy eksponat) w sali II: talerz z płytą, ramię, mosiężna tuba. Kliknięcie
  gra prawdziwą kompozycję przez istniejący rdzeń `js/gramofon.js` (YouTube nocookie, wczytany
  dopiero przy kliknięciu); płyta kręci się, gdy gra.
- **Obrazy**: na poziomie wysokim wszystkie od startu (widok na wylot z atrium pokazuje prace w
  dalekich salach). Na poziomie średnim i niskim wczytywane salami: gdy gość jest najwyżej dwie
  sale dalej, zwalniane, gdy odejdzie dalej niż cztery; do tego czasu ekran świeci przygaszonym
  kolorem kategorii, a druk ma neutralną płytę — z odległości kilkudziesięciu metrów nie do
  odróżnienia. Pamięć karty na telefonie ma budżet (dziś zrzuty i okładki to ok. 57 MB RGBA naraz).

## 4. Ruch i nawigacja

- **Kliknij podłogę → idziesz tam.** Płynny przejazd z łagodnym startem i hamowaniem, kamera
  obraca się w kierunku ruchu. Trasa przez drzwi: sale są węzłami grafu, drzwi krawędziami;
  droga = kolejne środki drzwi, potem cel. Każde dotknięcie klawiatury, joysticka albo
  przeciągnięcie przerywa przejazd.
- **Kliknij pracę → podchodzisz do niej.** Kamera zatrzymuje się na wprost pracy w odległości
  `max(2,2 m; 1,25 × szerokość)`, na wysokości oczu, i otwiera tabliczkę. Przy eksponatach
  autorskich: kadr 3–4 m, lekko z góry.
- **Plan w rogu.** Schemat budynku (SVG z tego samego `plan.js`), strefy w kolorach, gość jako
  kropka z kierunkiem patrzenia. Dotknięcie sali → szybka podróż: ten sam przejazd przez drzwi,
  do 3× szybciej, z delikatnym poszerzeniem kąta widzenia przy dużej prędkości. Nigdy twarde
  cięcie. Na telefonie plan zwinięty do przycisku.
- **Klawiatura i dotyk zostają**: WASD/strzałki + mysz z blokadą wskaźnika, joystick i
  przeciąganie na dotyku. Chód dostaje bezwładność (rozpędzanie i hamowanie) i delikatne
  bujanie kroku (wyłączone przy `prefers-reduced-motion`).
- **„Oprowadź mnie”** = wycieczka po 12 wyróżnionych, chronologicznie: przejazd, przystanek z
  tabliczką, dalej. Przerywalna jak każdy przejazd.
- **Kolizje**: ściany (jak dziś) plus cokoły, ławki, gramofon i szafa Archiwum. Otwory drzwi
  2,4 m — kapsuła gracza (promień 0,35 m) nie zaczepia o ościeża.

## 5. Dźwięk

- **Ekran wejścia** zastępuje dzisiejszy ekran ładowania: tytuł, jedno zdanie, dwa przyciski —
  „Wejdź z dźwiękiem”, „Wejdź w ciszy”. Kliknięcie jest gestem, który odblokowuje
  `AudioContext`. W HUD przełącznik dźwięku na stałe.
- **Wszystko generowane w kodzie**, zero plików — na bazie `js/groza/dzwiek.js` z gałęzi
  `groza` (synteza kroków przez filtr pasmowy, pogłos z syntetycznej odpowiedzi impulsowej):
  - kroki zależne od posadzki: parkiet, beton, kamień/lustro, wykładzina Kina; w rytmie bujania;
  - pogłos zależny od sali: długość ogona z objętości sali (gabinet krótki, atrium długie);
  - ton sali w każdej strefie: pałac ciepły, biel jasny szum powietrza, noc niski pomruk;
  - w atrium ciche uderzenie serca w rytmie świecenia kardiogramu w posadzce.
- **Gramofon** gra przez `gramofon.js`; przy wyłączonym dźwięku przycisk na tabliczce nadal
  działa (gość prosi o dźwięk wprost).
- Wszystkie poziomy ciche, bez nagłych dźwięków; karta przeglądarki w tle → `suspend()`.

## 6. Wydajność

- **Stała pula świateł.** Forward renderer three.js wlicza każde światło sceny do każdego
  shadera, a zmiana liczby świateł rekompiluje programy. Dlatego liczba świateł jest stała
  przez całą wizytę — punkt wyjścia: 12 reflektorów, 4 `RectAreaLight`, 1 kierunkowe z cieniem;
  dokładne liczby ustala pomiar w planie wdrożenia — a przy zmianie sali pula
  przesiada się na bieżącą i sąsiednie sale. Sale dalsze świecą „na niby”: plamy światła na
  ścianach jako addytywne płaszczyzny z gradientem, świecące tafle sufitów bez światła — z
  daleka nie do odróżnienia.
- **Lustro tylko tam, gdzie gość**: jeden `Reflector`, przestawiany na bieżącą salę nocy
  (kosztuje dodatkowy render sceny).
- **Trzy poziomy jakości**: wysoki (desktop: GTAO, cienie, lustro, poświata, DPR do 1,75),
  średni (GTAO w połowie rozdzielczości, cień tylko z kierunkowego), niski (telefon: bez GTAO,
  bez lustra, bez cieni, DPR 1,25). Start z detekcji (`pointer: coarse`), dalej strażnik
  `perf.js` jak dziś — degradacja jednokierunkowa, kolejno: GTAO → lustro → cienie → DPR.
- **Kryteria**: ≥ 60 fps na MacBooku 1440 × 900 w atrium (najgorszy kadr: widok na wylot przez
  wszystkie sale) i w sali nocy z lustrem; ≥ 30 fps na średnim telefonie na niskim poziomie.
- **Waga**: bez nowych ciężkich plików. Istniejące tekstury PBR, zrzuty i okładki, jeden nowy
  krój (Cormorant Garamond 600, latin-ext) na szyldy pałacu. Wideo Kina leniwie.

## 7. Interfejs

- HUD: „← Karta budowania”, nazwa bieżącej sali (jak dziś `#hud-era`, aria-live tylko przy
  zmianie), „Oprowadź mnie”, „Lista eksponatów”, przełącznik dźwięku, PL/EN, plan w rogu.
- Celownik w trybie blokady wskaźnika zostaje; najechanie na pracę albo podłogę pokazuje, co
  zrobi kliknięcie (podejdź / idź tutaj).
- Lista eksponatów: pogrupowana salami nowego planu (z Kinem, Archiwum i Pokojem Leona);
  kliknięcie = przejazd do pracy.
- Teksty: wszystkie nowe napisy w `i18n.js` (PL/EN), tytuły i opisy prac jak dziś z danych.
- Uchwyt `window.__mz` zostaje (automatyzacja testów), dostaje `plan`, `nawigacja`, `dzwiek`.

## 8. Pliki

| plik | zmiana |
|---|---|
| `museum.html` | ekran wejścia, HUD (dźwięk, plan), import map dla nowych modułów, nowy stempel `?v=` |
| `css/museum.css` | ekran wejścia, plan w rogu, przełącznik dźwięku, panel Archiwum |
| `js/museum/plan.js` | **nowy** — dane → sale, wymiary, drzwi, graf przejść, pozycje prac |
| `js/museum/sale.js` | **nowy** — zestaw sal w trzech stylach (z podglądu z 7 X), ściany z połówek muru, detale, światła stref |
| `js/museum/zawieszenie.js` | **nowy** — ekrany, druki, ramy, tabliczki ścienne, światło prac |
| `js/museum/nawigacja.js` | **nowy** — przejazdy (podłoga, praca, plan), wycieczka, adaptacja ekspozycji |
| `js/museum/minimapa.js` | **nowy** — plan w rogu (SVG) |
| `js/museum/dzwiek.js` | **nowy** — dźwięk proceduralny (port z gałęzi `groza`) |
| `js/museum/swiatla.js` | **nowy** — stała pula świateł i światło „na niby” dla sal dalszych |
| `js/museum/render.js` | GTAO, `Reflector`, poziomy jakości, ACES + ekspozycja sterowana z zewnątrz |
| `js/museum/player.js` | bezwładność, przyjmowanie przejazdów, kolizje mebli; reszta bez zmian |
| `js/museum/exhibits.js` | materiały stref, cokoły, kolizje, gramofon |
| `js/museum/ui.js`, `perf.js`, `main.js` | lista wg sal, panel Archiwum, nowe stopnie degradacji, spięcie |
| `js/museum/world.js`, `js/museum/building.js` | **usunięte** |
| `js/i18n.js` | nowe napisy |
| `index.html`, `kosmos.html` | tylko wspólny stempel `?v=` (jedna wersja na trzy strony) |

`js/projects-data.js` bez zmian.

## 9. Obsługa błędów i przypadków brzegowych

| sytuacja | zachowanie |
|---|---|
| brak WebGL | istniejący komunikat + lista, bez zmian |
| moduł albo CDN nie wczytał się | istniejący strażnik ładowania z `museum.html` (10 s) |
| tekstura pracy się nie wczytała | rama/obudowa zostaje z neutralną płytą i tabliczką — sala nie ma dziury |
| wideo Kina niedostępne (sieć, autoplay) | plakat (`poster`) na ekranie i przycisk „Odtwórz” |
| `AudioContext` zablokowany albo brak Web Audio | muzeum działa w ciszy, przełącznik pokazuje „dźwięk niedostępny” |
| YouTube zablokowany (gramofon) | komunikat z `gramofon.js` i odnośnik do YouTube, jak dziś |
| utrata kontekstu WebGL | komunikat z prośbą o odświeżenie zamiast czarnego ekranu |
| przejazd natrafia na przeszkodę | kolizja zatrzymuje kapsułę; po 1 s bez postępu przejazd się kończy |
| `prefers-reduced-motion` | przejazdy skrócone do krótkiego przenikania, bez bujania, ekspozycja natychmiast |
| bardzo słaby sprzęt | degradacja z `perf.js` aż do niskiego poziomu; komunikat w rogu jak dziś |

## 10. Testy

Bez frameworka, Playwright na lokalnym serwerze, jak przy poprzednich zmianach:

1. zero błędów w `window.__errs` i w konsoli, zero 404;
2. `renderer.info` z niezerową liczbą wywołań — scena żyje i jest widoczna;
3. plan: liczba sal i prac zgadza się z danymi (55 projektów: 52 w salach epok + 3 w Pokoju
   Leona), każda praca ma ścianę i nie nachodzi na sąsiednią;
4. każda sala osiągalna z planu w rogu; przejazd z atrium do drugiej sali VI przechodzi przez
   wszystkie drzwi bez zaklinowania;
5. kliknięcie podłogi i kliknięcie pracy kończą się w oczekiwanym miejscu (tolerancja 0,3 m);
6. kolizje: marsz w ścianę, w cokół, w ławkę — zatrzymanie;
7. wycieczka odwiedza 12 wyróżnionych w kolejności chronologicznej;
8. dźwięk: „Wejdź z dźwiękiem” → `AudioContext.state === "running"`; przełącznik wycisza;
   „Wejdź w ciszy” → kontekst nie powstaje;
9. telefon 390 × 844: dotyk, joystick, plan zwinięty, brak przewijania w bok;
10. fps przez 5 s w atrium (widok na wylot) i w sali nocy, na wysokim poziomie;
11. zrzuty: atrium, sala pałacu, biała, nocna, Kino, Archiwum, Pokój Leona, drzwi Kosmosu —
    do oceny właściciela przed publikacją;
12. PL i EN.

Publikacja (push na `main`) dopiero po zgodzie właściciela, jak przy „Monitorze”.

## Czego ten projekt świadomie nie robi

- Nie przechodzi na WebGPU i nie wypieka światła (decyzja M5).
- Nie dodaje modeli 3D z zewnątrz — cała architektura i meble z kodu.
- Nie zmienia danych w `projects-data.js` ani karty budowania i Kosmosu (poza stemplem wersji).
- Nie dodaje plików dźwiękowych — dźwięk jest syntezowany.
- Nie robi trybu VR, multiplayera ani zapisu stanu wizyty.

## Ryzyka

- **Wydajność przy widoku na wylot.** Z atrium widać wszystkie sale naraz. Stała pula świateł
  i światło „na niby” to główna odpowiedź; pomiar fps w tym kadrze jest kryterium akceptacji,
  nie formalnością.
- **Spójność trzech stylów.** Trzy zestawy materiałów do dopracowania zamiast jednego;
  przejścia między strefami muszą wyglądać na zamierzone. Zrzuty każdej strefy idą do oceny
  właściciela przed publikacją.
- **Telefon.** Pamięć karty i GTAO to dwa najdroższe elementy; niski poziom wyłącza GTAO i
  lustro od startu, a tekstury prac są wczytywane salami.
