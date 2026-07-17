import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { hashToken, nameKey, newSessionToken, normalizeName, normalizePhone } from '../utils/auth.js';

const SESSION_DAYS = 30;

async function issueSession(userId: Types.ObjectId): Promise<{ token: string; expiresAt: string }> {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await Session.create({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt: expiresAt.toISOString() };
}

function publicUser(user: { _id: Types.ObjectId; name: string; phoneNumber: string; createdAt?: Date }) {
  return { id: String(user._id), name: user.name, phoneNumber: user.phoneNumber, createdAt: user.createdAt };
}

export async function register(request: Request, response: Response): Promise<void> {
  const name = normalizeName(request.body.name);
  const phoneNumber = normalizePhone(request.body.phoneNumber);
  if (name.length < 2 || !phoneNumber) {
    response.status(400).json({ success: false, error: { message: 'Enter a valid name and phone number' } });
    return;
  }
  const user = await User.create({ name, nameKey: nameKey(name), phoneNumber });
  const session = await issueSession(user._id);
  response.status(201).json({ success: true, data: { user: publicUser(user), ...session } });
}

export async function login(request: Request, response: Response): Promise<void> {
  const name = normalizeName(request.body.name);
  const phoneNumber = normalizePhone(request.body.phoneNumber);
  const user = await User.findOne({ phoneNumber, nameKey: nameKey(name) });
  if (!user) {
    response.status(401).json({ success: false, error: { message: 'Name or phone number is incorrect' } });
    return;
  }
  const session = await issueSession(user._id);
  response.json({ success: true, data: { user: publicUser(user), ...session } });
}

export async function me(_request: Request, response: Response): Promise<void> {
  const user = await User.findById(response.locals.userId);
  if (!user) {
    response.status(401).json({ success: false, error: { message: 'Account no longer exists' } });
    return;
  }
  response.json({ success: true, data: publicUser(user) });
}

export async function logout(_request: Request, response: Response): Promise<void> {
  await Session.deleteOne({ _id: response.locals.sessionId, userId: response.locals.userId });
  response.json({ success: true, data: { loggedOut: true } });
}
