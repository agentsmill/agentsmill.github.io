// ── Dane portfolio ────────────────────────────────────────────────────────────
// Edytuj śmiało: to zwykłe tablice JS, strona renderuje się z nich przy load.
// cat: gry | sztuka | produkty | aiml | leon | robotyka
// date: "YYYY-MM" (miesiąc pierwszego commitu / utworzenia repo)
// links: tylko zweryfikowane 4 VIII 2026. badge: fly|npm|kaggle|steam|cf

const ERAS = [
  {
    id: 1, range: "III–IV 2025", title: "Pierwsze eksperymenty",
    rhythm: "15 repozytoriów w 2 miesiące",
    lead: "Dwa tygodnie po research preview Claude Code powstaje pierwsze repo. Gry, prompty, satelity — wszystko naraz, żeby sprawdzić, co ta technologia właściwie umie."
  },
  {
    id: 2, range: "V–VI 2025", title: "Pierwsze cuda z MCP",
    rhythm: "mniej projektów, dziwniejsze pomysły",
    lead: "Claude 4 wychodzi 22 maja. Cztery dni później Opus komponuje przez MCP w Ableton Live „nieznane arcydzieło Mieczysława Fogga na koniec świata”."
  },
  {
    id: 3, range: "VII–X 2025", title: "Narzędzia domenowe",
    rhythm: "13 repozytoriów w 4 miesiące",
    lead: "Pierwszy token w Claude Code (lipiec). Energia, biuro, matematyka — AI zaczyna robić rzeczy, które mają zawodowy sens."
  },
  {
    id: 4, range: "XI 2025 – II 2026", title: "W stronę produktów",
    rhythm: "cisza przed burzą",
    lead: "Mniej repozytoriów, więcej myślenia. Prototyp Aule Energy, nowy Mac i początek lokalnej historii sesji — fundamenty pod rok 2026."
  },
  {
    id: 5, range: "III–VI 2026", title: "Rok agentów",
    rhythm: "25+ projektów w 4 miesiące",
    lead: "Modele wychodzą co tydzień, a projekty co kilka dni: hackathon Kaggle, gra dla Leona, klon Tibii, sztuka generatywna i 249 gwiazdek na GitHubie."
  },
  {
    id: 6, range: "VII–VIII 2026", title: "Studio jednoosobowe",
    rhythm: "20+ projektów w 5 tygodni",
    lead: "Claude Code, Codex i Kimi CLI pracują równolegle. Powstają płacące platformy, gra na Steam, roboty — i ta strona."
  },
];

const MILESTONES = [
  { date: "2024-11", era: 1, label: "Premiera MCP (Model Context Protocol)", pre: true },
  { date: "2025-02", era: 1, label: "Claude 3.7 Sonnet + Claude Code (research preview)" },
  { date: "2025-05", era: 2, label: "Claude 4: Opus 4 i Sonnet 4 (22 V)" },
  { date: "2025-07", era: 3, label: "Pierwszy token w Claude Code", personal: true },
  { date: "2025-08", era: 3, label: "Claude Opus 4.1 · GPT-5" },
  { date: "2025-09", era: 3, label: "Claude Sonnet 4.5 + Claude Code 2.0" },
  { date: "2025-11", era: 4, label: "Claude Opus 4.5 · Gemini 3" },
  { date: "2026-01", era: 4, label: "Nowy Mac — start lokalnej historii sesji (4400+ sesji od tej pory)", personal: true },
  { date: "2026-02", era: 4, label: "Gemini 3.1 Pro" },
  { date: "2026-04", era: 5, label: "Opus 4.7 · GPT-5.5 · DeepSeek V4 — trzy premiery w 8 dni" },
  { date: "2026-05", era: 5, label: "Gemma 4 — otwarty model, hackathon „Gemma 4 Good”" },
  { date: "2026-06", era: 5, label: "Claude Fable 5 / Mythos 5 — pierwszy publiczny model klasy Mythos (9 VI)" },
  { date: "2026-07", era: 6, label: "Claude Opus 5 (24 VII)" },
];

