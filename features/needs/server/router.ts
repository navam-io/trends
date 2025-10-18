import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '@/server/trpc';
import { 
  CompanyContextSchema, 
  GenerateNeedsInputSchema,
  NeedSchema,
  NeedPrioritySchema,
  WizardStepSchema 
} from '../types/need';
import { generateNeedsFromTrend } from './generator';
import { events, EVENTS } from '@/lib/events';

export const needsRouter = router({
  // Generate needs from a trend and company context
  generateFromTrend: publicProcedure
    .input(GenerateNeedsInputSchema)
    .mutation(async ({ input }) => {
      try {
        const needs = await generateNeedsFromTrend(
          input.trendId,
          input.companyContext,
          input.maxNeeds
        );

        // Emit event for other features to consume
        events.emitEvent(EVENTS.NEEDS_GENERATED, {
          trendId: input.trendId,
          companyId: input.companyContext.id,
          needIds: needs.map(n => n.id),
          count: needs.length,
        });

        return needs;
      } catch (error) {
        console.error('Failed to generate needs:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate needs from trend',
        });
      }
    }),

  // Save company context
  saveCompanyContext: publicProcedure
    .input(CompanyContextSchema)
    .mutation(async ({ input }) => {
      try {
        // For MVP, just validate and return
        // In production, save to database
        const companyId = input.id || `company_${Date.now()}`;
        
        events.emitEvent(EVENTS.COMPANY_PROFILE_SAVED, {
          companyId,
          industry: input.industry,
          size: input.size,
        });

        return {
          ...input,
          id: companyId,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save company context',
        });
      }
    }),

  // Prioritize needs using impact/effort scoring
  prioritizeNeeds: publicProcedure
    .input(z.object({
      needIds: z.array(z.string()).min(1),
      prioritizationCriteria: z.object({
        impactWeight: z.number().min(0).max(1).default(0.6),
        effortWeight: z.number().min(0).max(1).default(0.4),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // For MVP, return mock prioritization
        // In production, would calculate based on actual needs data
        
        events.emitEvent(EVENTS.NEEDS_PRIORITIZED, {
          needIds: input.needIds,
          criteria: input.prioritizationCriteria,
        });

        return {
          success: true,
          prioritizedIds: input.needIds, // Return in same order for now
          matrix: {
            high_impact_low_effort: [],
            high_impact_high_effort: [],
            low_impact_low_effort: [],
            low_impact_high_effort: [],
          }
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to prioritize needs',
        });
      }
    }),

  // Get needs for a company
  getByCompany: publicProcedure
    .input(z.object({
      companyId: z.string(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      try {
        // For MVP, return empty array
        // In production, fetch from database
        return [];
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch company needs',
        });
      }
    }),

  // Update need priority
  updatePriority: publicProcedure
    .input(z.object({
      needId: z.string(),
      priority: NeedPrioritySchema,
    }))
    .mutation(async ({ input }) => {
      try {
        events.emitEvent(EVENTS.NEED_UPDATED, {
          needId: input.needId,
          field: 'priority',
          value: input.priority,
        });

        return {
          success: true,
          needId: input.needId,
          priority: input.priority,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update need priority',
        });
      }
    }),

  // Validate wizard step completion
  validateWizardStep: publicProcedure
    .input(z.object({
      step: WizardStepSchema,
      data: z.any(), // Different data for each step
    }))
    .mutation(async ({ input }) => {
      try {
        // Validate step-specific data
        let isValid = false;
        const errors: string[] = [];

        switch (input.step) {
          case 'company_info':
            try {
              CompanyContextSchema.pick({ 
                name: true, 
                industry: true, 
                size: true, 
                techMaturity: true 
              }).parse(input.data);
              isValid = true;
            } catch (error) {
              errors.push('Please complete all company information fields');
            }
            break;
          
          case 'challenges':
            if (Array.isArray(input.data.currentChallenges) && input.data.currentChallenges.length > 0) {
              isValid = true;
            } else {
              errors.push('Please select at least one current challenge');
            }
            break;
            
          case 'goals':
            if (Array.isArray(input.data.primaryGoals) && input.data.primaryGoals.length > 0) {
              isValid = true;
            } else {
              errors.push('Please select at least one primary goal');
            }
            break;
            
          default:
            isValid = true;
        }

        return {
          isValid,
          errors,
          nextStep: isValid ? getNextStep(input.step) : null,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate wizard step',
        });
      }
    }),
});

// Helper function to determine next wizard step
function getNextStep(currentStep: z.infer<typeof WizardStepSchema>): z.infer<typeof WizardStepSchema> | null {
  const stepOrder: z.infer<typeof WizardStepSchema>[] = [
    'company_info',
    'challenges', 
    'goals',
    'review',
    'needs_generation',
    'prioritization'
  ];
  
  const currentIndex = stepOrder.indexOf(currentStep);
  return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null;
}