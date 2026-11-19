import { Router } from 'express';
import {
  addCourse,
  clearJourney,
  deleteUser,
  generateRoadmap,
  getRoadmap,
  listSavedCourses,
  removeCourse,
  resetProgress,
  setTarget,
  setTaskCompletion
} from '../services/journey-service.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  courseSaveSchema,
  paramsCourseSchema,
  paramsTaskSchema,
  roadmapGenerateSchema,
  targetSchema,
  taskPatchSchema
} from '../validation/schemas.js';

export function roadmapRouter() {
  const router = Router();

  router.put('/me/target', validateBody(targetSchema), (req, res) => {
    res.json({ data: setTarget(req.app.locals.db, req.user.id, req.body.jobId) });
  });

  router.get('/me/courses', (req, res) => {
    const courses = listSavedCourses(req.app.locals.db, req.user.id);
    res.json({ data: courses, meta: { count: courses.length } });
  });

  router.post('/me/courses', validateBody(courseSaveSchema), (req, res) => {
    res.status(201).json({ data: addCourse(req.app.locals.db, req.user.id, req.body.courseId) });
  });

  router.delete('/me/courses/:courseId', validateParams(paramsCourseSchema), (req, res) => {
    removeCourse(req.app.locals.db, req.user.id, req.params.courseId);
    res.status(204).end();
  });

  router.get('/me/roadmap', (req, res) => {
    res.json({ data: getRoadmap(req.app.locals.db, req.user.id) });
  });

  router.post('/me/roadmap', validateBody(roadmapGenerateSchema), (req, res) => {
    const state = generateRoadmap(req.app.locals.db, req.user.id, req.body);
    res.status(201).json({ data: state });
  });

  router.patch('/me/roadmap/tasks/:taskId', validateParams(paramsTaskSchema), validateBody(taskPatchSchema), (req, res) => {
    res.json({ data: setTaskCompletion(req.app.locals.db, req.user.id, req.params.taskId, req.body.completed) });
  });

  router.post('/me/roadmap/reset-progress', (req, res) => {
    res.json({ data: resetProgress(req.app.locals.db, req.user.id) });
  });

  router.delete('/me/journey', (req, res) => {
    clearJourney(req.app.locals.db, req.user.id);
    res.status(204).end();
  });

  router.delete('/me', (req, res) => {
    deleteUser(req.app.locals.db, req.user.id);
    res.status(204).end();
  });

  return router;
}
