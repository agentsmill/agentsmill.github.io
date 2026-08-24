# Materiały generowane na GB10 — zapis wykonania

Data: 25 VIII 2026. Sprzęt: **NVIDIA GB10** (DGX Spark), Linux aarch64,
121 GB pamięci zunifikowanej. Wszystko liczone lokalnie, nic w chmurze.

## Czasy generowania

| materiał | model | rozdzielczość | kroki | czas jednej sztuki | sztuk | czas łączny |
|---|---|---|---|---|---|---|
| okładki projektów | Krea 2 turbo | 1024×576 | 8 | **10 s** | 27 | 4 min 30 s |
| plansze epok | Krea 2 turbo | 1024×384 | 8 | **8 s** (pierwsza 16 s) | 6 | 56 s |
| ujęcia wideo | MiniMax Hailuo 3 (fl2va) + LoRA turbo 4-step | 768×448, 124 kl. @24 fps (5,2 s) | 4 | **48–64 s** | 3 | 2 min 42 s |

Pierwsza sztuka w każdej serii jest wolniejsza o czas wczytania wag na kartę —
przy wideo to najbardziej widoczne, bo enkoder tekstu `qwen3vl_32b` waży
najwięcej z całego zestawu. Dlatego 64 s przy pierwszym ujęciu i ok. 50 s przy
kolejnych, mimo identycznych ustawień.

**Razem: 8 minut 8 sekund pracy karty** na 33 obrazy i 3 ujęcia wideo.

## Co poszło na stronę

- 27 okładek → karty osi czasu + ekrany światów w Kosmosie
- 6 plansz epok → nagłówki rozdziałów osi czasu
- 2 z 3 ujęć wideo → sekcja 02 (trzecie, „agenci", pominięte: 309 kB po
  przekodowaniu nie mieściło się w budżecie `assets/`)

## Ustalenia techniczne (żeby nie szukać drugi raz)

**Krea 2 to rodzina Qwen-Image, nie Flux**, mimo że zapisane workflowy w tym
wdrożeniu mówią o flux2. Rozstrzygnęły dwie rzeczy: jedyne enkodery tekstu na
dysku to `qwen3vl` (Flux potrzebuje t5xxl + clip_l, których nie ma) oraz obecność
`qwen_image_vae`. Ostatecznie sam model powiedział wprost:
*„Load the text encoder with CLIPLoader type 'krea2'"*.

**MiniMax H3 wymaga enkodera 32B, nie 4B.** Przy 4B sampler przerywa z
`mat1 and mat2 shapes cannot be multiplied (37x2560 and 5120x5376)` — model
oczekuje 5120 wymiarów, a 4B daje 2560. Plik `qwen3vl_32b_minimax_h3_...` ma to
w nazwie.

**Obraz ComfyUI był starszy niż wagi.** Kontener zbudowano 29 IV 2026, a modele
pobrano 24 VIII 2026, więc `UNETLoader` nie rozpoznawał typu modelu. `sync.sh`
zgłosił brak nowszego obrazu na GHCR. Rozwiązanie bez ruszania wdrożenia
właściciela: bieżące ComfyUI w OSOBNYM kontenerze uruchomionym z ich obrazu
(działający CUDA i SageAttention), z modelami podmontowanymi tylko do odczytu.
Do tego dwie aktualizacje pakietów wewnątrz tego kontenera roboczego:
`comfy_kitchen` 0.2.8 → 0.2.31 i `comfy-aimdo` 0.3.0 → 0.4.14.

## Determinizm

Ziarno każdego obrazu wyprowadzone z identyfikatora projektu (FNV-1a), nie
losowane. Powtórzenie przebiegu daje ten sam obraz dla tego samego projektu —
ta sama zasada, co przy rozmieszczaniu sond w Kosmosie.

## Budżet assets/

Dodanie materiałów wymagało miejsca. Zrzuty ekranu przekodowano mozjpeg
(q82, progresywny): **1 367 440 B → 849 553 B**, czyli 37% mniej bez widocznej
straty — sprawdzone na zrzucie z drobnym tekstem. To zwolniło miejsce na wideo
i jest samo w sobie poprawą: każdy odwiedzający pobierał wcześniej pół megabajta
za dużo.

Stan po wszystkim: `assets/` **4 958 225 B** przy limicie 5 242 880 B.
Zapas 284 655 B — kolejny większy materiał znów będzie wymagał sprzątania.
