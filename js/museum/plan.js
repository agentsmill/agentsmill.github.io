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
  // Pokój Leona dołącza do sali epoki, a ta sala dostaje rezerwowany otwór na
  // drzwi — gospodarza wybieramy więc raz, przed pętlą: pierwsza epoka z salami,
  // począwszy od epoki najwcześniejszej pracy Leona, a gdy takiej nie ma, ostatnia z salami.
  const epokiZSalami = ERAS.filter((era) => wSalach.some((p) => p.era === era.id)).map((era) => era.id);
  let gospodarz = null;
  if (leona.length) {
    gospodarz = epokiZSalami.find((id) => id >= epokaLeona) ?? epokiZSalami.at(-1) ?? null;
    if (gospodarz === null) throw new Error("zbudujPlan: brak sali epoki, do której można dołączyć Pokój Leona");
  }

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
        zDrzwiamiLeona: era.id === gospodarz && k === czesci - 1,
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
    const gosp = sale.filter((s) => s.epoka === gospodarz).at(-1);
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
