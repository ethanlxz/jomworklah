import { AppError } from '../middleware/errors.js';
import { compareText, compatibility, gapsFor, rankedCareers } from '../domain/scoring.js';
import {
  loadInterestIds,
  loadJob,
  loadJobs,
  loadProfileRow,
  loadScoreMap,
  loadSkillMap,
  toProfile
} from './catalogue.js';

function context(db, userId) {
  const scores = loadScoreMap(db, userId);
  const interests = loadInterestIds(db, userId);
  const skillMap = loadSkillMap(db);
  const profileRow = loadProfileRow(db, userId);
  return {
    scores,
    interests,
    profile: toProfile(profileRow),
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillId => skillMap.get(skillId)?.name ?? skillId
  };
}

export function listCareers(db, userId, { query = '', category = 'All', sort = 'match' } = {}) {
  const { interests, scoreFor, skillNameFor } = context(db, userId);

  let ranked = rankedCareers(loadJobs(db), scoreFor, interests);
  const search = String(query).trim().toLowerCase();
  ranked = ranked.filter(job => (category === 'All' || job.category === category)
    && job.title.toLowerCase().includes(search));

  if (sort === 'title' || sort === 'name') {
    ranked.sort((a, b) => compareText(a.title, b.title));
  }

  return ranked.map(job => {
    const gaps = gapsFor(job.requirements, scoreFor, skillNameFor);
    return {
      id: job.id,
      title: job.title,
      category: job.category,
      sector: job.sector,
      icon: job.icon,
      summary: job.summary,
      qualification: job.qualification,
      fit: job.fit,
      skillsMatch: job.skillsMatch,
      interestMatch: job.interestMatch,
      matchingSkills: gaps.filter(gap => gap.gap === 0).map(gap => skillNameFor(gap.skillId)),
      priorityGaps: gaps.filter(gap => gap.gap > 0).slice(0, 2).map(gap => ({
        skillId: gap.skillId,
        name: skillNameFor(gap.skillId),
        gap: gap.gap
      })),
      interestAligned: job.tags.some(tag => interests.includes(tag))
    };
  });
}

export async function getCareer(db, userId, jobId, ai) {
  const { interests, profile, scoreFor, skillNameFor } = context(db, userId);
  const job = loadJob(db, jobId);
  if (!job) throw new AppError(404, 'CAREER_NOT_FOUND', `Unknown career '${jobId}'.`);

  const compatibilityResult = compatibility(job.requirements, job.tags, scoreFor, interests);
  const gaps = gapsFor(job.requirements, scoreFor, skillNameFor).map(gap => ({
    ...gap,
    skillName: skillNameFor(gap.skillId)
  }));

  const explanation = await ai.explainMatch({
    profile: { ...profile, interests },
    job,
    gaps,
    compatibility: compatibilityResult
  });

  return {
    ...job,
    requirements: gaps,
    compatibility: compatibilityResult,
    explanation
  };
}
