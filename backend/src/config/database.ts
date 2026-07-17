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
  let lastError: unknown;
  for (let attempt = 1; attempt <= env.mongoConnectRetries; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, {
        dbName: env.mongoDbName,
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 20,
        minPoolSize: env.nodeEnv === 'production' ? 2 : 0,
        maxIdleTimeMS: 60_000,
      });
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt}/${env.mongoConnectRetries} failed`);
      if (attempt < env.mongoConnectRetries) {
        await new Promise((resolve) => setTimeout(resolve, env.mongoConnectRetryDelayMs));
      }
    }
  }
  if (lastError) throw lastError;
  await Promise.all([Batch.createCollection(), Contact.createCollection(), User.createCollection(), Session.createCollection()]);
  await Promise.all([Batch.createIndexes(), Contact.createIndexes(), User.createIndexes(), Session.createIndexes()]);
  console.info(`MongoDB connected to ${env.mongoDbName}`);
}

export async function disconnectDatabase(): Promise<void> { await mongoose.disconnect(); }
