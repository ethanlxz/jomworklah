import { loadConfig } from '../src/config.js';
import { closeDatabase, openDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';

const config = loadConfig();
const db = openDatabase(config.dbPath);
try {
  migrate(db);
  const counts = seed(db);
  console.log('Seed complete:', counts);
} finally {
  closeDatabase(db);
}
