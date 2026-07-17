import 'dotenv/config';

const required = ['MONGODB_URI'] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI as string,
  mongoDbName: process.env.MONGODB_DB_NAME ?? 'contactsync',
  corsOrigins: (process.env.CORS_ORIGIN ?? '*').split(',').map((origin) => origin.trim()).filter(Boolean),
  dnsServers: (process.env.DNS_SERVERS ?? '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
} as const;

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
if (env.nodeEnv === 'production' && env.corsOrigins.includes('*')) throw new Error('CORS_ORIGIN must be explicit in production');
