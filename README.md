# TeamShroom
Retro RPG-style guild dashboard for a PokéMMO shiny-hunting community.

TeamShroom is designed to feel like a real in-game guild interface:
framed panels, hard edges, high contrast, “menu UI” navigation — powered by live community data.

---

## What TeamShroom is
- **Static + client-rendered**
- **Hash-routed** (`#home`, `#showcase`, `#hitlist`, `#shinyweekly`, `#donators`, etc.)
- **Data-driven from JSON** generated from Google Sheets (via published CSV → scripts → `/data/*.json`)

TeamShroom is a guild command board:
- what to hunt
- who found what
- weekly history
- roster + profiles
- donator ledger + tiers

---

## Core identity (design contract)
### Mood target
- Cozy, chill, welcoming underdog guild energy
- Structured + organized + content-driven
- “This is our guild’s command board”

### Visual baseline
- Pixel / PokeRogue-inspired framing
- Thick borders + inner strokes
- Simple depth lines (not soft blur)
- Dark textured backgrounds
- Red/orange accent = interactive / active
- Readable headings, minimal font weights
- Clear hover/pressed states
- No rounded SaaS cards, no glass, no neon

### Structural baseline (global shell)
Layout is always:
- **Top banner + navigation bar**
- **Left sidebar = page brain** (status + controls + notes)
- **Main panel area = content grid / tables / cards**

The shell is the backbone. Pages do not invent their own layout.

---

## Navigation + routing behavior
### Tabs (what users see)
- **HOME**
- **MEMBERS**
- **POKÉDEX**
- **WEEKLY**
- **DONATORS**

### Routing rules (mental model)
- HOME → arrival dashboard
- MEMBERS → roster grid + member profile detail routes
- POKÉDEX → Shinydex systems (Hitlist / Living Dex)
- WEEKLY → weekly overview + week detail
- DONATORS → leaderboard + recent log

### Active tab behavior
The nav highlights the current page and stays consistent across route aliases  
(example: `#pokedex` may resolve internally into a Shinydex route).

---

## The global shell (game UI frame)
Shell responsibilities:
- Controls the top banner and navigation
- Owns the left sidebar container
- Owns the main content mount
- Owns the global **COLLECT / MENU** toggle
- Owns guild plaque/logo behavior
- Sets page-safe spacing and anchoring

Guild plaque behavior:
- Clicking the logo/plaque:
  - plays a sound
  - navigates to a random member profile

---

## Sidebar system (contract-driven)
Sidebars are not page-specific HTML chaos. Every page sidebar follows the same contract.

### Sidebar contract
Each page sidebar is built from:
- **TITLE**
- **DESC / hint line**
- **BLOCKS** (stacked panels)
  - **STATUS**
  - **CONTROLS**
  - **NOTES**

Even when a page has minimal data, blocks can be placeholders so the sidebar stays intentional.

Why this exists:
- consistent hierarchy
- consistent rhythm
- authentic “game menu” feel

---

## Card system (Unified Card)
Most of the site visually revolves around collector cards.

Unified Card renderer supports:
- Pokémon cards
- Member cards

This enforces:
- one visual language
- one spacing system
- one tier/points framing system
- fewer “style drift” bugs

Cards communicate:
- sprite art
- nameplate + points chip
- variant strip icons (standard/secret/alpha/safari)
- claimed/unclaimed/owned states
- tier framing

---

## Data pipeline (source of truth)
TeamShroom is not hardcoded content. It is a UI for a living guild database.

### Source of truth
- Google Sheets → published CSV links

### Transformation layer
Scripts:
- fetch CSV
- normalize rows into stable models
- output structured JSON under `/data/`

JSON files follow a strict envelope:
- `version`
- `generatedAt`
- `source`
- `data[]`

### Runtime trust boundary
The site intentionally does **not** reshape data at runtime.  
The JSON is assumed correct once generated.

---

