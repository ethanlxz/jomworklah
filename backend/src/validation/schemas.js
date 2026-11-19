import { z } from 'zod';

export const profilePatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  headline: z.string().max(200).optional(),
  qualification: z.string().max(120).optional(),
  fieldOfStudy: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  experience: z.string().max(2000).optional(),
  projects: z.string().max(2000).optional(),
  budget: z.enum(['RM0–RM500', 'RM501–RM1,500', 'Flexible']).optional(),
  weeklyHours: z.number().int().min(1).max(60).optional(),
  learningMode: z.enum(['Online', 'In person', 'Hybrid']).optional()
});

export const skillsBulkSchema = z.object({
  scores: z.record(z.string(), z.number().int().min(0).max(5))
});

export const skillPatchSchema = z.object({
  evidenceLevel: z.number().int().min(0).max(5)
});

export const interestsSchema = z.object({
  interests: z.array(z.string().min(1).max(60)).max(20)
});

export const targetSchema = z.object({
  jobId: z.string().min(1).max(120)
});

export const courseSaveSchema = z.object({
  courseId: z.string().min(1).max(120)
});

export const roadmapGenerateSchema = z.object({
  weeklyHours: z.number().int().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').nullable().optional().default(null)
});

export const taskPatchSchema = z.object({
  completed: z.boolean()
});

export const assessmentSchema = z.object({
  narrative: z.string().trim().min(1, 'Narrative is required').max(5000)
});

export const explainMatchSchema = z.object({
  jobId: z.string().min(1).max(120)
});

export const careersQuerySchema = z.object({
  query: z.string().max(100).optional().default(''),
  category: z.string().max(60).optional().default('All'),
  sort: z.enum(['match', 'title', 'name']).optional().default('match')
});

export const trainingQuerySchema = z.object({
  view: z.enum(['suggested', 'all']).optional().default('suggested'),
  skill: z.string().max(60).optional().default('All'),
  source: z.string().max(60).optional().default('All'),
  mode: z.enum(['All', 'Online', 'In person', 'Hybrid']).optional().default('All'),
  location: z.string().max(60).optional().default('All'),
  budget: z.enum(['All', 'within', 'verify']).optional().default('All'),
  sort: z.enum(['relevance', 'name']).optional().default('relevance')
});

export const personaSchema = z.object({
  personaKey: z.string().min(1).max(60)
});

export const paramsIdSchema = z.object({
  id: z.string().min(1).max(120)
});

export const paramsSkillSchema = z.object({
  skillId: z.string().min(1).max(120)
});

export const paramsCourseSchema = z.object({
  courseId: z.string().min(1).max(120)
});

export const paramsTaskSchema = z.object({
  taskId: z.string().min(1).max(120)
});
