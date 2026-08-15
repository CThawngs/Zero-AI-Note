import bcrypt from 'bcryptjs';

const BCRYPT_SALT = 10;

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_SALT);
}

export async function verifyPassword(plain: string, expected: string) {
  return bcrypt.compare(plain, expected);
}

export function isPasswordHash(value: string) {
  return value.startsWith('$2a$') || value.startsWith('$2b$');
}

export function randomToken(bytes = 32) {
  // Node 19+ has secure crypto.getRandomValues via Buffer
  return Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString('hex');
}

declare const crypto: {
  getRandomValues(arr: Uint8Array): Uint8Array;
};