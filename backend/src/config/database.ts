import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { Batch } from '../models/Batch.js';
import { Contact } from '../models/Contact.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';

export async function connectDatabase(): Promise<void> {
  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDbName,
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: env.nodeEnv === 'production' ? 2 : 0,
    maxIdleTimeMS: 60_000,
  });
  if (env.nodeEnv !== 'production') {
    await Promise.all([Batch.createCollection(), Contact.createCollection(), User.createCollection(), Session.createCollection()]);
    await Promise.all([Batch.syncIndexes(), Contact.syncIndexes(), User.syncIndexes(), Session.syncIndexes()]);
  }
  console.info(`MongoDB connected to ${env.mongoDbName}`);
}

export async function disconnectDatabase(): Promise<void> { await mongoose.disconnect(); }
