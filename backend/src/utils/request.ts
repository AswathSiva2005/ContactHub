import type { Request } from 'express';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function getPagination(request: Request): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number.parseInt(String(request.query.page ?? '1'), 10) || 1);
  const requestedLimit = Number.parseInt(String(request.query.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requestedLimit));
  return { page, limit, skip: (page - 1) * limit };
}
