export const pokemonSchema = [
  { key: 'dex', required: true },
  { key: 'pokemon', required: true },
  { key: 'family', required: true },
  { key: 'tier', enum: ['Tier 0','Tier 1','Tier 2','Tier 3','Tier 4','Tier 5','Tier 6','Tier LM'] },
  { key: 'region', enum: ['kanto','johto','hoenn','sinnoh','unova'] },
  { key: 'rarity' },
  { key: 'show', type: 'boolean' }
];
