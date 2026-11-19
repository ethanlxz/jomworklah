import test from 'node:test';
import assert from 'node:assert/strict';
import { jobs, personas, skills } from '../src/db/seed-data.js';
import { compatibility, gapsFor, rankedCareers, rankedCourses } from '../src/domain/scoring.js';

const skillName = id => skills.find(skill => skill.id === id).name;
const jobById = id => jobs.find(job => job.id === id);
const scoreFor = persona => skillId => persona.scores[skillId] ?? 0;

test('Aina vs Junior Data Analyst matches prototype parity', () => {
  const job = jobById('junior-data-analyst');
  const result = compatibility(job.requirements, job.tags, scoreFor(personas.aina), personas.aina.interests);
  assert.deepEqual(result, { skillsMatch: 54, interestMatch: 100, fit: 61 });
});

test('Amir vs Automotive Technician matches prototype parity', () => {
  const job = jobById('automotive-technician');
  const result = compatibility(job.requirements, job.tags, scoreFor(personas.amir), personas.amir.interests);
  assert.deepEqual(result, { skillsMatch: 73, interestMatch: 100, fit: 77 });
});

test("Aina's Junior Data Analyst gap order is SQL, Data Visualisation, Python", () => {
  const job = jobById('junior-data-analyst');
  const gaps = gapsFor(job.requirements, scoreFor(personas.aina), skillName);
  const priority = gaps.filter(gap => gap.gap > 0).map(gap => gap.skillId);
  assert.deepEqual(priority, ['sql', 'data-viz', 'python']);
  assert.ok(Math.abs(gaps[0].priority - 0.9) < 1e-9);
});

test("Amir's automotive gap order is Safety, Electrical, Sensors, Troubleshooting", () => {
  const job = jobById('automotive-technician');
  const gaps = gapsFor(job.requirements, scoreFor(personas.amir), skillName);
  const priority = gaps.filter(gap => gap.gap > 0).map(gap => gap.skillId);
  assert.deepEqual(priority, ['safety', 'electrical', 'sensors', 'troubleshoot']);
});

test('interest match falls back to 50 when no tag overlaps', () => {
  const job = jobById('junior-data-analyst');
  const result = compatibility(job.requirements, job.tags, scoreFor(personas.aina), ['automotive']);
  assert.equal(result.interestMatch, 50);
});

test('evidence above the requirement level is capped', () => {
  const requirements = [{ skillId: 'sql', level: 2, weight: 1 }];
  const result = compatibility(requirements, [], () => 5, []);
  assert.equal(result.skillsMatch, 100);
  assert.equal(result.interestMatch, 50);
  assert.equal(result.fit, 93);
});

test('zero evidence rounds the interest-only contribution', () => {
  const requirements = [{ skillId: 'sql', level: 4, weight: 1 }];
  const result = compatibility(requirements, [], () => 0, []);
  assert.equal(result.skillsMatch, 0);
  assert.equal(result.fit, 8);
});

test('careers rank by fit then title', () => {
  const ranked = rankedCareers(jobs, scoreFor(personas.amir), personas.amir.interests);
  assert.equal(ranked[0].id, 'automotive-technician');
  for (let index = 1; index < ranked.length; index += 1) {
    const previous = ranked[index - 1];
    const current = ranked[index];
    assert.ok(previous.fit > current.fit
      || (previous.fit === current.fit && previous.title.localeCompare(current.title, 'en') <= 0));
  }
});

test('course relevance sums priorities for positive gaps only', () => {
  const job = jobById('junior-data-analyst');
  const gaps = gapsFor(job.requirements, scoreFor(personas.aina), skillName);
  const courses = [
    { id: 'a', title: 'A', skillIds: ['sql', 'excel'], mode: 'Online', location: 'Online' },
    { id: 'b', title: 'B', skillIds: ['data-viz', 'python'], mode: 'Online', location: 'Online' }
  ];
  const ranked = rankedCourses(courses, gaps, { learningMode: 'Online', location: 'Selangor' });
  assert.equal(ranked[0].id, 'b');
  assert.ok(Math.abs(ranked[0].relevance - 0.9) < 1e-9);
  assert.ok(Math.abs(ranked[1].relevance - 0.9) < 1e-9);
});