const PROJECTS = [
  // ── Era 1: III–IV 2025 ──────────────────────────────────────────────────────
  {
    id: "oze-developer-manager", title: "OZE Developer Manager", date: "2025-03", era: 1,
    cat: ["gry", "produkty"],
    desc: "Pierwsza gra: zarządzasz developerką odnawialnych źródeł energii. Początek wszystkiego — repo nr 1.",
    tech: ["JavaScript"],
    links: { live: "https://agentsmill.github.io/oze-developer-manager/", repo: "https://github.com/agentsmill/oze-developer-manager" }
  },
  {
    id: "oko-saurona", title: "Oko Saurona", date: "2025-03", era: 1,
    cat: ["produkty"],
    desc: "Platforma danych satelitarnych: pozyskiwanie, wizualizacja i analiza obrazów. (repo prywatne)",
    tech: ["TypeScript"], links: {}
  },
  {
    id: "orthank", title: "Orthank", date: "2025-03", era: 1,
    cat: ["produkty", "aiml"],
    desc: "System analizy dokumentów planistycznych dla polskich gmin — AI czyta plany zagospodarowania.",
    tech: ["Python", "JavaScript"],
    links: { repo: "https://github.com/agentsmill/orthank-deployment" }
  },
  {
    id: "krwawy-biznes", title: "Krwawy Biznes", date: "2025-03", era: 1,
    cat: ["gry"],
    desc: "Turowa gra o zarządzaniu centrum krwiodawstwa — lekarskie korzenie w formie strategii.",
    tech: ["JavaScript"],
    links: { repo: "https://github.com/agentsmill/krwawy-biznes" }
  },
  {
    id: "mistrz-promptow", title: "Mistrz Promptów", date: "2025-04", era: 1,
    cat: ["gry", "aiml"],
    desc: "Interaktywny kurs prompt engineeringu na przykładach z energetyki — lekcje, zadania, punktacja. Trzy iteracje w trzy tygodnie.",
    tech: ["JavaScript"],
    links: { live: "https://agentsmill.github.io/mistrz-promptow/", repo: "https://github.com/agentsmill/mistrz-promptow" }
  },

  // ── Era 2: V–VI 2025 ────────────────────────────────────────────────────────
  {
    id: "akordy-zmierzchu", title: "Akordy Zmierzchu", date: "2025-05", era: 2,
    cat: ["sztuka"],
    desc: "Kompozycja stworzona przez Claude 4 Opus sterującego Ableton Live przez MCP: „Mieczysław Fogg gra swoje największe nieznane arcydzieło w trakcie końca świata”. Cztery dni po premierze modelu.",
    tech: ["Ableton Live", "MCP", "Claude 4 Opus"],
    links: { repo: "https://github.com/agentsmill/Akordy_Zmierzchu" }
  },

  // ── Era 3: VII–X 2025 ───────────────────────────────────────────────────────
  {
    id: "greensolver", title: "GreenSolver", date: "2025-07", era: 3,
    cat: ["produkty", "aiml"],
    desc: "Solver zielonej energii — cztery podejścia do tego samego problemu w cztery tygodnie, od prototypu do wersji Final. Nauka iterowania.",
    tech: ["Python", "TypeScript"],
    links: { repo: "https://github.com/agentsmill/GreenSolver_Final" }
  },
  {
    id: "korpolajf", title: "KorpoLajf RPG", date: "2025-08", era: 3,
    cat: ["gry"],
    desc: "Pixel-artowa satyra biurowa: zbierasz dane, pijesz kawę, zarządzasz stresem i zdążasz z raportem na zarząd o 17:30.",
    tech: ["JavaScript", "Canvas"],
    links: { live: "https://agentsmill.github.io/KorpoLajfRPG/", repo: "https://github.com/agentsmill/KorpoLajfRPG" }
  },
  {
    id: "math-garden", title: "Math Garden", date: "2025-08", era: 3,
    cat: ["aiml"],
    desc: "Ogród matematyki — eksperyment edukacyjny w Pythonie. (repo prywatne)",
    tech: ["Python"], links: {}
  },

  // ── Era 4: XI 2025 – II 2026 ────────────────────────────────────────────────
  {
    id: "aule-v1", title: "Aule Energy — prototyp", date: "2025-12", era: 4,
    cat: ["produkty"],
    desc: "Pierwsze podejście do asystenta zakupu energii. Cztery commity, które rok później urosną do produktu z 236 commitami.",
    tech: ["JavaScript", "Vite"], links: {}
  },
  {
    id: "pokemate-hub", title: "Pokemate TCG Hub", date: "2026-02", era: 4,
    cat: ["produkty"],
    desc: "Sklep i hub kolekcjonerski Pokémon TCG — szybki e-commerce budowany low-code (Lovable) z własnymi poprawkami.",
    tech: ["React", "Vite", "Lovable"], links: {}
  },

  // ── Era 5: III–VI 2026 ──────────────────────────────────────────────────────
  {
    id: "mansa-musa", title: "Mansa Musa", date: "2026-04", era: 5,
    cat: ["produkty", "aiml"],
    desc: "Osobisty agent finansowy: Telegram + Claude Agent SDK, w całości lokalnie na Mac mini za Tailscale. Żadna instytucja nie widzi danych.",
    tech: ["Claude Agent SDK", "Telegram", "SQLite"], links: {}
  },
  {
    id: "pokescale", title: "POKESCALE", date: "2026-04", era: 5,
    cat: ["aiml", "gry"],
    desc: "Pokédexowa waga porównawcza na czujnikach Force Touch trackpada MacBooka — szereguje przedmioty od najlżejszego do najcięższego bez ważenia w gramach.",
    tech: ["Python", "Force Touch"], links: {}
  },
  {
    id: "flexmarket", title: "FlexMarket", date: "2026-04", era: 5,
    cat: ["produkty"],
    desc: "B2B SaaS transzowego zakupu energii z TGE: modularny monolit Next.js + NestJS z kolejkami i websocketami. Architektoniczna wprawka przed większymi produktami.",
    tech: ["Next.js", "NestJS", "Prisma", "RabbitMQ"], links: {}
  },
  {
    id: "lastbox", title: "LastBox", date: "2026-04", era: 5, featured: true,
    cat: ["aiml"],
    desc: "Offline'owy asystent przetrwania: Raspberry Pi 5 + radio LoRa + własny fine-tuning Gemma 4 E2B. Zgłoszenie na hackathon Kaggle „Gemma 4 Good” — 311 promptów pracy w dwa miesiące.",
    tech: ["Python", "Gemma 4", "LoRa", "Raspberry Pi"], badge: "kaggle",
    links: { live: "https://agentsmill.github.io/lastbox/", repo: "https://github.com/agentsmill/lastbox" }
  },
  {
    id: "bilans-tokenow", title: "Bilans tokenów Polski", date: "2026-06", era: 5,
    cat: ["sztuka", "aiml"],
    desc: "Symulator data center AI: realna infrastruktura GPU w Polsce (Helios, Athena, PIAST-AI) kontra zapowiedziane 5 GW — cały model w jednym pliku HTML.",
    tech: ["HTML", "Canvas"],
    links: { live: "https://agentsmill.github.io/bilans-tokenow-polski/", repo: "https://github.com/agentsmill/bilans-tokenow-polski" }
  },
  {
    id: "reverie", title: "Reverie", date: "2026-06", era: 5, featured: true,
    cat: ["sztuka"],
    desc: "„Umysł, który rośnie ku twojej uwadze”. Zasiej myśl, poruszaj kursorem — świetlista struktura kolonizuje przestrzeń wokół uwagi. Każde odświeżenie zaczyna od zera.",
    tech: ["JavaScript", "Canvas", "generative art"],
    links: { live: "https://agentsmill.github.io/reverie/", repo: "https://github.com/agentsmill/reverie" }
  },
  {
    id: "ekspres-leona", title: "Strażacki Ekspres Leona", date: "2026-06", era: 5, featured: true,
    cat: ["leon", "gry"],
    desc: "Wyścigówka pociągów dla 5-latka: Leon gasi pożary wodą, zbiera gwiazdki i rozwiązuje quiz z 36 prawdziwych znaków drogowych. Bez „game over”, ale przegrać się da — sprawiedliwe wyzwanie.",
    tech: ["HTML5 Canvas", "vanilla JS", "zero zależności"],
    links: { live: "https://agentsmill.github.io/strazacki-ekspres-leona/", repo: "https://github.com/agentsmill/strazacki-ekspres-leona" }
  },
  {
    id: "tibijka", title: "Tibijka", date: "2026-06", era: 5,
    cat: ["gry"],
    desc: "Przeglądarkowy klon Tibii w jednym pliku HTML — dowód, że nostalgia mieści się w 200 kilobajtach.",
    tech: ["HTML", "Canvas"],
    links: { live: "https://agentsmill.github.io/tibijka/", repo: "https://github.com/agentsmill/tibijka" }
  },
  {
    id: "age-of-agents", title: "Age of Agents", date: "2026-06", era: 5, featured: true,
    cat: ["sztuka", "produkty"],
    desc: "Twoje sesje Claude Code jako spokojne pixel-artowe królestwo: sesja = osadnik, narzędzia = warsztaty, tokeny = spichlerz. 318 commitów, paczka npm, 249★ na GitHubie.",
    tech: ["PixiJS", "Fastify", "npm"], badge: "npm", stars: 249,
    links: { live: "https://agentsmill.github.io/age-of-agents/", repo: "https://github.com/agentsmill/age-of-agents", npm: "https://www.npmjs.com/package/age-of-agents" }
  },
  {
    id: "pokemate-engine", title: "Pokemate", date: "2026-06", era: 5,
    cat: ["aiml"],
    desc: "Hybrydowy silnik do Kaggle Pokémon TCG AI Battle Challenge: heurystyki → determinizowany ISMCTS → sieć self-play.",
    tech: ["Python", "MCTS"], badge: "kaggle", links: {}
  },
  {
    id: "naszwhisper", title: "NaszWhisper", date: "2026-06", era: 5, featured: true,
    cat: ["produkty"],
    desc: "Natywna apka macOS do dyktowania po polsku — w pełni lokalnie, na Apple Neural Engine (Parakeet 0.6B). Tapnięcie ⌘, mówisz, tekst wkleja się tam, gdzie kursor.",
    tech: ["Swift", "Core ML", "Parakeet"],
    links: { repo: "https://github.com/agentsmill/naszwhisper" }
  },
  {
    id: "locavi", title: "Locavi", date: "2026-06", era: 5,
    cat: ["produkty"],
    desc: "Marketplace przestrzeni usługowych na godziny — „Airbnb dla specjalistów” z agentowym concierge'em układającym grafik. 176 commitów w trzy dni.",
    tech: ["Next.js 16", "Supabase", "Stripe", "PWA"], badge: "fly",
    links: { live: "https://locavi.fly.dev" }
  },
  {
    id: "aog-game", title: "Age of Agents: The Game → Token Golf", date: "2026-06", era: 5,
    cat: ["gry", "aiml"],
    desc: "Turowe 4X uczące projektowania systemów agentowych (pamięć, narzędzia, MCP, subagenci jako drzewko technologii) — z pivotem do Token Golf: platformera prompt-golfa z fine-tunowanym Qwen3 0.6B liczącym wynik w przeglądarce przez WebGPU.",
    tech: ["TypeScript", "Qwen3 ONNX", "WebGPU"], badge: "fly",
    links: { live: "https://aog-token-golf.fly.dev" }
  },
  {
    id: "open-droids", title: "Open Droids", date: "2026-06", era: 5,
    cat: ["produkty", "robotyka"],
    desc: "Agentowy e-commerce robotyki open-source: Medusa v2 + własne serwery MCP (sklep, admin, core), API pod opendroids.pl.",
    tech: ["Medusa", "MCP", "Node"], links: {}
  },
  {
    id: "bielik", title: "Eksperymenty z Bielikiem", date: "2026-06", era: 5,
    cat: ["aiml", "gry"],
    desc: "Benchmarki polskiego modelu Bielik — w tym Snake pisany na czas jako test prędkości generacji.",
    tech: ["Python", "Bielik"], links: {}
  },
  {
    id: "silnik-bess", title: "Silnik ROI BESS", date: "2026-06", era: 5,
    cat: ["produkty"],
    desc: "Silnik opłacalności magazynów energii dla przemysłowego klienta: arbitraż cenowy, autokonsumpcja PV, rynek mocy i moc umowna → NPV, IRR, LCOS.",
    tech: ["Python", "Monte Carlo", "Streamlit"], links: {}
  },
  {
    id: "npl", title: "Radar przetargów i grafiki lekarskie", date: "2026-06", era: 5,
    cat: ["produkty"],
    desc: "Self-hostowany system dla klienta z sektora medycznego: monitoring przetargów NFZ + planowanie obsad lekarskich. 99 commitów, wciąż rozwijany.",
    tech: ["Python", "Docker"], links: {}
  },
  {
    id: "token-drag-race", title: "Token Drag Race", date: "2026-06", era: 5, featured: true,
    cat: ["aiml", "gry"],
    desc: "Wyścigi LLM-ów w pikselowej Warszawie nocą: auta jadą w rytm streamowanych tokenów, czas mierzy serwer przy każdym chunku, nie klient. Globalny leaderboard, własne modele przez OpenRouter.",
    tech: ["Python", "OpenRouter", "Upstash"], badge: "fly",
    links: { live: "https://hidden-breeze-443.fly.dev/", repo: "https://github.com/agentsmill/token-drag-race" }
  },
  {
    id: "szkolenia-bank", title: "Pakiet szkoleniowy AI dla banku", date: "2026-06", era: 5,
    cat: ["produkty"],
    desc: "Materiały szkoleniowe opakowane w świat sci-fi „rok 3000”: scenariusze, generatory danych i materiały dla prowadzących.",
    tech: ["Gemini", "NotebookLM"], links: {}
  },
  {
    id: "aule-v2", title: "Aule Energy", date: "2026-04", era: 5,
    cat: ["produkty"],
    desc: "Chat-first asystent doboru ofert energii dla domów i mikrofirm: analiza faktur OCR, pełny rachunek roczny, deterministyczny silnik obliczeń („LLM nigdy nie liczy”). 236 commitów.",
    tech: ["Next.js", "Supabase", "OpenRouter"], badge: "fly",
    links: { live: "https://aule-energy.fly.dev" }
  },

  // ── Era 6: VII–VIII 2026 ────────────────────────────────────────────────────
  {
    id: "slyd", title: "SLYD", date: "2026-07", era: 6,
    cat: ["gry"],
    desc: "Neonowa gra slope-like w three.js: kula, zbocze, coraz szybciej. Jeden link, zero instalacji, wbudowane pętle „pobij mnie”.",
    tech: ["three.js", "Vite", "TypeScript"], badge: "fly",
    links: { live: "https://slyd.fly.dev/", repo: "https://github.com/agentsmill/slyd" }
  },
  {
    id: "wdrozenie-slownik", title: "wdrozenie.ai — strona-słownik", date: "2026-07", era: 6,
    cat: ["sztuka", "produkty"],
    desc: "Strona studia zbudowana jak hasło słownikowe odmienione przez wszystkie 7 przypadków: Mianownik to hero, Dopełniacz — zasady, Celownik — odbiorcy. Dwujęzyczna, z esejami.",
    tech: ["HTML", "Cloudflare Pages"], badge: "cf",
    links: { live: "https://wdrozenie.ai" }
  },
  {
    id: "empowerher", title: "EmpowerHer", date: "2026-07", era: 6, featured: true,
    cat: ["produkty"],
    desc: "Platforma treningowa dla kobiet: wideo-treningi, osobisty plan, rezerwacje sesji 1:1 z kalendarzem i płatnością przy bookingu. Działa komercyjnie pod własną domeną. 138 commitów.",
    tech: ["Next.js", "Supabase", "Stripe"],
    links: { live: "https://app.empowerher.pl" }
  },
  {
    id: "wspolnik", title: "Wspólnik", date: "2026-07", era: 6,
    cat: ["produkty"],
    desc: "AI-wspólnik dla polskich MŚP: partner biznesowy na czacie (Telegram-first) — pilnuje kosztów, czyta polskie rejestry, przynosi codzienny brief i zwołuje radę mentorów. Stripe, KSeF, 17 równoległych worktree. Pilot.",
    tech: ["TypeScript", "Claude", "Stripe", "KSeF"], links: {}
  },
  {
    id: "szkola-claude", title: "Polska Szkoła Claude", date: "2026-07", era: 6,
    cat: ["produkty", "sztuka"],
    desc: "Landing centrum kompetencji AI z „Kulą Wiedzy” — WebGL-ową chmurą tysięcy świecących punktów (z fallbackiem do Canvas 2D). Zero build stepu.",
    tech: ["Three.js", "WebGL"], badge: "cf",
    links: { live: "https://szkola-claude.pages.dev" }
  },
  {
    id: "anatomy", title: "Anatomy of a Thought", date: "2026-07", era: 6, featured: true,
    cat: ["sztuka", "aiml"],
    desc: "Autoportret Claude'a: siedem rozdziałów przez jeden forward pass — tokenizacja, atencja, strumień rezydualny, sampling. Prawdziwa matematyka (softmax, entropia Shannona), zabawkowe wagi — i strona uczciwie o tym mówi.",
    tech: ["Three.js", "jeden plik HTML"],
    links: { live: "https://agentsmill.github.io/anatomy-of-a-thought/", repo: "https://github.com/agentsmill/anatomy-of-a-thought" }
  },
  {
    id: "residual-stream", title: "The Residual Stream", date: "2026-07", era: 6,
    cat: ["sztuka", "aiml"],
    desc: "Bliźniaczy autoportret transformera — ta sama idea wykonana przez model Kimi. Porównanie „jak różne modele opowiadają o sobie” jako eksperyment artystyczny.",
    tech: ["HTML", "Kimi"],
    links: { live: "https://agentsmill.github.io/residual-stream/", repo: "https://github.com/agentsmill/residual-stream" }
  },
  {
    id: "robotami", title: "Robotami + Józef", date: "2026-07", era: 6,
    cat: ["robotyka", "leon"],
    desc: "Mózg-obserwator dla robota Reachy Mini („Richie”): percepcja, model świata, planowanie — najpierw w symulacji MuJoCo. Na pokładzie Józef: głosowy kompan Leona z wake-wordem „Hej Józef”.",
    tech: ["Python", "MuJoCo", "GStreamer"],
    links: { repo: "https://github.com/agentsmill/robotami" }
  },
  {
    id: "stoik", title: "Stoik", date: "2026-07", era: 6,
    cat: ["robotyka"],
    desc: "Stoicki kompanion dnia codziennego na Reachy Mini: obserwuje otoczenie, mówi po polsku i gani za gapienie się w telefon.",
    tech: ["Python", "Reachy Mini"], links: {}
  },
  {
    id: "petent", title: "PETENT", date: "2026-07", era: 6,
    cat: ["gry"],
    desc: "Komediowa gra głosowa na Steam: przekonaj Grażynę — urzędniczkę-LLM — żeby podbiła pieczątkę, zanim urząd zamkną o 15:00. „Papers, Please × Kafka × improwizacja”, 100% lokalnej inferencji.",
    tech: ["Unity", "LLMUnity", "Chatterbox TTS"], badge: "steam", links: {}
  },
  {
    id: "neooffice", title: "NeoOffice", date: "2026-07", era: 6,
    cat: ["produkty"],
    desc: "Chatowy pakiet biurowy: agent tworzy i edytuje prawdziwe pliki .docx / .xlsx / .pptx przez serwery MCP, a aplikacja Tauri pokazuje podgląd na żywo z ręczną edycją bloków.",
    tech: ["Tauri", "Rust", "MCP", "React"], links: {}
  },
  {
    id: "latent-weather", title: "Latent Weather", date: "2026-07", era: 6,
    cat: ["aiml"],
    desc: "Kontrolowany eksperyment badawczy: czy latentny model pogody (w duchu JEPA) degraduje się wolniej w długich rolloutach niż równy mu model pikselowy na danych ERA5?",
    tech: ["Python", "PyTorch", "ERA5"],
    links: { repo: "https://github.com/agentsmill/latent-weather" }
  },
  {
    id: "stockcast", title: "StockCast", date: "2026-07", era: 6,
    cat: ["aiml"],
    desc: "Benchmark modelu TiRex-2 na prognozach pogody i polskich cen energii — notebooki, raporty, wnioski.",
    tech: ["Python", "TiRex-2"], links: {}
  },
  {
    id: "pokesolver", title: "PokeSolver", date: "2026-07", era: 6,
    cat: ["aiml"],
    desc: "System badawczy do prywatnych rozgrywek pokerowych: deterministyczny silnik reguł, percepcja ekranu, modelowanie przeciwnika i aktuacja GUI z replayem zdarzeń — pięć rozdzielonych warstw.",
    tech: ["Python"], links: {}
  },
  {
    id: "processor", title: "Processor", date: "2026-06", era: 5,
    cat: ["produkty", "aiml"],
    desc: "Task mining → BPMN: zdarzenia z ekranu zamieniane w aktywności, sprawy i diagramy procesów. 84 commity PoC.",
    tech: ["Python", "pm4py", "ollama"], links: {}
  },
  {
    id: "grafiki", title: "Grafiki", date: "2026-07", era: 6,
    cat: ["produkty"],
    desc: "Multi-tenant SaaS do grafików dyżurów zespołów medycznych: izolacja organizacji wymuszona przez Postgres Row-Level Security na poziomie bazy, nie dyscypliny zapytań. Najświeższy projekt — commity z dziś.",
    tech: ["FastAPI", "Postgres RLS", "Docker"], links: {}
  },
  {
    id: "ai-video-portfolio", title: "Portfolio wideo i obrazu AI", date: "2026-08", era: 6,
    cat: ["produkty", "sztuka"],
    desc: "Siostrzana strona: produkcja wideo i obrazu AI dla klientów MŚP — showreel, klip UGC, koszty jednostkowe i ryzyka regulacyjne.",
    tech: ["HTML", "GitHub Pages"],
    links: { live: "https://agentsmill.github.io/ai-video-portfolio/", repo: "https://github.com/agentsmill/ai-video-portfolio" }
  },
  {
    id: "omniportfolio", title: "Omniportfolio", date: "2026-08", era: 6, meta: true,
    cat: ["sztuka"],
    desc: "Ta strona. Zbudowana w jedną sesję przez Claude Fable 5 na podstawie analizy 65 repozytoriów, historii tysięcy sesji i przeszukania dysku. Kardiogram powyżej to prawdziwe dane.",
    tech: ["Claude Fable 5", "vanilla JS"], links: {}
  },
];

