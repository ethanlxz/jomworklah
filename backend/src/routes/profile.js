import { Router } from 'express';
import {
  getMe,
  setInterests,
  setSkill,
  setSkills,
  updateProfile
} from '../services/profile-service.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  interestsSchema,
  paramsSkillSchema,
  profilePatchSchema,
  skillPatchSchema,
  skillsBulkSchema
} from '../validation/schemas.js';

export function profileRouter() {
  const router = Router();

  router.get('/me', (req, res) => {
    res.json({ data: getMe(req.app.locals.db, req.user.id, req.user) });
  });

  router.patch('/me/profile', validateBody(profilePatchSchema), (req, res) => {
    res.json({ data: updateProfile(req.app.locals.db, req.user.id, req.body) });
  });

  router.put('/me/skills', validateBody(skillsBulkSchema), (req, res) => {
    res.json({ data: setSkills(req.app.locals.db, req.user.id, req.body.scores) });
  });

  router.patch('/me/skills/:skillId', validateParams(paramsSkillSchema), validateBody(skillPatchSchema), (req, res) => {
    res.json({ data: setSkill(req.app.locals.db, req.user.id, req.params.skillId, req.body.evidenceLevel) });
  });

  router.put('/me/interests', validateBody(interestsSchema), (req, res) => {
    res.json({ data: setInterests(req.app.locals.db, req.user.id, req.body.interests) });
  });

  return router;
}
