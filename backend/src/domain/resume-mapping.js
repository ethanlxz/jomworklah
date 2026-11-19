import { skillAliases } from './assessment-rule.js';
import { locations } from '../db/seed-data.js';

const clip = (value, max) => {
  const text = value === null || value === undefined ? '' : String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const normalize = value => String(value).toLowerCase().replace(/[^a-z0-9+.\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Ordered high to low so a resume that mentions several levels keeps the highest.
const qualificationPatterns = [
  ['Degree', ['bachelor', 'master', 'doctorate', 'phd', 'degree', 'honours', 'honors']],
  ['Diploma', ['diploma']],
  ['SPM', ['spm', 'sijil pelajaran malaysia', 'stp', 'o level', 'olevel', 'matriculation', 'matrikulasi', 'foundation']],
  ['Certificate', ['certificate', 'sijil', 'skm', 'tvet', 'trade test', 'part qualification', 'skill certificate']]
];

function detectQualification(education) {
  const text = education
    .map(entry => [entry.qualification, entry.detail, entry.fieldOfStudy].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();
  if (!text.trim()) return null;
  for (const [label, patterns] of qualificationPatterns) {
    if (patterns.some(pattern => text.includes(pattern))) return label;
  }
  return null;
}

function educationFieldOfStudy(education, qualification) {
  const ranked = qualification
    ? education.filter(entry => detectQualification([entry]) === qualification)
    : [];
  const source = (ranked.length ? ranked : education)[0];
  return source?.fieldOfStudy ?? null;
}

function matchLocation(value) {
  const text = normalize(value);
  if (!text) return null;
  return locations.find(label => text.includes(normalize(label))) ?? null;
}

function summariseExperience(experience) {
  return experience
    .map(job => {
      const heading = [clip(job.role, 120), job.organisation ? `at ${clip(job.organisation, 160)}` : null, job.period ? `(${clip(job.period, 60)})` : null]
        .filter(Boolean)
        .join(' ');
      const detail = (job.highlights ?? []).filter(Boolean).join('; ');
      return [heading, detail].filter(Boolean).join(' - ');
    })
    .filter(Boolean)
    .join('\n');
}

function summariseProjects(projects) {
  return projects
    .map(project => [project.name, project.description, project.link ? `Link: ${project.link}` : null]
      .filter(Boolean)
      .join(' - '))
    .filter(Boolean)
    .join('\n');
}

/**
 * Extracted resume -> the columns `updateProfile` already knows how to write.
 * Absent values are left out so parsing never blanks fields the resume lacked.
 */
export function mapResumeToProfile(resume) {
  const personal = resume.personalInfo ?? {};
  const education = resume.education ?? [];
  const experience = resume.experience ?? [];
  const projects = resume.projects ?? [];
  const qualification = detectQualification(education);
  const latestRole = experience[0]?.role ?? null;

  const candidate = {
    name: clip(personal.fullName, 120),
    headline: clip(personal.headline ?? latestRole, 200),
    qualification,
    fieldOfStudy: clip(educationFieldOfStudy(education, qualification), 120),
    location: matchLocation(personal.location) ?? clip(personal.location, 120),
    experience: clip(summariseExperience(experience), 2000),
    projects: clip(summariseProjects(projects), 2000)
  };

  return Object.fromEntries(Object.entries(candidate).filter(([, value]) => Boolean(value)));
}

const evidencePatterns = [
  [4, /\b(work|worked|working|workflow|job|jobs|employment|intern|internship|placement|company|client|customer|professional|production|daily|ongoing|site)\b/],
  [3, /\b(project|projects|built|build|created|create|developed|develop|designed|design|implemented|competition|hackathon|portfolio|freelance)\b/],
  [2, /\b(course|coursework|study|studied|training|trained|certificate|certification|diploma|degree|class|assignment|learn|learned|lab)\b/]
];

export function evidenceLevelFor(evidence) {
  const text = normalize(evidence);
  if (!text) return 1;
  const match = evidencePatterns.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : 1;
}

function buildSkillIndex(skills) {
  const index = [];
  for (const skill of skills) {
    const terms = new Set([skill.name, ...(skillAliases[skill.id] ?? [])]);
    for (const term of terms) {
      const normalized = normalize(term);
      if (normalized) index.push({ skillId: skill.id, term: normalized });
    }
  }
  index.sort((a, b) => b.term.length - a.term.length || a.skillId.localeCompare(b.skillId, 'en'));
  return index;
}

function findSkillId(name, index) {
  const text = ` ${normalize(name)} `;
  const hit = index.find(entry => text.includes(` ${entry.term} `) || text.includes(entry.term));
  return hit?.skillId ?? null;
}

/**
 * Extracted skill names are matched against the seeded catalogue (name plus the
 * aliases the rule engine already uses). Anything outside the catalogue is
 * reported instead of being dropped silently.
 */
export function mapResumeToSkills(resume, skills) {
  const index = buildSkillIndex(skills);
  const byId = new Map(skills.map(skill => [skill.id, skill]));
  const matched = new Map();
  const unmatched = [];

  for (const group of ['technicalSkills', 'softSkills']) {
    for (const entry of resume[group] ?? []) {
      const skillId = findSkillId(entry.name, index);
      if (!skillId) {
        unmatched.push({ name: entry.name, source: group });
        continue;
      }
      const level = evidenceLevelFor(entry.evidence);
      if (!matched.has(skillId) || matched.get(skillId).evidenceLevel < level) {
        matched.set(skillId, {
          skillId,
          name: byId.get(skillId).name,
          evidenceLevel: level,
          source: group,
          evidence: entry.evidence
        });
      }
    }
  }

  return {
    scores: Object.fromEntries([...matched.values()].map(entry => [entry.skillId, entry.evidenceLevel])),
    matched: [...matched.values()],
    unmatched
  };
}
