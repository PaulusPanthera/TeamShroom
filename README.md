Team Shroom — Shiny Dex & Weekly Tracker

A static website tracking Team Shroom’s PokeMMO shiny progress.

The project is built for:

non-technical contributors

long-term maintainability

zero paid infrastructure

deterministic data flow

The site is hosted on GitHub Pages and uses Google Sheets as the collaborative source of truth, with all runtime data served as pre-generated JSON.

Live Site

GitHub Pages
https://<username>.github.io/<repo>/

Core Features

Shiny Showcase

Member overview

Individual member pages

Points & shiny counts

Living Shiny Dex

Claimed / unclaimed tracking

Region grouping

Shiny Weekly

Historical weekly events

Hunter participation

Per-week shiny listings

Donators

Aggregated totals

Tier system

Recent donations

Search & Filtering

Across showcase and dex views

Data Philosophy (Non-Negotiable)

Google Sheets is the source of truth

Contributors never touch JSON or code

No runtime CSV parsing

No manual data conversion

No fragile “remember to update this file” steps

Data flow:

Google Sheets
    ↓
Published CSV
    ↓
GitHub Actions (CI)
    ↓
Normalized JSON committed to repo
    ↓
Website loads local JSON only


This guarantees:

fast page loads

predictable behavior

versioned data

zero dependency on Google availability at runtime

How Data Is Updated (No Code Required)

Edit the appropriate Google Sheet

Save changes

GitHub Actions runs automatically:

fetches CSV

validates rows

normalizes fields

generates JSON

commits the result

The site updates automatically after the commit.

There are no manual steps.

Architecture Overview

Vanilla JavaScript only

ES Modules only

No frameworks

No globals

No inline JavaScript

Clear separation of concerns

Layering is enforced:

Data Loaders → Models → UI


Each feature is isolated and composable.

Runtime Data Model (Key Idea)

At runtime, the app works with one canonical structure:

teamMembers = [
  {
    name,
    active,
    sprite,
    role,
    shinies: [ ... ]
  }
]


All UI features (showcase, member pages, points, weekly views) consume this structure.

Raw CSV rows and intermediate formats never reach the UI layer.

Project Structure
/
├── index.html              # Static HTML entry
├── main.js                 # App bootstrap, routing, orchestration
│
├── data/                   # Generated JSON (CI output only)
│   ├── shinyweekly.json
│   ├── shinyshowcase.json
│   ├── members.json
│   ├── donators.json
│   └── pokemon.json
│
├── scripts/                # CI-only CSV → JSON converters
│   ├── shinyweekly.mjs
│   ├── shinyshowcase.mjs
│   ├── members.mjs
│   ├── donators.mjs
│   └── pokemon.mjs
│
├── src/
│   ├── data/               # JSON loaders & models
│   │   ├── *.loader.js
│   │   ├── *.model.js
│   │   └── pokemondatabuilder.js
│   │
│   ├── features/           # Feature modules
│   │   ├── showcase/
│   │   ├── shinyweekly/
│   │   ├── shinydex/
│   │   └── donators/
│   │
│   ├── ui/                 # Shared UI components
│   │   └── unifiedcard.js
│   │
│   └── utils/              # Normalization helpers
│       ├── utils.js
│       └── membersprite.js
│
├── style/                  # CSS (design system + feature styles)
├── img/                    # Static assets & sprites
├── .github/workflows/      # GitHub Actions (CSV → JSON)
├── README.md
└── CNAME

Design Rules (Hard Contracts)

JSON is read-only at runtime

Loaders do not mutate data

Models do not touch the DOM

UI does not normalize data

Special cases live at the rendering boundary only

Symbols must be explicitly declared in unifiedcard.js

Deployment

Push to main

GitHub Actions regenerates JSON (if sheets changed)

GitHub Pages serves the site

No build step

No server

No environment-specific config

Roadmap
In Progress

Final hitlist wiring to dex data

Data validation hardening

Method analytics groundwork

Planned

Weekly and lifetime leaderboards

Member timelines

Achievements and badge cases

Advanced stats views

Clip embeds and highlights

Public read-only data endpoints

Optional React + Vite migration (only if UI complexity requires it)

Legal

Inspired by Pokémon.
Not affiliated with Nintendo, Game Freak, or PokeMMO.
