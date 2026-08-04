# Omniportfolio — Mateusz Pawełczuk

Karta budowania: wszystko, co powstało z AI od marca 2025 — gry, sztuka generatywna,
produkty, robotyka i zabawy z Leonem — na jednej osi czasu z rozwojem technologii.

**Live:** https://agentsmill.github.io/

## Struktura

- `index.html` — cała strona (sekcje statyczne + kontenery renderowane z danych)
- `js/projects-data.js` — **tu edytujesz treść**: projekty, kamienie milowe, epoki, archiwum, dane kardiogramu
- `js/main.js` — renderowanie (kardiogram SVG, oś czasu, filtry, reveal)
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
cat, desc, tech, links) — strona ułoży go na osi czasu sama. Jedno uderzenie do
`HEARTBEAT` w odpowiednim miesiącu utrzyma kardiogram w prawdzie.

---

Zbudowane przez Claude Fable 5 w jednej sesji, 4 VIII 2026.
