# Team Shroom Shiny Dex & Weekly Tracker 🍄✨

This website tracks **Team Shroom’s PokeMMO shiny progress**, including:

- 🧬 Living Shiny Dex & Hitlist  
- 📅 Weekly Shiny Events (“Shiny Weekly”)  
- 🧍 Member Shiny Collections & Showcase  
- 💖 Donators & Community Support  

The site is **fully static**, hosted on **GitHub Pages**, and powered by **Google Sheets** as the primary data source — allowing the entire team to contribute without touching code.

---

## 🌍 Live Site

Hosted on GitHub Pages:  
`https://<username>.github.io/<repo>/`

---

## ✏️ How to Update Data (No Code Required)

All main data is managed via **Google Sheets**.

### Shiny Weekly (Primary Source of Truth)
- Shiny Weekly data is edited collaboratively in Google Sheets
- The sheet is published as CSV
- The website fetches the CSV directly at runtime

This allows **any team member** to add or update shinies safely without editing JSON or JavaScript.

---

## 🧠 Data Philosophy

- **Google Sheets = Source of Truth**
- **No manual JSON editing**
- Data is:
  - validated
  - normalized
  - grouped
  - rendered dynamically

This makes the site:
- safer
- scalable
- contributor-friendly
- future-proof

---

## 📁 Project Structure

```txt
/
├── index.html            # Main entry point
├── main.js               # App bootstrap & routing
│
├── src/                  # Application source code
│   ├── core/             # App shell, routing, initialization
│   │   └── router.js
│   │
│   ├── data/             # Data loaders & models
│   │   ├── shinyweekly.loader.js   # CSV fetching & parsing
│   │   ├── shinyweekly.model.js    # Normalization & grouping
│   │   └── csv.utils.js             # Shared CSV helpers
│   │
│   ├── features/         # Feature modules
│   │   ├── shinyweekly/  # Weekly shiny feature
│   │   │   ├── shinyweekly.js
│   │   │   └── shinyweekly.ui.js
│   │   │
│   │   ├── shinydex/     # Living Dex & hitlist logic
│   │   └── showcase/    # Member showcase & stats
│   │
│   ├── ui/               # Shared UI components
│   │   └── unifiedcard.js
│   │
│   └── utils/            # Helpers & normalization
│       └── utils.js
│
├── style/                # All CSS files
│
├── img/                  # Static assets
│   ├── membersprites/    # Member avatars
│   └── symbols/          # Icons & overlays
│
└── README.md

🧩 Architecture Principles

ES Modules only (import / export)

No global variables

No inline JavaScript in HTML

Data → Model → UI separation

Each feature is isolated and composable

🚀 Deployment

Commit and push to the main branch

GitHub Pages is enabled (root /)

The site updates automatically

No build step required.

🛣️ Roadmap
In Progress

 Migrate Shiny Weekly JSON → Google Sheets

 CSV loader & normalization

 Weekly aggregation & stats

 Remove remaining JSON data sources

 Connect Living Dex & Hitlist to Weekly data

Planned

📊 Weekly trends & graphs

🏆 Long-term hunter leaderboards

🎣 Method analytics (Safari, Egg, Alpha, MPB, etc.)

🧪 Validation & error highlighting in Sheets

🧱 Optional React migration

📱 Mobile & accessibility improvements

🏅 Badge case & achievements

🎥 Clip embedding & highlights

🌍 Public data endpoints (CSV / JSON)

💡 Future Ideas

“Shiny of the Week” spotlight

Member profile pages with history timelines

Community milestones & celebrations

Exportable stats

Discord bot integration

Automated sheet validation warnings

Inspired by Pokémon.
Not affiliated with Nintendo, Game Freak, or PokeMMO.
