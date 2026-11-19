import { Router } from 'express';
import { evidenceLegend } from '../db/seed-data.js';
import { loadInterestList, loadProviders, loadSkillList } from '../services/catalogue.js';
import { interestsMapView, providersMapView } from '../api/serializers.js';

export function catalogueRouter() {
  const router = Router();

  router.get('/skills', (req, res) => {
    const skills = loadSkillList(req.app.locals.db);
    res.json({ data: { legend: evidenceLegend, skills }, meta: { count: skills.length } });
  });

  router.get('/interests', (req, res) => {
    const interests = loadInterestList(req.app.locals.db);
    res.json({ data: interestsMapView(interests), meta: { count: interests.length } });
  });

  router.get('/providers', (req, res) => {
    const providers = loadProviders(req.app.locals.db);
    res.json({ data: providersMapView(providers), meta: { count: providers.length } });
  });

  return router;
}
