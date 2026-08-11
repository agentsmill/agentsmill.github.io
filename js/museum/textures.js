/* Wczytywanie materiałów PBR (Poly Haven, CC0 — patrz assets/museum/LICENSES.md)
   z pamięcią podręczną. Jedna mapa ARM obsługuje trzy sloty naraz:
   R = ambient occlusion, G = roughness, B = metalness — stąd roughness
   i metalness materiału ustawione na 1: to mnożniki, a prawdziwe wartości
   niesie mapa ARM. Jedyna odpowiedzialność tego modułu: dać gotowy
   MeshStandardMaterial na podstawie nazwy zestawu. */
import * as THREE from "three";

const loader = new THREE.TextureLoader();
const cache = new Map();

// Zgłoszenie błędu wczytywania do konsoli — bez tego literówka w nazwie
// zestawu (albo brakujący plik) daje cichą białą powierzchnię, zero sygnału.
function bladWczytywania(sciezka) {
  return () => console.error(`textures.js: nie udało się wczytać „${sciezka}" — literówka w nazwie zestawu?`);
}

// Wspólny helper: wczytuje jedną mapę, ustawia powtarzanie kafli osobno
// na każdą oś i — tylko dla mapy koloru — przestrzeń barw sRGB.
// Pozostałe mapy (normal, ARM) niosą dane liniowe, nie obraz, więc sRGB
// by je zniekształciło.
function wczytaj(sciezka, powtX, powtY, srgb) {
  const t = loader.load(sciezka, undefined, undefined, bladWczytywania(sciezka));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(powtX, powtY);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Materiały z aoMap wymagają drugiego zestawu UV (uv1) na geometrii —
// bez niego three.js po cichu ignoruje mapę AO. To odpowiedzialność
// wywołującego (patrz world.js/buildFloor): geo.setAttribute("uv1", geo.attributes.uv).
//
// UWAGA (dla Zadania 4 i kolejnych): zwracany materiał jest współdzielony
// przez pamięć podręczną — to ten sam obiekt dla każdego wywołania
// z tymi samymi argumentami. NIE mutuj go w miejscu (np. `mat.map.repeat.set(...)`
// na już otrzymanym materiale) — zmiana wycieknie na każdą inną powierzchnię,
// która korzysta z tego samego wpisu cache. Potrzebujesz innych powtórzeń?
// Wywołaj loadPBR() z innym argumentem `powtorzenia` — to osobny wpis cache.
export function loadPBR(nazwa, powtorzenia = 4) {
  // Liczba = to samo powtórzenie na obu osiach; [x, y] = osobno na U i V —
  // przydatne na niekwadratowych powierzchniach (ściany, podłogi sal).
  const [px, py] = Array.isArray(powtorzenia) ? powtorzenia : [powtorzenia, powtorzenia];
  const klucz = `${nazwa}@${px}x${py}`;
  if (cache.has(klucz)) return cache.get(klucz);
  const b = `assets/museum/${nazwa}`;
  const arm = wczytaj(`${b}_arm.webp`, px, py, false);
  const mat = new THREE.MeshStandardMaterial({
    map: wczytaj(`${b}_kolor.webp`, px, py, true),
    normalMap: wczytaj(`${b}_normal.webp`, px, py, false),
    aoMap: arm, roughnessMap: arm, metalnessMap: arm,
    roughness: 1, metalness: 1,   // mnożniki — prawdziwe wartości są w mapie ARM
  });
  cache.set(klucz, mat);
  return mat;
}
