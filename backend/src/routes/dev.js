import { Router } from 'express';
import { AppError } from '../middleware/errors.js';
import { seed, wipeAll } from '../db/seed.js';

export function devRouter() {
  const router = Router();

  router.post('/dev/reset', (req, res) => {
    const { allowDevReset, nodeEnv } = req.app.locals.config;
    if (!allowDevReset || nodeEnv === 'production') {
      throw new AppError(403, 'DEV_RESET_DISABLED', 'Dev reset is disabled.');
    }
    const db = req.app.locals.db;
    wipeAll(db);
    const counts = seed(db);
    res.json({ data: { reset: true, counts } });
  });

  return router;
}
