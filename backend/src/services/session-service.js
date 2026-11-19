import crypto from 'node:crypto';
import { transaction } from '../db/connection.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createUser(db, { kind = 'guest' } = {}) {
  const id = `usr_${crypto.randomUUID()}`;
  transaction(db, () => {
    db.prepare('INSERT INTO users(id, kind) VALUES(?, ?)').run(id, kind);
    db.prepare('INSERT INTO profiles(user_id, name) VALUES(?, ?)').run(id, 'Guest');
    db.prepare('INSERT INTO journeys(user_id, started) VALUES(?, 0)').run(id);
  });
  return id;
}

export function issueToken(db, userId, { expiresAt = null } = {}) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  return token;
}

export function resolveSession(db, token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.token_hash, s.expires_at, u.id, u.kind, u.persona_key
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?
  `).get(hashToken(token));

  if (!row) return null;
  if (row.expires_at && row.expires_at <= new Date().toISOString()) return null;

  db.prepare("UPDATE sessions SET last_seen_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE token_hash = ?")
    .run(row.token_hash);

  return { id: row.id, kind: row.kind, personaKey: row.persona_key };
}

export function createGuestSession(db) {
  const userId = createUser(db, { kind: 'guest' });
  const token = issueToken(db, userId);
  return { token, user: { id: userId, kind: 'guest' } };
}
