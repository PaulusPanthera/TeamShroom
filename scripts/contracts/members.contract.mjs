// scripts/contracts/members.contract.mjs
// Members dataset contract (source of truth)

export const membersContract = {
  required: ['name', 'role'],

  fields: {
    name: {
      type: 'string',
    },

    active: {
      type: 'boolean',
      optional: true,
    },

    role: {
      type: 'enum',
      values: [
        'spore',
        'shroom',
        'shinyshroom',
        'mushcap',
      ],
    },

    sprite: {
      type: 'enum',
      values: ['png', 'gif', 'jpg', 'none', ''],
      optional: true,
    },
  },
};
