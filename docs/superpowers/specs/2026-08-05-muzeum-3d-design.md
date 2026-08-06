# Muzeum Budowania 2.0 — przebudowa na grę 3D

**Data:** 2026-08-05
**Status:** zatwierdzony projekt, przed planem wdrożenia
**Zastępuje:** on-rails muzeum z `2026-08-04-omniportfolio-design.md`, dodatek 1

## Cel

Muzeum ma wyglądać i sterować się jak prawdziwa gra 3D, a nie jak wizualizacja
danych z kamerą na szynach. Obecna wersja jest technicznie poprawna i pusta
wizualnie: nie ma cieni, tone mappingu, mapy środowiskowej ani post-processingu,
więc każdy materiał wygląda jak płaska naklejka, a gość leci przez czarną pustkę
bez poczucia, że jest w budynku.

## Diagnoza stanu obecnego

`js/museum.js` (736 linii) buduje sensowną scenę, ale pomija całą warstwę, która
w grach odpowiada za wrażenie realności:

| brak | skutek |
|---|---|
| `renderer.shadowMap` nigdy nie włączony | nic nie rzuca cienia — obiekty nie są osadzone w przestrzeni |
| brak `toneMapping` | brak filmowego kontrastu, kolory płaskie |
| brak `envMap` | `MeshStandardMaterial` z `metalness` nie ma czego odbijać → metal jak matowy plastik |
| brak post-processingu | brak bloomu, a to on sprzedaje świecące eksponaty w ciemnej sali |
| brak architektury | tylko podłoga i eksponaty; nie ma ścian, sufitu, portali |
| kamera na szynach | najbardziej „niegrowa" cecha całości |

Co jest dobre i zostaje: osiem autorskich eksponatów proceduralnych
(`exAgeOfAgents`, `exEmpowerHer`, `exReverie`, `exEkspres`, `exDragRace`,
`exLastBox`, `exWhisper`, `exAnatomy`), ramki ze zrzutami ekranu, tabliczki DOM,
lista awaryjna dla braku WebGL, renderowanie z `PROJECTS`.

## Decyzje (potwierdzone z użytkownikiem)

| # | Decyzja | Uzasadnienie |
|---|---|---|
| M1 | **Swobodny spacer WASD + myszka** zamiast szyn | Jedna rzecz, która najbardziej mówi „gra". Wymusza prawdziwe sale ze ścianami — w pustce swobodny ruch gubi się natychmiast. |
| M2 | **Sufit budżetu 10 MB**: mapa środowiskowa + tekstury PBR, geometria nadal proceduralna | Światło i post-processing dają ~80% efektu „gry", tekstury kolejne ~15%, szczegółowe modele ostatnie 5% za najwięcej bajtów. Strona jest wizytówką otwieraną z LinkedIna na telefonie. *Po policzeniu assetów realny koszt wyszedł ~4,5 MB — mapa środowiskowa okazała się darmowa (p. sekcja 1), więc na HDRI nie idzie ani bajt.* |
| M3 | **Atrium + amfilada sześciu sal epok** | Chronologia jest krzyżem pacierzowym tego portfolio; idąc naprzód idziesz przez czas. Zgubić się nie sposób, a mniej geometrii = więcej budżetu na jakość sali. |
| M4 | **Bez assetów z Unity Asset Store** | Ich licencja zabrania redystrybucji, a repo jest publiczne — plik trafiłby na GitHuba do pobrania przez każdego. CC0 daje ten sam efekt bez tego problemu. |

## Architektura rozwiązania

### 1. Warstwa renderowania (`js/museum/render.js`)

```js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace  = THREE.SRGBColorSpace;
```

**Mapa środowiskowa:** `RoomEnvironment` z addonów three.js, przepuszczona przez
`PMREMGenerator`. Generowana proceduralnie w kodzie — **kosztuje 0 bajtów** i
naprawia najbardziej rzucający się w oczy problem (materiały metaliczne nie mają
czego odbijać). Zaoszczędzone ~1,5 MB, które poszłoby na HDRI, idzie na tekstury,
które widać bardziej.

