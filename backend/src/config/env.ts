import 'dotenv/config';

const required = ['MONGODB_URI'] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

function integer(name: string, fallback: number, minimum: number, maximum: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

function version(name: string, fallback: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error(`${name} must use semantic version format (for example 1.2.3)`);
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const latestVersion = version('APP_LATEST_VERSION', '1.0.0');

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI as string,
  mongoDbName: process.env.MONGODB_DB_NAME ?? 'contactsync',
  corsOrigins: (process.env.CORS_ORIGIN ?? '*').split(',').map((origin) => origin.trim()).filter(Boolean),
  dnsServers: (process.env.DNS_SERVERS ?? '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean),
  rateLimitWindowMs: integer('RATE_LIMIT_WINDOW_MS', 900_000, 1_000, 86_400_000),
  rateLimitMax: integer('RATE_LIMIT_MAX', 300, 1, 100_000),
  authRateLimitMax: integer('AUTH_RATE_LIMIT_MAX', 20, 1, 10_000),
  mongoConnectRetries: integer('MONGODB_CONNECT_RETRIES', 10, 1, 100),
  mongoConnectRetryDelayMs: integer('MONGODB_CONNECT_RETRY_DELAY_MS', 5_000, 100, 60_000),
  appLatestVersion: latestVersion,
  appMinimumVersion: version('APP_MINIMUM_VERSION', latestVersion),
  appApkDownloadUrl: process.env.APP_APK_DOWNLOAD_URL?.trim() ?? '',
  appReleaseNotes: process.env.APP_RELEASE_NOTES?.trim() || 'Performance and reliability improvements.',
} as const;

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
if (env.nodeEnv === 'production') {
  if (env.corsOrigins.includes('*')) throw new Error('CORS_ORIGIN must be explicit in production');
  if (!env.appApkDownloadUrl.startsWith('https://')) throw new Error('APP_APK_DOWNLOAD_URL must be an HTTPS URL in production');
}
