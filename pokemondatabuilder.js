// pokemondatabuilder.js

if (!window.pokemonFamiliesData) {
  throw new Error("window.pokemonFamiliesData is not loaded! Please load your JSON first.");
}

// Assign point values for each tier, including Legendary as 100
window.TIER_POINTS = {
  "Tier 6": 2,
  "Tier 5": 3,
  "Tier 4": 6,
  "Tier 3": 10,
  "Tier 2": 15,
  "Tier 1": 25,
  "Tier 0": 30,
  "Tier LM": 100
};

// Build all data structures from the JSON
window.TIER_FAMILIES = {};
window.POKEMON_POINTS = {};
window.POKEMON_TIER = {};
window.POKEMON_REGION = {};
window.POKEMON_RARITY = {};
window.pokemonFamilies = {};

window.pokemonFamiliesData.forEach(entry => {
  const tier = entry.tier;
  const fam = entry.family_members.split(",");
  const region = entry.region || "";
  const rarity = entry.rarity || "";

  // Assign family base
  const base = fam[0].trim().toLowerCase();
  if (!window.TIER_FAMILIES[tier]) window.TIER_FAMILIES[tier] = [];
  if (!window.TIER_FAMILIES[tier].includes(base)) {
    window.TIER_FAMILIES[tier].push(base);
  }

  // Map every family member to the family
  fam.forEach(name => {
    const norm = name
      .toLowerCase()
      .replace(/♀/g,"-f")
      .replace(/♂/g,"-m")
      .replace(/[- '\.’;]/g,"")
      .trim();

    window.pokemonFamilies[norm] = fam.map(item =>
      item
        .toLowerCase()
        .replace(/♀/g,"-f")
        .replace(/♂/g,"-m")
        .replace(/[- '\.’;]/g,"")
        .trim()
    );

    window.POKEMON_POINTS[norm] = window.TIER_POINTS[tier] || 0;
    window.POKEMON_TIER[norm] = tier;
    window.POKEMON_REGION[norm] = region;
    window.POKEMON_RARITY[norm] = rarity;
  });
});

// Support for legacy code
window.buildPokemonPoints = function() {}; // No longer needed; everything is built above.
