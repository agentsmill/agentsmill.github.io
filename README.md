# Omniportfolio — Mateusz Pawełczuk

Karta budowania: wszystko, co powstało z AI od marca 2025 — gry, sztuka generatywna,
produkty, robotyka i zabawy z Leonem — na jednej osi czasu z rozwojem technologii.

**Live:** https://agentsmill.github.io/

## Struktura

- `index.html` — cała strona (sekcje statyczne + kontenery renderowane z danych)
- `js/projects-data.js` — **tu edytujesz treść**: projekty, kamienie milowe, epoki, archiwum, dane kardiogramu
- `js/main.js` — renderowanie (kardiogram SVG, oś czasu, filtry, spis, liczby w hero)
- `js/i18n.js` — wersja angielska (nadpisuje dane przed `main.js`)
- `css/main.css` — design tokens i style (Syne / Schibsted Grotesk / IBM Plex Mono)
- `docs/superpowers/specs/` — design doc z pełnym logiem decyzji

## Rozwój

Zero build stepu. Lokalnie:

```bash
python3 -m http.server 8901
```

Deploy: push na `main` → GitHub Pages.

## Dodanie projektu

Dopisz obiekt do `PROJECTS` w `js/projects-data.js` (id, title, date `YYYY-MM`, era 1–6,
cat, desc, tech, links) — karta, muzeum i Kosmos ułożą go same. Jedno uderzenie do
`HEARTBEAT` w odpowiednim miesiącu utrzyma kardiogram w prawdzie.

- **Data** to miesiąc pierwszego commitu, nie utworzenia repozytorium.
- **Obraz:** `shot: "plik.jpeg"` (zrzut w `assets/shots/`, 900×562) albo `cover: true`
  (okładka AI w `assets/okladki/{id}.webp`, 1024×576). Żadnych innych list do pilnowania.
- **Wyróżnienie:** `featured: N` — liczba to miejsce w siatce wyróżnionych.
- **Wersja angielska:** tytuł i opis w `PROJEKTY` w `js/i18n.js`; bez wpisu projekt zostaje
  po polsku.
- Po zmianie danych podbij `?v=` przy `js/projects-data.js` na wszystkich trzech stronach.

Wersja angielska: przełącznik PL/EN albo link z `?lang=en`.

---

Zbudowane przez Claude Fable 5 w jednej sesji, 4 VIII 2026. Przegląd i aktualizacja:
Claude Opus 5.5, 30 IX 2026 — `docs/superpowers/specs/2026-09-30-przeglad-i-aktualizacja-design.md`.
