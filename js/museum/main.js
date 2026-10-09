/* Muzeum Budowania — spięcie modułów: plan → budynek → wystrój → prace →
   eksponaty → gracz → światła → nawigacja, pętla klatek i obsługa kliknięć.
   Każdy moduł ma jedną odpowiedzialność. Tu kolejność i przewody, a do tego
   zasady, które dotyczą kilku modułów naraz i nie mają innego domu: wskazywanie
   i klik (nigdy przez mur), ekran wejścia i dźwięk, stopnie strażnika
   wydajności, oszczędzanie klatek w bezruchu i obrazy prac wczytywane salami. */
import * as THREE from "three";
import { renderer, scene, camera, composer, gtao, jakosc, dotykowy } from "muzeum/render.js";
import { zbudujPlan, salaPod, odleglosciSal } from "muzeum/plan.js";
import { zbudujBudynek } from "muzeum/sale.js";
import { urzadz } from "muzeum/wystroj.js";
import { powiesPrace } from "muzeum/zawieszenie.js";
import { PODSTAWY, postawEksponaty } from "muzeum/exhibits.js";
import { initPlayer, PROG_KLIKU } from "muzeum/player.js";
import { initNawigacja } from "muzeum/nawigacja.js";
import { openPlaque, endFocus, buildList, closeList, hudEra, dismissHint, bindFocusControl, opisSali, otworzWpisArchiwum } from "muzeum/ui.js";
import { initPerf } from "muzeum/perf.js";
import { initSwiatla } from "muzeum/swiatla.js";
import { initMinimapa } from "muzeum/minimapa.js";
import { urzadzSaleBoczne } from "muzeum/sale-boczne.js";
import { initDzwiek } from "muzeum/dzwiek.js";

const loader = document.getElementById("loader");
const btnTura = document.getElementById("btn-tura");
const celownik = document.getElementById("celownik");
const podpis = document.getElementById("podpis");
const HUD_POD_WEJSCIEM = [document.querySelector(".hud-top"), document.getElementById("minimapa"), document.getElementById("hud-hint")].filter(Boolean);
const t = (klucz, pl) => (window.__t ? window.__t(klucz, pl) : pl);

/* Podsystemy dodatkowe (dźwięk, sale boczne, światła w pętli): wyjątek w którymś z nich nie może zatrzymać
   klatki ani reszty zmiany sali. Każdy idzie do konsoli raz — w pętli ten sam leciałby co klatkę. */
const zgloszone = new Set();
function bezpiecznie(nazwa, fn) {
  try { fn(); }
  catch (err) {
    if (zgloszone.has(nazwa)) return;
    zgloszone.add(nazwa);
    console.error(`muzeum: ${nazwa} —`, err);
  }
}

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

let plan = null, budynek = null, gracz = null, prace = null, swiatla = null, nawigacja = null, minimapa = null, boczne = null, dzwiek = null;
const interaktywne = [];     // trafienia raycastera: prace, eksponaty, sale boczne (Zadanie 8)
const zDaleka = [];          // z nich te, które liczą się poza zasięgiem prac (portal Kosmosu) — o ile nic ich nie zasłania
const tickery = [];          // funkcje (t, dt) wołane co klatkę
let focus = null;            // { hit } — praca z otwartą tabliczką
let bylaSala = null, byloWycieczka = false;

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
      /* Najpierw castShadow = false w swiatla.js: zmienia liczbę świateł z cieniem, więc three.js raz
         kompiluje shadery bez próbkowania map (czkawka mieści się w pauzie strażnika po zmianie).
         Sama flaga renderera tylko pomijała przebieg map — shadery dalej czytały zamrożone cienie. */
      wykonaj: () => {
        const rzucalo = swiatla?.wylaczCienie() ?? false;
        renderer.shadowMap.enabled = false;
        return rzucalo;
      },
    },
    {
      nazwa: "dpr",
      tekst: () => t("muz.perf.dpr", "Zmniejszyłem rozdzielczość obrazu — to ostatni krok."),
      /* Schodzi o pół kroku, ale nie poniżej 0,75 — działa więc także na ekranach z DPR 1,
         gdzie słabe komputery nie miały już co oddać. */
      wykonaj: () => {
        const teraz = renderer.getPixelRatio();
        if (teraz <= 0.75) return false;
        const nowa = Math.max(0.75, teraz - 0.5);
        renderer.setPixelRatio(nowa);
        composer.setPixelRatio(nowa);
        return true;
      },
    },
  ],
});

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
  schowajPodpis();   // podpis nie jedzie z gościem przez cały przejazd
  nawigacja.podejdzDo(hit, () => focusOn(hit));
}

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

