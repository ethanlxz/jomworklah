const skillAliases = {
  excel: ['excel', 'spreadsheet', 'spreadsheets', 'sheet', 'pivot table', 'pivot'],
  python: ['python', 'pandas', 'scripting', 'scripted', 'automation script'],
  sql: ['sql', 'database', 'databases', 'query', 'queries', 'relational'],
  'data-viz': ['data visualisation', 'data visualization', 'dashboard', 'dashboards', 'chart', 'charts', 'tableau', 'power bi'],
  web: ['html', 'css', 'web page', 'web pages', 'website', 'websites', 'responsive'],
  javascript: ['javascript', 'js', 'react', 'node.js', 'typescript'],
  communication: ['communication', 'present', 'presented', 'presenting', 'explain', 'explained', 'public speaking'],
  teamwork: ['teamwork', 'team', 'teams', 'collaborate', 'collaborated', 'coordinate', 'coordinated'],
  troubleshoot: ['troubleshoot', 'troubleshooting', 'diagnose', 'diagnosed', 'debug', 'debugging', 'root cause'],
  reporting: ['report', 'reports', 'reporting', 'summarise', 'summarised', 'summarized', 'documented', 'documentation'],
  marketing: ['marketing', 'campaign', 'campaigns', 'social media', 'seo', 'advertising'],
  content: ['content writing', 'copywriting', 'blog', 'article', 'articles', 'writing'],
  tools: ['hand tools', 'spanner', 'wrench', 'mechanical tools', 'toolbox', 'tools'],
  auto: ['motorcycle', 'car service', 'vehicle service', 'servicing', 'engine', 'automotive', 'workshop'],
  electrical: ['electrical', 'wiring', 'circuit', 'circuits', 'voltage', 'multimeter'],
  safety: ['safety', 'hazard', 'hazards', 'ppe', 'workshop safety', 'protective equipment'],
  sensors: ['sensor', 'sensors', 'calibration', 'calibrate', 'reading'],
  networking: ['network', 'networking', 'router', 'routers', 'wifi', 'connectivity', 'tcp/ip', 'lan']
};

const interestKeywords = {
  data: ['data', 'excel', 'spreadsheet', 'sql', 'dashboard', 'analytics', 'reporting', 'report'],
  technology: ['technology', 'software', 'web', 'coding', 'programming', 'computer', 'it support', 'javascript', 'python'],
  business: ['business', 'operations', 'admin', 'administration', 'management', 'stock', 'sales', 'scheduling'],
  creative: ['creative', 'design', 'marketing', 'content', 'social media', 'brand', 'campaign'],
  automotive: ['automotive', 'car', 'motorcycle', 'vehicle', 'engine', 'workshop'],
  mechanical: ['mechanical', 'tools', 'machinery', 'maintenance', 'equipment', 'servicing'],
  electronics: ['electronics', 'electrical', 'circuit', 'sensor', 'wiring', 'voltage']
};

const splitSentences = text => String(text)
  .toLowerCase()
  .split(/[.!?\n;]+/)
  .map(sentence => sentence.trim())
  .filter(Boolean);

export function analyzeNarrative({ narrative, skills = [], interests = [] }) {
  const sentences = splitSentences(narrative);
  const text = String(narrative || '').toLowerCase();
  const detectedSkills = [];

  for (const skill of skills) {
    const aliases = skillAliases[skill.id] ?? [];
    const nameAlias = String(skill.name || '').toLowerCase();
    const candidates = nameAlias ? [...aliases, nameAlias] : aliases;

    let hits = 0;
    let firstAlias = null;
    for (const sentence of sentences) {
      const alias = candidates.find(candidate => candidate && sentence.includes(candidate));
      if (alias) {
        hits += 1;
        if (!firstAlias) firstAlias = alias;
      }
    }

    if (hits > 0) {
      const confidence = Math.min(0.95, Number((0.6 + 0.15 * (hits - 1)).toFixed(2)));
      const suggestedLevel = Math.min(3, Math.max(1, hits));
      detectedSkills.push({
        skillId: skill.id,
        confidence,
        suggestedLevel,
        reason: hits === 1
          ? `Mentions "${firstAlias}" in your description.`
          : `Mentions "${firstAlias}" in ${hits} places in your description.`
      });
    }
  }

  detectedSkills.sort((a, b) => b.confidence - a.confidence || b.suggestedLevel - a.suggestedLevel || a.skillId.localeCompare(b.skillId, 'en'));

  const suggestedInterests = interests
    .map(interest => ({
      id: interest.id,
      hits: (interestKeywords[interest.id] ?? []).reduce(
        (count, keyword) => count + (text.includes(keyword) ? 1 : 0),
        0
      )
    }))
    .filter(entry => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.id.localeCompare(b.id, 'en'))
    .map(entry => entry.id);

  return { provider: 'rule', detectedSkills, suggestedInterests };
}

export { skillAliases, interestKeywords };
