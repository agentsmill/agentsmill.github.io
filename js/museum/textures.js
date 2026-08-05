/* Wczytywanie materiałów PBR (Poly Haven, CC0 — patrz assets/museum/LICENSES.md)
   z pamięcią podręczną. Jedna mapa ARM obsługuje trzy sloty naraz:
   R = ambient occlusion, G = roughness, B = metalness — stąd roughness
   i metalness materiału ustawione na 1: to mnożniki, a prawdziwe wartości
   niesie mapa ARM. Jedyna odpowiedzialność tego modułu: dać gotowy
   MeshStandardMaterial na podstawie nazwy zestawu. */
import * as THREE from "three";

const loader = new THREE.TextureLoader();
const cache = new Map();

// Wspólny helper: wczytuje jedną mapę, ustawia powtarzanie kafli i —
// tylko dla mapy koloru — przestrzeń barw sRGB. Pozostałe mapy (normal,
// ARM) niosą dane liniowe, nie obraz, więc sRGB by je zniekształciło.
function wczytaj(sciezka, powtorzenia, srgb) {
  const t = loader.load(sciezka);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(powtorzenia, powtorzenia);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Materiały z aoMap wymagają drugiego zestawu UV (uv1) na geometrii —
// bez niego three.js po cichu ignoruje mapę AO. To odpowiedzialność
// wywołującego (patrz world.js/buildFloor): geo.setAttribute("uv1", geo.attributes.uv).
export function loadPBR(nazwa, powtorzenia = 4) {
  const klucz = `${nazwa}@${powtorzenia}`;
  if (cache.has(klucz)) return cache.get(klucz);
  const b = `assets/museum/${nazwa}`;
  const arm = wczytaj(`${b}_arm.webp`, powtorzenia, false);
  const mat = new THREE.MeshStandardMaterial({
    map: wczytaj(`${b}_kolor.webp`, powtorzenia, true),
    normalMap: wczytaj(`${b}_normal.webp`, powtorzenia, false),
    aoMap: arm, roughnessMap: arm, metalnessMap: arm,
    roughness: 1, metalness: 1,   // mnożniki — prawdziwe wartości są w mapie ARM
  });
  cache.set(klucz, mat);
  return mat;
}
