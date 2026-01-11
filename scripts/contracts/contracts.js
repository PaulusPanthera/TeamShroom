// src/data/contracts.js
// Centralized data contracts
// This file defines WHAT is allowed — no logic, no side effects

/* ---------------------------------------------------------
   SHINY METHODS (authoritative list)
   --------------------------------------------------------- */

export const SHINY_METHODS = [
  'mpb',
  'mgb',
  'mub',
  'mcb',
  'mdb',

  'single',
  'swarm',
  'raid',

  'fishing',
  'headbutt',
  'rocksmash',
  'sos',
  'honeytree',

  'egg',
  'safari',
  'event',
  'alpha_spawn'
];

/* ---------------------------------------------------------
   BOOLEAN FIELDS (CSV → boolean coercion)
   --------------------------------------------------------- */

export const SHINY_BOOLEAN_FIELDS = [
  'lost',
  'sold',
  'secret',
  'alpha',
  'run',
  'favorite'
];

/* ---------------------------------------------------------
   MEMBER STATUS
   --------------------------------------------------------- */

export const MEMBER_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

/* ---------------------------------------------------------
   POKÉMON TIERS (semantic, not points)
   --------------------------------------------------------- */

export const POKEMON_TIERS = [
  'Tier 0',
  'Tier 1',
  'Tier 2',
  'Tier 3',
  'Tier 4',
  'Tier 5',
  'Tier 6',
  'Tier LM'
];

/* ---------------------------------------------------------
   REGIONS (canonical spelling)
   --------------------------------------------------------- */

export const POKEMON_REGIONS = [
  'kanto',
  'johto',
  'hoenn',
  'sinnoh',
  'unova'
];
