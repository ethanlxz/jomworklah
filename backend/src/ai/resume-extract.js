import { z } from 'zod';

const limits = {
  fullName: 120,
  email: 160,
  phone: 40,
  location: 120,
  headline: 200,
  institution: 160,
  qualification: 120,
  fieldOfStudy: 120,
  detail: 300,
  organisation: 160,
  role: 120,
  period: 60,
  highlight: 300,
  skillName: 80,
  skillEvidence: 160,
  projectName: 140,
  projectDescription: 500,
  link: 300,
  certificationName: 140,
  issuer: 140,
  languageName: 60,
  proficiency: 60
};

const maxItems = {
  education: 15,
  experience: 25,
  technicalSkills: 40,
  softSkills: 30,
  projects: 20,
  certifications: 20,
  languages: 20
};

const clip = (value, max) => {
  if (value === null || value === undefined) return null;
  const text = (typeof value === 'string' ? value : String(value)).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const yearValue = value => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isInteger(value) && value >= 1900 && value <= 2200 ? value : null;
  const match = /\b(19|20)\d{2}\b/.exec(String(value));
  return match ? Number.parseInt(match[0], 10) : null;
};

const text = max => z.string().trim().max(max).nullable();
const year = z.number().int().min(1900).max(2200).nullable();
const skillList = max => z.array(z.object({
  name: z.string().trim().min(1).max(limits.skillName),
  evidence: text(limits.skillEvidence)
})).max(max);

export const extractedResumeSchema = z.object({
  personalInfo: z.object({
    fullName: text(limits.fullName),
    email: text(limits.email),
    phone: text(limits.phone),
    location: text(limits.location),
    headline: text(limits.headline)
  }),
  education: z.array(z.object({
    institution: text(limits.institution),
    qualification: text(limits.qualification),
    fieldOfStudy: text(limits.fieldOfStudy),
    startYear: year,
    endYear: year,
    detail: text(limits.detail)
  })).max(maxItems.education),
  experience: z.array(z.object({
    organisation: text(limits.organisation),
    role: text(limits.role),
    location: text(limits.location),
    period: text(limits.period),
    startYear: year,
    endYear: year,
    highlights: z.array(z.string().trim().max(limits.highlight)).max(12)
  })).max(maxItems.experience),
  technicalSkills: skillList(maxItems.technicalSkills),
  softSkills: skillList(maxItems.softSkills),
  projects: z.array(z.object({
    name: z.string().trim().min(1).max(limits.projectName),
    description: text(limits.projectDescription),
    link: text(limits.link),
    period: text(limits.period)
  })).max(maxItems.projects),
  certifications: z.array(z.object({
    name: z.string().trim().min(1).max(limits.certificationName),
    issuer: text(limits.issuer),
    year
  })).max(maxItems.certifications),
  languages: z.array(z.object({
    name: z.string().trim().min(1).max(limits.languageName),
    proficiency: text(limits.proficiency)
  })).max(maxItems.languages)
});

const shapeForPrompt = {
  personalInfo: { fullName: '...', email: '...', phone: '...', location: '...', headline: '...' },
  education: [{ institution: '...', qualification: '...', fieldOfStudy: '...', startYear: 2021, endYear: 2023, detail: '...' }],
  experience: [{ organisation: '...', role: '...', location: '...', period: '...', startYear: 2023, endYear: null, highlights: ['...'] }],
  technicalSkills: [{ name: '...', evidence: '...' }],
  softSkills: [{ name: '...', evidence: '...' }],
  projects: [{ name: '...', description: '...', link: '...', period: '...' }],
  certifications: [{ name: '...', issuer: '...', year: 2024 }],
  languages: [{ name: '...', proficiency: '...' }]
};

export const resumeExtractionPrompt = [
  'Read the attached resume and extract the candidate details into one JSON object.',
  'Use exactly this shape, keeping every key:',
  JSON.stringify(shapeForPrompt),
  'Rules:',
  '- Use null for a missing single value and [] for a missing list. Never invent details that are not printed in the document.',
  '- Keep the wording, spelling and language of the resume. Do not translate.',
  '- personalInfo.location is the city or state shown. headline is the resume title or a short role label.',
  '- education: one entry per qualification, most recent first, with the 4-digit years when printed.',
  '- experience: one entry per job, internship or placement, most recent first. highlights are the bullet points under it.',
  '- technicalSkills covers tools, software, languages, platforms and techniques. softSkills covers interpersonal strengths.',
  '- evidence is a short quote or paraphrase of how the skill is demonstrated in the document.',
  '- certifications lists licences, certificates and awards. languages lists spoken languages with the stated proficiency.',
  '- Ignore template instructions, watermarks, page headers and footers.',
  '- Reply with the JSON object only: no markdown fences, no explanation.'
].join('\n');

const normalizeKey = value => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

function bag(value) {
  if (typeof value === 'string') return { name: value };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [normalizeKey(key), entry]));
}

