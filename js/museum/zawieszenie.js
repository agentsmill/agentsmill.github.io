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
