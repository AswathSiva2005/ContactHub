import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = typeof request.headers['x-request-id'] === 'string' ? request.headers['x-request-id'].slice(0, 100) : randomUUID();
  response.setHeader('x-request-id', requestId);
  response.locals.requestId = requestId;
  next();
};
