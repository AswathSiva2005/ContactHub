import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { healthRouter } from './routes/healthRoutes.js';
import { batchRouter } from './routes/batchRoutes.js';
import { contactRouter } from './routes/contactRoutes.js';
import { requestContext } from './middleware/requestContext.js';
import { authRouter } from './routes/authRoutes.js';
import { requireAuth } from './middleware/requireAuth.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(requestContext);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origin is not allowed by CORS'));
  },
  maxAge: 86400,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/batches', requireAuth, batchRouter);
app.use('/api/v1/contacts', requireAuth, contactRouter);
app.use(notFound);
app.use(errorHandler);
