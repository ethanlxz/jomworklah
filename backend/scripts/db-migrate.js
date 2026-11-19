import { loadConfig } from '../src/config.js';
import { closeDatabase, openDatabase } from '../src/db/connection.js';
import { migrate } from '../src/db/migrate.js';

const config = loadConfig();
const db = openDatabase(config.dbPath);
try {
  migrate(db);
  console.log(`Migrations applied to ${config.dbPath}`);
} finally {
  closeDatabase(db);
}
