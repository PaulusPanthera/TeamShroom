# Team Shroom Shiny Dex & Weekly Tracker 🍄✨

This website tracks **Team Shroom’s PokeMMO shiny progress**, including:

- 🧬 Living Shiny Dex & Hitlist  
- 📅 Weekly Shiny Events (“Shiny Weekly”)  
- 🧍 Member Shiny Collections & Showcase  
- 💖 Donators & Community Support  

The site is **fully static**, hosted on **GitHub Pages**, and powered by **Google Sheets** as the primary data source — allowing the entire team to contribute **without touching code**.

---

## 🌍 Live Site

Hosted on GitHub Pages:  
https://<username>.github.io/<repo>/

---

## ✏️ How to Update Data (No Code Required)

All main data is managed via **Google Sheets**.

### Google Sheets = Source of Truth

- Data is edited collaboratively in Google Sheets  
- Sheets are published as CSV  
- GitHub Actions automatically converts CSV → JSON  
- The website consumes **only generated JSON at runtime**

➡ This allows **any team member** to add or update data safely without editing code or JSON files.

---

## 🧠 Data Philosophy

- **Google Sheets = Source of Truth**  
- **No manual JSON editing**  
- **CI-generated data only**  

All data is:

- validated  
- normalized  
- sanitized  
- grouped  
- rendered dynamically  

This makes the site:

- safer  
- scalable  
- contributor-friendly  
- future-proof  

---

## 🧩 Architecture Principles

- ES Modules only (`import / export`)  
- No global variables  
- No inline JavaScript in HTML  
- Clear **Data → Model → UI** separation  
- Each feature is isolated and composable  
- UI never guesses or mutates data  

---

## 🧱 What We’ve Achieved

### ✅ Major Milestones

- Migrated all core data to **Google Sheets**  
- Implemented a **CSV → JSON GitHub Actions pipeline**  
- Removed runtime CSV parsing  
- Introduced strict loaders and models  
- Unified card rendering across the entire site  
- Deterministic Pokémon normalization and scoring  
- Robust handling of:
  - lost shinies  
  - sold shinies  
  - secret shinies  
  - alpha shinies  
  - hunt methods  
  - clips & highlights  

---

## 🚀 How Deployment Works

1. Edit Google Sheets  
2. GitHub Actions runs automatically (or on schedule)  
3. JSON is regenerated and committed  
4. GitHub Pages updates the site  

No build step required.  
No server required.

---

## 🛣️ Roadmap

### In Progress

- Polish hunt method symbols  
- Extend Shiny Weekly stats  
- Improve Hitlist ↔ Weekly integration  
- UI refinements & performance cleanup  

### Planned

- 📊 Weekly trends & graphs  
- 🏆 Long-term hunter leaderboards  
- 🎣 Method analytics (Safari, Egg, Alpha, MPB, etc.)  
- 🧪 Validation & error highlighting in Sheets  
- 🏅 Badge case & achievements  
- 🎥 Clip embedding & highlights  
- 🌍 Public API-style data endpoints  
- 📱 Improved mobile UX  

### Optional / Future

- 🧱 React migration (only if needed)  
- 🤖 Discord bot integration  
- 📤 Exportable stats (CSV / JSON)  

---

## 💡 Design Goals

- Data should be boring  
- Rules should be explicit  
- UI should never guess  
- Contributors should never break the site  
- Sheets stay friendly, code stays strict  

---

Inspired by Pokémon.  
Not affiliated with Nintendo, Game Freak, or PokeMMO.

---

## 📁 Project Structure

### Root

- `index.html` — Main HTML entry  
- `main.js` — App bootstrap, routing, orchestration  
- `README.md` — Project documentation  
- `CNAME` — Custom domain (GitHub Pages)  

---

### Generated Data (CI Output — Do Not Edit)

- `data/shinyweekly.json`  
- `data/shinyshowcase.json`  
- `data/members.json`  
- `data/donators.json`  
- `data/pokemon.json`  

---

### CI Scripts (CSV → JSON)

- `scripts/shinyweekly.mjs`  
- `scripts/shinyshowcase.mjs`  
- `scripts/members.mjs`  
- `scripts/donators.mjs`  
- `scripts/pokemon.mjs`  

---

### Application Source

#### Data Layer

- `src/data/`
  - `*.loader.js` — JSON loaders  
  - `*.model.js` — Data models  
  - `pokemondatabuilder.js` — tiers, points, families  

#### Feature Modules

- `src/features/showcase/` — Member gallery & profiles  
- `src/features/shinyweekly/` — Weekly history & stats  
- `src/features/shinydex/` — Living Dex & Hitlist  
- `src/features/donators/` — Donations & tiers  

#### UI Components

- `src/ui/unifiedcard.js` — Reusable card renderer  

#### Utilities

- `src/utils/utils.js` — Normalization helpers  
- `src/utils/membersprite.js` — Member sprite resolution  

---

### Styling & Assets

- `style/` — Design System v1 & feature CSS  
- `img/` — Sprites, symbols, UI assets  
