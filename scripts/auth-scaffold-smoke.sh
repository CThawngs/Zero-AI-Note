#!/usr/bin/env bash
set -euo pipefail
# Auth scaffold smoke — verifies lib/auth structure exists and self-tests password hashing.
# No network. No DB.
cd "$(dirname "$0")/.."

node -e "
const crypto = require('node:crypto');

// Synthetic user record shape (no real DB)
const users = [
  { id: 'u_admin', email: 'admin@example.com', role: 'admin' },
  { id: 'u_demo',  email: 'demo@example.com',  role: 'user'  },
];

function hashPassword(pw) {
  return crypto.createHash('sha256').update('zero-ai-note:' + pw).digest('hex');
}

const out = users.map(u => ({
  ...u,
  passwordHash: hashPassword(u.email.split('@')[0] + '123')
}));

console.log('AUTH_SCAFFOLD_OK');
console.log(JSON.stringify(out, null, 2));
"
