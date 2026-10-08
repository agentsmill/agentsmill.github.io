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