bindFocusControl({
  onFocusEnd: () => { focus = null; },
  goToHit: (hit) => podejdz(hit),     // pozycja z listy eksponatów
  goToRoom: (id) => nawigacja?.lecDoSali(id),   // nagłówek sali w liście
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

/* Czy między okiem a trafieniem stoi mur, nadproże, bok niszy albo szafa? Sprawdza bryły, które
   zasłaniają (budynek.zaslony: warstwa kolizji bez ławek i podstaw eksponatów — sale.js,
   dodajKolizje). Promień kończy się 5 cm przed trafieniem, żeby nie łapał brył tuż za nim;
   zasięg wraca do poprzedniej wartości, bo wołający liczy dalej na swoim. */
function zaslonieta(trafienie) {
  const zasieg = ray.far;
  ray.far = trafienie.distance - 0.05;
  const jest = ray.intersectObjects(budynek.zaslony, false).length > 0;
  ray.far = zasieg;
  return jest;
}

function celuj(e) {
  if (gracz?.zablokowany()) pointer.set(0, 0);
  else if (e) pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  else return;
  ray.setFromCamera(pointer, camera);
  ray.far = ZASIEG_PRAC;
  const traf = ray.intersectObjects(interaktywne, false);
  /* Nic nie liczy się przez mur: każde trafienie — praca, eksponat, szuflada, ekran Kina,
     portal, punkt podłogi — przechodzi przez zaslonieta(). Pośredniki eksponatów (niewidoczne
     kule i walec toru) są większe od samych rzeźb, więc promień mierzący w obraz za nimi albo
     w podłogę obok trafiałby najpierw w nie. Pośrednik liczy się tylko, gdy ten sam promień
     trafia w widoczną bryłę eksponatu (trafiaRzezbe). Gdy nic nie przejdzie, wygrywa podłoga;
     dopiero bez podłogi — pierwszy niezasłonięty pośrednik z brzegu. */
  const wybrane = traf.find((t) => !zaslonieta(t) && (t.object.userData.exhibit ? trafiaRzezbe(t.object.userData.exhibit.group) : true));
  hovered = wybrane ? wybrane.object : null;
  punktPodlogi = null;
  if (!hovered && budynek) {
    ray.far = ZASIEG_PODLOGI;
    const p = ray.intersectObjects(budynek.podlogi, false).find((h) => !zaslonieta(h));
    /* Portal Kosmosu to drogowskaz na końcu amfilady — widać go z atrium, 140 m dalej, więc
       zasięg prac go nie dotyczy. Liczy się, gdy nic bliższego nie wygrało, ale tylko jeśli
       nic go nie zasłania, a bliższy z dwóch wygrywa: portal albo punkt podłogi w zasięgu.
       Zasięg ustawiany przed każdym rzutem. */
    ray.far = Infinity;
    const daleki = ray.intersectObjects(zDaleka, false)[0];
    if (daleki && (!p || daleki.distance < p.distance) && !zaslonieta(daleki)) hovered = daleki.object;
    else if (p) punktPodlogi = p.point;
    else {
      const bliski = traf.find((t) => !t.object.userData.zDaleka && !zaslonieta(t));
      if (bliski) hovered = bliski.object;
    }
  }
  znacznik.visible = !!punktPodlogi;
  if (punktPodlogi) znacznik.position.set(punktPodlogi.x, 0.012, punktPodlogi.z);
  const aktywny = !!hovered || !!punktPodlogi;
  if (aktywny !== bylHovered) {
    bylHovered = aktywny;
    renderer.domElement.style.cursor = aktywny ? "pointer" : "default";
  }
  celownik.classList.toggle("celuje", !!hovered);
  podpisz(e);
}

/* Podpis przy kursorze: co zrobi kliknięcie — przy pracy „Podejdź · tytuł”, przy
   trafieniach sal bocznych ich własny podpis z `userData.podpis` (szuflada Archiwum,
   ekran Kina, portal Kosmosu — sale-boczne.js).
   Podłogę („idź tutaj”) pokazuje już znacznik. W blokadzie wskaźnika podpis
   stoi pod celownikiem; na dotyku nie ma najechania, więc nie ma podpisu.
   Podczas przejazdu też go nie ma — gość już idzie (w blokadzie celuj() leci co
   klatkę, więc bez tego warunku podpis wracałby po każdym schowaniu).
   Rozmiar podpisu czytamy raz, przy zmianie tekstu — nie przy każdym ruchu myszy.
   Na krawędziach okna podpis zostaje w oknie: z prawej przesunięty w lewo, przy
   dolnej krawędzi stoi nad kursorem. */
let bylPodpis = "", szerPodpisu = 0, wysPodpisu = 0;
function schowajPodpis() { podpis.hidden = true; bylPodpis = ""; }
function podpisz(e) {
  const u = hovered?.userData;
  const opis = u?.project ? `${t("muz.podejdz", "Podejdź")} · ${u.project.title}` : u?.podpis ?? "";
  const tekst = opis && !dotykowy && !nawigacja?.aktywna() && !(focus && hovered === focus.hit) ? opis : "";
  if (tekst !== bylPodpis) {
    podpis.textContent = tekst; podpis.hidden = !tekst; bylPodpis = tekst;
    if (tekst) { szerPodpisu = podpis.offsetWidth; wysPodpisu = podpis.offsetHeight; }
  }
  if (!tekst) return;
  const x = gracz?.zablokowany() || !e ? innerWidth / 2 : e.clientX;
  const y = gracz?.zablokowany() || !e ? innerHeight / 2 : e.clientY;
  const lewo = Math.min(x + 16, innerWidth - szerPodpisu - 8);
  const gora = y + 18 + wysPodpisu > innerHeight - 8 ? Math.max(8, y - 18 - wysPodpisu) : y + 18;
  podpis.style.transform = `translate(${Math.round(lewo)}px, ${Math.round(gora)}px)`;
}

function obsluzKlik(e) {
  celuj(e);
  if (hovered) {
    if (focus && hovered === focus.hit) return;
    // ekran Kina, szuflada Archiwum, portal Kosmosu: ich własna akcja — po podejściu albo na miejscu (dzialaj)
    if (hovered.userData.akcja) { dzialaj(hovered); return; }
    podejdz(hovered);
  } else if (punktPodlogi) {
    endFocus();
    nawigacja.idzDo(punktPodlogi.x, punktPodlogi.z);
  } else if (focus) endFocus();
}

/* Klik to lewy przycisk albo palec: prawy otwiera menu kontekstowe, środkowy przewija — żaden nie rusza
   gościa. W trakcie przeciągania celuj() stoi, a podpis znika — nie może zamarznąć w miejscu wciśnięcia. */
renderer.domElement.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  downAt = [e.clientX, e.clientY]; hovered = null; schowajPodpis();
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt) return;
  const dist = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (e.button !== 0 || dist > PROG_KLIKU) return;   // inny przycisk albo przeciągnięcie (rozglądanie), nie klik
  obsluzKlik(e);
});
/* Wciśnięcie na płótnie puszczone gdzie indziej (nad planem, nagłówkiem) albo przerwany gest: bez tego
   downAt zostawało i celuj() stało do następnego kliknięcia w płótno — bez najechania, znacznika i podpisu. */