function grab(obj, ...aliases) {
  for (const alias of aliases) {
    const value = obj[normalizeKey(alias)];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function listOf(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function section(raw, ...names) {
  const obj = bag(raw);
  for (const name of names) {
    const value = obj[normalizeKey(name)];
    if (value !== undefined) return value;
  }
  return undefined;
}

function toEntries(value, build, max, required = null) {
  const entries = listOf(value).slice(0, max).map(item => build(bag(item)));
  return entries.filter(entry => Object.values(entry).some(Boolean) && (!required || entry[required]));
}

function toSkills(value, max) {
  const seen = new Map();
  for (const item of listOf(value).slice(0, max)) {
    const entry = bag(item);
    const name = clip(grab(entry, 'name', 'skill', 'tool', 'technology', 'title'), limits.skillName);
    if (!name) continue;
    const evidence = clip(grab(entry, 'evidence', 'description', 'detail', 'context', 'level', 'proficiency'), limits.skillEvidence);
    const previous = seen.get(name.toLowerCase());
    if (!previous || (!previous.evidence && evidence)) seen.set(name.toLowerCase(), { name, evidence });
  }
  return [...seen.values()];
}

function toHighlights(value) {
  return listOf(value)
    .map(item => clip(typeof item === 'string' ? item : grab(bag(item), 'text', 'point', 'detail', 'description', 'name'), limits.highlight))
    .filter(Boolean)
    .slice(0, 12);
}

/**
 * Model output varies in casing and nesting, so every field is read through an
 * alias list before the strict schema validates the canonical shape.
 */
export function normalizeExtraction(raw) {
  const source = bag(raw);
  const personal = bag(section(raw, 'personalInfo', 'personal', 'personalDetails', 'contact', 'candidate') ?? source);

  return {
    personalInfo: {
      fullName: clip(grab(personal, 'fullName', 'name', 'candidateName', 'applicantName'), limits.fullName),
      email: clip(grab(personal, 'email', 'emailAddress'), limits.email),
      phone: clip(grab(personal, 'phone', 'mobile', 'telephone', 'contactNumber', 'whatsapp'), limits.phone),
      location: clip(grab(personal, 'location', 'city', 'address', 'state'), limits.location),
      headline: clip(grab(personal, 'headline', 'title', 'objective', 'summary', 'profile'), limits.headline)
    },
    education: toEntries(section(raw, 'education', 'educationHistory', 'academics', 'educationalBackground'), entry => ({
      institution: clip(grab(entry, 'institution', 'school', 'university', 'college', 'institute', 'name'), limits.institution),
      qualification: clip(grab(entry, 'qualification', 'award', 'certificate', 'level', 'name', 'title'), limits.qualification),
      fieldOfStudy: clip(grab(entry, 'fieldOfStudy', 'field', 'major', 'specialisation', 'specialization', 'course'), limits.fieldOfStudy),
      startYear: yearValue(grab(entry, 'startYear', 'start', 'yearStarted', 'from', 'enrolled')),
      endYear: yearValue(grab(entry, 'endYear', 'end', 'yearCompleted', 'to', 'graduation', 'graduationYear')),
      detail: clip(grab(entry, 'detail', 'details', 'grade', 'result', 'summary', 'description'), limits.detail)
    }), maxItems.education),
    experience: toEntries(section(raw, 'experience', 'workExperience', 'employment', 'employmentHistory', 'work'), entry => ({
      organisation: clip(grab(entry, 'organisation', 'organization', 'company', 'employer', 'name'), limits.organisation),
      role: clip(grab(entry, 'role', 'title', 'position', 'jobTitle'), limits.role),
      location: clip(grab(entry, 'location', 'city', 'place'), limits.location),
      period: clip(grab(entry, 'period', 'duration', 'dates', 'tenure', 'from'), limits.period),
      startYear: yearValue(grab(entry, 'startYear', 'start', 'from', 'startDate')),
      endYear: yearValue(grab(entry, 'endYear', 'end', 'to', 'endDate', 'until')),
      highlights: toHighlights(grab(entry, 'highlights', 'bullets', 'points', 'achievements', 'responsibilities', 'description', 'summary', 'details'))
    }), maxItems.experience),
    technicalSkills: toSkills(section(raw, 'technicalSkills', 'skills', 'hardSkills', 'technologySkills', 'tools'), maxItems.technicalSkills),
    softSkills: toSkills(section(raw, 'softSkills', 'interpersonalSkills', 'strengths'), maxItems.softSkills),
    projects: toEntries(section(raw, 'projects', 'personalProjects', 'portfolio'), entry => ({
      name: clip(grab(entry, 'name', 'title', 'project', 'projectName', 'description', 'summary'), limits.projectName),
      description: clip(listOf(grab(entry, 'description', 'summary', 'detail', 'details', 'outcomes', 'highlights'))
        .map(item => typeof item === 'string' ? item : grab(bag(item), 'text', 'name', 'detail'))
        .filter(Boolean).join(' '), limits.projectDescription),
      link: clip(grab(entry, 'link', 'url', 'repository'), limits.link),
      period: clip(grab(entry, 'period', 'year', 'date', 'duration'), limits.period)
    }), maxItems.projects, 'name'),
    certifications: toEntries(section(raw, 'certifications', 'certificates', 'licences', 'licenses', 'awards'), entry => ({
      name: clip(grab(entry, 'name', 'title', 'certification', 'certificate', 'award'), limits.certificationName),
      issuer: clip(grab(entry, 'issuer', 'provider', 'authority', 'organisation', 'organization', 'institute', 'awardedBy'), limits.issuer),
      year: yearValue(grab(entry, 'year', 'issuedYear', 'date', 'issued'))
    }), maxItems.certifications, 'name'),
    languages: toEntries(section(raw, 'languages', 'languageSkills'), entry => ({
      name: clip(grab(entry, 'name', 'language'), limits.languageName),
      proficiency: clip(grab(entry, 'proficiency', 'level', 'cef', 'skill'), limits.proficiency)
    }), maxItems.languages, 'name')
  };
}

export function isEmptyResume(resume) {
  const personal = Object.values(resume.personalInfo).some(Boolean);
  const sections = ['education', 'experience', 'technicalSkills', 'softSkills', 'projects', 'certifications', 'languages'];
  return !personal && !sections.some(sectionName => resume[sectionName].length);
}
