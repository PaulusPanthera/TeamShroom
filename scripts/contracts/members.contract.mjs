// scripts/contracts/members.contract.mjs
// v2.0.0-beta
// Members dataset contract. Source-of-truth sheet fields for roster status, rank, join date, nationality, and sprite extension.

export const membersContract = {
  required: ['name', 'active', 'role'],

  fields: {
    name: {
      type: 'string',
    },

    active: {
      type: 'boolean',
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

    member_since: {
      type: 'string',
      optional: true,
    },

    nationality: {
      type: 'string',
      optional: true,
    },
  },
};