**Post-processing:** `EffectComposer` → `RenderPass` → `UnrealBloomPass`
(threshold ~0.85, strength ~0.5, radius ~0.4) → `OutputPass`. Bloom jest tu
niezbędny, nie ozdobny: eksponaty są świecącymi obiektami w ciemnej sali i bez
bloomu wyglądają jak płaskie kolorowe bryły.

Wszystkie addony zweryfikowane pod `three@0.169.0` na jsDelivr (HTTP 200).
Import map w `museum.html` wymaga dodania mapowania `three/addons/`.

### 2. Architektura budynku (`js/museum/world.js`)

**Atrium:** 16×16 m, wysokość 9 m, świetlik w suficie, kardiogram 16 miesięcy
wypalony w posadzce. Moment przybycia — pierwsze, co gość widzi.

**Amfilada:** sześć sal, każda ~14×18 m i 5 m wysokości, ustawionych jedna za
drugą wzdłuż osi Z, połączonych portalami 3×2,8 m. Nad każdym portalem
podświetlona nazwa epoki z `ERAS`. Łączna długość ~120 m.

Geometria z `BoxGeometry` — ściany, sufity, listwy. Bez modeli zewnętrznych.

### 3. Sterowanie i kolizje (`js/museum/player.js`)

`PointerLockControls` + WASD, Shift przyspiesza, delikatne bujanie kroku
(wyłączone przy `prefers-reduced-motion`). Wysokość oczu 1,7 m.

**Kolizje:** `Octree` + `Capsule` z addonów three.js — to samo rozwiązanie, co w
oficjalnym demie FPS three.js. Daje ślizganie po ścianach i przechodzenie przez
portale za darmo, zamiast ręcznego AABB, które zacina się w narożnikach.
`Octree.fromGraphNode()` buduje się raz z siatki kolizyjnej (uproszczone bryły
ścian, nie eksponaty).

**Mobile:** własny dotykowy joystick (~60 linii, bez zewnętrznej biblioteki) —
lewy kciuk chodzi, przeciągnięcie po prawej stronie ekranu rozgląda.

**„Oprowadź mnie":** przycisk przesuwający kamerę automatycznie po trasie przez
wszystkie sale. Ratuje mobile, dostępność i gości, którzy nie chcą uczyć się WASD.

### 4. Oświetlenie

Na salę: 2–3 reflektory (`SpotLight`) rzucające cień, wycelowane w eksponaty, plus
emisyjne listwy w kolorze epoki wzdłuż podłogi. W atrium `DirectionalLight` przez
świetlik.

**Wydajność** to główne ryzyko tego projektu: sześć sal, 49 eksponatów, cienie i
bloom na laptopie bez GPU. Ograniczenia:
- rozmiar mapy cieni 1024, nie więcej
- najwyżej ~4 światła rzucające cień aktywne naraz
- widoczność sal przełączana ręcznie: renderowana tylko bieżąca i sąsiednie
- `InstancedMesh` dla powtarzalnych elementów (cokoły, listwy)

Kryterium akceptacji: 60 fps na MacBooku w rozdzielczości 1440×900, minimum 30 fps
na średnim telefonie.

### 5. Eksponaty (`js/museum/exhibits.js`)

Osiem autorskich eksponatów zostaje bez zmian w geometrii — dostają materiały PBR
i `emissive`. To projekty użytkownika przedstawione bryłą; wyrzucenie ich byłoby
stratą. Ramki ze zrzutami dostają szklaną warstwę i cień. Pozostałe projekty na
cokołach, jak dotąd.

### 6. Nawigacja i UI (`js/museum/ui.js`)

Tabliczki DOM (jak teraz), lista awaryjna (jak teraz), plus wskaźnik postępu
pokazujący, w której sali jesteś i ile zostało. Bez minimapy — amfilada jej nie
potrzebuje.

### 7. Assety

Cztery zestawy PBR z Poly Haven (CC0, bez wymogu atrybucji):

| zastosowanie | asset | 1k JPG |
|---|---|---|
| podłoga atrium | `smooth_concrete_floor` | 1,92 MB |
| podłoga sal | `rectangular_parquet` | 1,30 MB |
| ściany | `plastered_wall_04` | 0,90 MB |
| detal metalowy | `metal_plate_02` | 1,80 MB |

