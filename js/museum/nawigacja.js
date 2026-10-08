/* Przejazdy po muzeum: „kliknij podłogę”, „kliknij pracę”, plan w rogu i
   wycieczka po wyróżnionych. Trasa wiedzie przez kolejne drzwi z plan.js
   (punkt przed i za każdym otworem — przejście prosto przez środek), a ruch
   idzie do gracza jako prędkość (gracz.sterujZ), więc kolizje i grawitacja
   liczą się jak przy chodzeniu. Łagodny start i hamowanie przed celem;
   wzrok podąża za kierunkiem ruchu, a pod koniec drogi do pracy — już ku
   niej. Każde czynne wejście gościa (klawisz, joystick, przeciągnięcie)
   przerywa przejazd i oddaje mu ster. */

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
  let jazda = null;      // { punkty, i, v, tempo, patrzNa, poDojsciu, faza, czas, bezPostepu, ostatniaOdl }
  let wycieczka = null;  // { lista, i, czekaj, otworz, zamknij }
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
      przenikanie(() => { gracz.teleportuj(x, z, patrzNa ?? undefined); poDojsciu?.(); });
      return;
    }
    jazda = {
      punkty: punktyDo(x, z), i: 0, v: gracz.predkosc(), tempo, patrzNa, poDojsciu,
      faza: "ruch", czas: 0, bezPostepu: 0, ostatniaOdl: Infinity,
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

  function zakoncz(udane) {
    const j = jazda;
    jazda = null;
    gracz.sterujZ(null);
    if (udane) j?.poDojsciu?.();
  }

  function przerwij() {
    if (jazda) zakoncz(false);
    wycieczka = null;
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
      poDojsciu: () => { if (wycieczka !== w) return; w.otworz(hit); w.czekaj = POSTOJ_WYCIECZKI; },
    });
  }

  function update(dt) {
    if (wycieczka && !jazda && wycieczka.czekaj > 0) {
      if (gracz.aktywneWejscie()) { wycieczka = null; return; }
      wycieczka.czekaj -= dt;
      if (wycieczka.czekaj <= 0) nastepnyPrzystanek();
    }
    if (!jazda) { ustawKat(KAT, dt); return; }
    if (gracz.aktywneWejscie()) { przerwij(); return; }
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
