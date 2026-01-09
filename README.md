# Team Shroom Shiny Dex & Weekly Tracker 🍄✨

This website tracks **Team Shroom’s PokeMMO shiny progress**, including:

- 🧬 Living Shiny Dex & Hitlist  
- 📅 Weekly Shiny Events (“Shiny Weekly”)  
- 🧍 Member Shiny Collections & Showcase  
- 💖 Donators & Community Support  

The site is **fully static**, hosted on **GitHub Pages**, and powered by **Google Sheets** as the main data source — allowing the entire team to contribute without touching code.

---

## 🌍 Live Site

Hosted on GitHub Pages:  
`https://<username>.github.io/<repo>/`

---

## ✏️ How to Update Data (No Code Required)

All main data is managed via **Google Sheets**.

### Shiny Weekly (Primary Data Source)

- Data is edited collaboratively in Google Sheets  
- The sheet is published as CSV  
- The website fetches it directly at runtime  

➡ This allows **any team member** to add shinies safely without editing JSON or code.

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

## 🧩 Architecture Principles

- ES Modules only (import / export)
- No global variables
- No inline JavaScript in HTML
- Clear Data → Model → UI separation
- Each feature is isolated and composable

---

## 🚀 How Deployment Works

1. Push to the main branch
2. GitHub Pages is enabled (root /)
3. The site updates automatically

No build step required.

---

## 🛣️ Roadmap

In Progress
- Migrate remaining JSON → Google Sheets
- Shiny Weekly CSV loader
- Weekly aggregation & stats
- Replace remaining static data sources
- Connect Living Dex & Hitlist to Weekly data

Planned
- 📊 Weekly trends & graphs
- 🏆 Long-term hunter leaderboards
- 🎣 Method analytics (Safari, Egg, Alpha, MPB, etc.)
- 🧪 Validation & error highlighting in Sheets
- 🧱 React migration (optional, future)
- 📱 Improved mobile UX
- 🏅 Badge case & achievements
- 🎥 Clip embedding & highlights
- 🌍 Public API-style CSV endpoints

---

## 💡 Suggested Future Ideas

- “Shiny of the Week” spotlight
- Member profiles with history timelines
- Community milestones & celebrations
- Exportable stats (CSV / JSON)
- Discord bot integration
- Automated sheet validation warnings

---

Inspired by Pokémon.
Not affiliated with Nintendo, Game Freak, or PokeMMO.

## 📁 Project Structure

```txt
|
├── index.html            # Main HTML entry
├── main.js               # App bootstrap, routing, orchestration
│
├── src/                  # Application logic
│   ├── data/             # Data loading & normalization
│   │   ├── shinyweekly.loader.js
│   │   ├── shinyweekly.model.js
│   │   └── csv.utils.js          # (we will add this or inline it)
│   │
│   ├── features/         # Feature modules
│   │   ├── shinyweekly/
│   │   │   ├── shinyweekly.js
│   │   │   └── shinyweekly.ui.js
│   │   │
│   │   ├── shinydex/
│   │   │   └── shinydexsearch.js
│   │   │
│   │   ├── showcase/
│   │   │   └── showcase.js
│   │   │
│   │   └── donators/
│   │       └── donators.js
│   │
│   ├── ui/
│   │   └── unifiedcard.js
│   │
│   └── utils/
│       └── utils.js
│
├── style/                # CSS
├── img/                  # Static assets
│
├── CNAME
└── README.md