Po trzy mapy na zestaw: `Diffuse` (map), `nor_gl` (normalMap) i `arm` — jeden plik
RGB pakujący AO, roughness i metalness, który three.js podpina do trzech slotów
naraz. To standard i jest mniejsze niż osobne mapy.

**Razem 5,9 MB w JPG → ~3 MB po konwersji na WebP.** Z zrzutami ekranu (1,4 MB)
całe muzeum zamyka się w ~4,5 MB, poniżej zakładanych 10 MB.

Assety trafiają do `assets/museum/` z plikiem `LICENSES.md` wymieniającym źródło
i licencję każdego z nich.

### 8. Podział plików

`js/museum.js` (736 linii) urósłby do ~1500. Rozbicie na moduły ES — import map
już jest, więc to czysta zmiana:

| plik | odpowiedzialność |
|---|---|
| `js/museum/main.js` | bootstrap, pętla renderowania, resize |
| `js/museum/render.js` | renderer, post-processing, mapa środowiskowa, oświetlenie |
| `js/museum/world.js` | atrium, sale, ściany, portale, siatka kolizyjna |
| `js/museum/exhibits.js` | osiem autorskich eksponatów, cokoły, ramki |
| `js/museum/player.js` | PointerLockControls, kolizje, joystick, tryb „oprowadź mnie" |
| `js/museum/ui.js` | tabliczki, lista awaryjna, wskaźnik postępu |

## Obsługa błędów i przypadków brzegowych

| sytuacja | zachowanie |
|---|---|
| brak WebGL | istniejąca lista awaryjna, bez zmian |
| tekstury się nie wczytały | materiały wracają do jednolitych kolorów — scena działa, tylko gorzej wygląda |
| Pointer Lock odrzucony przez przeglądarkę | komunikat + tryb „oprowadź mnie" jako wyjście |
| `prefers-reduced-motion` | bujanie kroku wyłączone, automatyczna trasa wolniejsza |
| słaby sprzęt | średnia z 90 klatek poniżej 25 fps → wyłączenie bloomu; jeśli po 90 kolejnych nadal <25 fps → wyłączenie cieni; komunikat w rogu. Degradacja jednokierunkowa, żeby nie migotała w tę i z powrotem |
| dotyk bez klawiatury | joystick pojawia się automatycznie przy pierwszym `touchstart` |

## Testy

Bez frameworka testowego w tym repo — weryfikacja przez Playwright, jak przy
poprzednich zmianach:

1. scena się inicjalizuje, zero błędów w konsoli
2. `renderer.info.render` pokazuje niezerowe `calls` i `triangles` (ten test
   wykrył poprzednio, że scena żyła, a była niewidoczna)
3. gracz nie przechodzi przez ściany: symulacja ruchu w ścianę, sprawdzenie pozycji
4. każda z sześciu sal osiągalna trybem „oprowadź mnie"
5. fps mierzony przez 5 s w atrium i w najgęstszej sali
6. zrzuty ekranu z atrium i dwóch sal do oceny wizualnej
7. mobile 390×844: joystick widoczny, brak przewijania w poziomie

## Czego ten projekt świadomie nie robi

- Nie dodaje modeli 3D mebli, roślin ani ludzi (budżet bajtów)
- Nie dodaje dźwięku (osobna decyzja, nie pytana)
- Nie tłumaczy muzeum na angielski (odłożone globalnie)
- Nie zmienia strony głównej ani danych w `projects-data.js`

## Wynik wdrożenia (Zadanie 7, 2026-08-06)

Siedem zadań zamknięte na gałęzi `muzeum-3d` (bez `push` do `main` — decyzja
świadoma, patrz niżej). Poniżej wynik względem kryteriów akceptacji z sekcji
„Oświetlenie" i „Testy".

