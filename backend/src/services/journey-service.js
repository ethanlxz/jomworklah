import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import { buildRoadmap, computeProgress, deriveRoadmapInputs, flattenTasks, withCompletion } from '../domain/roadmap.js';
import { courseView, journeyView, phasesView, progressView } from '../api/serializers.js';
import {
  loadCourse,
  loadCourses,
  loadInterestIds,
  loadJob,
  loadProfileRow,
  loadScoreMap,
  loadSkillMap,
  toProfile
} from './catalogue.js';

export function getJourney(db, userId) {
  const row = db.prepare('SELECT * FROM journeys WHERE user_id = ?').get(userId);
  return { started: Boolean(row?.started), targetJobId: row?.target_job_id ?? null };
}

export function setTarget(db, userId, jobId) {
  const job = loadJob(db, jobId);
  if (!job) throw new AppError(404, 'CAREER_NOT_FOUND', `Unknown career '${jobId}'.`);

  const existing = db.prepare('SELECT target_job_id FROM journeys WHERE user_id = ?').get(userId);
  const changed = !existing || existing.target_job_id !== jobId;

  transaction(db, () => {
    db.prepare(`
      INSERT INTO journeys(user_id, started, target_job_id) VALUES(?, 1, ?)
      ON CONFLICT(user_id) DO UPDATE SET started = 1, target_job_id = excluded.target_job_id,
        updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `).run(userId, jobId);

    if (changed) {
      db.prepare('DELETE FROM roadmaps WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_courses WHERE user_id = ?').run(userId);
    }
  });

  return { journey: getJourneyState(db, userId), targetJobId: jobId, invalidated: changed, targetTitle: job.title };
}

export function listSavedCourseIds(db, userId) {
  return db.prepare(`
    SELECT course_id FROM user_courses WHERE user_id = ? ORDER BY added_at
  `).all(userId).map(row => row.course_id);
}

export function listSavedCourses(db, userId) {
  const saved = new Set(listSavedCourseIds(db, userId));
  return loadCourses(db).filter(course => saved.has(course.id)).map(courseView);
}

export function addCourse(db, userId, courseId) {
  const course = loadCourse(db, courseId);
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${courseId}'.`);
  if (!getJourney(db, userId).targetJobId) {
    throw new AppError(409, 'TARGET_REQUIRED', 'Choose a target career before adding training pathways.');
  }
  const roadmapRow = db.prepare('SELECT course_ids_json FROM roadmaps WHERE user_id = ?').get(userId);
  if (parseIds(roadmapRow?.course_ids_json)?.includes(courseId)) {
    throw new AppError(409, 'COURSE_ALREADY_SAVED', `Course '${courseId}' is already in your roadmap.`);
  }

  const result = db.prepare('INSERT OR IGNORE INTO user_courses(user_id, course_id) VALUES(?, ?)').run(userId, courseId);
  if (result.changes === 0) {
    throw new AppError(409, 'COURSE_ALREADY_SAVED', `Course '${courseId}' is already saved.`);
  }
  return courseView(course);
}

export function removeCourse(db, userId, courseId) {
  if (!loadCourse(db, courseId)) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${courseId}'.`);
  db.prepare('DELETE FROM user_courses WHERE user_id = ? AND course_id = ?').run(userId, courseId);
}

function roadmapContext(db, userId, job) {
  const scores = loadScoreMap(db, userId);
  const skillMap = loadSkillMap(db);
  return {
    job,
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillId => skillMap.get(skillId)?.name ?? skillId,
    profile: toProfile(loadProfileRow(db, userId)),
    courses: loadCourses(db),
    savedCourseIds: listSavedCourseIds(db, userId)
  };
}

function parseIds(json) {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.filter(id => typeof id === 'string') : null;
  } catch {
    return null;
  }
}

function storedSnapshot(db, userId, row, context) {
  const skillIds = parseIds(row.skill_ids_json);
  const courseIds = parseIds(row.course_ids_json);
  if (skillIds && courseIds) return { skillIds, courseIds };

  // Rows generated before snapshots existed are frozen on first read.
  const snapshot = deriveRoadmapInputs(context);
  db.prepare('UPDATE roadmaps SET skill_ids_json = ?, course_ids_json = ? WHERE user_id = ?')
    .run(JSON.stringify(snapshot.skillIds), JSON.stringify(snapshot.courseIds), userId);
  return snapshot;
}

function pruneCompletions(db, userId, taskIds) {
  if (!taskIds.length) {
    db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
    return;
  }
  const placeholders = taskIds.map(() => '?').join(',');
  db.prepare(`DELETE FROM task_completions WHERE user_id = ? AND task_id NOT IN (${placeholders})`)
    .run(userId, ...taskIds);
}

