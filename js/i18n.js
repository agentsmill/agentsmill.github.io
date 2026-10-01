/* Dwujęzyczność karty budowania i muzeum: polski i angielski.

   ARCHITEKTURA. Ten plik wczytuje się MIĘDZY js/projects-data.js a js/main.js
   i przy wybranym angielskim NADPISUJE dane w miejscu, zanim main.js zdąży
   cokolwiek wyrenderować. Karty, oś czasu, rodziny, wątki i spis renderują się
   więc po angielsku bez wiedzy main.js o tym, że coś się stało.

   Napisy, które main.js składa sam (przyciski kart, lead spisu, liczby w hero),
   idą przez window.__t(klucz, polski) — polski tekst stoi przy wywołaniu, więc
   bez tego pliku strona dalej działa, tylko po polsku.

   Statyczna treść strony idzie przez atrybuty w HTML:
     data-i18n="klucz"             → textContent
     data-i18n-html="klucz"        → innerHTML
     data-i18n-attr="attr:klucz;…" → atrybuty (aria-label, placeholder, content)

   Przełączenie języka przeładowuje stronę. Świadomie: main.js buduje DOM raz,
   przy starcie, a odtwarzanie jego pracy z zewnątrz byłoby dublowaniem logiki.

   Kosmos nie ładuje tego pliku i zostaje po polsku — to osobna gra z własnym HUD-em. */

