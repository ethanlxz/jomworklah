import { Router } from 'express';
import { createGuestSession } from '../services/session-service.js';
import { createDemoSession, listPersonas } from '../services/demo-service.js';
import { getMe } from '../services/profile-service.js';
import { validateBody } from '../middleware/validate.js';
import { personaSchema } from '../validation/schemas.js';

export function sessionsRouter() {
  const router = Router();

  router.post('/session', (req, res) => {
    const db = req.app.locals.db;
    const { token, user } = createGuestSession(db);
    res.status(201).json({ data: { token, ...getMe(db, user.id, user) } });
  });

  router.get('/demo/personas', (req, res) => {
    const personas = listPersonas(req.app.locals.db);
    res.json({ data: personas, meta: { count: personas.length } });
  });

  router.post('/demo/session', validateBody(personaSchema), (req, res) => {
    const db = req.app.locals.db;
    const { token, userId, personaKey } = createDemoSession(db, req.body.personaKey);
    const user = { id: userId, kind: 'demo_clone', personaKey };
    res.status(201).json({ data: { token, ...getMe(db, userId, user) } });
  });

  return router;
}
