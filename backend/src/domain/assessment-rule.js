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
  auto: ['motorcycle', 'car service', 'vehicle service', 'servicing', 'engine', 'automotive', 'workshop', 'electric vehicle', 'hybrid vehicle', 'ev charging', 'charging station', 'battery pack', 'ev technology'],
  electrical: ['electrical', 'wiring', 'circuit', 'circuits', 'voltage', 'multimeter'],
  safety: ['safety', 'hazard', 'hazards', 'ppe', 'workshop safety', 'protective equipment', 'occupational safety', 'workplace safety', 'risk assessment', 'incident investigation', 'safety inspection', 'first aid', 'permit to work', 'safety audit'],
  sensors: ['sensor', 'sensors', 'calibration', 'calibrate', 'reading'],
  networking: ['network', 'networking', 'router', 'routers', 'wifi', 'connectivity', 'tcp/ip', 'lan', 'telecommunications', 'telecommunication', 'telecom', 'fibre optic', 'fiber optic', 'wireless', 'ethernet', 'network switch', 'voip', 'cellular network', '5g'],

  'it-support': ['it support', 'helpdesk', 'help desk', 'computer hardware', 'operating system', 'pc repair', 'it technician', 'system administration', 'active directory', 'end user support'],
  cybersecurity: ['cybersecurity', 'cyber security', 'cyber', 'firewall', 'penetration test', 'pentest', 'malware', 'digital forensics', 'forensics', 'encryption', 'incident response', 'vulnerability assessment', 'threat detection', 'security operations'],
  'software-development': ['software development', 'software engineering', 'programming', 'coding', 'programmer', 'developer', 'application development', 'rest api', 'api development', 'agile', 'version control', 'github', 'unit testing'],
  'cloud-devops': ['cloud computing', 'cloud platform', 'aws cloud', 'amazon web services', 'azure', 'google cloud', 'docker', 'kubernetes', 'devops', 'ci/cd', 'terraform', 'serverless', 'infrastructure as code', 'virtualisation', 'virtualization'],
  'machine-learning': ['machine learning', 'artificial intelligence', 'deep learning', 'neural network', 'data science', 'predictive model', 'natural language processing', 'computer vision', 'tensorflow', 'pytorch', 'scikit learn', 'scikit-learn'],
  electronics: ['electronics', 'electronic', 'pcb', 'circuit board', 'soldering', 'microcontroller', 'arduino', 'raspberry pi', 'electronic components', 'analogue electronics', 'analog electronics'],
  manufacturing: ['manufacturing', 'factory', 'production line', 'assembly line', 'industrial engineering', 'lean manufacturing', 'production operator'],
  'automation-robotics': ['automation', 'robotics', 'robotic', 'plc', 'scada', 'hmi', 'programmable logic controller', 'industrial robot', 'pneumatic', 'hydraulic system', 'control system'],
  'welding-fabrication': ['welding', 'welder', 'weld', 'metal fabrication', 'fabrication', 'sheet metal', 'lathe', 'milling machine', 'machining', 'cnc', 'metalwork', 'pipe welding'],
  construction: ['construction', 'construction site', 'bricklaying', 'concrete', 'formwork', 'scaffolding', 'steel reinforcement', 'site supervision', 'building works'],
  'mechanical-maintenance': ['mechanical maintenance', 'preventive maintenance', 'predictive maintenance', 'heavy machinery', 'excavator', 'hydraulics', 'gearbox', 'ball bearing', 'wheel bearing', 'vibration analysis', 'lubrication', 'plant maintenance', 'overhaul'],
  'oil-gas': ['oil and gas', 'oil & gas', 'petrochemical', 'refinery', 'pipeline', 'upstream', 'downstream', 'drilling', 'offshore', 'lng', 'process plant', 'wellhead'],
  'solar-energy': ['solar', 'photovoltaic', 'renewable energy', 'solar panel', 'inverter', 'wind turbine', 'battery storage', 'green energy', 'net metering'],
  'water-treatment': ['water treatment', 'wastewater', 'effluent', 'water quality', 'filtration', 'reverse osmosis', 'sewage', 'environmental compliance', 'recycling', 'pollution control'],
  'aviation-maintenance': ['aviation', 'aircraft', 'airframe', 'avionics', 'aerospace', 'aircraft maintenance', 'turbine engine', 'mro', 'line maintenance', 'hangar'],
  'marine-engineering': ['marine engineering', 'maritime', 'vessel', 'ship repair', 'naval architecture', 'engine room', 'seafarer', 'offshore vessel', 'marine technician'],
  logistics: ['logistics', 'warehouse', 'warehousing', 'inventory', 'stock control', 'supply chain', 'forklift', 'shipping', 'freight', 'pallet', 'inventory management'],
  facilities: ['facilities management', 'facility management', 'building maintenance', 'groundskeeping', 'janitorial', 'housekeeping', 'asset maintenance', 'building services'],
  'quality-control': ['quality assurance', 'quality control', 'metrology', 'calibration', 'inspection', 'non-conformance', 'iso 9001', 'dimensional measurement', 'defect analysis', 'qc inspection'],
  'cad-bim': ['cad', 'autocad', 'solidworks', 'bim', 'revit', 'drafting', 'technical drawing', 'engineering drawing', 'cad drawing'],
  'additive-manufacturing': ['3d printing', '3d printer', 'additive manufacturing', '3d modelling', '3d modeling', 'fusion 360', 'blender', 'rapid prototyping', 'digital fabrication', 'laser cutting', 'cad modelling'],
  semiconductor: ['semiconductor', 'wafer fabrication', 'cleanroom', 'clean room', 'microelectronics', 'integrated circuit', 'chip fabrication', 'electronics repair', 'component level repair', 'pcb assembly', 'smt assembly'],
  hvac: ['hvac', 'air conditioning', 'air-conditioning', 'aircon', 'refrigeration', 'refrigerant', 'chiller', 'ventilation', 'ducting', 'cooling system'],
  plumbing: ['plumbing', 'plumber', 'pipe fitting', 'pipefitting', 'piping', 'fire protection', 'fire sprinkler', 'drainage', 'sanitary plumbing', 'water piping', 'fire fighting system'],
  'surveying-gis': ['surveying', 'surveyor', 'geospatial', 'geographic information system', 'arcgis', 'qgis', 'topographic survey', 'total station', 'gps survey', 'drone mapping', 'remote sensing', 'land survey'],
  'media-production': ['video editing', 'video production', 'videography', 'photography', 'animation', 'motion graphics', 'adobe premiere', 'after effects', 'photoshop', 'multimedia', 'podcast', 'graphic design', 'sound editing'],
  agritech: ['agriculture', 'agricultural', 'farming', 'agritech', 'agri-tech', 'precision farming', 'hydroponics', 'irrigation', 'livestock', 'crop management', 'agronomy', 'smart farming', 'soil testing']
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
