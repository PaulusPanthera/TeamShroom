// scripts/contracts/pokemon.contract.mjs
// Pokémon dataset contract

export const pokemonContract = {
  required: ['dex', 'pokemon', 'tier'],

  fields: {
    dex: {
      type: 'string',
    },

    pokemon: {
      type: 'string',
    },

    family: {
      type: 'string',
      optional: true,
    },

    tier: {
      type: 'enum',
      values: [
        'tier 0',
        'tier 1',
        'tier 2',
        'tier 3',
        'tier 4',
        'tier 5',
        'tier 6',
        'tier lm',
      ],
    },

    region: {
      type: 'enum',
      values: ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova'],
      optional: true,
    },

    rarity: {
      type: 'string',
      optional: true,
    },

    show: {
      type: 'boolean',
      optional: true,
    },
  },
};
