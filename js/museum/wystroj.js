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
  swietlik(budynek, s, W * 0.5, D * 0.58, "#fff6e8", "rgba(80,70,55,0.55)", new THREE.Color(1.25, 1.2, 1.12), 0xfff0dc, s.rodzaj === "atrium" ? 4.5 : 6);
}

function biel(s, budynek) {
  swietlik(budynek, s, s.x1 - s.x0 - 1.2, s.z1 - s.z0 - 1.2, "#ffffff", "rgba(150,150,150,0.5)", new THREE.Color(1.08, 1.08, 1.08), 0xffffff, 2.2);
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
    dodajKolizje(budynek, k, true, false);   // ławka nie zasłania wskazywania: podłogę za nią da się kliknąć
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
