# Karta budowania „Monitor” — projekt odświeżenia wyglądu (1 X 2026)

Kierunek A wybrany przez właściciela spośród trzech pokazanych na prototypach (A „Monitor”,
B „Papierowa karta”, C „Szlif”). Zatwierdzony razem z wariantem osi czasu „2 linie +
więcej”.

## Diagnoza (pomiar na żywej stronie, 1440 px)

- Strona ma 35 000 px wysokości, z czego oś czasu 23 500 px (67%): 55 kart średnio po
  347 px. Rodziny, Leon i spis zaczynają się dopiero ok. 28 700 px.
- Wszystko jest tą samą kartą (zaokrąglony prostokąt z ramką 1 px) — brak hierarchii.
- Jasne zrzuty produktów (Wspólnik, EmpowerHer, Aule, Pokemate) wybijają dziury w ciemnej
  stronie; okładki AI mają inną, filmową estetykę.
- Mono wersalikami w ok. dziesięciu rolach i sześć kolorów kategorii na ramkach i
  odnośnikach rozmywają bursztynową tożsamość.
- Koncept karty pacjenta kończy się na pierwszym ekranie.

## Zasada

Noc i bursztynowy fosfor zostają. Koncept monitora przy łóżku ma nieść całą stronę,
a nie tylko hero. Struktura ma być skanowalna: hierarchia w wyróżnionych, oś czasu jako
zwarty dziennik.

## 1. System wizualny

- **Bursztyn (`--pulse`) to jedyny kolor interakcji**: odnośniki „Zobacz”, aktywny filtr,
  fokus, obramowanie karty przy najechaniu. Kolory kategorii zostają wyłącznie jako
  kropki (oś czasu, spis, filtry, rodziny, linia daty w wyróżnionych).
- **Mono tylko dla dat, liczb i etykiet** (nawigacja, eyebrow, rytm epoki, kamienie milowe,
  odczyty, `badge`, `access`). Tagi technologii, filtry kategorii i nazwy kategorii
  przechodzą na krój tekstu, bez wersalików.
- Nowe tokeny: `--grid` (linia papieru wykresu), `--glow` (poświata odczytów).

## 2. Hero

- Papier wykresu za tytułem i kardiogramem: siatka 32 px w `--grid`, wygaszana maską ku
  brzegom. Bez obrazków — dwa gradienty.
- Kropka nagrywania przed eyebrow, pulsuje przezroczystością; przy
  `prefers-reduced-motion` stoi zapalona.
- Pasek parametrów jako odczyty monitora: duże cyfry mono w bursztynie z poświatą, mała
  etykieta pod spodem, pola rozdzielone pionową linią.

## 3. Nagłówki sekcji

- Nad każdym `section > h2` jedno uderzenie serca: krótka linia EKG (SVG w data-URI)
  w bursztynie z lekką poświatą. Numeracja „01 /” zostaje. Tytuły sekcji większe.

## 4. Wyróżnione: bento

- Siatka 6 kolumn. Miejsca 1–3 (`featured` ≤ 3: Age of Agents, Wspólnik, EmpowerHer) to
  duże kafle na 4 kolumny, pozostałe 9 na 2 kolumny — przy `grid-auto-flow: dense`
  daje to 5 pełnych rzędów. Klasę dużego kafla nadaje `main.js` z danych, nie selektor
  pozycji.
- Opis w kaflu do 4 linii (pełny jest na osi czasu).
- Tablet (≤ 980 px): 4 kolumny, duże tylko miejsca 1–2, żeby nie zostawał osierocony
  kafel. Telefon (≤ 640 px): jedna kolumna.
- Linia daty: data w mono, kategorie zwykłym krojem, przed nimi kropka koloru pierwszej
  kategorii.

## 5. Obrazy

- **Każdy prawdziwy zrzut stoi w oknie aplikacji**: ciemny pasek z trzema kropkami nad
  obrazem. Okładki AI zostają bez okna, z podpisem „wizualizacja AI”. Różnica
  zrzut–ilustracja jest widoczna od pierwszego spojrzenia, co wzmacnia zasadę
  uczciwości strony.
- **Ton ekranu**: zrzuty i okładki lekko przygaszone, z delikatnymi liniami skanowania;
  pełny kolor przy najechaniu. Na ekranach dotykowych (`hover: none`) przygaszenie
  słabsze, bo nie ma najechania.
- **Jasne zrzuty** wykrywa strona sama: po wczytaniu obrazu miniatura 32×20 na canvas,
  średnia luminancja > 0,55 → klasa `jasny` i mocniejsze przygaszenie. Zmienia się tylko
  filtr, nie wymiary, więc nic nie skacze. Bez listy do utrzymywania.

## 6. Oś czasu: zwarty dziennik

- Karta to wiersz: miniatura 168×104 po prawej (zrzut w oknie albo okładka), po lewej
  tytuł z datą, opis w **dwóch liniach**, przycisk **„więcej”**, tagi, odnośniki.
- „więcej” pojawia się tylko wtedy, gdy opis naprawdę się nie mieści (pomiar po
  renderze i przy zmianie rozmiaru okna). Przycisk z `aria-expanded` i `aria-controls`;
  po rozwinięciu zmienia się na „mniej”. Pełny tekst jest w DOM cały czas, więc czytnik
  ekranu czyta go bez rozwijania.
- Gramofon „Akordów Zmierzchu” zajmuje całą szerokość karty, jak dotąd.
- Plansze epok jako wąskie pasy (64–96 px), tytuły epok większe. Kamienie milowe bez
  zmian.
- Telefon (≤ 600 px): miniatura jako kwadrat 64 px obok tytułu, opis i reszta na całą
  szerokość.

## 7. Reszta strony

Rodziny, wątki, wideo i Leon dostają te same reguły (jeden akcent, spokojniejsze
etykiety). Spis i archiwum zostają — już są zwarte. Muzeum i Kosmos bez zmian.

## Czego nie robimy

Bez nowych zasobów graficznych (siatka i uderzenie serca to CSS i SVG w kodzie), bez
nowych zależności, bez zmian w danych poza tym, co już jest. Kierunek B („Papierowa
karta”) odłożony — pomysł pieczątek przy statusach może wrócić osobno.

## Pliki

- `css/main.css` — większość zmian.
- `js/main.js` — klasa dużego kafla, linia daty, okno zrzutu, wykrywanie jasnych
  zrzutów, przycisk „więcej”.
- `js/i18n.js` — napisy „więcej” / „mniej”.
- `index.html` — nowy znacznik wersji `?v=` przy CSS i skryptach (bez niego goście z pamięcią
  podręczną zobaczą stary arkusz z nowym skryptem).

## Weryfikacja

- Playwright na lokalnym serwerze: 1440, 980, 768, 375 i 320 px; PL i EN;
  `prefers-reduced-motion`.
- Wysokość strony przy 1440 px poniżej 25 000 px (było 35 000).
- Zero błędów w konsoli, zero 404, brak przewijania w bok przy 320 px.
- Kontrast tekstu ≥ 4,5:1; „więcej” obsługiwany klawiaturą; jasne zrzuty dostają klasę
  `jasny` (Wspólnik, EmpowerHer, Aule, Pokemate), ciemne nie.
- Zrzuty przed publikacją do wglądu właściciela; push po jego zgodzie.
