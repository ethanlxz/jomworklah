import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, jobs, personas, skills } from '../src/db/seed-data.js';
import { buildRoadmap, computeProgress, deriveRoadmapInputs, flattenTasks, phaseWeeks } from '../src/domain/roadmap.js';

const skillName = id => skills.find(skill => skill.id === id)?.name ?? id;
const jobById = id => jobs.find(job => job.id === id);
const scoreFor = persona => skillId => persona.scores[skillId] ?? 0;
const profile = persona => ({
  learningMode: persona.learningMode,
  location: persona.location,
  budget: persona.budget
});

test('phase weeks follow the prototype formula', () => {
  assert.deepEqual(phaseWeeks(5), [2, 3, 2, 1]);
  assert.deepEqual(phaseWeeks(8), [2, 2, 2, 1]);
  assert.deepEqual(phaseWeeks(3), [4, 5, 4, 2]);
  assert.deepEqual(phaseWeeks(12), [1, 2, 1, 1]);
});

test('Aina roadmap at 5 hours has four phases and 11 tasks', () => {
  const job = jobById('junior-data-analyst');
  const phases = buildRoadmap({
    job,
    scoreFor: scoreFor(personas.aina),
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses,
    weeklyHours: 5
  });

  assert.deepEqual(phases.map(phase => phase.id), ['foundations', 'training', 'projects', 'prepare']);
  assert.deepEqual(phases.map(phase => phase.weeks), [2, 3, 2, 1]);
  assert.equal(flattenTasks(phases).length, 11);
  assert.deepEqual(phases[0].tasks.map(task => task.id), ['skill-sql', 'skill-data-viz', 'skill-python']);
  assert.deepEqual(
    phases[1].tasks.map(task => task.id),
    ['course-dashboard-design', 'course-sql-foundations', 'training-schedule']
  );
  assert.deepEqual(phases[2].tasks.map(task => task.id), ['project-1', 'project-2']);
  assert.deepEqual(
    phases[3].tasks.map(task => task.id),
    ['prepare-resume', 'prepare-interview', 'prepare-application']
  );
});

test('Amir roadmap at 8 hours uses compressed weeks', () => {
  const job = jobById('automotive-technician');
  const phases = buildRoadmap({
    job,
    scoreFor: scoreFor(personas.amir),
    skillNameFor: skillName,
    profile: profile(personas.amir),
    courses,
    weeklyHours: 8
  });
  assert.deepEqual(phases.map(phase => phase.weeks), [2, 2, 2, 1]);
  assert.equal(flattenTasks(phases).length, 11);
});

test('a fully covered role falls back to inventory and review tasks', () => {
  const job = jobById('junior-data-analyst');
  const phases = buildRoadmap({
    job,
    scoreFor: () => 5,
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses,
    weeklyHours: 5
  });
  assert.deepEqual(phases[0].tasks.map(task => task.id), ['foundation-inventory', 'foundation-review']);
  assert.deepEqual(phases[1].tasks.map(task => task.id), ['training-review', 'training-schedule']);
  assert.equal(flattenTasks(phases).length, 9);
});

test('a single gap skill still adds an inventory fallback', () => {
  const job = jobById('junior-data-analyst');
  const scores = { ...personas.aina.scores, 'data-viz': 4, python: 3 };
  const phases = buildRoadmap({
    job,
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses,
    weeklyHours: 5
  });
  assert.deepEqual(phases[0].tasks.map(task => task.id), ['skill-sql', 'foundation-inventory']);
});

test('saved courses are unioned without duplicating snapshot courses', () => {
  const job = jobById('junior-data-analyst');
  const phases = buildRoadmap({
    job,
    scoreFor: scoreFor(personas.aina),
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses,
    savedCourseIds: ['dashboard-design', 'campaign-measurement'],
    weeklyHours: 5
  });
  const ids = phases[1].tasks.map(task => task.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('course-dashboard-design'));
  assert.ok(ids.includes('course-campaign-measurement'));
  assert.ok(ids.includes('course-sql-foundations'));
});

test('a stored snapshot overrides live skill scores', () => {
  const job = jobById('junior-data-analyst');
  const inputs = {
    job,
    scoreFor: scoreFor(personas.aina),
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses
  };
  const snapshot = deriveRoadmapInputs(inputs);
  assert.deepEqual(snapshot, {
    skillIds: ['sql', 'data-viz', 'python'],
    courseIds: ['dashboard-design', 'sql-foundations']
  });

  const phases = buildRoadmap({ ...inputs, scoreFor: () => 5, weeklyHours: 5, snapshot });
  assert.deepEqual(phases[0].tasks.map(task => task.id), ['skill-sql', 'skill-data-viz', 'skill-python']);
});

test('progress counts completed tasks and finds the next one', () => {
  const job = jobById('junior-data-analyst');
  const phases = buildRoadmap({
    job,
    scoreFor: scoreFor(personas.aina),
    skillNameFor: skillName,
    profile: profile(personas.aina),
    courses,
    weeklyHours: 5
  });
  const completed = new Set(['skill-sql', 'skill-data-viz']);
  const progress = computeProgress(phases, completed);
  assert.equal(progress.done, 2);
  assert.equal(progress.total, 11);
  assert.equal(progress.percent, 18);
  assert.equal(progress.nextTaskId, 'skill-python');
});
