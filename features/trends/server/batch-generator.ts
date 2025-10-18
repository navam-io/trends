/**
 * Streaming Batch Trend Generator
 * Generates trends in parallel batches for better perceived performance
 */

import { anthropic } from '@/lib/ai/anthropic';
import { Trend, TrendCategory, WebSearchCitation } from '../types/trend';
import { loadTrendSettings, getAIModelFromSettings } from '../utils/settings-loader';
import { TrendPromptSettings } from '../types/settings';

export interface TrendBatch {
  batchId: string;
  trends: Trend[];
  category?: TrendCategory;
  progress: number; // 0-1
  isComplete: boolean;
  error?: string;
}

export interface BatchProgress {
  totalBatches: number;
  completedBatches: number;
  progress: number; // 0-1
  estimatedTimeRemaining: number; // milliseconds
}

export interface CompanyProfile {
  industry: string;
  market?: string;
  customer?: string;
  businessSize?: string;
}

/**
 * Generate trends in parallel batches with progress updates
 */
export class StreamingTrendGenerator {
  private static readonly BATCH_SIZE = 5;
  private static readonly MAX_PARALLEL = 4;
  
  /**
   * Generate trends in streaming batches
   */
  async *generateTrendBatches(
    totalTrends: number = 20,
    companyProfile?: CompanyProfile,
    onProgress?: (progress: BatchProgress) => void
  ): AsyncGenerator<TrendBatch, void, unknown> {
    const categories: TrendCategory[] = ['consumer', 'competition', 'economy', 'regulation'];
    const trendsPerCategory = Math.ceil(totalTrends / categories.length);
    const totalBatches = categories.length;
    
    let completedBatches = 0;
    const startTime = Date.now();
    
    // Generate batches in parallel for better performance
    const batchPromises = categories.map(async (category, index) => {
      const batchId = `batch_${category}_${Date.now()}_${index}`;
      
      try {
        const trends = await this.generateCategoryBatch(
          category,
          trendsPerCategory,
          companyProfile
        );
        
        completedBatches++;
        
        // Calculate progress
        const progress = completedBatches / totalBatches;
        const elapsedTime = Date.now() - startTime;
        const estimatedTotalTime = progress > 0 ? elapsedTime / progress : elapsedTime * totalBatches;
        const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
        
        // Update progress
        if (onProgress) {
          onProgress({
            totalBatches,
            completedBatches,
            progress,
            estimatedTimeRemaining
          });
        }
        
        return {
          batchId,
          trends,
          category,
          progress,
          isComplete: true,
          error: undefined
        } as TrendBatch;
        
      } catch (error) {
        console.error(`Batch ${batchId} failed:`, error);
        return {
          batchId,
          trends: [],
          category,
          progress: completedBatches / totalBatches,
          isComplete: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        } as TrendBatch;
      }
    });
    
    // Yield batches as they complete (not in order, for speed)
    const results = await Promise.allSettled(batchPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        yield result.value;
      }
    }
  }
  
  /**
   * Generate a batch of trends for a specific category
   */
  private async generateCategoryBatch(
    category: TrendCategory,
    count: number,
    companyProfile?: CompanyProfile
  ): Promise<Trend[]> {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const settings = loadTrendSettings();
    
    // Build focused prompt for this category
    const prompt = this.buildCategoryPrompt(
      settings,
      category,
      count,
      currentMonth,
      companyProfile
    );
    
    try {
      // Import server config
      const { serverConfig } = await import('@/lib/config/server');
      
      // Use Anthropic with web search for real-time data
      const response = await anthropic.messages.create({
        model: getAIModelFromSettings(),
        max_tokens: 1500, // Optimized for speed
        temperature: 0.7,
        system: `AI trend analyst. Search web for current ${category} trends. Return valid JSON only.`,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 1, // Single search for maximum speed
          }
        ]
      });
      
      // Extract content and citations
      let responseText = '';
      const citations: WebSearchCitation[] = [];
      
      for (const content of response.content) {
        if (content.type === 'text') {
          responseText += content.text;
          
          // Extract citations
          if (content.citations) {
            for (const citation of content.citations) {
              if (citation.type === 'web_search_result_location') {
                citations.push({
                  url: citation.url,
                  title: citation.title || 'Web Search Result',
                  start_index: 0,
                  end_index: 0,
                });
              }
            }
          }
        }
      }
      
      if (!responseText) {
        throw new Error('No response from AI');
      }
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const jsonContent = jsonMatch ? jsonMatch[0] : responseText;
      
      let trendsData: any[];
      const parsed = JSON.parse(jsonContent);
      
      if (Array.isArray(parsed)) {
        trendsData = parsed;
      } else if (parsed.trends && Array.isArray(parsed.trends)) {
        trendsData = parsed.trends;
      } else {
        throw new Error('Invalid response format');
      }
      
      // Transform to Trend objects (no URL validation for speed)
      const trends: Trend[] = trendsData.slice(0, count).map((trend, index) => ({
        id: `trend_${category}_${Date.now()}_${index}`,
        title: trend.title || `${category} AI Trend ${index + 1}`,
        summary: trend.summary || 'Emerging AI trend with significant market impact.',
        category: category,
        impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
        source: trend.source || 'Industry Analysis',
        source_url: trend.source_url || '',
        source_verified: false, // Mark as unverified for speed
        web_search_citations: citations,
        created_at: new Date(currentDate.getTime() - (index * 60 * 1000)),
        updated_at: new Date(),
      }));
      
      return trends;
      
    } catch (error) {
      console.error(`Failed to generate ${category} trends:`, error);
      throw new Error(`Failed to generate ${category} trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Build fast, focused prompt
   */
  private buildCategoryPrompt(
    settings: TrendPromptSettings,
    category: TrendCategory,
    count: number,
    currentMonth: string,
    companyProfile?: CompanyProfile
  ): string {
    const focus = {
      consumer: "consumer AI/tech products",
      competition: "AI company strategies & acquisitions",
      economy: "AI market trends & investments", 
      regulation: "AI regulations & policies"
    };
    
    return `Search web for ${count} current ${focus[category]} trends in ${currentMonth}. Return JSON:

[{"title":"trend","summary":"brief description","category":"${category}","impact_score":7,"source":"source","source_url":"url"}]`;
  }
  
}

// Export singleton instance
export const streamingGenerator = new StreamingTrendGenerator();