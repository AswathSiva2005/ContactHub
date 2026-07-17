import type { Server } from 'node:http';
import { disconnectDatabase } from '../config/database.js';

export function registerShutdown(server: Server): void {
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`${signal} received; shutting down`);
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();
    server.close(async () => {
      try {
        await disconnectDatabase();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
