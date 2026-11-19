/* Candidate to role scoring. Deliberately identical to compatibility() and
   gapsFor() in js/app.js so the employer view and the candidate view never
   disagree about the same profile. */

export function skillMatch(candidate, role) {
  return Math.round(100 * role.requirements.reduce(
    (sum, requirement) => sum + Math.min((candidate.scores[requirement.skillId] ?? 0) / requirement.level, 1) * requirement.weight,
    0
  ));
}

export function matchScore(candidate, role) {
  const interestMatch = role.tags.some(tag => candidate.interests.includes(tag)) ? 100 : 50;
  return Math.round(0.85 * skillMatch(candidate, role) + 0.15 * interestMatch);
}

export function gapsFor(candidate, role) {
  return role.requirements
    .map(requirement => {
      const current = candidate.scores[requirement.skillId] ?? 0;
      const gap = Math.max(0, requirement.level - current);
      return { ...requirement, current, gap };
    })
    .sort((a, b) => b.gap * b.weight - a.gap * a.weight || b.weight - a.weight);
}

export function openGaps(candidate, role) {
  return gapsFor(candidate, role).filter(item => item.gap > 0);
}

/* The role this candidate is currently closest to, used when a profile link
   arrives without a ?role= parameter. */
export function bestRole(candidate, roles) {
  return roles.reduce((best, role) => (
    matchScore(candidate, role) > matchScore(candidate, best) ? role : best
  ), roles[0]);
}