(function () {
  const KLUCZ = "mp-jezyk";

  /* localStorage w try/catch: w trybach prywatności, które go blokują, rzuca wyjątek,
     a bez osłony padał cały ten plik — razem z przełącznikiem, więc wersja angielska
     stawała się nieosiągalna. */
  function czytaj() { try { return localStorage.getItem(KLUCZ); } catch (e) { return null; } }
  function zapisz(w) { try { localStorage.setItem(KLUCZ, w); } catch (e) { /* zostaje adres */ } }

  /* Kolejność: ?lang= w adresie (link do wersji angielskiej da się komuś wysłać),
     potem zapamiętany wybór, na końcu polski. */
  const zAdresu = new URLSearchParams(location.search).get("lang");
  const jezyk = zAdresu === "en" || zAdresu === "pl" ? zAdresu : (czytaj() === "en" ? "en" : "pl");
  if (zAdresu === "en" || zAdresu === "pl") zapisz(zAdresu);

  /* ── Statyczna treść strony i napisy składane przez main.js ──────────── */
  const STATYCZNE = {
    "meta.title": "Mateusz Pawełczuk — a building record with AI",
    "meta.desc":
      "A building record: games, generative art, products and things made with Leon — " +
      "everything built with AI since March 2025, on one timeline with the development of the models.",
    "meta.titleMuzeum": "The Museum of Building — Mateusz Pawełczuk",
    "meta.descMuzeum":
      "A walk through a building record with AI: six era halls, interactive exhibits, " +
      "a cardiogram line underfoot.",

    "a11y.skip": "Skip to content",
    "a11y.top": "MP — back to top",
    "a11y.nav": "Sections",
    "a11y.vitals": "Statistics",
    "a11y.collab": "Work with me",
    "a11y.filters": "Filter by category",
    "a11y.search": "Filter the project list",
    "a11y.ekg": "Cardiogram: projects per month from {od} to {do}",

    "nav.wyroznione": "Featured",
    "nav.wspolpraca": "Work with me",
    "nav.wideo": "Video",
    "nav.oscasu": "Timeline",
    "nav.rodziny": "Families",
    "nav.leon": "Leon",
    "nav.spis": "Index",
    "nav.muzeum": "Museum",
    "nav.kosmos": "Cosmos",

    "hero.eyebrow": "Building record",
    "hero.h1": "Technology<br>is my medium.",
    "hero.lead":
      "My name is Mateusz Pawełczuk. I started out in medicine; today I say what I have " +
      "to say through technology. Since March 2025, in step with each new generation " +
      "of models, I have built games, generative art, products for Polish companies and a few " +
      "things for my son. Consulting work and stage talks came along the way. This page " +
      "gathers all of it in one place.",
    "hero.ctaMuzeum": "Enter the museum",
    "hero.ctaKosmos": "Cosmic portfolio",
    "hero.tag": "(experiment)",
    "hero.ctaScroll": "or scroll the record ↓",
    "hero.uwaga":
      "The cosmic portfolio is a 3D browser game — {n} projects as worlds on six orbits. " +
      "It needs a more capable computer and a newer browser than the rest of this site.",
    "hero.ekg": "the pulse of building — one beat = one project",

    "vitals.miesiecy": "months",
    "vitals.projektow": "projects",
    "vitals.wdrozen": "live deployments",
    "vitals.gwiazdek": "on GitHub",

    "sek.wyroznione": "Featured",
    "sek.wideo": "Generative video",
    "sek.oscasu": "Timeline",
    "sek.rodziny": "Project families",
    "sek.leon": "Playing with Leon",
    "sek.spis": "Everything, indexed",
    "sek.archiwum": "Archive",

    "collab.kicker": "Work with me",
    "collab.title": "Want something like this for your company?",
    "collab.lead":
      "Commissions — generative art and AI video, business consulting, agent systems and " +
      "computational engines, training and keynote talks — I take on as a freelancer, " +
      "through the <b translate=\"no\">wdrozenie.ai</b> studio. This page is a chronicle of building; " +
      "the offer, the scope of work and contact details are there.",

    "lead.wyroznione":
      "{n} things worth seeing first — whatever runs commercially, has the most work " +
      "underneath, or is simply the most interesting. The rest waits on the timeline and in the index below.",
    "lead.wideo":
      "A separate branch of the same work: image and video made with models instead of a camera. " +
      "Two full productions below; the complete video portfolio — with unit costs and regulatory " +
      "risks written out — lives on its own site.",
    "lead.oscasu":
      "Technology on the left of each event, projects on the right. The rhythm of every era " +
      "traced like a monitor readout — because the tempo is part of this story too.",
    "lead.rodziny":
      "Little of it starts from nothing. The same problem returns in new incarnations, and " +
      "projects grow out of one another — sometimes after days, sometimes after a year.",
    "lead.watki":
      "Not chronology but recurring obsessions — they only become visible once everything is laid side by side.",
    "lead.leon":
      "The most important user is five years old and has firm requirements: trains, fires and " +
      "absolutely no reading. Acceptance testing is merciless, feedback immediate.",
    "lead.archiwum":
      "Not everything was made for exhibition — but all of it was practice. Experiments, " +
      "études and working tools, one line each.",

    "h3.watki": "Threads running across",
    "h3.ekspres": "Leon’s Fire Engine Express",
    "h3.jozef": "Józef on the robot Richie",
    "h3.wiewiorka": "Leon’s Squirrel",
    "leon.ekspres":
      "A train racer: you put out fires with water, collect stars, and at the stations you " +
      "work through a quiz on 36 real Polish road signs. Designed so that you can lose to the " +
      "rabbits — but there is never a “game over”, only a medal and encouragement. The hero is " +
      "a moustached plumber-firefighter. Deliberately not Mario.",
    "leon.jozef":
      "A Reachy Mini with its own observer brain and a voice companion called Józef: the wake " +
      "word “Hej Józef”, translations, phonetics, small talk — with a safety layer and a log for " +
      "the parent. The robot arrived in July, and Leon greeted it by name.",
    "leon.jozefAccess": "private repo — the robot lives in the living room",
    "leon.wiewiorka":
      "A 3D forest maze and a squirrel collecting porcini. Fly agarics and bitter boletes grow " +
      "right beside them and carry no markers, so the choice belongs to the eyes. A wrong mushroom " +
      "earns a sneeze and a page of the atlas with a real photograph — never a defeat screen. " +
      "Works on a phone, held upright or sideways.",
    "leon.zagraj": "Play",
    "leon.kod": "Source code",

    "wideo.showreel": "Showreel",
    "wideo.showreelOpis": "A pass across the productions — shots generated, not filmed.",
    "wideo.ugc": "UGC clip — podcast format",
    "wideo.ugcOpis": "Short form in the register today’s AI influencers are learning from.",
    "wideo.cta": "The whole video portfolio",
    "wideo.brak": "Your browser can’t play this file.",
    "wideo.pobierz": "Download the video",
    "wideo.lokalne": "Generated here",
    "wideo.lokalneOpis":
      "The shots below were not made in the cloud. MiniMax Hailuo 3 produced them on a machine " +
      "standing in this flat — an NVIDIA GB10 with 121 GB of memory. All the generated material " +
      "on this page: 33 images and 2 video shots.",
    "wideo.mglawica": "A drift through a nebula",
    "wideo.mglawicaOpis": "5.2 s · 768×448 · generated in 64 s",
    "wideo.orbita": "A pass over the terminator",
    "wideo.orbitaOpis": "5.2 s · 768×448 · generated in 50 s",
    "wideo.czasy":
      "Generation times on the GB10: a 1024×576 image — 10 s; an era plate at 1024×384 — 8 s; " +
      "a 5.2 s video shot at 768×448 — between 48 and 64 s. In total 27 project covers " +
      "(4 min 30 s), 6 era plates (56 s) and 3 video shots (2 min 42 s).",

    "ui.zobacz": "View",
    "ui.telegram": "Telegram bot",
    "ui.wakes": "(server start ~{s} s)",
    "ui.wakesTytul": "The server sleeps when nobody uses it. The first visit takes up to {s} seconds, then it runs normally.",
    "ui.wszystkie": "All",
    "ui.wyroznione": "Featured — start with these",
    "ui.rytm": "rhythm",
    "ui.zrzut": "Screenshot: {t}",
    "ui.okladka": "AI visualisation",
    "ui.szukaj": "Search by name, technology or description…",
    "ui.brak": "Nothing matches this search.",
    "ui.wynikow": "Results: {n}",
    "ui.wiecej": "more",
    "ui.mniej": "less",
    "ui.spisLead":
      "Everything built — <b>{p}</b> projects described on the timeline and <b>{a}</b> archive " +
      "entries, <b>{r}</b> in total. <b class=\"lead-star\">★</b> marks the <b>{b}</b> best — start " +
      "with those. Type a name, a technology or a category to narrow the list.",

    "footer.meta":
      "This page was built by AI as well — Claude Fable 5, in a single session, on 4 August 2026; " +
      "the 30 September update was done by Claude Opus 5.5. Dates and numbers come from the " +
      "GitHub API and local repositories; links checked on 30 IX 2026. The cardiogram is real data.",

    "muz.laduje": "Opening the museum…",
    "muz.powrot": " Building record",
    "muz.tura": "Show me around",
    "muz.lista": "List",
    "muz.listaPelna": " of exhibits",
    "muz.podpowiedz": "Left thumb walks, right thumb looks · tap an exhibit",
    "muz.podpowiedzMysz": "Click to enter · <b>WASD</b> walks, mouse looks, <b>Shift</b> runs · <b>Esc</b> exits",
    "muz.zamknijTabliczke": "Back to the walk",
    "muz.eksponaty": "Exhibits",
    "muz.zamknij": "Close",
    "muz.brakWebgl": "This browser has no WebGL — the museum needs it to exist.",
    "muz.wrocKarta": "Back to the building record",
    "przelacznik.tytul": "Switch language",
  };

  /* ── Epoki ───────────────────────────────────────────────────────────── */
  const EPOKI = {
    1: { title: "First experiments", rhythm: "15 repositories in 2 months",
         lead: "Two weeks after the Claude Code research preview, the first repo appears. Games, prompts, satellites — all at once, to find out what this technology can actually do." },
    2: { title: "First wonders with MCP", rhythm: "fewer projects, stranger ideas",
         lead: "Claude 4 ships on 22 May. Four days later, Opus composes in Ableton Live over MCP: “Mieczysław Fogg’s unknown masterpiece for the end of the world”." },
    3: { title: "Domain tools", rhythm: "13 repositories in 4 months",
         lead: "The first token in Claude Code (July) — and that same month Bajarz, the first complete agent system. Energy, the office, mathematics: AI starts doing work with professional weight." },
    4: { title: "Toward products", rhythm: "the quiet before the storm",
         lead: "Fewer repositories, more thinking. The Aule Energy prototype, a new Mac and the beginning of local session history — foundations for 2026." },
    5: { title: "The year of agents", rhythm: "25+ projects in 4 months",
         lead: "Models ship weekly and projects every few days: a Kaggle hackathon, a game for Leon, a Tibia clone, generative art and more than 250 stars on GitHub." },
    6: { title: "A one-person studio", rhythm: "27 projects in 3 months",
         lead: "Claude Code, Codex and Kimi CLI run in parallel. Paying platforms appear, a game headed for Steam, robots and this site — and after the July peak, a trainer for the medical licensing exam, a mushroom game for Leon, a map of the air strikes on Ukraine and an AI simulation for boards." },
  };

  const KATEGORIE = {
    gry: "Games", sztuka: "Art and visuals", produkty: "Products and tools",
    aiml: "AI / ML", leon: "Playing with Leon", robotyka: "Robotics",
  };

  /* Kamienie milowe po polskiej etykiecie. Etykiety bez polskich słów (same nazwy
     modeli i daty) nie potrzebują wpisu — zostają, jak są. */
  const KAMIENIE = {
    "Premiera MCP (Model Context Protocol)": "MCP (Model Context Protocol) launches",
    "Claude 4: Opus 4 i Sonnet 4 (22 V)": "Claude 4: Opus 4 and Sonnet 4 (22 V)",
    "Pierwszy token w Claude Code": "First token in Claude Code",
    "Nowy Mac — początek zachowanej historii sesji": "A new Mac — the start of preserved session history",
    "Opus 4.7 · GPT-5.5 · DeepSeek V4 — trzy premiery w 8 dni": "Opus 4.7 · GPT-5.5 · DeepSeek V4 — three launches in 8 days",
    "Gemma 4 — otwarty model, hackathon „Gemma 4 Good”": "Gemma 4 — an open model, and the “Gemma 4 Good” hackathon",
    "Claude Fable 5 / Mythos 5 — pierwszy publiczny model klasy Mythos (9 VI)": "Claude Fable 5 / Mythos 5 — the first public Mythos-class model (9 VI)",
  };

  /* Rodziny po id; `kroki` tłumaczy tytuły ogniw po polskiej nazwie. */
  const RODZINY = {
    energia: { title: "From a renewable-energy game to an energy product",
      note: "The longest line: 16 months from the first repo to an assistant that calculates real bills." },
    agenty: { title: "Agents that became a game",
      note: "A visualisation of my own AI sessions grew into a game about designing agent systems — which in turn budded into a platformer with a model running in the browser." },
    prompty: { title: "Three takes on one idea",
      note: "Prompt Master went through three complete rewrites in three weeks. Learning to iterate on a living organism." },
    pokemon: { title: "Pokémon as an AI proving ground",
      note: "From a shop, through a decision engine on Kaggle, to a system that reads the screen and models the opponent." },
    roboty: { title: "One robot, three personalities",
      note: "A Reachy Mini named Richie got an observer brain, a voice companion for Leon and a stoic mentor for grown-ups." },
    postac: { title: "The model as a character you talk to",
      note: "The same idea twelve months apart: the model takes on a role and plays a scene with you. What changed is where it lives — from the cloud to your own computer." },
    transformer: { title: "The same self-portrait, two models",
      note: "The same task — “describe your architecture from the inside” — done by Claude and by Kimi. A comparative experiment dressed up as art." },
    zdrowie: { title: "Back to medicine — from the systems side",
      note: "The medical degree returns as a domain: tenders, duty rosters, data isolation enforced by the database — and a trainer for the exam that opens the profession." },
  };
  const KROKI = {
    "Silnik ROI BESS": "BESS ROI engine",
    "Robotami — mózg": "Robotami — the brain",
    "Józef dla Leona": "Józef for Leon",
    "Stoik": "The Stoic",
    "Agent AI Bajarz — mistrz gry": "Bajarz — AI game master",
    "Józef — kompan Leona": "Józef — Leon’s companion",
    "PETENT — urzędniczka Grażyna": "PETENT — Grażyna the clerk",
    "Krwawy Biznes": "Bloody Business",
    "Radar + grafiki lekarskie": "Tender radar + medical rosters",
    "Analizy POZ": "Primary-care analyses",
    "Grafiki (RLS)": "Rosters (RLS)",
    "Trener LEK": "LEK Trainer",
  };

  const WATKI = {
    lokalnie: { label: "The model runs locally",
      note: "A recurring rule: inference on the device, no cloud. Apple Neural Engine, WebGPU, Raspberry Pi, Unity." },
    mcp: { label: "An agent with tools (MCP)",
      note: "From the first composition over MCP in Ableton Live to MCP servers written from scratch." },
    uczciwie: { label: "Count it honestly",
      note: "No number and no answer comes from a single model on trust: a deterministic engine computes it, a source is cited, or two independent models check it with an arbiter — and whatever is uncertain gets a label." },
    wyjasnic: { label: "Explain how it works",
      note: "Art and education as the same task: to show the inside of the machine, not just its output." },
  };
  /* Pozycje wątków to krótkie nazwy projektów; tłumaczymy tylko te po polsku. */
  const NAZWY = {
    "Akordy Zmierzchu": "Chords of Dusk",
    "Silnik ROI BESS": "BESS ROI engine",
    "Bilans tokenów Polski": "Poland’s token balance",
    "Mistrz Promptów": "Prompt Master",
    "Polska Szkoła Claude": "The Polish Claude School",
    "Trener LEK": "LEK Trainer",
    "Naloty na Ukrainę": "Air strikes on Ukraine",
  };

  /* Archiwum po tytule: nowy tytuł (tylko gdy polski) i notka. */
  const ARCHIWUM = {
    "focus-and-flow": { note: "a focus app (TS)" },
    "ominscraper": { note: "scraper — a working tool" },
    "comic-diary / knowledge-explorer / code-pixel-lab": { note: "three low-code experiments in one day" },
    "prosty-mistrz": { note: "second iteration of Prompt Master" },
    "prompt-master": { note: "third iteration of Prompt Master" },
    "Latarnik AI": { note: "experiment" },
    "PowerAgent": { note: "energy agent — private repo" },
    "arch-scout": { note: "architecture tool (Lovable)" },
    "SGDH": { note: "research notebooks (3 iterations)" },
    "Domowik": { note: "private experiment (Python)" },
    "AI Engineer": { note: "a repo for learning Python" },
    "bess-solver (BTM)": { note: "the seed of the BESS engine" },
    "pokA / LocalGame": { note: "games and working engines" },
    "Sklep Internetowy": { title: "Online shop", note: "e-commerce (Lovable)" },
    "Automnia video-promo": { note: "a showreel for a client" },
    "MRi_Cams": { note: "exploring MRI imaging (DICOM)" },
    "llm-quiz-validator": { note: "an LLM quiz validator — concept sketch" },
    "Hetman Robotics": { note: "a startup pack: pitch decks, financial models" },
    "Auto Ja": { note: "report: a digital clone of an instructor" },
    "PokerLab (clawd)": { note: "play-money poker for AI agents" },
    "autoreels / VideoAI-LTX": { note: "video automation experiments" },
    "AutoProcurer": { note: "purchasing agent — online demo" },
    "AutoProtector": { note: "a safety companion (TS monorepo)" },
    "Od lutownicy do humanoida": { title: "From soldering iron to humanoid", note: "a robotics roadmap (HTML artefact)" },
    "Dashboard leasingu 2024/2025": { title: "Leasing dashboard 2024/2025", note: "market data visualisation" },
    "POZ Lubelskie / Działka Data Center": { title: "Lublin primary care / data-centre plot", note: "investment analyses with GeoSQL" },
    "Monitor Rynku Książek": { title: "Book Market Monitor", note: "a Google AI Studio experiment" },
    "ARM-SO-101": { note: "robot arm setup (LeRobot)" },
  };

  /* Etykiety „dlaczego nie ma linku” i nieliczne polskie tagi technologii. */
  const DOSTEP = {
    "repo prywatne": "private repo",
    "działa lokalnie": "runs locally",
    "poprzednik Aule Energy": "predecessor of Aule Energy",
    "zgłoszenie na Kaggle": "Kaggle submission",
    "eksperyment lokalny": "local experiment",
    "wdrożenie u klienta": "deployed for a client",
    "materiały dla klienta": "client materials",
    "działa na robocie": "runs on the robot",
    "w produkcji": "in the making",
    "eksperyment badawczy · repo prywatne": "research experiment · private repo",
    "badanie lokalne": "local research",
    "kod zamknięty": "closed source",
  };
  const TAGI = {
    "zero zależności": "zero dependencies",
    "jeden plik HTML": "single HTML file",
    "grafika proceduralna": "procedural graphics",
  };

  /* ── Projekty. Nazwy własne zostają; tłumaczy się opis i tytuły opisowe. ── */
  const PROJEKTY = {
    "oze-developer-manager": { desc: "The first game: you run a renewable energy development company. The beginning of everything — repo no. 1." },
    "oko-saurona": { title: "The Eye of Sauron", desc: "Satellite data platform: acquisition, visualisation and analysis of imagery. (private repo)" },
    "orthank": { desc: "A document analysis system for Polish municipalities — AI reads zoning plans." },
    "krwawy-biznes": { title: "Bloody Business", desc: "A turn-based game about running a blood donation centre — medical roots in the shape of a strategy game." },
    "mistrz-promptow": { title: "Prompt Master", desc: "An interactive prompt engineering course built on energy-sector examples — lessons, exercises, scoring. Three iterations in three weeks." },
    "akordy-zmierzchu": { title: "Chords of Dusk", desc: "A composition made by Claude 4 Opus driving Ableton Live over MCP: “Mieczysław Fogg plays his greatest unknown masterpiece during the end of the world”. Four days after the model shipped." },
    "greensolver": { desc: "A green energy solver — four approaches to the same problem in four weeks, prototype to Final. Learning how to iterate." },
    "bajarz": { title: "Bajarz — AI game master", desc: "“Chronicles of the Dark World” — an RPG game master in the Witcher setting, running sessions on the *Witcher: Game of Imagination* system. Character creation, sessions saved by ID, voice narration and the AG-UI v2.0 protocol. Built in July 2025 — the oldest deployment still answering." },
    "korpolajf": { title: "CorpoLife RPG", desc: "Pixel-art office satire: you gather data, drink coffee, manage stress and get the report to the board by 17:30." },
    "math-garden": { desc: "A garden of mathematics — an educational experiment in Python. (private repo)" },
    "aule-v1": { title: "Aule Energy — prototype", desc: "The first attempt at an energy purchasing assistant. Four commits that would grow, a year later, into a product with more than 330." },
    "pokemate-hub": { desc: "A Pokémon TCG shop and collector hub — fast e-commerce built low-code (Lovable) with hand-written fixes. Live on its own domain." },
    "mansa-musa": { desc: "A personal financial agent: Telegram + Claude Agent SDK, entirely local on a Mac mini behind Tailscale. No institution sees the data." },
    "pokescale": { desc: "A Pokédex-style comparative scale running on a MacBook trackpad’s Force Touch sensors — it ranks objects lightest to heaviest without ever weighing in grams." },
    "flexmarket": { desc: "B2B SaaS for tranche-based energy purchasing from the Polish power exchange: a modular Next.js + NestJS monolith with queues and websockets. Architectural practice before the bigger products." },
    "lastbox": { desc: "An offline survival assistant: Raspberry Pi 5 + LoRa radio + a custom Gemma 4 E2B fine-tune. An entry for the Kaggle “Gemma 4 Good” hackathon — two months from idea to working device." },
    "bilans-tokenow": { title: "Poland’s token balance", desc: "An AI data centre simulator: the real GPU infrastructure in Poland (Helios, Athena, PIAST-AI) against the announced 5 GW — the whole model in a single HTML file." },
    "reverie": { desc: "“A mind that grows toward your attention.” Plant a thought, move the cursor — a luminous structure colonises the space around your focus. Every refresh starts from nothing." },
    "ekspres-leona": { title: "Leon’s Fire Engine Express", desc: "A train racer for a five-year-old: Leon puts out fires with water, collects stars and works through a quiz on 36 real road signs. No “game over”, but you can still lose — a fair challenge." },
    "tibijka": { desc: "A browser Tibia clone in a single HTML file — proof that nostalgia fits in 200 kilobytes." },
    "age-of-agents": { desc: "Your Claude Code sessions as a calm pixel-art kingdom: a session is a settler, tools are workshops, tokens are the granary. More than 300 commits and an npm package." },
    "pokemate-engine": { desc: "A hybrid engine for the Kaggle Pokémon TCG AI Battle Challenge: heuristics → determinised ISMCTS → a self-play network." },
    "naszwhisper": { desc: "A native macOS app for dictating in Polish — fully local, on the Apple Neural Engine (Parakeet 0.6B). Tap ⌘, speak, and the text lands wherever the cursor is." },
    "aog-game": { desc: "A turn-based 4X that teaches agent system design (memory, tools, MCP, subagents as a tech tree) — with a pivot into Token Golf: a prompt-golf platformer with a fine-tuned Qwen3 0.6B scoring in the browser over WebGPU." },
    "open-droids": { desc: "Agentic e-commerce for open-source robotics: Medusa v2 plus custom MCP servers (shop, admin, core) on its own domain." },
    "bielik": { title: "Bielik experiments", desc: "Benchmarks of the Polish Bielik model — including Snake written against the clock as a generation-speed test." },
    "silnik-bess": { title: "BESS ROI engine", desc: "A profitability engine for battery energy storage, built for an industrial client: price arbitrage, PV self-consumption, the capacity market and contracted power → NPV, IRR, LCOS." },
    "npl": { title: "Tender radar and medical rosters", desc: "A self-hosted system for a client in the medical sector: monitoring public healthcare tenders plus doctor rostering. 99 commits, still in development." },
    "token-drag-race": { desc: "LLMs racing through a pixel Warsaw at night: cars move to the rhythm of streamed tokens, and the server times every chunk, not the client. Global leaderboard, your own models via OpenRouter." },
    "szkolenia-bank": { title: "AI training pack for a bank", desc: "Training material wrapped in a sci-fi “year 3000” setting: scenarios, data generators and facilitator materials." },
    "aule-v2": { desc: "A chat-first assistant for choosing energy offers for homes and micro-businesses: OCR invoice analysis, a full annual bill, and a deterministic calculation engine (“the LLM never does the arithmetic”). More than 330 commits and still growing." },
    "autocompany": { desc: "The skeleton of a company run by agents, with a human on the loop: a plan of ten departments built on tools an agent can actually operate, checked by 46 agents — including a pass that tried to refute every claim (123 checked, 6 refuted). The first working part is a video channel factory for alternate history: one long film and one Short a day, a Kokoro TTS narrator, publishing through Postiz and a dashboard of charts. 99 commits." },
    "slyd": { desc: "A neon slope-like game in three.js: a ball, a slope, faster and faster. One link, no install, with built-in “beat me” loops." },
    "wdrozenie-slownik": { title: "wdrozenie.ai — the dictionary site", desc: "The studio’s site built like a dictionary entry declined through all seven Polish cases: the nominative is the hero, the genitive the principles, the dative the audience. Bilingual, with essays." },
    "empowerher": { desc: "A training platform for women: video workouts, a personal plan, 1:1 session booking with a calendar and payment at checkout. Running commercially. 138 commits." },
    "wspolnik": { title: "Wspólnik — the AI business partner", desc: "An AI partner for Polish small and medium businesses: a business companion in chat (Telegram-first) — it watches costs, reads Polish public registers, delivers a daily brief and convenes a board of mentors. Stripe payments, invoices via KSeF. In pilot with its first users." },
    "szkola-claude": { title: "The Polish Claude School", desc: "A landing page for an AI competence centre with the “Sphere of Knowledge” — a WebGL cloud of thousands of glowing points (with a Canvas 2D fallback). No build step." },
    "anatomy": { desc: "Claude’s self-portrait: seven chapters through a single forward pass — tokenisation, attention, the residual stream, sampling. Real mathematics (softmax, Shannon entropy), toy weights — and the page says so honestly." },
    "residual-stream": { desc: "A twin self-portrait of a transformer — the same idea executed by the Kimi model. “How differently do models describe themselves” as an artistic experiment." },
    "robotami": { desc: "An observer-brain for the Reachy Mini robot (“Richie”): perception, a world model, planning — first in MuJoCo simulation. On board is Józef: Leon’s voice companion with the wake word “Hej Józef”." },
    "stoik": { title: "The Stoic", desc: "A stoic everyday companion on a Reachy Mini: it watches the room, speaks Polish, and scolds you for staring at your phone." },
    "petent": { desc: "A comedic voice game: convince Grażyna — an LLM clerk — to stamp your form before the office closes at 15:00. “Papers, Please × Kafka × improvisation”, 100% local inference. Headed for Steam; the store page is still ahead." },
    "neooffice": { desc: "A chat-driven office suite: the agent creates and edits real .docx / .xlsx / .pptx files through MCP servers, while a Tauri app shows a live preview with manual block editing." },
    "latent-weather": { desc: "A controlled research experiment: does a latent weather model (in the spirit of JEPA) degrade more slowly over long rollouts than an equivalent pixel-space model on ERA5 data?" },
    "stockcast": { desc: "A benchmark of the TiRex-2 model on weather forecasts and Polish energy prices — notebooks, reports, conclusions." },
    "pokesolver": { desc: "A research system for card-game perception: a deterministic rules engine, reading game state off the screen, and opponent modelling — five cleanly separated architectural layers." },
    "processor": { desc: "Task mining → BPMN: screen events turned into activities, cases and process diagrams. An 84-commit proof of concept." },
    "grafiki": { title: "Rosters", desc: "Multi-tenant SaaS for medical team duty rosters: organisation isolation enforced by Postgres Row-Level Security at the database level, not by query discipline." },
    "poligon": { desc: "A platform of environments for evaluating and training LLM agents on business tasks — starting with Polish accounting: KSeF 2.0, VAT and FA(3) invoices. More than 120 commits." },
    "lek-trener": { title: "LEK Trainer", desc: "A trainer for LEK, the Polish medical licensing exam, built on the full official bank of 3,052 CEM questions: a study plan up to exam day, Leitner reviews, 413 flashcards and a mock exam in LEK proportions. CEM publishes no answer key, so every question was solved blind by two different models, and independent arbiters settled the disagreements — disputed questions are flagged, not hidden." },
    "naloty-ukraina": { title: "Air strikes on Ukraine 2022–2026", desc: "A 3D map of Russia’s air campaign against Ukraine since 24 February 2022, built around one question: how much of it reaches the west of the country. Every layer states its scale and source, and since August 2026 the numbers update themselves daily from the Ukrainian Air Force’s morning reports." },
    "wiewiorka-leona": { title: "Leon’s Squirrel", desc: "A 3D game for children aged 4–7: a squirrel crosses a forest maze collecting porcini, while the fly agaric, the death cap and the look-alike bitter bolete have to be recognised by eye — the mushrooms carry no markers. A mistake ends in a sneeze and an atlas with a real photograph, never a game-over screen. Every model and sound is generated in code." },
    "dzwignia": { title: "Dźwignia — the AI leverage game", desc: "An AI-transformation simulation for boards, built for an executive workshop: each participant runs their own division for eight quarters inside one shared company — a second brain, automations, pilots, the IT queue and regulatory risk. A projector board with a QR code and a live shared ranking." },
    "ai-video-portfolio": { title: "AI video and image portfolio", desc: "A sister site: AI video and image production for small and medium clients — showreel, UGC clip, unit costs and regulatory risks." },
    "omniportfolio": { desc: "This page, with the museum and the Cosmos beside it. The first version was built by Claude Fable 5 from 65 repositories and the history of working sessions (4 VIII 2026); the 30 IX update — from 88 repositories by then — by Claude Opus 5.5. The cardiogram is real data." },
  };

  /* ── Nadpisanie danych PRZED main.js ─────────────────────────────────── */
  if (jezyk === "en") {
    document.documentElement.lang = "en";

    if (typeof ERAS !== "undefined") {
      for (const e of ERAS) {
        const t = EPOKI[e.id];
        if (t) { e.title = t.title; e.rhythm = t.rhythm; e.lead = t.lead; }
      }
    }
    if (typeof CATEGORIES !== "undefined") {
      for (const [k, etykieta] of Object.entries(KATEGORIE)) {
        if (CATEGORIES[k]) CATEGORIES[k].label = etykieta;
      }
    }
    if (typeof PROJECTS !== "undefined") {
      for (const p of PROJECTS) {
        const t = PROJEKTY[p.id];
        if (t && t.title) p.title = t.title;
        if (t && t.desc) p.desc = t.desc;
        if (p.access && DOSTEP[p.access]) p.access = DOSTEP[p.access];
        p.tech = p.tech.map((x) => TAGI[x] || x);
      }
    }
    if (typeof MILESTONES !== "undefined") {
      for (const m of MILESTONES) if (KAMIENIE[m.label]) m.label = KAMIENIE[m.label];
    }
    if (typeof LINEAGES !== "undefined") {
      for (const l of LINEAGES) {
        const t = RODZINY[l.id];
        if (t) { l.title = t.title; l.note = t.note; }
        for (const s of l.chain) if (KROKI[s.title]) s.title = KROKI[s.title];
      }
    }
    if (typeof THREADS !== "undefined") {
      for (const w of THREADS) {
        const t = WATKI[w.id];
        if (t) { w.label = t.label; w.note = t.note; }
        w.items = w.items.map((x) => NAZWY[x] || x);
      }
    }
    if (typeof ARCHIVE !== "undefined") {
      for (const a of ARCHIVE) {
        const t = ARCHIWUM[a.title];
        if (!t) continue;
        if (t.note) a.note = t.note;
        if (t.title) a.title = t.title;
      }
    }
  }

  /* ── Napisy dla main.js ──────────────────────────────────────────────── */
  window.__jezyk = jezyk;
  window.__t = (klucz, pl) =>
    jezyk === "en" && STATYCZNE[klucz] !== undefined ? STATYCZNE[klucz] : pl;

  /* ── Statyczna treść i przełącznik ───────────────────────────────────── */
  function przetlumaczStatyczne() {
    if (jezyk !== "en") return;
    for (const el of document.querySelectorAll("[data-i18n]")) {
      const w = STATYCZNE[el.dataset.i18n];
      if (w !== undefined) el.textContent = w;
    }
    for (const el of document.querySelectorAll("[data-i18n-html]")) {
      const w = STATYCZNE[el.dataset.i18nHtml];
      if (w !== undefined) el.innerHTML = w;
    }
    for (const el of document.querySelectorAll("[data-i18n-attr]")) {
      for (const para of el.dataset.i18nAttr.split(";")) {
        const [attr, klucz] = para.split(":").map((x) => x.trim());
        const w = STATYCZNE[klucz];
        if (attr && w !== undefined) el.setAttribute(attr, w);
      }
    }
  }

  /* Przełącznik NIESIE WŁASNY WYGLĄD. Powód wyszedł z pomiaru: karta budowania
     ładuje css/main.css, muzeum css/museum.css, a przycisk mieszkał tylko w tym
     pierwszym — w muzeum wstawiał się poprawnie i był praktycznie niewidoczny.
     Kopiowanie tych samych reguł do dwóch arkuszy skończyłoby się ich
     rozjechaniem przy pierwszej poprawce, więc styl idzie razem z komponentem. */
  function wstrzyknijStyl() {
    if (document.getElementById("lang-switch-styl")) return;
    const st = document.createElement("style");
    st.id = "lang-switch-styl";
    st.textContent = `
      .lang-switch{display:flex;gap:.35rem;align-items:center;margin-left:1.1rem;
        padding:.28rem .55rem;background:rgba(10,14,22,.72);
        border:1px solid rgba(255,255,255,.16);border-radius:99px;cursor:pointer;
        font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:.68rem;
        letter-spacing:.08em;line-height:1;flex:0 0 auto;touch-action:manipulation}
      .lang-switch span{color:rgba(255,255,255,.6);transition:color .15s ease}
      .lang-switch span.on{color:#F2C46D;text-decoration:underline;text-underline-offset:3px}
      .lang-switch:hover{border-color:rgba(242,196,109,.55)}`;
    document.head.appendChild(st);
  }

  function zbudujPrzelacznik() {
    wstrzyknijStyl();
    /* Karta budowania ma .topbar, muzeum .hud-top — jeden przełącznik
       obsługuje oba, więc nie ma dwóch kopii tej samej logiki. */
    const nav = document.querySelector(".topbar, .hud-top");
    if (!nav || nav.querySelector(".lang-switch")) return;
    const nowy = jezyk === "en" ? "pl" : "en";
    const btn = document.createElement("button");
    btn.className = "lang-switch";
    btn.type = "button";
    btn.title = jezyk === "en" ? "Przełącz na polski" : "Switch to English";
    btn.setAttribute("aria-label", btn.title);
    btn.innerHTML =
      `<span lang="pl" class="${jezyk === "pl" ? "on" : ""}">PL</span>` +
      `<span lang="en" class="${jezyk === "en" ? "on" : ""}">EN</span>`;
    btn.addEventListener("click", () => {
      zapisz(nowy);
      /* Język ląduje też w adresie: działa bez localStorage, a link z ?lang=en
         można wysłać komuś, kto nie czyta po polsku. */
      const u = new URL(location.href);
      if (nowy === "pl") u.searchParams.delete("lang"); else u.searchParams.set("lang", "en");
      location.assign(u.toString());
    });
    nav.appendChild(btn);
  }

  /* Skrypt stoi na końcu <body>, więc treść nad nim już jest w DOM — tłumaczymy
     od razu, żeby polski tekst nie mignął przed angielskim. */
  przetlumaczStatyczne();
  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", () => { przetlumaczStatyczne(); zbudujPrzelacznik(); });
  } else {
    zbudujPrzelacznik();
  }
})();
