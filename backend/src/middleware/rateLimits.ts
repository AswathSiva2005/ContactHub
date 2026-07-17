import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const response = {
  success: false,
  error: { message: 'Too many requests. Please try again later.' },
};

export const apiRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
});

export const authRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: { message: 'Too many authentication attempts. Please try again later.' },
  },
});