**FPS.** Zmierzone metodą z Kroku 3 planu (`requestAnimationFrame`, 120 klatek)
w atrium i w sali 5 („Rok agentów", 23 projekty, najgęstsza z sześciu):

| miejsce | fps (metoda z planu) | ms/klatkę (surowy `composer.render()`, 200 wywołań) |
|---|---|---|
| atrium | 121 | 1,55 ms (~644 fps bez limitu) |
| sala 5 | 122 | 1,45 ms (~690 fps bez limitu) |

Obie liczby są **capowane**, nie realnym sufitem — 121/122 to prawie na pewno
częstotliwość odświeżania panelu Playwright (blisko 120 Hz), nie granica
wydajności sceny. Dowód: surowy koszt `composer.render()` (bez `rAF`, bez
capu) wychodzi ~1,5 ms/klatkę w obu miejscach — to i tak dużo poniżej budżetu
16,7 ms potrzebnego na 60 fps, więc scena nie jest renderowana na granicy w
żadnym z dwóch miejsc. Kryterium **≥60 fps na 1440×900 spełnione z dużym
zapasem** (~2× wprost, i jeszcze więcej wg surowego pomiaru).

**Warunki pomiaru — zastrzeżenie uczciwości.** Pomiar w Playwright (Chromium
sterowany przez CDP), prawdopodobnie z ograniczeniami headless/wirtualnego
ekranu — wydajność bywa niereprezentatywna w obie strony względem realnego
MacBooka z fizycznym ekranem. Telefon **nie został zmierzony fizycznie** —
środowisko nie miało dostępu do realnego urządzenia mobilnego ani do
emulacji GPU telefonu; zweryfikowano tylko warstwę interakcji (joystick,
brak przewijania poziomego przy 390×844), nie fps. Kryterium „≥30 fps na
telefonie" pozostaje bez własnego pomiaru w tym zadaniu — dziedziczone z
poprzednich zadań bez nowych danych.

**Żadna z ratunkowych degradacji z planu (mapy cieni 512, ograniczenie
widoczności sal) nie była potrzebna** — scena mieści się w budżecie przy
domyślnych ustawieniach (mapy cieni 1024, wszystkie sale renderowane).
Strażnik wydajności (`perf.js`) został i tak zaimplementowany w pełni jako
zabezpieczenie na słabszym sprzęcie odwiedzającego (poza tym środowiskiem
testowym) — nie jako obejście zmierzonego tu problemu, bo problemu nie było.

**Waga assetów.** `du -sh assets/` → **2,5 MB**, poniżej sufitu 10 MB i
poniżej szacunku z sekcji „Assety" (~4,5 MB) — `assets/museum/` (tekstury
PBR) waży 1,1 MB, `assets/shots/` (zrzuty ekranu) 1,4 MB. Zadanie 7 nie
dodało żadnych nowych assetów.

**Co odbiegało od planu i dlaczego:**

- Długość amfilady wyszła 329 m zamiast planowanych 120–200 m (ustalone i
  zaakceptowane w Zadaniu 4 — gęstość eksponatów tego wymagała; zobacz
  `progress.md`, wpis Zadania 4).
- Cache-busting importów modułów nie był częścią pierwotnego planu — dziura
  odkryta w przeglądzie przed Zadaniem 4, zamknięta w tym zadaniu (Krok 4b)
  przez import mapy. Dziura była **realna i odtworzona empirycznie** podczas
  weryfikacji tego zadania: nieodświeżona przeglądarka z wersją sprzed zmiany
  `ui.js` dostała `SyntaxError: does not provide an export named 'salaZ'` —
  dokładnie ten scenariusz, przed którym Krok 4b miał chronić. Po naprawie:
  zwykłe przeładowanie (bez czyszczenia pamięci podręcznej) z podbitą wersją
  poprawnie ściągnęło wszystkie osiem modułów na nowo.
- Poza tym żadnych odstępstw — wszystkie sekcje specyfikacji zrealizowane
  zgodnie z planem z Zadań 1–7 (patrz `docs/superpowers/plans/2026-08-05-muzeum-3d.md`
  i `.superpowers/sdd/2026-08-05-muzeum-3d/zadanie-7-raport.md` po szczegóły).

**Status wdrożenia:** gałąź `muzeum-3d` gotowa merytorycznie (siedem zadań,
przeglądy czyste lub z jawnie rozstrzygniętymi wątpliwościami), ale **nie
scalona z `main` i nie wypchnięta** — GitHub Pages buduje z `main`, więc
decyzja o wdrożeniu na żywo należy do właściciela strony po szerokim
przeglądzie całej gałęzi, nie do wykonawcy Zadania 7.