addEventListener("pointerup", (e) => { if (e.target !== renderer.domElement) downAt = null; });
addEventListener("pointercancel", () => { downAt = null; });
renderer.domElement.addEventListener("pointermove", (e) => { if (!downAt) celuj(e); });
renderer.domElement.addEventListener("pointerleave", () => { znacznik.visible = false; hovered = null; schowajPodpis(); });

/* Obrazy prac. Na poziomie średnim i niskim salami: wczytane do dwóch przejść
   od gościa, zwalniane od pięciu — pas pomiędzy chroni przed migotaniem, gdy
   ktoś krąży przy progu. Na wysokim wszystkie od razu, najbliższe najpierw
   (wczytaj() drugi raz nic nie robi, więc kolejne sale nic nie kosztują). */
function wczytajObrazy(s) {
  const odl = odleglosciSal(plan, s.id);
  const d = (o) => odl.get(o.salaId) ?? Infinity;
  for (const o of [...prace.obrazy].sort((a, b) => d(a) - d(b))) {
    if (!jakosc.leniwe || d(o) <= 2) o.wczytaj();
    else if (d(o) > 4) o.zwolnij();
  }
}

/* Zmiana sali pod nogami gościa — jedno miejsce, z którego dowiadują się o
   niej wszystkie moduły. aria-live na #hud-era ogłasza każde przypisanie,
   więc tylko przy zmianie. Najpierw rdzeń (obrazy, światła, plan w rogu), potem
   podsystemy dodatkowe, każdy osobno — awaria dźwięku nie zostawi sali bez obrazów. */
