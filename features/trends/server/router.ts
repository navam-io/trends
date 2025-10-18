import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '@/server/trpc';
import { TrendCategorySchema, WebSearchCitation } from '../types/trend';
import { generateDynamicTrends, getDynamicTrendById } from './trend-generator';
import { getTrends, getTrendById } from '../services/trend-service';
import { events, EVENTS } from '@/lib/events';
import { streamingGenerator, TrendBatch, BatchProgress } from './batch-generator';
import { trendCache } from '../services/trend-cache';
import { observable } from '@trpc/server/observable';

/**
 * Extract web search citations from OpenAI Responses API response
 */
function extractWebSearchCitations(response: any): WebSearchCitation[] {
  const citations: WebSearchCitation[] = [];
  
  try {
    // Check if response has output items with annotations
    if (response.output && Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === 'message' && item.content && Array.isArray(item.content)) {
          for (const content of item.content) {
            if (content.type === 'output_text' && content.annotations && Array.isArray(content.annotations)) {
              for (const annotation of content.annotations) {
                if (annotation.type === 'url_citation') {
                  citations.push({
                    url: annotation.url,
                    title: annotation.title || 'Web Search Result',
                    start_index: annotation.start_index,
                    end_index: annotation.end_index,
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to extract web search citations:', error);
  }
  
  return citations;
}

export const trendsRouter = router({
  // Instant trends - returns cached data immediately (0ms perceived load)
  instant: publicProcedure
    .input(
      z.object({
        category: TrendCategorySchema.optional(),
        limit: z.number().min(5).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const { category, limit } = input;
      
      // Try to get instant cached trends
      const cachedTrends = trendCache.getInstantTrends(category, limit);
      
      if (cachedTrends && cachedTrends.length > 0) {
        // Return cached trends immediately
        return {
          trends: cachedTrends,
          source: 'cache',
          cached: true,
          shouldRefresh: trendCache.shouldRefresh(category)
        };
      }
      
      // No cache available - client should use streaming endpoint
      return {
        trends: [],
        source: 'none',
        cached: false,
        shouldRefresh: true
      };
    }),

  // Streaming trends generation with progress updates
  streamGenerate: publicProcedure
    .input(
      z.object({
        category: TrendCategorySchema.optional(),
        limit: z.number().min(5).max(50).default(20),
        companyProfile: z.object({
          industry: z.string(),
          market: z.string().optional(),
          businessSize: z.string().optional(),
        }).optional(),
      })
    )
    .subscription(({ input }) => {
      return observable<{ 
        type: 'batch' | 'progress' | 'complete' | 'error'; 
        data: TrendBatch | BatchProgress | { totalTrends: number } | { error: string }; 
      }>((emit) => {
        const { limit, companyProfile } = input;
        
        // Start streaming generation
        (async () => {
          try {
            const generator = streamingGenerator.generateTrendBatches(
              limit,
              companyProfile,
              (progress) => {
                // Emit progress updates
                emit.next({
                  type: 'progress',
                  data: progress
                });
              }
            );
            
            const allTrends: any[] = [];
            
            // Process each batch as it arrives
            for await (const batch of generator) {
              // Emit batch immediately
              emit.next({
                type: 'batch',
                data: batch
              });
              
              // Collect trends for caching
              if (!batch.error) {
                allTrends.push(...batch.trends);
              }
            }
            
            // Cache all generated trends
            if (allTrends.length > 0) {
              trendCache.cacheTrends(allTrends, input.category);
            }
            
            // Signal completion
            emit.next({
              type: 'complete',
              data: { totalTrends: allTrends.length }
            });
            
            emit.complete();
            
          } catch (error) {
            console.error('Streaming generation failed:', error);
            emit.next({
              type: 'error',
              data: { error: error instanceof Error ? error.message : 'Generation failed' }
            });
            emit.error(error);
          }
        })();
      });
    }),

  list: publicProcedure
    .input(
      z.object({
        // Remove category parameter - always return mixed dataset for client-side filtering
        limit: z.number().min(1).max(100).default(20),
        // Optional refresh parameter to force fresh generation
        refresh: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        // Use the caching service for trends - it will cache in memory and localStorage
        // If refresh is requested, we bypass cache and generate fresh
        if (input.refresh) {
          const { clearTrendsCache } = await import('../services/trend-service');
          clearTrendsCache();
        }
        
        // Get trends through the caching service
        const trends = await getTrends(undefined, input.limit);
        
        // For client-side caching, we'll include cache metadata
        return trends;
      } catch (error) {
        console.error('Failed to fetch trends:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trends',
        });
      }
    }),

  getById: publicProcedure
    .input(
      z.object({
        trendId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        // Use the caching service first
        let trend = await getTrendById(input.trendId);
        
        // If not found in cache, try generating fresh trends and search again
        if (!trend) {
          try {
            // Generate fresh trends to ensure we have the latest set
            const freshTrends = await generateDynamicTrends(undefined, 20);
            
            // Update cache with fresh trends
            const { updateTrendsCache } = await import('../services/trend-service');
            updateTrendsCache(freshTrends);
            
            // Try finding the trend again
            trend = freshTrends.find(t => t.id === input.trendId) || null;
          } catch (generationError) {
            console.warn('Failed to generate fresh trends for trend lookup:', generationError);
          }
        }
        
        if (!trend) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Trend not found',
          });
        }

        return trend;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch trend',
        });
      }
    }),


  export: publicProcedure
    .input(
      z.object({
        format: z.enum(['pdf', 'slack']),
        trendIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // For MVP, just return success
        events.emitEvent(EVENTS.TREND_EXPORTED, {
          format: input.format,
          trendIds: input.trendIds,
        });

        return {
          success: true,
          message: `Exported ${input.trendIds.length} trends to ${input.format}`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export trends',
        });
      }
    }),

  regenerateForProfile: publicProcedure
    .input(
      z.object({
        personalizationProfile: z.object({
          industry: z.string(),
          market: z.string(),
          customer: z.string(),
          businessSize: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const profile = input.personalizationProfile;
        
        // Generate personalized trends based on personalization profile
        const trends = await generateDynamicTrends(
          undefined, // No category filter - generate mixed trends
          20,
          {
            industry: profile.industry,
            market: profile.market,
            customer: profile.customer,
            businessSize: profile.businessSize,
          }
        );

        // Update cache with new personalized trends
        const { updateTrendsCache } = await import('../services/trend-service');
        updateTrendsCache(trends);

        // Emit event for regeneration
        events.emitEvent('trend.regenerated', {
          personalizationProfile: profile,
          trendsCount: trends.length,
        });

        return {
          success: true,
          message: `Generated ${trends.length} personalized trends`,
          trends,
        };
      } catch (error) {
        console.error('Failed to regenerate trends for profile:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to regenerate trends',
        });
      }
    }),

  testGeneration: publicProcedure
    .input(
      z.object({
        settings: z.object({
          userPrompt: z.object({
            trendFocus: z.string(),
            industryContext: z.string(),
            timeframeContext: z.string(),
            sourcePreferences: z.string(),
          }),
          systemPrompt: z.object({
            responseFormat: z.string(),
            validationRules: z.string(),
            categoryRequirements: z.string(),
            urlValidationRules: z.string(),
          }),
          modelSettings: z.object({
            temperature: z.number(),
            maxTokens: z.number(),
          }),
          urlVerification: z.object({
            enabled: z.boolean(),
            timeout: z.number(),
            fallbackToGenerated: z.boolean(),
          }),
        }),
        trendCount: z.number().min(5).max(20),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { anthropic } = await import('@/lib/ai/anthropic');
        const { buildTrendGenerationPrompt } = await import('../utils/settings-loader');
        const { serverConfig } = await import('@/lib/config/server');
        
        // Build prompts using the provided settings
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const systemMessage = serverConfig.ai.systemPrompt;
        
        const trendsPerCategory = Math.ceil(input.trendCount / 4); // Distribute evenly across 4 categories
        
        const userPrompt = buildTrendGenerationPrompt(
          input.settings,
          currentMonth,
          input.trendCount,
          trendsPerCategory,
          undefined // no company profile for test
        );

        // Call Anthropic using messages API with web search
        const { getAIModel } = await import('@/lib/config/reader');
        const response = await anthropic.messages.create({
          model: getAIModel(),
          max_tokens: 4000,
          temperature: 0.7,
          system: `${systemMessage}\n\nYou have access to web search. Use it to find current AI and technology trends. You must always return valid JSON as your response.`,
          messages: [
            {
              role: 'user',
              content: `${userPrompt}\n\nIMPORTANT: Search the web for current AI and technology trends. Generate realistic, current trends based on your web search findings and return as valid JSON.`
            }
          ],
          tools: [{
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 5
            // Unrestricted domains for broader access to current tech news
          }]
        });

        // Extract text content from Claude's response (may have multiple content blocks)
        let responseText = '';
        for (const content of response.content) {
          if (content.type === 'text') {
            responseText += content.text;
          }
        }
        
        if (!responseText) {
          throw new Error('No text response from Anthropic API');
        }
        
        // Extract JSON from the response text
        const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        const jsonContent = jsonMatch ? jsonMatch[0] : responseText;

        // Parse the response - handle both array and object with array property
        let trendsData: any[];
        const parsed = JSON.parse(jsonContent);
        
        if (Array.isArray(parsed)) {
          trendsData = parsed;
        } else if (parsed.trends && Array.isArray(parsed.trends)) {
          trendsData = parsed.trends;
        } else {
          throw new Error('Invalid response format from AI');
        }

        // Extract web search citations
        const citations = extractWebSearchCitations(response);
        
        // Transform to proper trend objects (simplified version for testing)
        const trends = trendsData.slice(0, input.trendCount).map((trend, index) => ({
          id: `test_trend_${Date.now()}_${index}`,
          title: trend.title || `AI Trend ${index + 1}`,
          summary: trend.summary || 'Emerging AI trend with significant market impact.',
          category: trend.category || 'consumer',
          impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
          source: trend.source || 'Industry Analysis',
          source_url: trend.source_url || undefined,
          web_search_citations: citations,
          created_at: new Date(currentDate.getTime() - (index * 24 * 60 * 60 * 1000)),
          updated_at: new Date(),
        }));

        return {
          success: true,
          trends,
          message: `Generated ${trends.length} test trends successfully`,
        };
      } catch (error) {
        console.error('Test generation failed:', error);
        
        let errorMessage = 'Failed to generate test trends';
        
        if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorMessage = 'Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in your environment variables.';
          } else if (error.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
          } else if (error.message.includes('JSON')) {
            errorMessage = 'AI returned invalid JSON. Try adjusting your prompt settings and try again.';
          }
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
        });
      }
    }),
});