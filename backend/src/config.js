import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  return {
    rootDir,
    nodeEnv,
    port: toInt(env.PORT, 8787),
    dbPath: env.DB_PATH || path.join(rootDir, 'data', 'jomworklah.db'),
    frontendOrigin: env.FRONTEND_ORIGIN || 'http://localhost:8080',
    staticDir: env.STATIC_DIR ? path.resolve(rootDir, env.STATIC_DIR) : null,
    ai: {
      provider: (env.AI_PROVIDER || 'rule').toLowerCase(),
      apiKey: env.AI_API_KEY || '',
      baseUrl: env.AI_BASE_URL || 'https://api.openai.com/v1',
      model: env.AI_MODEL || '',
      timeoutMs: toInt(env.AI_TIMEOUT_MS, 8000)
    },
    allowDevReset: toBool(env.ALLOW_DEV_RESET, false),
    rateLimit: {
      enabled: toBool(env.RATE_LIMIT, false),
      perMinute: toInt(env.RATE_LIMIT_PER_MINUTE, 120)
    },
    payloadLimit: env.PAYLOAD_LIMIT || '128kb'
  };
}