export function getRoadmap(db, userId) {
  const row = db.prepare('SELECT * FROM roadmaps WHERE user_id = ?').get(userId);
  if (!row) return null;

  const job = loadJob(db, row.target_job_id);
  if (!job) return null;

  const context = roadmapContext(db, userId, job);
  const snapshot = storedSnapshot(db, userId, row, context);
  const phases = buildRoadmap({ ...context, weeklyHours: row.weekly_hours, snapshot });
  const taskIds = flattenTasks(phases).map(task => task.id);
  pruneCompletions(db, userId, taskIds);

  const completed = new Set(
    db.prepare('SELECT task_id FROM task_completions WHERE user_id = ?').all(userId).map(task => task.task_id)
  );
  const courseById = new Map(context.courses.map(course => [course.id, course]));
  const shapedPhases = phasesView(withCompletion(phases, completed), courseById);

  return {
    roadmap: {
      targetJobId: row.target_job_id,
      targetTitle: job.title,
      weeklyHours: row.weekly_hours,
      startDate: row.start_date,
      generatedAt: row.generated_at,
      skillIds: snapshot.skillIds,
      courseIds: snapshot.courseIds
    },
    phases: shapedPhases,
    progress: progressView(computeProgress(phases, completed), shapedPhases)
  };
}

export function getJourneyState(db, userId, roadmapState = getRoadmap(db, userId)) {
  return journeyView({
    journey: getJourney(db, userId),
    profile: toProfile(loadProfileRow(db, userId)),
    interests: loadInterestIds(db, userId),
    roadmap: roadmapState?.roadmap ?? null,
    added: listSavedCourseIds(db, userId),
    completed: roadmapState ? flattenTasks(roadmapState.phases).filter(task => task.completed).map(task => task.id) : []
  });
}

export function generateRoadmap(db, userId, { weeklyHours, startDate = null }) {
  const journey = getJourney(db, userId);
  if (!journey.targetJobId) {
    throw new AppError(409, 'TARGET_REQUIRED', 'Choose a target career before generating a roadmap.');
  }

  const job = loadJob(db, journey.targetJobId);
  if (!job) throw new AppError(409, 'TARGET_REQUIRED', 'Your target career is no longer available.');

  const context = roadmapContext(db, userId, job);
  const snapshot = deriveRoadmapInputs(context);
  const phases = buildRoadmap({ ...context, weeklyHours, snapshot });
  const taskIds = flattenTasks(phases).map(task => task.id);

  transaction(db, () => {
    db.prepare(`
      INSERT INTO roadmaps(user_id, target_job_id, weekly_hours, start_date, skill_ids_json, course_ids_json)
      VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET target_job_id = excluded.target_job_id,
        weekly_hours = excluded.weekly_hours, start_date = excluded.start_date,
        skill_ids_json = excluded.skill_ids_json, course_ids_json = excluded.course_ids_json,
        generated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `).run(userId, job.id, weeklyHours, startDate, JSON.stringify(snapshot.skillIds), JSON.stringify(snapshot.courseIds));

    db.prepare("UPDATE profiles SET weekly_hours = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ?")
      .run(weeklyHours, userId);

    pruneCompletions(db, userId, taskIds);
  });

  return getRoadmap(db, userId);
}

export function setTaskCompletion(db, userId, taskId, completed) {
  const state = getRoadmap(db, userId);
  if (!state) {
    throw new AppError(409, 'ROADMAP_REQUIRED', 'Generate a roadmap before updating tasks.');
  }

  const validIds = new Set(flattenTasks(state.phases).map(task => task.id));
  if (!validIds.has(taskId)) {
    throw new AppError(404, 'TASK_NOT_FOUND', `Unknown task '${taskId}'.`);
  }

  if (completed) {
    db.prepare('INSERT OR IGNORE INTO task_completions(user_id, task_id) VALUES(?, ?)').run(userId, taskId);
  } else {
    db.prepare('DELETE FROM task_completions WHERE user_id = ? AND task_id = ?').run(userId, taskId);
  }

  const refreshed = getRoadmap(db, userId);
  return { taskId, completed, progress: refreshed.progress };
}

export function resetProgress(db, userId) {
  const state = getRoadmap(db, userId);
  if (!state) {
    throw new AppError(409, 'ROADMAP_REQUIRED', 'Generate a roadmap before resetting progress.');
  }
  db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
  return getRoadmap(db, userId).progress;
}

export function clearJourney(db, userId) {
  transaction(db, () => {
    db.prepare("UPDATE journeys SET target_job_id = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE user_id = ?")
      .run(userId);
    db.prepare('DELETE FROM roadmaps WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM task_completions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_courses WHERE user_id = ?').run(userId);
  });
  return getJourney(db, userId);
}

export function deleteUser(db, userId) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  if (result.changes === 0) throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
}