function naZmianeSali(s) {
  hudEra.textContent = opisSali(s);
  wczytajObrazy(s);
  swiatla?.wejdz(s);
  minimapa?.sala(s.id);
  bezpiecznie("sale boczne", () => boczne?.wejscie(s.id));
  bezpiecznie("dźwięk sali", () => dzwiek?.ustawSale(s));
}

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
    dzwiek = initDzwiek(plan);
    if (!dzwiek) { napiszDzwiek(t("muz.dzwiekBrak", "Dźwięk niedostępny")); btnDzwiek.disabled = true; return; }
    dzwiek.ctx.resume();
    if (bylaSala) dzwiek.ustawSale(bylaSala);
    boczne?.podlaczDzwiek(dzwiek);    // dźwięk showreelu w Kinie wchodzi przez wyjście silnika — słucha go też przycisk w HUD
  } else dzwiek?.wycisz(!tak);
  boczne?.ustawDzwiek(tak);
  pokazStanDzwieku();
}
/* Awaria dźwięku nie ma prawa zatrzymać wejścia ani zepsuć przycisku w HUD: wchodzimy w ciszy,
   przycisk pokazuje „wył.”. Silnik, który się nie dokończył, zostaje wyciszony i odpięty — pętla klatek
   nie woła wtedy niczego, co mogłoby rzucić. */
function sprobujDzwiek(tak) {
  try { wlaczDzwiek(tak); }
  catch (err) {
    console.warn("muzeum: dźwięk się nie uruchomił, wchodzimy w ciszy —", err);
    try { dzwiek?.wycisz(true); } catch { /* i tak cisza */ }
    dzwiek = null;
    boczne?.ustawDzwiek(false);
    pokazStanDzwieku();
  }
}
function wejdz(zDzwiekiem) {
  if (loader.classList.contains("done")) return;   // wejście już było: ukryte przyciski niczego nie zmieniają (Enter na nich)
  for (const el of HUD_POD_WEJSCIEM) el.inert = false;   // HUD wraca do kolejności Tab (pierwsza klatka go wyłączyła)
  gracz?.wpusc();                                  // od teraz klawisze, dotyk i mysz sterują gościem
  if (zDzwiekiem) sprobujDzwiek(true); else pokazStanDzwieku();
  loader.classList.add("done");
}
document.getElementById("wejdz-dzwiek").addEventListener("click", () => wejdz(true));
document.getElementById("wejdz-cisza").addEventListener("click", () => wejdz(false));
btnDzwiek.addEventListener("click", () => sprobujDzwiek(!dzwiek || dzwiek.wyciszony()));

