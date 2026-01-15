// scripts/contracts/shinyweekly.contract.mjs
// Shiny Weekly dataset contract

export const shinyWeeklyContract = {
  required: [
    'week',
    'week_label',
    'date_start',
    'date_end',
    'ot',
    'pokemon',
  ],

  fields: {
    week: {
      type: 'string',
    },

    week_label: {
      type: 'string',
    },

    date_start: {
      type: 'string',
    },

    date_end: {
      type: 'string',
    },

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