// Archiwum: rzeczy, które istniały — jedna linia każda.
const ARCHIVE = [
  { title: "focus-and-flow", date: "2025-03", note: "aplikacja skupienia (TS)" },
  { title: "ominscraper", date: "2025-03", note: "scraper — narzędzie robocze" },
  { title: "comic-diary / knowledge-explorer / code-pixel-lab", date: "2025-04", note: "trzy eksperymenty low-code w jeden dzień" },
  { title: "prompt-master / prosty-mistrz", date: "2025-04", note: "wcześniejsze iteracje Mistrza Promptów" },
  { title: "Latarnik AI", date: "2025-05", note: "eksperyment" },
  { title: "dawne-czasy", date: "2025-07", note: "dwa podejścia (repo pub+priv)" },
  { title: "arch-scout", date: "2025-08", note: "narzędzie architektoniczne (Lovable)" },
  { title: "SGDH", date: "2025-08", note: "notebooki badawcze (3 iteracje)" },
  { title: "Domowik", date: "2025-11", note: "prywatny eksperyment (Python)" },
  { title: "AI Engineer", date: "2026-01", note: "repo do nauki Pythona" },
  { title: "bess-solver (BTM)", date: "2026-01", note: "zalążek Silnika BESS" },
  { title: "pokA / LocalGame", date: "2026-01", note: "gry i silniki robocze" },
  { title: "Sklep Internetowy", date: "2026-03", note: "e-commerce (Lovable)" },
  { title: "Automnia video-promo", date: "2026-03", note: "showreel dla klienta" },
  { title: "MRi_Cams", date: "2026-05", note: "eksploracja obrazowania MRI (DICOM)" },
  { title: "llm-quiz-validator", date: "2026-04", note: "walidator quizów LLM (stub)" },
  { title: "Hetman Robotics", date: "2026-06", note: "pakiet startupowy: pitch decki, modele finansowe" },
  { title: "Auto Ja", date: "2026-06", note: "raport: cyfrowy klon instruktora" },
  { title: "PokerLab (clawd)", date: "2026-07", note: "play-money poker dla agentów AI" },
  { title: "autoreels / VideoAI-LTX", date: "2026-07", note: "eksperymenty wideo-automatyzacji" },
  { title: "AutoProcurer / AutoProtector", date: "2026-07", note: "agent zakupowy · companion bezpieczeństwa" },
  { title: "Od lutownicy do humanoida", date: "2026-07", note: "roadmapa robotyki (artefakt HTML)" },
  { title: "Dashboard leasingu 2024/2025", date: "2026-07", note: "wizualizacja danych rynkowych" },
  { title: "POZ Lubelskie / Działka Data Center", date: "2026-07", note: "analizy inwestycyjne z GeoSQL" },
  { title: "Monitor Rynku Książek", date: "2026-07", note: "eksperyment Google AI Studio" },
  { title: "ARM-SO-101", date: "2026-07", note: "konfiguracja ramienia robotycznego (LeRobot)" },
];

