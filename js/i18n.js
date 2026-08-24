/* Dwujęzyczność karty budowania: polski i angielski.

   ARCHITEKTURA. Ten plik wczytuje się MIĘDZY js/projects-data.js a js/main.js
   i przy wybranym angielskim NADPISUJE dane w miejscu, zanim main.js zdąży
   cokolwiek wyrenderować. Dzięki temu js/main.js i js/projects-data.js —
   oba na liście plików nietykalnych — zostają bez jednej zmiany, a karty,
   oś czasu i spis renderują się po angielsku, nie wiedząc, że coś się stało.

   Statyczna treść strony idzie osobno, przez atrybuty data-i18n w index.html.

   Przełączenie języka przeładowuje stronę. Świadomie: main.js buduje DOM raz,
   przy starcie, a odtwarzanie jego pracy z zewnątrz byłoby dublowaniem logiki,
   która i tak zaraz by się rozjechała. Przeładowanie jest tanie i zawsze zgodne. */

(function () {
  const KLUCZ = "mp-jezyk";
  const jezyk = localStorage.getItem(KLUCZ) === "en" ? "en" : "pl";

  /* ── Statyczna treść strony ──────────────────────────────────────────── */
  const STATYCZNE = {
    "nav.wyroznione": "Featured",
    "nav.wspolpraca": "Work with me",
    "nav.wideo": "Video",
    "nav.oscasu": "Timeline",
    "nav.rodziny": "Families",
    "nav.leon": "Leon",
    "nav.spis": "Index",
    "nav.muzeum": "Museum",
    "nav.kosmos": "Cosmos",
    "hero.eyebrow": "Building record · III 2025 — VIII 2026",
    "hero.h1": "Technology<br>is my medium.",
    "hero.lead":
      "My name is Mateusz Pawełczuk. I started out in medicine; today I say what I have " +
      "to say through technology. Over sixteen months, in step with each new generation " +
      "of models, I built games, generative art, products for Polish companies and a few " +
      "things for my son. Consulting work and stage talks came along the way. This page " +
      "gathers all of it in one place.",
    "hero.ctaMuzeum": "Enter the museum",
    "hero.ctaKosmos": "Cosmic portfolio",
    "hero.tag": "(experiment)",
    "hero.ctaScroll": "or scroll the record ↓",
    "hero.uwaga":
      "The cosmic portfolio is a 3D browser game — 49 projects as worlds on six orbits. " +
      "It needs a more capable computer and a newer browser than the rest of this site.",
    "hero.ekg": "the pulse of building — one beat = one project",
    "vitals.miesiecy": "months",
    "vitals.projektow": "projects",
    "vitals.wdrozen": "live deployments",
    "vitals.sesji": "sessions with AI",
    "vitals.gwiazdek": "on GitHub",
    "sek.wyroznione": "Featured",
    "sek.wyroznioneLead":
      "Eleven things worth seeing first — whatever runs commercially, has the most work " +
      "underneath, or is simply the most interesting. The rest waits on the timeline and in the index below.",
    "sek.wideo": "Generative video",
    "sek.wideoLead":
      "A separate branch of the same work: image and video made with models instead of a camera. " +
      "Two full productions below; the complete video portfolio — with unit costs and regulatory " +
      "risks written out — lives on its own site.",
    "wideo.showreel": "Showreel",
    "wideo.showreelOpis": "A pass across the productions — shots generated, not filmed.",
    "wideo.ugc": "UGC clip — podcast format",
    "wideo.ugcOpis": "Short form in the register today's AI influencers are learning from.",
    "wideo.cta": "The whole video portfolio",
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
      "through the wdrozenie.ai studio. This page is a chronicle of building; the offer, " +
      "the scope of work and contact details are there.",
    "lead.wyroznione":
      "Eleven things worth seeing first — whatever runs commercially, has the most work " +
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
    "h3.ekspres": "Leon's Fire Engine Express",
    "h3.jozef": "Józef on the robot Richie",
    "przelacznik.tytul": "Switch language",
  };

  /* ── Epoki ───────────────────────────────────────────────────────────── */
  const EPOKI = {
    1: { title: "First experiments", rhythm: "15 repositories in 2 months",
         lead: "Two weeks after the Claude Code research preview, the first repo appears. Games, prompts, satellites — all at once, to find out what this technology can actually do." },
    2: { title: "First wonders with MCP", rhythm: "fewer projects, stranger ideas",
         lead: "Claude 4 ships on 22 May. Four days later, Opus composes in Ableton Live over MCP: „Mieczysław Fogg's unknown masterpiece for the end of the world”." },
    3: { title: "Domain tools", rhythm: "13 repositories in 4 months",
         lead: "The first token in Claude Code (July) — and that same month Bajarz, the first complete agent system. Energy, the office, mathematics: AI starts doing work with professional weight." },
    4: { title: "Toward products", rhythm: "the quiet before the storm",
         lead: "Fewer repositories, more thinking. The Aule Energy prototype, a new Mac and the beginning of local session history — foundations for 2026." },
    5: { title: "The year of agents", rhythm: "25+ projects in 4 months",
         lead: "Models ship weekly and projects every few days: a Kaggle hackathon, a game for Leon, a Tibia clone, generative art and 249 stars on GitHub." },
    6: { title: "A one-person studio", rhythm: "20+ projects in 5 weeks",
         lead: "Claude Code, Codex and Kimi CLI run in parallel. Paying platforms appear, a game on Steam, robots — and this site." },
  };

  const KATEGORIE = {
    gry: "Games", sztuka: "Art and visuals", produkty: "Products and tools",
    aiml: "AI / ML", leon: "Playing with Leon", robotyka: "Robotics",
  };

  /* ── Projekty. Nazwy własne zostają; tłumaczy się opis i tytuły opisowe. ── */
  const PROJEKTY = {
    "oze-developer-manager": { desc: "The first game: you run a renewable energy development company. The beginning of everything — repo no. 1." },
    "oko-saurona": { title: "The Eye of Sauron", desc: "Satellite data platform: acquisition, visualisation and analysis of imagery. (private repo)" },
    "orthank": { desc: "A document analysis system for Polish municipalities — AI reads zoning plans." },
    "krwawy-biznes": { title: "Bloody Business", desc: "A turn-based game about running a blood donation centre — medical roots in the shape of a strategy game." },
    "mistrz-promptow": { title: "Prompt Master", desc: "An interactive prompt engineering course built on energy-sector examples — lessons, exercises, scoring. Three iterations in three weeks." },
    "akordy-zmierzchu": { title: "Chords of Dusk", desc: "A composition made by Claude 4 Opus driving Ableton Live over MCP: „Mieczysław Fogg plays his greatest unknown masterpiece during the end of the world”. Four days after the model shipped." },
    "greensolver": { desc: "A green energy solver — four approaches to the same problem in four weeks, prototype to Final. Learning how to iterate." },
    "bajarz": { title: "Bajarz — AI game master", desc: "„Chronicles of the Dark World” — an RPG game master in the Witcher setting, running sessions on the *Witcher: Game of Imagination* system. Character creation, sessions saved by ID, voice narration and the AG-UI v2.0 protocol. Built in July 2025 — the oldest deployment still answering." },
    "korpolajf": { title: "CorpoLife RPG", desc: "Pixel-art office satire: you gather data, drink coffee, manage stress and get the report to the board by 17:30." },
    "math-garden": { desc: "A garden of mathematics — an educational experiment in Python. (private repo)" },
    "aule-v1": { title: "Aule Energy — prototype", desc: "The first attempt at an energy purchasing assistant. Four commits that would grow, a year later, into a product with 236." },
    "pokemate-hub": { desc: "A Pokémon TCG shop and collector hub — fast e-commerce built low-code (Lovable) with hand-written fixes. Live on its own domain." },
    "mansa-musa": { desc: "A personal financial agent: Telegram + Claude Agent SDK, entirely local on a Mac mini behind Tailscale. No institution sees the data." },
    "pokescale": { desc: "A Pokédex-style comparative scale running on a MacBook trackpad's Force Touch sensors — it ranks objects lightest to heaviest without ever weighing in grams." },
    "flexmarket": { desc: "B2B SaaS for tranche-based energy purchasing from the Polish power exchange: a modular Next.js + NestJS monolith with queues and websockets. Architectural practice before the bigger products." },
    "lastbox": { desc: "An offline survival assistant: Raspberry Pi 5 + LoRa radio + a custom Gemma 4 E2B fine-tune. An entry for the Kaggle „Gemma 4 Good” hackathon — two months from idea to working device." },
    "bilans-tokenow": { title: "Poland's token balance", desc: "An AI data centre simulator: the real GPU infrastructure in Poland (Helios, Athena, PIAST-AI) against the announced 5 GW — the whole model in a single HTML file." },
    "reverie": { desc: "„A mind that grows toward your attention.” Plant a thought, move the cursor — a luminous structure colonises the space around your focus. Every refresh starts from nothing." },
    "ekspres-leona": { title: "Leon's Fire Engine Express", desc: "A train racer for a five-year-old: Leon puts out fires with water, collects stars and works through a quiz on 36 real road signs. No „game over”, but you can still lose — a fair challenge." },
    "tibijka": { desc: "A browser Tibia clone in a single HTML file — proof that nostalgia fits in 200 kilobytes." },
    "age-of-agents": { desc: "Your Claude Code sessions as a calm pixel-art kingdom: a session is a settler, tools are workshops, tokens are the granary. 318 commits, an npm package, 249★ on GitHub." },
    "pokemate-engine": { desc: "A hybrid engine for the Kaggle Pokémon TCG AI Battle Challenge: heuristics → determinised ISMCTS → a self-play network." },
    "naszwhisper": { desc: "A native macOS app for dictating in Polish — fully local, on the Apple Neural Engine (Parakeet 0.6B). Tap ⌘, speak, and the text lands wherever the cursor is." },
    "aog-game": { desc: "A turn-based 4X that teaches agent system design (memory, tools, MCP, subagents as a tech tree) — with a pivot into Token Golf: a prompt-golf platformer with a fine-tuned Qwen3 0.6B scoring in the browser over WebGPU." },
    "open-droids": { desc: "Agentic e-commerce for open-source robotics: Medusa v2 plus custom MCP servers (shop, admin, core) on its own domain." },
    "bielik": { title: "Bielik experiments", desc: "Benchmarks of the Polish Bielik model — including Snake written against the clock as a generation-speed test." },
    "silnik-bess": { title: "BESS ROI engine", desc: "A profitability engine for battery energy storage, built for an industrial client: price arbitrage, PV self-consumption, the capacity market and contracted power → NPV, IRR, LCOS." },
    "npl": { title: "Tender radar and medical rosters", desc: "A self-hosted system for a client in the medical sector: monitoring public healthcare tenders plus doctor rostering. 99 commits, still in development." },
    "token-drag-race": { desc: "LLMs racing through a pixel Warsaw at night: cars move to the rhythm of streamed tokens, and the server times every chunk, not the client. Global leaderboard, your own models via OpenRouter." },
    "szkolenia-bank": { title: "AI training pack for a bank", desc: "Training material wrapped in a sci-fi „year 3000” setting: scenarios, data generators and facilitator materials." },
    "aule-v2": { desc: "A chat-first assistant for choosing energy offers for homes and micro-businesses: OCR invoice analysis, a full annual bill, and a deterministic calculation engine („the LLM never does the arithmetic”). 236 commits." },
    "slyd": { desc: "A neon slope-like game in three.js: a ball, a slope, faster and faster. One link, no install, with built-in „beat me” loops." },
    "wdrozenie-slownik": { title: "wdrozenie.ai — the dictionary site", desc: "The studio's site built like a dictionary entry declined through all seven Polish cases: the nominative is the hero, the genitive the principles, the dative the audience. Bilingual, with essays." },
    "empowerher": { desc: "A training platform for women: video workouts, a personal plan, 1:1 session booking with a calendar and payment at checkout. Running commercially. 138 commits." },
    "wspolnik": { title: "Wspólnik — the AI business partner", desc: "An AI partner for Polish small and medium businesses: a business companion in chat (Telegram-first) — it watches costs, reads Polish public registers, delivers a daily brief and convenes a board of mentors. Stripe payments, invoices via KSeF. In pilot with its first users." },
    "szkola-claude": { title: "The Polish Claude School", desc: "A landing page for an AI competence centre with the „Sphere of Knowledge” — a WebGL cloud of thousands of glowing points (with a Canvas 2D fallback). No build step." },
    "anatomy": { desc: "Claude's self-portrait: seven chapters through a single forward pass — tokenisation, attention, the residual stream, sampling. Real mathematics (softmax, Shannon entropy), toy weights — and the page says so honestly." },
    "residual-stream": { desc: "A twin self-portrait of a transformer — the same idea executed by the Kimi model. „How differently do models describe themselves” as an artistic experiment." },
    "robotami": { desc: "An observer-brain for the Reachy Mini robot („Richie”): perception, a world model, planning — first in MuJoCo simulation. On board is Józef: Leon's voice companion with the wake word „Hej Józef”." },
    "stoik": { title: "The Stoic", desc: "A stoic everyday companion on a Reachy Mini: it watches the room, speaks Polish, and scolds you for staring at your phone." },
    "petent": { desc: "A comedic voice game: convince Grażyna — an LLM clerk — to stamp your form before the office closes at 15:00. „Papers, Please × Kafka × improvisation”, 100% local inference. Headed for Steam; the store page is still ahead of us." },
    "neooffice": { desc: "A chat-driven office suite: the agent creates and edits real .docx / .xlsx / .pptx files through MCP servers, while a Tauri app shows a live preview with manual block editing." },
    "latent-weather": { desc: "A controlled research experiment: does a latent weather model (in the spirit of JEPA) degrade more slowly over long rollouts than an equivalent pixel-space model on ERA5 data?" },
    "stockcast": { desc: "A benchmark of the TiRex-2 model on weather forecasts and Polish energy prices — notebooks, reports, conclusions." },
    "pokesolver": { desc: "A research system for card-game perception: a deterministic rules engine, reading game state off the screen, and opponent modelling — five cleanly separated architectural layers." },
    "processor": { desc: "Task mining → BPMN: screen events turned into activities, cases and process diagrams. An 84-commit proof of concept." },
    "grafiki": { title: "Rosters", desc: "Multi-tenant SaaS for medical team duty rosters: organisation isolation enforced by Postgres Row-Level Security at the database level, not by query discipline. The newest project — commits from today." },
    "ai-video-portfolio": { title: "AI video and image portfolio", desc: "A sister site: AI video and image production for small and medium clients — showreel, UGC clip, unit costs and regulatory risks." },
    "omniportfolio": { desc: "This page and the museum beside it. Built by Claude Fable 5 from 65 repositories and the history of thousands of working sessions. The cardiogram is real data." },
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
        if (!t) continue;
        if (t.title) p.title = t.title;
        if (t.desc) p.desc = t.desc;
      }
    }
  }

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
  }

  function zbudujPrzelacznik() {
    const nav = document.querySelector(".topbar");
    if (!nav) return;
    const btn = document.createElement("button");
    btn.className = "lang-switch";
    btn.type = "button";
    btn.title = jezyk === "en" ? "Przełącz na polski" : "Switch to English";
    btn.innerHTML = `<span class="${jezyk === "pl" ? "on" : ""}">PL</span><span class="${jezyk === "en" ? "on" : ""}">EN</span>`;
    btn.addEventListener("click", () => {
      localStorage.setItem(KLUCZ, jezyk === "en" ? "pl" : "en");
      location.reload();
    });
    nav.appendChild(btn);
  }

  addEventListener("DOMContentLoaded", () => { przetlumaczStatyczne(); zbudujPrzelacznik(); });

  window.__jezyk = jezyk;
})();
