// scripts/contracts/donators.contract.mjs
// Donators dataset contract

export const donatorsContract = {
  required: ['date', 'name', 'value'],

  fields: {
    date: {
      type: 'string',
    },

    name: {
      type: 'string',
    },

    donation: {
      type: 'string',
      optional: true,
    },

    value: {
      type: 'string',
    },
  },
};
