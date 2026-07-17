import type { RequestHandler } from 'express';
import { Session } from '../models/Session.js';
import { hashToken } from '../utils/auth.js';

export const requireAuth: RequestHandler = async (request, response, next) => {
  const authorization = request.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    response.status(401).json({ success: false, error: { message: 'Authentication required' } });
    return;
  }
  const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).select('+tokenHash');
  if (!session) {
    response.status(401).json({ success: false, error: { message: 'Session expired. Please log in again.' } });
    return;
  }
  response.locals.userId = String(session.userId);
  response.locals.sessionId = String(session._id);
  void Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } });
  next();
};