/* ── Pętla ────────────────────────────────────────────────────────────── */

/* ── Oszczędzanie w bezruchu ──────────────────────────────────────────────
   Gość stoi i nic się nie rusza → mniej klatek: po 2 s ok. 20 kl./s, po 20 s
   ok. 4 kl./s. Ruch myszy, dotyk, klawisz, kółko, zmiana rozmiaru okna albo
   przejazd wracają do pełnej szybkości w tej samej klatce (po zmianie rozmiaru
   płótno jest puste, więc następna klatka musi się narysować od razu).
   W Kinie co najmniej 30 kl./s — gra film; w sali z gramofonem, gdy gra, co
   najmniej 20 — kręci się płyta. Klatki pominięte nie psują animacji: eksponaty
   i światła dostają prawdziwy czas (petla).
   Na telefonie i laptopie na baterii to różnica między „grzeje się” a „stoi”. */
const BEZRUCH = [[20, 1 / 4], [2, 1 / 20]];   // [po ilu sekundach bezruchu, najkrótszy odstęp klatek w s]
let ostatniRuch = performance.now(), ostatniaKlatka = 0;
let salaGramofonu = null;                      // sala z płytą — ustalana raz w zbudujMuzeum()
const ruch = () => { ostatniRuch = performance.now(); };
for (const zdarzenie of ["pointermove", "pointerdown", "wheel", "keydown", "keyup", "touchstart", "touchmove", "resize", "orientationchange"]) {
  addEventListener(zdarzenie, ruch, { passive: true });
}
function odstepKlatek(teraz) {
  if (nawigacja?.aktywna() || (gracz?.predkosc() ?? 0) > 0.05) { ostatniRuch = teraz; return 0; }
  const bezruch = (teraz - ostatniRuch) / 1000;
  let odstep = 0;
  for (const [po, o] of BEZRUCH) if (bezruch >= po) { odstep = o; break; }
  if (odstep && bylaSala?.rodzaj === "kino") odstep = Math.min(odstep, 1 / 30);
  if (odstep && window.__gramofonGra === true && bylaSala?.id === salaGramofonu) odstep = Math.min(odstep, 1 / 20);   // gra gramofon: w jego sali płyta dostaje co najmniej 20 kl./s, jak film w Kinie
  return odstep;
}

