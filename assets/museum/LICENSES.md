# Assety muzeum

Wszystkie tekstury pochodzą z [Poly Haven](https://polyhaven.com) i są na licencji
**CC0 1.0** (domena publiczna — wolno używać komercyjnie, bez podawania autora).
Atrybucja poniżej jest dobrowolna, z szacunku dla autorów.

| plik | źródło | licencja |
|---|---|---|
| `beton_*.webp` | [smooth_concrete_floor](https://polyhaven.com/a/smooth_concrete_floor) | CC0 |
| `parkiet_*.webp` | [rectangular_parquet](https://polyhaven.com/a/rectangular_parquet) | CC0 |
| `tynk_*.webp` | [plastered_wall_04](https://polyhaven.com/a/plastered_wall_04) | CC0 |
| `metal_*.webp` | [metal_plate_02](https://polyhaven.com/a/metal_plate_02) | CC0 |

Każdy zestaw ma trzy pliki: `_kolor` (mapa Diffuse/albedo), `_normal` (mapa `nor_gl`,
konwencja OpenGL — zgodna z domyślnym odczytem three.js) i `_arm` (mapa łączona:
R = ambient occlusion, G = roughness, B = metalness).

Pobrane w rozdzielczości 1k, skonwertowane do WebP (`cwebp -q 82` dla map koloru,
`-q 92` dla map normalnych i ARM — te niosą dane, nie obraz, i pasują im mniejsze straty).

Świadomie **nie** używamy assetów z Unity Asset Store: ich licencja zabrania
redystrybucji, a to repozytorium jest publiczne.