// ── Rodziny projektów ────────────────────────────────────────────────────────
// Jak projekty wyrastały jedne z drugich. chain: od najstarszego do najnowszego.
const LINEAGES = [
  {
    id: "energia",
    title: "Od gry o OZE do produktu energetycznego",
    note: "Najdłuższa linia: 16 miesięcy od pierwszego repo do asystenta, który liczy prawdziwe rachunki.",
    chain: [
      { title: "OZE Developer Manager", date: "2025-03", pid: "oze-developer-manager" },
      { title: "GreenSolver ×4", date: "2025-07", pid: "greensolver" },
      { title: "bess-solver", date: "2026-01" },
      { title: "FlexMarket", date: "2026-04", pid: "flexmarket" },
      { title: "Aule Energy", date: "2026-04", pid: "aule-v2" },
      { title: "Silnik ROI BESS", date: "2026-06", pid: "silnik-bess" },
    ],
  },
  {
    id: "agenty",
    title: "Agenci, którzy stali się grą",
    note: "Wizualizacja własnych sesji AI urosła do gry o projektowaniu systemów agentowych — a ta wypączkowała platformerem z modelem w przeglądarce.",
    chain: [
      { title: "Age of Agents", date: "2026-06", pid: "age-of-agents" },
      { title: "AoG: The Game", date: "2026-06", pid: "aog-game" },
      { title: "Token Golf", date: "2026-07", pid: "aog-game" },
      { title: "aog-ft (fine-tuning Qwen3)", date: "2026-07" },
    ],
  },
  {
    id: "prompty",
    title: "Trzy podejścia do jednego pomysłu",
    note: "Mistrz Promptów w trzy tygodnie przeszedł trzy pełne przepisania. Nauka iterowania na żywym organizmie.",
    chain: [
      { title: "mistrz-promptow", date: "2025-04", pid: "mistrz-promptow" },
      { title: "prosty-mistrz", date: "2025-04" },
      { title: "prompt-master", date: "2025-04" },
    ],
  },
  {
    id: "pokemon",
    title: "Pokémon jako poligon AI",
    note: "Od sklepu, przez silnik decyzyjny na Kaggle, po system percepcji ekranu i modelowania przeciwnika.",
    chain: [
      { title: "Pokemate TCG Hub", date: "2026-02", pid: "pokemate-hub" },
      { title: "Pokemate (Kaggle)", date: "2026-06", pid: "pokemate-engine" },
      { title: "PokeSolver", date: "2026-07", pid: "pokesolver" },
    ],
  },
  {
    id: "roboty",
    title: "Jeden robot, trzy osobowości",
    note: "Reachy Mini o imieniu Richie dostał mózg-obserwatora, głosowego kompana dla Leona i stoickiego mentora dla dorosłych.",
    chain: [
      { title: "Robotami — mózg", date: "2026-07", pid: "robotami" },
      { title: "Józef dla Leona", date: "2026-07", pid: "robotami" },
      { title: "Stoik", date: "2026-07", pid: "stoik" },
    ],
  },
  {
    id: "transformer",
    title: "Ten sam autoportret, dwa modele",
    note: "To samo zadanie — „opowiedz o swojej architekturze od środka” — wykonane przez Claude'a i przez Kimi. Eksperyment porównawczy przebrany za sztukę.",
    chain: [
      { title: "Anatomy of a Thought (Claude)", date: "2026-07", pid: "anatomy" },
      { title: "The Residual Stream (Kimi)", date: "2026-07", pid: "residual-stream" },
    ],
  },
  {
    id: "zdrowie",
    title: "Powrót do medycyny — od strony systemów",
    note: "Wykształcenie lekarskie wraca jako domena: przetargi, obsady dyżurów i izolacja danych wymuszona przez bazę.",
    chain: [
      { title: "Krwawy Biznes", date: "2025-03", pid: "krwawy-biznes" },
      { title: "Radar + grafiki lekarskie", date: "2026-06", pid: "npl" },
      { title: "Analizy POZ", date: "2026-07" },
      { title: "Grafiki (RLS)", date: "2026-07", pid: "grafiki" },
    ],
  },
];

