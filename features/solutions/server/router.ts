import { z } from 'zod'
import { router, publicProcedure } from '@/server/trpc'
import { 
  SolutionSchema, 
  GenerateSolutionsInputSchema,
  SolutionApproachSchema,
  ComparisonCriteriaSchema
} from '../types/solution'
import { generateSolutions, compareSolutions, calculateROI } from './generator'

export const solutionsRouter = router({
  generateSolutions: publicProcedure
    .input(GenerateSolutionsInputSchema)
    .mutation(async ({ input }) => {
      try {
        const solutions = await generateSolutions(input)
        return {
          success: true,
          data: solutions
        }
      } catch (error) {
        console.error('Failed to generate solutions:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate solutions'
        }
      }
    }),

  getSolutionsByNeed: publicProcedure
    .input(z.object({ needId: z.string() }))
    .query(async ({ input }) => {
      // Return empty array to trigger actual generation
      return {
        success: true,
        data: []
      }
    }),

  compareSolutions: publicProcedure
    .input(z.object({
      solutionIds: z.array(z.string()),
      criteria: z.array(ComparisonCriteriaSchema)
    }))
    .mutation(async ({ input }) => {
      try {
        const comparison = await compareSolutions(input.solutionIds, input.criteria)
        return {
          success: true,
          data: comparison
        }
      } catch (error) {
        return {
          success: false,
          error: 'Failed to compare solutions'
        }
      }
    }),

  calculateROI: publicProcedure
    .input(z.object({
      solutionId: z.string(),
      customInputs: z.object({
        expectedRevenue: z.number().optional(),
        costSavings: z.number().optional(),
        productivityGains: z.number().optional()
      }).optional()
    }))
    .mutation(async ({ input }) => {
      try {
        const roiDetails = await calculateROI(input.solutionId, input.customInputs)
        return {
          success: true,
          data: roiDetails
        }
      } catch (error) {
        return {
          success: false,
          error: 'Failed to calculate ROI'
        }
      }
    }),

  saveSolution: publicProcedure
    .input(z.object({
      solutionId: z.string(),
      saved: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: input.saved ? 'Solution saved' : 'Solution removed from saved'
      }
    })
})