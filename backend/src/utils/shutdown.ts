import type { Server } from 'node:http';
import { disconnectDatabase } from '../config/database.js';

export function registerShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    console.info(`${signal} received; shutting down`);
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
