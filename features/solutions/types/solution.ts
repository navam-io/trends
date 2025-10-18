import { z } from 'zod'

export const SolutionApproachSchema = z.enum(['build', 'buy', 'partner'])
export type SolutionApproach = z.infer<typeof SolutionApproachSchema>

export const SolutionCategorySchema = z.enum([
  'automation',
  'analytics',
  'customer_experience',
  'infrastructure',
  'security',
  'data_management',
  'collaboration',
  'process_optimization'
])
export type SolutionCategory = z.infer<typeof SolutionCategorySchema>

export const SolutionSchema = z.object({
  id: z.string(),
  needId: z.string(),
  approach: SolutionApproachSchema,
  title: z.string(),
  description: z.string(),
  category: SolutionCategorySchema,
  vendor: z.string().optional(),
  estimatedCost: z.object({
    initial: z.number(),
    monthly: z.number(),
    annual: z.number()
  }),
  implementationTime: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(['days', 'weeks', 'months'])
  }),
  roi: z.object({
    breakEvenMonths: z.number(),
    threeYearReturn: z.number(),
    confidenceScore: z.number()
  }),
  risks: z.array(z.string()),
  benefits: z.array(z.string()),
  requirements: z.array(z.string()),
  alternatives: z.array(z.string()),
  matchScore: z.number(),
  createdAt: z.date().default(() => new Date())
})

export type Solution = z.infer<typeof SolutionSchema>

export const GenerateSolutionsInputSchema = z.object({
  needId: z.string(),
  needTitle: z.string(),
  needDescription: z.string(),
  companyContext: z.object({
    name: z.string(),
    industry: z.string(),
    size: z.string(),
    maturity: z.string(),
    budget: z.string().optional(),
    challenges: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    trendContext: z.string().optional()
  }),
  preferences: z.object({
    preferredApproach: SolutionApproachSchema.optional(),
    maxBudget: z.number().optional(),
    maxTimeMonths: z.number().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional()
  }).optional()
})

export type GenerateSolutionsInput = z.infer<typeof GenerateSolutionsInputSchema>

export const ComparisonCriteriaSchema = z.enum([
  'cost',
  'time',
  'roi',
  'risk',
  'complexity',
  'scalability',
  'maintenance'
])
export type ComparisonCriteria = z.infer<typeof ComparisonCriteriaSchema>

export const SolutionComparisonSchema = z.object({
  criteria: ComparisonCriteriaSchema,
  weights: z.record(ComparisonCriteriaSchema, z.number()),
  solutions: z.array(SolutionSchema),
  winner: z.string().optional()
})

export type SolutionComparison = z.infer<typeof SolutionComparisonSchema>