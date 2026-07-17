import type { Request, Response } from 'express';
import mongoose from 'mongoose';

export function getHealth(_request: Request, response: Response): void {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  response.status(200).json({ success: true, data: { service: 'ContactSync API', status: 'ok', database, timestamp: new Date().toISOString() } });
}
