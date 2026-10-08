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
