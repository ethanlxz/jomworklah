export function createLlmAdapter(config, fallback) {
  const endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  async function chat(prompt, { json = false } = {}) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`
      },
      signal: AbortSignal.timeout(config.timeoutMs),
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: 'You are a careers assistant for Malaysian jobseekers. Be concise and factual.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`AI provider responded with ${response.status}`);
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new Error('AI provider returned an empty response');
    return content;
  }

  return {
    async analyzeNarrative({ narrative, skills, interests }) {
      const skillIds = skills.map(skill => skill.id).join(', ');
      const interestIds = interests.map(interest => interest.id).join(', ');
      const prompt = [
        'Analyse the following career narrative and return JSON only with this shape:',
        '{"detectedSkills":[{"skillId":"...","confidence":0.0,"suggestedLevel":1,"reason":"..."}],"suggestedInterests":["..."]}',
        `Allowed skillId values: ${skillIds}.`,
        `Allowed interest values: ${interestIds}.`,
        'Confidence must be between 0 and 1. suggestedLevel must be an integer from 1 to 3.',
        `Narrative: ${narrative}`
      ].join('\n');

      try {
        const parsed = JSON.parse(await chat(prompt, { json: true }));
        const allowedSkills = new Set(skills.map(skill => skill.id));
        const allowedInterests = new Set(interests.map(interest => interest.id));
        const detectedSkills = (Array.isArray(parsed.detectedSkills) ? parsed.detectedSkills : [])
          .filter(item => item && allowedSkills.has(item.skillId))
          .map(item => ({
            skillId: item.skillId,
            confidence: Math.max(0, Math.min(1, Number(item.confidence) || 0)),
            suggestedLevel: Math.max(1, Math.min(3, Math.trunc(Number(item.suggestedLevel) || 1))),
            reason: String(item.reason ?? '').slice(0, 300)
          }));
        const suggestedInterests = (Array.isArray(parsed.suggestedInterests) ? parsed.suggestedInterests : [])
          .filter(id => allowedInterests.has(id));
        return { provider: 'llm', detectedSkills, suggestedInterests };
      } catch {
        return fallback.analyzeNarrative({ narrative, skills, interests });
      }
    },

    async explainMatch(input) {
      const prompt = [
        `Explain in two or three sentences why ${input.job.title} fits this profile.`,
        `Skill match: ${input.compatibility.skillsMatch}%.`,
        `Largest gaps: ${input.gaps.filter(gap => gap.gap > 0).slice(0, 3).map(gap => `${gap.skillName ?? gap.skillId} (gap ${gap.gap})`).join(', ') || 'none'}.`,
        `Interests: ${(input.profile.interests ?? []).join(', ') || 'unspecified'}.`
      ].join('\n');
      try {
        return (await chat(prompt)).trim();
      } catch {
        return fallback.explainMatch(input);
      }
    },

    async narrateRoadmap(input) {
      const prompt = `Write two sentences describing this learning roadmap for ${input.job.title}: ${input.phases.map(phase => `${phase.title} (${phase.weeks} weeks, ${phase.tasks.length} tasks)`).join('; ')}.`;
      try {
        return (await chat(prompt)).trim();
      } catch {
        return fallback.narrateRoadmap(input);
      }
    }
  };
}
