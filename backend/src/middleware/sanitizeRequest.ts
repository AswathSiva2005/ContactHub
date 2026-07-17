import type { RequestHandler } from 'express';

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (!value || typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    result[key] = clean(child);
  }
  return result;
}

export const sanitizeRequest: RequestHandler = (request, _response, next) => {
  if (request.body) request.body = clean(request.body);
  if (request.params) request.params = clean(request.params) as Record<string, string>;
  next();
};
