import {
  courses as seedCourses,
  expectedCounts as seedCounts,
  interests as seedInterests,
  jobs as seedJobs,
  personas as seedPersonas,
  providers as seedProviders,
  skills as seedSkills
} from './seed-data.js';

export class SeedValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'SeedValidationError';
    this.details = details;
  }
}

export function validateSeedData(data = {}) {
  const skills = data.skills ?? seedSkills;
  const interests = data.interests ?? seedInterests;
  const jobs = data.jobs ?? seedJobs;
  const providers = data.providers ?? seedProviders;
  const courses = data.courses ?? seedCourses;
  const personas = data.personas ?? seedPersonas;
  const expectedCounts = data.expectedCounts ?? seedCounts;

  const problems = [];
  const skillIds = new Set(skills.map(skill => skill.id));
  const interestIds = new Set(interests.map(interest => interest.id));
  const providerIds = new Set(providers.map(provider => provider.id));
  const jobIds = new Set(jobs.map(job => job.id));

  if (skills.length !== expectedCounts.skills) problems.push(`expected ${expectedCounts.skills} skills, found ${skills.length}`);
  if (interests.length !== expectedCounts.interests) problems.push(`expected ${expectedCounts.interests} interests, found ${interests.length}`);
  if (jobs.length !== expectedCounts.jobs) problems.push(`expected ${expectedCounts.jobs} jobs, found ${jobs.length}`);
  if (providers.length !== expectedCounts.providers) problems.push(`expected ${expectedCounts.providers} providers, found ${providers.length}`);
  if (courses.length !== expectedCounts.courses) problems.push(`expected ${expectedCounts.courses} courses, found ${courses.length}`);
  if (Object.keys(personas).length !== expectedCounts.personas) problems.push(`expected ${expectedCounts.personas} personas, found ${Object.keys(personas).length}`);

  for (const job of jobs) {
    const sum = job.requirements.reduce((total, req) => total + req.weight, 0);
    if (Math.abs(sum - 1) > 0.001) {
      problems.push(`job '${job.id}' requirement weights sum to ${sum.toFixed(4)}, expected 1.0`);
    }
    for (const req of job.requirements) {
      if (!skillIds.has(req.skillId)) problems.push(`job '${job.id}' references unknown skill '${req.skillId}'`);
      if (!Number.isInteger(req.level) || req.level < 1 || req.level > 5) {
        problems.push(`job '${job.id}' skill '${req.skillId}' has invalid level ${req.level}`);
      }
    }
    for (const tag of job.tags) {
      if (!interestIds.has(tag)) problems.push(`job '${job.id}' references unknown interest '${tag}'`);
    }
    if (!job.project.length) problems.push(`job '${job.id}' has no project briefs`);
  }

  for (const course of courses) {
    if (!providerIds.has(course.providerId)) problems.push(`course '${course.id}' references unknown provider '${course.providerId}'`);
    if (!course.skillIds.length) problems.push(`course '${course.id}' teaches no skills`);
    for (const skillId of course.skillIds) {
      if (!skillIds.has(skillId)) problems.push(`course '${course.id}' references unknown skill '${skillId}'`);
    }
    if (course.maxWeeks < course.minWeeks) problems.push(`course '${course.id}' has maxWeeks < minWeeks`);
  }

  for (const persona of Object.values(personas)) {
    if (!jobIds.has(persona.targetJobId)) problems.push(`persona '${persona.key}' targets unknown job '${persona.targetJobId}'`);
    for (const interest of persona.interests) {
      if (!interestIds.has(interest)) problems.push(`persona '${persona.key}' references unknown interest '${interest}'`);
    }
    for (const [skillId, level] of Object.entries(persona.scores)) {
      if (!skillIds.has(skillId)) problems.push(`persona '${persona.key}' scores unknown skill '${skillId}'`);
      if (!Number.isInteger(level) || level < 0 || level > 5) {
        problems.push(`persona '${persona.key}' skill '${skillId}' has invalid score ${level}`);
      }
    }
  }

  if (problems.length) {
    throw new SeedValidationError('Seed data failed validation', problems);
  }

  return true;
}
