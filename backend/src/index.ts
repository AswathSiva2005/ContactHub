import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { registerShutdown } from './utils/shutdown.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const server = app.listen(env.port, () => console.info(`ContactSync API listening on port ${env.port}`));
  registerShutdown(server);
}

bootstrap().catch((error: unknown) => { console.error('Failed to start server', error); process.exit(1); });
