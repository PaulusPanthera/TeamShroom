export const membersSchema = [
  { key: 'name', required: true },
  { key: 'active', type: 'boolean', required: true },
  { key: 'sprite', enum: ['png','gif','jpg','none',''] },
  { key: 'role' }
];
