import { analyzeNarrative } from '../domain/assessment-rule.js';

const label = gap => gap.skillName ?? gap.skillId;

export function createRuleAdapter() {
  return {
    async analyzeNarrative(input) {
      return analyzeNarrative(input);
    },

    async explainMatch({ profile, job, gaps, compatibility }) {
      const positive = gaps.filter(gap => gap.gap > 0);
      const strengths = gaps.filter(gap => gap.gap === 0).map(label).slice(0, 2);
      const top = positive[0];
      const second = positive[1];

      const sentences = [
        `Your profile covers ${compatibility.skillsMatch}% of the weighted requirements for ${job.title}.`
      ];

      if (top) {
        const weight = Math.round(top.weight * 100);
        const levels = top.gap === 1 ? 'level' : 'levels';
        const followUp = second ? `, followed by ${label(second)}` : '';
        sentences.push(`${label(top)} is the largest gap (${top.gap} ${levels}, ${weight}% weight)${followUp}.`);
      } else {
        sentences.push('You already meet every listed requirement in the sample profile.');
      }

      if (strengths.length) {
        sentences.push(`Your existing evidence includes ${strengths.join(' and ')}.`);
      }

      sentences.push(compatibility.interestMatch === 100
        ? 'The role also aligns with your stated interests.'
        : 'Your stated interests differ from this role, so treat the match as a skills-led option.');

      return sentences.join(' ');
    },

    async narrateRoadmap({ job, phases }) {
      const taskCount = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
      const weeks = phases.reduce((sum, phase) => sum + phase.weeks, 0);
      return `Your ${phases.length}-phase plan for ${job.title} runs about ${weeks} weeks and covers ${taskCount} steps. `
        + 'Start with foundations, then work through training, projects and job preparation.';
    }
  };
}
