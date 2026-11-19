import { Router } from 'express';
import { getTraining, listTraining } from '../services/training-service.js';
import { loadProviders } from '../services/catalogue.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { paramsIdSchema, trainingQuerySchema } from '../validation/schemas.js';

export function trainingRouter() {
  const router = Router();

  router.get('/training', validateQuery(trainingQuerySchema), (req, res) => {
    const { job, courses } = listTraining(req.app.locals.db, req.user.id, req.validatedQuery);
    res.json({
      data: courses,
      meta: {
        count: courses.length,
        role: job,
        providers: loadProviders(req.app.locals.db)
      }
    });
  });

  router.get('/training/:id', validateParams(paramsIdSchema), (req, res) => {
    res.json({ data: getTraining(req.app.locals.db, req.params.id) });
  });

  return router;
}
