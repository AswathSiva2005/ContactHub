import type { Request, Response } from 'express';
export function notFound(request: Request, response: Response): void {
  response.status(404).json({ success: false, error: { message: `Route ${request.method} ${request.originalUrl} not found` } });
}
