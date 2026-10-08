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
   tam dalej rozglądać. */

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
   przycisk przejścia; po kliknięciu zasłona i kosmos.html w tym samym języku. */
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
    salaId: plan.kosmos.salaId, akcja: () => pokaz(true), odblokuj: true,
    widok: { pozycja: new THREE.Vector3(x, 1.65, z - 2.4), cel: new THREE.Vector3(x, 1.9, z + 1.8) },
  };
  budynek.grupa.add(traf);
  wynik.interaktywne.push(traf);
  wynik.tickery.push(() => pokaz(Math.abs(camera.position.x - x) < 2.2 && camera.position.z > z - 3.5));
}

export function urzadzSaleBoczne({ plan, budynek, archiwum: wpisy = [], otworzWpis = () => {} }) {
  const wynik = { interaktywne: [], tickery: [] };
  let sterKina = null;
  for (const s of plan.sale) {
    if (s.rodzaj === "kino") sterKina = kino(s, budynek, wynik);
    if (s.rodzaj === "archiwum") archiwum(s, budynek, wynik, wpisy, otworzWpis);
  }
  kosmos(plan, budynek, wynik);
  let wKinie = false;
  return {
    ...wynik,
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
