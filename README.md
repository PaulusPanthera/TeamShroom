📘 Team Shroom Shiny Dex

This website tracks Team Shroom’s PokeMMO shiny progress, including:

Shiny Weekly results

Team Showcase & individual collections

Shiny Dex Hitlist & Living Dex

Donators & community stats

The project is fully static, hosted on GitHub Pages, and designed to scale over time.

🌱 Project Philosophy

Single source of truth for data (Google Sheets)

No backend, no database, no build step

Readable code over clever code

Built to be maintained by a team, not just one dev

🧠 Architecture Principles

ES Modules only (import / export)

No global variables

No inline JavaScript in HTML

Clear separation:

Data → Model → UI

Each feature is isolated and composable

Static-first, framework-optional

📁 Project Structure
/
├── index.html              # Single-page entry
├── main.js                 # App entrypoint & router
│
├── src/                     # All application logic
│   ├── core/
│   │   ├── utils.js
│   │   ├── unifiedcard.js
│   │
│   ├── data/
│   │   ├── shinyweekly.loader.js   # Google Sheets CSV loader
│   │   ├── shinyweekly.model.js    # Data normalization
│   │
│   ├── features/
│   │   ├── shinyweekly/
│   │   │   └── shinyweekly.ui.js
│   │   ├── shinydex/
│   │   │   └── shinydexsearch.js
│   │   ├── showcase/
│   │   │   └── showcase.js
│   │   └── donators/
│   │       └── donators.js
│
├── style/                   # CSS only
│   ├── base.css
│   ├── layout.css
│   ├── cards.css
│   ├── buttons.css
│   ├── search.css
│   ├── tooltip.css
│   ├── darkmode.css
│   └── donators.css
│
├── img/                     # Static assets
│   ├── membersprites/       # Member avatars
│   └── symbols/             # Icons & overlays
│
├── README.md
└── CNAME

📊 Data Source (Google Sheets)

All data is maintained in one shared Google Sheet so multiple team members can edit safely.

Current Sheets

weekly_data
→ Human-friendly editing sheet (checkboxes, formatting)

Published Export

The sheet is published as CSV and fetched directly:

https://docs.google.com/spreadsheets/d/e/.../pub?output=csv


There are no JSON files anymore for Shiny Weekly.

🔁 Data Flow (Important)
Google Sheets
   ↓ (CSV)
shinyweekly.loader.js
   ↓
shinyweekly.model.js
   ↓
shinyweekly.ui.js
   ↓
Unified Cards


Formatting in Sheets does not break anything

Empty cells are allowed

Extra rows are filtered automatically

✨ Features
Shiny Weekly

Weekly shiny aggregation

Top hunter per week

Symbol overlays (secret, safari, egg, etc.)

Robust against missing data

Shiny Dex

Hitlist view (unclaimed Pokémon)

Living Dex view (owned count)

Region-based grouping

Search & filters

Team Showcase

Individual member pages

All-time shiny collections

Support for external shinies

Donators

Tier assignment

Visual badges

Donation history

🖼 Assets
Member Avatars
/img/membersprites/<membername>sprite.png


Fallback:

examplesprite.png

Symbols
/img/symbols/


Used for:

Secret

Safari

Egg

Event

Alpha

Clip

🚀 Deployment (GitHub Pages)

Push to main

GitHub → Settings → Pages

Source: main / root /

Live at:

https://<username>.github.io/<repo>/

🛣 Roadmap
Short-term

 Google Sheets as data source

 Shiny Weekly refactor

 Finish migration away from /data/*.json

Mid-term

 Player profile stats

 Time-based shiny analytics

 Streaks & trends

 Badge Case

 Mobile polish

Long-term

 Optional React migration

 Admin-only edit helpers

 Multi-team support

 Public API export

⚠️ Disclaimer

Inspired by Pokémon.
Not affiliated with Nintendo, Game Freak, or PokeMMO.
