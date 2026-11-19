import { Router } from 'express';
import { evidenceLegend } from '../db/seed-data.js';
import { loadInterestList, loadSkillList } from '../services/catalogue.js';

export function catalogueRouter() {
  const router = Router();

  router.get('/skills', (req, res) => {
    const skills = loadSkillList(req.app.locals.db);
    res.json({ data: { legend: evidenceLegend, skills }, meta: { count: skills.length } });
  });

  router.get('/interests', (req, res) => {
    const interests = loadInterestList(req.app.locals.db);
    res.json({ data: interests, meta: { count: interests.length } });
  });

  return router;
}
