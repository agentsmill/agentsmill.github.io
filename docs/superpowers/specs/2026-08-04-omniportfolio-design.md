# Omniportfolio — Design Doc

Date: 2026-08-04 · Author: Claude (Fable 5), for Mateusz Pawełczuk · Status: built autonomously, awaiting user review

## Goal

One static website collecting **everything Mateusz built with AI since March 2025** — games, generative art, visualizations, products, tools, and "Zabawy z Leonem" — organized around a **dual timeline**: AI technology milestones interleaved with the projects they enabled. First deploy target: GitHub Pages. Where it gets linked from (pawelczuk.com, wdrozenie.ai) is a later decision, explicitly out of scope.

## Decisions & assumptions log

This session ran autonomously (user away), so instead of one-at-a-time brainstorming questions, key decisions are logged here with reasoning. **Each is cheap to reverse — flag anything to change.**

| # | Decision | Reasoning |
|---|----------|-----------|
| D1 | **Site language: Polish** | User writes in Polish; most projects target Poland (Aule, Wspólnik, NPL, Szkoła Claude); wdrozenie.ai is PL-first. EN toggle deferred (YAGNI). |
| D2 | **Identity: Mateusz Pawełczuk, builds as `agentsmill`** | Commit identity + memory files pin deployments to agentsmill. Site presents the person, links the handle. |
| D3 | **Timeline-centric layout** (user's own idea) with featured cards inline, era chapters, category filters, compact archive at the end | The 1.5-year arc *is* the story: repo dates track model releases almost in real time (first repo = 2 weeks after Claude Code preview; Akordy Zmierzchu = 4 days after Claude 4). |
| D4 | **Curated ~35 entries, not all 65+ repos** | Backup dumps (2026-07-18 batch), version dupes (greensolver 1–3), legal pages, and unclear-provenance repos (edge-agents) would dilute. Archive section notes the rest exists. |
| D5 | **"Zabawy z Leonem" = dedicated section** | User named it explicitly. Contains Strażacki Ekspres Leona + Józef (Reachy Mini voice app). Warm visual treatment. |
| D6 | **Vanilla static site, no build step** (index.html + CSS + JS data file) | GH Pages serves it directly; zero maintenance; easy for user to edit `projects-data.js` by hand; the projects themselves prove no-framework is viable (tibijka = one HTML file). |
| D7 | **Dark theme only, v1** | Matches the material (neon SLYD, pixel-art, reverie, terminal roots). Dual theme doubles QA. |
| D8 | **Deploy to `agentsmill/agentsmill.github.io` (user root site)** | The portfolio indexes ~15 sites living under `agentsmill.github.io/*` — the root URL is the natural table of contents. Repo rename/delete is trivial if user prefers `/omniportfolio` subpath. User explicitly authorized GH Pages deploy. |
| D9 | **No secrets/infra on the page** | No Hetzner IP, no private-repo internals; private products get name + public one-liner only (matching their public GitHub descriptions). |
| D10 | **Tool honesty** | The story is "building with AI", not one vendor: Claude Code (since 2025-07), earlier Lovable/chat workflows, later Codex, Kimi CLI, Gemini. Timeline says so. |
| D11 | **Fly.io links marked** | Fly machines can cold-start or die; badge + tooltip so dead links don't look like broken craft. |
| D12 | **This site is itself an exhibit** | Footer meta-note: the portfolio about AI-building was built by Claude Fable 5 in one session on 2026-08-04. |

## Approaches considered

- **A. Pure timeline** — one long river, every project a node. Prettiest narrative; hard to scan for "show me the best thing you made". Rejected as sole structure.
- **B. Gallery-first** — classic portfolio grid + small timeline below. Scannable but generic; buries the user's explicit timeline idea. Rejected.
- **C. Hybrid (chosen)** — hero with stats → featured strip (6 best) → **the timeline as the main body** (era chapters, tech-milestone markers, project cards, category filter) → Zabawy z Leonem section → compact archive → footer. A reads like a story, B's scannability preserved via featured strip + filters.

## Information architecture

1. **Hero** — name, one-line bio (lekarz × AI), tagline about 1.5 roku, stat chips (65+ repozytoriów · ~20 działających aplikacji · 249★ · 6+ narzędzi AI), links: GitHub, wdrozenie.ai, pawelczuk.com.
2. **Wyróżnione** (8 cards): age-of-agents (249★, npm), EmpowerHer, Reverie, Strażacki Ekspres Leona, Token Drag Race, LastBox (Kaggle), NaszWhisper, Anatomy of a Thought. Larger cards, category color, live links.
3. **Oś czasu** — vertical line, six eras, each with: era header (PL name + date range + 1-sentence framing), tech milestones (small markers: model/tool releases), project cards (title, month, 1–2 sentence desc, tech tags, links live/repo, category dot). Filter chips: Wszystkie · Gry · Sztuka i wizualizacje · Produkty i narzędzia · AI/ML · Zabawy z Leonem · Robotyka. Filtering dims non-matching cards (keeps timeline continuity) rather than removing.
4. **Zabawy z Leonem** — warm card pair (Ekspres + Józef/Richie), short human copy.
5. **Archiwum** — dense grid of remaining entries (name, month, one-liner, link if any) + note "…oraz kilkanaście repozytoriów roboczych".
6. **Stopka** — contact links, meta-note (D12), "źródła dat: GitHub, historie sesji".

### Timeline eras (working copy, PL)

1. **Pierwsze eksperymenty** (III–IV 2025) — Claude Code research preview (II 2025), MCP fresh; first repos: OZE Developer Manager, Oko Saurona, Orthank, Krwawy Biznes, prompt-games.
2. **Pierwsze cuda z MCP** (V–VI 2025) — Claude 4 (22 V); Akordy Zmierzchu (26 V — Opus 4 komponuje przez Ableton MCP); Latarnik AI.
3. **Narzędzia domenowe** (VII–X 2025) — Claude Code GA/first token (VII), Opus 4.1 + GPT-5 (VIII), Sonnet 4.5 (IX); GreenSolver ×3, KorpoLajf RPG, arch-scout (Lovable), math-garden, SGDH.
4. **W stronę produktów** (XI 2025 – II 2026) — Opus 4.5 (XI), Gemini 3; Domowik, Aule Energy v1, pokemate-tcg-hub; local sessions history begins (I 2026).
5. **Rok agentów** (III–VI 2026) — Opus 4.7 (IV), **Fable 5 (9 VI)**, Gemma 4; LastBox (hackathon), Age of Agents (249★), Tibijka, Reverie, Strażacki Ekspres Leona, Bilans tokenów Polski, NaszWhisper, Aule Energy v2.
6. **Studio jednoosobowe** (VII–VIII 2026) — Opus 5 (24 VII); Wspólnik, EmpowerHer, SLYD, Token Drag Race, Token Golf, Anatomy of a Thought, Residual Stream, Robotami/Józef, Szkoła Claude, AI-video portfolio — plus Codex i Kimi CLI w zestawie narzędzi.

## Data model

`js/projects-data.js` exports two plain arrays:

```js
// PROJECTS: {id, title, date: "YYYY-MM", era: 1..6, cat: ["gry"|"sztuka"|"produkty"|"aiml"|"leon"|"robotyka"],
//   desc, tech: [..], links: {live?, repo?, npm?}, badge?: "fly"|"npm"|"kaggle"|"steam", featured?, archived?}
// MILESTONES: {date: "YYYY-MM", label, detail?}  // tech events rendered as small markers
```

Rendering: main.js groups by era, sorts by date, interleaves milestones, builds DOM. No dependencies.

## Visual direction (refined during build with frontend-design skill)

Dark near-black base with one luminous accent per category (game=amber, art=violet, product=cyan, aiml=green, leon=warm coral, robotics=steel); timeline line = subtle gradient glow echoing *Reverie*; typography: strong display serif or grotesk for H1/era headers, system stack for body; PL diacritics everywhere; tasteful motion (scroll-reveal, reduced-motion respected); mobile: timeline collapses to single left-rail line.

## Error handling & edge cases

- Dead live-links: Fly badge tooltip "aplikacja może się wybudzać kilka sekund"; links verified 2026-08-04 via fetch.
- No-JS: server-less static — content is in data file, so provide `<noscript>` note; acceptable tradeoff for v1 (data-driven render).
- Long titles/descriptions: CSS clamp; cards fixed rhythm.

## Implementation plan (compressed, this session)

1. Scaffold files (index.html, css/main.css, js/projects-data.js, js/main.js, assets/favicon.svg, README.md, .nojekyll).
2. Fill projects-data.js from the inventory below (+ filesystem agent report when it lands).
3. Build layout + styles per frontend-design guidance; then interactions (filters, reveal).
4. Verify: local server, browser pane, desktop+mobile viewports, click-test featured links, HTML validity sanity.
5. Deploy: git init → commit → `gh repo create agentsmill/agentsmill.github.io --public` → push → verify live URL → report to user with revert instructions.

Verification gates between steps replace multi-session plan ceremony (autonomous session; deviation from writing-plans skill noted).

## Inventory (curation source)

**Featured (8):** age-of-agents (2026-06, 249★, npm, 318 commits, RTS viz of AI sessions), EmpowerHer (2026-07, live paying SaaS at app.empowerher.pl), Reverie (2026-06, generative art), Strażacki Ekspres Leona (2026-06, gra dla Leona), Token Drag Race (2026-06, LLM race in pixel Warsaw, Fly), LastBox (2026-04/05, Kaggle Gemma 4 Good, RPi+LoRa), NaszWhisper (2026-06, macOS PL dictation, Parakeet/ANE), Anatomy of a Thought (2026-07, Claude self-portrait, real math/toy weights).

**Post-sweep additions (filesystem agent):** PETENT (Unity Steam voice-comedy, Grażyna the LLM clerk), POKESCALE (Force Touch trackpad scale), NeoOffice (MCP+Tauri office suite), Mansa Musa (personal finance agent, Claude Agent SDK+Telegram), Grafiki (medical duty scheduling, Postgres RLS — newest work), Stoik (Reachy Mini stoic companion), PokerLab, PokeSolver (NLHE research system), Polska Szkoła Claude (WebGL Kula Wiedzy, Cloudflare), wdrozenie.ai "Słownik" (site as dictionary entry through 7 Polish cases), Latent Weather (JEPA-style research), FlexMarket, StockCast (TiRex-2 benchmark), Tibijka, SLYD, Bielik experiments, Aule Energy v2 (236 commits, "LLM never does the math"), Wspólnik (most-invested product), Locavi (176 commits in ~3 days), Silnik BESS, Open Droids, Processor (task mining→BPMN), Robotami/Józef + ARM-SO-101.

**Client-confidentiality rule:** no client or employer names anywhere in the public repo — client work is described generically ("system dla klienta z sektora medycznego", "pakiet szkoleniowy AI dla banku", "silnik ROI dla przemysłowego klienta"). Public product names (Aule, Wspólnik, EmpowerHer, Locavi) are fine — their descriptions are already public on GitHub. This doc is committed publicly, so it follows the same rule.

**Verified third-party (excluded):** nanoclaw (nanocoai — confirmed via contributors API), Pokemon-TCGP-Card-Scanner (1vcian), autoresearch (karpathy), lerobot, Exegol/hacks security lab. **Date caveat:** Lovable scaffold commits (2025-01-01) are artifacts — GitHub repo creation dates are authoritative for those.

**Timeline (selection):** 2025: OZEDM/oze-developer-manager (III), Oko Saurona (III), Orthank (III), Krwawy Biznes (III), Mistrz Promptów + prompt-master + prosty-mistrz (IV), Latarnik AI (V), Akordy Zmierzchu (V), dawne-czasy (VII), GreenSolver (VII–VIII, "×4 podejścia"), KorpoLajf RPG (VIII), arch-scout (VIII, Lovable), math-garden (VIII), SGDH (VIII–IX, podyplomówka?), Domowik (XI), Aule Energy v1 (XII). 2026: pokemate-tcg-hub (II), Sklep Internetowy (III), Aule v2 era (IV–VI), Exegol (IV), LastBox (IV–V), MansaMusa (IV), Bilans tokenów Polski (VI), Reverie (VI), Ekspres Leona (VI), Tibijka (VI), Age of Agents (VI), Pokemate (VI), NaszWhisper (VI), Locavi (VI), AoG: The Game/Token Golf (VI–VII), Open Droids (VI), Bielik-DFlash + bielik-snake (VI), Token Drag Race (VI–VII), SLYD (VII), EmpowerHer (VII), Wspólnik (VII), Szkoła Claude/WorldModels (VII), Anatomy of a Thought (VII), Residual Stream (VII), Robotami/Józef + ARM-SO-101 (VII), PETENT (VII), StockCast (VII), AutoProtector (VII), autoreels (VII), VideoAI-LTX (VII), NPL/dyżury + POZ (VII), Działka Data Center (VII), SIlnik_BESS (VI–VIII), Monitor Rynku Książek (VII), AI-video portfolio (VIII), Omniportfolio (VIII, meta).

**Archive-only:** focus-and-flow, ominscraper, comic-diary-ai-stories, knowledge-explorer-hub, code-pixel-lab, politykaprywatnosci, Automnia, BTM, Thewaight, FlexMarket, LEAD, hacks, faith, Auto Ja, NeoOffice, Oferty, Kimi DC, pharma-pl, AI Engineer, szkolenia komercyjne (bez nazw klientów — tylko "szkolenia AI dla banków"), podyplomówki AI w zdrowiu.

**Excluded:** edge-agents (provenance unclear — README = Agentics Foundation), backup batch 2026-07-18 as separate entries (projects appear under their real names), politykaprywatnosci? (archive line only).

## Tech-milestone list (site copy, verified)

XI 2024 MCP · II 2025 Claude 3.7 + Claude Code (research preview) · V 2025 Claude 4 (Opus komponuje muzykę) · VII 2025 pierwszy token w Claude Code (osobisty kamień milowy) · VIII 2025 Opus 4.1, GPT-5 · IX 2025 Sonnet 4.5 + Claude Code 2.0 · X 2025 Haiku 4.5 · XI 2025 Opus 4.5, Gemini 3 · I 2026 początek lokalnej historii sesji (nowy Mac) · II 2026 Gemini 3.1 Pro · III 2026 GPT-5.4 · IV 2026 Opus 4.7, GPT-5.5, DeepSeek V4 (8 dni) · V 2026 Gemma 4 (hackathon LastBox) · 9 VI 2026 **Claude Fable 5 / Mythos 5** · 24 VII 2026 Opus 5.

## Addendum (2026-08-04, user decision mid-session): Muzeum Budowania

| # | Decision | Reasoning |
|---|----------|-----------|
| D13 | **Hybrid: index (karta) + museum.html (Three.js)** — user-confirmed | Fast scannable page for clients; walkable museum as the wow layer. Portal button in hero + topbar; museum links back. |
| D14 | **On-rails navigation (scroll/swipe)** — user-confirmed | Camera glides a corridor through six era halls; click exhibit → camera focus + DOM plaque. Works on mobile, zero learning curve. |
| D15 | Exhibits are interactive objects, not framed images (Centrum Kopernik brief) | 8 bespoke procedural low-poly exhibits for featured projects (train, pixel castle, neon slope, LoRa mast, attention sphere…), touch → animate; other projects as holographic plinths grouped per hall. |
| D16 | Signature continuity | The amber EKG line runs along the museum floor as the guide path — same data, third dimension. |
| D17 | Tech: three.js pinned from CDN (import map), reuses projects-data.js; DOM overlay for plaques (crisp Polish text, real links); fog culling, no shadows, pixelRatio clamp; WebGL-fail → link back to karta; „Lista eksponatów” DOM list as no-3D path. |

## Future (explicitly deferred)

EN version · per-project screenshots/OG images · link from pawelczuk.com / wdrozenie.ai · custom domain · RSS/changelog.
