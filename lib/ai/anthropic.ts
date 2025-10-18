import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from '@/lib/utils/retry';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Get AI model with safe fallback for client environments
 */
function getSafeAIModel(): string {
  // Try to get model from config, fallback to default
  try {
    if (typeof window === 'undefined') {
      // Server-side: import dynamically to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAIModel } = require('@/lib/config/reader');
      return getAIModel();
    } else {
      // Client-side: import dynamically
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CONFIG_CONSTANTS } = require('@/lib/config/constants');
      return CONFIG_CONSTANTS.ai.defaultModel;
    }
  } catch {
    // Ultimate fallback
    return 'claude-sonnet-4-20250514';
  }
}

export async function generateCompletion(prompt: string): Promise<string> {
  try {
    return await withRetry(async () => {
      const response = await anthropic.messages.create({
        model: getSafeAIModel(),
        max_tokens: 3000,
        temperature: 0.7,
        system: 'You are an AI business consultant helping enterprises identify and prioritize business needs. Always respond with valid JSON only.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from Claude's response
      const content = response.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('No text response from AI');
      }

      return content.text;
    }, {
      onRetry: (attempt, error) => {
        console.log(`Retrying Anthropic request (attempt ${attempt}):`, error.message);
      }
    });
  } catch (error) {
    console.error('Error generating AI completion:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key') || error.message.includes('api_key')) {
        throw new Error('Anthropic API key is not configured. Please contact support.');
      } else if (error.message.includes('rate limit') || error.message.includes('rate_limit')) {
        throw new Error('You\'ve reached the rate limit. Please try again in a few minutes.');
      } else if (error.message.includes('network')) {
        throw new Error('Unable to connect to the AI service. Please check your internet connection.');
      }
    }
    
    throw new Error('Failed to generate content. Please try again or contact support if the issue persists.');
  }
}