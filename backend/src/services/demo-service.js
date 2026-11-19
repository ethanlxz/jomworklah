import crypto from 'node:crypto';
import { transaction } from '../db/connection.js';
import { AppError } from '../middleware/errors.js';
import { issueToken } from './session-service.js';

export function listPersonas(db) {
  const templates = db.prepare(`
    SELECT u.persona_key, p.name, p.headline, p.location, p.budget, p.weekly_hours,
           p.learning_mode, j.target_job_id, jt.title AS target_title
    FROM users u
    JOIN profiles p ON p.user_id = u.id
    LEFT JOIN journeys j ON j.user_id = u.id
    LEFT JOIN jobs jt ON jt.id = j.target_job_id
    WHERE u.kind = 'demo_template'
    ORDER BY p.name
  `).all();

  const topSkillsStmt = db.prepare(`
    SELECT ps.skill_id AS id, s.name, ps.evidence_level AS evidenceLevel
    FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id
    JOIN users u ON u.id = ps.user_id
    WHERE u.persona_key = ?
    ORDER BY ps.evidence_level DESC, s.name
    LIMIT 2
  `);

  return templates.map(row => ({
    personaKey: row.persona_key,
    name: row.name,
    headline: row.headline,
    location: row.location,
    budget: row.budget,
    weeklyHours: row.weekly_hours,
    learningMode: row.learning_mode,
    targetJobId: row.target_job_id,
    targetTitle: row.target_title,
    topSkills: topSkillsStmt.all(row.persona_key)
  }));
}

export function createDemoSession(db, personaKey) {
  const template = db.prepare("SELECT id FROM users WHERE persona_key = ? AND kind = 'demo_template'").get(personaKey);
  if (!template) throw new AppError(404, 'PERSONA_NOT_FOUND', `Unknown demo persona '${personaKey}'.`);

  const userId = `usr_${crypto.randomUUID()}`;

  transaction(db, () => {
    db.prepare("INSERT INTO users(id, kind) VALUES(?, 'demo_clone')").run(userId);

    db.prepare(`
      INSERT INTO profiles(user_id, name, headline, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode)
      SELECT ?, name, headline, qualification, field_of_study, location, experience, projects, budget, weekly_hours, learning_mode
      FROM profiles WHERE user_id = ?
    `).run(userId, template.id);

    db.prepare(`
      INSERT INTO profile_skills(user_id, skill_id, evidence_level)
      SELECT ?, skill_id, evidence_level FROM profile_skills WHERE user_id = ?
    `).run(userId, template.id);

    db.prepare(`
      INSERT INTO profile_interests(user_id, interest_id)
      SELECT ?, interest_id FROM profile_interests WHERE user_id = ?
    `).run(userId, template.id);

    db.prepare(`
      INSERT INTO journeys(user_id, started, target_job_id)
      SELECT ?, started, target_job_id FROM journeys WHERE user_id = ?
    `).run(userId, template.id);
  });

  const token = issueToken(db, userId);
  return { token, userId };
}