// Wątki przecinające portfolio w poprzek — nie chronologia, tylko obsesje.
const THREADS = [
  {
    label: "Model działa lokalnie",
    note: "Powracająca zasada: inferencja na urządzeniu, bez chmury. Apple Neural Engine, WebGPU, Raspberry Pi, Unity.",
    items: ["NaszWhisper", "LastBox", "Token Golf", "PETENT", "Mansa Musa", "Bielik"],
  },
  {
    label: "Agent z narzędziami (MCP)",
    note: "Od pierwszej kompozycji przez MCP w Ableton Live po serwery MCP pisane samodzielnie.",
    items: ["Akordy Zmierzchu", "Age of Agents", "Open Droids", "NeoOffice", "Wspólnik", "Processor"],
  },
  {
    label: "Policz to uczciwie",
    note: "Liczby nigdy nie wychodzą z modelu językowego — zawsze z deterministycznego silnika obok niego.",
    items: ["Aule Energy", "Silnik ROI BESS", "GreenSolver", "StockCast", "Bilans tokenów Polski"],
  },
  {
    label: "Wyjaśnić, jak to działa",
    note: "Sztuka i edukacja jako to samo zadanie: pokazać wnętrze maszyny, nie tylko jej wynik.",
    items: ["Anatomy of a Thought", "The Residual Stream", "Mistrz Promptów", "Polska Szkoła Claude", "Token Drag Race"],
  },
];

