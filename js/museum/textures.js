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
   dla wystroj.js, zawieszenie.js i sale-boczne.js. sRGB, bo to obraz.
   Płótno rysuje się RAZ: po wysłaniu na kartę three.js (r169) woła onUpdate,
   a ten zmniejsza płótno do 1 × 1 px — pamięć 2D (ok. 120 MB na wszystkich
   płótnach muzeum) wraca do przeglądarki, tekstura na karcie zostaje. Nic
   nie rysuje na płótnie drugi raz, a po utracie kontekstu WebGL muzeum i tak
   prosi o odświeżenie. Kto kiedyś zechce płótno odświeżać, zdejmie onUpdate. */
export function plotno(w, h, rysuj) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  rysuj(c.getContext("2d"));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.onUpdate = () => { tex.onUpdate = null; c.width = c.height = 1; };
  return tex;
}

/* Niższy kontrast mapy koloru: odchylenie próbki od średniego koloru tekstury
   (najmniejszy poziom mipmap, 1 × 1 px) razy `kontrast`. Średni ton zostaje,
   plamy bledną. Tak samo mapa emisji — przedświetlenie (sale.js: zarejestruj)
   robi ją z mapy koloru, więc z daleka plamy wróciłyby właśnie nią. Własny
   klucz programu: materiały bez tej łaty dzielą shadery jak dotąd. */
function nizszyKontrast(material, kontrast) {
  const k = kontrast.toFixed(3);
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <map_fragment>", `#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	sampledDiffuseColor.rgb = mix( textureLod( map, vMapUv, 16.0 ).rgb, sampledDiffuseColor.rgb, ${k} );
	diffuseColor *= sampledDiffuseColor;
#endif`)
      .replace("#include <emissivemap_fragment>", `#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	emissiveColor.rgb = mix( textureLod( emissiveMap, vEmissiveMapUv, 16.0 ).rgb, emissiveColor.rgb, ${k} );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`);
  };
  material.customProgramCacheKey = () => `kontrast ${k}`;
}

/* Nowy materiał z zestawu PBR. Mapa ARM: R = AO, G = szorstkość, B =
   metaliczność, więc `roughness` i `metalness` są tu mnożnikami. `bezKoloru`
   zostawia samą fakturę (normalna + szorstkość) z kolorem z `kolor` — tak
   wygląda jasny polerowany beton białej galerii, bo mapa koloru `beton`
   jest brązowawa (sprawdzone na podglądzie z 7 X). `bezArm` — bez mapy ARM:
   szorstkość jednolita (`szorstkosc` wprost, nie mnożnik), metaliczność 0.
   `kontrast` < 1 — spokojniejsza mapa koloru (nizszyKontrast; tynk atrium). */
export function materialPBR(nazwa, { kolor = 0xffffff, normal = 1, szorstkosc = 1, bezKoloru = false, bezArm = false, kontrast = 1 } = {}) {
  const b = `assets/museum/${nazwa}`;
  const arm = bezArm ? null : tekstura(`${b}_arm.webp`);
  const m = new THREE.MeshStandardMaterial({
    color: kolor,
    map: bezKoloru ? null : tekstura(`${b}_kolor.webp`, true),
    normalMap: tekstura(`${b}_normal.webp`),
    normalScale: new THREE.Vector2(normal, normal),
    aoMap: bezKoloru ? null : arm,
    roughnessMap: arm,
    metalnessMap: bezKoloru ? null : arm,
    roughness: szorstkosc,
    metalness: bezKoloru || bezArm ? 0 : 1,
  });
  if (kontrast < 1) nizszyKontrast(m, kontrast);
  return m;
}
