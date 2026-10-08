/* Testy planu budynku — czysta logika, bez przeglądarki i bez zależności.
   Uruchomienie z korzenia repozytorium: node --test tests/plan.test.mjs */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { zbudujPlan, salaPod, trasa, odleglosciSal, punktWejscia, wyroznione, rozmiesc, strefaEpoki, POJ, DRZWI_SZ } from "../js/museum/plan.js";

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
  // Tylko niezmienniki na danych żywych: liczba sal zależy od liczby prac, nie od identyfikatorów.
  for (const s of plan.sale) if (s.rodzaj === "epoka") assert.ok(s.prace.length <= POJ, `${s.id}: ${s.prace.length}`);
  for (const era of DANE.ERAS) {
    const n = DANE.PROJECTS.filter((p) => p.era === era.id && !p.cat.includes("leon")).length;
    assert.equal(plan.sale.filter((s) => s.epoka === era.id).length, Math.ceil(n / POJ), `epoka ${era.id}: ${n} prac`);
  }
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

test("odleglosciSal: przejścia od sali — amfilada kolejno, każda sala osiągalna, za progiem o jedno", () => {
  const odl = odleglosciSal(plan, "atrium");
  assert.equal(odl.get("atrium"), 0);
  assert.equal(odl.size, plan.sale.length);
  osiowe.slice(1).forEach((s, i) => assert.equal(odl.get(s.id), i + 1, s.id));
  for (const d of plan.drzwi) if (d.b) assert.equal(Math.abs(odl.get(d.a) - odl.get(d.b)), 1, d.id);
  assert.equal(odleglosciSal(plan, "leon").get("leon"), 0);
});

test("wycieczka: wszystkie wyróżnione, w kolejności dat", () => {
  const w = wyroznione(plan);
  assert.equal(w.length, DANE.PROJECTS.filter((p) => p.featured).length);
  for (let i = 1; i < w.length; i++) assert.ok(w[i - 1].projekt.date <= w[i].projekt.date);
});

// Budżet spaceru ze specyfikacji, nie błąd danych: od wejścia do drzwi Kosmosu 120–170 m.
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

// Fikstury: własne ERAS i PROJECTS, niezależne od danych żywych.
const praca = (id, era, extra = {}) => ({ id, era, cat: [], date: "2020-01-01", featured: false, ...extra });
const epoki = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, title: `Epoka ${i + 1}`, range: `${i + 1}` }));

// Pokój Leona stoi przy sali gospodarza i łączy się z nią drzwiami na wspólnym murze;
// każda praca z fikstury wisi dokładnie raz.
function sprawdzPokojLeona(p, epokaGospodarza, projekty) {
  const leon = p.sale.find((s) => s.id === "leon");
  assert.ok(leon, "brak pokoju Leona");
  const d = p.drzwi.find((q) => q.b === "leon");
  assert.ok(d, "brak drzwi do pokoju Leona");
  const gospodarz = p.sale.find((s) => s.id === d.a);
  assert.ok(gospodarz, `drzwi prowadzą do nieistniejącej sali ${d.a}`);
  assert.equal(gospodarz.epoka, epokaGospodarza, "zły gospodarz pokoju Leona");
  assert.ok(blisko(leon.x0, gospodarz.x1) && blisko(d.x, gospodarz.x1), "drzwi nie leżą na wspólnym murze");
  assert.ok(d.z > gospodarz.z0 && d.z < gospodarz.z1, "drzwi poza salą gospodarza");
  // Rezerwowany pas przy drzwiach: prace na tej samej ścianie co drzwi nie wiszą na otworze.
  for (const w of gospodarz.prace.filter((x) => x.sciana === "x+")) assert.ok(Math.abs(w.t - d.z) >= w.szer / 2 + DRZWI_SZ / 2 + 0.3, `${w.projekt.id} wisi na drzwiach do Leona`);
  const ids = p.sale.flatMap((s) => s.prace.map((x) => x.projekt.id));
  assert.deepEqual(ids.sort(), projekty.map((x) => x.id).sort());
}

test("pokój Leona bez prac w swojej epoce dołącza do następnej epoki z salami", () => {
  const projekty = [praca("a1", 1), praca("leon1", 2, { cat: ["leon"] }), praca("c1", 3)];
  sprawdzPokojLeona(zbudujPlan({ ERAS: epoki(3), PROJECTS: projekty }), 3, projekty);
});

test("pokój Leona, gdy żadna późniejsza epoka nie ma prac, dołącza do ostatniej epoki z salami", () => {
  const projekty = [praca("a1", 1), praca("b1", 2), praca("leon1", 3, { cat: ["leon"] })];
  sprawdzPokojLeona(zbudujPlan({ ERAS: epoki(3), PROJECTS: projekty }), 2, projekty);
});

test("bez żadnej sali epoki zbudujPlan zgłasza czytelny błąd, nie TypeError", () => {
  const projekty = [praca("leon1", 1, { cat: ["leon"] })];
  assert.throws(() => zbudujPlan({ ERAS: epoki(1), PROJECTS: projekty }), /zbudujPlan: brak sali epoki, do której można dołączyć Pokój Leona/);
});

test("podział epoki: 10, 11, 20 i 21 prac daje 1, 2, 2 i 3 sale z sufiksami a/b/c", () => {
  const liczby = [10, 11, 20, 21];
  const ERAS = epoki(liczby.length);
  const PROJECTS = liczby.flatMap((n, i) =>
    Array.from({ length: n }, (_, k) => praca(`e${i + 1}-${k}`, i + 1, { date: `${2000 + i}-01-${String(k + 1).padStart(2, "0")}` })));
  const p = zbudujPlan({ ERAS, PROJECTS });
  assert.deepEqual(ERAS.map((era) => p.sale.filter((s) => s.epoka === era.id).map((s) => s.id)),
    [["e1"], ["e2a", "e2b"], ["e3a", "e3b"], ["e4a", "e4b", "e4c"]]);
  for (const s of p.sale) if (s.rodzaj === "epoka") assert.ok(s.prace.length <= POJ, `${s.id}: ${s.prace.length}`);
  const ids = p.sale.flatMap((s) => s.prace.map((x) => x.projekt.id));
  assert.deepEqual(ids.sort(), PROJECTS.map((x) => x.id).sort());
});