// ── Rachunek tokenów ─────────────────────────────────────────────────────────
// Policzone z lokalnych transkryptów sesji (~/.claude/projects + ~/.codex).
// UWAGA: przetrwały tylko sesje od czerwca 2026 — wcześniejsze zostały wyczyszczone.
const TOKENS = {
  window: "VI – VIII 2026",
  sessions: 150,          // 100 plików sesji Claude Code + 50 sesji Codex
  messages: 17048,        // odpowiedzi modeli z licznikiem zużycia (po deduplikacji)
  claude:  { total: 5495579177, output: 22405912, cacheRead: 5306681809, fresh: 188897368 },
  codex:   { total: 1335642388, output: 5435809, cacheRead: 1285237504, fresh: 50405000 },
  get grand()      { return this.claude.total + this.codex.total; },
  get grandOutput(){ return this.claude.output + this.codex.output; },
  get grandFresh() { return this.claude.fresh + this.codex.fresh; },
  get grandCache() { return this.claude.cacheRead + this.codex.cacheRead; },
  models: [
    { name: "Claude Opus 4.8", tokens: 2040000000 },
    { name: "Claude Fable 5", tokens: 1770000000 },
    { name: "Claude Sonnet 5", tokens: 1420000000 },
    { name: "GPT-5.5 (Codex)", tokens: 1335642388 },
    { name: "Claude Opus 5", tokens: 274800000 },
  ],
  top: [
    { name: "Wspólnik", tokens: 897000000 },
    { name: "EmpowerHer", tokens: 568600000 },
    { name: "Token Drag Race", tokens: 498300000 },
    { name: "Szkoła Claude / WorldModels", tokens: 374200000 },
    { name: "PETENT", tokens: 328700000 },
    { name: "Robotami", tokens: 283800000 },
  ],
};

