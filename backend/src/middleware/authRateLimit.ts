import type { RequestHandler } from 'express';

const attempts = new Map<string, { count: number; resetAt: number }>();

export const authRateLimit: RequestHandler = (request, response, next) => {
  const key = request.ip || 'unknown';
  const now = Date.now();
  const current = attempts.get(key);
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + 15 * 60_000 } : { ...current, count: current.count + 1 };
  attempts.set(key, entry);
  response.setHeader('RateLimit-Limit', '30');
  response.setHeader('RateLimit-Remaining', String(Math.max(0, 30 - entry.count)));
  if (entry.count > 30) {
    response.status(429).json({ success: false, error: { message: 'Too many login attempts. Try again later.' } });
    return;
  }
  next();
};
