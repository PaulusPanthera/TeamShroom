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

➡ This allows **any team member** to add shinies safely.

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

---

## 📁 Project Structure

```txt
/
├── index.html            # Main entry point
├── main.js               # App bootstrap & routing
│
├── src/                  # Application source code
│   ├── core/             # App shell, routing, init
│   │   └── router.js
│   │
│   ├── data/             # Data loaders & models
│   │   ├── shinyweekly.loader.js
│   │   ├── shinyweekly.model.js
│   │   └── csv.utils.js
│   │
│   ├── features/         # Feature modules
│   │   ├── shinyweekly/  # Weekly shiny feature
│   │   │   ├── shinyweekly.js
│   │   │   └── shinyweekly.ui.js
│   │   │
│   │   ├── shinydex/     # Living Dex & hitlist
│   │   └── showcase/    # Member showcase & stats
│   │
│   ├── ui/               # Shared UI components
│   │   └── unifiedcard.js
│   │
│   └── utils/            # Helpers & normalization
│       └── utils.js
│
├── style/                # All CSS (static)
│
├── img/                  # Static assets
│   ├── membersprites/
│   └── symbols/
│
└── README.md