const clock = new THREE.Clock();
const wzrok = new THREE.Vector3();
let firstFrame = true;
function petla(teraz = performance.now()) {
  requestAnimationFrame(petla);
  if (dzwiek) bezpiecznie("serce", dzwiek.tick);   // serce planowane 0,3 s naprzód — co wywołanie rAF, także w klatce pominiętej
  const odstep = odstepKlatek(teraz);
  if (odstep && teraz - ostatniaKlatka < odstep * 1000 - 4) return;   // klatka pominięta — gość stoi
  ostatniaKlatka = teraz;
  const delta = clock.getDelta();
  const dt = Math.min(delta, 0.05);    // gracz, nawigacja i strażnik: obcięcie chroni kolizje i pomiar przed skokami
  const dtAnimacji = odstep ? Math.min(delta, 0.3) : dt;   // klatka po przerwie w bezruchu: eksponaty i światła dostają prawdziwy czas (płyta gramofonu 3,49 rad/s, nie 0,70)
  const czas = clock.elapsedTime;      // nie `t` — to nazwa tłumacza napisów wyżej
  if (!odstep) perf.tick(dt);          // strażnik mierzy tylko pełną szybkość — oszczędzanie to nie słaby sprzęt
  if (gracz) {
    nawigacja.update(dt);              // najpierw ster przejazdu, potem ruch z kolizjami
    gracz.update(dt);
    if (gracz.zablokowany()) celuj();
    camera.getWorldDirection(wzrok);
    minimapa?.aktualizuj(gracz.pozycjaX(), gracz.pozycjaZ(), wzrok.x, wzrok.z);
    const s = salaPod(plan, gracz.pozycjaX(), gracz.pozycjaZ());
    if (s && s !== bylaSala) { bylaSala = s; naZmianeSali(s); }
    const w = nawigacja.trwaWycieczka();
    if (w !== byloWycieczka) {
      byloWycieczka = w;
      btnTura.textContent = w ? t("muz.przerwij", "Przerwij zwiedzanie") : t("muz.tura", "Oprowadź mnie");
    }
  }
  for (const fn of tickery) {
    try { fn(czas, dtAnimacji); } catch (err) { console.error("tick error:", err); }
  }
  if (swiatla) bezpiecznie("światła", () => swiatla.aktualizuj(dtAnimacji));
  composer.render();
  if (firstFrame) {
    firstFrame = false;
    loader.classList.add("gotowy");             // ekran ładowania → ekran wejścia (patrz wejdz())
    /* HUD pod ekranem wejścia znika dla klawiatury: Tab + Enter włączałby pod zasłoną wycieczkę albo dźwięk.
       Dopiero tutaj, nie wcześniej — przy zawieszonym ładowaniu „← Karta budowania” to jedyne wyjście. */
    for (const el of HUD_POD_WEJSCIEM) el.inert = true;
    document.getElementById("wejdz-dzwiek").focus({ preventScroll: true });
    window.__mzOtwarte?.();
  }
}

addEventListener("resize", () => {
  schowajPodpis();   // szerokość podpisu zależy od okna (max-width: 70vw) — wraca przy najbliższym ruchu myszy, już zmierzony od nowa
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
  const eksponaty = postawEksponaty(plan, budynek);   // przed graczem: dokłada kolizje podestów
  interaktywne.push(...eksponaty.interaktywne);
  salaGramofonu = interaktywne.find((h) => h.userData.exhibit && h.userData.project?.id === "akordy-zmierzchu")?.userData.salaId ?? null;   // dla odstepKlatek()
  tickery.push(...eksponaty.tickery);
  boczne = urzadzSaleBoczne({ plan, budynek, archiwum: ARCHIVE, otworzWpis: otworzWpisArchiwum, zamknijTabliczke: endFocus });   // też przed graczem: kolizja szafy
  interaktywne.push(...boczne.interaktywne);
  zDaleka.push(...interaktywne.filter((h) => h.userData.zDaleka));
  tickery.push(...boczne.tickery);
  scene.add(budynek.grupa);
  tickery.push(...budynek.tickery);

  gracz = initPlayer(budynek.kolizje);         // po wszystkich kolizjach — Octree buduje się raz
  gracz.teleportuj(plan.start.x, plan.start.z);
  gracz.naKrok(() => { if (dzwiek) bezpiecznie("kroki", dzwiek.krok); });
  swiatla = initSwiatla({ plan, budynek, plamy: prace.plamy, pula: jakosc.pula, lustro: jakosc.lustro, cienie: jakosc.cienie });
  nawigacja = initNawigacja({ plan, gracz, zaslona: document.getElementById("zaslona") });
  minimapa = initMinimapa({
    plan,
    naSale: (id) => { endFocus(); closeList(); nawigacja.lecDoSali(id); },
    naKosmos: () => { endFocus(); closeList(); dzialaj(boczne.portal); },    // cel za ostatnią salą: do portalu, na miejscu przycisk
  });

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
    plan, budynek, gracz, prace, swiatla, nawigacja, minimapa, boczne, dzwiek: () => dzwiek, perf, interaktywne, interactives: interaktywne,
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

  buildList(interaktywne, plan);
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
