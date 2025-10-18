import { z } from 'zod';

// Company context for personalized need generation
export const CompanyContextSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Company name is required'),
  industry: z.enum([
    'technology',
    'finance',
    'retail',
    'healthcare',
    'manufacturing',
    'energy',
    'education',
    'media',
    'transportation',
    'real-estate'
  ]),
  market: z.enum([
    'us',
    'europe',
    'asia',
    'middle-east',
    'africa',
    'latin-america',
    'global'
  ]).optional(),
  customer: z.enum([
    'business',
    'consumer',
    'government'
  ]).optional(),
  size: z.enum(['startup', 'small-medium', 'large', 'government', 'non-profit']),
  techMaturity: z.enum(['low', 'medium', 'high']),
  currentChallenges: z.array(z.string()).min(1, 'Select at least one challenge'),
  primaryGoals: z.array(z.string()).min(1, 'Select at least one goal'),
});

export type CompanyContext = z.infer<typeof CompanyContextSchema>;

// Priority levels for needs
export const NeedPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type NeedPriority = z.infer<typeof NeedPrioritySchema>;

// Need categories
export const NeedCategorySchema = z.enum([
  'automation',
  'data_insights', 
  'customer_experience',
  'operational_efficiency',
  'competitive_advantage',
  'risk_management',
  'cost_reduction',
  'innovation'
]);
export type NeedCategory = z.infer<typeof NeedCategorySchema>;

// Main Need entity
export const NeedSchema = z.object({
  id: z.string(),
  trendId: z.string(), // Links to the trend that generated this need
  companyId: z.string(), // Links to company context
  title: z.string(),
  description: z.string(),
  category: NeedCategorySchema,
  priority: NeedPrioritySchema,
  impactScore: z.number().min(1).max(10), // Business impact
  effortScore: z.number().min(1).max(10), // Implementation effort
  urgencyScore: z.number().min(1).max(10), // Time sensitivity
  stakeholders: z.array(z.string()), // Affected teams/roles
  businessValue: z.string(), // AI-generated business value description
  risks: z.array(z.string()), // Potential risks if not addressed
  successMetrics: z.array(z.string()), // How to measure success
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

export type Need = z.infer<typeof NeedSchema>;

// AI generation input
export const GenerateNeedsInputSchema = z.object({
  trendId: z.string(),
  companyContext: CompanyContextSchema,
  maxNeeds: z.number().min(1).max(10).default(5),
});

export type GenerateNeedsInput = z.infer<typeof GenerateNeedsInputSchema>;

// Prioritization matrix data
export const NeedMatrixSchema = z.object({
  high_impact_low_effort: z.array(NeedSchema), // Quick wins
  high_impact_high_effort: z.array(NeedSchema), // Major projects  
  low_impact_low_effort: z.array(NeedSchema), // Fill-ins
  low_impact_high_effort: z.array(NeedSchema), // Avoid
});

export type NeedMatrix = z.infer<typeof NeedMatrixSchema>;

// Wizard step tracking
export const WizardStepSchema = z.enum([
  'company_info',
  'challenges',
  'goals', 
  'review',
  'needs_generation',
  'prioritization'
]);

export type WizardStep = z.infer<typeof WizardStepSchema>;

// Wizard state
export const WizardStateSchema = z.object({
  currentStep: WizardStepSchema,
  completedSteps: z.array(WizardStepSchema),
  companyContext: CompanyContextSchema.partial(),
  selectedTrendId: z.string().optional(),
  generatedNeeds: z.array(NeedSchema).default([]),
  isGenerating: z.boolean().default(false),
});

export type WizardState = z.infer<typeof WizardStateSchema>;