## Automation
GitHub Actions regenerate datasets on a schedule:
- every ~6 hours: members / weekly / donators / dex / showcase
- hourly: next Discord scheduled event → `home.json`

Goal: the guild dashboard updates itself without manual work.

---

## Pages (feature breakdown)
### HOME (Guild Hall)
Purpose:
- arrival / command board

Main content:
- spotlight (featured shinies)
- bounty target (wanted poster)
- hunter of the week
- next event panel

Sidebar:
- STATUS: members / shinies / points totals
- CONTROLS: quick jumps (event / bounty / hotw / spotlight)
- NOTES: update + reset behaviors

---

### MEMBERS
Two experiences:

**A) Roster overview**
- grid of member cards
- alphabetical sections
- quick scanning

Sidebar:
- STATUS: total members / shinies / points
- CONTROLS: search + sorting
- NOTES: usage hints

**B) Member profile detail**
- profile header stats
- grid of owned Pokémon cards
- filters/sorting for collection

Sidebar becomes a profile control panel:
- personal stats
- collection filters
- notes explain variant toggles/inactivity behavior

---

### POKÉDEX (ShinyDex)
Flagship system page.

**A) Hitlist (legacy claims)**
Meaning:
- first-claim history per Pokémon family (guild legacy)

Sidebar controls are heavy here:
- mode toggle
- search
- unclaimed filter
- sorting
- progress indicator

**B) Living Dex (team ownership counts)**
Meaning:
- how many of each species exist in the guild now

Cards become count summaries with traceability.

---

### WEEKLY
Two views:

**A) Weekly overview**
- grouped by month
- week tiles show week range + shinies count + hunters count

Sidebar:
- STATUS: selected week summary
- CONTROLS: select week, inspect hunters, cycle shinies
- NOTES: reset rules

Also supports a “Show Hunter of the Week” mode toggle.

**B) Week detail**
- member cards for participants
- optional Pokémon cards for that week’s drops
- “who participated / who found what”

---

### DONATORS
Purpose:
- guild support ledger (gratitude + transparency)

Main content:
- leaderboard (rank/name/total/tier)
- recent donations log

Sidebar:
- STATUS: donors, total amount, latest entry
- CONTROLS: leaderboard/recent navigation + prize pool plan hooks
- NOTES: ranking logic

---

## Points / tiers (RPG layer)
Points are treated as a stat:
- tiers drive card framing and prestige signaling
- gives the UI an RPG power curve feel

---

## Interaction patterns
Global:
- hash navigation = instant “menu switching”
- persistent UI frame keeps immersion
- sidebar behaves like a quest log / status screen

Pages:
- clicking cards = inspect / drill down
- filters behave like menu toggles
- tooltips behave like info popups
- tables behave like ledger screens

Special:
- **COLLECT / MENU** switch acts like “hide UI chrome” vs “full command board”

---

## Project structure
Typical layout:
- `/index.html` → entry
- `/main.js` → boot + routing
- `/src/app/*` → shell + render + sidebar + routes
- `/src/features/*` → feature pages (home/members/shinydex/weekly/donators/showcase)
- `/src/domains/*` → shared logic + models
- `/src/data/*` → JSON loading + cache
- `/src/ui/*` → shared UI systems (cards, tooltips, etc.)
- `/style/*` → global + feature CSS
- `/data/*` → generated datasets
- `/scripts/*` → CSV → JSON + event sync
- `/.github/workflows/*` → automation

---

## Local development
There is **no build step**. This is a static ES module site.

Run it with any static server (ES modules require HTTP, not file://):

Example:
```bash
python -m http.server 5173

Then open:

http://localhost:5173/#home

Deployment

Designed for static hosting (GitHub Pages compatible):

commit generated JSON under /data/

site renders client-side from those datasets

One sentence

TeamShroom is a retro RPG guild interface that turns community shiny hunting into a persistent, navigable, evolving history.