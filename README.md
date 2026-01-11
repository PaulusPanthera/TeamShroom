Team Shroom Shiny Dex & Weekly Tracker 🍄✨

This website tracks Team Shroom’s PokeMMO shiny progress, including:

🧬 Living Shiny Dex & Hitlist

📅 Weekly Shiny Events (“Shiny Weekly”)

🧍 Member Shiny Collections & Showcase

💖 Donators & Community Support

The site is fully static, hosted on GitHub Pages, and powered by Google Sheets as the primary data source — allowing the entire team to contribute without touching code.

🌍 Live Site

Hosted on GitHub Pages:
https://<username>.github.io/<repo>/

✏️ How to Update Data (No Code Required)

All core data is managed via Google Sheets.

Google Sheets = Source of Truth

Data is edited collaboratively in Google Sheets

Sheets are published as CSV

A GitHub Action converts CSV → JSON automatically

The website consumes only generated JSON at runtime

➡ This allows any team member to contribute safely without editing code or JSON files.

🧠 Data Philosophy

Google Sheets = Source of Truth

No manual JSON editing

CI-generated data only

Runtime is read-only & deterministic

All data is:

validated

normalized

sanitized

grouped

rendered dynamically

This makes the site:

✅ safer

✅ scalable

✅ contributor-friendly

✅ future-proof

🧩 Architecture Principles

ES Modules only (import / export)

No global variables

No inline JavaScript in HTML

Strict Data → Model → UI layering

Each feature is isolated and composable

UI never fetches or mutates raw data

Business rules live in models, not UI

Layering is enforced:

Data Loaders → Models → UI

🧱 What We’ve Achieved So Far
✅ Major Milestones

Migrated all core data to Google Sheets

Implemented CSV → JSON CI pipeline

Removed runtime CSV parsing

Introduced strict loaders & models

Unified card rendering across the entire app

Deterministic Pokémon normalization & scoring

Robust handling of:

lost shinies

sold shinies

secret shinies

alpha shinies

hunt methods

clips & highlights

🔒 Stability Guarantees

No runtime schema guessing

No fragile CSV parsing in the browser

No accidental sheet formatting crashes

Empty rows are safely ignored

Explicit, boring, predictable data contracts

🚀 How Deployment Works

Edit Google Sheets

Push (or wait for scheduled CI)

GitHub Actions:

fetch CSV

validate rows

generate JSON

commit results

GitHub Pages updates automatically

➡ No build step required
➡ No server required

🛣️ Roadmap
In Progress

Polish hunt method symbols

Extend Shiny Weekly stats

Improve hitlist ↔ weekly integration

Minor UI refinements & performance cleanup

Planned

📊 Weekly trends & graphs

🏆 Long-term hunter leaderboards

🎣 Method analytics (Safari, Egg, Alpha, MPB, etc.)

🧪 Sheet validation warnings & hints

🏅 Badges & achievements

🎥 Clip embedding & highlight reels

🌍 Public read-only data endpoints

📱 Improved mobile UX

Optional / Long-Term

🧱 React migration (only if needed)

🤖 Discord bot integration

📤 Exportable stats (CSV / JSON)

💡 Design Goals (Non-Negotiable)

Data should be boring

Rules should be explicit

UI should never guess

Contributors should never break the site

Sheets stay friendly, code stays strict

Inspired by Pokémon.
Not affiliated with Nintendo, Game Freak, or PokeMMO.

PART 2 — 📁 PROJECT STRUCTURE (SEPARATE, SAFE TO PASTE)

Paste this section separately at the end of your README.

📁 Project Structure
Root

index.html
Static HTML entry point

main.js
App bootstrap, routing, orchestration

README.md
Project documentation

CNAME
Custom domain (GitHub Pages)

Generated Data (CI Output — DO NOT EDIT)

data/

shinyweekly.json

shinyshowcase.json

members.json

donators.json

pokemon.json

These files are auto-generated from Google Sheets via GitHub Actions.

CI Scripts (CSV → JSON)

scripts/

shinyweekly.mjs

shinyshowcase.mjs

members.mjs

donators.mjs

pokemon.mjs

Used only in CI, never in the browser.

Application Source

src/

Data Layer

src/data/

*.loader.js — load generated JSON

*.model.js — normalize & group data

pokemondatabuilder.js — tiers, points, families

Feature Modules

src/features/

showcase/ — member gallery & detail views

shinyweekly/ — weekly history & stats

shinydex/ — living dex & hitlist

donators/ — donations & tiers

UI Components

src/ui/

unifiedcard.js — reusable card renderer

Utilities

src/utils/

utils.js — normalization & display helpers

membersprite.js — sprite resolution

Styling

style/
Locked Design System v1

Assets

img/
Member sprites, symbols, UI assets
