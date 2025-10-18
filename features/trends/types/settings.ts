/**
 * Settings types for trend generation configuration
 */

export interface TrendPromptSettings {
  // User-editable sections
  userPrompt: {
    trendFocus: string;
    industryContext: string;
    timeframeContext: string;
    sourcePreferences: string;
  };
  
  // System-controlled sections (not user-editable)
  systemPrompt: {
    responseFormat: string;
    validationRules: string;
    categoryRequirements: string;
    urlValidationRules: string;
  };
  
  // URL verification settings
  urlVerification: {
    enabled: boolean;
    timeout: number; // milliseconds
    fallbackToGenerated: boolean;
  };
  
  // Model configuration
  modelSettings: {
    temperature: number;
    maxTokens: number;
  };
}

export interface SettingsState {
  prompts: TrendPromptSettings;
  lastUpdated: string;
  version: number;
}

// Default settings
export const DEFAULT_TREND_SETTINGS: TrendPromptSettings = {
  userPrompt: {
    trendFocus: "Focus on emerging AI and technology trends that have significant enterprise impact. Prioritize breakthrough innovations, major company announcements, regulatory changes, and market shifts.",
    industryContext: "Target trends relevant to enterprise technology adoption, digital transformation, and competitive advantage. Consider implications for various business sizes and industries.",
    timeframeContext: "Generate current, up-to-date trends that are happening NOW or announced recently. Include specific dates, statistics, and concrete developments from major tech publications.",
    sourcePreferences: "Prefer authoritative tech publications like TechCrunch, Reuters, Bloomberg, The Verge, Wired, and VentureBeat. Ensure all source URLs link to actual, specific articles about the trends."
  },
  systemPrompt: {
    responseFormat: "Return as JSON array with required fields: title, summary, impact_score, source, source_url, category",
    validationRules: "Validate all URLs are real and accessible. Impact scores must be 1-10. Categories must be: consumer, competition, economy, regulation",
    categoryRequirements: "Ensure balanced distribution across all 4 categories with specified number of trends per category",
    urlValidationRules: "URLs must be real, accessible article links - not homepages, category pages, or generated placeholders. Verify URL accessibility before including."
  },
  urlVerification: {
    enabled: false,        // ⚡ DISABLED for blazing speed
    timeout: 2000,         // Reduced timeout when needed
    fallbackToGenerated: true
  },
  modelSettings: {
    temperature: 0.7,
    maxTokens: 3000
  }
};