/**
 * Shared configuration constants
 * These values should match what's in config.yml
 * Used for client-side access where serverConfig is not available
 */

export const CONFIG_CONSTANTS = {
  ai: {
    // Default system prompt for trend generation with web search
    // This should be kept in sync with config.yml
    systemPrompt: 'You are a market intelligence analyst with web search capabilities. Search for and analyze the latest AI and technology developments to generate current, factual trends. Use web search to verify all information and source URLs. Always return valid JSON with real sources.',
    
    // Default model settings - should match config.yml
    defaultModel: 'claude-sonnet-4-20250514',
    defaultTemperature: 0.7,
    defaultMaxTokens: 3000,
  },
  
  trends: {
    // Trend count settings
    minCount: 5,
    maxCount: 20,
    defaultCount: 20,
    
    // Categories
    categories: ['consumer', 'competition', 'economy', 'regulation'] as const,
  },
} as const;

// Type exports for TypeScript
export type TrendCategory = typeof CONFIG_CONSTANTS.trends.categories[number];