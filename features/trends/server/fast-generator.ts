/**
 * Fast Trend Generator
 * Optimized for speed while maintaining quality
 * Generates real AI trends in under 3 seconds per batch
 */

import { anthropic } from '@/lib/ai/anthropic';
import { Trend, TrendCategory } from '../types/trend';
import { getAIModelFromSettings } from '../utils/settings-loader';

interface CompanyProfile {
  industry: string;
  market?: string;
  businessSize?: string;
}

/**
 * Generate a single batch of real trends FAST (target: <3 seconds)
 * Optimizations:
 * - Minimal web searches (1-2 vs 5)
 * - No URL verification 
 * - Focused prompts
 * - Smaller batches for faster generation
 */
export async function generateFastTrendBatch(
  category: TrendCategory,
  count: number = 5,
  companyProfile?: CompanyProfile
): Promise<Trend[]> {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Optimized focused prompt for speed
  const focusedPrompt = buildFastPrompt(category, count, currentMonth, companyProfile);

  try {
    const { serverConfig } = await import('@/lib/config/server');
    
    // Optimized API call for speed
    const response = await anthropic.messages.create({
      model: getAIModelFromSettings(),
      max_tokens: 2000,        // Reduced for faster generation
      temperature: 0.8,        // Slightly higher for more creative, varied results
      system: `${serverConfig.ai.systemPrompt}\n\nYou are an expert AI trend analyst. Generate real, current trends quickly and accurately. Always return valid JSON.`,
      messages: [
        {
          role: 'user',
          content: focusedPrompt
        }
      ],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 2,  // Reduced from 5 to 2 for speed
        }
      ]
    });

    // Fast response processing
    let responseText = '';
    for (const content of response.content) {
      if (content.type === 'text') {
        responseText += content.text;
        break; // Take first text response for speed
      }
    }
    
    if (!responseText) {
      throw new Error('No response from AI');
    }
    
    // Fast JSON extraction
    const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : responseText;

    let trendsData: any[];
    const parsed = JSON.parse(jsonContent);
    
    trendsData = Array.isArray(parsed) ? parsed : parsed.trends || [parsed];

    // Fast transformation - no URL verification
    const trends: Trend[] = trendsData.slice(0, count).map((trend, index) => ({
      id: `fast_${category}_${Date.now()}_${index}`,
      title: trend.title || `${category} AI Trend ${index + 1}`,
      summary: trend.summary || 'Emerging AI trend with significant impact.',
      category: category,
      impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
      source: trend.source || 'Industry Analysis',
      source_url: trend.source_url || '', // No verification - accept as-is
      source_verified: false, // Mark as unverified for honesty
      web_search_citations: [],
      created_at: new Date(currentDate.getTime() - (index * 60 * 60 * 1000)), // Stagger by hours
      updated_at: new Date(),
    }));

    return trends;
  } catch (error) {
    console.error(`Fast generation failed for ${category}:`, error);
    throw new Error(`Failed to generate ${category} trends: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate all categories in parallel for maximum speed
 */
export async function generateAllCategoriesFast(
  totalTrends: number = 20,
  companyProfile?: CompanyProfile
): Promise<Trend[]> {
  const categories: TrendCategory[] = ['consumer', 'competition', 'economy', 'regulation'];
  const trendsPerCategory = Math.ceil(totalTrends / 4);
  
  console.log(`🚀 Starting fast parallel generation: ${trendsPerCategory} trends per category`);
  
  try {
    // Generate all categories in parallel for maximum speed
    const batchPromises = categories.map(category => 
      generateFastTrendBatch(category, trendsPerCategory, companyProfile)
        .catch(error => {
          console.error(`Failed to generate ${category} batch:`, error);
          return []; // Return empty array instead of failing entire operation
        })
    );
    
    const batches = await Promise.all(batchPromises);
    const allTrends = batches.flat();
    
    console.log(`✅ Fast generation complete: ${allTrends.length} trends generated`);
    return allTrends.slice(0, totalTrends); // Ensure we don't exceed requested count
  } catch (error) {
    console.error('Fast parallel generation failed:', error);
    throw error;
  }
}

/**
 * Build optimized prompt for fast generation
 */
function buildFastPrompt(
  category: TrendCategory,
  count: number,
  currentMonth: string,
  companyProfile?: CompanyProfile
): string {
  const categoryFocus = getCategoryFocus(category);
  const industryContext = companyProfile ? ` Focus especially on ${companyProfile.industry} industry implications.` : '';
  
  return `Generate ${count} real, current ${category} trends for ${currentMonth}.

${categoryFocus}${industryContext}

Search the web for current developments and return exactly ${count} trends as a JSON array:

[
  {
    "title": "Specific trend title",
    "summary": "2-sentence summary with concrete details",
    "impact_score": 1-10,
    "source": "Publication name",
    "source_url": "Real article URL",
    "category": "${category}"
  }
]

Focus on speed - provide real, current trends with web search results. Return ONLY the JSON array.`;
}

/**
 * Get category-specific focus for faster, targeted generation
 */
function getCategoryFocus(category: TrendCategory): string {
  switch (category) {
    case 'consumer':
      return 'Consumer technology trends: new products, user behavior shifts, mobile/web innovations.';
    case 'competition':
      return 'Competitive landscape trends: company moves, acquisitions, strategic partnerships, market battles.';
    case 'economy':
      return 'Economic trends affecting technology: funding, valuations, market conditions, investment patterns.';
    case 'regulation':
      return 'Regulatory and policy trends: new laws, compliance requirements, government tech initiatives.';
  }
}