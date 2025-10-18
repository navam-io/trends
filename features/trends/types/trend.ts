import { z } from 'zod';

export const TrendCategorySchema = z.enum(['consumer', 'competition', 'economy', 'regulation']);
export type TrendCategory = z.infer<typeof TrendCategorySchema>;

export const WebSearchCitationSchema = z.object({
  url: z.string(),
  title: z.string(),
  start_index: z.number().optional(),
  end_index: z.number().optional(),
});

export const TrendSchema = z.object({
  id: z.string(),
  category: TrendCategorySchema,
  title: z.string(),
  summary: z.string(),
  impact_score: z.number().min(1).max(10),
  source: z.string(),
  source_url: z.string().optional(),
  source_verified: z.boolean().optional(), // Whether the source URL was verified as real
  web_search_citations: z.array(WebSearchCitationSchema).optional(), // Citations from web search
  created_at: z.string().or(z.date()),
  updated_at: z.string().or(z.date()),
});

export type Trend = z.infer<typeof TrendSchema>;
export type WebSearchCitation = z.infer<typeof WebSearchCitationSchema>;

export const TrendAnalysisSchema = z.object({
  businessImplications: z.string(),
  technicalRequirements: z.string(),
  implementationTimeline: z.string(),
  riskFactors: z.array(z.string()),
  impactScore: z.number().min(1).max(10),
});

export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;