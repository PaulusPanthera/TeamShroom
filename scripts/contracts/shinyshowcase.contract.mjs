// scripts/contracts/shinyshowcase.contract.mjs
// Shiny Showcase dataset contract

export const shinyShowcaseContract = {
  required: [
    'ot',
    'pokemon',
  ],

  fields: {
    ot: {
      type: 'string',
    },

    pokemon: {
      type: 'string',
    },

    method: {
      type: 'string',
      optional: true,
    },

    encounter: {
      type: 'number',
      optional: true,
    },

    secret: {
      type: 'boolean',
      optional: true,
    },

    alpha: {
      type: 'boolean',
      optional: true,
    },

    run: {
      type: 'boolean',
      optional: true,
    },

    lost: {
      type: 'boolean',
      optional: true,
    },

    sold: {
      type: 'boolean',
      optional: true,
    },

    favorite: {
      type: 'boolean',
      optional: true,
    },

    clip: {
      type: 'string',
      optional: true,
    },

    notes: {
      type: 'string',
      optional: true,
    },
  },
};
