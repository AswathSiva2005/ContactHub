import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authRateLimit } from '../middleware/rateLimits.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const authRouter = Router();
authRouter.post('/register', authRateLimit, register);
authRouter.post('/login', authRateLimit, login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/logout', requireAuth, logout);