// Kardiogram hero: liczba projektów/mies. (GitHub + lokalne, III 2025 → VIII 2026)
const HEARTBEAT = [
  { m: "III 25", n: 9 }, { m: "IV 25", n: 6 }, { m: "V 25", n: 2 }, { m: "VI 25", n: 0 },
  { m: "VII 25", n: 4 }, { m: "VIII 25", n: 8 }, { m: "IX 25", n: 1 }, { m: "X 25", n: 0 },
  { m: "XI 25", n: 1 }, { m: "XII 25", n: 1 }, { m: "I 26", n: 5 }, { m: "II 26", n: 1 },
  { m: "III 26", n: 3 }, { m: "IV 26", n: 8 }, { m: "V 26", n: 4 }, { m: "VI 26", n: 20 },
  { m: "VII 26", n: 17 }, { m: "VIII 26", n: 3 },
];

const CATEGORIES = {
  gry:      { label: "Gry",                  color: "#E8A33D" },
  sztuka:   { label: "Sztuka i wizualizacje", color: "#B48CF2" },
  produkty: { label: "Produkty i narzędzia",  color: "#5CC8DB" },
  aiml:     { label: "AI / ML",              color: "#7FD8A4" },
  leon:     { label: "Zabawy z Leonem",      color: "#F28B82" },
  robotyka: { label: "Robotyka",             color: "#9AA7BC" },
};
