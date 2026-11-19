import { createAiAdapter } from './ai/index.js';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { closeDatabase, openDatabase } from './db/connection.js';
import { migrate } from './db/migrate.js';
import { seed } from './db/seed.js';

const config = loadConfig();

let db;
try {
  db = openDatabase(config.dbPath);
  migrate(db);
  seed(db);
} catch (error) {
  console.error('Failed to prepare the database:', error);
  closeDatabase(db);
  process.exit(1);
}

const app = createApp({ db, config, ai: createAiAdapter(config) });

const server = app.listen(config.port, () => {
  console.log(`Jom Kerja Lah API listening on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  server.close(() => {
    closeDatabase(db);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
