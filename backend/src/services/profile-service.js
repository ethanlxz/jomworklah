import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import {
  loadInterestIds,
  loadInterestList,
  loadProfileRow,
  toProfile
} from './catalogue.js';
import { getJourneyState, getRoadmap } from './journey-service.js';
import { profileView, roadmapSnapshotView } from '../api/serializers.js';

const profileColumns = {
  name: 'name',
  headline: 'headline',
  qualification: 'qualification',
  fieldOfStudy: 'field_of_study',
  location: 'location',
  experience: 'experience',
  projects: 'projects',
  budget: 'budget',
  weeklyHours: 'weekly_hours',
  learningMode: 'learning_mode'
};

export function getProfile(db, userId) {
  const row = loadProfileRow(db, userId);
  if (!row) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return toProfile(row);
}

export function updateProfile(db, userId, patch) {
  const entries = Object.entries(patch).filter(([key]) => key in profileColumns);
  if (entries.length) {
    const assignments = entries.map(([key]) => `${profileColumns[key]} = ?`);
    db.prepare(`
      UPDATE profiles SET ${assignments.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE user_id = ?
    `).run(...entries.map(([, value]) => value), userId);
  }
  return getProfileState(db, userId);
}

export function getSkills(db, userId) {
  return db.prepare(`
    SELECT s.id, s.name, s.category, s.description, COALESCE(ps.evidence_level, 0) AS evidenceLevel
    FROM skills s
    LEFT JOIN profile_skills ps ON ps.skill_id = s.id AND ps.user_id = ?
    ORDER BY s.name
  `).all(userId).map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    evidenceLevel: row.evidenceLevel
  }));
}

function assertKnownSkills(db, skillIds) {
  const known = new Set(db.prepare('SELECT id FROM skills').all().map(row => row.id));
  const unknown = skillIds.filter(id => !known.has(id));
  if (unknown.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `Unknown skill id(s): ${unknown.join(', ')}.`,
      unknown.map(id => ({ path: `scores.${id}`, message: 'Unknown skill id' })));
  }
}

const upsertSkill = db => db.prepare(`
  INSERT INTO profile_skills(user_id, skill_id, evidence_level) VALUES(?, ?, ?)
  ON CONFLICT(user_id, skill_id) DO UPDATE SET evidence_level = excluded.evidence_level,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
`);

export function setSkills(db, userId, scores) {
  const entries = Object.entries(scores);
  assertKnownSkills(db, entries.map(([skillId]) => skillId));

  transaction(db, () => {
    const stmt = upsertSkill(db);
    for (const [skillId, level] of entries) stmt.run(userId, skillId, level);
  });

  return getSkills(db, userId);
}

export function setSkill(db, userId, skillId, level) {
  assertKnownSkills(db, [skillId]);
  upsertSkill(db).run(userId, skillId, level);
  const skill = getSkills(db, userId).find(item => item.id === skillId);
  return skill;
}

export function getInterests(db, userId) {
  return loadInterestIds(db, userId);
}

export function setInterests(db, userId, interestIds) {
  const known = new Set(loadInterestList(db).map(interest => interest.id));
  const unknown = interestIds.filter(id => !known.has(id));
  if (unknown.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `Unknown interest id(s): ${unknown.join(', ')}.`,
      unknown.map(id => ({ path: 'interests', message: `Unknown interest '${id}'` })));
  }

  transaction(db, () => {
    db.prepare('DELETE FROM profile_interests WHERE user_id = ?').run(userId);
    const stmt = db.prepare('INSERT OR IGNORE INTO profile_interests(user_id, interest_id) VALUES(?, ?)');
    for (const interestId of [...new Set(interestIds)]) stmt.run(userId, interestId);
  });

  return getInterests(db, userId);
}

export function completeOnboarding(db, userId, { interests, scores, ...profilePatch }) {
  transaction(db, () => {
    updateProfile(db, userId, profilePatch);
    if (interests) setInterests(db, userId, interests);
    if (scores) setSkills(db, userId, scores);
    db.prepare(`
      INSERT INTO journeys(user_id, started) VALUES(?, 1)
      ON CONFLICT(user_id) DO UPDATE SET started = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
    `).run(userId);
  });
}

export function getMe(db, userId, user) {
  const skills = getSkills(db, userId);
  const roadmapState = getRoadmap(db, userId);
  return {
    user: { id: user.id, kind: user.kind, personaKey: user.personaKey ?? null },
    profile: getProfileState(db, userId, skills),
    interests: getInterests(db, userId),
    skills,
    journey: getJourneyState(db, userId, roadmapState),
    roadmap: roadmapState
      ? { ...roadmapSnapshotView(roadmapState.roadmap), progress: roadmapState.progress }
      : null
  };
}

export function getProfileState(db, userId, skills = getSkills(db, userId)) {
  return profileView(getProfile(db, userId), {
    scores: Object.fromEntries(skills.map(skill => [skill.id, skill.evidenceLevel])),
    interests: getInterests(db, userId)
  });
}
