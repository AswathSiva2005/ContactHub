import { createHash, randomBytes } from 'node:crypto';

export function normalizePhone(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return raw.startsWith('+') ? `+${digits}` : digits;
}

export function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function nameKey(value: string): string {
  return value.toLocaleLowerCase('en-US');
}

export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
