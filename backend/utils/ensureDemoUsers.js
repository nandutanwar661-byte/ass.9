const User = require('../models/User');

const demoUsers = [
  {
    name: 'Alex Davis',
    email: 'admin@visipass.com',
    password: 'password123',
    role: 'admin',
    department: 'Administration',
    phone: '+1-555-0001',
  },
  {
    name: 'Sam Porter',
    email: 'security@visipass.com',
    password: 'password123',
    role: 'security',
    department: 'Security',
    phone: '+1-555-0002',
  },
  {
    name: 'Emma Walsh',
    email: 'emma@visipass.com',
    password: 'password123',
    role: 'host',
    department: 'Engineering',
    phone: '+1-555-0003',
  },
];

async function ensureDemoUsers() {
  if (process.env.NODE_ENV === 'production' || process.env.SEED_DEMO_USERS_ON_START === 'false') {
    return;
  }

  const emails = demoUsers.map((user) => user.email);
  const existingUsers = await User.find({ email: { $in: emails } }).select('email');
  const existingEmails = new Set(existingUsers.map((user) => user.email));
  const missingUsers = demoUsers.filter((user) => !existingEmails.has(user.email));

  if (missingUsers.length === 0) return;

  await User.create(missingUsers);
  console.log(`Created ${missingUsers.length} missing demo login user(s).`);
}

module.exports = ensureDemoUsers;
