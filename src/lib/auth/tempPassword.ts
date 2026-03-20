import { randomBytes } from 'crypto';

const CHARSET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';

/** Cryptographically strong temp password for email + first login. */
export function generateTempPassword(length = 14): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += CHARSET[bytes[i]! % CHARSET.length]!;
  }
  return out;
}
