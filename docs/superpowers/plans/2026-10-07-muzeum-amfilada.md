# Muzeum 3.0 — amfilada, która dojrzewa: plan wdrożenia

> **Dla agentów:** WYMAGANY SUB-SKILL: użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, żeby wdrażać ten plan zadanie po zadaniu. Kroki mają składnię checkboxów (`- [ ]`) do śledzenia postępu.

**Cel:** Zastąpić 354-metrowy korytarz muzeum amfiladą prawdziwych sal (atrium → I…VI → drzwi do Kosmosu), w której architektura dojrzewa z czasem (pałac → biała galeria → muzeum nocą), z płynnym przemieszczaniem, planem w rogu, salami bocznymi i dźwiękiem.

**Architektura:** Czysty moduł `plan.js` liczy z danych cały budynek (sale, drzwi, miejsca prac) i jest testowany w Node. Moduły sceny tylko czytają plan: `sale.js` stawia bryłę, `wystroj.js` detale stylów, `zawieszenie.js` prace, `exhibits.js` eksponaty autorskie, `sale-boczne.js` Kino/Archiwum/Kosmos. Światło to stała pula rozdzielana po „kotwicach” (`swiatla.js`), dalekie sale świecą przedświetleniem. Ruch: `player.js` (kolizje, bezwładność) + `nawigacja.js` (przejazdy przez drzwi).

**Stack:** three.js r169 przez import map (jsDelivr), addony: `postprocessing/*` (w tym `GTAOPass`), `objects/Reflector`, `lights/RectAreaLightUniformsLib`, `controls/PointerLockControls`, `math/Octree`, `math/Capsule`. Web Audio. Node ≥ 22.12 tylko do testów (`node:test`, bez zależności). Bez kroku budowania.

**Spec:** `docs/superpowers/specs/2026-10-07-muzeum-amfilada-design.md`

## Ograniczenia globalne

Obowiązują w każdym zadaniu:

- **three.js dokładnie `0.169.0`** we wszystkich URL-ach import mapy — mieszanie wersji `three` i `three/addons/` wywala `instanceof` przy klasach.
- **Zero zależności npm, zero kroku budowania, żadnego `package.json`.** Testy logiki: `node --test tests/plan.test.mjs` (Node ≥ 22.12 sam rozpoznaje moduły ES w plikach `.js`).
- **Nie ruszaj** `js/projects-data.js`, `js/main.js`, `css/main.css`. `index.html` i `kosmos.html` — wyłącznie wspólny stempel `?v=` w Zadaniu 11. `js/gramofon.js` — wyłącznie jedna linia z Zadania 4.
- **Bez nowych ciężkich plików.** Jedyny nowy zasób to krój Cormorant Garamond 600 z Google Fonts (szyldy pałacu). Dźwięk syntezowany. Wideo Kina wczytywane leniwie z istniejących adresów.
- **Światła tworzy wyłącznie `swiatla.js`.** Pozostałe moduły zostawiają kotwice w `budynek.kotwice`. Powód: zmiana liczby świateł rekompiluje shadery wszystkich materiałów.
- **Kolizje wyłącznie przez `dodajKolizje()` z `sale.js`** i przed `initPlayer()` — Octree buduje się raz.
- **Materiały dużych oświetlanych powierzchni sali rejestruj przez `zarejestruj()`** (przedświetlenie dalekich sal): ściany, posadzki, stropy, meble, ramy, druki, podstawy, szafy. Wyjątki: materiały świecące same — `MeshBasicMaterial`, ekrany, szyldy i tablice z własnym `emissive` (rejestracja nadpisałaby ich świecenie, także puls kardiogramu) — oraz drobne detale, których z daleka nie widać (szyny, okucia, klamki, oprawy lamp, obudowy ekranów, karty szuflad, rama ekranu Kina, gramofon). Rzeźby ośmiu dawnych budowniczych w `exhibits.js` zostają bez zmian — świecą je ich własne reflektory z puli.
- **Teksty interfejsu przez `window.__t(klucz, "polski tekst")`**; angielskie odpowiedniki w `js/i18n.js` (Zadanie 11). Polska ortografia w całości (ą, ć, ę, ł, ń, ó, ś, ź, ż). Komentarze w kodzie po polsku, jak w całym repo.
- **Uchwyt `window.__mz` tylko rozszerzamy**, nigdy nie usuwamy z niego pól — opiera się na nim automatyzacja testów. Dawne `interactives` i `go(z)` zostają jako aliasy (`interactives` to ta sama tablica co `interaktywne`, `go(z)` = `go(0, z)`); korytarzowe `budynek.sale` nie ma odpowiednika w nowym budynku.
- **Cache-busting:** po każdej zmianie w `js/` albo `css/` podmień wszystkie `?v=…` w `museum.html` na `date '+%Y%m%d%H%M'`. W Zadaniu 11 jeden wspólny stempel na wszystkie trzy strony.
- **`prefers-reduced-motion`:** bez bujania kroku, przejazdy jako krótkie przenikanie, ekspozycja natychmiast.
- **Repo jest publiczne:** żadnych nazw klientów, kluczy ani adresów wewnętrznych w kodzie i komentarzach.
- **Bez `push` na `main`.** Publikacja dopiero po zgodzie właściciela (Zadanie 12).
- **Commity:** po polsku, prefiks `Muzeum:`, zakończone linią `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Harmonijka weryfikacji

**Testy logiki planu** (Zadanie 1 i każde, które dotyka `plan.js`):

```bash
node --test tests/plan.test.mjs
```

Na komputerze właściciela Node ostrzega `MODULE_TYPELESS_PACKAGE_JSON` — źródłem jest `package.json` w katalogu domowym, poza repo (repo żadnego nie ma i mieć nie będzie). Żeby wynik był czysty, uruchamiaj tu testy jako `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/plan.test.mjs`; liczby testów w zadaniach dotyczą tej samej komendy.

**Serwer podglądu worktree.** `.claude/launch.json` (nieśledzony przez git) wskazuje główny katalog repo, nie worktree. Dopisz do tablicy `configurations` drugi wpis i uruchamiaj podgląd przez `preview_start {name: "muzeum-worktree"}`:

```json
{
  "name": "muzeum-worktree",
  "runtimeExecutable": "sh",
  "runtimeArgs": ["-c", "python3 -m http.server \"${PORT:-8902}\" --directory /Users/mpawelczuk/omniportoflio/.claude/worktrees/bold-dubinsky-0860c5"],
  "port": 8902,
  "autoPort": true
}
```

Adres muzeum: `http://localhost:8902/museum.html` (port z wyniku `preview_start`).

**Zrzuty i sondy przez Playwright MCP** (`browser_navigate`, `browser_evaluate`, `browser_take_screenshot`). Zrzuty z panelu przeglądarki aplikacji bywają czarne przy WebGL. Pliki zrzutów zapisuj do `.playwright-mcp/` (ignorowany). Przy niezmienionym `?v=` Playwright potrafi serwować stary JS — dlatego stempel podbijamy przy każdej zmianie.

**Kanoniczna sonda** — wklejana do `browser_evaluate` po wczytaniu strony (odczekaj ok. 5 s):

```js
() => {
  const m = window.__mz || {};
  // Po composer.render() renderer.info pokazuje tylko ostatnie przejście (pełnoekranowy
  // prostokąt: 1 wywołanie, 1 trójkąt). Renderujemy scenę wprost i dopiero wtedy liczymy.
  m.renderer.info.reset();
  m.renderer.render(m.scene, m.camera);
  const r = m.renderer.info.render;
  return {
    bledy: window.__errs || [],
    rysowan: r.calls, trojkatow: r.triangles,
    sal: m.plan?.sale.length ?? 0,
    interaktywne: m.interaktywne?.length ?? 0,
    kolizje: m.budynek?.kolizje.children.length ?? 0,
  };
}
```

**Kryterium przejścia dla KAŻDEGO zadania od 2. wzwyż:** `bledy` puste, `rysowan > 50`, `trojkatow > 1000`, a do tego kryteria własne zadania.

**Ruch w testach:** `window.__mz.testRuch = { KeyW: true }` symuluje wciśnięty klawisz (blokada wskaźnika wymaga prawdziwego gestu); `window.__mz.testRuch = null` puszcza.

**Pułapki narzędzi** (każda dała na próbie fałszywy wynik):
- Dłuższe sondy zapisuj do `.playwright-mcp/` w worktree i uruchamiaj `browser_run_code_unsafe` z `filename` — narzędzie czyta pliki tylko z worktree.
- Ścieżki zrzutów w `page.screenshot` wewnątrz takich sond — **bezwzględne**; względne lądują w katalogu serwera Playwright (główny checkout).
- Sesja CDP (`page.context().newCDPSession(page)`) trzyma swoje emulacje — rozmiar, DPR, dotyk, `prefers-reduced-motion` — aż do odłączenia, także między wywołaniami. Każda sonda z CDP kończy się `await cdp.detach()` w `finally`.
- `browser_resize` / `page.setViewportSize` przestawia stronę na DPR 1; do pomiarów wydajności profil MacBooka daje `Emulation.setDeviceMetricsOverride({ width: 1440, height: 900, deviceScaleFactor: 2, mobile: false })`. Zrzut przez `page.screenshot` nakłada jednak z powrotem rozmiar Playwrighta — zrzuty telefonu rób przy `page.setViewportSize({ width: 390, height: 844 })` + `Emulation.setTouchEmulationEnabled`, nie przy nadpisanych metrykach.
- Przeglądarka pamięta wybrany język w `localStorage` — sondy otwierają `museum.html?lang=pl` (albo `?lang=en`) jawnie.
- Ekran 120 Hz pokazuje do 120 fps: to sufit odświeżania, nie wynik.
- Serwer podglądu nie wysyła nagłówków cache — przeglądarka potrafi trzymać sam `museum.html` ze starymi stemplami `?v=`. Sondy po zmianie otwierają adres z unikalnym parametrem, np. `museum.html?lang=pl&_=${Date.now()}`.
- Błąd wczytania kroju (litery w piśmie zastępczym) widać tylko przy zimnym starcie — w karcie, która raz już wczytała stronę, kroje są w pamięci. Sprawdzaj w świeżym kontekście albo przez `document.fonts.check(krój, "ę")` przed budową sceny.

---

### Zadanie 1: Plan budynku z danych (`plan.js`) i jego testy

Najpierw geometria ekspozycji jako czysta logika — wszystko inne tylko ją czyta. Zadanie nie zmienia jeszcze nic na stronie.

**Pliki:**
- Utwórz: `js/museum/plan.js`
- Utwórz: `tests/plan.test.mjs`

**Interfejsy:**
- Konsumuje: dane z `js/projects-data.js` przekazane jako argument (`ERAS`, `PROJECTS`) i mapę `autorskie: Map<idProjektu, "podest"|"cokol">`.
- Produkuje (używane we wszystkich dalszych zadaniach):
  - stałe `MUR`, `POLMUR` (0,2), `DRZWI_SZ` (2,4), `DRZWI_H` (3,7), `POJ` (10);
  - `strefaEpoki(id) → "palac"|"biel"|"noc"`;
  - `rozmiesc(sloty: number[], dl: number, bloki?: [od, do][]) → number[] | null`;
  - `zbudujPlan({ ERAS, PROJECTS, autorskie }) → Plan`, gdzie
    `Plan = { sale: Sala[], drzwi: Drzwi[], kosmos: { x, z, salaId }, dlugosc, start: { x, z } }`,
    `Sala = { id, rodzaj: "atrium"|"epoka"|"kino"|"archiwum"|"leon", styl: "palac"|"biel"|"noc"|"kino"|"zabawy", kolor, epoka, nr, czesc, czesci, nazwa, zakres, x0, x1, z0, z1, H, prace: Praca[], podstawy: Podstawa[], lawki: {x, z}[] }`,
    `Praca = { projekt, sciana: "x+"|"x-"|"z+"|"z-", t, y, szer, wyrozniona, podstawa: "podest"|"cokol"|"tor"|null }` (`t` — współrzędna świata wzdłuż ściany: `z` dla ścian x±, `x` dla ścian z±),
    `Podstawa = { projekt, rodzaj: "podest"|"cokol"|"tor", x, z, sciana }`,
    `Drzwi = { id, a, b, x, z, os: "z"|"x", szer, wys, portal? }` (`os: "z"` — przechodzi się wzdłuż Z; `b: null` — portal do Kosmosu);
  - `salaPod(plan, x, z) → Sala | null`;
  - `trasa(plan, odId, doId) → Drzwi[] | null`;
  - `punktWejscia(plan, salaId) → { x, z, patrz: { x, z } }`;
  - `wyroznione(plan) → (Praca & { salaId })[]` — w kolejności dat.

- [ ] **Krok 1: Napisz testy**

Utwórz `tests/plan.test.mjs`:

```js
/* Testy planu budynku — czysta logika, bez przeglądarki i bez zależności.
   Uruchomienie z korzenia repozytorium: node --test tests/plan.test.mjs */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zbudujPlan, salaPod, trasa, punktWejscia, wyroznione, rozmiesc, strefaEpoki, POJ, DRZWI_SZ } from "../js/museum/plan.js";

// projects-data.js to zwykły skrypt z globalnymi const — wyciągamy je bez zmieniania pliku
const zrodlo = readFileSync(new URL("../js/projects-data.js", import.meta.url), "utf8");
const DANE = new Function(`${zrodlo}; return { ERAS, PROJECTS };`)();
// to samo, co eksportuje js/museum/exhibits.js jako PODSTAWY (Zadania 2 i 4)
const AUTORSKIE = new Map([
  ["age-of-agents", "podest"], ["empowerher", "podest"], ["reverie", "podest"], ["ekspres-leona", "podest"],
  ["token-drag-race", "podest"], ["lastbox", "podest"], ["naszwhisper", "podest"], ["anatomy", "podest"],
  ["akordy-zmierzchu", "cokol"],
]);
const plan = zbudujPlan({ ERAS: DANE.ERAS, PROJECTS: DANE.PROJECTS, autorskie: AUTORSKIE });
const osiowe = plan.sale.filter((s) => s.rodzaj === "atrium" || s.rodzaj === "epoka");
const blisko = (a, b) => Math.abs(a - b) < 1e-6;

test("każdy projekt wisi dokładnie raz", () => {
  const ids = plan.sale.flatMap((s) => s.prace.map((p) => p.projekt.id));
  assert.equal(ids.length, DANE.PROJECTS.length);
  assert.equal(new Set(ids).size, ids.length);
});

test("projekty Leona są tylko w jego pokoju", () => {
  const leon = plan.sale.find((s) => s.id === "leon");
  assert.ok(leon, "brak pokoju Leona");
  const oczekiwane = DANE.PROJECTS.filter((p) => p.cat.includes("leon")).map((p) => p.id).sort();
  assert.deepEqual(leon.prace.map((p) => p.projekt.id).sort(), oczekiwane);
  for (const s of plan.sale) {
    if (s.id === "leon") continue;
    for (const p of s.prace) assert.ok(!p.projekt.cat.includes("leon"), `${p.projekt.id} w ${s.id}`);
  }
});

test("epoka ponad POJ prac dzieli się na sale, żadna sala nie przekracza POJ", () => {
  for (const s of plan.sale) if (s.rodzaj === "epoka") assert.ok(s.prace.length <= POJ, `${s.id}: ${s.prace.length}`);
  assert.deepEqual(plan.sale.filter((s) => s.epoka === 5).map((s) => s.id), ["e5a", "e5b"]);
  assert.deepEqual(plan.sale.filter((s) => s.epoka === 6).map((s) => s.id), ["e6a", "e6b"]);
});

test("sale amfilady stykają się bez szczelin, drzwi leżą na osi i na granicy", () => {
  for (let i = 1; i < osiowe.length; i++) {
    assert.equal(osiowe[i].z0, osiowe[i - 1].z1);
    const d = plan.drzwi.find((q) => q.a === osiowe[i - 1].id && q.b === osiowe[i].id);
    assert.ok(d, `brak drzwi ${osiowe[i - 1].id} → ${osiowe[i].id}`);
    assert.equal(d.x, 0);
    assert.equal(d.z, osiowe[i].z0);
    assert.equal(d.os, "z");
  }
});

test("strefy: 1–2 pałac, 3–4 biel, 5 i dalej noc", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 9].map(strefaEpoki), ["palac", "palac", "biel", "biel", "noc", "noc", "noc"]);
  for (const s of plan.sale) if (s.rodzaj === "epoka") assert.equal(s.styl, strefaEpoki(s.epoka));
});

test("prace na jednej ścianie nie nachodzą na siebie ani na otwory drzwi", () => {
  for (const s of plan.sale) {
    const sciany = {};
    for (const p of s.prace) (sciany[p.sciana] ||= []).push(p);
    for (const [sc, lista] of Object.entries(sciany)) {
      lista.sort((a, b) => a.t - b.t);
      for (let i = 1; i < lista.length; i++) {
        const odstep = lista[i].t - lista[i - 1].t;
        assert.ok(odstep >= (lista[i].szer + lista[i - 1].szer) / 2 + 1.0, `${s.id} ${sc}: ${odstep.toFixed(2)} m`);
      }
      for (const d of plan.drzwi) {
        if (d.a !== s.id && d.b !== s.id) continue;
        const naTejScianie =
          (sc === "x+" && d.os === "x" && blisko(d.x, s.x1)) || (sc === "x-" && d.os === "x" && blisko(d.x, s.x0)) ||
          (sc === "z+" && d.os === "z" && blisko(d.z, s.z1)) || (sc === "z-" && d.os === "z" && blisko(d.z, s.z0));
        if (!naTejScianie) continue;
        const c = d.os === "x" ? d.z : d.x;
        for (const p of lista) assert.ok(Math.abs(p.t - c) >= p.szer / 2 + DRZWI_SZ / 2 + 0.3, `${s.id}: ${p.projekt.id} wisi na drzwiach`);
      }
    }
  }
});

test("prace mieszczą się na swojej ścianie z zapasem od narożników", () => {
  for (const s of plan.sale) for (const p of s.prace) {
    const [a, b] = p.sciana[0] === "x" ? [s.z0, s.z1] : [s.x0, s.x1];
    assert.ok(p.t - p.szer / 2 >= a + 0.8 && p.t + p.szer / 2 <= b - 0.8, `${s.id}: ${p.projekt.id}`);
  }
});

test("podstawy eksponatów stoją w swojej sali, podesty z dala od osi przejścia", () => {
  for (const s of plan.sale) for (const b of s.podstawy) {
    assert.ok(b.x > s.x0 && b.x < s.x1 && b.z > s.z0 && b.z < s.z1, `${b.projekt.id} poza ${s.id}`);
    if (b.rodzaj === "podest") assert.ok(Math.abs(b.x) - 1.5 >= 0.8, `${b.projekt.id}: podest wchodzi na oś`);
  }
});

test("salaPod i punktWejscia trafiają w tę samą salę", () => {
  for (const s of plan.sale) {
    const w = punktWejscia(plan, s.id);
    assert.equal(salaPod(plan, w.x, w.z)?.id, s.id, s.id);
  }
});

test("trasa z atrium do pokoju Leona prowadzi kolejnymi drzwiami", () => {
  const t = trasa(plan, "atrium", "leon");
  assert.ok(t && t.length >= 2);
  assert.equal(t[0].a, "atrium");
  assert.equal(t.at(-1).b, "leon");
  for (let i = 1; i < t.length; i++) assert.ok([t[i].a, t[i].b].includes(t[i - 1].b), `przerwa w trasie przy ${t[i].id}`);
  assert.deepEqual(trasa(plan, "kino", "kino"), []);
});

test("wycieczka: wszystkie wyróżnione, w kolejności dat", () => {
  const w = wyroznione(plan);
  assert.equal(w.length, DANE.PROJECTS.filter((p) => p.featured).length);
  for (let i = 1; i < w.length; i++) assert.ok(w[i - 1].projekt.date <= w[i].projekt.date);
});

test("amfilada krótsza niż dziś: od wejścia do drzwi Kosmosu 120–170 m", () => {
  assert.ok(plan.dlugosc > 120 && plan.dlugosc < 170, `${plan.dlugosc} m`);
  assert.equal(plan.kosmos.z, osiowe.at(-1).z1);
});

test("rozmiesc: luz po równo, blok drzwi omijany, za krótka ściana to null", () => {
  assert.deepEqual(rozmiesc([3, 3], 10), [3.25, 6.75]);
  const s = rozmiesc([3.4, 3.4], 14, [[5.2, 8.8]]);
  assert.ok(s && s.every((c) => c + 1.7 <= 5.2 + 1e-9 || c - 1.7 >= 8.8 - 1e-9), JSON.stringify(s));
  assert.equal(rozmiesc([3.4, 3.4, 3.4], 8), null);
});
```

- [ ] **Krok 2: Uruchom testy — mają nie przejść**

Run: `node --test tests/plan.test.mjs`
Expected: FAIL — `Cannot find module '…/js/museum/plan.js'`.

- [ ] **Krok 3: Napisz `js/museum/plan.js`**

```js
/* Plan budynku z danych: atrium, sale epok w amfiladzie, sale boczne, drzwi,
   miejsca prac na ścianach, podstawy eksponatów autorskich i ławki.

   Czysty JavaScript — zero three.js i zero DOM — więc cała geometria
   ekspozycji jest sprawdzalna w Node (tests/plan.test.mjs), zanim powstanie
   choćby jedna ściana. Moduły sceny (sale.js, wystroj.js, zawieszenie.js,
   exhibits.js) tylko czytają ten plan; żaden nie liczy pozycji sam.

   Układ: metry, oś amfilady to x = 0, zwiedzanie biegnie w +Z. Atrium zajmuje
   z ∈ [−16, 0], pierwsza sala epoki zaczyna się na z = 0. Prostokąt sali
   (x0..x1, z0..z1) to obrys po osiach murów; każda sala stawia własną
   połówkę muru (POLMUR) do środka swojego prostokąta. Gość patrzący w głąb
   amfilady (+Z) ma ścianę x+ po lewej ręce, a x− po prawej. */

export const MUR = 0.4;
export const POLMUR = MUR / 2;
export const DRZWI_SZ = 2.4;
export const DRZWI_H = 3.7;
export const POJ = 10;

const SZEROKOSC = { palac: 12, biel: 12, noc: 14 };
const WYSOKOSC = { palac: 6.2, biel: 5.6, noc: 5.0 };
/* Kolejne sale pałacu dostają kolejne kolory: dziś I butelkowa zieleń i II
   wiśnia; dwa zapasowe na wypadek, gdyby pałac objął kiedyś więcej sal. */
const KOLORY_PALACU = [0x2a4a40, 0x5a2427, 0x26304a, 0x4a3b22];
const KOLOR_ATRIUM = 0xc4b89f, KOLOR_ARCHIWUM = 0x3b2b1e, KOLOR_LEONA = 0xf1d9c4;   // atrium jasne: przy ciemniejszym 0x9a8f7b złoty szyld ginął (próba)

const MARGINES = 1.5;                 // od narożnika do pierwszego slotu pracy [m]
const DL_MIN = 10;                    // najkrótsza sala epoki [m]
const SZER = 1.9, SZER_WYR = 2.6;     // szerokość pracy zwykłej i wyróżnionej [m]
const ZAPAS = 1.4, ODSTEP_MIN = 3.4;  // slot pracy = max(szerokość + ZAPAS, ODSTEP_MIN)
const SLOT = { podest: 4.6, cokol: 3.4 };
const OD_SCIANY = { podest: 1.9, cokol: 1.15 };   // środek podstawy od lica ściany [m]
const LAWKA_X = 1.9;                  // ławki po obu stronach osi; oś zostaje wolna na przejście i widok na wylot
const Y_PRACY = 1.68, Y_NAD_PODESTEM = 3.15;
const BOK_LEONA = 9;
const RZYM = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/* Strefa stylu z numeru epoki (decyzja M3): 1–2 pałac, 3–4 biel, 5 i każda
   następna noc — teraźniejszość jest zawsze nocą. */
export function strefaEpoki(id) {
  return id <= 2 ? "palac" : id <= 4 ? "biel" : "noc";
}

const poDacie = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/* Rozkłada sloty o podanych szerokościach wzdłuż ściany długości `dl`,
   omijając bloki drzwi `[[od, do]]` (metry od początku ściany). Zwraca środki
   slotów albo null, gdy się nie mieszczą. Luz dzieli się po równo między
   sloty każdego wolnego odcinka, więc prace nie zbijają się przy wejściu. */
export function rozmiesc(sloty, dl, bloki = []) {
  const wolne = [];
  let p = MARGINES;
  for (const [a, b] of [...bloki].sort((u, w) => u[0] - w[0])) {
    if (a - p > 0.01) wolne.push([p, a]);
    p = Math.max(p, b);
  }
  if (dl - MARGINES - p > 0.01) wolne.push([p, dl - MARGINES]);
  const srodki = [];
  let i = 0;
  for (const [a, b] of wolne) {
    const grupa = [];
    let suma = 0;
    while (i < sloty.length && suma + sloty[i] <= b - a + 1e-6) { suma += sloty[i]; grupa.push(sloty[i]); i++; }
    if (!grupa.length) continue;
    const luz = (b - a - suma) / grupa.length;
    let x = a;
    for (const s of grupa) { srodki.push(x + (s + luz) / 2); x += s + luz; }
  }
  return i === sloty.length ? srodki : null;
}

function osiowe(a, b, z) {
  return { id: `${a.id}|${b.id}`, a: a.id, b: b.id, x: 0, z, os: "z", szer: DRZWI_SZ, wys: DRZWI_H };
}
function boczne(a, b, x, z) {
  return { id: `${a}|${b}`, a, b, x, z, os: "x", szer: DRZWI_SZ, wys: DRZWI_H };
}

function salaEpoki({ era, prace, styl, k, czesci, z0, autorskie, zDrzwiamiLeona, kolor }) {
  const gabinet = prace.length === 1;
  const W = gabinet ? 8 : SZEROKOSC[styl];
  const H = Math.round(WYSOKOSC[styl] * (gabinet ? 0.88 : 1) * 100) / 100;
  // na przemian: najpierw ściana x+ (lewa ręka idącego w głąb), potem x−
  const strony = { "x+": [], "x-": [] };
  prace.forEach((p, i) => strony[i % 2 === 0 ? "x+" : "x-"].push(p));
  const slot = (p) => SLOT[autorskie.get(p.id)] ?? Math.max((p.featured ? SZER_WYR : SZER) + ZAPAS, ODSTEP_MIN);
  const blokDrzwi = DRZWI_SZ + 1.2;   // otwór + po 0,6 m z każdej strony na opaski i oddech
  const bloki = (dl) => (zDrzwiamiLeona ? [[dl / 2 - blokDrzwi / 2, dl / 2 + blokDrzwi / 2]] : []);
  const potrzeba = (s) => 2 * MARGINES + strony[s].reduce((a, p) => a + slot(p), 0) + (s === "x+" && zDrzwiamiLeona ? blokDrzwi : 0);
  let dl = Math.max(gabinet ? 8 : DL_MIN, Math.ceil(Math.max(potrzeba("x+"), potrzeba("x-")) * 2) / 2);
  let uklad = null;
  while (!uklad) {
    const plus = rozmiesc(strony["x+"].map(slot), dl, bloki(dl));
    const minus = rozmiesc(strony["x-"].map(slot), dl);
    if (plus && minus) uklad = { "x+": plus, "x-": minus };
    else dl += 0.5;
  }
  const x0 = -W / 2, x1 = W / 2, z1 = z0 + dl;
  const wpisy = [], podstawy = [];
  for (const s of ["x+", "x-"]) {
    strony[s].forEach((p, i) => {
      const t = z0 + uklad[s][i];
      const rodzaj = autorskie.get(p.id) ?? null;
      wpisy.push({
        projekt: p, sciana: s, t,
        y: rodzaj === "podest" ? Y_NAD_PODESTEM : Y_PRACY,
        szer: rodzaj === "podest" ? SZER : (p.featured ? SZER_WYR : SZER),
        wyrozniona: !!p.featured, podstawa: rodzaj,
      });
      if (rodzaj) {
        const lico = s === "x+" ? x1 - POLMUR : x0 + POLMUR;
        const doSrodka = s === "x+" ? -1 : 1;
        podstawy.push({ projekt: p, rodzaj, x: lico + doSrodka * OD_SCIANY[rodzaj], z: t, sciana: s });
      }
    });
  }
  return {
    id: czesci > 1 ? `e${era.id}${"abcdefghij"[k]}` : `e${era.id}`,
    rodzaj: "epoka", styl, kolor, epoka: era.id, nr: RZYM[era.id - 1] ?? String(era.id),
    czesc: czesci > 1 ? k + 1 : null, czesci, nazwa: era.title, zakres: era.range,
    x0, x1, z0, z1, H, prace: wpisy, podstawy,
    lawki: dl >= 12 ? [{ x: -LAWKA_X, z: z0 + dl / 2 }, { x: LAWKA_X, z: z0 + dl / 2 }] : [],
  };
}

function salaBoczna(pola) {
  return { epoka: null, nr: null, czesc: null, czesci: 1, zakres: null, kolor: null, prace: [], podstawy: [], lawki: [], ...pola };
}

/* Pokój Leona: prace na trzech ścianach bez drzwi (naprzeciw wejścia, potem
   boczne), eksponat autorski jako tor kolejki dookoła środka pokoju. Bok
   rośnie, gdyby prac kiedyś przybyło ponad to, co mieści 9 m. */
function pokojLeona(gosp, leona, autorskie) {
  const cz = (gosp.z0 + gosp.z1) / 2;
  const sciany = ["x+", "z-", "z+"];
  const naScianach = { "x+": [], "z-": [], "z+": [] };
  leona.forEach((p, i) => naScianach[sciany[i % 3]].push(p));
  const slot = (p) => Math.max((p.featured ? SZER_WYR : SZER) + ZAPAS, ODSTEP_MIN);
  let bok = BOK_LEONA, uklad = null;
  while (!uklad) {
    const proba = Object.fromEntries(sciany.map((s) => [s, rozmiesc(naScianach[s].map(slot), bok)]));
    if (sciany.every((s) => proba[s])) uklad = proba; else bok += 1;
  }
  const s = salaBoczna({
    id: "leon", rodzaj: "leon", styl: "zabawy", kolor: KOLOR_LEONA, nazwa: "Pokój Leona",
    x0: gosp.x1, x1: gosp.x1 + bok, z0: cz - bok / 2, z1: cz + bok / 2, H: 4.2,
  });
  for (const sc of sciany) naScianach[sc].forEach((p, i) => {
    const u = uklad[sc][i];
    const t = sc === "x+" ? s.z0 + u : s.x0 + u;
    const rodzaj = autorskie.has(p.id) ? "tor" : null;
    s.prace.push({ projekt: p, sciana: sc, t, y: Y_PRACY, szer: p.featured ? SZER_WYR : SZER, wyrozniona: !!p.featured, podstawa: rodzaj });
    if (rodzaj) s.podstawy.push({ projekt: p, rodzaj, x: (s.x0 + s.x1) / 2, z: cz, sciana: null });
  });
  return s;
}

export function zbudujPlan({ ERAS, PROJECTS, autorskie = new Map() }) {
  const sale = [], drzwi = [];
  const leona = PROJECTS.filter((p) => p.cat.includes("leon")).sort(poDacie);
  const wSalach = PROJECTS.filter((p) => !p.cat.includes("leon"));
  const epokaLeona = leona.length ? leona[0].era : null;

  const atrium = salaBoczna({
    id: "atrium", rodzaj: "atrium", styl: "palac", kolor: KOLOR_ATRIUM, nazwa: "Atrium",
    x0: -8, x1: 8, z0: -16, z1: 0, H: 9.6,
  });
  sale.push(atrium);

  let z = 0, poprzednia = atrium, nrPalacu = 0;
  for (const era of ERAS) {
    const prace = wSalach.filter((p) => p.era === era.id).sort(poDacie);
    if (!prace.length) continue;           // epoka bez prac nie dostaje pustej sali
    const styl = strefaEpoki(era.id);
    const czesci = Math.ceil(prace.length / POJ);
    for (let k = 0; k < czesci; k++) {
      const kawalek = prace.slice(Math.round((k * prace.length) / czesci), Math.round(((k + 1) * prace.length) / czesci));
      const sala = salaEpoki({
        era, prace: kawalek, styl, k, czesci, z0: z, autorskie,
        zDrzwiamiLeona: era.id === epokaLeona && k === czesci - 1,
        kolor: styl === "palac" ? KOLORY_PALACU[nrPalacu++ % KOLORY_PALACU.length] : null,
      });
      sale.push(sala);
      drzwi.push(osiowe(poprzednia, sala, z));
      poprzednia = sala;
      z = sala.z1;
    }
  }
  const ostatnia = poprzednia;
  // Portal do Kosmosu zamyka oś — otwór bez sali po drugiej stronie (b: null).
  drzwi.push({ id: `${ostatnia.id}|kosmos`, a: ostatnia.id, b: null, x: 0, z, os: "z", szer: DRZWI_SZ, wys: DRZWI_H, portal: true });

  sale.push(salaBoczna({
    id: "kino", rodzaj: "kino", styl: "kino", nazwa: "Kino",
    x0: 8, x1: 18, z0: -13, z1: -3, H: 4.6, lawki: [{ x: 11.4, z: -8 }, { x: 13.9, z: -8 }],
  }));
  sale.push(salaBoczna({
    id: "archiwum", rodzaj: "archiwum", styl: "palac", kolor: KOLOR_ARCHIWUM, nazwa: "Archiwum",
    x0: -18, x1: -8, z0: -13, z1: -3, H: 5.2,
  }));
  drzwi.push(boczne("atrium", "kino", 8, -8));
  drzwi.push(boczne("atrium", "archiwum", -8, -8));

  if (leona.length) {
    const gosp = sale.filter((s) => s.epoka === epokaLeona).at(-1);
    const leon = pokojLeona(gosp, leona, autorskie);
    sale.push(leon);
    drzwi.push(boczne(gosp.id, "leon", gosp.x1, (gosp.z0 + gosp.z1) / 2));
  }

  return { sale, drzwi, kosmos: { x: 0, z, salaId: ostatnia.id }, dlugosc: z - atrium.z0, start: { x: 0, z: -6.5 } };
}

/* Sala pod punktem (x, z) albo null — punkt w grubości muru nie należy do
   żadnej. Na wspólnej granicy dwóch sal wygrywa pierwsza z listy. */
export function salaPod(plan, x, z) {
  return plan.sale.find((s) => x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) ?? null;
}

/* Kolejne drzwi na drodze z sali do sali (przeszukiwanie wszerz po grafie
   drzwi). Pusta tablica — ta sama sala; null — nie ma drogi. */
export function trasa(plan, odId, doId) {
  if (odId === doId) return [];
  const sasiedzi = new Map(plan.sale.map((s) => [s.id, []]));
  for (const d of plan.drzwi) {
    if (!d.b) continue;
    sasiedzi.get(d.a).push([d.b, d]);
    sasiedzi.get(d.b).push([d.a, d]);
  }
  const skad = new Map([[odId, null]]);
  const kolejka = [odId];
  while (kolejka.length) {
    const s = kolejka.shift();
    if (s === doId) break;
    for (const [n, d] of sasiedzi.get(s) ?? []) if (!skad.has(n)) { skad.set(n, [s, d]); kolejka.push(n); }
  }
  if (!skad.has(doId)) return null;
  const droga = [];
  for (let s = doId; skad.get(s); s = skad.get(s)[0]) droga.unshift(skad.get(s)[1]);
  return droga;
}

/* Gdzie stanąć po wejściu do sali: 2,2 m za progiem, przodem w głąb sali. */
export function punktWejscia(plan, salaId) {
  const s = plan.sale.find((q) => q.id === salaId);
  if (!s) return null;
  if (s.rodzaj === "atrium") return { x: plan.start.x, z: plan.start.z, patrz: { x: 0, z: 10 } };
  const d = plan.drzwi.find((q) => q.b === s.id);
  if (d.os === "z") return { x: 0, z: s.z0 + 2.2, patrz: { x: 0, z: s.z1 } };
  const kier = Math.sign((s.x0 + s.x1) / 2 - d.x);
  return { x: d.x + kier * 2.2, z: d.z, patrz: { x: d.x + kier * 10, z: d.z } };
}

/* Wyróżnione prace (`featured`) w kolejności dat — trasa wycieczki. */
export function wyroznione(plan) {
  return plan.sale
    .flatMap((s) => s.prace.filter((p) => p.wyrozniona).map((p) => ({ ...p, salaId: s.id })))
    .sort((a, b) => poDacie(a.projekt, b.projekt));
}
```

- [ ] **Krok 4: Uruchom testy — mają przejść**

Run: `node --test tests/plan.test.mjs`
Expected: `ℹ pass 13`, `ℹ fail 0`. Dla danych z 7 X plan daje: atrium, e1 (13,5 m), e2 (gabinet 8 m), e3, e4, e5a, e5b, e6a, e6b, Kino, Archiwum, Pokój Leona — razem 12 sal, `dlugosc` 153 m. Gdyby `node --test` zgłosił `SyntaxError: Unexpected token 'export'`, Node jest starszy niż 22.12 — zaktualizuj Node, nie dodawaj `package.json`.

- [ ] **Krok 5: Commit**

```bash
git add js/museum/plan.js tests/plan.test.mjs
git commit -m "$(cat <<'EOF'
Muzeum: plan budynku liczony z danych, z testami w Node

Atrium, sale epok w amfiladzie (podział ponad 10 prac), Kino, Archiwum,
Pokój Leona, drzwi z grafem przejść i miejsca prac na ścianach. Czysta
logika bez three.js — 13 testów w node:test.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 2: Budynek z planu w trzech stylach

Stary korytarz (`world.js` + `building.js`) znika, a w jego miejscu staje amfilada z planu: połówki murów z otworami, posadzki, stropy, detale pałacu, bieli i nocy, Kino, Archiwum, Pokój Leona, szyldy z obu stron drzwi, ławki z kolizją, kardiogram w posadzce atrium i nisza drzwi do Kosmosu. Prac jeszcze nie ma (Zadanie 3), prawdziwych świateł też nie (Zadanie 5) — sale świecą przedświetleniem, więc wyglądają płasko, ale cała bryła jest do obejrzenia i do przejścia.

**Pliki:**
- Zastąp: `js/museum/textures.js`, `js/museum/render.js`, `js/museum/main.js`
- Utwórz: `js/museum/sale.js`, `js/museum/wystroj.js`
- Modyfikuj: `js/museum/ui.js`, `js/museum/player.js`, `js/museum/exhibits.js`, `museum.html`
- Usuń: `js/museum/world.js`, `js/museum/building.js`

**Interfejsy:**
- Konsumuje: `zbudujPlan`, `salaPod`, `POLMUR`, `DRZWI_SZ`, `DRZWI_H` (Zadanie 1); globalne `HEARTBEAT`, `ERAS`, `PROJECTS`, `CATEGORIES`.
- Produkuje:
  - `textures.js`: `tekstura(sciezka, srgb?) → Texture` (z pamięci), `materialPBR(nazwa, { kolor, normal, szorstkosc, bezKoloru }) → MeshStandardMaterial` (zawsze nowy), `plotno(w, h, rysuj(ctx2d)) → CanvasTexture` (sRGB; wspólna dla wystroj.js, zawieszenie.js, sale-boczne.js).
  - `render.js`: `renderer, scene, camera, composer, bloom, srodowisko, M, textSprite, bx, reduceMotion, dotykowy, CAT_HEX, fmtDate`. Kamera ma `rotation.order = "YXZ"`, bez mgły, `far = 220`.
  - `sale.js`: `zbudujBudynek(plan) → Budynek`, gdzie `Budynek = { grupa, kolizje, podlogi: Mesh[], materialySal: Map<salaId, ((czynnik) => void)[]>, otwory: Map<salaId, {"z-","z+","x-","x+": number[]}>, kotwice: Kotwica[], tickery: Function[] }`; `zarejestruj(budynek, salaId, material, poziom)` (ustawia `material.userData.odswiezPrzedswietlenie()`); `dodajKolizje(budynek, obiekt, wszystko?)`; `bryla(w, h, d, mat)`; `plyta(w, d, mat, kafel?)`; `gladki(kolor, szorstkosc?, metal?)`; `PRZEDSWIETLENIE` (poziom per styl).
  - `Kotwica = { salaId, typ: "rect"|"spot", pozycja: Vector3, cel?: Vector3, kierunek?: "dol", szer?, wys?, kat?, polcien?, zasieg?, kolor, moc, cien? }`.
  - `wystroj.js`: `urzadz(plan, budynek)`, `bicieSerca(sekundy) → number`, `OKRES_SERCA` (1,1 s).
  - `ui.js`: `buildList(lista)` (lista trafień jako parametr), `opisSali(sala) → string` zamiast `salaZ`.
  - `player.js`: `teleportuj(x, z, patrzNa?)` (`patrzNa`: `Vector3` albo `{ x, z }`), `pozycjaX()`.
  - `exhibits.js`: `PODSTAWY` — `{ idProjektu: "podest"|"cokol" }`.
  - `main.js`: `naZmianeSali(sala)` — jedyne miejsce, z którego moduły dowiadują się o zmianie sali; `window.__mz.plan`, `.budynek`, `.gracz`, `.interaktywne`, `.go(x, z)`.

- [ ] **Krok 1: Zastąp `js/museum/textures.js`**

```js
/* Tekstury i materiały PBR (Poly Haven, CC0 — patrz assets/museum/LICENSES.md).

   Pamięć podręczna trzyma TEKSTURY, nie materiały: każda sala dostaje własne
   instancje materiałów, bo przedświetlenie (sale.js, swiatla.js) steruje ich
   emisją sala po sali. Ważą tekstury — materiał to kilka liczb. */
import * as THREE from "three";

const ladowarka = new THREE.TextureLoader();
const pamiec = new Map();

/* Jedna tekstura na ścieżkę. Literówka w nazwie zestawu albo brak pliku
   daje inaczej cichą białą powierzchnię — stąd zgłoszenie do konsoli. */
export function tekstura(sciezka, srgb = false) {
  const klucz = `${sciezka}|${srgb}`;
  if (!pamiec.has(klucz)) {
    const t = ladowarka.load(sciezka, undefined, undefined,
      () => console.error(`textures.js: nie udało się wczytać „${sciezka}"`));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;   // tylko mapa koloru; normalne i ARM to dane, nie obraz
    pamiec.set(klucz, t);
  }
  return pamiec.get(klucz);
}

/* Tekstura z płótna 2D — szyldy, tabliczki, plansze, karty szuflad. Wspólna
   dla wystroj.js, zawieszenie.js i sale-boczne.js. sRGB, bo to obraz. */
export function plotno(w, h, rysuj) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  rysuj(c.getContext("2d"));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* Nowy materiał z zestawu PBR. Mapa ARM: R = AO, G = szorstkość, B =
   metaliczność, więc `roughness` i `metalness` są tu mnożnikami. `bezKoloru`
   zostawia samą fakturę (normalna + szorstkość) z kolorem z `kolor` — tak
   wygląda jasny polerowany beton białej galerii, bo mapa koloru `beton`
   jest brązowawa (sprawdzone na podglądzie z 7 X). */
export function materialPBR(nazwa, { kolor = 0xffffff, normal = 1, szorstkosc = 1, bezKoloru = false } = {}) {
  const b = `assets/museum/${nazwa}`;
  const arm = tekstura(`${b}_arm.webp`);
  return new THREE.MeshStandardMaterial({
    color: kolor,
    map: bezKoloru ? null : tekstura(`${b}_kolor.webp`, true),
    normalMap: tekstura(`${b}_normal.webp`),
    normalScale: new THREE.Vector2(normal, normal),
    aoMap: bezKoloru ? null : arm,
    roughnessMap: arm,
    metalnessMap: bezKoloru ? null : arm,
    roughness: szorstkosc,
    metalness: bezKoloru ? 0 : 1,
  });
}
```

- [ ] **Krok 2: Zastąp `js/museum/render.js`**

```js
/* Warstwa renderowania muzeum: renderer, scena, kamera, kompozytor i drobni
   pomocnicy. Dane: js/projects-data.js (PROJECTS, ERAS, CATEGORIES) — globalne. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

window.__errs = [];
addEventListener("error", (e) => window.__errs.push(String(e.message)));
addEventListener("unhandledrejection", (e) => window.__errs.push(String(e.reason)));

/* ── Podstawy ─────────────────────────────────────────────────────────── */

const host = document.getElementById("scene-host");
const loader = document.getElementById("loader");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}
if (!webglOK()) {
  document.getElementById("no-webgl").hidden = false;
  loader.classList.add("done");
  throw new Error("WebGL unavailable");
}

const ROMAN = { "01":"I","02":"II","03":"III","04":"IV","05":"V","06":"VI","07":"VII","08":"VIII","09":"IX","10":"X","11":"XI","12":"XII" };
const fmtDate = (d) => { const [y, m] = d.split("-"); return `${ROMAN[m]} ${y}`; };
const CAT_HEX = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dotykowy = matchMedia("(pointer: coarse)").matches;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);

/* Bez mgły: to wnętrza, a widok na wylot przez całą amfiladę (ok. 150 m) jest
   celem projektu. Daleka płaszczyzna z zapasem na tę długość, bliska mała,
   bo gość podchodzi do ram i tabliczek na kilkadziesiąt centymetrów.
   Kolejność YXZ — odchylenie, potem pochylenie — tak liczą PointerLockControls
   i przeciąganie, więc kamera nie przekrzywia się przy rozglądaniu. */
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.05, 220);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
/* Gęstość pikseli zależna od urządzenia: na telefonie limit 1,25 zamiast 1,75
   to ponad dwa razy mniej pikseli na klatkę przy niewidocznej różnicy. */
renderer.setPixelRatio(Math.min(devicePixelRatio, dotykowy ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

// Mapa środowiskowa z kodu — 0 bajtów do pobrania. Siłę per strefa ustawia swiatla.js.
const pmrem = new THREE.PMREMGenerator(renderer);
const srodowisko = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = srodowisko;
scene.environmentIntensity = 0.15;

// go() dostaje ciało w main.js, gdy powstaje gracz — tu tylko nieszkodliwy zaczep.
window.__mz = { renderer, scene, camera, composer: null, bloom: null, go: () => {} };

/* MSAA w celu kompozytora: `antialias` renderera nie obejmuje rysowania do
   celu pośredniego, a bez wygładzania listwy, ramy i opaski drzwi strzępią się. */
const cel = new THREE.WebGLRenderTarget(16, 16, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, cel);
composer.addPass(new RenderPass(scene, camera));
// (rozdzielczość, siła, promień, próg) — wysoki próg: świecą ekrany, szyldy i progi, nie ściany
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
window.__mz.composer = composer;
window.__mz.bloom = bloom;

/* ── Tekst na sprite'ach (już tylko dla eksponatów autorskich; znika w Zadaniu 4) ── */

function textSprite(text, { font = "500 34px 'IBM Plex Mono'", color = "#8C95A8", pad = 18, maxW = 760 } = {}) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = font;
  const w = Math.min(maxW, Math.ceil(ctx.measureText(text).width)) + pad * 2;
  const lineH = parseInt(font.match(/(\d+)px/)[1], 10) * 1.35;
  c.width = w * 2; c.height = Math.ceil(lineH + pad * 2) * 2;
  const ctx2 = c.getContext("2d");
  ctx2.scale(2, 2);
  ctx2.font = font;
  ctx2.fillStyle = color;
  ctx2.textBaseline = "middle";
  ctx2.fillText(text, pad, (lineH + pad * 2) / 2, maxW);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const scale = 0.0075;
  sp.scale.set(c.width * scale / 2, c.height * scale / 2, 1);
  return sp;
}

/* ── Budowniczowie eksponatów ─────────────────────────────────────────── */

const M = {
  body: (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 }),
  glow: (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity }),
  add:  (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
};

function bx(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

export { renderer, scene, camera, composer, bloom, srodowisko, M, textSprite, bx, reduceMotion, dotykowy, CAT_HEX, fmtDate };
```

- [ ] **Krok 3: Utwórz `js/museum/sale.js`**

```js
/* Budynek z planu (plan.js): połówki murów z otworami drzwi, posadzki,
   stropy, materiały sal i warstwa kolizyjna. Wystrój stylów (listwy,
   świetliki, szyldy, ławki) dokłada wystroj.js — tu tylko bryła.

   Każda sala stawia własne cztery połówki muru do środka swojego
   prostokąta, więc lico ściany od strony sali ma zawsze materiał TEJ sali:
   sąsiednie sale mogą się różnić stylem, kolorem i wysokością bez
   migotania wspólnych płaszczyzn (sprawdzone na podglądzie z 7 X). */

import * as THREE from "three";
import { POLMUR, DRZWI_SZ, DRZWI_H } from "muzeum/plan.js";
import { materialPBR } from "muzeum/textures.js";
import { srodowisko } from "muzeum/render.js";

const KAFEL = 3;                                          // metry świata na kafel tekstury ścian i stropów
const KAFEL_POSADZKI = { palac: 2.2, biel: 6, zabawy: 2.2 };

/* Ile sala „świeci sama”, gdy nie ma przy niej prawdziwych świateł (patrz
   swiatla.js) — ułamek koloru materiału oddawany jako emisja. */
export const PRZEDSWIETLENIE = { palac: 0.34, biel: 0.6, noc: 0.05, kino: 0.03, zabawy: 0.5 };

export const gladki = (kolor, szorstkosc = 0.8, metal = 0) =>
  new THREE.MeshStandardMaterial({ color: kolor, roughness: szorstkosc, metalness: metal });

/* Bez odbić środowiska: przy ślizgowym kącie — a widok na wylot to sam ślizg —
   Fresnel robił z czarnej posadzki nocy szarą płytę. Mapa ustawiona wprost ma
   pierwszeństwo przed scene.environment, a intensywność 0 ją gasi. */
function bezOdbic(m) { m.envMap = srodowisko; m.envMapIntensity = 0; return m; }

function materialySali(s) {
  switch (s.styl) {
    case "palac": return {
      sciana: materialPBR("tynk", { kolor: s.kolor, normal: 0.35 }),
      posadzka: materialPBR("parkiet", { szorstkosc: 0.85 }),
      sufit: gladki(0xe9e2d2, 0.92),
    };
    case "biel": return {
      sciana: gladki(0xf2f1ed, 0.93),
      posadzka: materialPBR("beton", { kolor: 0xaeaba5, szorstkosc: 0.62, normal: 0.3, bezKoloru: true }),
      sufit: gladki(0xf1f0ec, 0.95),
    };
    case "noc": return {
      sciana: materialPBR("tynk", { kolor: 0x3a4357, normal: 0.7 }),
      posadzka: bezOdbic(gladki(0x0d0f14, 0.32)),
      sufit: gladki(0x0b0d12, 1),
    };
    case "kino": return {
      sciana: bezOdbic(gladki(0x1d1517, 0.95)),
      posadzka: bezOdbic(gladki(0x2a1d20, 0.98)),
      sufit: gladki(0x0c0a0b, 1),
    };
    case "zabawy": return {
      sciana: gladki(s.kolor, 0.9),
      posadzka: materialPBR("parkiet", { szorstkosc: 0.8 }),
      sufit: gladki(0xfbf7f0, 0.95),
    };
    default: throw new Error(`sale.js: nieznany styl „${s.styl}"`);
  }
}

/* Przedświetlenie: materiał oddaje sam tyle, ile by go oświetliły światła
   sali, więc dalekie sale wyglądają na oświetlone, nie kosztując ani jednego
   światła. Mapa koloru staje się mapą emisji — faktura zostaje. Kolor czytany
   przy każdym ustawieniu: druk, którego obraz dojdzie później, zmienia kolor
   z szarego na biały i woła odswiezPrzedswietlenie(). */
export function zarejestruj(budynek, salaId, material, poziom) {
  const ustaw = (czynnik) => {
    if (material.map && material.emissiveMap !== material.map) {
      material.emissiveMap = material.map;
      material.needsUpdate = true;     // nowa mapa emisji = inny program shadera, raz
    }
    material.emissive.copy(material.color).multiplyScalar(poziom * czynnik);
    material.userData.czynnik = czynnik;
  };
  material.userData.odswiezPrzedswietlenie = () => ustaw(material.userData.czynnik ?? 1);
  ustaw(1);
  budynek.materialySal.get(salaId).push(ustaw);
}

/* Prostopadłościan z kwadratowymi kaflami na każdej ścianie: gęstość tekstury
   niesie geometria (skalowane UV), więc jeden materiał służy powierzchniom
   o dowolnych proporcjach. */
export function bryla(w, h, d, mat) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  // kolejność ścian BoxGeometry: +x, −x, +y, −y, +z, −z — po cztery wierzchołki
  [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]].forEach(([a, b], f) => {
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, (uv.getX(i) * a) / KAFEL, (uv.getY(i) * b) / KAFEL);
  });
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  return m;
}

/* Pozioma płyta (posadzka; po obrocie o π wokół X — strop). */
export function plyta(w, d, mat, kafel = KAFEL) {
  const geo = new THREE.PlaneGeometry(w, d);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / kafel, (uv.getY(i) * d) / kafel);
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}

/* Połówka muru jednej ściany: odcinki między otworami i nadproża. Lokalnie
   ściana biegnie wzdłuż +X od 0 do `dl`, grubość wzdłuż Z (wyśrodkowana). */
function polmur(dl, H, otwory, mat) {
  const g = new THREE.Group();
  const odcinek = (u0, u1, y0, y1) => {
    const m = bryla(u1 - u0, y1 - y0, POLMUR, mat);
    m.position.set((u0 + u1) / 2, (y0 + y1) / 2, 0);
    m.userData.kolizja = true;
    g.add(m);
  };
  let p = 0;
  for (const c of [...otwory].sort((a, b) => a - b)) {
    const a = c - DRZWI_SZ / 2, b = c + DRZWI_SZ / 2;
    if (a - p > 0.001) odcinek(p, a, 0, H);
    if (H - DRZWI_H > 0.001) odcinek(a, b, DRZWI_H, H);
    p = b;
  }
  if (dl - p > 0.001) odcinek(p, dl, 0, H);
  return g;
}

const blisko = (a, b) => Math.abs(a - b) < 1e-6;

/* Cztery ściany sali z otworami wszystkich drzwi, które jej dotyczą. Środki
   otworów liczone wzdłuż danej ściany — od x0 dla ścian z±, od z0 dla x±.
   Ten sam układ odniesienia ma ramaSciany() w wystroj.js. */
function sciany(s, drzwi, mat) {
  const W = s.x1 - s.x0, D = s.z1 - s.z0;
  const otwory = { "z-": [], "z+": [], "x-": [], "x+": [] };
  for (const d of drzwi) {
    if (d.a !== s.id && d.b !== s.id) continue;
    if (d.os === "z" && blisko(d.z, s.z0)) otwory["z-"].push(d.x - s.x0);
    if (d.os === "z" && blisko(d.z, s.z1)) otwory["z+"].push(d.x - s.x0);
    if (d.os === "x" && blisko(d.x, s.x0)) otwory["x-"].push(d.z - s.z0);
    if (d.os === "x" && blisko(d.x, s.x1)) otwory["x+"].push(d.z - s.z0);
  }
  const zMinus = polmur(W, s.H, otwory["z-"], mat); zMinus.position.set(s.x0, 0, s.z0 + POLMUR / 2);
  const zPlus = polmur(W, s.H, otwory["z+"], mat); zPlus.position.set(s.x0, 0, s.z1 - POLMUR / 2);
  // obrót −π/2 wokół Y: lokalne +X ściany biegnie wzdłuż świata +Z
  const xMinus = polmur(D, s.H, otwory["x-"], mat); xMinus.position.set(s.x0 + POLMUR / 2, 0, s.z0); xMinus.rotation.y = -Math.PI / 2;
  const xPlus = polmur(D, s.H, otwory["x+"], mat); xPlus.position.set(s.x1 - POLMUR / 2, 0, s.z0); xPlus.rotation.y = -Math.PI / 2;
  const g = new THREE.Group();
  g.add(zMinus, zPlus, xMinus, xPlus);
  return { grupa: g, otwory };
}

/* Warstwa kolizyjna: kopie brył w pozycji świata, poza sceną. Brane są bryły
   oznaczone `userData.kolizja`, albo — przy `wszystko` — każda bryła obiektu
   (np. niewidoczny prostopadłościan ławki podany wprost). Octree w player.js
   buduje się wyłącznie z tej warstwy: gdyby wciągnąć całą scenę, gracz
   zaklinowałby się na tabliczce albo chmurze punktów. */
export function dodajKolizje(budynek, obiekt, wszystko = false) {
  obiekt.updateWorldMatrix(true, true);
  obiekt.traverse((o) => {
    if (!o.isMesh || !(wszystko || o.userData.kolizja)) return;
    const k = new THREE.Mesh(o.geometry);
    o.matrixWorld.decompose(k.position, k.quaternion, k.scale);
    budynek.kolizje.add(k);
  });
}

export function zbudujBudynek(plan) {
  const grupa = new THREE.Group();
  grupa.name = "budynek";
  const kolizje = new THREE.Group();
  kolizje.name = "kolizje";
  kolizje.visible = false;
  const budynek = {
    grupa, kolizje,
    podlogi: [],                  // płyty posadzek z userData.salaId — cel kliknięć „idź tutaj”
    materialySal: new Map(),      // salaId → funkcje ustawiające przedświetlenie
    otwory: new Map(),            // salaId → środki otworów na każdej ścianie (wystroj.js)
    kotwice: [],                  // światła idealne; prawdziwe z puli rozdziela swiatla.js
    tickery: [],
  };

  for (const s of plan.sale) {
    budynek.materialySal.set(s.id, []);
    const mat = materialySali(s);
    for (const m of Object.values(mat)) zarejestruj(budynek, s.id, m, PRZEDSWIETLENIE[s.styl]);
    const W = s.x1 - s.x0, D = s.z1 - s.z0, cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;

    const { grupa: mury, otwory } = sciany(s, plan.drzwi, mat.sciana);
    budynek.otwory.set(s.id, otwory);
    grupa.add(mury);

    const pod = plyta(W, D, mat.posadzka, KAFEL_POSADZKI[s.styl] ?? KAFEL);
    pod.position.set(cx, 0, cz);
    pod.userData.salaId = s.id;
    grupa.add(pod);
    budynek.podlogi.push(pod);

    const sufit = plyta(W, D, mat.sufit);
    sufit.rotation.x = Math.PI / 2;
    sufit.position.set(cx, s.H, cz);
    grupa.add(sufit);

    /* Podłoga kolizyjna to bryła pod płytą, nie sama płyta: płaszczyzna nie ma
       objętości i kapsuła potrafiła ją przeskoczyć między klatkami. */
    const podK = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D));
    podK.position.set(cx, -0.2, cz);
    podK.visible = false;
    podK.userData.kolizja = true;
    grupa.add(podK);
  }
  dodajKolizje(budynek, grupa);
  return budynek;
}
```

- [ ] **Krok 4: Utwórz `js/museum/wystroj.js`**

```js
/* Wystrój sal według stylu: listwy, lamperie i opaski drzwi pałacu, świetliki,
   świecący sufit bieli, szyny, listwy i progi nocy, kino, pokój Leona — plus
   szyldy nad drzwiami, ławki, kardiogram w posadzce atrium, drzwi wejściowe
   i nisza drzwi do Kosmosu. Bryłę stawia sale.js; tu to, co na niej i w niej.

   Światła tu nie powstają. Każda lampa zostawia KOTWICĘ (gdzie, w co, jak
   mocno), a stałą pulę prawdziwych świateł rozdziela po kotwicach swiatla.js
   — patrz komentarz w tamtym pliku. */

import * as THREE from "three";
import { POLMUR, DRZWI_SZ, DRZWI_H } from "muzeum/plan.js";
import { bryla, gladki, dodajKolizje, zarejestruj, PRZEDSWIETLENIE } from "muzeum/sale.js";
import { plotno } from "muzeum/textures.js";

const AMBER = 0xf2c46d;
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

/* Rytm serca wspólny dla świecenia kardiogramu i dźwięku (dzwiek.js):
   „lub-dub” co OKRES_SERCA sekund, liczone od performance.now(). */
export const OKRES_SERCA = 1.1;
export function bicieSerca(sekundy) {
  const f = sekundy % OKRES_SERCA;
  return Math.exp(-((f - 0.05) ** 2) / 0.002) + 0.6 * Math.exp(-((f - 0.3) ** 2) / 0.002);
}

function kratownica(nx, ny, tlo, linia) {
  return plotno(512, 512, (c) => {
    c.fillStyle = tlo; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = linia; c.lineWidth = 6;
    for (let i = 0; i <= nx; i++) { const x = (i * 512) / nx; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); }
    for (let j = 0; j <= ny; j++) { const y = (j * 512) / ny; c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
  });
}

/* Układ odniesienia jednej ściany — ten sam, w którym sale.js stawia połówkę
   muru: lokalne X biegnie wzdłuż ściany od jej początku, lokalne Z w poprzek.
   `lico` to lokalne Z powierzchni od strony sali, `strona` — znak kierunku
   do wnętrza sali. */
function ramaSciany(s, sciana) {
  const W = s.x1 - s.x0, D = s.z1 - s.z0;
  const u = {
    "z-": { p: [s.x0, 0, s.z0 + POLMUR / 2], ry: 0, dl: W, strona: 1 },
    "z+": { p: [s.x0, 0, s.z1 - POLMUR / 2], ry: 0, dl: W, strona: -1 },
    "x-": { p: [s.x0 + POLMUR / 2, 0, s.z0], ry: -Math.PI / 2, dl: D, strona: -1 },
    "x+": { p: [s.x1 - POLMUR / 2, 0, s.z0], ry: -Math.PI / 2, dl: D, strona: 1 },
  }[sciana];
  const g = new THREE.Group();
  g.position.set(...u.p);
  g.rotation.y = u.ry;
  return { g, dl: u.dl, lico: (u.strona * POLMUR) / 2, strona: u.strona };
}

/* Pas wzdłuż ściany (lamperia, listwa, cokół, gzyms) z przerwami na otwory. */
function pas(g, dl, przerwy, { y, h, d, mat, lico, strona }) {
  const odcinki = [];
  let p = 0;
  for (const [a, b] of [...przerwy].sort((u, w) => u[0] - w[0])) { if (a > p) odcinki.push([p, a]); p = Math.max(p, b); }
  if (dl > p) odcinki.push([p, dl]);
  for (const [a, b] of odcinki) {
    const m = bryla(b - a, h, d, mat);
    m.position.set((a + b) / 2, y, lico + (strona * d) / 2);
    g.add(m);
  }
}

/* Opaska drzwi pałacu: dwa pilastry, nadproże i gzyms nad otworem. */
function opaska(g, c, { lico, strona, mat }) {
  const z = (glebokosc) => lico + (strona * glebokosc) / 2;
  [-1, 1].forEach((k) => {
    const b = bryla(0.24, DRZWI_H + 0.24, 0.08, mat);
    b.position.set(c + k * (DRZWI_SZ / 2 + 0.12), (DRZWI_H + 0.24) / 2, z(0.08));
    g.add(b);
  });
  const n = bryla(DRZWI_SZ + 0.48, 0.24, 0.08, mat);
  n.position.set(c, DRZWI_H + 0.12, z(0.08));
  g.add(n);
  const gz = bryla(DRZWI_SZ + 0.9, 0.14, 0.18, mat);
  gz.position.set(c, DRZWI_H + 0.95, z(0.18));
  g.add(gz);
}

/* Świecąca tafla w stropie (świetlik pałacu, sufit bieli) i kotwica światła
   powierzchniowego pod nią. Kotwica „w dół” — swiatla.js ustawi obrót wprost,
   bo lookAt pionowo w dół ma nieokreśloną orientację prostokąta. */
function swietlik(budynek, s, tw, td, tlo, linia, kolorTafli, kolorSwiatla, moc) {
  const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
  const tafla = new THREE.Mesh(new THREE.PlaneGeometry(tw, td), new THREE.MeshBasicMaterial({
    map: kratownica(Math.max(2, Math.round(tw / 1.2)), Math.max(2, Math.round(td / 1.2)), tlo, linia),
    color: kolorTafli,
  }));
  tafla.rotation.x = Math.PI / 2;
  tafla.position.set(cx, s.H - 0.012, cz);
  budynek.grupa.add(tafla);
  budynek.kotwice.push({ salaId: s.id, typ: "rect", kierunek: "dol", pozycja: new THREE.Vector3(cx, s.H - 0.05, cz), szer: tw, wys: td, kolor: kolorSwiatla, moc });
}

/* ── Style ────────────────────────────────────────────────────────────── */

function palac(s, budynek) {
  const kosc = gladki(0xeee6d6, 0.55);
  const lamperia = gladki(new THREE.Color(s.kolor).multiplyScalar(0.55), 0.85);
  for (const m of [kosc, lamperia]) zarejestruj(budynek, s.id, m, PRZEDSWIETLENIE.palac);
  const otwory = budynek.otwory.get(s.id);
  for (const sciana of ["z-", "z+", "x-", "x+"]) {
    const { g, dl, lico, strona } = ramaSciany(s, sciana);
    const przerwy = otwory[sciana].map((c) => [c - DRZWI_SZ / 2 - 0.26, c + DRZWI_SZ / 2 + 0.26]);
    const w = { lico, strona };
    pas(g, dl, przerwy, { ...w, y: 0.525, h: 1.05, d: 0.03, mat: lamperia });   // lamperia
    pas(g, dl, przerwy, { ...w, y: 1.06, h: 0.07, d: 0.07, mat: kosc });        // listwa krzesłowa
    pas(g, dl, przerwy, { ...w, y: 0.1, h: 0.2, d: 0.06, mat: kosc });           // cokół
    pas(g, dl, [], { ...w, y: s.H - 0.14, h: 0.28, d: 0.26, mat: kosc });       // gzyms, dwa uskoki
    pas(g, dl, [], { ...w, y: s.H - 0.33, h: 0.1, d: 0.42, mat: kosc });
    for (const c of otwory[sciana]) opaska(g, c, { ...w, mat: kosc });
    budynek.grupa.add(g);
  }
  const W = s.x1 - s.x0, D = s.z1 - s.z0;
  swietlik(budynek, s, W * 0.5, D * 0.58, "#fff6e8", "rgba(80,70,55,0.55)", new THREE.Color(1.25, 1.2, 1.12), 0xfff0dc, s.rodzaj === "atrium" ? 5.5 : 7.5);
}

function biel(s, budynek) {
  swietlik(budynek, s, s.x1 - s.x0 - 1.2, s.z1 - s.z0 - 1.2, "#ffffff", "rgba(150,150,150,0.5)", new THREE.Color(1.08, 1.08, 1.08), 0xffffff, 2.9);
}

function noc(s, budynek) {
  const otwory = budynek.otwory.get(s.id);
  const listwa = new THREE.MeshBasicMaterial({ color: new THREE.Color(AMBER).multiplyScalar(0.9) });
  const szyna = gladki(0x050506, 0.4, 0.6);
  for (const sciana of ["x-", "x+"]) {
    const { g, dl, lico, strona } = ramaSciany(s, sciana);
    const przerwy = otwory[sciana].map((c) => [c - DRZWI_SZ / 2 - 0.1, c + DRZWI_SZ / 2 + 0.1]);
    pas(g, dl, przerwy, { lico, strona, y: 0.02, h: 0.012, d: 0.02, mat: listwa });   // bursztynowa listwa przy podłodze
    const r = bryla(dl - 1.2, 0.04, 0.05, szyna);                                      // szyna reflektorów 1,6 m od ściany
    r.position.set(dl / 2, s.H - 0.12, lico + strona * 1.6);
    g.add(r);
    budynek.grupa.add(g);
    // ciepłe podświetlenie ściany od dołu — kotwica skierowana w ścianę
    const x = sciana === "x-" ? s.x0 + POLMUR + 0.1 : s.x1 - POLMUR - 0.1;
    const cz = (s.z0 + s.z1) / 2;
    budynek.kotwice.push({
      salaId: s.id, typ: "rect", pozycja: new THREE.Vector3(x, 0.06, cz),
      cel: new THREE.Vector3(sciana === "x-" ? s.x0 - 5 : s.x1 + 5, 0.9, cz),
      szer: s.z1 - s.z0 - 0.8, wys: 0.25, kolor: 0xffc98a, moc: 7,
    });
  }
  // ściana z drzwiami w głąb: ciepłe podświetlenie po obu stronach otworu — portal czyta się z daleka
  const bok = (s.x1 - s.x0 - DRZWI_SZ) / 2 - 0.6;
  [-1, 1].forEach((k) => {
    const x = k * (DRZWI_SZ / 2 + 0.3 + bok / 2);
    budynek.kotwice.push({
      salaId: s.id, typ: "rect", pozycja: new THREE.Vector3(x, 0.05, s.z1 - POLMUR - 0.14),
      cel: new THREE.Vector3(x, 1.2, s.z1 + 2), szer: bok, wys: 0.2, kolor: 0xffc98a, moc: 6,
    });
  });
}

function kino(s, budynek) {
  const lamele = gladki(0x2c2124, 0.9);
  zarejestruj(budynek, s.id, lamele, PRZEDSWIETLENIE.kino);
  for (const sciana of ["z-", "z+"]) {
    const { g, dl, lico, strona } = ramaSciany(s, sciana);
    for (let u = 0.8; u < dl - 0.6; u += 0.5) {
      const l = bryla(0.18, s.H - 0.6, 0.06, lamele);
      l.position.set(u, s.H / 2, lico + strona * 0.03);
      g.add(l);
    }
    budynek.grupa.add(g);
  }
  budynek.kotwice.push({ salaId: s.id, typ: "rect", kierunek: "dol", pozycja: new THREE.Vector3(s.x0 + 1.4, s.H - 0.05, (s.z0 + s.z1) / 2), szer: 1.4, wys: s.z1 - s.z0 - 2, kolor: 0xff9a6a, moc: 1.6 });
}

function zabawy(s, budynek) {
  const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2;
  const dywanTex = plotno(512, 512, (c) => {
    const kolory = ["#f28b82", "#f6c177", "#7fd8a4", "#5cc8db", "#b48cf2"];
    for (let i = kolory.length; i > 0; i--) {
      c.fillStyle = kolory[i % kolory.length];
      c.beginPath(); c.arc(256, 256, (i / kolory.length) * 254, 0, 7); c.fill();
    }
  });
  const dywan = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), new THREE.MeshStandardMaterial({ map: dywanTex, roughness: 0.95 }));
  dywan.rotation.x = -Math.PI / 2;
  dywan.position.set(cx, 0.006, cz);
  dywan.receiveShadow = true;
  zarejestruj(budynek, s.id, dywan.material, PRZEDSWIETLENIE.zabawy);
  budynek.grupa.add(dywan);
  [0xf28b82, 0x7fd8a4, 0x5cc8db, 0xf6c177].forEach((kolor, i) => {
    const { g, dl, lico, strona } = ramaSciany(s, ["z-", "x+", "z+", "x-"][i]);
    const mat = gladki(kolor, 0.8);
    zarejestruj(budynek, s.id, mat, PRZEDSWIETLENIE.zabawy);
    pas(g, dl, [], { lico, strona, y: s.H - 0.35, h: 0.16, d: 0.02, mat });   // kolorowy fryz nad drzwiami
    budynek.grupa.add(g);
  });
  const lampa = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.25, 1.15) }));
  lampa.rotation.x = Math.PI / 2;
  lampa.position.set(cx, s.H - 0.01, cz);
  budynek.grupa.add(lampa);
  budynek.kotwice.push({ salaId: s.id, typ: "rect", kierunek: "dol", pozycja: new THREE.Vector3(cx, s.H - 0.05, cz), szer: 4, wys: 4, kolor: 0xfff3e6, moc: 4 });
}

/* Próg świetlny w każdym otworze, którego dotyka sala nocy. */
function progi(plan, budynek) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(AMBER).multiplyScalar(2.2) });
  const nocne = new Set(plan.sale.filter((s) => s.styl === "noc").map((s) => s.id));
  for (const d of plan.drzwi) {
    if (!nocne.has(d.a) && !nocne.has(d.b)) continue;
    const geo = d.os === "z" ? new THREE.BoxGeometry(DRZWI_SZ, 0.008, 0.05) : new THREE.BoxGeometry(0.05, 0.008, DRZWI_SZ);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(d.x, 0.004, d.z);
    budynek.grupa.add(m);
  }
}

/* ── Szyldy ──────────────────────────────────────────────────────────── */

function tytul(s) {
  if (s.rodzaj === "epoka") return { glowny: `${s.nr} · ${s.nazwa}`, pod: s.czesc ? `${s.zakres} · ${s.czesc}/${s.czesci}` : s.zakres };
  return { glowny: t(`muz.sala.${s.id}`, s.nazwa), pod: null };
}

/* Wygląd szyldu w stylu sali, na której ścianie wisi: złota antykwa w pałacu,
   świecący napis w nocy i kinie, napis winylowy obok drzwi w bieli i u Leona.
   Lokalne +Z to przód szyldu, (0, 0, 0) — lico ściany nad środkiem otworu. */
function szyldStylu(styl, { glowny, pod }, H) {
  if (styl === "palac") {
    const tex = plotno(1400, 200, (c) => {
      c.font = "600 92px 'Cormorant Garamond'"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "#e7c98a"; c.fillText(glowny.toUpperCase(), 700, 104, 1360);
    });
    // złoto łapie trochę światła samo — inaczej w półmroku dalekiej sali szyld znika
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.4), new THREE.MeshStandardMaterial({
      map: tex, transparent: true, metalness: 0.9, roughness: 0.32, emissive: 0xe7c98a, emissiveMap: tex, emissiveIntensity: 0.35,
    }));
    m.position.set(0, DRZWI_H + 0.62, 0.03);
    return m;
  }
  if (styl === "noc" || styl === "kino") {
    const tex = plotno(1600, 260, (c) => {
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = "700 104px Syne"; c.fillStyle = "#ffffff"; c.fillText(glowny, 800, 100, 1560);
      if (pod) { c.font = "500 50px 'IBM Plex Mono'"; c.fillStyle = "#b9bfcc"; c.fillText(pod, 800, 205, 1560); }
    });
    const kolor = new THREE.Color(styl === "kino" ? 0xff8a6a : AMBER).multiplyScalar(1.5);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.47), new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: kolor, depthWrite: false }));
    m.position.set(0, Math.min(DRZWI_H + 0.55, H - 0.35), 0.02);
    return m;
  }
  const tex = plotno(1000, 520, (c) => {
    c.textBaseline = "alphabetic";
    c.fillStyle = styl === "zabawy" ? "#c2554c" : "#14161a";
    c.font = "600 84px 'Schibsted Grotesk'"; c.fillText(glowny, 0, 160, 990);
    if (pod) { c.font = "500 52px 'IBM Plex Mono'"; c.fillStyle = "#5b5f68"; c.fillText(pod, 0, 260, 990); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.99), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9 }));
  m.position.set(DRZWI_SZ / 2 + 0.5 + 0.95, 2.05, 0.01);
  return m;
}

/* Szyld na licu ściany sali `s` przy otworze `d`, przodem do wnętrza `s`. */
function szyld(s, d, napis) {
  const g = new THREE.Group();
  if (d.os === "z") {
    const naKoncu = Math.abs(d.z - s.z1) < 1e-6;
    g.position.set(d.x, 0, naKoncu ? s.z1 - POLMUR : s.z0 + POLMUR);
    g.rotation.y = naKoncu ? Math.PI : 0;
  } else {
    const naPlus = Math.abs(d.x - s.x1) < 1e-6;
    g.position.set(naPlus ? s.x1 - POLMUR : s.x0 + POLMUR, 0, d.z);
    g.rotation.y = naPlus ? -Math.PI / 2 : Math.PI / 2;
  }
  g.add(szyldStylu(s.styl, napis, s.H));
  return g;
}

/* Każde drzwi mają szyld z obu stron: idący w głąb widzi nazwę sali, do której
   wchodzi, wracający — tej, z której przyszedł. */
function szyldy(plan, budynek) {
  const sala = (id) => plan.sale.find((s) => s.id === id);
  for (const d of plan.drzwi) {
    const a = sala(d.a), b = d.b ? sala(d.b) : null;
    budynek.grupa.add(szyld(a, d, b ? tytul(b) : { glowny: t("muz.kosmos.szyld", "Kosmos →"), pod: null }));
    if (b) budynek.grupa.add(szyld(b, d, tytul(a)));
  }
}

/* ── Ławki, kardiogram, drzwi wejściowe, nisza Kosmosu ───────────────── */

function lawka(styl) {
  const siedzisko = styl === "noc" ? gladki(0x15171c, 0.55)
    : styl === "palac" ? gladki(0x5c1b25, 0.95)
    : styl === "kino" ? gladki(0x3a1d22, 0.9)
    : gladki(0xc7a271, 0.68);
  const nogi = styl === "noc" ? gladki(0x9aa0aa, 0.3, 1) : styl === "palac" ? gladki(0x3a2416, 0.5) : siedzisko;
  const g = new THREE.Group();
  if (styl === "biel" || styl === "zabawy") {
    const b = bryla(0.5, 0.44, 1.9, siedzisko); b.position.y = 0.22; b.castShadow = true; g.add(b);
  } else {
    const s = bryla(0.52, 0.12, 1.9, siedzisko); s.position.y = 0.42; s.castShadow = true; g.add(s);
    for (const dz of [-0.8, 0.8]) for (const dx of [-0.2, 0.2]) {
      const n = bryla(0.05, 0.36, 0.05, nogi); n.position.set(dx, 0.18, dz); n.castShadow = true; g.add(n);
    }
  }
  return { g, materialy: [...new Set([siedzisko, nogi])] };
}

function lawki(plan, budynek) {
  for (const s of plan.sale) for (const l of s.lawki) {
    const { g, materialy } = lawka(s.styl);
    for (const m of materialy) zarejestruj(budynek, s.id, m, PRZEDSWIETLENIE[s.styl]);
    g.position.set(l.x, 0, l.z);
    budynek.grupa.add(g);
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.5, 1.95));   // jedna bryła kolizyjna na całą ławkę
    k.position.set(l.x, 0.25, l.z);
    dodajKolizje(budynek, k, true);
  }
}

/* HEARTBEAT (globalny, z projects-data.js) wpuszczony mosiądzem w posadzkę
   atrium: od drzwi wejściowych do progu sali I. Mosiądz pulsuje w rytmie
   bicieSerca() — ten sam rytm stuka w dźwięku (Zadanie 9). */
function kardiogram(plan, budynek) {
  const a = plan.sale.find((s) => s.rodzaj === "atrium");
  const z0 = a.z0 + 1.2, z1 = a.z1 - 0.6, dlM = (z1 - z0) / HEARTBEAT.length;
  const pkt = [];
  HEARTBEAT.forEach(({ n }, i) => {
    const zp = z0 + i * dlM;
    pkt.push([0, zp]);
    if (n) {
      const zc = zp + dlM / 2, amp = 0.16 + n * 0.028;
      pkt.push([0, zc - 0.16], [-0.05, zc - 0.09], [amp, zc], [-amp * 0.35, zc + 0.1], [0, zc + 0.18]);
    }
  });
  pkt.push([0, z1]);
  const poz = [], idx = [];
  pkt.forEach(([x, z], i) => {
    const p = pkt[Math.max(0, i - 1)], q = pkt[Math.min(pkt.length - 1, i + 1)];
    let tx = q[0] - p[0], tz = q[1] - p[1];
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const sz = 0.03;
    poz.push(x - tz * sz, 0, z + tx * sz, x + tz * sz, 0, z - tx * sz);
    if (i < pkt.length - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(poz, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xc9a35a, roughness: 0.28, metalness: 1, emissive: AMBER, emissiveIntensity: 0, side: THREE.DoubleSide });
  const m = new THREE.Mesh(geo, mat);
  m.position.y = 0.004;
  budynek.grupa.add(m);
  budynek.tickery.push(() => { mat.emissiveIntensity = 0.55 * bicieSerca(performance.now() / 1000); });
}

/* Zamknięte drzwi wejściowe i tytuł muzeum na ścianie za plecami gościa —
   widać je, gdy obejrzy się w atrium. */
function wejscie(plan, budynek) {
  const a = plan.sale.find((s) => s.rodzaj === "atrium");
  const drewno = gladki(0x3a2416, 0.55);
  zarejestruj(budynek, a.id, drewno, PRZEDSWIETLENIE.palac);
  const g = new THREE.Group();
  g.position.set(0, 0, a.z0 + POLMUR);
  [-1, 1].forEach((k) => {
    const skrzydlo = bryla(1.4, 4.2, 0.08, drewno); skrzydlo.position.set(k * 0.71, 2.1, 0.04); g.add(skrzydlo);
    const klamka = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), gladki(0xb08a4a, 0.3, 1));
    klamka.position.set(k * 0.12, 1.15, 0.12); g.add(klamka);
  });
  const napis = plotno(1800, 220, (c) => {
    c.font = "600 120px 'Cormorant Garamond'"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillStyle = "#e7c98a"; c.fillText(t("muz.tytulMuzeum", "MUZEUM BUDOWANIA"), 900, 115, 1760);
  });
  const tablica = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.66), new THREE.MeshStandardMaterial({
    map: napis, transparent: true, metalness: 0.9, roughness: 0.32, emissive: 0xe7c98a, emissiveMap: napis, emissiveIntensity: 0.35,
  }));
  tablica.position.set(0, 5.3, 0.03);
  g.add(tablica);
  budynek.grupa.add(g);
}

function niebo() {
  return plotno(512, 640, (c) => {
    const gr = c.createRadialGradient(256, 380, 20, 256, 380, 420);
    gr.addColorStop(0, "#3a2f5a"); gr.addColorStop(0.45, "#141028"); gr.addColorStop(1, "#04050c");
    c.fillStyle = gr; c.fillRect(0, 0, 512, 640);
    let ziarno = 7;
    const los = () => (ziarno = (ziarno * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 420; i++) {
      c.fillStyle = `rgba(255,${Math.round(230 + los() * 25)},${Math.round(200 + los() * 55)},${0.4 + los() * 0.6})`;
      c.beginPath(); c.arc(los() * 512, los() * 640, los() < 0.92 ? 0.8 : 1.8, 0, 7); c.fill();
    }
  });
}

/* Nisza za otworem portalu na końcu amfilady: czarne ściany, gwiazdy na
   tylnej. Z atrium to świecący prostokąt na samym końcu widoku na wylot.
   Przycisk przejścia do Kosmosu dokłada sale-boczne.js (Zadanie 8). */
function niszaKosmosu(plan, budynek) {
  const { x, z } = plan.kosmos;
  const gl = 1.8, sz = DRZWI_SZ + 0.6, h = DRZWI_H + 0.3;
  const czern = new THREE.MeshBasicMaterial({ color: 0x020308 });
  const tyl = new THREE.Mesh(new THREE.PlaneGeometry(sz, h), new THREE.MeshBasicMaterial({ map: niebo(), color: new THREE.Color(1.6, 1.6, 1.7) }));
  tyl.position.set(x, h / 2, z + gl); tyl.rotation.y = Math.PI;
  const lewa = new THREE.Mesh(new THREE.PlaneGeometry(gl, h), czern);
  lewa.position.set(x + sz / 2, h / 2, z + gl / 2); lewa.rotation.y = -Math.PI / 2;
  const prawa = new THREE.Mesh(new THREE.PlaneGeometry(gl, h), czern);
  prawa.position.set(x - sz / 2, h / 2, z + gl / 2); prawa.rotation.y = Math.PI / 2;
  const strop = new THREE.Mesh(new THREE.PlaneGeometry(sz, gl), czern);
  strop.position.set(x, h, z + gl / 2); strop.rotation.x = Math.PI / 2;
  const dno = new THREE.Mesh(new THREE.PlaneGeometry(sz, gl), czern);
  dno.position.set(x, 0.001, z + gl / 2); dno.rotation.x = -Math.PI / 2;
  budynek.grupa.add(tyl, lewa, prawa, strop, dno);
  for (const [bw, bh, bd, px, py, pz] of [
    [sz + 0.8, h, 0.4, x, h / 2, z + gl + 0.2],
    [0.4, h, gl, x - sz / 2 - 0.2, h / 2, z + gl / 2],
    [0.4, h, gl, x + sz / 2 + 0.2, h / 2, z + gl / 2],
    [sz, 0.4, gl, x, -0.2, z + gl / 2],
  ]) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd));
    k.position.set(px, py, pz);
    dodajKolizje(budynek, k, true);
  }
}

/* ── Spięcie ──────────────────────────────────────────────────────────── */

export function urzadz(plan, budynek) {
  const styl = { palac, biel, noc, kino, zabawy };
  for (const s of plan.sale) styl[s.styl](s, budynek);
  progi(plan, budynek);
  szyldy(plan, budynek);
  lawki(plan, budynek);
  kardiogram(plan, budynek);
  wejscie(plan, budynek);
  niszaKosmosu(plan, budynek);
}
```

- [ ] **Krok 5: `ui.js` — lista z parametru i opis sali z planu**

W `js/museum/ui.js`:

1. Usuń linię `import { interactives } from "muzeum/world.js";`.
2. Zastąp cały blok komentarza i funkcję `salaZ(z, sale, ERAS)` tym:

```js
/* Wskaźnik sali w HUD: sala z planu (plan.js), w której stoi gracz. Sala
   epoki podzielona na części dostaje numer części — „V (1/2)". */
function opisSali(s) {
  const t = window.__t || ((klucz, pl) => pl);
  if (s.rodzaj === "epoka") return `${s.nr}${s.czesc ? ` (${s.czesc}/${s.czesci})` : ""} · ${s.zakres} — ${s.nazwa}`;
  return t(`muz.sala.${s.id}`, s.nazwa);
}
```

3. W `buildList`: sygnatura `function buildList() {` → `function buildList(lista) {`, a w jej ciele oba odwołania `interactives` → `lista` (w `.filter` budującym pozycje i w `.find` po kliknięciu).
4. Ostatnia linia: `salaZ` w eksporcie → `opisSali`.

- [ ] **Krok 6: `player.js` — teleport w punkt (x, z)**

W `js/museum/player.js`:

1. Po linii `pozycjaZ: () => kapsula.end.z,` dopisz `pozycjaX: () => kapsula.end.x,`.
2. Zastąp metodę `teleportuj(z, patrzNa)` (z jej komentarzem) tą:

```js
    /* Skok w punkt (x, z) planu. `patrzNa` (opcjonalne) obraca kamerę ku
       danemu punktowi — skok do pracy z listy ląduje przodem do niej, a nie
       bokiem. Sale boczne leżą poza osią, stąd x. */
    teleportuj(x, z, patrzNa) {
      tura = null;   // skok kamery z innego powodu niż tura — np. klik w pracę z listy — ma nad nią wygrywać
      kapsula.start.set(x, PROMIEN, z);
      kapsula.end.set(x, WZROST, z);
      predkosc.set(0, 0, 0);
      camera.position.copy(kapsula.end);
      /* Domyślna kamera three.js patrzy w -Z, a amfilada biegnie w +Z: bez tego
         obrotu gracz stawałby tyłem do muzeum, twarzą w ścianę atrium. */
      if (patrzNa) camera.lookAt(patrzNa.x, patrzNa.y ?? WZROST, patrzNa.z);   // Vector3 albo zwykłe { x, z } (na wysokości oczu)
      else camera.rotation.set(0, Math.PI, 0);
    },
```

- [ ] **Krok 7: `exhibits.js` — mapa podstaw dla planu**

W `js/museum/exhibits.js` przed `const EXHIBIT_BUILDERS = {` dopisz:

```js
/* Jak stoi każdy eksponat autorski — czyta to plan.js, rezerwując na ścianie
   szerszy slot i miejsce na podstawę. „podest” — niska platforma 3 × 3 m pod
   dużą rzeźbą; „cokol” — wysoki postument pod małym przedmiotem. */
const PODSTAWY = {
  "age-of-agents": "podest", "empowerher": "podest", "reverie": "podest", "ekspres-leona": "podest",
  "token-drag-race": "podest", "lastbox": "podest", "naszwhisper": "podest", "anatomy": "podest",
};
```

i zmień ostatnią linię na `export { EXHIBIT_BUILDERS, PODSTAWY, framedShot, plinth };`. (Gramofon dojdzie w Zadaniu 4.)

- [ ] **Krok 8: Zastąp `js/museum/main.js`**

```js
/* Muzeum Budowania — spięcie modułów: plan → budynek → wystrój → gracz, pętla
   klatek i obsługa kliknięć. Każdy moduł ma jedną odpowiedzialność; tu tylko
   kolejność i przewody między nimi. */
import * as THREE from "three";
import { renderer, scene, camera, composer, bloom } from "muzeum/render.js";
import { zbudujPlan, salaPod } from "muzeum/plan.js";
import { zbudujBudynek } from "muzeum/sale.js";
import { urzadz } from "muzeum/wystroj.js";
import { PODSTAWY } from "muzeum/exhibits.js";
import { initPlayer } from "muzeum/player.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, opisSali } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");
const celownik = document.getElementById("celownik");

/* Jedno miejsce na komunikaty muzeum (#hud-perf): strażnik wydajności i
   odmowy przycisków. Pamiętany timer — nowy komunikat nie znika przedwcześnie. */
let chowanieId = null;
function komunikat(tekst) {
  const el = document.getElementById("hud-perf");
  el.textContent = tekst;
  el.hidden = false;
  clearTimeout(chowanieId);
  chowanieId = setTimeout(() => { el.hidden = true; }, 6000);
}
const perfTick = initPerf({ composer, bloom, renderer, komunikat });

let plan = null, budynek = null, gracz = null;
const interaktywne = [];     // trafienia raycastera: prace (Zadanie 3), eksponaty (Zadanie 4), sale boczne (Zadanie 8)
const tickery = [];          // funkcje (t, dt) wołane co klatkę
let focus = null;            // { hit } — praca z otwartą tabliczką
let bylaSala = null, byloWTurze = false;

/* KOLEJNOŚĆ BEZ ZMIAN względem dawnego main.js: najpierw treść, potem
   przeglądarka. odblokuj() schodzi do exitPointerLock(), którego WebKit na iOS
   nie ma — tabliczka musi się otworzyć, zanim cokolwiek tam rzuci. */
function focusOn(hit) {
  focus = { hit };
  openPlaque(hit);
  try { hit.userData.exhibit?.activate?.(); } catch (err) { console.error("activate error:", err); }
  gracz?.odblokuj();
}

bindFocusControl({
  onFocusEnd: () => { focus = null; },
  // skok z listy: przed pracę, przodem do niej (przejazd zamiast skoku — Zadanie 6)
  goToHit: (hit) => {
    const w = hit.userData.widok;
    gracz.teleportuj(w.pozycja.x, w.pozycja.z, w.cel);
    focusOn(hit);
  },
});

addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* ── Wskazywanie i klik ───────────────────────────────────────────────── */

const ray = new THREE.Raycaster();
ray.far = 14;     // „to, co stoi przede mną" — nie praca z drugiego końca sali
const pointer = new THREE.Vector2();
let hovered = null, bylHovered = false, downAt = null;

// `e` opcjonalne: przy blokadzie wskaźnika celujemy środkiem ekranu (pętla woła bez zdarzenia)
function celuj(e) {
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else if (e) pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  else return;
  ray.setFromCamera(pointer, camera);
  const traf = ray.intersectObjects(interaktywne, false);
  hovered = traf.length ? traf[0].object : null;
  if (!!hovered !== bylHovered) {
    bylHovered = !!hovered;
    renderer.domElement.style.cursor = bylHovered ? "pointer" : "default";
    celownik.classList.toggle("celuje", bylHovered);
  }
}

function obsluzKlik(e) {
  celuj(e);
  if (hovered) { if (focus && hovered === focus.hit) return; endFocus(); focusOn(hovered); }
  else if (focus) endFocus();
  if (!hovered && !focus) gracz?.zablokuj();
}

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // przeciągnięcie, nie klik
  obsluzKlik(e);
});
renderer.domElement.addEventListener("pointermove", (e) => celuj(e));

/* Zmiana sali pod nogami gościa — jedno miejsce, z którego dowiadują się o niej
   wszystkie moduły (HUD; od Zadania 5 światła, potem plan w rogu i dźwięk).
   aria-live na #hud-era ogłasza każde przypisanie, więc tylko przy zmianie. */
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

const clock = new THREE.Clock();
let firstFrame = true;
function petla() {
  requestAnimationFrame(petla);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  perfTick(dt);
  if (gracz) {
    gracz.update(dt);
    if (gracz.zablokowany()) celuj();
    const s = salaPod(plan, gracz.pozycjaX(), gracz.pozycjaZ());
    if (s && s !== bylaSala) { bylaSala = s; naZmianeSali(s); }
    const wTurze = gracz.wTurze();
    if (wTurze !== byloWTurze) {
      byloWTurze = wTurze;
      btnTura.textContent = wTurze ? "Przerwij zwiedzanie" : "Oprowadź mnie";
    }
  }
  for (const fn of tickery) {
    try { fn(t, dt); } catch (err) { console.error("tick error:", err); }
  }
  composer.render();
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); window.__mzOtwarte?.(); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ── Budowa ───────────────────────────────────────────────────────────── */

function zbudujMuzeum() {
  plan = zbudujPlan({ ERAS, PROJECTS, autorskie: new Map(Object.entries(PODSTAWY)) });
  budynek = zbudujBudynek(plan);
  urzadz(plan, budynek);
  scene.add(budynek.grupa);
  tickery.push(...budynek.tickery);

  gracz = initPlayer(budynek.kolizje);         // po wszystkich kolizjach — Octree buduje się raz
  gracz.teleportuj(plan.start.x, plan.start.z);
  gracz.controls.addEventListener("lock", dismissHint);
  addEventListener("touchstart", dismissHint, { once: true, passive: true });
  gracz.controls.addEventListener("lock", () => { celownik.hidden = false; });
  gracz.controls.addEventListener("unlock", () => {
    celownik.hidden = true;
    celownik.classList.remove("celuje");
    bylHovered = false;
  });

  /* Uchwyt tylko się rozszerza: `interactives` (nazwa z czasów korytarza) to ta sama
     tablica co `interaktywne`, a go(z) z jednym argumentem, jak dawniej, stawia
     gracza na osi amfilady (x = 0). */
  Object.assign(window.__mz, {
    plan, budynek, gracz, interaktywne, interactives: interaktywne,
    go: (x, z) => (z === undefined ? gracz.teleportuj(0, x) : gracz.teleportuj(x, z)),
  });

  // „Oprowadź mnie” po środkach sal epok — do Zadania 6, które zastąpi to wycieczką po wyróżnionych
  btnTura.addEventListener("click", () => {
    if (gracz.wTurze()) { gracz.przerwijTure(); return; }
    endFocus();
    const sale = plan.sale.filter((s) => s.rodzaj === "epoka").map((s) => ({ srodekZ: (s.z0 + s.z1) / 2 }));
    if (!gracz.oprowadz(sale)) komunikat("Jesteś już na końcu ekspozycji — nie ma czego zwiedzać do przodu.");
  });

  buildList(interaktywne);
}

/* Bez tekstu w drugim argumencie document.fonts.load() ściąga tylko kroje
   podstawowej łaciny, a polskie litery (ą ć ę ł ń ś ź ż) leżą w osobnym
   latin-ext — na płótnach szyldów wpadałyby w pismo zastępcze. Próbka ma
   litery z obu zakresów. */
const PROBKA_PL = "Aa ĄąĆćĘęŁłŃńÓóŚśŹźŻż";

Promise.all([
  document.fonts.load("700 46px Syne", PROBKA_PL),
  document.fonts.load("400 24px 'IBM Plex Mono'", PROBKA_PL),
  document.fonts.load("600 30px 'Schibsted Grotesk'", PROBKA_PL),
  document.fonts.load("600 92px 'Cormorant Garamond'", PROBKA_PL),
]).catch((err) => console.warn("muzeum: krój pisma nie doszedł —", err)).finally(() => {
  try { zbudujMuzeum(); } catch (err) { console.error("build error:", err); }
  petla();
});
```

- [ ] **Krok 9: `museum.html` — krój pałacu i moduły**

1. W linku Google Fonts dopisz krój: `…family=IBM+Plex+Mono:wght@400;500&family=Cormorant+Garamond:wght@600&display=swap&subset=latin-ext`.
2. W import mapie usuń wpisy `muzeum/world.js` i `muzeum/building.js`, a w ich miejscu dodaj:

```json
      "muzeum/plan.js":     "./js/museum/plan.js?v=STEMPEL",
      "muzeum/sale.js":     "./js/museum/sale.js?v=STEMPEL",
      "muzeum/wystroj.js":  "./js/museum/wystroj.js?v=STEMPEL",
```

3. Podmień wszystkie `?v=…` w pliku na nowy stempel:

```bash
STEMPEL=$(date '+%Y%m%d%H%M'); sed -i '' -E "s/\?v=[0-9]{12}|\?v=STEMPEL/?v=$STEMPEL/g" museum.html
```

- [ ] **Krok 10: Usuń stary korytarz**

```bash
git rm js/museum/world.js js/museum/building.js
```

- [ ] **Krok 11: Weryfikacja**

1. `node --test tests/plan.test.mjs` — dalej `pass 17` (13 testów planu + 4 dopisane w poprawce Zadania 1).
2. `preview_start {name: "muzeum-worktree"}`, Playwright na `/museum.html`, odczekaj 6 s, kanoniczna sonda. Oczekiwane: `bledy: []`, `rysowan` > 200, `trojkatow` > 2000, `sal: 12`, `kolizje` > 100. Konsola bez błędów (`browser_console_messages` z poziomem `warning`).
3. Przejście przez drzwi: w `browser_evaluate`:

```js
async () => {
  const m = window.__mz;
  m.gracz.teleportuj(0, -3);                 // atrium, przodem do sali I
  m.testRuch = { KeyW: true };
  await new Promise((r) => setTimeout(r, 2000));
  m.testRuch = null;
  return m.gracz.pozycjaZ();
}
```

Oczekiwane: wynik > 2 (gracz przeszedł przez otwór na z = 0).

4. Kolizja ze ścianą: `m.gracz.teleportuj(3, 6, new m.camera.position.constructor(20, 1.7, 6))` (sala I, przodem do ściany x+), `testRuch = { KeyW: true }` przez 2 s. Oczekiwane: `m.gracz.pozycjaX()` < 5,5 (lico na 5,8 minus promień kapsuły 0,35).
5. Zrzuty (`browser_take_screenshot`): widok startowy z atrium (amfilada na wylot: opaski pałacu, zielona sala I, biała III–IV, ciemna noc, na końcu świecąca nisza Kosmosu), wnętrze sali I, sala V z ławkami i bursztynowymi listwami, drzwi do Pokoju Leona. Sale wyglądają płasko — prawdziwe światło dochodzi w Zadaniu 5.

- [ ] **Krok 12: Commit**

```bash
git add -A js/museum museum.html
git commit -m "$(cat <<'EOF'
Muzeum: amfilada sal z planu w trzech stylach zamiast korytarza

Połówki murów z otworami, pałac (lamperie, opaski, świetliki), biała
galeria (świecący sufit), noc (szyny, listwy, progi), Kino, Archiwum,
Pokój Leona, szyldy z obu stron drzwi, ławki z kolizją, kardiogram w
posadzce atrium i nisza drzwi do Kosmosu. world.js i building.js usunięte.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 3: Prace na ścianach — ekrany, druki, plansze, tabliczki

Wszystkie 55 projektów zawisa w swoich salach. Zrzut działającej rzeczy wisi jako świecący ekran w obudowie, okładka AI jako druk w ramie stylu sali, projekt bez obrazu jako plansza tytułowa. Obok każdej pracy tabliczka na ścianie; kliknięcie pracy otwiera tabliczkę DOM jak dotąd. W salach nocy wokół prac świecą udawane plamy reflektorów (prawdziwe światła — Zadanie 5).

**Pliki:**
- Utwórz: `js/museum/zawieszenie.js`
- Modyfikuj: `js/museum/main.js`, `museum.html`

**Interfejsy:**
- Konsumuje: `Plan` i `Praca` (Zadanie 1), `Budynek`, `zarejestruj`, `bryla`, `gladki`, `PRZEDSWIETLENIE` (Zadanie 2), globalne `obrazProjektu(p)` i `CATEGORIES`.
- Produkuje:
  - `naScianie(sala, sciana, wzdluz) → { x, z, ry, nx, nz }` — punkt na licu ściany, obrót przodem do sali i normalna do wnętrza (eksportowane dla kolejnych modułów; dziś używa go tylko zawieszenie.js).
  - `powiesPrace(plan, budynek) → { interaktywne: Mesh[], kotwice: Kotwica[], plamy: Mesh[], obrazy: Obraz[] }`; kotwice trafiają też do `budynek.kotwice`.
  - Trafienie pracy: `Mesh` z `userData = { project, salaId, typ: "ekran"|"druk"|"plansza", widok: { pozycja: Vector3, cel: Vector3 } }`. Klucz `project` zostaje (czyta go `ui.js` i obserwator w `gramofon.js`).
  - `Obraz = { salaId, src, tex, wczytany, wczytaj(), zwolnij() }`.
  - Plama: `Mesh` z `userData.kotwica` — kotwica reflektora, który ją zastępuje (Zadanie 5).

- [ ] **Krok 1: Utwórz `js/museum/zawieszenie.js`**

```js
/* Prace na ścianach. Zrzut działającej rzeczy wisi jako ekran (świeci sam,
   obudowa urządzenia), okładka AI jako druk w ramie stylu sali, projekt bez
   obrazu jako plansza tytułowa — zasada uczciwości z karty budowania: zrzut i
   ilustracja różnią się od pierwszego spojrzenia. Obok każdej pracy tabliczka
   na ścianie, przed nią niewidoczne trafienie dla raycastera z punktem, z
   którego się na nią patrzy. Pozycje i rozmiary bierze z planu (plan.js) —
   sam niczego nie rozmieszcza. */

import * as THREE from "three";
import { POLMUR } from "muzeum/plan.js";
import { fmtDate, CAT_HEX } from "muzeum/render.js";
import { bryla, gladki, zarejestruj, PRZEDSWIETLENIE } from "muzeum/sale.js";
import { plotno } from "muzeum/textures.js";

const ladowarka = new THREE.TextureLoader();
const JASNOSC_EKRANU = { palac: 0.8, biel: 0.9, noc: 1.0, kino: 1.0, zabawy: 0.9 };
/* Jasny interfejs (biały zrzut) w ciemnej strefie świecił jak lampa — średnia
   jasność ekranu nie przekracza tam sufitu (mediana zrzutów to ok. 0,06, jasne
   interfejsy 0,83–0,89). W jaśniejszych strefach bez ograniczeń: biały ekran
   na białej ścianie wygląda naturalnie. */
const SUFIT_EKRANU = { noc: 0.3, kino: 0.3 };
const PROPORCJE = { ekran: 900 / 562, druk: 1024 / 576, plansza: 1.6 };
/* Odległość plamy snopu od ściany [m]. Niezmiennik: plama leży ZA płytą pod
   tabliczką (jej lico jest 0,010 m od ściany, patrz tabliczka()) — w jednej
   płaszczyźnie z licem tabliczki (0,012) plama i tekst walczą o głębię. */
const PLAMA_OD_SCIANY = 0.006;
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

/* Punkt na licu ściany i obrót przodem do wnętrza sali (lokalne +Z pracy
   patrzy w salę), plus normalna do wnętrza. `wzdluz` — współrzędna świata
   wzdłuż ściany: z dla ścian x±, x dla ścian z±. */
export function naScianie(s, sciana, wzdluz) {
  switch (sciana) {
    case "x+": return { x: s.x1 - POLMUR, z: wzdluz, ry: -Math.PI / 2, nx: -1, nz: 0 };
    case "x-": return { x: s.x0 + POLMUR, z: wzdluz, ry: Math.PI / 2, nx: 1, nz: 0 };
    case "z+": return { x: wzdluz, z: s.z1 - POLMUR, ry: Math.PI, nx: 0, nz: -1 };
    case "z-": return { x: wzdluz, z: s.z0 + POLMUR, ry: 0, nx: 0, nz: 1 };
    default: throw new Error(`zawieszenie.js: nieznana ściana „${sciana}"`);
  }
}

function zawin(ctx, tekst, max) {
  const linie = [];
  let linia = "";
  for (const slowo of tekst.split(" ")) {
    const proba = linia ? `${linia} ${slowo}` : slowo;
    if (ctx.measureText(proba).width > max && linia) { linie.push(linia); linia = slowo; } else linia = proba;
  }
  if (linia) linie.push(linia);
  return linie;
}

/* Miękka owalna plama do udawanego snopu reflektora na ścianie. */
let owalTex = null;
function owal() {
  if (owalTex) return owalTex;
  owalTex = plotno(256, 256, (c) => {
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.55, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
  });
  return owalTex;
}

/* Plansza tytułowa dla projektu bez zrzutu i bez okładki — ten sam pomysł,
   co typograficzna plansza na karcie budowania. */
function plansza(p) {
  return plotno(1024, 640, (c) => {
    c.fillStyle = "#151a24"; c.fillRect(0, 0, 1024, 640);
    c.fillStyle = CAT_HEX[p.cat[0]]; c.fillRect(64, 72, 96, 8);
    c.fillStyle = "#e9edf5"; c.font = "700 76px Syne";
    zawin(c, p.title, 880).slice(0, 3).forEach((l, i) => c.fillText(l, 64, 196 + i * 90));
    c.fillStyle = "#8c95a8"; c.font = "500 34px 'IBM Plex Mono'";
    c.fillText(`${fmtDate(p.date)} · ${p.cat.map((k) => CATEGORIES[k].label).join(" · ")}`, 64, 572, 896);
  });
}

function tabliczka(p, typ, styl) {
  const [tlo, tekst, drugi] = {
    noc: ["#141820", "#E9EDF5", "#8C95A8"], kino: ["#141820", "#E9EDF5", "#8C95A8"],
    palac: ["#efe7d6", "#2b241c", "#76695a"], zabawy: ["#fffaf2", "#2b241c", "#8a7a6a"],
  }[styl] ?? ["#ffffff", "#141518", "#70747c"];
  const tex = plotno(640, 400, (c) => {
    c.fillStyle = tlo; c.fillRect(0, 0, 640, 400);
    c.fillStyle = tekst; c.font = "600 50px 'Schibsted Grotesk'";
    const linie = zawin(c, p.title, 560).slice(0, 2);
    linie.forEach((l, i) => c.fillText(l, 40, 96 + i * 58));
    c.fillStyle = drugi; c.font = "500 32px 'IBM Plex Mono'";
    const y = 96 + linie.length * 58 + 18;
    c.fillText(fmtDate(p.date), 40, y);
    const opis = typ === "ekran" ? t("muz.typ.ekran", "zrzut działającej rzeczy")
      : typ === "druk" ? t("muz.typ.druk", "wizualizacja AI") : t("muz.typ.plansza", "plansza z tytułem");
    c.fillText(opis, 40, y + 46);
  });
  const g = new THREE.Group();
  const lico = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1875), lico);
  m.position.z = 0.012;
  const podklad = gladki(styl === "noc" || styl === "kino" ? 0x0a0c10 : 0xd9d2c3, 0.6);
  const b = bryla(0.31, 0.1975, 0.01, podklad);
  b.position.z = 0.005;
  g.add(m, b);
  return { g, materialy: [lico, podklad] };
}

/* Rama druku w stylu sali; zwraca Z lica druku (rama ma grubość). */
function rama(g, styl, w, h, materialy) {
  if (styl === "palac") {
    const zloto = gladki(0xb98f45, 0.34, 1), pp = gladki(0x1b1712, 0.9);
    materialy.push(zloto, pp);
    const r = 0.11;
    for (const [x, y, bw, bh] of [[0, h / 2 + r / 2, w + 2 * r, r], [0, -h / 2 - r / 2, w + 2 * r, r], [-w / 2 - r / 2, 0, r, h], [w / 2 + r / 2, 0, r, h]]) {
      const b = bryla(bw, bh, 0.08, zloto); b.position.set(x, y, 0.04); g.add(b);
    }
    const passe = bryla(w + 0.02, h + 0.02, 0.02, pp); passe.position.z = 0.01; g.add(passe);
    return 0.022;
  }
  if (styl === "noc" || styl === "kino") {
    const czern = gladki(0x050505, 0.5);
    materialy.push(czern);
    const b = bryla(w + 0.06, h + 0.06, 0.035, czern); b.position.z = 0.017; g.add(b);
    return 0.036;
  }
  if (styl === "zabawy") {
    const kolor = gladki(0xf2c46d, 0.6);
    materialy.push(kolor);
    const b = bryla(w + 0.2, h + 0.2, 0.05, kolor); b.position.z = 0.025; g.add(b);
    return 0.051;
  }
  // biel: dibond na dystansie — sama płyta, szczelina cienia od ściany
  const plyta = gladki(0xf4f4f2, 0.9);
  materialy.push(plyta);
  const b = bryla(w, h, 0.02, plyta); b.position.z = 0.035; g.add(b);
  return 0.0455;
}

/* Średnia jasność liniowa obrazu (0–1) z miniatury 24 × 24. Obraz z innego
   źródła bez CORS „brudzi” płótno i getImageData rzuca — wtedy bez korekty. */
function sredniaJasnosc(obraz) {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(obraz, 0, 0, 24, 24);
    const d = g.getImageData(0, 0, 24, 24).data;
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
    return s / 576;
  } catch { return 0; }
}

/* Obraz pracy wczytywany na żądanie: `wczytaj()` od razu (Zadanie 3) albo
   salami (Zadanie 10). `ustaw(tex)` podpina teksturę do materiału. */
function obrazDo(salaId, src, ustaw, wyczysc) {
  return {
    salaId, src, tex: null, wczytany: false,
    zadanie: 0,        // numer ostatniego żądania — starsze, które jeszcze leci, nie nadpisze nowszego
    wczytaj() {
      if (this.wczytany) return;
      this.wczytany = true;
      const nr = ++this.zadanie;
      ladowarka.load(src, (tex) => {
        if (!this.wczytany || nr !== this.zadanie) { tex.dispose(); return; }   // zwolniony albo wyprzedzony nowszym żądaniem, zanim doszedł
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        this.tex = tex;
        ustaw(tex);
      }, undefined, () => console.warn(`zawieszenie.js: brak obrazu „${src}" — rama zostaje z neutralną płytą`));
    },
    zwolnij() {
      if (!this.wczytany) return;
      this.wczytany = false;
      if (this.tex) { wyczysc(); this.tex.dispose(); this.tex = null; }
    },
  };
}

function powies(s, w, budynek, wynik) {
  const p = w.projekt;
  const obraz = obrazProjektu(p);      // globalna z projects-data.js — jedyne miejsce, które wie, gdzie leżą pliki
  const typ = !obraz ? "plansza" : obraz.okladka ? "druk" : "ekran";
  const szer = w.szer, wys = szer / PROPORCJE[typ];
  const m = naScianie(s, w.sciana, w.t);
  const poziom = PRZEDSWIETLENIE[s.styl];
  const g = new THREE.Group();
  g.position.set(m.x, w.y, m.z);
  g.rotation.y = m.ry;
  const materialy = [];

  if (typ === "ekran") {
    const obudowa = bryla(szer + 0.07, wys + 0.07, 0.04, gladki(0x08090b, 0.35, 0.2));
    obudowa.position.z = 0.02;
    g.add(obudowa);
    // dopóki obraz nie doszedł, ekran tli się kolorem kategorii — z daleka nie do odróżnienia
    const mat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: new THREE.Color(CAT_HEX[p.cat[0]]).multiplyScalar(0.12), roughness: 0.14, metalness: 0 });
    const ekran = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), mat);
    ekran.position.z = 0.041;
    g.add(ekran);
    wynik.obrazy.push(obrazDo(s.id, obraz.src,
      (tex) => {
        const sufit = SUFIT_EKRANU[s.styl];
        const k = sufit ? Math.min(1, sufit / Math.max(sredniaJasnosc(tex.image), 1e-3)) : 1;
        mat.emissiveMap = tex; mat.emissive.setScalar(JASNOSC_EKRANU[s.styl] * k); mat.needsUpdate = true;
      },
      () => { mat.emissiveMap = null; mat.emissive.set(CAT_HEX[p.cat[0]]).multiplyScalar(0.12); mat.needsUpdate = true; }));
  } else {
    const mat = new THREE.MeshStandardMaterial({ color: 0x6f6a64, roughness: 0.82 });
    materialy.push(mat);
    const druk = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), mat);
    druk.position.z = rama(g, s.styl, szer, wys, materialy);
    g.add(druk);
    const ustaw = (tex) => { mat.map = tex; mat.color.setHex(0xffffff); mat.needsUpdate = true; mat.userData.odswiezPrzedswietlenie?.(); };
    if (typ === "plansza") ustaw(plansza(p));
    else wynik.obrazy.push(obrazDo(s.id, obraz.src, ustaw, () => {
      mat.map = null; mat.emissiveMap = null; mat.color.setHex(0x6f6a64); mat.needsUpdate = true; mat.userData.odswiezPrzedswietlenie?.();
    }));
  }
  budynek.grupa.add(g);

  // tabliczka po prawej ręce patrzącego na pracę; przy rzeźbie na podeście — obok podestu
  const tab = tabliczka(p, typ, s.styl);
  materialy.push(...tab.materialy);
  const bok = w.podstawa === "podest" ? 1.9 : szer / 2 + 0.38;
  tab.g.position.set(m.x + m.nz * bok, 1.42, m.z - m.nx * bok);   // prawa ręka patrzącego = (nz, 0, −nx)
  tab.g.rotation.y = m.ry;
  budynek.grupa.add(tab.g);
  for (const mat of materialy) zarejestruj(budynek, s.id, mat, poziom);

  // trafienie i punkt widoku: na wprost pracy, z odległości, z której obejmuje się ją wzrokiem
  const glebokosc = (w.sciana[0] === "x" ? s.x1 - s.x0 : s.z1 - s.z0) - 2 * POLMUR;
  const odl = Math.min(w.podstawa === "podest" ? 4.3 : Math.max(2.2, 1.25 * szer), glebokosc - 0.9);
  const traf = new THREE.Mesh(new THREE.BoxGeometry(szer + 0.3, wys + 0.3, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  traf.position.set(m.x + m.nx * 0.15, w.y, m.z + m.nz * 0.15);
  traf.rotation.y = m.ry;
  traf.userData = {
    project: p, salaId: s.id, typ,
    widok: {
      pozycja: new THREE.Vector3(m.x + m.nx * odl, 1.65, m.z + m.nz * odl),
      cel: new THREE.Vector3(m.x, w.y, m.z),
    },
  };
  budynek.grupa.add(traf);
  wynik.interaktywne.push(traf);

  if (s.styl === "noc") {
    // reflektor na szynie, 1,6–1,7 m od ściany, wycelowany w pracę
    const zrodlo = new THREE.Vector3(m.x + m.nx * 1.7, s.H - 0.2, m.z + m.nz * 1.7);
    const cel = new THREE.Vector3(m.x + m.nx * 0.05, w.y, m.z + m.nz * 0.05);
    const kotwica = {
      salaId: s.id, typ: "spot", pozycja: zrodlo, cel,
      kat: Math.atan((Math.max(szer, wys) * 0.72) / zrodlo.distanceTo(cel)), polcien: 0.5, zasieg: 0,
      kolor: 0xffd8a6, moc: (typ === "ekran" ? 30 : 52) * (w.wyrozniona ? 1.35 : 1),
    };
    wynik.kotwice.push(kotwica);
    const oprawa = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 12), gladki(0x0a0a0b, 0.4, 0.7));
    oprawa.position.copy(zrodlo);
    budynek.grupa.add(oprawa);
    // udawana plama snopu — widoczna, dopóki prawdziwy reflektor świeci gdzie indziej (swiatla.js)
    const r = Math.max(szer, wys) * 1.9;
    const plama = new THREE.Mesh(new THREE.PlaneGeometry(r, r), new THREE.MeshBasicMaterial({
      map: owal(), color: 0xffd8a6, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    plama.position.set(m.x + m.nx * PLAMA_OD_SCIANY, w.y + 0.12, m.z + m.nz * PLAMA_OD_SCIANY);
    plama.rotation.y = m.ry;
    plama.userData.kotwica = kotwica;
    budynek.grupa.add(plama);
    wynik.plamy.push(plama);
  } else if (s.styl === "palac") {
    // mosiężna lampka nad ramą i jej kotwica — krótki, ciepły snop na górę obrazu
    const mosiadz = gladki(0xb08a4a, 0.3, 1);
    zarejestruj(budynek, s.id, mosiadz, poziom);
    const lampa = new THREE.Group();
    const pret = bryla(Math.min(0.9, szer * 0.4), 0.045, 0.06, mosiadz); pret.position.set(0, 0, 0.32); lampa.add(pret);
    const ramie = bryla(0.025, 0.025, 0.32, mosiadz); ramie.position.set(0, 0.02, 0.16); lampa.add(ramie);
    lampa.position.set(m.x, w.y + wys / 2 + 0.28, m.z);
    lampa.rotation.y = m.ry;
    budynek.grupa.add(lampa);
    wynik.kotwice.push({
      salaId: s.id, typ: "spot",
      pozycja: new THREE.Vector3(m.x + m.nx * 0.36, w.y + wys / 2 + 0.24, m.z + m.nz * 0.36),
      cel: new THREE.Vector3(m.x, w.y - wys * 0.15, m.z),
      kat: 1.05, polcien: 0.85, zasieg: 4, kolor: 0xffd49a, moc: 5 * (w.wyrozniona ? 1.3 : 1),
    });
  }
}

export function powiesPrace(plan, budynek) {
  const wynik = { interaktywne: [], kotwice: [], plamy: [], obrazy: [] };
  for (const s of plan.sale) for (const w of s.prace) powies(s, w, budynek, wynik);
  budynek.kotwice.push(...wynik.kotwice);
  return wynik;
}
```

- [ ] **Krok 2: Podepnij w `main.js`**

1. Pod `import { urzadz } from "muzeum/wystroj.js";` dopisz `import { powiesPrace } from "muzeum/zawieszenie.js";`.
2. `let plan = null, budynek = null, gracz = null;` → `let plan = null, budynek = null, gracz = null, prace = null;`.
3. W `zbudujMuzeum()` zastąp dwie linie `urzadz(plan, budynek);` i `scene.add(budynek.grupa);` tym:

```js
  urzadz(plan, budynek);
  prace = powiesPrace(plan, budynek);
  interaktywne.push(...prace.interaktywne);
  for (const o of prace.obrazy) o.wczytaj();   // wszystkie od razu; salami — Zadanie 10
  scene.add(budynek.grupa);
```

4. W `Object.assign(window.__mz, { … })` dopisz `prace` po `gracz`.

- [ ] **Krok 3: `museum.html`**

W import mapie po wpisie `muzeum/wystroj.js` dopisz `"muzeum/zawieszenie.js": "./js/museum/zawieszenie.js?v=STEMPEL",` i podbij stempel (polecenie `sed` z Zadania 2, krok 9).

- [ ] **Krok 4: Weryfikacja**

1. Kanoniczna sonda: `bledy: []`, `rysowan` > 200, `trojkatow` > 2000, `sal: 12`, `kolizje` > 100, `interaktywne: 55`.
2. Po 6 s: `window.__mz.prace.obrazy.length === 49` i `window.__mz.prace.obrazy.filter((o) => o.tex).length === 49` (6 projektów bez obrazu wisi jako plansze), `window.__mz.prace.plamy.length === 40` (prace w salach nocy).
3. Każde trafienie ma punkt widoku w swojej sali:

```js
() => {
  const m = window.__mz;
  return m.interaktywne.filter((h) => {
    const w = h.userData.widok.pozycja;
    const s = m.plan.sale.find((q) => q.id === h.userData.salaId);
    return !(w.x > s.x0 && w.x < s.x1 && w.z > s.z0 && w.z < s.z1);
  }).map((h) => h.userData.project.id);
}
```

Oczekiwane: `[]`.

4. Klik w pracę otwiera tabliczkę: `const h = m.interaktywne.find((x) => x.userData.salaId === "e1"); m.gracz.teleportuj(h.userData.widok.pozycja.x, h.userData.widok.pozycja.z, h.userData.widok.cel);`, potem `browser_click` w środek ekranu i `document.getElementById("plaque").hidden === false`. Tytuł na tabliczce = `h.userData.project.title`.
5. Zrzuty: sala I (złote ramy, mosiężne lampki, tabliczki po prawej stronie ram), sala III (dibond, ekran Bajarza, napis winylowy przy drzwiach), sala V (świecące ekrany, owalne plamy na ścianie). W sali V jasne interfejsy (np. Aule Energy) świecą jak ekran z czytelnym interfejsem, nie jak biała lampa — to robi `SUFIT_EKRANU` (na próbie bez niego zrzut ze średnią jasnością 0,85 był białą plamą, a lustro posadzki ją podwajało).

- [ ] **Krok 5: Commit**

```bash
git add js/museum/zawieszenie.js js/museum/main.js museum.html
git commit -m "$(cat <<'EOF'
Muzeum: prace na ścianach — ekran, druk w ramie stylu sali, plansza

Zrzut wisi jako świecący ekran, okładka AI jako druk (złoto w pałacu,
dibond w bieli, czarna listwa w nocy), projekt bez obrazu jako plansza
tytułowa. Tabliczki na ścianie, punkty widoku, kotwice reflektorów i
udawane plamy snopów w salach nocy. Jasne zrzuty w ciemnych strefach
przygaszone do sufitu średniej jasności.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 4: Eksponaty autorskie na podestach, gramofon, kolizje

Osiem autorskich eksponatów staje w swoich salach na podestach w stylu sali (z kolizją — nie da się przez nie przejść), a w sali II staje nowy eksponat: gramofon „Akordów Zmierzchu” na cokole, którego płyta kręci się, gdy kompozycja naprawdę gra. Kolejka Leona jeździ dookoła dywanu w jego pokoju. Sprite'y znikają z muzeum całkowicie.

**Pliki:**
- Modyfikuj: `js/museum/exhibits.js`, `js/museum/render.js`, `js/museum/main.js`, `js/gramofon.js` (jedna linia), `museum.html` (stempel)

**Interfejsy:**
- Konsumuje: `Podstawa` z planu (Zadanie 1), `Budynek`, `dodajKolizje`, `zarejestruj`, `PRZEDSWIETLENIE` (Zadanie 2), `CAT_HEX` (render.js).
- Produkuje:
  - `postawEksponaty(plan, budynek) → { interaktywne: Mesh[], tickery: Function[] }`; trafienie eksponatu ma `userData = { project, salaId, exhibit, widok }`.
  - kotwice reflektorów nad eksponatami z `cien: true` (pula Zadania 5 daje im cień w pierwszej kolejności);
  - `PODSTAWY` z wpisem `"akordy-zmierzchu": "cokol"`, `EXHIBIT_BUILDERS` z `exGramofon`;
  - `window.__gramofonGra: boolean` — ustawiane przez `js/gramofon.js` przy każdej zmianie stanu odtwarzacza.
  - `render.js` nie eksportuje już `textSprite`.

- [ ] **Krok 1: `exhibits.js` — import**

Zastąp linię 2 (`import { M, bx as bxSurowe, textSprite, fmtDate } from "muzeum/render.js";`) dwiema:

```js
import { M, bx as bxSurowe, CAT_HEX } from "muzeum/render.js";
import { dodajKolizje, zarejestruj, PRZEDSWIETLENIE } from "muzeum/sale.js";
```

- [ ] **Krok 2: `exhibits.js` — gramofon, podstawy, rozstawienie**

Usuń wszystko od komentarza `/* Jak stoi każdy eksponat autorski` (dodanego w Zadaniu 2) do końca pliku — razem z `framedShot`, `plinth` i starym eksportem — i wklej w to miejsce:

```js
/* 9. Akordy Zmierzchu — gramofon. Płyta kręci się, gdy kompozycja naprawdę gra:
   stan odtwarzacza ogłasza js/gramofon.js w window.__gramofonGra. */
function exGramofon(hex) {
  const g = new THREE.Group();
  const baza = bx(0.48, 0.09, 0.38, M.body(0x4a2a18)); baza.position.y = 0.045; g.add(baza);
  const talerz = new THREE.Group();
  const plyta = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.008, 48), new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.22 }));
  const etykieta = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.009, 32), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5 }));
  /* Płyta i etykieta to współosiowe walce jednego koloru — obrócone wokół osi wyglądają
     w każdym kącie tak samo, więc obrotu nie byłoby widać. Stąd nadruk na etykiecie:
     kremowy półksiężyc zachodzącego słońca z tytułem, nic w nim nie jest symetryczne.
     Przesunięcie głębi chroni przed migotaniem z górną ścianą walca etykiety. */
  const nadruk = new THREE.Mesh(new THREE.CircleGeometry(0.05, 48), new THREE.MeshStandardMaterial({
    roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    map: plotno(256, 256, (c) => {
      c.fillStyle = `#${new THREE.Color(hex).getHexString()}`; c.fillRect(0, 0, 256, 256);
      c.fillStyle = "#fff3d6"; c.beginPath(); c.arc(128, 128, 124, Math.PI, 2 * Math.PI); c.fill();
      c.fillStyle = "#2a1d12"; c.font = "600 30px 'Schibsted Grotesk'"; c.textAlign = "center";
      c.fillText("AKORDY", 128, 76, 190); c.fillText("ZMIERZCHU", 128, 112, 210);
      c.fillStyle = "#14110d"; c.beginPath(); c.arc(128, 128, 7, 0, 7); c.fill();   // otwór na trzpień
    }),
  }));
  nadruk.rotation.x = -Math.PI / 2; nadruk.position.y = 0.0047;
  talerz.add(plyta, etykieta, nadruk);
  talerz.position.set(-0.05, 0.095, 0);
  g.add(talerz);
  const ramie = bx(0.25, 0.012, 0.012, new THREE.MeshStandardMaterial({ color: 0xcfd2d8, roughness: 0.25, metalness: 1 }));
  ramie.position.set(0.1, 0.115, 0.1); ramie.rotation.y = 0.5; g.add(ramie);
  const tuba = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xb08a4a, roughness: 0.3, metalness: 1, side: THREE.DoubleSide }));
  tuba.position.set(0.16, 0.4, -0.1); tuba.rotation.set(0.9, 0, -0.5); tuba.castShadow = true; g.add(tuba);
  let obrot = 0;
  return {
    group: g,
    tick(t, dt) { if (window.__gramofonGra === true) obrot += dt * 3.49; talerz.rotation.y = -obrot; },   // 33⅓ obr./min = 3,49 rad/s
    activate() {},
  };
}

/* Jak stoi każdy eksponat autorski — czyta to plan.js, rezerwując na ścianie
   szerszy slot i miejsce na podstawę. „podest” — niska platforma 3 × 3 m pod
   dużą rzeźbą; „cokol” — wysoki postument pod małym przedmiotem. W pokoju
   Leona plan zamienia podest kolejki na tor dookoła pokoju („tor”). */
const PODSTAWY = {
  "age-of-agents": "podest", "empowerher": "podest", "reverie": "podest", "ekspres-leona": "podest",
  "token-drag-race": "podest", "lastbox": "podest", "naszwhisper": "podest", "anatomy": "podest",
  "akordy-zmierzchu": "cokol",
};

const EXHIBIT_BUILDERS = {
  "age-of-agents": exAgeOfAgents, "empowerher": exEmpowerHer, "reverie": exReverie,
  "ekspres-leona": exEkspres, "token-drag-race": exDragRace, "lastbox": exLastBox,
  "naszwhisper": exWhisper, "anatomy": exAnatomy, "akordy-zmierzchu": exGramofon,
};

// kolor i szorstkość podstawy w stylu sali
const PODSTAWA_STYLU = { palac: [0xe8e2d6, 0.28], biel: [0xf3f2ee, 0.9], noc: [0x0e1015, 0.35], zabawy: [0xfff4e6, 0.7], kino: [0x1a1416, 0.9] };

/* Eksponaty z planu: podstawa w stylu sali, eksponat przodem do osi sali,
   bryła kolizyjna (na widoczną masę, nie na poświatę — uwaga z 6 VIII:
   kolider poświaty zostawiał przy ścianie szczelinę), trafienie z punktem
   widoku i kotwica reflektora rzucającego cień. Kolejka w pokoju Leona
   („tor”) jeździ dookoła dywanu, bez podstawy i bez kolizji — to zabawka
   na podłodze. */
function postawEksponaty(plan, budynek) {
  const wynik = { interaktywne: [], tickery: [] };
  for (const s of plan.sale) for (const b of s.podstawy) {
    const budowniczy = EXHIBIT_BUILDERS[b.projekt.id];
    if (!budowniczy) continue;
    const p = b.projekt;
    const ex = budowniczy(new THREE.Color(CAT_HEX[p.cat[0]]).getHex());
    const [kolor, szorst] = PODSTAWA_STYLU[s.styl];
    const matPodstawy = new THREE.MeshStandardMaterial({ color: kolor, roughness: szorst });
    zarejestruj(budynek, s.id, matPodstawy, PRZEDSWIETLENIE[s.styl]);
    const g = new THREE.Group();
    g.position.set(b.x, 0, b.z);
    let wys = 0, kolizja = null;
    if (b.rodzaj === "podest") {
      const podest = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 3.0), matPodstawy);
      podest.position.y = 0.06; podest.castShadow = podest.receiveShadow = true; g.add(podest);
      if (s.styl === "noc") {   // bursztynowa linia u podstawy — podest unosi się w półmroku
        const kraw = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.025, 3.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2c46d).multiplyScalar(0.8) }));
        kraw.position.y = 0.0125; g.add(kraw);
      }
      wys = 0.12;
      kolizja = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 3.0));
      kolizja.position.set(b.x, 1.3, b.z);
    } else if (b.rodzaj === "cokol") {
      const cokol = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.02, 0.7), matPodstawy);
      cokol.position.y = 0.51; cokol.castShadow = cokol.receiveShadow = true; g.add(cokol);
      wys = 1.02;
      kolizja = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.6, 0.75));
      kolizja.position.set(b.x, 0.8, b.z);
    } else {
      ex.group.scale.setScalar(1.8);
    }
    ex.group.position.y = wys;
    // lokalne +Z eksponatu to jego przód (patrz dawny world.js): obracamy go ku osi sali
    if (b.sciana === "x+") g.rotation.y = -Math.PI / 2;
    else if (b.sciana === "x-") g.rotation.y = Math.PI / 2;
    g.add(ex.group);
    budynek.grupa.add(g);
    if (kolizja) dodajKolizje(budynek, kolizja, true);
    if (ex.tick) wynik.tickery.push(ex.tick);

    const promien = b.rodzaj === "podest" ? 1.7 : b.rodzaj === "cokol" ? 0.6 : 3.0;
    /* Pośrednik pod kliknięcie: niewidoczna bryła większa od samego eksponatu. Kula jest
       jednostronna, więc od środka promień jej nie trafia — a po pokoju Leona chodzi się
       po dywanie, czyli wewnątrz toru. Tor dostaje więc niski walec dwustronny; 1,2 m
       sięga ponad komin lokomotywy (1,08 m), więc obejmuje cały pociąg. */
    const traf = b.rodzaj === "tor"
      ? new THREE.Mesh(new THREE.CylinderGeometry(promien, promien, 1.2, 32), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }))
      : new THREE.Mesh(new THREE.SphereGeometry(promien, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
    traf.position.set(b.x, b.rodzaj === "tor" ? 0.6 : wys + (b.rodzaj === "cokol" ? 0.3 : 1.1), b.z);
    const kier = b.sciana === "x+" ? -1 : b.sciana === "x-" ? 1 : 0;
    const odl = b.rodzaj === "podest" ? 3.9 : 2.0;
    traf.userData = {
      project: p, salaId: s.id, exhibit: ex,
      widok: b.rodzaj === "tor"
        ? { pozycja: new THREE.Vector3(s.x0 + 1.4, 1.65, (s.z0 + s.z1) / 2), cel: new THREE.Vector3(b.x, 0.3, b.z) }
        : { pozycja: new THREE.Vector3(b.x + kier * odl, 1.65, b.z), cel: new THREE.Vector3(b.x, wys + 0.9, b.z) },
    };
    budynek.grupa.add(traf);
    wynik.interaktywne.push(traf);
    if (b.rodzaj !== "tor") {
      budynek.kotwice.push({
        salaId: s.id, typ: "spot", cien: true,
        pozycja: new THREE.Vector3(b.x + kier * 1.2, s.H - 0.25, b.z), cel: new THREE.Vector3(b.x, wys + 0.6, b.z),
        kat: 0.55, polcien: 0.6, zasieg: 0, kolor: 0xffe2b8, moc: 45,
      });
    }
  }
  return wynik;
}

export { EXHIBIT_BUILDERS, PODSTAWY, postawEksponaty };
```

Osiem budowniczych eksponatów (`exAgeOfAgents` … `exAnatomy`) zostaje bez zmian.

- [ ] **Krok 3: `render.js` bez sprite'ów**

Usuń z `js/museum/render.js` cały blok `/* ── Tekst na sprite'ach …` razem z funkcją `textSprite`, a z eksportu na końcu pliku usuń `textSprite`. Sprawdź: `grep -rn textSprite js/` nie zwraca nic.

- [ ] **Krok 4: `js/gramofon.js` — stan odtwarzacza dla płyty w muzeum**

Jedyna zmiana w tym pliku. Zastąp linię

```js
  const ogloszStan = (gra) => sluchacze.forEach((f) => f(gra, undefined));
```

linią

```js
  const ogloszStan = (gra) => { window.__gramofonGra = gra; sluchacze.forEach((f) => f(gra, undefined)); };
```

Karta budowania nie czyta tej zmiennej — nic się na niej nie zmienia.

- [ ] **Krok 5: `main.js`**

1. `import { PODSTAWY } from "muzeum/exhibits.js";` → `import { PODSTAWY, postawEksponaty } from "muzeum/exhibits.js";`.
2. W `zbudujMuzeum()` po linii `for (const o of prace.obrazy) o.wczytaj();` dopisz:

```js
  const eksponaty = postawEksponaty(plan, budynek);   // przed graczem: dokłada kolizje podestów
  interaktywne.push(...eksponaty.interaktywne);
  tickery.push(...eksponaty.tickery);
```

3. Podbij stempel w `museum.html` (`index.html` się nie zmienia, choć ładuje `gramofon.js` — stempel wspólny trzech stron ujednolica Zadanie 11).

- [ ] **Krok 6: Weryfikacja**

1. `node --test tests/plan.test.mjs` — `pass 17` (plan już zakładał gramofon jako `cokol`).
2. Kanoniczna sonda: `interaktywne: 64` (55 prac + 9 eksponatów), `kolizje` ≥ 130.
3. Eksponaty w salach:

```js
() => window.__mz.interaktywne.filter((h) => h.userData.exhibit).map((h) => `${h.userData.project.id}@${h.userData.salaId}`)
```

Oczekiwane (dane z 7 X): `akordy-zmierzchu@e2, reverie@e5a, age-of-agents@e5a, lastbox@e5a, naszwhisper@e5b, token-drag-race@e5b, empowerher@e6a, anatomy@e6a, ekspres-leona@leon`.

4. Kolizja z podestem — marsz z punktu widoku prosto na eksponat:

```js
async () => {
  const m = window.__mz;
  const h = m.interaktywne.find((q) => q.userData.exhibit && q.userData.project.id === "age-of-agents");
  const w = h.userData.widok;
  m.gracz.teleportuj(w.pozycja.x, w.pozycja.z, w.cel.clone().setY(1.65));
  m.testRuch = { KeyW: true };
  await new Promise((r) => setTimeout(r, 2500));
  m.testRuch = null;
  return { x: m.gracz.pozycjaX(), srodekPodestu: h.position.x };
}
```

Oczekiwane: `|srodekPodestu − x|` ≥ 1,8 (krawędź podestu 1,5 + promień kapsuły 0,35, z dokładnością do kroku). Zmierzone na próbie: 4,9 − 3,05 = 1,85.

5. Gramofon: `window.__gramofonGra = true`, po 2 s rotacja talerza się zmienia; `window.__gramofonGra = false` — stoi.
6. Zrzuty: sala II (cokół z gramofonem przed obrazem „Akordów Zmierzchu”), sala V (podesty z bursztynową linią u podstawy), pokój Leona (kolejka wokół dywanu).

- [ ] **Krok 7: Commit**

```bash
git add js/museum/exhibits.js js/museum/render.js js/museum/main.js js/gramofon.js museum.html
git commit -m "$(cat <<'EOF'
Muzeum: eksponaty autorskie na podestach z kolizją, gramofon w sali II

Podest w stylu sali (w nocy z bursztynową linią u podstawy), eksponat
przodem do osi, kolizja na widoczną masę, kotwica reflektora z cieniem.
Nowy eksponat: gramofon Akordów Zmierzchu — płyta kręci się, gdy
kompozycja gra (stan z gramofon.js). Sprite'y usunięte z muzeum.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 5: Światło — stała pula, przedświetlenie, lustro nocy, adaptacja oka

Sale dostają prawdziwe światło. Stała pula (12 reflektorów, 4 światła powierzchniowe, 1 kierunkowe z cieniem, półkula) przesiada się przy każdej zmianie sali na kotwice bieżącej sali i jej sąsiadów; dalekie sale świecą przedświetleniem, a w salach nocy udawane plamy gasną tam, gdzie zapala się prawdziwy reflektor. Posadzka nocy staje się czarnym lustrem. Ekspozycja, odbicia otoczenia, półkula i poświata dochodzą płynnie do wartości strefy — jak oko wchodzące z jasnej sali do ciemnej. Do tego GTAO: miękkie cienie w narożnikach.

**Pliki:**
- Utwórz: `js/museum/swiatla.js`
- Modyfikuj: `js/museum/render.js`, `js/museum/sale.js`, `js/museum/wystroj.js`, `js/museum/zawieszenie.js`, `js/museum/main.js`, `museum.html`

**Interfejsy:**
- Konsumuje: `Plan` (Zadanie 1); `Budynek` z `kotwice`, `materialySal` (Zadanie 2); `plamy` z `powiesPrace` (Zadanie 3); kotwice z `cien` (Zadanie 4).
- Produkuje:
  - `initSwiatla({ plan, budynek, plamy, pula?, lustro? }) → { wejdz(sala), aktualizuj(dt), sala(), wylaczLustro(), lustro }`. `pula` domyślnie `{ spot: 12, rect: 4 }` — Zadanie 10 poda mniejszą na słabszym sprzęcie.
  - `render.js` eksportuje `gtao` (GTAOPass, także `window.__mz.gtao`).
  - `window.__mz.swiatla`.

- [ ] **Krok 1: Utwórz `js/museum/swiatla.js`**

```js
/* Światło muzeum: stała pula świateł, przedświetlenie dalekich sal, lustro
   posadzki nocy, wypełnienie i adaptacja oka.

   Forward renderer three.js wlicza KAŻDE światło sceny do KAŻDEGO shadera,
   a zmiana ich liczby rekompiluje programy wszystkich materiałów. Dlatego
   liczba świateł jest stała przez całą wizytę: pula przesiada się na kotwice
   bieżącej sali i jej sąsiadów (kotwice zostawiają wystroj.js, zawieszenie.js
   i exhibits.js), a reszta budynku świeci „na niby” — przedświetleniem
   materiałów (sale.js) i plamami snopów na ścianach (zawieszenie.js). */

import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { scene, renderer, camera, bloom, reduceMotion } from "muzeum/render.js";

RectAreaLightUniformsLib.init();

// Na strefę (styl bieżącej sali): ekspozycja oka, siła odbić otoczenia, półkula, „słońce” przez strop.
const EKSPOZYCJA = { palac: 1.0, biel: 0.95, noc: 1.25, kino: 1.2, zabawy: 0.95 };
const SRODOWISKO = { palac: 0.22, biel: 0.36, noc: 0.04, kino: 0, zabawy: 0.3 };
const POLKULA = {
  palac: [0xfff1de, 0x3b2a1c, 0.3], biel: [0xffffff, 0xd6d1c7, 0.3], noc: [0x2c3a58, 0x07080b, 0.3],
  kino: [0x2a1f22, 0x050404, 0.15], zabawy: [0xfff6ec, 0xd8c9b8, 0.4],
};
const SLONCE = { palac: 0.3, biel: 0.3, noc: 0, kino: 0, zabawy: 0.35 };
/* Poświata (próg, siła) na strefę. W bieli białe ściany same przekraczają próg
   i poświata zalewała salę mleczną mgłą — tam praktycznie znika; w nocy świecą
   ekrany i szyldy, więc jest najmocniejsza. */
const POSWIATA = { palac: [0.85, 0.3], biel: [1.6, 0.15], noc: [0.8, 0.45], kino: [0.8, 0.4], zabawy: [1.2, 0.2] };
const CZAS_OKA = 0.4;          // stała czasowa adaptacji [s] — ok. 1,2 s do pełnego dojścia
const CZAS_PRZEJSCIA = 0.3;    // przedświetlenie i plamy [s]
/* Sala z prawdziwymi światłami zostawia sobie odrobinę udawania: wypełnia
   cienie odbitego światła, którego i tak nie liczymy. */
const RESZTKA_UDAWANIA = 0.12;

const wykladniczo = (dt, tau) => (reduceMotion ? 1 : 1 - Math.exp(-dt / tau));

export function initSwiatla({ plan, budynek, plamy = [], pula = { spot: 12, rect: 4 }, lustro: zLustrem = true }) {
  /* ── Pula ─────────────────────────────────────────────────────────── */
  const spoty = Array.from({ length: pula.spot }, (_, i) => {
    const s = new THREE.SpotLight(0xffffff, 0, 0, 0.5, 0.5, 2);
    if (i < 2) {   // dwa pierwsze miejsca puli rzucają cień — dostają je kotwice z `cien`
      s.castShadow = true;
      s.shadow.mapSize.set(1024, 1024);
      s.shadow.bias = -0.0004;
    }
    scene.add(s, s.target);
    return { swiatlo: s, obecna: null, nastepna: null, moc: 0 };
  });
  const prostokaty = Array.from({ length: pula.rect }, () => {
    const r = new THREE.RectAreaLight(0xffffff, 0, 1, 1);
    scene.add(r);
    return { swiatlo: r, obecna: null, nastepna: null, moc: 0 };
  });
  const slonce = new THREE.DirectionalLight(0xfff6ea, 0);
  slonce.castShadow = true;
  slonce.shadow.mapSize.set(1024, 1024);
  slonce.shadow.bias = -0.0005;
  slonce.shadow.radius = 4;
  scene.add(slonce, slonce.target);
  const polkula = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);
  scene.add(polkula);

  /* ── Stan przejść ─────────────────────────────────────────────────── */
  const sale = new Map(plan.sale.map((s) => [s.id, { teraz: 1, cel: 1 }]));
  const plamyStan = plamy.map((m) => ({ m, baza: m.material.opacity, cel: m.material.opacity }));
  let biezaca = null;
  const celPolkuli = { niebo: new THREE.Color(), ziemia: new THREE.Color(), sila: 0.3 };
  let celSlonca = 0;

  /* ── Lustro posadzki nocy ─────────────────────────────────────────── */
  /* Lustro leży 0,5 mm nad płytami posadzek sali bieżącej i następnej sali nocy
     i je zasłania; czarne płyty widać tam, gdzie lustra nie ma (pozostałe sale)
     oraz po wylaczLustro(). Siłę odbicia wyznacza wyłącznie jego `color`:
     szary 0x9a9a9a mnoży odbity obraz. */
  let lustro = null;
  if (zLustrem && plan.sale.some((s) => s.styl === "noc")) {
    lustro = new Reflector(new THREE.PlaneGeometry(1, 1), { textureWidth: 1024, textureHeight: 1024, color: 0x9a9a9a, clipBias: 0.003 });
    lustro.rotation.x = -Math.PI / 2;
    lustro.visible = false;
    const oryginal = lustro.onBeforeRender;
    lustro.onBeforeRender = function (r, sc, cam, ...reszta) {
      // przebieg normalnych GTAO renderuje scenę z materiałem zastępczym — odbicie jest już w tej klatce
      if (sc.overrideMaterial) return;
      oryginal.call(this, r, sc, cam, ...reszta);
    };
    scene.add(lustro);
  }
  function ustawLustro(s) {
    if (!lustro) return;
    if (s.styl !== "noc") {
      lustro.visible = false;
      return;
    }
    const nast = plan.sale.find((q) => q.styl === "noc" && Math.abs(q.z0 - s.z1) < 1e-6);
    const z0 = s.z0, z1 = (nast ?? s).z1;
    // dokładnie szerokość sali: połówka muru leży w prostokącie własnej sali, więc brzeg lustra chowa się pod murem i nie wchodzi do sąsiednich pomieszczeń
    lustro.scale.set(s.x1 - s.x0, z1 - z0, 1);
    lustro.position.set((s.x0 + s.x1) / 2, 0.0005, (z0 + z1) / 2);
    lustro.visible = true;
  }

  /* ── Przydział puli przy wejściu do sali ──────────────────────────── */

  /* Przydział po tożsamości: kotwica, która zostaje wybrana, zostaje na swoim
     miejscu puli. Przydział po kolejności (według odległości) dawał prawie
     każdemu miejscu inną kotwicę, a miejsce ze zmienioną kotwicą najpierw gaśnie
     — przy drzwiach gasła więc cała sala, choć te same światła miały świecić dalej
     (dwa świetliki, które tylko zamieniłyby się miejscami, gasły oba). Miejsca,
     których kotwica odpadła, przejmują nowo wybrane (najpierw ciemne, a miejsca
     z cieniem na końcu); reszta gaśnie. `wymagane` to kotwice z cieniem: muszą
     siedzieć na miejscach, których światło rzuca cień (0–1) — liczby świateł z
     cieniem nie wolno zmieniać, to rekompilacja shaderów. Zwykła kotwica na
     takim miejscu im ustępuje. */
  function rozdziel(miejsca, wybrane, wymagane = []) {
    const swieci = (p) => p.moc > 0;
    const zajete = new Set();
    for (const p of miejsca) {
      // światło, które świeci teraz, ma pierwszeństwo przed tym, które dopiero ma przyjść
      const k = [p.obecna, p.nastepna].find((x) => x && wybrane.includes(x) && !zajete.has(x)) ?? null;
      if (k) zajete.add(k);
      p.nastepna = k;
    }
    const cieniste = miejsca.filter((p) => p.swiatlo.castShadow);
    for (const z of wymagane.filter((x) => wybrane.includes(x))) {
      if (cieniste.some((p) => p.nastepna === z)) continue;
      const koszt = (p) => (p.nastepna ? 2 : swieci(p) ? 1 : 0);   // wolne ciemne < wolne gasnące < zajęte przez zwykłą kotwicę
      const p = cieniste.filter((q) => !wymagane.includes(q.nastepna)).sort((a, b) => koszt(a) - koszt(b))[0];
      if (!p) continue;
      for (const q of miejsca) if (q.nastepna === z) q.nastepna = null;   // zwalnia miejsce, na którym siedziała dotąd
      p.nastepna = z;
    }
    const siedzace = new Set(miejsca.map((p) => p.nastepna));
    const nowe = wybrane.filter((k) => !siedzace.has(k));
    const ranga = (p) => (cieniste.includes(p) ? 2 : 0) + (swieci(p) ? 1 : 0);   // miejsca z cieniem zostają dla kotwic z cieniem
    miejsca.filter((p) => !p.nastepna).sort((a, b) => ranga(a) - ranga(b))
      .forEach((p, i) => { p.nastepna = nowe[i] ?? null; });
  }

  function przydziel(s) {
    const sasiedzi = new Set([s.id]);
    for (const d of plan.drzwi) {
      if (d.a === s.id && d.b) sasiedzi.add(d.b);
      if (d.b === s.id) sasiedzi.add(d.a);
    }
    const odl = (q) => Math.hypot((q.x0 + q.x1) / 2 - camera.position.x, (q.z0 + q.z1) / 2 - camera.position.z);
    const kolejnosc = [s, ...plan.sale.filter((q) => q !== s && sasiedzi.has(q.id)).sort((a, b) => odl(a) - odl(b))];

    // wypełnienie (prostokąty): cała sala albo nic — inaczej pół sali świeciłoby podwójnie
    const realne = new Set();
    const przydzRect = [];
    for (const q of kolejnosc) {
      const k = budynek.kotwice.filter((x) => x.salaId === q.id && x.typ === "rect");
      if (przydzRect.length + k.length <= prostokaty.length) { przydzRect.push(...k); realne.add(q.id); }
    }
    // reflektory tylko w salach „realnych”: bieżąca najpierw, w sali bliższe kamerze; dwa z cieniem na początku wyboru
    const waga = (k) => (k.salaId === s.id ? 0 : 1000) + k.pozycja.distanceTo(camera.position);
    const kandydaci = budynek.kotwice.filter((k) => k.typ === "spot" && realne.has(k.salaId)).sort((a, b) => waga(a) - waga(b));
    const zCieniem = kandydaci.filter((k) => k.cien).slice(0, 2);
    const przydzSpot = [...zCieniem, ...kandydaci.filter((k) => !zCieniem.includes(k))].slice(0, spoty.length);

    rozdziel(prostokaty, przydzRect);
    rozdziel(spoty, przydzSpot, zCieniem);
    const swiecace = new Set(przydzSpot);
    for (const p of plamyStan) p.cel = swiecace.has(p.m.userData.kotwica) ? 0 : p.baza;
    for (const [id, st] of sale) st.cel = realne.has(id) ? RESZTKA_UDAWANIA : 1;

    // „słońce” przez strop bieżącej sali: cień ławek i podestów
    const cx = (s.x0 + s.x1) / 2, cz = (s.z0 + s.z1) / 2, r = Math.max(s.x1 - s.x0, s.z1 - s.z0) / 2 + 1;
    slonce.position.set(cx + 2, s.H + 6, cz + 3);
    slonce.target.position.set(cx, 0, cz);
    slonce.target.updateMatrixWorld();
    Object.assign(slonce.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: s.H + 14 });
    slonce.shadow.camera.updateProjectionMatrix();
    celSlonca = SLONCE[s.styl] ?? 0;
    const [niebo, ziemia, sila] = POLKULA[s.styl];
    celPolkuli.niebo.setHex(niebo); celPolkuli.ziemia.setHex(ziemia); celPolkuli.sila = sila;
    ustawLustro(s);
  }

  function ustawGeometrie(p, k) {
    const l = p.swiatlo;
    if (!k) return;
    l.color.setHex(k.kolor);
    l.position.copy(k.pozycja);
    if (l.isRectAreaLight) {
      l.width = k.szer; l.height = k.wys;
      if (k.kierunek === "dol") l.rotation.set(-Math.PI / 2, 0, 0); else l.lookAt(k.cel);
    } else {
      l.angle = k.kat; l.penumbra = k.polcien; l.distance = k.zasieg ?? 0;
      l.target.position.copy(k.cel);
      l.target.updateMatrixWorld();
    }
  }

  /* Przesiadka bez skoku: światło gaśnie (~0,12 s), przenosi się na nową
     kotwicę i rozpala (~0,25 s) — ale tylko miejsce, które zmienia kotwicę (patrz
     rozdziel); kotwica, która zostaje, świeci bez przerwy. Przy ograniczonym ruchu
     zmiana jest natychmiastowa: nowa kotwica obejmuje miejsce w tej samej klatce,
     od razu na pełnej mocy. Liczba świateł nie zmienia się nigdy. */
  function animujPule(p, dt) {
    if (p.obecna !== p.nastepna) {
      if (reduceMotion) {
        p.obecna = p.nastepna;
        ustawGeometrie(p, p.obecna);
        p.moc = p.obecna?.moc ?? 0;
      } else {
        p.moc = Math.max(0, p.moc - dt * 8 * (p.obecna?.moc ?? 1));
        if (p.moc === 0) { p.obecna = p.nastepna; ustawGeometrie(p, p.obecna); }
      }
    } else if (p.obecna) {
      p.moc = Math.min(p.obecna.moc, p.moc + dt * 4 * p.obecna.moc);
    }
    p.swiatlo.intensity = reduceMotion && p.obecna === p.nastepna ? (p.obecna?.moc ?? 0) : p.moc;
  }

  return {
    lustro,
    sala: () => biezaca,
    /* Wołane przez main.js przy każdej zmianie sali pod nogami gościa. */
    wejdz(s) {
      biezaca = s;
      przydziel(s);
    },
    /* Wyłączenie lustra na stałe — stopień degradacji z perf.js (Zadanie 10). */
    wylaczLustro() {
      if (!lustro) return;
      scene.remove(lustro);
      lustro = null;
    },
    aktualizuj(dt) {
      if (!biezaca) return;
      for (const p of spoty) animujPule(p, dt);
      for (const p of prostokaty) animujPule(p, dt);
      const k = wykladniczo(dt, CZAS_PRZEJSCIA);
      for (const [id, st] of sale) {
        if (Math.abs(st.cel - st.teraz) < 0.001) continue;
        st.teraz += (st.cel - st.teraz) * k;
        if (Math.abs(st.cel - st.teraz) < 0.001) st.teraz = st.cel;
        for (const ustaw of budynek.materialySal.get(id)) ustaw(st.teraz);
      }
      for (const p of plamyStan) p.m.material.opacity += (p.cel - p.m.material.opacity) * k;
      // adaptacja oka i nastrój strefy
      const oko = wykladniczo(dt, CZAS_OKA);
      renderer.toneMappingExposure += ((EKSPOZYCJA[biezaca.styl] ?? 1) - renderer.toneMappingExposure) * oko;
      scene.environmentIntensity += ((SRODOWISKO[biezaca.styl] ?? 0.2) - scene.environmentIntensity) * oko;
      polkula.color.lerp(celPolkuli.niebo, oko);
      polkula.groundColor.lerp(celPolkuli.ziemia, oko);
      polkula.intensity += (celPolkuli.sila - polkula.intensity) * oko;
      slonce.intensity += (celSlonca - slonce.intensity) * oko;
      const [prog, sila] = POSWIATA[biezaca.styl] ?? [0.85, 0.35];
      bloom.threshold += (prog - bloom.threshold) * oko;
      bloom.strength += (sila - bloom.strength) * oko;
    },
  };
}
```

- [ ] **Krok 2: `render.js` — GTAO**

1. Pod importem `RenderPass` dopisz `import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";`.
2. Zaraz po `composer.addPass(new RenderPass(scene, camera));` dopisz:

```js
/* Okluzja otoczenia (GTAO): miękki cień w narożnikach, pod ławkami i u podstawy
   podestów. To ona odróżnia wnętrze od „płaskiego 3D” — szczególnie w bieli,
   gdzie światło sufitu nie rzuca cieni. */
const gtao = new GTAOPass(scene, camera, 16, 16);
gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 });
gtao.blendIntensity = 1;
composer.addPass(gtao);
```

3. Po `window.__mz.bloom = bloom;` dopisz `window.__mz.gtao = gtao;`, a w eksporcie po `bloom,` dopisz `gtao,`.

- [ ] **Krok 3: `sale.js` — posadzka nocy pod lustrem**

W `materialySali` zastąp gałąź `case "noc": return { … };` tą (sama treść bez zmian, dochodzi komentarz, co naprawdę widać):

```js
    case "noc": return {
      sciana: materialPBR("tynk", { kolor: 0x3a4357, normal: 0.7 }),
      // czarna płyta; lustro z swiatla.js przykrywa ją w sali bieżącej i następnej, w pozostałych salach nocy widać ją wprost
      posadzka: bezOdbic(gladki(0x0d0f14, 0.32)),
      sufit: gladki(0x0b0d12, 1),
    };
```

Lustro leży 0,5 mm nad posadzką i wygrywa test głębi, więc o sile odbicia decyduje wyłącznie jego `color` (decyzja właściciela 8 X: pełne lustro, jak w podglądzie; półprzezroczysta nakładka z planu nic nie robiła i odpadła).

- [ ] **Krok 4: Strojenie mocy pod prawdziwe światło**

Wartości z Zadań 2–3 dobrane bez świateł były za mocne (zmierzone na próbie: prześwietlona posadzka pod świetlikiem, blask lampek na listwie krzesłowej, mleczna mgła poświaty w bieli):

1. `wystroj.js`, funkcja `palac`: końcówka wywołania `swietlik(…)` — `0xfff0dc, s.rodzaj === "atrium" ? 5.5 : 7.5);` → `0xfff0dc, s.rodzaj === "atrium" ? 4.5 : 6);`.
2. `wystroj.js`, funkcja `biel`: `0xffffff, 2.9);` → `0xffffff, 2.2);`.
3. `zawieszenie.js`, kotwica lampki nad ramą w pałacu: `kat: 1.05, polcien: 0.85, zasieg: 4, kolor: 0xffd49a, moc: 5 * (w.wyrozniona ? 1.3 : 1),` → `kat: 0.75, polcien: 0.7, zasieg: 3, kolor: 0xffd49a, moc: 3.5 * (w.wyrozniona ? 1.3 : 1),`.

- [ ] **Krok 5: `main.js`**

1. Pod importem `initPerf` dopisz `import { initSwiatla } from "muzeum/swiatla.js";`.
2. W deklaracji zmiennych modułu dopisz `swiatla = null` (`let plan = null, budynek = null, gracz = null, prace = null, swiatla = null;`).
3. Zastąp `naZmianeSali`:

```js
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
  swiatla?.wejdz(s);
}
```

4. W `petla()` tuż przed `composer.render();` dopisz `swiatla?.aktualizuj(dt);`.
5. W `zbudujMuzeum()` po `gracz.teleportuj(plan.start.x, plan.start.z);` dopisz `swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy });`, a w `Object.assign(window.__mz, { … })` dopisz `swiatla` po `prace`.

- [ ] **Krok 6: `museum.html`**

W import mapie po `muzeum/zawieszenie.js` dopisz `"muzeum/swiatla.js":  "./js/museum/swiatla.js?v=STEMPEL",` i podbij stempel.

- [ ] **Krok 7: Weryfikacja**

1. Kanoniczna sonda bez błędów. Liczba programów stała przy przejściu przez cały budynek — dowód, że pula nie rekompiluje shaderów:

```js
async () => {
  const m = window.__mz;
  const przed = m.renderer.info.programs.length;
  for (const s of m.plan.sale) {
    const w = { x: (s.x0 + s.x1) / 2, z: (s.z0 + s.z1) / 2 };
    m.gracz.teleportuj(w.x, w.z);
    await new Promise((r) => setTimeout(r, 400));
  }
  return { przed, po: m.renderer.info.programs.length, bledy: window.__errs };
}
```

Oczekiwane: `po − przed` ≤ 2 (pierwsze wejście do sali z lustrem i z cieniem może dołożyć warianty programu; potem już nic).

2. Po wejściu do sali nocy (`m.gracz.teleportuj(0, 46, { x: 0, z: 60 })`, 2,5 s): `m.swiatla.lustro.visible === true`, `m.renderer.toneMappingExposure` ≈ 1,25, plamy w tej sali mają `material.opacity` ≈ 0 tam, gdzie reflektor świeci naprawdę. W sali białej `m.bloom.threshold` ≈ 1,6.
3. Zrzuty z 2,5 s odczekania po teleporcie: start w atrium (ciepły kamień, złoty szyld, sala I w świetle świetlika), wnętrze sali I (bez blasku na listwie), sala III (ostra biel, cienie w narożnikach, bez mlecznej mgły), sala V (lustro odbija ekrany, rzeźby i szyldy), pokój Leona.

- [ ] **Krok 8: Commit**

```bash
git add js/museum/swiatla.js js/museum/render.js js/museum/sale.js js/museum/wystroj.js js/museum/zawieszenie.js js/museum/main.js museum.html
git commit -m "$(cat <<'EOF'
Muzeum: stała pula świateł, lustro nocy, adaptacja oka i GTAO

Pula 12 reflektorów + 4 świateł powierzchniowych przesiada się na kotwice
bieżącej sali i sąsiadów bez rekompilacji shaderów; dalekie sale świecą
przedświetleniem, plamy snopów gasną pod prawdziwymi reflektorami.
Posadzka nocy jako lustro, ekspozycja i poświata płynnie wg strefy.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 6: Podróżowanie — kliknij podłogę, podejdź do pracy, wycieczka

Sedno prośby właściciela: lepsza jakość samego podróżowania po muzeum. Klik w podłogę prowadzi tam płynnie przez kolejne drzwi (znacznik na posadzce pokazuje dokąd, zanim się kliknie), klik w pracę podprowadza przed nią i otwiera tabliczkę, a odległe cele osiąga się szybką podróżą z lekko poszerzonym kątem widzenia. Chód dostaje bezwładność, przeciąganie myszą rozgląda się bez blokady wskaźnika, a pierwszy klawisz WASD wchodzi w tryb gry (mysz z blokadą). „Oprowadź mnie” staje się wycieczką po wyróżnionych pracach. Przy `prefers-reduced-motion` przejazd zastępuje krótkie przenikanie.

**Pliki:**
- Utwórz: `js/museum/nawigacja.js`
- Zastąp: `js/museum/player.js`, `js/museum/main.js`
- Modyfikuj: `museum.html`, `css/museum.css`

**Interfejsy:**
- Konsumuje: `salaPod`, `trasa`, `punktWejscia`, `wyroznione` (Zadanie 1); `widok` trafień (Zadania 3–4); `initSwiatla` (Zadanie 5).
- Produkuje:
  - `player.js`: `initPlayer(kolizje) → { controls, zablokowany(), naZiemi(), pozycja(), pozycjaDo(v), pozycjaX(), pozycjaZ(), predkosc(), aktywneWejscie(), naKrok(f), sterujZ(vx, vz | null), zablokuj(), odblokuj(), teleportuj(x, z, patrzNa?), update(dt) }`. Stara tura (`oprowadz`, `wTurze`, `przerwijTure`) znika. `naKrok` woła słuchaczy co 0,75 m drogi (dźwięk kroków, Zadanie 9).
  - `nawigacja.js`: `initNawigacja({ plan, gracz, zaslona }) → { update(dt), przerwij(), aktywna(), trwaWycieczka(), idzDo(x, z), podejdzDo(hit, poDojsciu), lecDoSali(salaId), rozpocznijWycieczke({ znajdz, otworz, zamknij }) → boolean }`.
  - `main.js`: `podejdz(hit)`, `znajdzTrafienie(idProjektu)`, `window.__mz.nawigacja`; znacznik celu na posadzce.
  - `museum.html`: `<div id="zaslona">` (przenikanie; użyje go też Zadanie 8).

- [ ] **Krok 1: Zastąp `js/museum/player.js`**

```js
/* Chodzenie z kolizjami i rozglądanie się. Octree + Capsule z oficjalnego dema
   FPS three.js — ślizganie po ścianach i wchodzenie w otwory drzwi za darmo,
   czego ręczne AABB nie potrafi (zakleszcza się w narożnikach).

   Jedyna odpowiedzialność: gdzie stoi gracz, dokąd idzie, w co uderza i dokąd
   patrzy. Przejazdy („idź tutaj”, „podejdź do pracy”, plan w rogu) liczy
   nawigacja.js i podaje tu tylko prędkość przez sterujZ() — kolizje i
   grawitacja zostają wspólne, więc przejazd nie przenika przez ławki ani
   podesty. Zero interfejsu i zero geometrii budynku. */

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";
import { camera, renderer, reduceMotion } from "muzeum/render.js";

/* ── Stałe ruchu (metry, sekundy) ─────────────────────────────────────── */

const WZROST = 1.7;          // wysokość oczu = środek górnej półkuli kapsuły
const PROMIEN = 0.35;        // otwór drzwi ma 2,4 m — kapsuła mieści się z zapasem
const PREDKOSC = 4.2;        // marsz [m/s] — amfilada ma ok. 150 m, nie 354
const BIEG = 1.9;            // mnożnik przy Shifcie
const GRAWITACJA = 22;       // [m/s²] — ostrzej niż ziemskie; realne spadanie w grze wygląda ślamazarnie
const DOCISK = 0.5;          // stały docisk do podłogi [m/s] — bez niego `naZiemi` migocze 0101…
/* Bezwładność [1/s]: jak szybko prędkość dochodzi do zadanej. Rozpęd szybszy
   niż hamowanie — start ma być żwawy, a zatrzymanie miękkie, jak krok. */
const ROZPED = 9, HAMOWANIE = 7;
const AMPLITUDA_KROKU = 0.022;   // bujanie kamery [m]
const DLUGOSC_KROKU = 0.75;      // [m] — bujanie i dźwięk kroków liczone z drogi, nie z czasu
const MARTWA_STREFA = 0.15;      // joystick
const CZULOSC = 0.0032;          // [rad/px] — przeciąganie myszą i palcem
const MAX_POCHYLENIE = 1.15;     // [rad] ok. 66° w górę i w dół
const PROG_KLIKU = 8;            // [px] — ruch do tego progu od wciśnięcia to klik z drżeniem ręki, nie przeciąganie (ten sam próg ma main.js: `dist > 8`)
/* Górny limit kroku całkowania. Przy 0,05 s i biegu (8 m/s) kapsuła przesuwa
   się o 0,4 m na klatkę, a przeskok przez mur 0,4 m wymaga ponad 1,1 m (mur +
   dwa promienie) — zapas jest. Dłuższa klatka (karta w tle) zjadłaby ten
   margines, dlatego limit pilnujemy tutaj, nie tylko w pętli main.js. */
const MAX_KROK = 0.05;

const KLAWISZE_RUCHU = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const naUi = (el) => !!el?.closest?.(".plaque, .list-panel, .hud-top, .minimapa, #wejscie");

/* Wspólne rozglądanie: przeciąganie myszą, prawy kciuk, (w blokadzie) mysz.
   Euler YXZ — odchylenie, potem pochylenie — kamera się nie przekrzywia. */
const eul = new THREE.Euler(0, 0, 0, "YXZ");
function rozejrzyj(dx, dy) {
  eul.setFromQuaternion(camera.quaternion);
  eul.y -= dx * CZULOSC;
  eul.x = THREE.MathUtils.clamp(eul.x - dy * CZULOSC, -MAX_POCHYLENIE, MAX_POCHYLENIE);
  camera.quaternion.setFromEuler(eul);
}

/* ── Dotyk: joystick i rozglądanie ────────────────────────────────────────
   Lewa połowa ekranu to analogowy joystick, prawa obraca kamerę. Każdy gest
   śledzi WŁASNY identifier dotyku, więc działają jednocześnie. Krótkie
   dotknięcie (bez przeciągnięcia) obsługuje main.js jako „idź tutaj” albo
   „podejdź do pracy” — tu tylko gesty ciągłe. */
function dotyk({ naRuch, naRozgladanie }) {
  const host = document.createElement("div");
  host.className = "joy"; host.hidden = true;
  host.innerHTML = '<span class="joy-kciuk"></span>';
  document.body.appendChild(host);
  const kciuk = host.querySelector(".joy-kciuk");
  let id = null, sx = 0, sy = 0;
  let idRozgladania = null, ostatniX = 0, ostatniY = 0;

  addEventListener("touchstart", (e) => {
    // samoleczenie: zgubione touchend nie blokuje nowego dotyku
    const zywy = (i) => i === null || [...e.touches].some((x) => x.identifier === i);
    if (!zywy(id)) id = null;
    if (!zywy(idRozgladania)) idRozgladania = null;
    for (const t of e.changedTouches) {
      if (naUi(t.target)) continue;
      host.hidden = false;
      if (t.clientX <= innerWidth / 2) {
        if (id !== null) continue;
        id = t.identifier; sx = t.clientX; sy = t.clientY;
        host.style.left = `${sx}px`; host.style.top = `${sy}px`;
        host.classList.add("aktywny");
      } else if (idRozgladania === null) {
        idRozgladania = t.identifier; ostatniX = t.clientX; ostatniY = t.clientY;
      }
    }
  }, { passive: true });

  addEventListener("touchmove", (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) {
        const dx = THREE.MathUtils.clamp((t.clientX - sx) / 60, -1, 1);
        const dy = THREE.MathUtils.clamp((t.clientY - sy) / 60, -1, 1);
        kciuk.style.transform = `translate(${dx * 26}px, ${dy * 26}px)`;
        naRuch(dx, -dy);
      } else if (t.identifier === idRozgladania) {
        naRozgladanie(t.clientX - ostatniX, t.clientY - ostatniY);
        ostatniX = t.clientX; ostatniY = t.clientY;
      }
    }
  }, { passive: true });

  // touchcancel jak touchend — iOS wysyła cancel przy geście systemowym od lewej krawędzi
  const pusc = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === id) { id = null; kciuk.style.transform = ""; host.classList.remove("aktywny"); naRuch(0, 0); }
      else if (t.identifier === idRozgladania) idRozgladania = null;
    }
  };
  addEventListener("touchend", pusc, { passive: true });
  addEventListener("touchcancel", pusc, { passive: true });
}

export function initPlayer(kolizje) {
  const octree = new Octree().fromGraphNode(kolizje);
  const kapsula = new Capsule(new THREE.Vector3(0, PROMIEN, 0), new THREE.Vector3(0, WZROST, 0), PROMIEN);
  const controls = new PointerLockControls(camera, renderer.domElement);
  const klawisze = {};
  const predkosc = new THREE.Vector3(), zadana = new THREE.Vector3();
  const przod = new THREE.Vector3(), bok = new THREE.Vector3(), ruch = new THREE.Vector3(), krok = new THREE.Vector3();
  const sluchaczeKrokow = new Set();
  let naZiemi = false, joyX = 0, joyY = 0;
  let zewnetrzna = null;      // prędkość zadana przez nawigacja.js (x, z) albo null
  let aktywnosc = -1e9;       // chwila ostatniego czynnego wejścia gościa — przerywa przejazd
  let droga = 0;              // przebyta droga w bieżącym kroku [m]
  let przeciaganie = null;    // { x, y, x0, y0, rusza } — przeciąganie myszą bez blokady

  const lista = () => !!document.querySelector(".list-panel:not([hidden])");

  addEventListener("keydown", (e) => {
    if (lista()) return;
    klawisze[e.code] = true;
    /* Pierwszy klawisz ruchu wchodzi w tryb gry: mysz rozgląda się bez
       przytrzymania. Klik zostaje dla „idź tutaj”. keydown jest gestem
       użytkownika, więc przeglądarka zgadza się na blokadę. */
    if (KLAWISZE_RUCHU.has(e.code) && !controls.isLocked) {
      renderer.domElement.requestPointerLock?.()?.catch?.(() => {});   // odmowa (np. Esc w trakcie) jest zwyczajna — zostaje tryb myszy
    }
  });
  addEventListener("keyup", (e) => { klawisze[e.code] = false; });
  addEventListener("blur", () => { for (const k in klawisze) klawisze[k] = false; });   // puszczony klawisz poza oknem nie może jechać dalej

  dotyk({
    naRuch: (dx, dy) => { joyX = dx; joyY = dy; },
    naRozgladanie: (dx, dy) => { rozejrzyj(dx, dy); aktywnosc = performance.now(); },
  });

  /* Przeciąganie myszą: rozglądanie bez blokady wskaźnika. Ruch do PROG_KLIKU px od
     miejsca wciśnięcia to jeszcze klik z drżeniem ręki (klik obsługuje main.js) — nie
     obraca widoku i nie liczy się jako wejście gościa, więc nie kasuje przejazdu, który
     tym klikiem właśnie ruszył (ani trwającego, gdy gość przekierowuje się drugim klikiem). */
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || controls.isLocked || e.button !== 0) return;
    przeciaganie = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, rusza: false };
  });
  addEventListener("pointermove", (e) => {
    if (!przeciaganie || e.pointerType === "touch") return;
    const p = przeciaganie;
    if (!p.rusza && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) <= PROG_KLIKU) return;
    p.rusza = true;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (dx || dy) { rozejrzyj(dx, dy); aktywnosc = performance.now(); }
  });
  addEventListener("pointerup", () => { przeciaganie = null; });
  controls.addEventListener("change", () => { aktywnosc = performance.now(); });   // mysz w blokadzie

  /* Klawisze i joystick, które w tej klatce mają prawo ruszyć graczem.
     KRYTYCZNE: dotyk wpisuje TYLKO aktywne (true) klucze — scalenie niżej to
     suma źródeł; wpisane false zerowałoby prawdziwe WASD. `__mz.testRuch`
     symuluje klawisz w testach (blokada wymaga prawdziwego gestu). */
  function wcisniete() {
    const z = {};
    if (joyY > MARTWA_STREFA) z.KeyW = true;
    if (joyY < -MARTWA_STREFA) z.KeyS = true;
    if (joyX > MARTWA_STREFA) z.KeyD = true;
    if (joyX < -MARTWA_STREFA) z.KeyA = true;
    return { ...klawisze, ...z, ...window.__mz?.testRuch };
  }

  function kierunek(w) {
    camera.getWorldDirection(przod);
    przod.y = 0; przod.normalize();
    bok.crossVectors(przod, camera.up).normalize();
    const d = ruch.set(0, 0, 0);
    if (w.KeyW || w.ArrowUp) d.add(przod);
    if (w.KeyS || w.ArrowDown) d.sub(przod);
    if (w.KeyD || w.ArrowRight) d.add(bok);
    if (w.KeyA || w.ArrowLeft) d.sub(bok);
    return d.normalize();
  }

  /* Jedno rozstrzygnięcie kolizji na klatkę: capsuleIntersect oddaje jeden
     wypadkowy wektor wyjścia, więc narożnik (podłoga i ściana) rozwiązuje się
     poprawnie. Próg `normal.y > 0` celowo luźny — na szwie trójkątów podłogi
     wypadkowa normalna spada do ~0,83 (pomiar z sierpnia). */
  function kolizja() {
    const w = octree.capsuleIntersect(kapsula);
    naZiemi = false;
    if (!w) return;
    naZiemi = w.normal.y > 0;
    if (!naZiemi) predkosc.addScaledVector(w.normal, -w.normal.dot(predkosc));
    kapsula.translate(w.normal.multiplyScalar(w.depth));
  }

  return {
    controls,
    zablokowany: () => controls.isLocked,
    naZiemi: () => naZiemi,
    pozycja: () => kapsula.end.clone(),
    pozycjaDo: (v) => v.copy(kapsula.end),
    pozycjaX: () => kapsula.end.x,
    pozycjaZ: () => kapsula.end.z,
    predkosc: () => Math.hypot(predkosc.x, predkosc.z),
    /* Czy gość sam coś zrobił PO chwili `od` (znacznik performance.now() z początku
       przejazdu albo postoju wycieczki): klawisz, joystick, przeciągnięcie, mysz w
       blokadzie, palec rozglądający — wtedy nawigacja.js oddaje mu ster. Liczy się tylko
       wejście nowsze niż `od`: okno „ostatnie 150 ms” gubiło kliki, bo ruch ręki tuż przed
       kliknięciem, które przejazd uruchomiło, wyglądał jak sprzeciw wobec niego. Bez `od`
       — wejście z ostatnich 150 ms. */
    aktywneWejscie: (od = performance.now() - 150) => aktywnosc > od,
    naKrok: (f) => sluchaczeKrokow.add(f),

    /* Prędkość zadana z zewnątrz (nawigacja.js) albo null — wtedy znowu klawisze. */
    sterujZ(vx, vz) { zewnetrzna = vx === null || vx === undefined ? null : { x: vx, z: vz }; },

    zablokuj() { renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); },   // odmowa blokady jest zwyczajna — zostaje tryb myszy
    /* Świadomie NIE controls.unlock(): w r169 to gołe exitPointerLock(), którego
       WebKit na iOS nie ma — TypeError w środku otwierania tabliczki. */
    odblokuj() { renderer.domElement.ownerDocument.exitPointerLock?.(); },

    /* Skok w punkt (x, z) planu; `patrzNa` (opcjonalne) obraca kamerę ku punktowi. */
    teleportuj(x, z, patrzNa) {
      kapsula.start.set(x, PROMIEN, z);
      kapsula.end.set(x, WZROST, z);
      predkosc.set(0, 0, 0);
      zewnetrzna = null;
      camera.position.copy(kapsula.end);
      // domyślna kamera patrzy w −Z, amfilada biegnie w +Z — bez obrotu gość stałby tyłem do muzeum
      if (patrzNa) camera.lookAt(patrzNa.x, patrzNa.y ?? WZROST, patrzNa.z);   // Vector3 albo zwykłe { x, z } (na wysokości oczu)
      else camera.rotation.set(0, Math.PI, 0);
    },

    update(dt) {
      dt = Math.min(dt, MAX_KROK);
      const w = wcisniete();
      const d = kierunek(w);
      if (d.lengthSq() > 0) { aktywnosc = performance.now(); zewnetrzna = null; }
      const tempo = PREDKOSC * (w.ShiftLeft || w.ShiftRight ? BIEG : 1);
      if (zewnetrzna) zadana.set(zewnetrzna.x, 0, zewnetrzna.z);
      else zadana.set(d.x * tempo, 0, d.z * tempo);
      const k = 1 - Math.exp(-dt * (zadana.lengthSq() > 0 ? ROZPED : HAMOWANIE));
      predkosc.x += (zadana.x - predkosc.x) * k;
      predkosc.z += (zadana.z - predkosc.z) * k;
      if (naZiemi) predkosc.y = -DOCISK; else predkosc.y -= GRAWITACJA * dt;
      kapsula.translate(krok.copy(predkosc).multiplyScalar(dt));
      kolizja();
      camera.position.copy(kapsula.end);
      // kroki: z przebytej drogi — szybszy chód to częstsze kroki; bujanie wyłączone przy reduced motion
      const v = Math.hypot(predkosc.x, predkosc.z);
      if (naZiemi && v > 0.4) {
        droga += v * dt;
        if (droga >= DLUGOSC_KROKU) { droga -= DLUGOSC_KROKU; for (const f of sluchaczeKrokow) f(); }
        if (!reduceMotion) camera.position.y += Math.sin((droga / DLUGOSC_KROKU) * Math.PI * 2) * AMPLITUDA_KROKU * Math.min(1, v / PREDKOSC);
      }
    },
  };
}
```

- [ ] **Krok 2: Utwórz `js/museum/nawigacja.js`**

```js
/* Przejazdy po muzeum: „kliknij podłogę”, „kliknij pracę”, plan w rogu i
   wycieczka po wyróżnionych. Trasa wiedzie przez kolejne drzwi z plan.js
   (punkt przed i za każdym otworem — przejście prosto przez środek), a ruch
   idzie do gracza jako prędkość (gracz.sterujZ), więc kolizje i grawitacja
   liczą się jak przy chodzeniu. Łagodny start i hamowanie przed celem;
   wzrok podąża za kierunkiem ruchu, a pod koniec drogi do pracy — już ku
   niej. Każde czynne wejście gościa (klawisz, joystick, przeciągnięcie, mysz
   w blokadzie, palec) NOWSZE niż start przejazdu przerywa go i oddaje mu ster;
   drżenie ręki sprzed kliknięcia, które przejazd uruchomiło, się nie liczy. */

import * as THREE from "three";
import { camera, reduceMotion } from "muzeum/render.js";
import { salaPod, trasa, punktWejscia, wyroznione } from "muzeum/plan.js";

const SPACER = 3.2, LOT = 11;          // [m/s] — przejście i szybka podróż z planu
const PRZED_DRZWIAMI = 1.0;            // [m] punkty przed i za otworem
const PROG = 0.4, PROG_KONCA = 0.12;   // [m] dojście do punktu pośredniego i do celu
const PRZYSPIESZENIE = 4.5;            // [m/s²]
const HAMOWANIE = 2.4;                 // [m/s²] — hamowanie przed celem, liczone z pozostałej drogi
const OBROT = 4.5;                     // [1/s] — wzrok za kierunkiem ruchu
const KAT = 56, KAT_LOTU = 63;         // pole widzenia: lekkie poszerzenie przy szybkiej podróży
const POSTOJ_WYCIECZKI = 7;            // [s] przy każdej wyróżnionej pracy
const WZROK = 1.62;                    // wysokość punktu, w który patrzy idący

export function initNawigacja({ plan, gracz, zaslona = null }) {
  let jazda = null;      // { punkty, i, v, tempo, patrzNa, poDojsciu, faza, czas, bezPostepu, ostatniaOdl, start }
  let wycieczka = null;  // { lista, i, czekaj, start, otworz, zamknij } — start: początek postoju (znacznik dla aktywneWejscie)
  const tu = new THREE.Vector3(), cel = new THREE.Vector3(), kierunek = new THREE.Vector3();
  const mac = new THREE.Matrix4(), kwat = new THREE.Quaternion();

  function punktyDo(x, z) {
    gracz.pozycjaDo(tu);
    const a = salaPod(plan, tu.x, tu.z), b = salaPod(plan, x, z);
    const punkty = [];
    if (a && b && a.id !== b.id) {
      let akt = a.id;
      for (const d of trasa(plan, a.id, b.id) ?? []) {
        const dalej = d.a === akt ? d.b : d.a;
        const s = plan.sale.find((q) => q.id === dalej);
        const znak = d.os === "z" ? Math.sign((s.z0 + s.z1) / 2 - d.z) : Math.sign((s.x0 + s.x1) / 2 - d.x);
        const dx = d.os === "x" ? znak : 0, dz = d.os === "z" ? znak : 0;
        punkty.push(new THREE.Vector3(d.x - dx * PRZED_DRZWIAMI, 0, d.z - dz * PRZED_DRZWIAMI));
        punkty.push(new THREE.Vector3(d.x + dx * PRZED_DRZWIAMI, 0, d.z + dz * PRZED_DRZWIAMI));
        akt = dalej;
      }
    }
    punkty.push(new THREE.Vector3(x, 0, z));
    return punkty;
  }

  function reszta(j) {
    let s = 0;
    for (let i = j.i; i < j.punkty.length - 1; i++) s += j.punkty[i].distanceTo(j.punkty[i + 1]);
    return s;
  }

  /* Przy prefers-reduced-motion zamiast przejazdu krótkie przenikanie: zasłona
     zakrywa skok, gość jest od razu na miejscu. Do chwili skoku przejazd trwa —
     aktywna() mówi prawdę także tu (czekają na nią wycieczka i testy). */
  let przenika = false;
  function przenikanie(wPolowie) {
    if (!zaslona) { wPolowie(); return; }
    przenika = true;
    zaslona.classList.add("widoczna");
    setTimeout(() => { wPolowie(); przenika = false; zaslona.classList.remove("widoczna"); }, 220);
  }

  function jedz(x, z, { tempo = SPACER, patrzNa = null, poDojsciu = null } = {}) {
    if (reduceMotion) {
      przenikanie(() => {
        // klik w podłogę (bez patrzNa): zostajemy przodem tam, gdzie gość patrzył — teleportuj() bez celu obracałby go w głąb amfilady
        const wzrok = patrzNa ? null : camera.quaternion.clone();
        gracz.teleportuj(x, z, patrzNa ?? undefined);
        if (wzrok) camera.quaternion.copy(wzrok);
        poDojsciu?.();
      });
      return;
    }
    jazda = {
      punkty: punktyDo(x, z), i: 0, v: gracz.predkosc(), tempo, patrzNa, poDojsciu,
      faza: "ruch", czas: 0, bezPostepu: 0, ostatniaOdl: Infinity,
      start: performance.now(),     // aktywneWejscie(start): liczy się tylko wejście nowsze niż początek przejazdu
    };
  }

  function obrocKu(x, y, z, dt, szybkosc) {
    cel.set(x, y, z);
    mac.lookAt(camera.position, cel, camera.up);
    kwat.setFromRotationMatrix(mac);
    camera.quaternion.slerp(kwat, 1 - Math.exp(-dt * szybkosc));
  }

  function ustawKat(docelowy, dt) {
    if (Math.abs(camera.fov - docelowy) < 0.05) return;
    camera.fov += (docelowy - camera.fov) * (1 - Math.exp(-dt * 3));
    camera.updateProjectionMatrix();
  }

  /* Koniec przejazdu. `udane` — gość dotarł (poDojsciu); inaczej przejazd się urwał
     (utknięcie). Wycieczka nie może na tym stanąć: o następnym przystanku rządzi
     czekaj > 0, a po nieudanym przejeździe nikt go nie ustawia — więc idziemy do
     następnego przystanku (albo kończymy, jeśli to był ostatni). Przerwanie przez gościa
     zeruje wycieczkę wcześniej (przerwij()), więc tu nic dalej nie rusza. */
  function zakoncz(udane) {
    const j = jazda;
    jazda = null;
    gracz.sterujZ(null);
    if (udane) j?.poDojsciu?.();
    else if (wycieczka) nastepnyPrzystanek();
  }

  function przerwij() {
    wycieczka = null;                    // najpierw wycieczka: zakoncz(false) nie ma wtedy dokąd iść dalej
    if (jazda) zakoncz(false);
  }

  function nastepnyPrzystanek() {
    const w = wycieczka;
    w.i++;
    if (w.i >= w.lista.length) { wycieczka = null; return; }
    w.zamknij();
    const hit = w.lista[w.i];
    const { pozycja, cel: patrz } = hit.userData.widok;
    gracz.pozycjaDo(tu);
    const daleko = tu.distanceTo(pozycja) > 25;
    jedz(pozycja.x, pozycja.z, {
      tempo: daleko ? LOT : SPACER, patrzNa: patrz,
      poDojsciu: () => { if (wycieczka !== w) return; w.otworz(hit); w.czekaj = POSTOJ_WYCIECZKI; w.start = performance.now(); },
    });
  }

  function update(dt) {
    if (wycieczka && !jazda && wycieczka.czekaj > 0) {
      if (gracz.aktywneWejscie(wycieczka.start)) { wycieczka = null; return; }
      wycieczka.czekaj -= dt;
      if (wycieczka.czekaj <= 0) nastepnyPrzystanek();
    }
    if (!jazda) { ustawKat(KAT, dt); return; }
    if (gracz.aktywneWejscie(jazda.start)) { przerwij(); return; }
    gracz.pozycjaDo(tu);

    if (jazda.faza === "obrot") {          // na miejscu: wzrok dochodzi do pracy, potem tabliczka
      jazda.czas += dt;
      obrocKu(jazda.patrzNa.x, jazda.patrzNa.y, jazda.patrzNa.z, dt, 5.5);
      if (jazda.czas > 0.7) zakoncz(true);
      return;
    }

    const p = jazda.punkty[jazda.i];
    kierunek.set(p.x - tu.x, 0, p.z - tu.z);
    const odl = kierunek.length();
    const ostatni = jazda.i === jazda.punkty.length - 1;
    if (odl < (ostatni ? PROG_KONCA : PROG)) {
      if (!ostatni) { jazda.i++; jazda.ostatniaOdl = Infinity; return; }
      gracz.sterujZ(0, 0);
      if (jazda.patrzNa) { jazda.faza = "obrot"; jazda.czas = 0; } else zakoncz(true);
      return;
    }
    const doKonca = odl + reszta(jazda);
    const vMax = Math.min(jazda.tempo, Math.sqrt(2 * HAMOWANIE * doKonca) + 0.1);
    jazda.v = Math.min(vMax, jazda.v + PRZYSPIESZENIE * dt);
    kierunek.multiplyScalar(jazda.v / odl);
    gracz.sterujZ(kierunek.x, kierunek.z);

    if (jazda.patrzNa && doKonca < 2.5) obrocKu(jazda.patrzNa.x, jazda.patrzNa.y, jazda.patrzNa.z, dt, OBROT);
    else obrocKu(tu.x + kierunek.x * 10, WZROK, tu.z + kierunek.z * 10, dt, OBROT);
    ustawKat(jazda.tempo > SPACER && jazda.v > 5 ? KAT_LOTU : KAT, dt);

    // utknięcie: kolizja trzyma kapsułę, a odległość nie maleje — po sekundzie koniec
    if (jazda.ostatniaOdl - odl < 0.05 * dt) jazda.bezPostepu += dt; else jazda.bezPostepu = 0;
    jazda.ostatniaOdl = odl;
    if (jazda.bezPostepu > 1) zakoncz(false);
  }

  return {
    update,
    przerwij,
    aktywna: () => !!jazda || !!wycieczka || przenika,
    trwaWycieczka: () => !!wycieczka,
    idzDo(x, z) { wycieczka = null; jedz(x, z); },
    podejdzDo(hit, poDojsciu) {
      wycieczka = null;
      const { pozycja, cel: patrz } = hit.userData.widok;
      gracz.pozycjaDo(tu);
      // praca z drugiego końca muzeum (lista eksponatów): szybka podróż zamiast dwudziestu sekund marszu
      jedz(pozycja.x, pozycja.z, { tempo: tu.distanceTo(pozycja) > 25 ? LOT : SPACER, patrzNa: patrz, poDojsciu });
    },
    lecDoSali(salaId) {
      wycieczka = null;
      const w = punktWejscia(plan, salaId);
      if (w) jedz(w.x, w.z, { tempo: LOT, patrzNa: new THREE.Vector3(w.patrz.x, WZROK, w.patrz.z) });
    },
    /* Wycieczka po wyróżnionych w kolejności dat. `znajdz(idProjektu, salaId)`
       zwraca trafienie (main.js woli rzeźbę od obrazu nad nią), `otworz(hit)`
       pokazuje tabliczkę, `zamknij()` ją chowa przed kolejnym przejazdem. */
    rozpocznijWycieczke({ znajdz, otworz, zamknij }) {
      const lista = wyroznione(plan).map((w) => znajdz(w.projekt.id, w.salaId)).filter(Boolean);
      if (!lista.length) return false;
      wycieczka = { lista, i: -1, czekaj: 0, otworz, zamknij };
      nastepnyPrzystanek();
      return true;
    },
  };
}
```

- [ ] **Krok 3: Zastąp `js/museum/main.js`**

```js
/* Muzeum Budowania — spięcie modułów: plan → budynek → wystrój → prace →
   eksponaty → gracz → światła → nawigacja, pętla klatek i obsługa kliknięć.
   Każdy moduł ma jedną odpowiedzialność; tu tylko kolejność i przewody. */
import * as THREE from "three";
import { renderer, scene, camera, composer, bloom } from "muzeum/render.js";
import { zbudujPlan, salaPod } from "muzeum/plan.js";
import { zbudujBudynek } from "muzeum/sale.js";
import { urzadz } from "muzeum/wystroj.js";
import { powiesPrace } from "muzeum/zawieszenie.js";
import { PODSTAWY, postawEksponaty } from "muzeum/exhibits.js";
import { initPlayer } from "muzeum/player.js";
import { initNawigacja } from "muzeum/nawigacja.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, opisSali } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";
import { initSwiatla } from "muzeum/swiatla.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");
const celownik = document.getElementById("celownik");
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

/* Jedno miejsce na komunikaty muzeum (#hud-perf): strażnik wydajności i
   odmowy przycisków. Pamiętany timer — nowy komunikat nie znika przedwcześnie. */
let chowanieId = null;
function komunikat(tekst) {
  const el = document.getElementById("hud-perf");
  el.textContent = tekst;
  el.hidden = false;
  clearTimeout(chowanieId);
  chowanieId = setTimeout(() => { el.hidden = true; }, 6000);
}
const perfTick = initPerf({ composer, bloom, renderer, komunikat });

let plan = null, budynek = null, gracz = null, prace = null, swiatla = null, nawigacja = null;
const interaktywne = [];     // trafienia raycastera: prace, eksponaty, sale boczne (Zadanie 8)
const tickery = [];          // funkcje (t, dt) wołane co klatkę
let focus = null;            // { hit } — praca z otwartą tabliczką
let bylaSala = null, byloWycieczka = false;

/* KOLEJNOŚĆ: najpierw treść, potem przeglądarka. odblokuj() schodzi do
   exitPointerLock(), którego WebKit na iOS nie ma — tabliczka musi się
   otworzyć, zanim cokolwiek tam rzuci. */
function focusOn(hit) {
  focus = { hit };
  openPlaque(hit);
  try { hit.userData.exhibit?.activate?.(); } catch (err) { console.error("activate error:", err); }
  gracz?.odblokuj();
}

/* Podejście do pracy: przejazd przez drzwi, na miejscu tabliczka. */
function podejdz(hit) {
  endFocus();
  nawigacja.podejdzDo(hit, () => focusOn(hit));
}

bindFocusControl({
  onFocusEnd: () => { focus = null; },
  goToHit: (hit) => podejdz(hit),     // pozycja z listy eksponatów
});

addEventListener("keydown", (e) => { if (e.key === "Escape") { endFocus(); closeList(); } });

/* ── Wskazywanie i klik ───────────────────────────────────────────────────
   Klik w pracę → podejdź do niej. Klik w podłogę → idź tam (znacznik na
   posadzce pokazuje dokąd, zanim się kliknie). Przy blokadzie wskaźnika
   (tryb klawiatury) celuje środek ekranu. */

const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const ZASIEG_PRAC = 14, ZASIEG_PODLOGI = 40;
let hovered = null, punktPodlogi = null, bylHovered = false, downAt = null;
const znacznik = new THREE.Mesh(
  new THREE.RingGeometry(0.2, 0.28, 40),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf2c46d).multiplyScalar(1.4), transparent: true, opacity: 0.85, depthWrite: false })
);
znacznik.rotation.x = -Math.PI / 2;
znacznik.visible = false;
scene.add(znacznik);

/* Czy promień trafia w widoczną bryłę eksponatu: siatki wprost, linie i punkty z
   ciasnym progiem — domyślny próg linii w three.js to 1 m, czyli „trafienie” obok
   rzeźby. Reverie i Anatomy nie mają żadnej siatki, same linie i punkty. */
function trafiaRzezbe(grupa) {
  const czesci = [];
  grupa.traverse((o) => { if (o.isMesh || o.isLine || o.isPoints) czesci.push(o); });
  const { Line, Points } = ray.params;
  const [progLinii, progPunktow] = [Line.threshold, Points.threshold];
  Line.threshold = 0.05; Points.threshold = 0.08;
  const trafia = ray.intersectObjects(czesci, false).length > 0;
  Line.threshold = progLinii; Points.threshold = progPunktow;
  return trafia;
}

function celuj(e) {
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else if (e) pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  else return;
  ray.setFromCamera(pointer, camera);
  ray.far = ZASIEG_PRAC;
  const traf = ray.intersectObjects(interaktywne, false);
  /* Pośredniki eksponatów (niewidoczne kule i walec toru) są większe od samych rzeźb,
     więc promień mierzący w obraz za nimi albo w podłogę obok trafiałby najpierw w nie.
     Pośrednik liczy się tylko, gdy ten sam promień trafia w widoczną bryłę eksponatu
     (trafiaRzezbe). Gdy nic nie przejdzie, wygrywa podłoga; dopiero bez podłogi —
     pierwszy pośrednik z brzegu. */
  const wybrane = traf.find((t) => !t.object.userData.exhibit || trafiaRzezbe(t.object.userData.exhibit.group));
  hovered = wybrane ? wybrane.object : null;
  punktPodlogi = null;
  if (!hovered && budynek) {
    ray.far = ZASIEG_PODLOGI;
    const p = ray.intersectObjects(budynek.podlogi, false)[0];
    if (p) punktPodlogi = p.point;
    else if (traf.length) hovered = traf[0].object;
  }
  znacznik.visible = !!punktPodlogi;
  if (punktPodlogi) znacznik.position.set(punktPodlogi.x, 0.012, punktPodlogi.z);
  const aktywny = !!hovered || !!punktPodlogi;
  if (aktywny !== bylHovered) {
    bylHovered = aktywny;
    renderer.domElement.style.cursor = aktywny ? "pointer" : "default";
  }
  celownik.classList.toggle("celuje", !!hovered);
}

function obsluzKlik(e) {
  celuj(e);
  if (hovered) {
    if (focus && hovered === focus.hit) return;
    podejdz(hovered);
  } else if (punktPodlogi) {
    endFocus();
    nawigacja.idzDo(punktPodlogi.x, punktPodlogi.z);
  } else if (focus) endFocus();
}

renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (dist > 8) return;              // przeciągnięcie (rozglądanie), nie klik
  obsluzKlik(e);
});
renderer.domElement.addEventListener("pointermove", (e) => { if (!downAt) celuj(e); });
renderer.domElement.addEventListener("pointerleave", () => { znacznik.visible = false; });

/* Zmiana sali pod nogami gościa — jedno miejsce, z którego dowiadują się o
   niej wszystkie moduły. aria-live na #hud-era ogłasza każde przypisanie,
   więc tylko przy zmianie. */
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
  swiatla?.wejdz(s);
}

/* ── Pętla ────────────────────────────────────────────────────────────── */

const clock = new THREE.Clock();
let firstFrame = true;
function petla() {
  requestAnimationFrame(petla);
  const dt = Math.min(clock.getDelta(), 0.05);
  const czas = clock.elapsedTime;      // nie `t` — to nazwa tłumacza napisów wyżej
  perfTick(dt);
  if (gracz) {
    nawigacja.update(dt);              // najpierw ster przejazdu, potem ruch z kolizjami
    gracz.update(dt);
    if (gracz.zablokowany()) celuj();
    const s = salaPod(plan, gracz.pozycjaX(), gracz.pozycjaZ());
    if (s && s !== bylaSala) { bylaSala = s; naZmianeSali(s); }
    const w = nawigacja.trwaWycieczka();
    if (w !== byloWycieczka) {
      byloWycieczka = w;
      btnTura.textContent = w ? t("muz.przerwij", "Przerwij zwiedzanie") : t("muz.tura", "Oprowadź mnie");
    }
  }
  for (const fn of tickery) {
    try { fn(czas, dt); } catch (err) { console.error("tick error:", err); }
  }
  swiatla?.aktualizuj(dt);
  composer.render();
  if (firstFrame) { firstFrame = false; loader.classList.add("done"); window.__mzOtwarte?.(); }
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

/* ── Budowa ───────────────────────────────────────────────────────────── */

/* Trafienie dla wycieczki: przy pracy z rzeźbą wolimy rzeźbę (jej widok
   obejmuje i rzeźbę, i obraz nad nią). */
function znajdzTrafienie(idProjektu) {
  const kandydaci = interaktywne.filter((h) => h.userData.project?.id === idProjektu);
  return kandydaci.find((h) => h.userData.exhibit) ?? kandydaci[0] ?? null;
}

function zbudujMuzeum() {
  plan = zbudujPlan({ ERAS, PROJECTS, autorskie: new Map(Object.entries(PODSTAWY)) });
  budynek = zbudujBudynek(plan);
  urzadz(plan, budynek);
  prace = powiesPrace(plan, budynek);
  interaktywne.push(...prace.interaktywne);
  for (const o of prace.obrazy) o.wczytaj();   // wszystkie od razu; salami — Zadanie 10
  const eksponaty = postawEksponaty(plan, budynek);   // przed graczem: dokłada kolizje podestów
  interaktywne.push(...eksponaty.interaktywne);
  tickery.push(...eksponaty.tickery);
  scene.add(budynek.grupa);
  tickery.push(...budynek.tickery);

  gracz = initPlayer(budynek.kolizje);         // po wszystkich kolizjach — Octree buduje się raz
  gracz.teleportuj(plan.start.x, plan.start.z);
  swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy });
  nawigacja = initNawigacja({ plan, gracz, zaslona: document.getElementById("zaslona") });

  // podpowiedź gaśnie przy pierwszym czynnym ruchu; celownik żyje tylko w trybie klawiatury
  gracz.controls.addEventListener("lock", dismissHint);
  addEventListener("touchstart", dismissHint, { once: true, passive: true });
  renderer.domElement.addEventListener("pointerup", dismissHint, { once: true });
  gracz.controls.addEventListener("lock", () => { celownik.hidden = false; });
  gracz.controls.addEventListener("unlock", () => { celownik.hidden = true; celownik.classList.remove("celuje"); });

  /* Uchwyt tylko się rozszerza: `interactives` (nazwa z czasów korytarza) to ta sama
     tablica co `interaktywne`, a go(z) z jednym argumentem, jak dawniej, stawia
     gracza na osi amfilady (x = 0). */
  Object.assign(window.__mz, {
    plan, budynek, gracz, prace, swiatla, nawigacja, interaktywne, interactives: interaktywne,
    go: (x, z) => (z === undefined ? gracz.teleportuj(0, x) : gracz.teleportuj(x, z)),
  });

  // „Oprowadź mnie” = wycieczka po wyróżnionych; w trakcie ten sam przycisk ją przerywa
  btnTura.addEventListener("click", () => {
    if (nawigacja.trwaWycieczka()) { nawigacja.przerwij(); endFocus(); return; }
    closeList();
    const ruszyla = nawigacja.rozpocznijWycieczke({
      znajdz: znajdzTrafienie,
      otworz: (hit) => focusOn(hit),
      zamknij: () => endFocus(),
    });
    if (!ruszyla) komunikat(t("muz.brakWycieczki", "Nie ma wyróżnionych prac do pokazania."));
  });

  buildList(interaktywne);
}

/* Bez tekstu w drugim argumencie document.fonts.load() ściąga tylko kroje
   podstawowej łaciny, a polskie litery (ą ć ę ł ń ś ź ż) leżą w osobnym
   latin-ext — na płótnach szyldów wpadałyby w pismo zastępcze. Próbka ma
   litery z obu zakresów. */
const PROBKA_PL = "Aa ĄąĆćĘęŁłŃńÓóŚśŹźŻż";

Promise.all([
  document.fonts.load("700 46px Syne", PROBKA_PL),
  document.fonts.load("400 24px 'IBM Plex Mono'", PROBKA_PL),
  document.fonts.load("500 24px 'IBM Plex Mono'", PROBKA_PL),   // podpisy szyldów i tabliczek — bez tej linii 500 doszłoby tylko przypadkiem, z HUD-u
  document.fonts.load("600 30px 'Schibsted Grotesk'", PROBKA_PL),
  document.fonts.load("600 92px 'Cormorant Garamond'", PROBKA_PL),
]).catch((err) => console.warn("muzeum: krój pisma nie doszedł —", err)).finally(() => {
  try { zbudujMuzeum(); } catch (err) { console.error("build error:", err); }
  petla();
});
```

- [ ] **Krok 4: `museum.html` — podpowiedzi, zasłona, moduł**

1. Zastąp cały akapit `<p class="hud-hint" id="hud-hint">…</p>` tym (i dopisz za nim zasłonę):

```html
<p class="hud-hint" id="hud-hint">
  <span class="hint-mysz" data-i18n-html="muz.podpowiedzMysz"><b>Kliknij podłogę</b>, żeby tam pójść · przeciągnij, żeby się rozejrzeć · kliknij pracę, żeby podejść · <b>WASD</b> też działa</span>
  <span class="hint-dotyk" data-i18n="muz.podpowiedz">Dotknij podłogi, żeby tam pójść · przeciągnij, żeby się rozejrzeć · dotknij pracy, żeby podejść</span>
</p>

<!-- Zasłona przenikania: przy prefers-reduced-motion przejazd zastępuje krótkie
     zaciemnienie (nawigacja.js), a w Zadaniu 8 przejście do Kosmosu. -->
<div id="zaslona" aria-hidden="true"></div>
```

2. W import mapie po `muzeum/swiatla.js` dopisz `"muzeum/nawigacja.js": "./js/museum/nawigacja.js?v=STEMPEL",` i podbij stempel.

- [ ] **Krok 5: `css/museum.css` — zasłona**

Na końcu pliku:

```css
/* Zasłona przenikania (nawigacja.js, sale-boczne.js): czarna, nad sceną, pod HUD-em. */
#zaslona {
  position: fixed; inset: 0; z-index: 25; background: #000;
  opacity: 0; pointer-events: none; transition: opacity 0.2s ease;
}
#zaslona.widoczna { opacity: 1; }
```

- [ ] **Krok 6: Weryfikacja**

W `browser_evaluate` po wczytaniu (6 s):

```js
async () => {
  const m = window.__mz;
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  const wynik = {};
  m.nawigacja.idzDo(3, 8);                                    // z atrium do punktu w sali I
  await czekaj(6000);
  wynik.idzDo = [m.gracz.pozycjaX(), m.gracz.pozycjaZ(), m.nawigacja.aktywna()];
  const h = m.interaktywne.find((q) => q.userData.salaId === "e5b" && !q.userData.exhibit);
  let otwarta = false;
  m.nawigacja.podejdzDo(h, () => { otwarta = true; });       // przez sześć drzwi
  const t0 = performance.now();
  while (!otwarta && performance.now() - t0 < 40000) await czekaj(250);
  const w = h.userData.widok.pozycja;
  wynik.podejdz = { ms: performance.now() - t0, otwarta, odl: Math.hypot(m.gracz.pozycjaX() - w.x, m.gracz.pozycjaZ() - w.z) };
  m.nawigacja.lecDoSali("leon");
  while (m.nawigacja.aktywna()) await czekaj(200);
  wynik.leon = m.swiatla.sala().id;
  document.getElementById("btn-tura").click();
  while (document.getElementById("plaque").hidden) await czekaj(200);
  wynik.wycieczka = document.getElementById("plaque-title").textContent;
  m.testRuch = { KeyW: true }; await czekaj(400); m.testRuch = null;
  wynik.przerwana = !m.nawigacja.trwaWycieczka() && document.getElementById("btn-tura").textContent;
  wynik.bledy = window.__errs;
  return wynik;
}
```

Oczekiwane (zmierzone na próbie): `idzDo` ≈ `[3, 8, false]` (± 0,15 m); `podejdz.otwarta === true`, `odl` < 0,3; `leon === "leon"`; `wycieczka === "Agent AI Bajarz"` (najstarsza wyróżniona, VII 2025); `przerwana === "Oprowadź mnie"`; `bledy: []`.

Trafienia eksponatów (wybór jak w `celuj`, promienie z ekranu przez siatkę punktów): z punktu widoku Reverie i Anatomy promienie wymierzone w ich linie i punkty wybierają rzeźbę (na próbie 145 i 154 ze 169 promieni siatki ±0,18 × ±0,24 NDC; reszta przechodzi w szczeliny na podłogę), a obraz na ścianie za podestem nie jest „kradziony” przez kulę pośrednika. W Pokoju Leona z progu klik w podłogę poza torem (r > 3,2 m od środka) prowadzi tam (na próbie 50 z 76 punktów; pozostałe promienie naprawdę przechodzą przez pociąg), a klik w sam pociąg otwiera jego tabliczkę.

Ręcznie w przeglądarce (desktop): klik w podłogę z przejazdem przez drzwi; przeciągnięcie obraca widok bez ruszania; W wchodzi w blokadę wskaźnika, Esc ją zdejmuje; znacznik na posadzce idzie za kursorem. Telefon 390 × 844 (`browser_resize`): dotknięcie podłogi prowadzi, przeciągnięcie po prawej rozgląda, joystick po lewej chodzi.

- [ ] **Krok 7: Commit**

```bash
git add js/museum/player.js js/museum/nawigacja.js js/museum/main.js museum.html css/museum.css
git commit -m "$(cat <<'EOF'
Muzeum: podróżowanie — kliknij podłogę, podejdź do pracy, wycieczka

Przejazdy przez kolejne drzwi z łagodnym startem i hamowaniem, wzrok za
kierunkiem ruchu, szybka podróż do odległych celów. Bezwładność chodu,
rozglądanie przeciąganiem, WASD wchodzi w blokadę wskaźnika. „Oprowadź
mnie” to wycieczka po wyróżnionych. Przenikanie przy reduced motion.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 7: Plan w rogu

Schemat budynku z tego samego planu: sale w kolorach stref, drzwi jako przerwy, portal Kosmosu jako bursztynowa kropka, gość jako strzałka z kierunkiem patrzenia, bieżąca sala z obwódką. Klik albo Enter na sali to szybka podróż. Na telefonie plan zwinięty do przycisku „Plan” pod nagłówkiem.

**Pliki:**
- Utwórz: `js/museum/minimapa.js`
- Modyfikuj: `js/museum/main.js`, `museum.html`, `css/museum.css`

**Interfejsy:**
- Konsumuje: `Plan` (Zadanie 1), `nawigacja.lecDoSali` (Zadanie 6).
- Produkuje: `initMinimapa({ plan, naSale(salaId) }) → { sala(salaId), aktualizuj(x, z, fx, fz) }`; `window.__mz.minimapa`; w DOM `nav#minimapa` z elementami `g.mm-sala[data-id]`.

- [ ] **Krok 1: Utwórz `js/museum/minimapa.js`**

```js
/* Plan w rogu: schemat budynku z tego samego planu (plan.js), strefy w
   kolorach, gość jako strzałka z kierunkiem patrzenia. Dotknięcie sali →
   szybka podróż (nawigacja.js). SVG zamiast płótna: ostre na każdym ekranie,
   a sale są prawdziwymi elementami z aria-label — da się do nich dojść
   klawiaturą (Tab, Enter).

   Oś amfilady (+Z świata) biegnie w planie w prawo, a +X świata (lewa ręka
   idącego w głąb) — w górę: tak wygląda budynek z góry, gdy gość patrzy
   przed siebie. Stąd x_svg = z, y_svg = −x. */

const KOLOR = { palac: "#b8955a", biel: "#e8e6e0", noc: "#3a4b70", kino: "#6b3a3f", zabawy: "#f1c9a8" };
const NS = "http://www.w3.org/2000/svg";
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

function nazwa(s) {
  if (s.rodzaj === "epoka") return `${s.nr}${s.czesc ? ` (${s.czesc}/${s.czesci})` : ""} · ${s.nazwa}`;
  return t(`muz.sala.${s.id}`, s.nazwa);
}

export function initMinimapa({ plan, naSale }) {
  const host = document.getElementById("minimapa");
  const svg = host.querySelector("svg");
  const przelacznik = host.querySelector(".mm-przelacz");
  const el = (tag, atr = {}, rodzic = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in atr) e.setAttribute(k, atr[k]);
    rodzic.appendChild(e);
    return e;
  };

  const xs = plan.sale.flatMap((s) => [s.x0, s.x1]), zs = plan.sale.flatMap((s) => [s.z0, s.z1]);
  const zap = 1.5;
  const minZ = Math.min(...zs) - zap, maxZ = Math.max(...zs) + zap + 2;
  const minY = -Math.max(...xs) - zap, maxY = -Math.min(...xs) + zap;
  svg.setAttribute("viewBox", `${minZ} ${minY} ${maxZ - minZ} ${maxY - minY}`);

  const prostokaty = new Map();
  for (const s of plan.sale) {
    const g = el("g", { class: "mm-sala", tabindex: "0", role: "button", "aria-label": nazwa(s), "data-id": s.id });
    el("title", {}, g).textContent = nazwa(s);
    prostokaty.set(s.id, el("rect", { x: s.z0 + 0.25, y: -s.x1 + 0.25, width: s.z1 - s.z0 - 0.5, height: s.x1 - s.x0 - 0.5, rx: 0.6, fill: KOLOR[s.styl] }, g));
    const jedz = () => naSale(s.id);
    g.addEventListener("click", jedz);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jedz(); } });
  }
  // drzwi: krótkie kreski w poprzek ściany; portal Kosmosu jako bursztynowa kropka
  for (const d of plan.drzwi) {
    if (d.portal) { el("circle", { cx: d.z + 1.2, cy: -d.x, r: 0.9, class: "mm-kosmos" }); continue; }
    if (d.os === "z") el("line", { x1: d.z, y1: -d.x - d.szer / 2, x2: d.z, y2: -d.x + d.szer / 2, class: "mm-drzwi" });
    else el("line", { x1: d.z - d.szer / 2, y1: -d.x, x2: d.z + d.szer / 2, y2: -d.x, class: "mm-drzwi" });
  }
  const ja = el("g", { class: "mm-ja" });
  el("path", { d: "M2.2,0 L-1.4,1.5 L-0.7,0 L-1.4,-1.5 Z" }, ja);

  przelacznik?.addEventListener("click", () => {
    const otwarta = host.classList.toggle("otwarta");
    przelacznik.setAttribute("aria-expanded", String(otwarta));
  });

  let biezaca = null, ostatnio = "";
  return {
    sala(id) {
      if (biezaca) prostokaty.get(biezaca)?.classList.remove("biezaca");
      biezaca = id;
      prostokaty.get(id)?.classList.add("biezaca");
    },
    /* Pozycja (x, z) i kierunek patrzenia (fx, fz) w świecie. Zapis do DOM tylko
       przy widocznej zmianie — pętla woła to co klatkę. */
    aktualizuj(x, z, fx, fz) {
      const kat = (Math.atan2(-fx, fz) * 180) / Math.PI;
      const tr = `translate(${z.toFixed(2)} ${(-x).toFixed(2)}) rotate(${kat.toFixed(1)})`;
      if (tr !== ostatnio) { ja.setAttribute("transform", tr); ostatnio = tr; }
    },
  };
}
```

- [ ] **Krok 2: `main.js`**

1. Pod importem `initSwiatla` dopisz `import { initMinimapa } from "muzeum/minimapa.js";`, a w deklaracji zmiennych modułu dopisz `minimapa = null`.
2. W `naZmianeSali` dopisz na końcu `minimapa?.sala(s.id);`.
3. Pod `const clock = new THREE.Clock();` dopisz `const wzrok = new THREE.Vector3();`, a w `petla()` zaraz po `if (gracz.zablokowany()) celuj();`:

```js
    camera.getWorldDirection(wzrok);
    minimapa?.aktualizuj(gracz.pozycjaX(), gracz.pozycjaZ(), wzrok.x, wzrok.z);
```

4. W `zbudujMuzeum()` po utworzeniu `nawigacja`:

```js
  minimapa = initMinimapa({ plan, naSale: (id) => { endFocus(); closeList(); nawigacja.lecDoSali(id); } });
```

i dopisz `minimapa` do `Object.assign(window.__mz, { … })`.

- [ ] **Krok 3: `museum.html`**

1. Zaraz za `<div id="zaslona" …></div>` dopisz:

```html
<!-- Plan w rogu (minimapa.js): sale jako przyciski — klik albo Enter to szybka
     podróż. Na telefonie zwinięty do przycisku „Plan”. -->
<nav class="minimapa" id="minimapa" aria-label="Plan muzeum" data-i18n-attr="aria-label:muz.planMuzeum">
  <button class="hud-list mm-przelacz" type="button" aria-expanded="false" data-i18n="muz.plan">Plan</button>
  <svg xmlns="http://www.w3.org/2000/svg" role="group"></svg>
</nav>
```

2. W import mapie po `muzeum/nawigacja.js` dopisz `"muzeum/minimapa.js": "./js/museum/minimapa.js?v=STEMPEL",` i podbij stempel — **także przy `css/museum.css`** (bez nowego stempla przeglądarka trzyma stary arkusz i plan ląduje bez stylu na górze strony; tak było na próbie).

- [ ] **Krok 4: `css/museum.css`**

Na końcu pliku:

```css
/* Plan w rogu (minimapa.js). Nad podpowiedzią, żeby się nie nakładały. Sale
   przygaszone, bieżąca w pełnym kolorze z bursztynową obwódką; gość to
   bursztynowa strzałka. Na telefonie zwinięty do przycisku. */
.minimapa {
  position: fixed; left: 1rem; bottom: 3rem; z-index: 30;
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.4rem;
}
.minimapa svg {
  display: block; width: min(320px, 40vw); height: auto;
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  border: 1px solid var(--line); border-radius: 10px; padding: 6px;
}
.mm-sala { cursor: pointer; }
.mm-sala rect { opacity: 0.5; transition: opacity 0.15s ease; }
.mm-sala:hover rect { opacity: 0.9; }
/* Na elemencie SVG przeglądarka rysuje własny pierścień ogniska także po kliku
   i dotknięciu, nie tylko po klawiszu — a on zakrywa obwódkę sali, do której
   gość właśnie poleciał. Dlatego wyłączony przy każdym :focus. Ognisko
   klawiatury to przerywana jasna obwódka: inna niż najechanie i widoczna też
   na sali bieżącej, więc stoi po regule .biezaca. */
.mm-sala:focus { outline: none; }
.mm-sala rect.biezaca { opacity: 1; stroke: var(--pulse); stroke-width: 0.6; }
.mm-sala:focus-visible rect { opacity: 1; stroke: var(--ink); stroke-width: 0.6; stroke-dasharray: 2 1; }
.mm-drzwi { stroke: var(--bg); stroke-width: 1.1; }
.mm-kosmos { fill: var(--pulse); }
.mm-ja path { fill: var(--pulse); stroke: #14100a; stroke-width: 0.3; }
/* Strzałka, kreski drzwi i kropka portalu leżą nad salami: bez tego łapią klik
   i dotyk w miejscu sali (gość pośrodku sali zasłaniał jej środek). */
.mm-ja, .mm-drzwi, .mm-kosmos { pointer-events: none; }
.mm-przelacz { display: none; }
@media (max-width: 640px), (pointer: coarse) {
  .minimapa { bottom: auto; top: 4.2rem; }
  .mm-przelacz { display: inline-flex; }
  .minimapa svg { display: none; width: calc(100vw - 2rem); }
  .minimapa.otwarta svg { display: block; }
}
```

- [ ] **Krok 5: Weryfikacja**

```js
async () => {
  const m = window.__mz;
  const sale = document.querySelectorAll(".mm-sala").length;
  const svg = document.querySelector("#minimapa svg").getBoundingClientRect();
  document.querySelector('.mm-sala[data-id="e6b"]').dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 300));
  while (m.nawigacja.aktywna()) await new Promise((r) => setTimeout(r, 200));
  return { sale, svg: [svg.left, svg.bottom, svg.width], sala: m.swiatla.sala().id,
    biezaca: document.querySelector(".mm-sala rect.biezaca")?.parentNode.dataset.id, bledy: window.__errs };
}
```

Oczekiwane: `sale: 12`; plan w lewym dolnym rogu (`left` 16, szerokość 320 przy 1200 px); `sala` i `biezaca` = `"e6b"`. Klawiatura: Tab dochodzi do sal planu, Enter rusza podróż. Telefon 390 × 844: widać tylko przycisk „Plan” pod nagłówkiem, po kliknięciu plan na całą szerokość, brak przewijania w bok. Zrzut z planem w rogu.

- [ ] **Krok 6: Commit**

```bash
git add js/museum/minimapa.js js/museum/main.js museum.html css/museum.css
git commit -m "$(cat <<'EOF'
Muzeum: plan w rogu — strefy w kolorach, gość jako strzałka

Schemat z tego samego planu budynku (SVG): sale jako przyciski z
aria-label (klik albo Enter = szybka podróż), drzwi, portal Kosmosu,
bieżąca sala z obwódką. Na telefonie zwinięty do przycisku „Plan”.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 8: Sale boczne — Kino, Archiwum, drzwi do Kosmosu

Kino gra showreel na dużym ekranie (z dźwiękiem, jeśli gość wszedł z dźwiękiem — Zadanie 9) i dwa ujęcia z GB10 na mniejszych; wideo wczytuje się dopiero przy wejściu do sali, a do tego czasu (i gdy wideo nie ruszy) widać plakat. Na plakacie dużego ekranu stoi bursztynowy znak ▶, dopóki wideo nie gra — także gdy przeglądarka odrzuci autoodtwarzanie (spec §9: „plakat i przycisk Odtwórz”). Klik w ekran spoza Kina podprowadza gościa na oś ekranu przed pierwszą ławkę i włącza film; klik w samym Kinie przełącza odtwarzanie na miejscu (ławki zagradzają prostą drogę zza swoich pleców). Archiwum to szafa z szufladą na każdy wpis `ARCHIVE` — kliknięcie wysuwa szufladę i otwiera tabliczkę z wpisem. Przy portalu na końcu amfilady pojawia się przycisk przejścia do Kosmosu.

**Pliki:**
- Utwórz: `js/museum/sale-boczne.js`
- Modyfikuj: `js/museum/ui.js`, `js/museum/main.js`, `js/museum/minimapa.js`, `museum.html`, `css/museum.css`

**Interfejsy:**
- Konsumuje: `Plan` (sale `kino`, `archiwum`, `plan.kosmos`), `Budynek`, `bryla`, `gladki`, `dodajKolizje`, `zarejestruj` (Zadanie 2), `nawigacja.podejdzDo` (Zadanie 6), globalne `ARCHIVE`, `#zaslona`.
- Produkuje:
  - `urzadzSaleBoczne({ plan, budynek, archiwum, otworzWpis }) → { interaktywne, tickery, wejscie(salaId), ustawDzwiek(wl), portal }` — `portal` to trafienie portalu Kosmosu (`userData.zDaleka`: liczy się z każdej odległości, o ile nie zasłania go mur).
  - `minimapa.js`: `initMinimapa({ plan, naSale, naKosmos })` — cel „Kosmos” w marginesie za ostatnią salą.
  - Trafienia bez `project`, z `userData.akcja({ zSali })`, `userData.widok` i opcjonalnie `wMiejscu`, `odblokuj` — `main.js` (`dzialaj`) podprowadza przed obiekt i woła akcję z salą, z której gość kliknął; przy `wMiejscu` gość, który już jest w sali trafienia, nie idzie nigdzie; przy `odblokuj` po akcji zwalnia blokadę wskaźnika (szuflady, portal — nie ekran Kina).
  - `ui.js`: `otworzWpisArchiwum(wpis)`.
  - kotwica światła ekranu Kina (`rect`).

- [ ] **Krok 1: Utwórz `js/museum/sale-boczne.js`**

```js
/* Sale boczne: Kino (showreel na dużym ekranie, dwa ujęcia z GB10 obok),
   Archiwum (szafa z szufladą na każdy wpis ARCHIVE) i drzwi do Kosmosu na
   końcu amfilady. Pokój Leona nie potrzebuje tu niczego — prace i kolejkę
   stawiają zawieszenie.js i exhibits.js jak w każdej sali.

   Trafienia stąd nie mają `project` — mają `akcja({ zSali })`: main.js
   (dzialaj) podprowadza gościa przed obiekt (punkt `widok`) i dopiero wtedy
   ją woła. `zSali` to sala, w której gość stał w chwili kliknięcia: ekran
   Kina przełącza odtwarzanie gościowi, który już jest w środku, a temu, kto
   przyszedł z zewnątrz, je włącza (samo wejście już je uruchomiło). Bez
   argumentu akcja Kina działa jak „z zewnątrz”.
   `wMiejscu: true` — gość będący w sali trafienia nie idzie nigdzie, akcja
   rusza od razu (ławki Kina zagradzają prostą drogę zza ich pleców).
   `odblokuj: true` — po akcji main.js zwalnia blokadę wskaźnika, żeby
   tabliczkę i przycisk dało się kliknąć; ekran Kina tego nie ma, bo mysz ma
   tam dalej rozglądać.
   `zDaleka: true` — trafienie liczy się poza zasięgiem prac (portal widać z
   całej amfilady), ale tylko niezasłonięte murem: main.js celuj() sprawdza
   to promieniem po warstwie kolizji budynku. */

import * as THREE from "three";
import { POLMUR } from "muzeum/plan.js";
import { camera, fmtDate, reduceMotion } from "muzeum/render.js";
import { bryla, gladki, dodajKolizje, zarejestruj, PRZEDSWIETLENIE } from "muzeum/sale.js";
import { plotno } from "muzeum/textures.js";

// Showreel ma CORS * (sprawdzone 7 X), więc może być teksturą także z localhost.
const SHOWREEL = "https://agentsmill.github.io/ai-video-portfolio/assets/media/showreel.mp4";
const PLAKAT = "https://agentsmill.github.io/ai-video-portfolio/assets/media/showreel-poster.jpg";
const UJECIA = [["assets/wideo/mglawica.mp4", "assets/wideo/mglawica.webp"], ["assets/wideo/orbita.mp4", "assets/wideo/orbita.webp"]];
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);
const ladowarka = new THREE.TextureLoader();
/* Podpis i małe ekrany Kina stoją tyle od lica ściany: listwy z wystroj.js (kino()) wystają na 6 cm,
   a co siedzi głębiej, widać tylko między nimi (ekran w pasach, podpis z brakującymi literami). */
const PRZED_LISTWAMI = 0.08;

/* Znak „odtwórz” na plakacie dużego ekranu: widoczny, dopóki wideo nie gra —
   także gdy przeglądarka odrzuci autoodtwarzanie. Mówi gościowi, że ekran
   jest do kliknięcia (klik podprowadza i przełącza odtwarzanie). */
function znakOdtwarzania() {
  const tex = plotno(256, 256, (c) => {
    c.fillStyle = "rgba(10, 12, 16, 0.55)"; c.beginPath(); c.arc(128, 128, 116, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(242, 196, 109, 0.9)"; c.lineWidth = 8; c.stroke();
    c.fillStyle = "#f2c46d"; c.beginPath(); c.moveTo(102, 80); c.lineTo(102, 176); c.lineTo(182, 128); c.closePath(); c.fill();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.z = 0.02;          // tuż przed ekranem (dziecko jego siatki)
  return m;
}

/* Ekran z wideo wczytywanym dopiero przy pierwszym wejściu do Kina: do tego
   czasu plakat. Wideo z własnym dźwiękiem tylko na dużym ekranie, i tylko gdy
   gość wszedł z dźwiękiem (ustawDzwiek). */
function ekranWideo(src, plakat, szer, wys, { glosny = false } = {}) {
  const mat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  ladowarka.load(plakat, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    if (!(mat.map && mat.map.isVideoTexture)) { mat.map = tex; mat.color.setHex(0xffffff); mat.needsUpdate = true; }
  }, undefined, () => console.warn(`sale-boczne.js: brak plakatu „${plakat}" — ekran zostaje ciemnoszary`));
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(szer, wys), mat);
  const znak = glosny ? znakOdtwarzania() : null;
  if (znak) mesh.add(znak);
  let video = null, dzwiek = false, chce = false;   // chce: wideo ma grać (graj() ustawia, pauza() zdejmuje)
  const sterowanie = {
    mesh,
    graj() {
      chce = true;
      if (!video) {
        video = document.createElement("video");
        Object.assign(video, { crossOrigin: "anonymous", src, loop: true, muted: true, playsInline: true, preload: "auto" });
        const tex = new THREE.VideoTexture(video);
        tex.colorSpace = THREE.SRGBColorSpace;
        // plakat zostaje, dopóki wideo naprawdę nie gra — wolna sieć albo brak kodeka nie robi z ekranu czarnej plamy
        video.addEventListener("playing", () => { mat.map = tex; mat.color.setHex(0xffffff); mat.needsUpdate = true; }, { once: true });
        if (znak) {
          video.addEventListener("playing", () => { znak.visible = false; });
          video.addEventListener("pause", () => { znak.visible = true; });
        }
      }
      video.muted = !(glosny && dzwiek);
      // autoodtwarzanie z dźwiękiem bywa odrzucone — wtedy gra bez dźwięku, zamiast wcale; druga odmowa
      // zostawia plakat ze znakiem ▶ i gość klika ekran sam. Ponawiamy tylko po NotAllowedError i tylko
      // gdy wideo wciąż ma grać: pause() odrzuca oczekujące play() jako AbortError, a ponowienie
      // wskrzesiłoby wideo po wyjściu gościa z sali (zimne ładowanie trwa dłużej niż wejście i wyjście)
      video.play()?.catch?.((err) => {
        if (!chce || err?.name !== "NotAllowedError") return;
        video.muted = true; video.play()?.catch?.(() => {});
      });
    },
    pauza() { chce = false; video?.pause(); },
    przelacz() { if (!video || video.paused) sterowanie.graj(); else sterowanie.pauza(); },
    ustawDzwiek(wl) { dzwiek = wl; if (video) video.muted = !(glosny && wl); },
  };
  return sterowanie;
}

function kino(s, budynek, wynik) {
  const cz = (s.z0 + s.z1) / 2, xEkranu = s.x1 - POLMUR - 0.05;   // ekran przed ramą, rama przy ścianie
  const duzy = ekranWideo(SHOWREEL, PLAKAT, 6.4, 3.6, { glosny: true });
  duzy.mesh.position.set(xEkranu, 2.35, cz);
  duzy.mesh.rotation.y = -Math.PI / 2;
  const rama = bryla(0.04, 3.8, 6.6, gladki(0x050505, 0.6));
  rama.position.set(s.x1 - POLMUR - 0.02, 2.35, cz);
  budynek.grupa.add(rama, duzy.mesh);
  // światło bijące z ekranu na salę — kotwica dla puli (swiatla.js)
  budynek.kotwice.push({ salaId: s.id, typ: "rect", pozycja: new THREE.Vector3(xEkranu - 0.1, 2.35, cz), cel: new THREE.Vector3(s.x0, 1.2, cz), szer: 6.4, wys: 3.6, kolor: 0xc8d2ff, moc: 1.8 });
  const male = UJECIA.map(([src, plakat], i) => {
    const e = ekranWideo(src, plakat, 2.4, 1.35);
    const naMinus = i === 0;
    e.mesh.position.set(s.x0 + 6.2, 2.1, naMinus ? s.z0 + POLMUR + PRZED_LISTWAMI : s.z1 - POLMUR - PRZED_LISTWAMI);
    e.mesh.rotation.y = naMinus ? 0 : Math.PI;
    budynek.grupa.add(e.mesh);
    return e;
  });
  // podpis przy wejściu
  const podpis = plotno(900, 260, (c) => {
    c.fillStyle = "#e9edf5"; c.font = "700 64px Syne"; c.fillText(t("wideo.showreel", "Showreel"), 0, 80);
    c.fillStyle = "#8c95a8"; c.font = "500 34px 'IBM Plex Mono'";
    c.fillText(t("wideo.showreelOpis", "Przegląd produkcji — ujęcia generowane, nie kręcone."), 0, 160, 890);
  });
  const tab = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.52), new THREE.MeshBasicMaterial({ map: podpis, transparent: true, color: 0x9aa0aa }));
  tab.position.set(s.x0 + 2.4, 2.0, s.z0 + POLMUR + PRZED_LISTWAMI);
  budynek.grupa.add(tab);

  const traf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.8, 6.6), new THREE.MeshBasicMaterial({ visible: false }));
  traf.position.set(xEkranu - 0.15, 2.35, cz);
  traf.userData = {
    salaId: s.id, wMiejscu: true,
    // z wnętrza sali przełącza; kto przyszedł z zewnątrz, ma wideo włączone (wejście już je uruchomiło, play jest idempotentne)
    akcja: ({ zSali } = {}) => (zSali === s.id ? duzy.przelacz() : duzy.graj()),
    // na osi ekranu, przed pierwszą ławką (x 11,12–11,68): prosta droga z drzwi jest wolna, a widok wycelowany w środek ekranu
    widok: { pozycja: new THREE.Vector3(s.x0 + 2.2, 1.65, cz), cel: new THREE.Vector3(xEkranu, 2.35, cz) },
  };
  budynek.grupa.add(traf);
  wynik.interaktywne.push(traf);
  return {
    wejdz() { duzy.graj(); male.forEach((e) => e.graj()); },
    wyjdz() { duzy.pauza(); male.forEach((e) => e.pauza()); },
    ustawDzwiek(wl) { duzy.ustawDzwiek(wl); },
  };
}

/* Szafa archiwum: szuflada na każdy wpis, z mosiężną gałką i kartą tytułową.
   Kliknięcie wysuwa szufladę i otwiera tabliczkę z wpisem; poprzednio
   wysunięta wraca. */
function archiwum(s, budynek, wynik, wpisy, otworzWpis) {
  const cz = (s.z0 + s.z1) / 2, lico = s.x0 + POLMUR;
  const wiersze = 4, kolumny = Math.max(1, Math.ceil(wpisy.length / wiersze));
  const szer = Math.min(7.6, s.z1 - s.z0 - 1.4), wys = 2.4, gl = 0.55;
  const cw = szer / kolumny, rh = wys / wiersze;
  const drewno = gladki(0x4a2f1c, 0.55), czolo = gladki(0x5a3a22, 0.5), mosiadz = gladki(0xb08a4a, 0.3, 1);
  for (const m of [drewno, czolo, mosiadz]) zarejestruj(budynek, s.id, m, PRZEDSWIETLENIE.palac);
  const korpus = bryla(gl, wys + 0.16, szer + 0.16, drewno);
  korpus.position.set(lico + gl / 2, (wys + 0.16) / 2 + 0.1, cz);
  korpus.castShadow = true;
  budynek.grupa.add(korpus);
  dodajKolizje(budynek, korpus, true);
  let wysunieta = null;
  const szuflady = [];
  wpisy.forEach((wpis, i) => {
    const k = Math.floor(i / wiersze), w = wiersze - 1 - (i % wiersze);
    const g = new THREE.Group();
    const z = cz - szer / 2 + cw * (k + 0.5), y = 0.18 + rh * (w + 0.5);
    g.position.set(lico + gl + 0.005, y, z);
    g.rotation.y = Math.PI / 2;                 // przód szuflady (lokalne +Z) w stronę sali (+X)
    const front = bryla(cw - 0.04, rh - 0.04, 0.04, czolo); front.position.z = 0.02; g.add(front);
    const karta = plotno(256, 128, (c) => {
      c.fillStyle = "#efe7d6"; c.fillRect(0, 0, 256, 128);
      c.fillStyle = "#2b241c"; c.font = "600 22px 'Schibsted Grotesk'";
      const slowa = wpis.title.split(" "); let l = "", n = 0;
      for (const sl of slowa) { const p = l ? `${l} ${sl}` : sl; if (c.measureText(p).width > 230 && l) { c.fillText(l, 12, 34 + n * 26); n++; l = sl; if (n > 1) break; } else l = p; }
      if (n < 2 && l) c.fillText(l, 12, 34 + n * 26);
      c.fillStyle = "#76695a"; c.font = "500 18px 'IBM Plex Mono'"; c.fillText(fmtDate(wpis.date), 12, 112);
    });
    // papier przygaszony (albedo ok. 0,5): pełna biel w świetle stropu przekraczała próg poświaty i środkowe karty były nieczytelne
    const kartaM = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(0.62, cw - 0.2), 0.16), new THREE.MeshStandardMaterial({ map: karta, color: 0xbdbdbd, roughness: 0.9 }));
    kartaM.position.set(0, rh * 0.12, 0.042);
    g.add(kartaM);
    const galka = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), mosiadz);
    galka.position.set(0, -rh * 0.22, 0.06);
    g.add(galka);
    budynek.grupa.add(g);
    const sz = { g, baza: g.position.x, cel: g.position.x };
    szuflady.push(sz);
    const traf = new THREE.Mesh(new THREE.BoxGeometry(0.2, rh, cw), new THREE.MeshBasicMaterial({ visible: false }));
    traf.position.set(lico + gl + 0.1, y, z);
    traf.userData = {
      salaId: s.id, odblokuj: true,
      akcja: () => {
        if (wysunieta && wysunieta !== sz) wysunieta.cel = wysunieta.baza;
        sz.cel = sz.baza + 0.28;
        wysunieta = sz;
        otworzWpis(wpis);
      },
      widok: { pozycja: new THREE.Vector3(lico + 2.6, 1.65, z), cel: new THREE.Vector3(lico + gl, y, z) },
    };
    budynek.grupa.add(traf);
    wynik.interaktywne.push(traf);
  });
  wynik.tickery.push((_, dt) => {
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 10);   // ograniczony ruch: szuflada od razu u celu
    for (const sz of szuflady) sz.g.position.x += (sz.cel - sz.g.position.x) * k;
  });
}

/* Portal Kosmosu: gdy gość podejdzie (albo kliknie gwiazdy), pojawia się
   przycisk przejścia; po kliknięciu zasłona i kosmos.html w tym samym języku.
   Portal to drogowskaz na końcu amfilady, więc klika się go z każdej odległości
   (`zDaleka`, patrz main.js celuj()) — ale nie przez ściany. Zwraca trafienie:
   plan w rogu też prowadzi do portalu (main.js naKosmos). */
function kosmos(plan, budynek, wynik) {
  const { x, z } = plan.kosmos;
  const przycisk = document.getElementById("kosmos-wejscie");
  const zaslona = document.getElementById("zaslona");
  przycisk?.addEventListener("click", () => {
    zaslona?.classList.add("widoczna");
    setTimeout(() => location.assign(`kosmos.html${window.__jezyk === "en" ? "?lang=en" : ""}`), 380);
  });
  // „Wstecz” z kosmos.html może przywrócić muzeum z pamięci podręcznej stron (bfcache) razem z podniesioną zasłoną
  addEventListener("pageshow", (e) => { if (e.persisted) zaslona?.classList.remove("widoczna"); });
  let pokazany = false;
  const pokaz = (tak) => { if (przycisk && tak !== pokazany) { pokazany = tak; przycisk.hidden = !tak; } };
  const traf = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
  traf.position.set(x, 2, z + 0.4);
  traf.userData = {
    salaId: plan.kosmos.salaId, akcja: () => pokaz(true), odblokuj: true, zDaleka: true,
    widok: { pozycja: new THREE.Vector3(x, 1.65, z - 2.4), cel: new THREE.Vector3(x, 1.9, z + 1.8) },
  };
  budynek.grupa.add(traf);
  wynik.interaktywne.push(traf);
  wynik.tickery.push(() => pokaz(Math.abs(camera.position.x - x) < 2.2 && camera.position.z > z - 3.5));
  return traf;
}

export function urzadzSaleBoczne({ plan, budynek, archiwum: wpisy = [], otworzWpis = () => {} }) {
  const wynik = { interaktywne: [], tickery: [] };
  let sterKina = null;
  for (const s of plan.sale) {
    if (s.rodzaj === "kino") sterKina = kino(s, budynek, wynik);
    if (s.rodzaj === "archiwum") archiwum(s, budynek, wynik, wpisy, otworzWpis);
  }
  const portal = kosmos(plan, budynek, wynik);
  let wKinie = false;
  return {
    ...wynik,
    portal,                      // trafienie portalu Kosmosu — cel planu w rogu (main.js naKosmos)
    /* Wołane przy każdej zmianie sali: Kino gra tylko, gdy gość w nim jest. */
    wejscie(salaId) {
      const teraz = salaId === "kino";
      if (teraz === wKinie) return;
      wKinie = teraz;
      if (teraz) sterKina?.wejdz(); else sterKina?.wyjdz();
    },
    ustawDzwiek(wl) { sterKina?.ustawDzwiek(wl); },
  };
}
```

- [ ] **Krok 2: `ui.js` — wpis archiwum w tabliczce, lista odporna na trafienia bez projektu**

1. Przed komentarzem `// Port do wstrzyknięcia sterowania kamerą` dopisz:

```js
/* Wpis archiwum (szuflada w sali Archiwum, sale-boczne.js) w tej samej
   tabliczce co projekty: data, tytuł, notka i odnośnik, jeśli istnieje. */
function otworzWpisArchiwum(wpis) {
  const t = window.__t || ((klucz, pl) => pl);
  plaque.style.setProperty("--cat", "var(--pulse-dim)");
  document.getElementById("plaque-date").textContent = `${fmtDate(wpis.date)} · ${t("muz.sala.archiwum", "Archiwum")}`;
  document.getElementById("plaque-title").textContent = wpis.title;
  document.getElementById("plaque-desc").textContent = wpis.note;
  document.getElementById("plaque-tech").textContent = "";
  const link = document.getElementById("plaque-links");
  link.textContent = "";
  if (wpis.url) {
    const a = document.createElement("a");
    a.href = wpis.url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = `${t("muz.zobacz", "Zobacz")} ↗`;
    link.appendChild(a);
  }
  plaque.hidden = false;
}
```

2. W `buildList` filtr `.filter((h) => h.userData.project.era === era.id)` → `.filter((h) => h.userData.project?.era === era.id)` (ekran Kina i szuflady nie mają projektu).
3. Do eksportu dopisz `otworzWpisArchiwum`.

- [ ] **Krok 3: `main.js`**

1. Import z `ui.js` uzupełnij o `otworzWpisArchiwum`; pod importem `initMinimapa` dopisz `import { urzadzSaleBoczne } from "muzeum/sale-boczne.js";`; w deklaracji zmiennych modułu dopisz `boczne = null`.
2. Pod funkcją `podejdz(hit)` dopisz:

```js
/* Trafienia z własną akcją (ekran Kina, szuflada Archiwum, portal Kosmosu — sale-boczne.js): podejście do
   punktu `widok`, na miejscu akcja({ zSali }), gdzie zSali to sala, w której gość stał w chwili kliknięcia.
   `wMiejscu`: gość, który już jest w sali trafienia, nie idzie nigdzie (ławki Kina zagradzają prostą drogę
   zza swoich pleców). `odblokuj`: po akcji zwolnij blokadę wskaźnika, żeby tabliczkę i przycisk dało się
   kliknąć (ekran Kina tego nie chce — mysz ma tam dalej rozglądać). */
function dzialaj(hit) {
  endFocus();
  const { akcja, wMiejscu, odblokuj, salaId } = hit.userData;
  const zSali = bylaSala?.id;
  // najpierw treść, potem odblokuj() — jak w focusOn (iOS nie ma exitPointerLock)
  const wykonaj = () => { akcja({ zSali }); if (odblokuj) gracz?.odblokuj(); };
  if (wMiejscu && zSali === salaId) wykonaj();
  else nawigacja.podejdzDo(hit, wykonaj);
}
```

   a w `obsluzKlik` w gałęzi `if (hovered) {`, zaraz po linii z `focus && hovered === focus.hit`, dopisz:

```js
    // ekran Kina, szuflada Archiwum, portal Kosmosu: ich własna akcja — po podejściu albo na miejscu (dzialaj)
    if (hovered.userData.akcja) { dzialaj(hovered); return; }
```

3. W `naZmianeSali` dopisz na końcu `boczne?.wejscie(s.id);`.
4. W `zbudujMuzeum()` po `tickery.push(...eksponaty.tickery);`:

```js
  boczne = urzadzSaleBoczne({ plan, budynek, archiwum: ARCHIVE, otworzWpis: otworzWpisArchiwum });   // też przed graczem: kolizja szafy
  interaktywne.push(...boczne.interaktywne);
  zDaleka.push(...interaktywne.filter((h) => h.userData.zDaleka));
  tickery.push(...boczne.tickery);
```

i dopisz `boczne` do `Object.assign(window.__mz, { … })`.

5. **Portal Kosmosu klikalny z daleka.** Portal to drogowskaz na końcu amfilady — z atrium widać go 140 m dalej, a zasięg prac (`ZASIEG_PRAC = 14`) wycinał go z kliknięć: z progu ostatniej sali (17 m) i z atrium klik nie robił nic. Pod `const interaktywne = [];` dopisz:

```js
const zDaleka = [];          // z nich te, które liczą się poza zasięgiem prac (portal Kosmosu) — o ile nic ich nie zasłania
```

nad `function celuj(e) {` wstaw:

```js
/* Czy między okiem a trafieniem stoi mur, nadproże albo bok niszy? Sprawdza warstwę kolizji
   budynku (tę samą, z której gracz buduje Octree). Promień kończy się 5 cm przed trafieniem,
   żeby nie łapał brył tuż za nim; zasięg wraca do poprzedniej wartości, bo wołający liczy
   dalej na swoim. */
function zaslonieta(trafienie) {
  const zasieg = ray.far;
  ray.far = trafienie.distance - 0.05;
  const jest = ray.intersectObject(budynek.kolizje, true).length > 0;
  ray.far = zasieg;
  return jest;
}
```

a w `celuj` wybór trafienia — od ostatniego zdania komentarza o pośrednikach do końca bloku `if (!hovered && budynek) { … }` — zastąp:

```js
     pierwszy pośrednik z brzegu. Trafienie „z daleka” (portal) nigdy nie liczy się przez ścianę. */
  const wybrane = traf.find((t) => {
    const u = t.object.userData;
    if (u.exhibit) return trafiaRzezbe(u.exhibit.group);
    return !u.zDaleka || !zaslonieta(t);
  });
  hovered = wybrane ? wybrane.object : null;
  punktPodlogi = null;
  if (!hovered && budynek) {
    ray.far = ZASIEG_PODLOGI;
    const p = ray.intersectObjects(budynek.podlogi, false)[0];
    /* Portal Kosmosu to drogowskaz na końcu amfilady — widać go z atrium, 140 m dalej, więc
       zasięg prac go nie dotyczy. Liczy się, gdy nic bliższego nie wygrało, ale tylko jeśli
       żaden mur, nadproże ani bok niszy go nie zasłania (zaslonieta), a bliższy z dwóch
       wygrywa: portal albo punkt podłogi w zasięgu. Zasięg ustawiany przed każdym rzutem. */
    ray.far = Infinity;
    const daleki = ray.intersectObjects(zDaleka, false)[0];
    if (daleki && (!p || daleki.distance < p.distance) && !zaslonieta(daleki)) hovered = daleki.object;
    else if (p) punktPodlogi = p.point;
    else {
      const bliski = traf.find((t) => !t.object.userData.zDaleka);    // zasłonięty portal odpada także tutaj
      if (bliski) hovered = bliski.object;
    }
  }
```

6. Wywołanie `initMinimapa` w `zbudujMuzeum()` zastąp:

```js
  minimapa = initMinimapa({
    plan,
    naSale: (id) => { endFocus(); closeList(); nawigacja.lecDoSali(id); },
    naKosmos: () => { endFocus(); closeList(); dzialaj(boczne.portal); },    // cel za ostatnią salą: do portalu, na miejscu przycisk
  });
```

- [ ] **Krok 3a: `minimapa.js` — cel „Kosmos” za ostatnią salą**

Bursztynowa kropka portalu ma kilka pikseli i nie łapie kliknięć (Zadanie 7: leży nad salami). Klikalny jest przezroczysty prostokąt w marginesie planu za ostatnią salą, element z `aria-label` jak sale.

1. Na końcu pierwszego akapitu komentarza nagłówka (`… klawiaturą (Tab, Enter).`) dopisz: `Tak samo cel „Kosmos” za ostatnią salą: klik, Enter albo Spacja prowadzą do portalu (naKosmos).`
2. `export function initMinimapa({ plan, naSale }) {` → `export function initMinimapa({ plan, naSale, naKosmos = () => {} }) {`.
3. W pętli po drzwiach linię `if (d.portal) { el("circle", { cx: d.z + 1.2, cy: -d.x, r: 0.9, class: "mm-kosmos" }); continue; }` zastąp:

```js
    if (d.portal) {
      el("circle", { cx: d.z + 1.2, cy: -d.x, r: 0.9, class: "mm-kosmos" });
      /* Cel „Kosmos”: przezroczysty prostokąt w marginesie za ostatnią salą, od portalu do prawej krawędzi
         planu, na pełną szerokość tej sali. Kropka sama ma kilka pikseli i nie łapie kliknięć, a cel jest
         elementem z aria-label — jak sale. Leży nad kropką, pod strzałką gościa. */
      const ostatnia = plan.sale.find((q) => q.id === d.a);
      const napis = t("muz.kosmos.szyld", "Kosmos →");
      const cel = el("rect", {
        x: d.z, y: -ostatnia.x1, width: maxZ - d.z, height: ostatnia.x1 - ostatnia.x0,
        class: "mm-kosmos-cel", tabindex: "0", role: "button", "aria-label": napis,
      });
      el("title", {}, cel).textContent = napis;
      cel.addEventListener("click", () => naKosmos());
      cel.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); naKosmos(); } });
      continue;
    }
```

- [ ] **Krok 4: `museum.html`**

1. Przed `<nav class="minimapa" …>` dopisz:

```html
<!-- Przejście do Kosmosu — pokazuje się przy portalu na końcu amfilady (sale-boczne.js). -->
<button class="kosmos-wejscie" id="kosmos-wejscie" type="button" hidden data-i18n="muz.kosmos">Wejdź do Kosmosu →</button>
```

2. W import mapie po `muzeum/minimapa.js` dopisz `"muzeum/sale-boczne.js": "./js/museum/sale-boczne.js?v=STEMPEL",` i podbij stempel (także przy CSS).

- [ ] **Krok 5: `css/museum.css`**

```css
/* Przycisk przejścia do Kosmosu przy portalu na końcu amfilady. `left: 50%` + translateX to ta sama
   pułapka, co przy .hud-hint wyżej: szerokość „shrink-to-fit” kończy się na połowie okna, więc na telefonie
   etykieta łamałaby się na dwa wiersze. Stąd `nowrap`, a max-width trzyma przycisk w oknie z marginesem 1 rem. */
.kosmos-wejscie {
  position: fixed; left: 50%; bottom: 4.5rem; transform: translateX(-50%); z-index: 35;
  white-space: nowrap; max-width: calc(100vw - 2rem); overflow: hidden; text-overflow: ellipsis;
  font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: #14100a; background: var(--pulse); border: none; border-radius: 99px;
  padding: 0.8rem 1.4rem; cursor: pointer; box-shadow: 0 0 40px rgba(242, 196, 109, 0.35);
}
.kosmos-wejscie[hidden] { display: none; }
/* Plan stoi w lewym dolnym rogu wszędzie poza telefonem i dotykiem (reguła przy .minimapa). W oknach do
   ok. 880 px sięgałby pod wyśrodkowany przycisk, a do 960 px zostawałoby między nimi mniej niż 40 px —
   przycisk przechodzi wtedy do prawego rogu. */
@media (min-width: 641px) and (max-width: 960px) and (pointer: fine) {
  .kosmos-wejscie { left: auto; right: 1rem; transform: none; }
}
```

i pod regułą `.mm-ja, .mm-drzwi, .mm-kosmos { pointer-events: none; }` (Zadanie 7) dopisz:

```css
/* Cel „Kosmos” (minimapa.js): przezroczysty prostokąt w marginesie za ostatnią salą — sama kropka portalu
   nie łapie kliknięć. Ognisko jak przy salach: po kliku bez obwódki przeglądarki, z klawiatury przerywana obwódka. */
.mm-kosmos-cel { fill: transparent; pointer-events: all; cursor: pointer; }
.mm-kosmos-cel:focus { outline: none; }
.mm-kosmos-cel:focus-visible { stroke: var(--ink); stroke-width: 0.6; stroke-dasharray: 2 1; }
```

- [ ] **Krok 6: Weryfikacja**

1. Kanoniczna sonda: `interaktywne: 94` (64 + ekran Kina + 28 szuflad + portal).
2. Kino: `m.gracz.teleportuj(9.4, -8, { x: 18, y: 2.3, z: -8 })` (przodem do ekranu); po 3 s ekran ma `material.map.isVideoTexture === true` (albo plakat, gdy przeglądarka nie odtwarza mp4 — nigdy czarna plama), a znak ▶ (płaszczyzna 0,8 m, dziecko siatki ekranu) jest niewidoczny. `userData.akcja({ zSali: "kino" })` trafienia Kina pauzuje — znak wraca; drugie takie wywołanie znów odtwarza; `akcja({ zSali: "atrium" })` (gość przyszedł z zewnątrz) zawsze odtwarza. Autoodtwarzanie odrzucone: przed wejściem podmień `HTMLMediaElement.prototype.play` na funkcję zwracającą `Promise.reject(new DOMException("blokada", "NotAllowedError"))` — po wejściu plakat i znak ▶ zostają (na próbie: `przedWejsciem: true, odrzucone: true, poKliknieciu: false, poPauzie: true`). Prawdziwy klik w ekran z atrium (6, −8): przejazd kończy się w ≈ (10,2; −8) na osi ekranu, film gra. Klik z wnętrza Kina — także zza ławek, np. (15, −10) — przełącza na miejscu, bez przejazdu. Małe ekrany i podpis stoją w całości przed listwami ścian (zrzut). Wyjście z Kina pauzuje wideo — także wyjście ok. 20 ms po wejściu przy zimnym wczytywaniu, zanim pierwsze `play()` się rozstrzygnie (po 5 s wszystkie trzy filmy mają `paused: true`).
3. Archiwum:

```js
async () => {
  const m = window.__mz;
  const sz = m.interaktywne.filter((h) => h.userData.salaId === "archiwum");
  let gotowe = false;
  m.nawigacja.podejdzDo(sz[5], () => { sz[5].userData.akcja(); gotowe = true; });
  while (!gotowe) await new Promise((r) => setTimeout(r, 200));
  return { szuflad: sz.length, tytul: document.getElementById("plaque-title").textContent, bledy: window.__errs };
}
```

Oczekiwane: `szuflad === ARCHIVE.length` (28), tytuł = `ARCHIVE[5].title` („Latarnik AI”), szuflada wysunięta na zrzucie.

4. Kosmos: `m.gracz.teleportuj(0, m.plan.kosmos.z - 2.5, { x: 0, y: 2, z: m.plan.kosmos.z + 5 })` → `#kosmos-wejscie` widoczny; `m.gracz.teleportuj(0, m.plan.kosmos.z - 7.5)` — ukryty. Kliknięcie przycisku: zasłona i `kosmos.html` (z `?lang=en` w wersji angielskiej). Powrót z bfcache: po dodaniu `.widoczna` do `#zaslona` zdarzenie `new PageTransitionEvent("pageshow", { persisted: true })` zdejmuje zasłonę. Przycisk w jednym wierszu i bez nachodzenia na plan przy 390×844, 800×600, 900×700 i 1440×900. Klik w szufladę i w portal woła `gracz.odblokuj()` (szpieg na metodzie), klik w ekran Kina — nie. Przy `prefers-reduced-motion` szuflada stoi u celu w następnej klatce.
   Portal z daleka (prawdziwe kliki): z progu ostatniej sali (0, 120) — przejście do ≈ (0, 134,7) i przycisk; ze startu (0, −6,5) w świecący prostokąt na końcu widoku — szybka podróż (11 m/s), na miejscu przycisk, klik → `kosmos.html`. Z boku sali, gdy na linii portalu stoi mur, kursor zostaje zwykły, a klik nic nie robi. Cel „Kosmos” w planie w rogu: klik, Tab + Enter, Spacja i dotyk prowadzą do portalu; klik w prawy koniec ostatniej sali nadal leci do tej sali. Koszt `celuj()` przy ruchu myszy po widoku na wylot: mediana kilka µs.
5. Zrzuty: Kino z obrazem na ekranie, Archiwum z wysuniętą szufladą i tabliczką, portal z przyciskiem.

- [ ] **Krok 7: Commit**

```bash
git add js/museum/sale-boczne.js js/museum/ui.js js/museum/main.js js/museum/minimapa.js museum.html css/museum.css
git commit -m "$(cat <<'EOF'
Muzeum: Kino ze showreelem, Archiwum z szufladami, drzwi do Kosmosu

Kino: wideo wczytywane dopiero przy wejściu, plakat do czasu, aż wideo
naprawdę gra, a na nim znak ▶, gdy wideo stoi (też przy odrzuconym
autoodtwarzaniu); światło ekranu jako kotwica puli. Archiwum: szuflada na
każdy wpis ARCHIVE, wysuwana z tabliczką wpisu. Portal na końcu osi z
przyciskiem przejścia i zasłoną.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 9: Dźwięk na życzenie — ekran wejścia, kroki, pogłos sal, serce atrium

Gdy muzeum jest gotowe (pierwsza klatka), ekran ładowania staje się ekranem wejścia: tytuł i dwa przyciski na przyciemnionej amfiladzie. „Wejdź z dźwiękiem” to gest użytkownika, w którym przeglądarka pozwala uruchomić dźwięk; „Wejdź w ciszy” nie tworzy kontekstu audio wcale. Dźwięk jest w całości syntezowany (zero plików): kroki brzmią inaczej na parkiecie, betonie, kamieniu i wykładzinie, pogłos rośnie z kubaturą sali, każda strefa ma cichy ton tła (noc — niski dron), a w atrium bije serce w rytmie mosiężnego kardiogramu w posadzce. Przycisk w HUD włącza i wycisza dźwięk w każdej chwili; showreel w Kinie gra z dźwiękiem tylko wtedy, gdy dźwięk jest włączony.

**Pliki:**
- Utwórz: `js/museum/dzwiek.js`
- Modyfikuj: `js/museum/main.js`, `js/museum/player.js`, `museum.html`, `css/museum.css`

**Interfejsy:**
- Konsumuje: `OKRES_SERCA` z `wystroj.js` (Zadanie 2 — ten sam okres co `bicieSerca()`), pola sali `styl`, `rodzaj`, `x0`, `x1`, `z0`, `z1`, `H` (Zadanie 1), `gracz.naKrok(f)` (Zadanie 6; po kroku 2a powyżej prędkości marszu rzadziej niż co 0,75 m), `naZmianeSali(s)` w `main.js` (Zadanie 6), `boczne.ustawDzwiek(wl)` (Zadanie 8), `nawigacja.lecDoSali(salaId)` (Zadanie 6 — szybka podróż, 11 m/s; tylko w weryfikacji).
- Produkuje:
  - `initDzwiek() → null | { ctx, ustawSale(sala), krok(), tick(), wycisz(tak), wyciszony() }` — `null`, gdy przeglądarka nie ma Web Audio.
  - DOM: `#wejscie` z `#wejdz-dzwiek` i `#wejdz-cisza` w `#loader`; `#btn-dzwiek[aria-pressed]` w HUD. `#loader` dostaje klasę `gotowy` (ekran wejścia) na pierwszej klatce, a `done` dopiero po wyborze.
  - `window.__mz.dzwiek()` — funkcja, bo kontekst powstaje dopiero przy kliknięciu.

- [ ] **Krok 1: Utwórz `js/museum/dzwiek.js`**

```js
/* Dźwięk muzeum — w całości syntezowany, zero plików. Rdzeń (kroki przez filtr
   pasmowy, pogłos z syntetycznej odpowiedzi impulsowej) przeniesiony z gałęzi
   `groza` (js/groza/dzwiek.js). Doszły: pogłos zależny od sali (dwa konwolwery
   z przenikaniem przy zmianie sali), ton sali w każdej strefie i uderzenie
   serca w atrium — w rytmie świecenia kardiogramu w posadzce (wystroj.js).
   Wszystko cicho i bez nagłych dźwięków: muzeum, nie gra. */

import { OKRES_SERCA } from "muzeum/wystroj.js";

// krok: filtr szumu wg posadzki (parkiet dzwoni wyżej, beton głucho, kamień nisko, wykładzina prawie wcale)
const KROK = {
  palac: { typ: "bandpass", f: 520, q: 1.4, g: 0.2 },
  zabawy: { typ: "bandpass", f: 560, q: 1.3, g: 0.17 },
  biel: { typ: "bandpass", f: 330, q: 1.1, g: 0.2 },
  noc: { typ: "bandpass", f: 240, q: 1.6, g: 0.22 },
  kino: { typ: "lowpass", f: 260, q: 0.7, g: 0.07 },
};
const MOKRO = { palac: 0.32, biel: 0.38, noc: 0.3, kino: 0.06, zabawy: 0.14 };   // udział pogłosu
// ton sali: filtr i głośność zapętlonego szumu; w nocy dochodzi niski dron
const TON = {
  palac: { typ: "lowpass", f: 380, g: 0.045 }, biel: { typ: "bandpass", f: 2400, g: 0.016 },
  noc: { typ: "lowpass", f: 170, g: 0.055 }, kino: { typ: "lowpass", f: 120, g: 0.025 },
  zabawy: { typ: "lowpass", f: 650, g: 0.022 },
};
const SERCE = [0.05, 0.3];   // fazy „lub” i „dub” w okresie — te same co w bicieSerca()

export function initDzwiek() {
  const Kontekst = window.AudioContext || window.webkitAudioContext;
  if (!Kontekst) return null;
  const ctx = new Kontekst();
  const glowny = ctx.createGain();
  glowny.gain.value = 0.9;
  glowny.connect(ctx.destination);
  const sucha = ctx.createGain();     // magistrala kroków i serca: idzie wprost i przez pogłos
  sucha.connect(glowny);

  /* Pogłos: dwa konwolwery. Zmiana sali liczy nową odpowiedź impulsową do
     nieaktywnego i przenika — podmiana bufora w grającym konwolwerze trzaska. */
  const poglosy = [0, 1].map(() => {
    const c = ctx.createConvolver(), g = ctx.createGain();
    g.gain.value = 0;
    sucha.connect(c); c.connect(g); g.connect(glowny);
    return { c, g };
  });
  let aktywny = 0;
  function odpowiedz(sekundy, zanik) {
    const n = Math.floor(ctx.sampleRate * sekundy);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let k = 0; k < 2; k++) {
      const d = b.getChannelData(k);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, zanik);
    }
    return b;
  }

  // ton sali: zapętlony szum brązowy przez filtr strefy
  const szum = ctx.createBufferSource();
  szum.buffer = (() => {
    const n = ctx.sampleRate * 3, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let o = 0;
    for (let i = 0; i < n; i++) { o = (o + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = o * 3.5; }
    return b;
  })();
  szum.loop = true;
  const filtrTonu = ctx.createBiquadFilter();
  const glosTonu = ctx.createGain();
  glosTonu.gain.value = 0;
  szum.connect(filtrTonu); filtrTonu.connect(glosTonu); glosTonu.connect(glowny);
  szum.start();
  const dron = ctx.createGain();
  dron.gain.value = 0;
  dron.connect(glowny);
  for (const f of [55, 82.4]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = f; g.gain.value = 0.5;
    o.connect(g); g.connect(dron); o.start();
  }

  let styl = "palac", serce = false, nastepneSerce = 0, wyciszony = false;

  function ustawSale(s) {
    styl = s.styl;
    serce = s.rodzaj === "atrium";
    const t = ctx.currentTime;
    const objetosc = (s.x1 - s.x0) * (s.z1 - s.z0) * s.H;   // gabinet ~350 m³ → krótki ogon, atrium ~2500 m³ → długi
    const nowy = 1 - aktywny;
    poglosy[nowy].c.buffer = odpowiedz(Math.min(3.2, Math.max(0.6, 0.6 + objetosc / 900)), 3.2);
    poglosy[nowy].g.gain.setTargetAtTime(MOKRO[s.styl] ?? 0.25, t, 0.25);
    poglosy[aktywny].g.gain.setTargetAtTime(0, t, 0.25);
    aktywny = nowy;
    const ton = TON[s.styl] ?? TON.palac;
    filtrTonu.type = ton.typ;
    filtrTonu.frequency.setTargetAtTime(ton.f, t, 0.6);
    glosTonu.gain.setTargetAtTime(ton.g, t, 0.8);
    dron.gain.setTargetAtTime(s.styl === "noc" ? 0.012 : 0, t, 1.2);
  }

  function krok() {
    const k = KROK[styl] ?? KROK.palac;
    const n = Math.floor(ctx.sampleRate * 0.09);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6);
    const zrodlo = ctx.createBufferSource();
    zrodlo.buffer = b;
    const f = ctx.createBiquadFilter();
    f.type = k.typ; f.frequency.value = k.f * (0.92 + Math.random() * 0.16); f.Q.value = k.q;   // każdy krok trochę inny
    const g = ctx.createGain();
    g.gain.value = k.g * (0.85 + Math.random() * 0.3);
    zrodlo.connect(f); f.connect(g); g.connect(sucha);
    zrodlo.start();
  }

  function uderzenie(kiedy, sila) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(62, kiedy);
    o.frequency.exponentialRampToValueAtTime(42, kiedy + 0.16);
    g.gain.setValueAtTime(0.0001, kiedy);
    g.gain.exponentialRampToValueAtTime(sila, kiedy + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, kiedy + 0.22);
    o.connect(g); g.connect(sucha);
    o.start(kiedy); o.stop(kiedy + 0.25);
  }

  /* Serce planowane z wyprzedzeniem ~0,3 s wg zegara performance.now() —
     tego samego, z którego świeci mosiądz w posadzce, więc biją razem. */
  function tick() {
    if (!serce || wyciszony) return;
    const teraz = performance.now() / 1000;
    if (nastepneSerce < teraz - OKRES_SERCA) nastepneSerce = Math.floor(teraz / OKRES_SERCA) * OKRES_SERCA;
    while (nastepneSerce < teraz + 0.3) {
      SERCE.forEach((faza, i) => {
        const kiedy = nastepneSerce + faza;
        if (kiedy > teraz) uderzenie(ctx.currentTime + (kiedy - teraz), i === 0 ? 0.12 : 0.08);
      });
      nastepneSerce += OKRES_SERCA;
    }
  }

  // karta w tle: kontekst śpi (oszczędza baterię i nie gra nikomu)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) ctx.suspend(); else if (!wyciszony) ctx.resume();
  });

  return {
    ctx, ustawSale, krok, tick,
    wycisz(tak) {
      wyciszony = tak;
      glowny.gain.setTargetAtTime(tak ? 0 : 0.9, ctx.currentTime, 0.08);
      if (!tak) ctx.resume();
    },
    wyciszony: () => wyciszony,
  };
}
```

- [ ] **Krok 2: `main.js`**

1. Pod importem `urzadzSaleBoczne` dopisz `import { initDzwiek } from "muzeum/dzwiek.js";`, a w deklaracji zmiennych modułu (`let plan = null, …, boczne = null`) dopisz `dzwiek = null`.
2. W `naZmianeSali` dopisz na końcu `dzwiek?.ustawSale(s);`.
3. Zaraz pod funkcją `naZmianeSali` wstaw:

```js
/* ── Wejście i dźwięk ─────────────────────────────────────────────────────
   Ekran ładowania staje się ekranem wejścia, gdy muzeum jest gotowe (pierwsza
   klatka): za półprzezroczystym tłem widać już amfiladę. Kliknięcie przycisku
   to gest użytkownika — tylko w nim przeglądarka pozwala uruchomić dźwięk. */
const btnDzwiek = document.getElementById("btn-dzwiek");
/* Napis w <span class="hud-tekst"> (na telefonie schowany — zostaje ikona
   głośnika) i ten sam w aria-label, więc czytnik ekranu zawsze zna stan. */
function napiszDzwiek(napis) {
  btnDzwiek.querySelector(".hud-tekst").textContent = napis;
  btnDzwiek.setAttribute("aria-label", napis);
}
function pokazStanDzwieku() {
  const gra = !!dzwiek && !dzwiek.wyciszony();
  btnDzwiek.setAttribute("aria-pressed", String(gra));
  napiszDzwiek(gra ? t("muz.dzwiekWl", "Dźwięk: wł.") : t("muz.dzwiekWyl", "Dźwięk: wył."));
}
function wlaczDzwiek(tak) {
  if (tak && !dzwiek) {
    dzwiek = initDzwiek();
    if (!dzwiek) { napiszDzwiek(t("muz.dzwiekBrak", "Dźwięk niedostępny")); btnDzwiek.disabled = true; return; }
    dzwiek.ctx.resume();
    if (bylaSala) dzwiek.ustawSale(bylaSala);
  } else dzwiek?.wycisz(!tak);
  boczne?.ustawDzwiek(tak);
  pokazStanDzwieku();
}
function wejdz(zDzwiekiem) {
  if (zDzwiekiem) wlaczDzwiek(true); else pokazStanDzwieku();
  loader.classList.add("done");
}
document.getElementById("wejdz-dzwiek").addEventListener("click", () => wejdz(true));
document.getElementById("wejdz-cisza").addEventListener("click", () => wejdz(false));
btnDzwiek.addEventListener("click", () => wlaczDzwiek(!dzwiek || dzwiek.wyciszony()));
```

4. W `petla()` pod `swiatla?.aktualizuj(dt);` dopisz `dzwiek?.tick();`.
5. Linię `if (firstFrame) { firstFrame = false; loader.classList.add("done"); window.__mzOtwarte?.(); }` zastąp:

```js
  if (firstFrame) {
    firstFrame = false;
    loader.classList.add("gotowy");             // ekran ładowania → ekran wejścia (patrz wejdz())
    document.getElementById("wejdz-dzwiek").focus({ preventScroll: true });
    window.__mzOtwarte?.();
  }
```

6. W `zbudujMuzeum()` pod `gracz.teleportuj(plan.start.x, plan.start.z);` dopisz `gracz.naKrok(() => dzwiek?.krok());`.
7. W `Object.assign(window.__mz, { … })` dopisz po `boczne`: `dzwiek: () => dzwiek`.

- [ ] **Krok 2a: `player.js` — powyżej marszu krok się wydłuża**

Kroki i bujanie liczone z drogi co 0,75 m dają przy marszu (4,2 m/s) 5,6 kroku na sekundę, ale przy biegu z Shiftem (8 m/s) już 10,6, a w szybkiej podróży (11 m/s) 14,7 — z dźwiękiem to seria z karabinu, a kamera drga z częstotliwością 14,7 Hz. Powyżej prędkości marszu krok ma się wydłużać, nie zagęszczać. Faza kroku liczona jako ułamek (0–1), nie w metrach: długość kroku zmienia się wtedy z prędkością bez skoku bujania i bez podwójnego kroku przy hamowaniu.

1. Deklarację `let droga = 0;              // przebyta droga w bieżącym kroku [m]` zastąp:

```js
  let faza = 0;               // faza bieżącego kroku: 0–1
```

2. W `update(dt)` blok kroków (od komentarza `// kroki: z przebytej drogi` do klamry zamykającej `if (naZiemi && v > 0.4)`) zastąp:

```js
      // kroki: z przebytej drogi — do prędkości marszu szybciej znaczy częściej, powyżej krok się
      // wydłuża (bieg i szybka podróż: 5,6 kroku/s, nie 10–15); bujanie wyłączone przy reduced motion
      const v = Math.hypot(predkosc.x, predkosc.z);
      if (naZiemi && v > 0.4) {
        faza += (v * dt) / (DLUGOSC_KROKU * Math.max(1, v / PREDKOSC));
        if (faza >= 1) { faza -= 1; for (const f of sluchaczeKrokow) f(); }
        if (!reduceMotion) camera.position.y += Math.sin(faza * Math.PI * 2) * AMPLITUDA_KROKU * Math.min(1, v / PREDKOSC);
      }
```

- [ ] **Krok 3: `museum.html`**

1. W `#loader` zaraz pod `<p data-i18n="muz.laduje">Otwieram muzeum…</p>` dopisz:

```html
  <!-- Ekran wejścia: pojawia się, gdy muzeum jest gotowe (main.js). Kliknięcie
       jest gestem, w którym przeglądarka pozwala uruchomić dźwięk. -->
  <div class="wejscie" id="wejscie">
    <h1 data-i18n="muz.tytul">Muzeum Budowania</h1>
    <button type="button" id="wejdz-dzwiek" data-i18n="muz.wejdzDzwiek">Wejdź z dźwiękiem</button>
    <button type="button" id="wejdz-cisza" class="cicho" data-i18n="muz.wejdzCisza">Wejdź w ciszy</button>
  </div>
```

2. W HUD przed `<button class="hud-list" id="btn-tura" …>` dopisz:

```html
  <button class="hud-list" id="btn-dzwiek" type="button" aria-pressed="false" aria-label="Dźwięk: wył." data-i18n-attr="aria-label:muz.dzwiekWyl"><svg class="dz-ikona" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor"/><path class="dz-fale" d="M11 5.6a3.4 3.4 0 0 1 0 4.8M12.9 3.8a6 6 0 0 1 0 8.4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><span class="hud-tekst" data-i18n="muz.dzwiekWyl">Dźwięk: wył.</span></button>
```

Napis siedzi w `.hud-tekst`, bo na telefonie te napisy znikają (reguła z `@media (max-width: 640px)`): z samym tekstem w przycisku nagłówek telefonu przestawał się mieścić w jednym wierszu — przełącznik PL/EN spadał pod spód i zderzał się z przyciskiem „Plan” (tak było na próbie). Na telefonie zostaje ikona głośnika, fale tylko przy włączonym dźwięku. `data-i18n` i `data-i18n-attr` tłumaczą stan startowy; potem napis i `aria-label` ustawia `pokazStanDzwieku()` przez `t()` — zmiana języka przeładowuje stronę, więc to wystarcza.

3. W import mapie po `muzeum/sale-boczne.js` dopisz `"muzeum/dzwiek.js": "./js/museum/dzwiek.js?v=STEMPEL",` i podbij stempel (także przy `css/museum.css`).

- [ ] **Krok 4: `css/museum.css`**

Na końcu pliku:

```css
/* Ekran wejścia (main.js: wejdz). Do pierwszej klatki loader jak dotąd; potem
   tło staje się półprzezroczyste — za nim widać amfiladę — i przycisk przejmuje
   kliknięcia, żeby klik obok nie ruszył spaceru przed wejściem. */
.wejscie { display: none; flex-direction: column; align-items: center; gap: 0.8rem; }
#loader.gotowy { background: radial-gradient(ellipse at center, rgba(12,16,24,0.35), rgba(12,16,24,0.88)); pointer-events: auto; }
#loader.gotowy > svg, #loader.gotowy > p { display: none; }
#loader.gotowy .wejscie { display: flex; }
.wejscie h1 { font-family: var(--font-display); font-weight: 800; font-size: clamp(2rem, 6vw, 3.6rem); letter-spacing: -0.02em; margin-bottom: 1rem; text-align: center; }
.wejscie button {
  font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase;
  color: #14100a; background: var(--pulse); border: 1px solid var(--pulse); border-radius: 99px;
  padding: 0.85rem 1.6rem; min-width: 16rem; cursor: pointer;
}
.wejscie button.cicho { color: var(--ink-dim); background: transparent; border-color: var(--line); }
.wejscie button:hover { box-shadow: 0 0 30px rgba(242, 196, 109, 0.3); }
.wejscie button.cicho:hover { color: var(--pulse); border-color: var(--pulse-dim); box-shadow: none; }
#loader.done { pointer-events: none; }
#btn-dzwiek[aria-pressed="true"] { color: var(--pulse); border-color: var(--pulse-dim); }
/* Ikona głośnika: fale tylko przy włączonym dźwięku. Na telefonie napis znika
   (.hud-tekst) i zostaje sama ikona — nagłówek mieści się w jednym wierszu. */
#btn-dzwiek { display: inline-flex; align-items: center; gap: 0.45em; }
.dz-ikona { width: 1.15em; height: 1.15em; flex: none; }
#btn-dzwiek[aria-pressed="false"] .dz-fale { display: none; }
```

- [ ] **Krok 5: Weryfikacja**

1. Po załadowaniu (bez klikania) zrzut: tytuł i dwa przyciski na przyciemnionej, ale widocznej amfiladzie; `document.activeElement.id === "wejdz-dzwiek"`.
2. **Prawdziwy** klik w „Wejdź z dźwiękiem” (`browser_click` w `#wejdz-dzwiek` — nie `element.click()` z `browser_evaluate`: kontekst audio rusza tylko w geście użytkownika), potem:

```js
async () => {
  const m = window.__mz, d = m.dzwiek(), btn = document.getElementById("btn-dzwiek");
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  const stan = { ctx: d?.ctx.state, przycisk: btn.textContent, aria: btn.getAttribute("aria-pressed"), loader: document.getElementById("loader").className };
  // kroki: licznik na krok(), spacer 10,5 m osią z atrium do sali I
  let kroki = 0;
  const krok = d.krok;
  d.krok = () => { kroki++; krok(); };
  m.nawigacja.idzDo(0, 4);
  await czekaj(300);
  while (m.nawigacja.aktywna()) await czekaj(200);
  d.krok = krok;
  // serce: oscylatory tworzone w atrium — para „lub-dub” co OKRES_SERCA
  m.gracz.teleportuj(0, -6.5, { x: 0, z: 10 });
  await czekaj(400);
  const czasy = [];
  const osc = d.ctx.createOscillator.bind(d.ctx);
  d.ctx.createOscillator = () => { czasy.push(performance.now() / 1000); return osc(); };
  await czekaj(3300);
  d.ctx.createOscillator = osc;
  // pogłos: długość odpowiedzi impulsowej (bufor 2-kanałowy) liczonej przy wejściu do sali
  const poglos = {};
  const buf = d.ctx.createBuffer.bind(d.ctx);
  let sala = null;
  d.ctx.createBuffer = (k, n, sr) => { if (k === 2 && sala) poglos[sala] = +(n / sr).toFixed(2); return buf(k, n, sr); };
  for (const id of ["e1", "kino", "e5a", "atrium"]) {
    const s = m.plan.sale.find((x) => x.id === id);
    sala = id;
    m.gracz.teleportuj((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, { x: (s.x0 + s.x1) / 2, z: s.z1 });
    await czekaj(500);
  }
  d.ctx.createBuffer = buf;
  btn.click();
  await czekaj(100);
  const wyciszony = { przycisk: btn.textContent, aria: btn.getAttribute("aria-pressed"), wyciszony: d.wyciszony() };
  btn.click();
  return { stan, kroki, serce: czasy.slice(1).map((t, i) => +(t - czasy[i]).toFixed(2)), poglos, wyciszony, bledy: window.__errs };
}
```

Oczekiwane (próba): `stan` = `{ ctx: "running", przycisk: "Dźwięk: wł.", aria: "true", loader: "gotowy done" }`; `kroki` 13–14 (krok co 0,75 m); `serce` na przemian `0` i `1.1` (para uderzeń planowana razem, pary co `OKRES_SERCA`); `poglos` = `{ e1: 1.72, kino: 1.11, e5a: 2.35, atrium: 3.2 }` (atrium na suficie 3,2 s); `wyciszony` = `{ przycisk: "Dźwięk: wył.", aria: "false", wyciszony: true }`; `bledy: []`.

3. Wejście w ciszy: przeładuj, `browser_click` w `#wejdz-cisza` → `window.__mz.dzwiek() === null` (żaden kontekst audio nie powstał), `#btn-dzwiek` = „Dźwięk: wył.”. Potem `browser_click` w `#btn-dzwiek` → `window.__mz.dzwiek().ctx.state === "running"`, przycisk „Dźwięk: wł.”.
4. Kino słucha przełącznika:

```js
async () => {
  const m = window.__mz;
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  const filmy = new Set();
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () { filmy.add(this); return play.call(this); };
  const k = m.plan.sale.find((s) => s.id === "kino");
  m.gracz.teleportuj((k.x0 + k.x1) / 2, (k.z0 + k.z1) / 2, { x: k.x1, z: (k.z0 + k.z1) / 2 });
  await czekaj(3000);
  const wl = [...filmy].map((v) => ({ plik: v.src.split("/").pop(), muted: v.muted, gra: !v.paused }));
  document.getElementById("btn-dzwiek").click();
  await czekaj(150);
  const wyl = [...filmy].map((v) => ({ plik: v.src.split("/").pop(), muted: v.muted }));
  document.getElementById("btn-dzwiek").click();
  HTMLMediaElement.prototype.play = play;
  return { wl, wyl, bledy: window.__errs };
}
```

Oczekiwane przy włączonym dźwięku: `showreel.mp4` gra z `muted: false`, oba ujęcia z GB10 grają z `muted: true`; po wyciszeniu wszystkie `muted: true`.

5. Kroki w szybkiej podróży (krok 2a):

```js
async () => {
  const m = window.__mz;
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  m.gracz.teleportuj(0, -6.5, { x: 0, z: 10 });
  await czekaj(300);
  const czasy = [];
  m.gracz.naKrok(() => czasy.push(performance.now()));
  m.nawigacja.lecDoSali("e5a");
  let vMax = 0;
  await czekaj(100);
  while (m.nawigacja.aktywna()) { vMax = Math.max(vMax, m.gracz.predkosc()); await czekaj(100); }
  const odstepy = czasy.slice(1).map((t, i) => t - czasy[i]);
  return { vMax: +vMax.toFixed(1), kroki: czasy.length, najkrotszyOdstepMs: Math.round(Math.min(...odstepy)), bledy: window.__errs };
}
```

Oczekiwane: `vMax` ≈ 11, `najkrotszyOdstepMs` ≥ 150 (5,6 kroku/s to 178 ms; przed krokiem 2a było ok. 68 ms), `bledy: []`. Spacer z punktu 2 nadal daje 13–14 kroków (poniżej prędkości marszu nic się nie zmienia).

- [ ] **Krok 6: Commit**

```bash
git add js/museum/dzwiek.js js/museum/main.js js/museum/player.js museum.html css/museum.css
git commit -m "$(cat <<'EOF'
Muzeum: dźwięk na życzenie — ekran wejścia, kroki, pogłos sal, serce

Ekran wejścia na pierwszej klatce: „Wejdź z dźwiękiem” albo „w ciszy”
(w ciszy kontekst audio w ogóle nie powstaje). Dźwięk syntezowany: kroki
wg posadzki, pogłos z kubatury sali przez dwa przenikające się
konwolwery, ton tła strefy, w atrium serce w rytmie kardiogramu w
posadzce. Przełącznik w HUD; showreel w Kinie słucha przełącznika.
Powyżej prędkości marszu krok się wydłuża, zamiast zagęszczać — bieg
i szybka podróż nie strzelają już krokami 10–15 razy na sekundę.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 10: Poziomy jakości, strażnik wydajności, obrazy salami, utrata kontekstu

Trzy poziomy jakości wybierane na starcie (telefon → niski, komputer z ≤ 4 wątkami → średni, reszta → wysoki; `?jakosc=` wymusza), strażnik `perf.js` uogólniony do czterech stopni w kolejności ze specyfikacji, obrazy prac na telefonie wczytywane salami, komunikat zamiast czarnego ekranu po utracie kontekstu WebGL i oszczędzanie w bezruchu (stojący gość: 20, potem 4 klatki na sekundę — decyzja właściciela 8 X).

**Pomiar, który ustalił liczby** (próba 7 X, MacBook, profil 1440 × 900 przy DPR 2, atrium z widokiem na wylot — najgorszy kadr):

| wariant | fps |
|---|---|
| bez GTAO, DPR 1,75 | 79 |
| GTAO w pełnej rozdzielczości, DPR 1,75 | 38 (noc: 43) |
| GTAO w połowie rozdzielczości, DPR 1,75 | 58–61 |
| GTAO w połowie, DPR 1,5 | 79 (noc z lustrem: 96) |

Cienie i poświata kosztują w tym kadrze poniżej 6 %. Okluzja w połowie rozdzielczości różni się od pełnej o mniej niż 1/255 jasności (pod ławką i w narożniku — porównanie pikseli zrzutów). Dlatego GTAO jest **zawsze** liczone w połowie, a wysoki poziom ma DPR 1,5 zamiast 1,75 ze specyfikacji — to jedyne odstępstwo, a kryterium ≥ 60 fps ma pierwszeństwo. 8 próbek zamiast 16 oszczędzało ok. 4 %, więc wszędzie, gdzie jest GTAO, jest 16.

**Kropkowane narożniki** (próba z przeglądu zrzutów): w bieli każde załamanie ścian obsypywało się kropkami. Źródłem nie była połowa rozdzielczości (pełna kropkuje tak samo) ani cienie, tylko odszumianie Poissona w GTAOPass — surowa okluzja (`gtao.output = 4`) jest gładka, odszumiona (`5`) kropkowana: próbki zza narożnika mają wagę normalnych 0, a ich zbiór zmienia się co piksel. Stąd `updatePdMaterial({ radius: 0 })` — przy 16 próbkach okluzja i bez filtra jest gładka (sprawdzone też pod ławką na parkiecie).

**Pliki:**
- Modyfikuj: `js/museum/plan.js`, `tests/plan.test.mjs`, `js/museum/render.js` (w całości), `js/museum/swiatla.js`, `js/museum/perf.js` (w całości), `js/museum/main.js`, `museum.html` (stempel)

**Interfejsy:**
- Konsumuje: `prace.obrazy` — `{ salaId, src, tex, wczytany, wczytaj(), zwolnij() }` (Zadanie 3), `initSwiatla` i `swiatla.wylaczLustro()` (Zadanie 5), `komunikat(tekst)` i `naZmianeSali(s)` w `main.js`, panel `#no-webgl` w `museum.html`.
- Produkuje:
  - `plan.js`: `odleglosciSal(plan, salaId) → Map<salaId, liczba przejść>`.
  - `render.js`: `jakosc = { nazwa: "wysoki" | "sredni" | "niski", dpr, gtao (true/false), lustro (rozdzielczość odbicia; 0 — bez), cienie: "pelne" | "slonce" | "brak", pula: { spot, rect }, leniwe }`; eksport `gtao` bywa `null`; `window.__mz.jakosc`.
  - `swiatla.js`: `initSwiatla({ plan, budynek, plamy, pula, lustro, cienie })`; `wylaczLustro() → boolean`; `swiatla.lustro` jako getter (po wyłączeniu `null`).
  - `perf.js`: `initPerf({ stopnie: [{ nazwa, wykonaj() → boolean, tekst() → string }], komunikat }) → { tick(dt), degraduj() → boolean, wykonane() → string[] }`; `window.__mz.perf`.
  - Klucze tłumaczeń (angielskie w Zadaniu 11): `muz.perf.gtao`, `muz.perf.lustro`, `muz.perf.cienie`, `muz.perf.dpr`, `muz.utrata`, `muz.odswiez`.

- [ ] **Krok 1: Napisz test odległości sal**

W `tests/plan.test.mjs` uzupełnij import o `odleglosciSal`:

```js
import { zbudujPlan, salaPod, trasa, odleglosciSal, punktWejscia, wyroznione, rozmiesc, strefaEpoki, POJ, DRZWI_SZ } from "../js/museum/plan.js";
```

i przed testem `"wycieczka: wszystkie wyróżnione, w kolejności dat"` dopisz:

```js
test("odleglosciSal: przejścia od sali — amfilada kolejno, każda sala osiągalna, za progiem o jedno", () => {
  const odl = odleglosciSal(plan, "atrium");
  assert.equal(odl.get("atrium"), 0);
  assert.equal(odl.size, plan.sale.length);
  osiowe.slice(1).forEach((s, i) => assert.equal(odl.get(s.id), i + 1, s.id));
  for (const d of plan.drzwi) if (d.b) assert.equal(Math.abs(odl.get(d.a) - odl.get(d.b)), 1, d.id);
  assert.equal(odleglosciSal(plan, "leon").get("leon"), 0);
});
```

- [ ] **Krok 2: Uruchom — ma się wywrócić**

Run: `node --test tests/plan.test.mjs`
Expected: FAIL — `SyntaxError: The requested module '../js/museum/plan.js' does not provide an export named 'odleglosciSal'`.

- [ ] **Krok 3: `plan.js` — graf przejść wspólny dla `trasa` i `odleglosciSal`**

1. Komentarz i początek `trasa` (od `/* Kolejne drzwi na drodze z sali do sali` do linii przed `const skad = …`) zastąp:

```js
/* Graf przejść: sala → [[sąsiednia sala, drzwi]]. Portal Kosmosu (drzwi
   bez `b`) nie prowadzi do żadnej sali. */
function sasiedztwo(plan) {
  const sasiedzi = new Map(plan.sale.map((s) => [s.id, []]));
  for (const d of plan.drzwi) {
    if (!d.b) continue;
    sasiedzi.get(d.a).push([d.b, d]);
    sasiedzi.get(d.b).push([d.a, d]);
  }
  return sasiedzi;
}

/* Kolejne drzwi na drodze z sali do sali (przeszukiwanie wszerz po grafie
   drzwi). Pusta tablica — ta sama sala; null — nie ma drogi. */
export function trasa(plan, odId, doId) {
  if (odId === doId) return [];
  const sasiedzi = sasiedztwo(plan);
```

2. Przed komentarzem `/* Gdzie stanąć po wejściu do sali` dopisz:

```js
/* Ile przejść dzieli każdą salę od danej: 0 — ta sama, 1 — za progiem…
   Obrazy prac na niskim poziomie jakości (main.js) żyją tylko w pobliżu gościa. */
export function odleglosciSal(plan, odId) {
  const sasiedzi = sasiedztwo(plan);
  const odl = new Map([[odId, 0]]);
  const kolejka = [odId];
  while (kolejka.length) {
    const s = kolejka.shift();
    for (const [n] of sasiedzi.get(s) ?? []) if (!odl.has(n)) { odl.set(n, odl.get(s) + 1); kolejka.push(n); }
  }
  return odl;
}

```

- [ ] **Krok 4: Uruchom — ma przejść**

Run: `node --test tests/plan.test.mjs`
Expected: `ℹ tests 18`, `ℹ pass 18`, `ℹ fail 0`.

- [ ] **Krok 5: `render.js` — poziomy jakości, okluzja w połowie, utrata kontekstu**

Zastąp zawartość `js/museum/render.js` w całości:

```js
/* Warstwa renderowania muzeum: renderer, scena, kamera, kompozytor i drobni
   pomocnicy. Dane: js/projects-data.js (PROJECTS, ERAS, CATEGORIES) — globalne. */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

window.__errs = [];
addEventListener("error", (e) => window.__errs.push(String(e.message)));
addEventListener("unhandledrejection", (e) => window.__errs.push(String(e.reason)));

/* ── Podstawy ─────────────────────────────────────────────────────────── */

const host = document.getElementById("scene-host");
const loader = document.getElementById("loader");

function webglOK() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}
if (!webglOK()) {
  document.getElementById("no-webgl").hidden = false;
  loader.classList.add("done");
  throw new Error("WebGL unavailable");
}

const ROMAN = { "01":"I","02":"II","03":"III","04":"IV","05":"V","06":"VI","07":"VII","08":"VIII","09":"IX","10":"X","11":"XI","12":"XII" };
const fmtDate = (d) => { const [y, m] = d.split("-"); return `${ROMAN[m]} ${y}`; };
const CAT_HEX = Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, v.color]));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const dotykowy = matchMedia("(pointer: coarse)").matches;

/* ── Poziom jakości ───────────────────────────────────────────────────────
   Start z detekcji: telefon i tablet (pointer: coarse) na niskim, słabszy
   komputer (≤ 4 wątki) na średnim, reszta na wysokim; `?jakosc=` w adresie
   wymusza poziom (testy, porównania). Dalej pilnuje perf.js — degradacja
   jednokierunkowa GTAO → lustro → cienie → rozdzielczość.
   Pomiar (MacBook, 1440 × 900, atrium na wylot — najgorszy kadr): bez GTAO
   79 fps; GTAO w pełnej rozdzielczości 38; w połowie 58–61 przy DPR 1,75
   i 79 przy DPR 1,5. Stąd wysoki = DPR 1,5 i okluzja zawsze w połowie (różnica
   względem pełnej: poniżej 1/255 jasności pod ławką i w narożniku); 8 próbek
   zamiast 16 oszczędzało ledwie 4 %, więc wszędzie, gdzie jest GTAO, jest 16.
   Prostokątów zawsze 4: sala nocy ma ich tyle (podświetlenia ścian i progu),
   a pula przydziela je całymi salami — mniejsza zostawiłaby noc bez świateł. */
const POZIOMY = {
  wysoki: { dpr: 1.5, gtao: true, lustro: 1024, cienie: "pelne", pula: { spot: 12, rect: 4 }, leniwe: false },
  sredni: { dpr: 1.25, gtao: true, lustro: 512, cienie: "slonce", pula: { spot: 8, rect: 4 }, leniwe: false },
  niski: { dpr: 1.25, gtao: false, lustro: 0, cienie: "brak", pula: { spot: 6, rect: 4 }, leniwe: true },
};
const wymuszony = new URLSearchParams(location.search).get("jakosc");
const nazwaPoziomu = POZIOMY[wymuszony] ? wymuszony
  : dotykowy ? "niski" : (navigator.hardwareConcurrency ?? 8) <= 4 ? "sredni" : "wysoki";
const jakosc = { nazwa: nazwaPoziomu, ...POZIOMY[nazwaPoziomu] };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);

/* Bez mgły: to wnętrza, a widok na wylot przez całą amfiladę (ok. 150 m) jest
   celem projektu. Daleka płaszczyzna z zapasem na tę długość, bliska mała,
   bo gość podchodzi do ram i tabliczek na kilkadziesiąt centymetrów.
   Kolejność YXZ — odchylenie, potem pochylenie — tak liczą PointerLockControls
   i przeciąganie, więc kamera nie przekrzywia się przy rozglądaniu. */
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.05, 220);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
/* Gęstość pikseli z poziomu: na telefonie limit 1,25 zamiast natywnych 3 to
   prawie sześć razy mniej pikseli na klatkę przy niewidocznej różnicy. */
renderer.setPixelRatio(Math.min(devicePixelRatio, jakosc.dpr));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = jakosc.cienie !== "brak";
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

/* Utrata kontekstu WebGL (telefon pod presją pamięci, reset sterownika):
   three.js przestaje rysować i zostaje czarne płótno. Zamiast niego prośba
   o odświeżenie — w panelu, którego używa też strażnik ładowania. */
renderer.domElement.addEventListener("webglcontextlost", () => {
  const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);
  const panel = document.getElementById("no-webgl");
  const tekst = document.createElement("p");
  tekst.textContent = t("muz.utrata", "Karta graficzna zgubiła obraz muzeum — na telefonie zdarza się to przy braku pamięci.");
  const odswiez = document.createElement("button");
  odswiez.type = "button";
  odswiez.className = "hud-list";
  odswiez.textContent = t("muz.odswiez", "Odśwież muzeum");
  odswiez.addEventListener("click", () => location.reload());
  const powrot = document.createElement("a");
  powrot.href = "index.html";
  powrot.textContent = t("muz.wrocKarta", "Wróć do karty budowania");
  panel.replaceChildren(tekst, odswiez, powrot);
  panel.hidden = false;
});

// Mapa środowiskowa z kodu — 0 bajtów do pobrania. Siłę per strefa ustawia swiatla.js.
const pmrem = new THREE.PMREMGenerator(renderer);
const srodowisko = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = srodowisko;
scene.environmentIntensity = 0.15;

// go() dostaje ciało w main.js, gdy powstaje gracz — tu tylko nieszkodliwy zaczep.
window.__mz = { renderer, scene, camera, jakosc, composer: null, bloom: null, go: () => {} };

/* MSAA w celu kompozytora: `antialias` renderera nie obejmuje rysowania do
   celu pośredniego, a bez wygładzania listwy, ramy i opaski drzwi strzępią się. */
const cel = new THREE.WebGLRenderTarget(16, 16, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, cel);
composer.addPass(new RenderPass(scene, camera));
/* Okluzja otoczenia (GTAO): miękki cień w narożnikach, pod ławkami i u podstawy
   podestów. To ona odróżnia wnętrze od „płaskiego 3D” — szczególnie w bieli,
   gdzie światło sufitu nie rzuca cieni. Liczona w połowie rozdzielczości
   (razem z przebiegiem normalnych): i tak jest rozmyta, a pikseli 4× mniej —
   w pełnej zjadała ⅓ klatki. Na niskim poziomie nie powstaje wcale (jej cele
   renderowania to pamięć, której telefon nie ma). */
let gtao = null;
if (jakosc.gtao) {
  gtao = new GTAOPass(scene, camera, 16, 16);
  gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1, thickness: 1, scale: 1, samples: 16 });
  /* Bez przestrzennego odszumiania (promień 0): przy 16 próbkach okluzja jest
     już gładka, a filtr Poissona kropkował każde załamanie ścian — próbki zza
     narożnika dostają wagę 0, a ich zbiór zmienia się co piksel (widać to było
     w bieli, gdzie okluzja to prawie jedyny cień). */
  gtao.updatePdMaterial({ radius: 0 });
  gtao.blendIntensity = 1;
  const pelna = gtao.setSize.bind(gtao);
  gtao.setSize = (w, h) => pelna(Math.ceil(w / 2), Math.ceil(h / 2));
  composer.addPass(gtao);
}
// (rozdzielczość, siła, promień, próg) — wysoki próg: świecą ekrany, szyldy i progi, nie ściany
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
window.__mz.composer = composer;
window.__mz.bloom = bloom;
window.__mz.gtao = gtao;

/* ── Budowniczowie eksponatów ─────────────────────────────────────────── */

const M = {
  body: (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.6, metalness: 0.1 }),
  glow: (hex, opacity = 1) => new THREE.MeshBasicMaterial({ color: hex, transparent: opacity < 1, opacity }),
  add:  (hex, opacity = 0.85) => new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
};

function bx(w, h, d, mat) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); }

export { renderer, scene, camera, composer, bloom, gtao, jakosc, srodowisko, M, bx, reduceMotion, dotykowy, CAT_HEX, fmtDate };
```

- [ ] **Krok 6: `swiatla.js` — pula, lustro i cienie z poziomu**

1. Linię `export function initSwiatla({ plan, budynek, plamy = [], pula = { spot: 12, rect: 4 }, lustro: zLustrem = true }) {` zastąp:

```js
/* Opcje z poziomu jakości (render.js: jakosc): `pula` — liczba reflektorów i
   prostokątów, `lustro` — rozdzielczość odbicia posadzki nocy (0 — bez lustra),
   `cienie` — "pelne" (reflektory i słońce), "slonce" (tylko kierunkowe), "brak". */
export function initSwiatla({ plan, budynek, plamy = [], pula = { spot: 12, rect: 4 }, lustro: rozdzielczoscLustra = 1024, cienie = "pelne" }) {
```

2. W tworzeniu reflektorów warunek `if (i < 2) {` → `if (i < 2 && cienie === "pelne") {` (komentarz na końcu linii bez zmian); `slonce.castShadow = true;` → `slonce.castShadow = cienie !== "brak";`.
3. `if (zLustrem && plan.sale.some((s) => s.styl === "noc")) {` → `if (rozdzielczoscLustra && plan.sale.some((s) => s.styl === "noc")) {`, a w konstruktorze `Reflector` `textureWidth: 1024, textureHeight: 1024` → `textureWidth: rozdzielczoscLustra, textureHeight: rozdzielczoscLustra`.
4. W zwracanym obiekcie linię `lustro,` zastąp `get lustro() { return lustro; },   // getter: po wyłączeniu przez perf.js ma oddać null, nie stare lustro`, a metodę `wylaczLustro` (z jej komentarzem) zastąp:

```js
    /* Wyłączenie lustra na stałe — stopień degradacji z perf.js. Zwraca, czy
       było co wyłączyć (na niskim poziomie lustra nie ma od startu). */
    wylaczLustro() {
      if (!lustro) return false;
      scene.remove(lustro);
      lustro.dispose();
      lustro = null;
      return true;
    },
```

- [ ] **Krok 7: `perf.js` — stopnie z zewnątrz**

Zastąp zawartość `js/museum/perf.js` w całości:

```js
/* Strażnik wydajności. Degradacja jednokierunkowa: raz wyłączonego efektu nie
   włączamy z powrotem, bo na granicy wydajności scena migotałaby w tę i z
   powrotem. Stopnie podaje main.js — od najdroższego przy najmniejszej stracie
   wyglądu: GTAO → lustro → cienie → rozdzielczość. Stopień, którego nie ma już
   czym wykonać (np. lustro na niskim poziomie), oddaje kolejkę następnemu. */

/* Pierwsze klatki życia sceny NIE liczą się do średniej. Kompilacja shaderów,
   wysyłka tekstur na kartę i budowa map cieni potrafią zjeść na telefonie
   kilkaset milisekund na klatkę — i wszystko to mija samo. Degradacja jest
   jednokierunkowa z rozmysłem, więc telefon, który zmierzyłby tylko rozgrzewkę,
   straciłby efekty na stałe, z powodu, którego już nie ma.
   ~120 klatek to około dwie sekundy przy 60 fps i wyraźnie więcej przy
   zadławionym starcie — czyli dokładnie ten okres, którego nie chcemy mierzyć. */
const ROZGRZEWKA = 120;
const PO_ZMIANIE = 60;    // wyłączenie cieni rekompiluje shadery — ta czkawka też nie jest pomiarem
const OKNO = 90;          // klatek na jeden pomiar
const PROG_FPS = 25;

/* stopnie: [{ nazwa, wykonaj() → czy było co wyłączyć, tekst() → komunikat }] */
export function initPerf({ stopnie, komunikat }) {
  let klatki = 0, suma = 0, i = 0, rozgrzewka = ROZGRZEWKA;
  const wykonane = [];

  function degraduj() {
    while (i < stopnie.length) {
      const s = stopnie[i++];
      if (s.wykonaj()) {
        wykonane.push(s.nazwa);
        komunikat(s.tekst());
        rozgrzewka = PO_ZMIANIE;
        return true;
      }
    }
    return false;
  }

  return {
    degraduj,                            // także dla testów: wymusza następny stopień
    wykonane: () => [...wykonane],
    tick(dt) {
      if (i >= stopnie.length) return;
      if (rozgrzewka > 0) { rozgrzewka--; return; }
      suma += dt; klatki++;
      if (klatki < OKNO) return;
      const fps = klatki / suma;
      klatki = 0; suma = 0;
      if (fps < PROG_FPS) degraduj();
    },
  };
}
```

- [ ] **Krok 8: `main.js`**

1. Importy: `import { renderer, scene, camera, composer, bloom } from "muzeum/render.js";` → `import { renderer, scene, camera, composer, gtao, jakosc } from "muzeum/render.js";` (`bloom` służył w `main.js` tylko staremu `perf.js`); `import { zbudujPlan, salaPod } from "muzeum/plan.js";` → `import { zbudujPlan, salaPod, odleglosciSal } from "muzeum/plan.js";`.
2. Usuń linię `const perfTick = initPerf({ composer, bloom, renderer, komunikat });`, a pod `let bylaSala = null, byloWycieczka = false;` wstaw:

```js

/* Strażnik wydajności (perf.js): stopnie od najdroższego przy najmniejszej
   stracie wyglądu. Każdy zwraca, czy miał co wyłączyć. */
const perf = initPerf({
  komunikat,
  stopnie: [
    {
      nazwa: "gtao",
      tekst: () => t("muz.perf.gtao", "Wyłączyłem cieniowanie narożników, żeby złapać płynność."),
      wykonaj: () => {
        if (!gtao || !composer.passes.includes(gtao)) return false;
        composer.removePass(gtao);
        gtao.dispose();
        return true;
      },
    },
    {
      nazwa: "lustro",
      tekst: () => t("muz.perf.lustro", "Wyłączyłem odbicia w posadzce nocy."),
      wykonaj: () => swiatla?.wylaczLustro() ?? false,
    },
    {
      nazwa: "cienie",
      tekst: () => t("muz.perf.cienie", "Wyłączyłem też cienie — ten sprzęt nie wyrabia."),
      wykonaj: () => {
        if (!renderer.shadowMap.enabled) return false;
        renderer.shadowMap.enabled = false;
        return true;
      },
    },
    {
      nazwa: "dpr",
      tekst: () => t("muz.perf.dpr", "Zmniejszyłem rozdzielczość obrazu — to ostatni krok."),
      wykonaj: () => {
        if (renderer.getPixelRatio() <= 1) return false;
        renderer.setPixelRatio(1);
        composer.setPixelRatio(1);
        return true;
      },
    },
  ],
});
```

3. **Oszczędzanie w bezruchu** (decyzja właściciela 8 X: muzeum nie może zarzynać telefonów i słabszych komputerów; stojący gość nie potrzebuje 120 klatek). Nad `const clock = new THREE.Clock();` wstaw:

```js
/* ── Oszczędzanie w bezruchu ──────────────────────────────────────────────
   Gość stoi i nic się nie rusza → mniej klatek: po 2 s ok. 20 kl./s, po 20 s
   ok. 4 kl./s. Ruch myszy, dotyk, klawisz, kółko albo przejazd wracają do
   pełnej szybkości w tej samej klatce. W Kinie co najmniej 30 kl./s — gra film.
   Na telefonie i laptopie na baterii to różnica między „grzeje się” a „stoi”. */
const BEZRUCH = [[20, 1 / 4], [2, 1 / 20]];   // [po ilu sekundach bezruchu, najkrótszy odstęp klatek w s]
let ostatniRuch = performance.now(), ostatniaKlatka = 0;
const ruch = () => { ostatniRuch = performance.now(); };
for (const zdarzenie of ["pointermove", "pointerdown", "wheel", "keydown", "keyup", "touchstart", "touchmove"]) {
  addEventListener(zdarzenie, ruch, { passive: true });
}
function odstepKlatek(teraz) {
  if (nawigacja?.aktywna() || (gracz?.predkosc() ?? 0) > 0.05) { ostatniRuch = teraz; return 0; }
  const bezruch = (teraz - ostatniRuch) / 1000;
  let odstep = 0;
  for (const [po, o] of BEZRUCH) if (bezruch >= po) { odstep = o; break; }
  if (odstep && bylaSala?.rodzaj === "kino") odstep = Math.min(odstep, 1 / 30);
  return odstep;
}

```

a początek pętli — od `function petla() {` do `perfTick(dt);` włącznie — zastąp:

```js
function petla(teraz = performance.now()) {
  requestAnimationFrame(petla);
  dzwiek?.tick();                      // serce planowane 0,3 s naprzód — co wywołanie rAF, także w klatce pominiętej
  const odstep = odstepKlatek(teraz);
  if (odstep && teraz - ostatniaKlatka < odstep * 1000 - 4) return;   // klatka pominięta — gość stoi
  ostatniaKlatka = teraz;
  const dt = Math.min(clock.getDelta(), 0.05);
  const czas = clock.elapsedTime;      // nie `t` — to nazwa tłumacza napisów wyżej
  if (!odstep) perf.tick(dt);          // strażnik mierzy tylko pełną szybkość — oszczędzanie to nie słaby sprzęt
```

i usuń linię `dzwiek?.tick();` spod `swiatla?.aktualizuj(dt);` (Zadanie 9) — dźwięk ma teraz swoje miejsce na początku pętli.

Strażnik (`perf.tick`) liczy tylko klatki pełnej szybkości: inaczej wziąłby 4 kl./s bezruchu za słaby sprzęt i wyłączał efekty. Odstęp o 4 ms krótszy od nominalnego, żeby drgania zegara rAF nie gubiły co drugiej klatki (20 kl./s przy ekranie 60 Hz to co trzecia klatka). `dzwiek.tick()` stoi przed bramką bezruchu, bo serce planuje uderzenia tylko 0,3 s naprzód: przy 4 kl./s klatki dzieli 250–270 ms, więc zapas spadłby do kilkudziesięciu milisekund i każde zacięcie wątku gubiłoby uderzenie. Samo `tick()` to porównanie liczb — co klatkę rAF nic nie kosztuje.
4. Nad komentarzem funkcji `naZmianeSali` wstaw:

```js
/* Obrazy prac. Na niskim poziomie (telefon) salami: wczytane do dwóch przejść
   od gościa, zwalniane od pięciu — pas pomiędzy chroni przed migotaniem, gdy
   ktoś krąży przy progu. Wyżej wszystkie od razu, najbliższe najpierw
   (wczytaj() drugi raz nic nie robi, więc kolejne sale nic nie kosztują). */
function wczytajObrazy(s) {
  const odl = odleglosciSal(plan, s.id);
  const d = (o) => odl.get(o.salaId) ?? Infinity;
  for (const o of [...prace.obrazy].sort((a, b) => d(a) - d(b))) {
    if (!jakosc.leniwe || d(o) <= 2) o.wczytaj();
    else if (d(o) > 4) o.zwolnij();
  }
}

```

5. W `naZmianeSali` dopisz na końcu `wczytajObrazy(s);` (pierwsze wywołanie przychodzi w pierwszej klatce, z atrium).
6. W `zbudujMuzeum()` usuń linię `for (const o of prace.obrazy) o.wczytaj();   // wszystkie od razu; salami — Zadanie 10`.
7. `swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy });` → `swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy, pula: jakosc.pula, lustro: jakosc.lustro, cienie: jakosc.cienie });`.
8. W `Object.assign(window.__mz, { … })` dopisz `perf`.

- [ ] **Krok 9: `museum.html`** — podbij stempel `?v=` przy wszystkich modułach muzeum i przy `css/museum.css`.

- [ ] **Krok 10: Weryfikacja**

Profil MacBooka (sam `browser_resize` przestawia stronę na DPR 1 — pomiar byłby nieprawdziwy), przez `browser_run_code_unsafe`:

```js
async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  const wyniki = {};
  for (const poziom of ["wysoki", "sredni", "niski"]) {
    await page.goto(`http://localhost:8902/museum.html?jakosc=${poziom}`);
    await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
    await page.locator("#wejdz-cisza").click();
    wyniki[poziom] = await page.evaluate(async () => {
      const m = window.__mz;
      const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
      // klatki NARYSOWANE (composer.render), nie wywołania rAF — w bezruchu pętla pomija rysowanie
      let narysowane = 0;
      const render = m.composer.render.bind(m.composer);
      m.composer.render = (...a) => { narysowane++; return render(...a); };
      const fps = async (ms, { aktywny = true } = {}) => {
        // gość „rusza myszą” co 100 ms — inaczej oszczędzanie w bezruchu zaniżyłoby pomiar
        const iv = aktywny ? setInterval(() => dispatchEvent(new PointerEvent("pointermove")), 100) : null;
        const n0 = narysowane, t0 = performance.now();
        await czekaj(ms);
        clearInterval(iv);
        return Math.round(((narysowane - n0) * 1000) / (performance.now() - t0));
      };
      await czekaj(1500);
      const stan = {
        dpr: m.renderer.getPixelRatio(),
        gtao: m.gtao && m.composer.passes.includes(m.gtao) ? [m.gtao.width, m.gtao.height, m.gtao.gtaoMaterial.defines.SAMPLES] : null,
        cienie: m.renderer.shadowMap.enabled,
        lustro: m.swiatla.lustro ? m.swiatla.lustro.getRenderTarget().width : 0,
        spoty: m.scene.children.filter((o) => o.isSpotLight).length,
        zCieniem: m.scene.children.filter((o) => o.isLight && o.castShadow).length,
        obrazy: m.prace.obrazy.filter((o) => o.wczytany).length,
      };
      m.gracz.teleportuj(0, -6.5, { x: 0, z: 100 });        // atrium, widok na wylot — najgorszy kadr
      await czekaj(1500);
      const atrium = await fps(4000);
      const noc = m.plan.sale.find((s) => s.styl === "noc");
      m.gracz.teleportuj(0, noc.z0 + 2.5, { x: 0, z: noc.z1 });
      await czekaj(2500);
      const wNocy = await fps(4000);
      return { ...stan, fps: { atrium, wNocy }, perf: m.perf.wykonane(), bledy: window.__errs };
    });
  }
  return wyniki;
}
```

Oczekiwane (próba): wysoki — `dpr 1.5`, `gtao [1080, 675, 16]`, `cienie true`, `lustro 1024`, `spoty 12`, `zCieniem 3`, `obrazy 49`, fps atrium ≥ 60 (próba: 79), noc ≥ 60 (96); średni — `dpr 1.25`, `gtao [900, 563, 16]`, `lustro 512`, `spoty 8`, `zCieniem 1`; niski — `dpr 1.25`, `gtao null`, `cienie false`, `lustro 0`, `spoty 6`, `zCieniem 0`, `obrazy` 6 (tylko sale do dwóch przejść od atrium). Wszędzie `perf: []`, `bledy: []`. Ekran 120 Hz pokazuje do 120 fps — to sufit, nie błąd.

2. Obrazy salami (na `?jakosc=niski`):

```js
async () => {
  const m = window.__mz;
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  const wgSal = () => {
    const w = {};
    for (const o of m.prace.obrazy) { w[o.salaId] ??= [0, 0]; w[o.salaId][0]++; if (o.wczytany) w[o.salaId][1]++; }
    return Object.fromEntries(Object.entries(w).map(([k, [ile, wcz]]) => [k, `${wcz}/${ile}`]));
  };
  const ost = m.plan.sale.find((s) => s.id === "e6b");
  m.gracz.teleportuj(0, ost.z0 + 3, { x: 0, z: ost.z1 });
  await czekaj(600);
  return { wE6b: wgSal(), naKarcie: m.prace.obrazy.filter((o) => o.tex).length, bledy: window.__errs };
}
```

Oczekiwane: sale do dwóch przejść od `e6b` (`e5b`, `e6a`, `e6b`) w komplecie, sale od pięciu przejść (`e1`, `e2`, `e3`) `0/n` z `tex === null`, sale w pasie 3–4 bez zmian względem poprzedniego stanu.

3. Stopnie degradacji (na `?jakosc=wysoki`, w sali nocy):

```js
async () => {
  const m = window.__mz;
  const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
  const noc = m.plan.sale.find((s) => s.styl === "noc");
  m.gracz.teleportuj(0, noc.z0 + 2.5, { x: 0, z: noc.z1 });
  await czekaj(1500);
  const stan = () => ({ gtao: m.composer.passes.includes(m.gtao), lustro: !!m.swiatla.lustro, cienie: m.renderer.shadowMap.enabled,
    dpr: m.renderer.getPixelRatio(), komunikat: document.getElementById("hud-perf").textContent });
  const kroki = [];
  for (let i = 0; i < 5; i++) { const zrobil = m.perf.degraduj(); await czekaj(400); kroki.push({ zrobil, ...stan() }); }
  return { kroki, wykonane: m.perf.wykonane(), bledy: window.__errs };
}
```

Oczekiwane: `wykonane` = `["gtao", "lustro", "cienie", "dpr"]`, każdy krok z własnym komunikatem w `#hud-perf`, piąty `zrobil: false`, `bledy: []`; zrzut sali nocy po degradacji — matowa posadzka, ciepłe linie i plamy snopów, bez czarnych dziur.

4. Oszczędzanie w bezruchu (`browser_run_code_unsafe`; klatki liczone na `composer.render`):

```js
async (page) => {
  await page.goto(`http://localhost:8902/museum.html?lang=pl&_=${Date.now()}`);
  await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
  await page.locator("#wejdz-cisza").click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const m = window.__mz;
    window.__klatki = 0;
    const render = m.composer.render.bind(m.composer);
    m.composer.render = (...a) => { window.__klatki++; return render(...a); };
  });
  const kps = async (ms) => { const k0 = await page.evaluate(() => window.__klatki); await page.waitForTimeout(ms); return Math.round(((await page.evaluate(() => window.__klatki)) - k0) * 1000 / ms); };
  const ruszaj = async (ms) => { const t0 = Date.now(); let i = 0; while (Date.now() - t0 < ms) { await page.mouse.move(600 + (i++ % 2) * 40, 450); await page.waitForTimeout(80); } };
  const wynik = {};
  const k0 = await page.evaluate(() => window.__klatki);
  await ruszaj(3000);
  wynik.wRuchu = Math.round(((await page.evaluate(() => window.__klatki)) - k0) / 3);
  await page.waitForTimeout(2500);
  wynik.bezruch3s = await kps(3000);
  await page.waitForTimeout(16000);
  wynik.bezruch25s = await kps(4000);
  await ruszaj(400);
  wynik.poRuchu = await kps(1000);
  await page.evaluate(() => window.__mz.gracz.teleportuj(9.4, -8, { x: 18, y: 2.3, z: -8 }));
  await page.waitForTimeout(25000);
  wynik.kinoBezruch = await kps(3000);
  wynik.perf = await page.evaluate(() => window.__mz.perf.wykonane());
  wynik.bledy = await page.evaluate(() => window.__errs);
  return wynik;
}
```

Oczekiwane (próba 8 X, ekran 120 Hz): `wRuchu` ≈ odświeżanie ekranu (120), `bezruch3s` ≈ 20, `bezruch25s` ≈ 4, `poRuchu` z powrotem ≈ 120, `kinoBezruch` ≈ 30, `perf: []` (strażnik nie wziął bezruchu za słaby sprzęt), `bledy: []`. Na próbie CPU przeglądarki testów: 103 % w ruchu, 37 % po 3 s bezruchu, 15 % po 25 s.

   Serce w bezruchu: przeładuj, wejdź **prawdziwym** klikiem w `#wejdz-dzwiek` (`page.locator("#wejdz-dzwiek").click()`), `__mz.gracz.teleportuj(0, -6.5, { x: 0, z: 10 })`, odczekaj 25 s bez ruchu, potem przez 4,5 s zapisuj chwile `ctx.createOscillator` (jak w weryfikacji Zadania 9). Oczekiwane: pary uderzeń planowane co `OKRES_SERCA` (1,1 s) z odchyłką do 0,05 s — nie co 1,0/1,25 s, jak przy planowaniu tylko w klatkach bezruchu.

5. Utrata kontekstu: `window.__mz.renderer.getContext().getExtension("WEBGL_lose_context").loseContext()` → `#no-webgl` widoczny z tekstem „Karta graficzna zgubiła obraz muzeum…”, przyciskiem „Odśwież muzeum” (przeładowuje stronę) i odnośnikiem do karty budowania.
6. Wykrywanie bez `?jakosc=` (CDP): `Emulation.setDeviceMetricsOverride({ width: 390, height: 844, deviceScaleFactor: 3, mobile: true })` + `Emulation.setTouchEmulationEnabled({ enabled: true, maxTouchPoints: 5 })` → `__mz.jakosc.nazwa === "niski"`, `dpr 1.25`, brak przewijania w bok; profil MacBooka + `Emulation.setHardwareConcurrencyOverride({ hardwareConcurrency: 4 })` → `"sredni"`; 10 wątków → `"wysoki"`.

- [ ] **Krok 11: Commit**

```bash
git add js/museum/plan.js tests/plan.test.mjs js/museum/render.js js/museum/swiatla.js js/museum/perf.js js/museum/main.js museum.html
git commit -m "$(cat <<'EOF'
Muzeum: poziomy jakości, strażnik w czterech stopniach, obrazy salami

Wysoki/średni/niski z detekcji (dotyk, liczba wątków) albo ?jakosc=.
GTAO zawsze w połowie rozdzielczości: w pełnej zjadała 1/3 klatki
(38 zamiast 79 fps w atrium przy 1440x900), a różnica w obrazie jest
poniżej 1/255; bez odszumiania Poissona, które kropkowało narożniki
w bieli. Wysoki na DPR 1,5. Strażnik wyłącza kolejno GTAO,
lustro, cienie i rozdzielczość. Na telefonie obrazy prac tylko do
dwóch przejść od gościa. Utrata kontekstu WebGL — prośba o odświeżenie.
Bezruch: po 2 s ok. 20, po 20 s ok. 4 klatki na sekundę, ruch od razu
przywraca pełną szybkość, Kino trzyma 30 (CPU próby: 103 % → 15 %).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 11: Lista salami, podpis przy kursorze, wersja angielska, wspólny stempel, README

Lista eksponatów grupuje się salami nowego planu w kolejności spaceru, a nagłówek sali to przycisk szybkiej podróży. Najechanie na pracę pokazuje podpis „Podejdź · tytuł” (podłogę — „idź tutaj” — pokazuje już znacznik; spec §7). Wszystkie nowe napisy dostają wersję angielską, a trzy strony — jeden wspólny stempel `?v=`. README dostaje sekcję muzeum.

**Pliki:**
- Modyfikuj: `js/museum/ui.js`, `js/museum/main.js`, `museum.html`, `css/museum.css`, `js/i18n.js`, `README.md`, `index.html` i `kosmos.html` (tylko stempel)

**Interfejsy:**
- Konsumuje: `odleglosciSal` (Zadanie 10), `opisSali` (ui.js), `nawigacja.lecDoSali(id)` (Zadanie 6), pola trafień `userData.project` / `salaId` / `exhibit` (Zadania 3, 4), `dotykowy` z `render.js`.
- Produkuje:
  - `ui.js`: `buildList(lista, plan)`; `bindFocusControl({ onFocusEnd, goToHit, goToRoom })`.
  - DOM: `#list-body > .list-sala[data-sala]` i `.list-item[data-i]`; `#podpis` (podpis przy kursorze).
  - `i18n.js`: angielskie wersje kluczy `muz.*` używanych przez muzeum.

- [ ] **Krok 1: `ui.js`**

1. Pod importem z `render.js` dopisz `import { odleglosciSal } from "muzeum/plan.js";`.
2. W `openPlaque` pierwsza linia ciała: `const t = window.__t || ((klucz, pl) => pl);`; etykieta odnośnika „na żywo”: `Zobacz na żywo ↗` → `${t("muz.naZywo", "Zobacz na żywo")} ↗`; zastępczy napis `"projekt niepubliczny"` → `t("muz.niepubliczny", "projekt niepubliczny")`.
3. Port sterowania:

```js
const focusHooks = { onFocusEnd() {}, goToHit() {}, goToRoom() {} };
function bindFocusControl({ onFocusEnd, goToHit, goToRoom }) {
  focusHooks.onFocusEnd = onFocusEnd;
  focusHooks.goToHit = goToHit;
  if (goToRoom) focusHooks.goToRoom = goToRoom;
}
```

4. Funkcję `buildList` zastąp w całości:

```js
/* Lista eksponatów pogrupowana salami planu, w kolejności spaceru: od wejścia
   przez kolejne drzwi, sale boczne tam, gdzie się do nich wchodzi (Kino i
   Archiwum przy atrium, Pokój Leona między V a VI). Nagłówek sali to przycisk —
   szybka podróż jak z planu w rogu; pozycja — przejazd przed pracę. Praca z
   rzeźbą i obrazem występuje raz, jako rzeźba — tak jak w wycieczce. */
function buildList(lista, plan) {
  const odl = odleglosciSal(plan, plan.sale.find((s) => s.rodzaj === "atrium").id);
  const sale = [...plan.sale].sort((a, b) => odl.get(a.id) - odl.get(b.id) || a.z0 - b.z0 || a.x0 - b.x0);
  const pozycje = [];
  document.getElementById("list-body").innerHTML = sale.map((s) => {
    const wSali = new Map();
    for (const h of lista) {
      const p = h.userData.project;
      if (!p || h.userData.salaId !== s.id) continue;
      if (!wSali.has(p.id) || h.userData.exhibit) wSali.set(p.id, h);
    }
    const items = [...wSali.values()]
      .sort((a, b) => (a.userData.project.date < b.userData.project.date ? -1 : 1))
      .map((h) => {
        const p = h.userData.project;
        pozycje.push(h);
        return `<button class="list-item" type="button" data-i="${pozycje.length - 1}">
          <span class="li-date">${fmtDate(p.date)}</span>${p.title}</button>`;
      }).join("");
    return `<button class="list-sala" type="button" data-sala="${s.id}">${opisSali(s)}</button>${items}`;
  }).join("");
  document.getElementById("list-body").addEventListener("click", (e) => {
    const sala = e.target.closest(".list-sala");
    const poz = e.target.closest(".list-item");
    if (!sala && !poz) return;
    closeList();
    endFocus();
    if (sala) focusHooks.goToRoom(sala.dataset.sala);
    else focusHooks.goToHit(pozycje[Number(poz.dataset.i)]);
  });
}
```

- [ ] **Krok 2: `main.js`**

1. Import z `render.js` uzupełnij o `dotykowy`; pod `const celownik = document.getElementById("celownik");` dopisz `const podpis = document.getElementById("podpis");`.
2. W `celuj(e)` po linii `celownik.classList.toggle("celuje", !!hovered);` dopisz `podpisz(e);`, a pod całą funkcją `celuj` wstaw:

```js

/* Podpis przy kursorze: co zrobi kliknięcie w pracę — „Podejdź · tytuł”.
   Podłogę („idź tutaj”) pokazuje już znacznik. W blokadzie wskaźnika podpis
   stoi pod celownikiem; na dotyku nie ma najechania, więc nie ma podpisu. */
let bylPodpis = "";
function podpisz(e) {
  const p = hovered?.userData.project;
  const tekst = p && !dotykowy && !(focus && hovered === focus.hit) ? `${t("muz.podejdz", "Podejdź")} · ${p.title}` : "";
  if (tekst !== bylPodpis) { podpis.textContent = tekst; podpis.hidden = !tekst; bylPodpis = tekst; }
  if (!tekst) return;
  const x = gracz?.zablokowany() || !e ? innerWidth / 2 : e.clientX;
  const y = gracz?.zablokowany() || !e ? innerHeight / 2 : e.clientY;
  podpis.style.transform = `translate(${Math.round(x + 16)}px, ${Math.round(y + 18)}px)`;
}
```

3. W `podejdz(hit)` po `endFocus();` dopisz `podpis.hidden = true; bylPodpis = "";   // podpis nie jedzie z gościem przez cały przejazd`.
4. Obsługę `pointerleave` zastąp: `renderer.domElement.addEventListener("pointerleave", () => { znacznik.visible = false; hovered = null; podpisz(); });`.
5. W `bindFocusControl({ … })` po `goToHit` dopisz `goToRoom: (id) => nawigacja?.lecDoSali(id),   // nagłówek sali w liście`.
6. `buildList(interaktywne);` → `buildList(interaktywne, plan);`.

- [ ] **Krok 3: `museum.html`**

1. Pod `<div id="celownik" hidden aria-hidden="true"></div>` dopisz:

```html
<!-- Podpis przy kursorze: co zrobi kliknięcie w pracę (main.js: podpisz). -->
<p class="podpis" id="podpis" hidden aria-hidden="true"></p>
```

2. Podpowiedź dotykowa (z Zadania 6) mówi „przeciągnij, żeby się rozejrzeć”, a lewa połowa ekranu to joystick (player.js) — w `<span class="hint-dotyk" …>` tekst zastąp: `Dotknij podłogi, żeby tam pójść, albo pracy, żeby podejść · lewy kciuk idzie, prawy się rozgląda`.
3. Dwie etykiety ARIA bez tłumaczenia (zostały po starym muzeum): do `<a class="hud-back" … aria-label="Wróć do karty budowania">` dopisz `data-i18n-attr="aria-label:muz.wrocKarta"`, a do `<button class="hud-list" id="btn-list" … aria-label="Lista eksponatów">` — `data-i18n-attr="aria-label:muz.listaEksponatow"`.

- [ ] **Krok 4: `css/museum.css`**

Regułę `.list-era { … }` zastąp:

```css
/* Nagłówek sali: przycisk szybkiej podróży (ui.js: buildList). */
.list-sala {
  display: block; width: 100%; text-align: left; cursor: pointer;
  background: none; border: none; padding: 0;
  font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--pulse-dim); margin: 1.6rem 0 0.6rem;
}
.list-sala::after { content: " →"; opacity: 0; transition: opacity 0.15s ease; }
.list-sala:hover, .list-sala:focus-visible { color: var(--pulse); }
.list-sala:hover::after, .list-sala:focus-visible::after { opacity: 1; }
```

pod regułą `.hud-hint.gone { opacity: 0; }` dopisz (na jasnym parkiecie pałacu, w bieli i u Leona szara podpowiedź i bursztynowa nazwa sali ginęły — stara posadzka i stropy były ciemne):

```css
/* Na jasnym parkiecie pałacu i bieli szary napis ginął — pigułka z
   półprzezroczystym tłem, osobna dla każdej linii, gdy tekst się łamie. */
.hint-mysz, .hint-dotyk {
  background: color-mix(in srgb, var(--bg) 70%, transparent); color: var(--ink-dim);
  border-radius: 99px; padding: 0.3rem 0.85rem; line-height: 2.1;
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
/* Nazwa sali: w jasnych salach (biel, Pokój Leona, strop pałacu) bursztyn
   ginął na jasnym tle — ciemna poświata wokół liter, bez ramki. */
.hud-era { text-shadow: 0 0 6px rgba(12, 16, 24, 0.9), 0 0 14px rgba(12, 16, 24, 0.6); }
```

a na końcu pliku dopisz:

```css

/* Podpis przy kursorze (main.js: podpisz) — „Podejdź · tytuł”. Przesuwany
   transformacją, więc nie przelicza układu strony przy każdym ruchu myszy. */
.podpis {
  position: fixed; left: 0; top: 0; z-index: 25; pointer-events: none;
  max-width: min(28rem, 70vw); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.05em; color: var(--ink);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  border: 1px solid var(--line); border-radius: 99px; padding: 0.3rem 0.75rem;
}
.podpis[hidden] { display: none; }
```

- [ ] **Krok 5: `js/i18n.js` — wersja angielska**

1. W `STATYCZNE` dwie podpowiedzi opisują jeszcze stare sterowanie — zastąp je:

```js
    "muz.podpowiedz": "Tap the floor to walk there, or a work to walk up to it · left thumb walks, right thumb looks",
    "muz.podpowiedzMysz": "<b>Click the floor</b> to walk there · drag to look around · click a work to walk up to it · <b>WASD</b> works too",
```

2. Pod `"muz.listaPelna": " of exhibits",` dopisz `"muz.listaEksponatow": "List of exhibits",`.
3. Pod `"muz.wrocKarta": "Back to the building record",` dopisz:

```js
    // Muzeum 3.0 (amfilada): wejście, dźwięk, plan, sale, wydajność
    "muz.tytul": "The Museum of Building",
    "muz.tytulMuzeum": "THE MUSEUM OF BUILDING",
    "muz.wejdzDzwiek": "Enter with sound",
    "muz.wejdzCisza": "Enter in silence",
    "muz.dzwiekWl": "Sound: on",
    "muz.dzwiekWyl": "Sound: off",
    "muz.dzwiekBrak": "Sound unavailable",
    "muz.przerwij": "Stop the tour",
    "muz.brakWycieczki": "There are no featured works to show.",
    "muz.plan": "Map",
    "muz.planMuzeum": "Museum map",
    "muz.kosmos": "Enter the Cosmos →",
    "muz.kosmos.szyld": "Cosmos →",
    "muz.sala.atrium": "Atrium",
    "muz.sala.kino": "Cinema",
    "muz.sala.archiwum": "Archive",
    "muz.sala.leon": "Leon’s Room",
    "muz.typ.ekran": "a screenshot of a working thing",
    "muz.typ.druk": "an AI visualisation",
    "muz.typ.plansza": "a title board",
    "muz.podejdz": "Walk up",
    "muz.zobacz": "View",
    "muz.naZywo": "See it live",
    "muz.niepubliczny": "private project",
    "muz.perf.gtao": "I turned off corner shading to keep the motion smooth.",
    "muz.perf.lustro": "I turned off the reflections in the night floor.",
    "muz.perf.cienie": "I turned off shadows as well — this device can’t keep up.",
    "muz.perf.dpr": "I lowered the image resolution — that’s the last step.",
    "muz.utrata": "The graphics card lost the museum’s picture — on phones this happens when memory runs low.",
    "muz.odswiez": "Reload the museum",
```

Pisownia jak w reszcie słownika: apostrof typograficzny (’), „visualisation”.

Sprawdzenie składni: `node -e "new Function(require('fs').readFileSync('js/i18n.js','utf8')); console.log('ok')"` → `ok`.

- [ ] **Krok 6: Wspólny stempel na trzech stronach**

`i18n.js` zmienił się także dla karty budowania, a konwencja to jedna wersja na trzy strony:

```bash
STEMPEL=$(date +%Y%m%d%H%M)
sed -i '' -E "s/\?v=[0-9]{12}/?v=${STEMPEL}/g" index.html kosmos.html museum.html
grep -ho "?v=[0-9]*" index.html kosmos.html museum.html | sort | uniq -c
```

Expected: jedna linia — wszystkie stemple (na próbie 37) z tą samą wartością. W `index.html` i `kosmos.html` to jedyna zmiana.

- [ ] **Krok 7: `README.md`**

1. W „Struktura” pod linią o `js/i18n.js` dopisz:

```markdown
- `museum.html` + `js/museum/` — Muzeum Budowania (three.js r169, też bez build stepu):
  `plan.js` układa amfiladę sal z danych, `sale.js` i `wystroj.js` ją budują,
  `zawieszenie.js` wiesza prace, `swiatla.js` świeci, `nawigacja.js` prowadzi gościa,
  `dzwiek.js` gra; `?jakosc=wysoki|sredni|niski` w adresie wymusza poziom jakości
```

2. W „Rozwój” przed linią `Deploy: …` dopisz:

````markdown
Testy planu muzeum (czysta logika, bez przeglądarki):

```bash
node --test tests/plan.test.mjs
```

````

3. W „Dodanie projektu” linię zaczynającą się od „- Po zmianie danych podbij” zastąp:

```markdown
- **Muzeum:** praca zawiśnie sama w sali swojej epoki (epoka ponad 10 prac dzieli się na
  dwie sale). Eksponat autorski na podeście to builder w `js/museum/exhibits.js` i wpis w
  `PODSTAWY` tamże.
- Po każdej zmianie podbij wspólny stempel `?v=` — jedna wartość na wszystkich trzech
  stronach: `sed -i '' -E "s/\?v=[0-9]{12}/?v=$(date +%Y%m%d%H%M)/g" index.html kosmos.html museum.html`
```

4. Na końcu, pod linią o przeglądzie z 30 IX, dopisz:

```markdown
Muzeum 3.0 (amfilada sal, która dojrzewa z czasem): Claude Opus 5.5, X 2026 —
`docs/superpowers/specs/2026-10-07-muzeum-amfilada-design.md`.
```

- [ ] **Krok 8: Weryfikacja**

1. Lista, nagłówek sali i podpis (przez `browser_run_code_unsafe`; zrzuty zapisuj pod **bezwzględną** ścieżką `.playwright-mcp/` worktree — względna trafia do katalogu serwera Playwright, czyli do głównego checkoutu):

```js
async (page) => {
  await page.goto("http://localhost:8902/museum.html");
  await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
  await page.locator("#wejdz-cisza").click();
  await page.waitForTimeout(800);
  await page.locator("#btn-list").click();
  const lista = await page.evaluate(() => {
    const w = [];
    let biezaca = null;
    for (const el of document.getElementById("list-body").children) {
      if (el.classList.contains("list-sala")) { biezaca = { id: el.dataset.sala, prac: 0 }; w.push(biezaca); }
      else if (el.classList.contains("list-item")) biezaca.prac++;
    }
    return { sale: w.map((s) => `${s.id}:${s.prac}`), razem: w.reduce((a, s) => a + s.prac, 0),
      unikalnych: new Set([...document.querySelectorAll(".list-item")].map((b) => b.textContent.trim())).size };
  });
  await page.locator('.list-sala[data-sala="leon"]').click();
  const zamknieta = await page.evaluate(() => document.getElementById("list-panel").hidden);
  await page.waitForFunction(() => !window.__mz.nawigacja.aktywna() && window.__mz.swiatla.sala().id === "leon", null, { timeout: 30000 });
  const tytul = await page.evaluate(async () => {
    const m = window.__mz;
    const h = m.interaktywne.find((x) => x.userData.salaId === "e1" && x.userData.project && !x.userData.exhibit);
    m.gracz.teleportuj(h.userData.widok.pozycja.x, h.userData.widok.pozycja.z, h.userData.widok.cel);
    await new Promise((r) => setTimeout(r, 800));
    return h.userData.project.title;
  });
  await page.mouse.move(700, 430);
  await page.mouse.move(720, 440);
  await page.waitForTimeout(200);
  const podpis = await page.evaluate(() => { const p = document.getElementById("podpis"); return { widoczny: !p.hidden, tekst: p.textContent }; });
  return { lista, zamknieta, tytul, podpis, bledy: await page.evaluate(() => window.__errs) };
}
```

Oczekiwane (próba): `sale` = `["atrium:0", "archiwum:0", "kino:0", "e1:5", "e2:1", "e3:4", "e4:2", "e5a:10", "e5b:10", "leon:3", "e6a:10", "e6b:10"]`, `razem` 55 = `unikalnych` 55 (spec §10.3: 52 w salach epok + 3 u Leona), `zamknieta: true`, gość w `leon`, `podpis` = `{ widoczny: true, tekst: "Podejdź · " + tytul }`, `bledy: []`. Zrzut z podpisem przy kursorze.

2. Angielski: `museum.html?lang=en` — ekran wejścia „The Museum of Building / Enter with sound / Enter in silence”; po wejściu HUD „Atrium”, „Sound: off”, „Show me around”, „List of exhibits”, podpowiedź „Click the floor to walk there …”; plan w rogu `aria-label` „Museum map”, sale boczne „Atrium / Cinema / Archive / Leon’s Room”; nagłówki listy po angielsku („I · III–IV 2025 — First experiments” …); tabliczka pracy z odnośnikiem „See it live ↗”. Szukanie polskich słów interfejsu w HUD, podpowiedzi, planie i liście (z `aria-label`) — „Wejdź”, „Dźwięk”, „Oprowadź”, „Lista”, „Kliknij”, „Zamknij”, „Kino”, „Archiwum”, „Pokój”, „Podejdź”, „Zobacz”, „Wróć” — daje pustą listę.
3. Karta budowania (`index.html`, PL i `?lang=en`) i Kosmos (`kosmos.html`) wstają po nowym stemplu bez błędów w konsoli (ostrzeżenia o przestarzałych API three r185 w Kosmosie są stare i poza zakresem).
4. `node --test tests/plan.test.mjs` — 18/18.

- [ ] **Krok 9: Commit**

```bash
git add js/museum/ui.js js/museum/main.js museum.html css/museum.css js/i18n.js README.md index.html kosmos.html
git commit -m "$(cat <<'EOF'
Muzeum: lista salami, podpis przy kursorze, wersja angielska, wspólny stempel

Lista eksponatów w kolejności spaceru, nagłówek sali = szybka podróż;
praca z rzeźbą raz. Najechanie na pracę: „Podejdź · tytuł”. Angielskie
napisy dla wszystkich nowych kluczy muzeum (i dwóch starych etykiet
ARIA). Jeden stempel ?v= na trzech stronach. README: sekcja muzeum.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

---

### Zadanie 12: Odbiór — testy ze specyfikacji, wydajność, zrzuty dla właściciela

Sprawdzenie całości wg §10 specyfikacji na serwerze worktree (`muzeum-worktree`, port 8902), pomiar wydajności na profilu MacBooka, komplet zrzutów stref do oceny właściciela i wpis „Wynik wdrożenia” w specyfikacji. Bez publikacji: push na `main` dopiero po zgodzie właściciela.

**Pliki:**
- Modyfikuj: `docs/superpowers/specs/2026-10-07-muzeum-amfilada-design.md` (sekcja „Wynik wdrożenia” na końcu).
- Sondy i zrzuty: `.playwright-mcp/odbior-*.js|jpeg` w worktree — katalog jest w `.gitignore`, nic z niego nie trafia do repozytorium.

**Interfejsy:**
- Konsumuje: wszystko z Zadań 1–11 przez `window.__mz` (`plan`, `gracz`, `nawigacja`, `swiatla`, `prace`, `interaktywne`, `perf`, `jakosc`, `dzwiek()`, `testRuch`) i DOM (`#wejdz-dzwiek`, `#wejdz-cisza`, `#btn-dzwiek`, `#btn-tura`, `#btn-list`, `.mm-sala[data-id]`, `.mm-przelacz`, `#plaque`, `#kosmos-wejscie`, `#hud-hint`).
- Produkuje: wpis „Wynik wdrożenia”, zrzuty `odbior-*.jpeg` dla właściciela.

**Pułapki narzędzi (z próby — każda kosztowała fałszywy wynik):**
- `browser_run_code_unsafe` z `filename` czyta tylko pliki z worktree — sondy zapisuj do `.playwright-mcp/` worktree.
- Ścieżki zrzutów w sondach **bezwzględne** (`/…/bold-dubinsky-0860c5/.playwright-mcp/…`); względna ląduje w katalogu serwera Playwright, czyli w głównym checkoucie.
- Sesja CDP trzyma swoje emulacje (rozmiar, DPR, dotyk, `prefers-reduced-motion`) do odłączenia, także między wywołaniami — każda sonda kończy się `cdp.detach()` w `finally`. Zrzut przez `page.screenshot` nakłada z powrotem rozmiar Playwrighta, więc zrzuty telefonu rób przy `page.setViewportSize`, nie przy `Emulation.setDeviceMetricsOverride`.
- Przeglądarka pamięta język (`localStorage`) — każda sonda otwiera `museum.html?lang=pl` (albo `?lang=en`) jawnie.

**Kryterium każdego skryptu odbioru:** zwraca `niezgodne: []`. Każda pozycja tej listy to niespełnione oczekiwanie, opisane po polsku. Wartości z próby podane niżej służą do porównania liczb (np. czy fps nie spadło).

- [ ] **Krok 1: Testy planu**

Run: `node --test tests/plan.test.mjs`
Expected: `ℹ tests 18`, `ℹ pass 18`, `ℹ fail 0`.

- [ ] **Krok 2: Odbiór na komputerze (§10.1–3, 5, 6, 8)**

Zapisz jako `.playwright-mcp/odbior-a.js` i uruchom `browser_run_code_unsafe` z `filename` (pełna ścieżka):

```js
async (page) => {
  const ADRES = "http://localhost:8902";
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
    const zle = [];
    page.on("response", (r) => { if (r.status() >= 400) zle.push(`${r.status()} ${r.url()}`); });
    page.on("console", (m) => { if (m.type() === "error") zle.push(`konsola: ${m.text()}`); });
    await page.goto(`${ADRES}/museum.html?lang=pl`);
    await page.locator("#wejdz-dzwiek").waitFor({ state: "visible" });
    await page.locator("#wejdz-dzwiek").click();
    const wynik = {};

    // §10.1–3 i 8: scena żyje, plan zgodny z danymi, dźwięk ruszył
    wynik.start = await page.evaluate(() => {
      const m = window.__mz;
      m.renderer.info.autoReset = false; m.renderer.info.reset(); m.composer.render();
      const wywolan = m.renderer.info.render.calls;
      m.renderer.info.autoReset = true;
      const prace = new Set(m.interaktywne.filter((h) => h.userData.project).map((h) => h.userData.project.id));
      return { poziom: m.jakosc.nazwa, audio: m.dzwiek()?.ctx.state, wywolan, sal: m.plan.sale.length, prac: prace.size, projektow: PROJECTS.length };
    });

    // §10.4: przejazd z atrium do drugiej sali VI — prawdziwy klik w planie, cała droga przez drzwi
    const t0 = Date.now();
    await page.locator('.mm-sala[data-id="e6b"]').click();
    await page.waitForTimeout(300);
    await page.waitForFunction(() => !window.__mz.nawigacja.aktywna(), null, { timeout: 90000 });
    wynik.przejazdE6b = { sala: await page.evaluate(() => window.__mz.swiatla.sala().id), sekund: Math.round((Date.now() - t0) / 100) / 10 };

    // §10.5a: prawdziwy klik w podłogę — cel liczony tym samym promieniem, którym celuje main.js
    const celPodlogi = await page.evaluate(async () => {
      const m = window.__mz;
      m.gracz.teleportuj(0, -6.5, { x: 0, z: 10 });
      await new Promise((r) => setTimeout(r, 400));
      const v = m.camera.position.clone().set(0, -(700 / innerHeight) * 2 + 1, 0.5).unproject(m.camera).sub(m.camera.position).normalize();
      const t = -m.camera.position.y / v.y;
      return { x: m.camera.position.x + v.x * t, z: m.camera.position.z + v.z * t };
    });
    await page.mouse.click(720, 700);
    await page.waitForTimeout(300);
    await page.waitForFunction(() => !window.__mz.nawigacja.aktywna(), null, { timeout: 30000 });
    wynik.klikPodlogi = await page.evaluate((c) => ({ odchylenie: +Math.hypot(window.__mz.gracz.pozycjaX() - c.x, window.__mz.gracz.pozycjaZ() - c.z).toFixed(3) }), celPodlogi);

    // §10.5b: prawdziwy klik w pracę z 6 m — dojście przed pracę i tabliczka
    const praca = await page.evaluate(async () => {
      const m = window.__mz;
      const h = m.interaktywne.find((x) => x.userData.salaId === "e3" && x.userData.project && !x.userData.exhibit);
      const { pozycja, cel } = h.userData.widok;
      const dal = 6 / Math.hypot(pozycja.x - cel.x, pozycja.z - cel.z);
      m.gracz.teleportuj(cel.x + (pozycja.x - cel.x) * dal, cel.z + (pozycja.z - cel.z) * dal, cel);
      await new Promise((r) => setTimeout(r, 500));
      return { tytul: h.userData.project.title, x: pozycja.x, z: pozycja.z };
    });
    await page.mouse.click(720, 450);
    await page.waitForTimeout(300);
    await page.waitForFunction(() => !window.__mz.nawigacja.aktywna() && !document.getElementById("plaque").hidden, null, { timeout: 30000 });
    wynik.klikPracy = await page.evaluate((p) => ({
      odchylenie: +Math.hypot(window.__mz.gracz.pozycjaX() - p.x, window.__mz.gracz.pozycjaZ() - p.z).toFixed(3),
      tabliczka: document.getElementById("plaque-title").textContent === p.tytul,
    }), praca);
    await page.keyboard.press("Escape");

    // §10.6: kolizje — ściana, podest, ławka (klawisz W przez 2 s)
    wynik.kolizje = await page.evaluate(async () => {
      const m = window.__mz;
      const V = m.camera.position.constructor;
      const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
      const pchaj = async (x, z, cel) => {
        m.gracz.teleportuj(x, z, cel);
        await czekaj(300);
        m.testRuch = { KeyW: true };
        await czekaj(2000);
        m.testRuch = null;
        await czekaj(300);
        return { x: m.gracz.pozycjaX(), z: m.gracz.pozycjaZ() };
      };
      const sciana = await pchaj(3, 6, new V(20, 1.7, 6));               // sala I, lico ściany x+ na 5,8
      const podest = m.plan.sale.find((s) => s.id === "e5a").podstawy.find((p) => p.rodzaj === "podest");
      const przyPodescie = await pchaj(podest.x - 4.2 * Math.sign(podest.x), podest.z, new V(podest.x, 1, podest.z));
      const lawka = m.plan.sale.find((s) => s.id === "e1").lawki[0];
      const przyLawce = await pchaj(lawka.x + 3, lawka.z, new V(lawka.x, 0.4, lawka.z));
      return { sciana: +sciana.x.toFixed(2), podest: +Math.abs(przyPodescie.x - podest.x).toFixed(2), lawka: +(przyLawce.x - lawka.x).toFixed(2) };
    });
    wynik.zle = zle;
    wynik.bledy = await page.evaluate(() => window.__errs);
    const niezgodne = [];
    const sprawdz = (warunek, opis) => { if (!warunek) niezgodne.push(opis); };
    sprawdz(wynik.start.poziom === "wysoki", "poziom jakości (oczekiwany wysoki)");
    sprawdz(wynik.start.audio === "running", "dźwięk nie ruszył");
    sprawdz(wynik.start.wywolan > 0, "scena nie rysuje");
    sprawdz(wynik.start.sal === 12 && wynik.start.prac === wynik.start.projektow, "plan niezgodny z danymi");
    sprawdz(wynik.przejazdE6b.sala === "e6b", "przejazd do drugiej sali VI");
    sprawdz(wynik.klikPodlogi.odchylenie < 0.3, "klik w podłogę poza tolerancją");
    sprawdz(wynik.klikPracy.odchylenie < 0.3 && wynik.klikPracy.tabliczka, "klik w pracę");
    sprawdz(wynik.kolizje.sciana < 5.5, "kolizja ze ścianą");
    sprawdz(wynik.kolizje.podest >= 1.8, "kolizja z podestem");
    sprawdz(wynik.kolizje.lawka >= 0.5, "kolizja z ławką");
    sprawdz(zle.length === 0 && wynik.bledy.length === 0, "błędy w konsoli albo w sieci");
    wynik.niezgodne = niezgodne;
    return wynik;
  } finally {
    await cdp.detach();
  }
}
```

Oczekiwane (próba w nawiasach): `start` = `{ poziom: "wysoki", audio: "running", wywolan > 0 (1439), sal: 12, prac: 55, projektow: 55 }`; `przejazdE6b.sala === "e6b"` (15,1 s, bez zaklinowania); `klikPodlogi.odchylenie < 0.3` (0,087); `klikPracy` = `{ odchylenie < 0.3 (0,058), tabliczka: true }`; `kolizje.sciana < 5.5` (5,45), `kolizje.podest >= 1.8` (1,85), `kolizje.lawka >= 0.5` (0,63 — kapsuła zatrzymana przed ławką, nie na niej); `zle: []`, `bledy: []`.

- [ ] **Krok 3: Plan w rogu, wycieczka, wejście w ciszy (§10.4, 7, 8)**

`.playwright-mcp/odbior-b.js` — przy `prefers-reduced-motion` (przejazdy jako przenikanie; to sprawdza też tę ścieżkę):

```js
async (page) => {
  const ADRES = "http://localhost:8902";
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    const zle = [];
    page.on("response", (r) => { if (r.status() >= 400) zle.push(`${r.status()} ${r.url()}`); });
    page.on("console", (m) => { if (m.type() === "error") zle.push(`konsola: ${m.text()}`); });
    const wynik = {};
    await page.goto(`${ADRES}/museum.html?lang=pl`);
    await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
    await page.locator("#wejdz-cisza").click();
    wynik.cisza = await page.evaluate(() => ({ dzwiek: window.__mz.dzwiek(), przycisk: document.getElementById("btn-dzwiek").textContent }));

    // §10.4: każda sala osiągalna z planu w rogu
    wynik.sale = {};
    for (const id of await page.evaluate(() => window.__mz.plan.sale.map((s) => s.id))) {
      await page.locator(`.mm-sala[data-id="${id}"]`).click();
      await page.waitForTimeout(150);
      await page.waitForFunction(() => !window.__mz.nawigacja.aktywna(), null, { timeout: 20000 });
      wynik.sale[id] = await page.evaluate(() => window.__mz.swiatla.sala().id);
    }

    // §10.7: wycieczka — prawdziwy klik „Oprowadź mnie”, tytuły z tabliczki w kolejności
    await page.evaluate(() => {
      window.__przystanki = [];
      new MutationObserver(() => {
        const t = document.getElementById("plaque-title").textContent;
        if (!document.getElementById("plaque").hidden && window.__przystanki.at(-1) !== t) window.__przystanki.push(t);
      }).observe(document.getElementById("plaque"), { attributes: true, childList: true, subtree: true });
      window.__mz.gracz.teleportuj(0, -6.5);
    });
    const t0 = Date.now();
    await page.locator("#btn-tura").click();
    await page.waitForTimeout(500);
    await page.waitForFunction(() => !window.__mz.nawigacja.trwaWycieczka(), null, { timeout: 180000, polling: 500 });
    wynik.wycieczka = await page.evaluate(async () => {
      const { wyroznione } = await import("muzeum/plan.js");   // źródło prawdy: miesiące rosnąco, w miesiącu kolejność sal
      const oczekiwane = wyroznione(window.__mz.plan).map((w) => w.projekt.title);
      return { przystankow: window.__przystanki.length, zgodna: JSON.stringify(window.__przystanki) === JSON.stringify(oczekiwane), pierwszy: window.__przystanki[0], ostatni: window.__przystanki.at(-1) };
    });
    wynik.wycieczka.sekund = Math.round((Date.now() - t0) / 1000);
    wynik.zle = zle;
    wynik.bledy = await page.evaluate(() => window.__errs);
    const niezgodne = [];
    const sprawdz = (warunek, opis) => { if (!warunek) niezgodne.push(opis); };
    sprawdz(wynik.cisza.dzwiek === null, "wejście w ciszy utworzyło kontekst audio");
    sprawdz(Object.keys(wynik.sale).length === 12 && Object.entries(wynik.sale).every(([id, gdzie]) => id === gdzie), "sala nieosiągalna z planu w rogu");
    sprawdz(wynik.wycieczka.przystankow > 0 && wynik.wycieczka.zgodna, "wycieczka: inne przystanki albo kolejność");
    sprawdz(zle.length === 0 && wynik.bledy.length === 0, "błędy w konsoli albo w sieci");
    wynik.niezgodne = niezgodne;
    return wynik;
  } finally {
    await cdp.detach();
  }
}
```

Oczekiwane: `cisza` = `{ dzwiek: null, przycisk: "Dźwięk: wył." }`; `sale` — każdy klucz równy wartości (12 sal, np. `"leon": "leon"`); `wycieczka` = `{ przystankow: 12, zgodna: true, pierwszy: "Agent AI Bajarz", ostatni: "Trener LEK" }` (próba: 87 s); `zle: []`, `bledy: []`.

- [ ] **Krok 4: Telefon 390 × 844 (§10.9)**

`.playwright-mcp/odbior-c.js`:

```js
async (page) => {
  const ADRES = "http://localhost:8902";
  const W = "/Users/mpawelczuk/omniportoflio/.claude/worktrees/bold-dubinsky-0860c5/.playwright-mcp";
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    const dotyk = (typ, punkty) => cdp.send("Input.dispatchTouchEvent", { type: typ, touchPoints: punkty.map(([x, y], id) => ({ x, y, id })) });
    const stuknij = async (sel) => {
      const b = await page.locator(sel).boundingBox();
      await dotyk("touchStart", [[b.x + b.width / 2, b.y + b.height / 2]]);
      await dotyk("touchEnd", []);
      await page.waitForTimeout(150);
    };
    const zle = [];
    page.on("response", (r) => { if (r.status() >= 400) zle.push(`${r.status()} ${r.url()}`); });
    page.on("console", (m) => { if (m.type() === "error") zle.push(`konsola: ${m.text()}`); });
    await page.goto(`${ADRES}/museum.html?lang=pl`);
    await page.locator("#wejdz-dzwiek").waitFor({ state: "visible" });
    await stuknij("#wejdz-dzwiek");
    await page.waitForTimeout(1200);
    const stan = () => page.evaluate(() => {
      const e = new window.__mz.camera.rotation.constructor().setFromQuaternion(window.__mz.camera.quaternion, "YXZ");
      return { x: window.__mz.gracz.pozycjaX(), z: window.__mz.gracz.pozycjaZ(), odchylenie: e.y };
    });
    const wynik = {};
    wynik.uklad = await page.evaluate(() => {
      const gora = (sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top);
      return {
        poziom: window.__mz.jakosc.nazwa, audio: window.__mz.dzwiek()?.ctx.state,
        jedenWiersz: new Set(["#btn-dzwiek", "#btn-tura", "#btn-list", ".hud-back"].map(gora)).size === 1,
        planSvg: getComputedStyle(document.querySelector("#minimapa svg")).display,
        przyciskPlanu: getComputedStyle(document.querySelector(".mm-przelacz")).display,
        wBok: document.documentElement.scrollWidth > innerWidth,
      };
    });
    await page.screenshot({ path: `${W}/odbior-telefon.jpeg`, type: "jpeg", quality: 85 });
    await stuknij(".mm-przelacz");
    wynik.planOtwarty = await page.evaluate(() => ({ svg: getComputedStyle(document.querySelector("#minimapa svg")).display, szer: Math.round(document.querySelector("#minimapa svg").getBoundingClientRect().width), wBok: document.documentElement.scrollWidth > innerWidth }));
    await stuknij(".mm-przelacz");

    // dotknięcie podłogi przed sobą → przejazd
    const p0 = await stan();
    await dotyk("touchStart", [[195, 640]]);
    await dotyk("touchEnd", []);
    await page.waitForTimeout(300);
    const ruszyl = await page.evaluate(() => window.__mz.nawigacja.aktywna());
    await page.waitForFunction(() => !window.__mz.nawigacja.aktywna(), null, { timeout: 20000 });
    const p1 = await stan();
    wynik.dotknieciePodlogi = { ruszyl, przeszedl: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2) };

    // lewy kciuk: joystick w górę = naprzód
    await dotyk("touchStart", [[90, 600]]);
    for (let i = 1; i <= 10; i++) { await dotyk("touchMove", [[90, 600 - i * 6]]); await page.waitForTimeout(100); }
    await dotyk("touchEnd", []);
    await page.waitForTimeout(400);
    const p2 = await stan();
    wynik.joystick = { przeszedl: +Math.hypot(p2.x - p1.x, p2.z - p1.z).toFixed(2) };

    // prawy kciuk: przeciągnięcie obraca kamerę (różnica kątów sprowadzona do (−π, π])
    await dotyk("touchStart", [[300, 420]]);
    for (let i = 1; i <= 8; i++) { await dotyk("touchMove", [[300 - i * 10, 420]]); await page.waitForTimeout(30); }
    await dotyk("touchEnd", []);
    await page.waitForTimeout(200);
    const p3 = await stan();
    const d = p3.odchylenie - p2.odchylenie;
    wynik.rozgladanie = { obrot: +Math.atan2(Math.sin(d), Math.cos(d)).toFixed(3) };
    wynik.zle = zle;
    wynik.bledy = await page.evaluate(() => window.__errs);
    const niezgodne = [];
    const sprawdz = (warunek, opis) => { if (!warunek) niezgodne.push(opis); };
    sprawdz(wynik.uklad.poziom === "niski", "poziom na telefonie (oczekiwany niski)");
    sprawdz(wynik.uklad.audio === "running", "dźwięk na telefonie");
    sprawdz(wynik.uklad.jedenWiersz, "nagłówek nie mieści się w jednym wierszu");
    sprawdz(wynik.uklad.planSvg === "none" && wynik.uklad.przyciskPlanu !== "none", "plan nie jest zwinięty do przycisku");
    sprawdz(wynik.planOtwarty.svg === "block", "plan się nie rozwija");
    sprawdz(!wynik.uklad.wBok && !wynik.planOtwarty.wBok, "przewijanie w bok");
    sprawdz(wynik.dotknieciePodlogi.ruszyl && wynik.dotknieciePodlogi.przeszedl > 2, "dotknięcie podłogi nie prowadzi");
    sprawdz(wynik.joystick.przeszedl > 1, "joystick nie prowadzi");
    sprawdz(Math.abs(wynik.rozgladanie.obrot) > 0.05, "prawy kciuk nie obraca kamery");
    sprawdz(zle.length === 0 && wynik.bledy.length === 0, "błędy w konsoli albo w sieci");
    wynik.niezgodne = niezgodne;
    return wynik;
  } finally {
    await cdp.detach();
    await page.setViewportSize({ width: 1440, height: 900 });
  }
}
```

Oczekiwane (próba): `uklad` = `{ poziom: "niski", audio: "running", jedenWiersz: true, planSvg: "none", przyciskPlanu: "flex", wBok: false }`; `planOtwarty` = `{ svg: "block", szer: 358, wBok: false }`; `dotknieciePodlogi` = `{ ruszyl: true, przeszedl > 2 (6,09) }`; `joystick.przeszedl > 1` (4,19); `rozgladanie.obrot` różny od 0 (≈ 0,25 rad przy 80 px); `zle: []`, `bledy: []`. Na zrzucie: nagłówek w jednym wierszu (←, głośnik, „Oprowadź mnie”, „Lista”, PL/EN), pod nim nazwa sali, niżej przycisk „Plan”.

- [ ] **Krok 5: Wydajność (§10.10)**

Na profilu MacBooka (1440 × 900, DPR 2), poziom z detekcji (wysoki), 5 s pomiaru w najgorszym kadrze atrium i w sali nocy z lustrem:

```js
async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
    await page.goto("http://localhost:8902/museum.html?lang=pl");
    await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
    await page.locator("#wejdz-cisza").click();
    return await page.evaluate(async () => {
      const m = window.__mz;
      const czekaj = (ms) => new Promise((r) => setTimeout(r, ms));
      // klatki NARYSOWANE (composer.render), nie wywołania rAF — w bezruchu pętla pomija rysowanie
      let narysowane = 0;
      const render = m.composer.render.bind(m.composer);
      m.composer.render = (...a) => { narysowane++; return render(...a); };
      const fps = async (ms, { aktywny = true } = {}) => {
        // gość „rusza myszą” co 100 ms — inaczej oszczędzanie w bezruchu zaniżyłoby pomiar
        const iv = aktywny ? setInterval(() => dispatchEvent(new PointerEvent("pointermove")), 100) : null;
        const n0 = narysowane, t0 = performance.now();
        await czekaj(ms);
        clearInterval(iv);
        return Math.round(((narysowane - n0) * 1000) / (performance.now() - t0));
      };
      await czekaj(1500);
      m.gracz.teleportuj(0, -6.5, { x: 0, z: 100 });
      await czekaj(1500);
      const atrium = await fps(5000);
      const noc = m.plan.sale.find((s) => s.styl === "noc");
      m.gracz.teleportuj(0, noc.z0 + 2.5, { x: 0, z: noc.z1 });
      await czekaj(2500);
      const wNocy = await fps(5000);
      // bezruch: bez wejścia gościa pętla zwalnia — po 25 s ok. 4 klatki na sekundę
      await czekaj(25000);
      const bezruch = await fps(4000, { aktywny: false });
      const wynik = { poziom: m.jakosc.nazwa, dpr: m.renderer.getPixelRatio(), atrium, wNocy, bezruch, lustro: !!m.swiatla.lustro?.visible, perf: m.perf.wykonane(), bledy: window.__errs };
      const niezgodne = [];
      const sprawdz = (warunek, opis) => { if (!warunek) niezgodne.push(opis); };
      sprawdz(wynik.poziom === "wysoki" && wynik.dpr === 1.5, "poziom albo DPR");
      sprawdz(wynik.atrium >= 60, "atrium poniżej 60 fps");
      sprawdz(wynik.wNocy >= 60, "sala nocy poniżej 60 fps");
      sprawdz(wynik.lustro, "lustro w sali nocy niewidoczne");
      sprawdz(wynik.bezruch <= 6, "bezruch nie oszczędza klatek");
      sprawdz(wynik.perf.length === 0, "strażnik wydajności zdegradował scenę");
      sprawdz(wynik.bledy.length === 0, "błędy");
      wynik.niezgodne = niezgodne;
      return wynik;
    });
  } finally {
    await cdp.detach();
  }
}
```

Oczekiwane: `poziom: "wysoki"`, `dpr: 1.5`, `atrium >= 60` (próba: 79), `wNocy >= 60` (96), `lustro: true`, `perf: []`, `bledy: []`. Telefon (≥ 30 fps na niskim poziomie) mierzy właściciel na swoim urządzeniu — emulacja w przeglądarce na komputerze liczy kartą komputera.

- [ ] **Krok 6: Zrzuty dla właściciela (§10.11)**

`.playwright-mcp/odbior-d.js` — kadry ustalone na próbie:

```js
async (page) => {
  const W = "/Users/mpawelczuk/omniportoflio/.claude/worktrees/bold-dubinsky-0860c5/.playwright-mcp";
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:8902/museum.html?lang=pl");
  await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
  await page.screenshot({ path: `${W}/odbior-wejscie.jpeg`, type: "jpeg", quality: 88 });
  await page.locator("#wejdz-cisza").click();
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById("hud-hint").classList.add("gone"));
  // [plik, x, z, patrz x, y, z]
  const KADRY = [
    ["atrium", 0, -15, 0, 2.2, 20],                // widok na wylot przez wszystkie sale
    ["atrium-wstecz", 0, -3.5, 0, 3.6, -16],       // drzwi wejściowe i tytuł muzeum
    ["palac", -4.8, 1.2, 4, 1.6, 11],
    ["biel", -5, 22.6, 4, 1.7, 31],
    ["noc", -6, 43.2, 3.5, 1.4, 58],
    ["kino", 9.4, -8, 18, 2.3, -8],
    ["archiwum", -9.2, -8, -18, 1.4, -8],
    ["leon", 7.9, 76.2, 14, 0.8, 81.5],
    ["kosmos", 0, 133.6, 0, 2.0, 140],
  ];
  const wynik = {};
  for (const [plik, x, z, px, py, pz] of KADRY) {
    await page.evaluate(([x, z, px, py, pz]) => window.__mz.gracz.teleportuj(x, z, { x: px, y: py, z: pz }), [x, z, px, py, pz]);
    await page.waitForTimeout(2800);   // adaptacja oka, przesiadka puli świateł, obrazy
    wynik[plik] = await page.evaluate(() => window.__mz.swiatla.sala().id);
    await page.screenshot({ path: `${W}/odbior-${plik}.jpeg`, type: "jpeg", quality: 88 });
  }
  wynik.kosmosPrzycisk = await page.evaluate(() => !document.getElementById("kosmos-wejscie").hidden);
  wynik.bledy = await page.evaluate(() => window.__errs);
  const OCZEKIWANE = { atrium: "atrium", "atrium-wstecz": "atrium", palac: "e1", biel: "e3", noc: "e5a", kino: "kino", archiwum: "archiwum", leon: "leon", kosmos: "e6b" };
  wynik.niezgodne = [
    ...Object.entries(OCZEKIWANE).filter(([kadr, sala]) => wynik[kadr] !== sala).map(([kadr]) => `kadr „${kadr}” poza swoją salą`),
    ...(wynik.kosmosPrzycisk ? [] : ["brak przycisku przejścia do Kosmosu"]),
    ...(wynik.bledy.length ? ["błędy"] : []),
  ];
  return wynik;
}
```

Oczekiwane: `atrium`/`atrium-wstecz` → `"atrium"`, `palac` → `"e1"`, `biel` → `"e3"`, `noc` → `"e5a"`, `kino` → `"kino"`, `archiwum` → `"archiwum"`, `leon` → `"leon"`, `kosmos` → `"e6b"`, `kosmosPrzycisk: true`, `bledy: []`. Obejrzyj każdy zrzut przed pokazaniem: w bieli narożniki gładkie (bez kropek), w nocy jasne interfejsy czytelne (nie białe plamy), w Archiwum wszystkie karty szuflad czytelne, w nagłówku nazwa sali widoczna także w jasnych salach. Zrzuty (`odbior-wejscie`, 9 kadrów, `odbior-telefon` z kroku 4) przekaż właścicielowi do oceny.

- [ ] **Krok 7: PL i EN (§10.12)**

```js
async (page) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:8902/museum.html?lang=en");
  await page.locator("#wejdz-cisza").waitFor({ state: "visible" });
  const wejscie = await page.evaluate(() => [...document.querySelectorAll("#wejscie h1, #wejscie button")].map((e) => e.textContent));
  await page.locator("#wejdz-cisza").click();
  await page.waitForTimeout(600);
  await page.locator("#btn-list").click();
  const wynik = await page.evaluate(() => {
    const SLOWA = ["Wejdź", "Dźwięk", "Oprowadź", "Lista", "Kliknij", "Zamknij", "Plan muzeum", "Kino", "Archiwum", "Pokój", "Podejdź", "Zobacz", "Odśwież", "Wróć"];
    const tekst = [...document.querySelectorAll("header, .hud-hint, #minimapa, #list-panel, #kosmos-wejscie, #wejscie")]
      .map((e) => e.innerText + " " + [e, ...e.querySelectorAll("[aria-label]")].map((x) => x.getAttribute("aria-label") ?? "").join(" ")).join(" ");
    return { sala: document.getElementById("hud-era").textContent, dzwiek: document.getElementById("btn-dzwiek").getAttribute("aria-label"), polskie: SLOWA.filter((s) => tekst.includes(s)), bledy: window.__errs };
  });
  await page.locator("#list-close").click();
  await page.goto("http://localhost:8902/museum.html?lang=pl");   // przeglądarka zostaje przy polskim
  const niezgodne = [];
  if (JSON.stringify(wejscie) !== JSON.stringify(["The Museum of Building", "Enter with sound", "Enter in silence"])) niezgodne.push("ekran wejścia po angielsku");
  if (wynik.sala !== "Atrium") niezgodne.push("nazwa sali po angielsku");
  if (wynik.dzwiek !== "Sound: off") niezgodne.push("przycisk dźwięku po angielsku");
  if (wynik.polskie.length) niezgodne.push(`polskie słowa w wersji angielskiej: ${wynik.polskie.join(", ")}`);
  if (wynik.bledy.length) niezgodne.push("błędy");
  return { wejscie, ...wynik, niezgodne };
}
```

Oczekiwane: `wejscie` = `["The Museum of Building", "Enter with sound", "Enter in silence"]`, `sala: "Atrium"`, `dzwiek: "Sound: off"`, `polskie: []`, `bledy: []`. Karta budowania (`index.html`, PL i `?lang=en`) i Kosmos wstają bez błędów w konsoli.

- [ ] **Krok 8: „Wynik wdrożenia” w specyfikacji**

Na końcu `docs/superpowers/specs/2026-10-07-muzeum-amfilada-design.md` dopisz sekcję z wartościami **zmierzonymi w krokach 1–7** (w nawiasach wartości z próby, z którymi je porównaj):

```markdown
## Wynik wdrożenia

Odbiór wg §10 na serwerze lokalnym, profil MacBooka 1440 × 900 przy DPR 2.

| test | wynik |
|---|---|
| 1. błędy, 404 | zero w `__errs`, w konsoli i w odpowiedziach sieci |
| 2. scena | wywołania rysowania > 0 (próba: 1439 w atrium) |
| 3. plan | 12 sal, 55 prac = 55 projektów (52 w salach epok + 3 u Leona); test planu 18/18 |
| 4. przejazdy | atrium → druga sala VI przez wszystkie drzwi bez zaklinowania (15,1 s); każda z 12 sal osiągalna z planu w rogu |
| 5. klik | podłoga: odchylenie 0,087 m; praca: 0,058 m i tabliczka (tolerancja 0,3 m) |
| 6. kolizje | ściana, podest, ławka — zatrzymanie |
| 7. wycieczka | 12 wyróżnionych, miesiące rosnąco, w miesiącu kolejność sal |
| 8. dźwięk | z dźwiękiem: `running`; przełącznik wycisza; w ciszy kontekst nie powstaje |
| 9. telefon | poziom niski, nagłówek w jednym wierszu, plan zwinięty, brak przewijania w bok, dotyk, joystick, rozglądanie |
| 10. fps | atrium na wylot 79, sala nocy z lustrem 96 (wysoki: DPR 1,5) |
| 11. zrzuty | atrium (×2), pałac, biel, noc, Kino, Archiwum, Pokój Leona, drzwi Kosmosu, ekran wejścia, telefon — u właściciela |
| 12. PL/EN | komplet napisów w obu językach |

**Odstępstwa od specyfikacji (z pomiaru):**
- Wysoki poziom ma DPR 1,5, nie 1,75: przy 1,75 atrium na wylot dawało 58–61 fps, przy 1,5 — 79.
- GTAO zawsze w połowie rozdzielczości (różnica w obrazie < 1/255) i bez odszumiania Poissona, które kropkowało narożniki w bieli.
- Jasne zrzuty w strefach nocy i Kina przygaszone do średniej jasności 0,3 (inaczej świeciły jak lampy).

**Do oceny właściciela:** zrzuty stref; faktura tynku atrium (wielkie, jasne ściany pokazują plamy faktury — świadomie zostawione do decyzji); pomiar fps na telefonie.
```

Jeśli którakolwiek wartość odbiega od próby (fps niżej, inny przystanek, błąd w konsoli) — wpisz zmierzoną, a odchylenie opisz pod tabelą zamiast je wygładzać.

- [ ] **Krok 9: Commit**

```bash
git add docs/superpowers/specs/2026-10-07-muzeum-amfilada-design.md
git commit -m "$(cat <<'EOF'
Muzeum: wynik wdrożenia w specyfikacji — odbiór wg §10, pomiary, odstępstwa

Komplet testów ze specyfikacji, fps na profilu MacBooka, zrzuty stref
u właściciela. Odstępstwa z pomiaru: DPR 1,5 na wysokim poziomie, GTAO
w połowie bez odszumiania, przygaszone jasne zrzuty w strefach ciemnych.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Krok 10: Stop przed publikacją**

Bez `git push`. Pokaż właścicielowi zrzuty i tabelę „Wynik wdrożenia”, zapytaj o zgodę na publikację (push na `main` → GitHub Pages) albo o poprawki. Publikacja to osobna decyzja, jak przy „Monitorze”.
