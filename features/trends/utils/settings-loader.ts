/**
 * Settings loader utility for trend generation
 * Safely loads and validates user settings while protecting system-controlled parts
 */

import { TrendPromptSettings, DEFAULT_TREND_SETTINGS, SettingsState } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'trenddit_prompt_settings';

/**
 * Load trend settings from localStorage with fallback to defaults
 * Validates and sanitizes user input for security
 */
export function loadTrendSettings(): TrendPromptSettings {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      // Server-side or non-browser environment fallback
      return DEFAULT_TREND_SETTINGS;
    }

    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_TREND_SETTINGS;
    }

    const settingsState: SettingsState = JSON.parse(stored);
    if (!settingsState.prompts) {
      return DEFAULT_TREND_SETTINGS;
    }

    // Validate and merge with defaults to ensure all required fields exist
    const settings = validateAndMergeSettings(settingsState.prompts);
    return settings;
  } catch (error) {
    console.warn('Failed to load trend settings from localStorage:', error);
    return DEFAULT_TREND_SETTINGS;
  }
}

/**
 * Validate user settings and merge with defaults
 * Ensures system-controlled sections remain protected
 */
function validateAndMergeSettings(userSettings: Partial<TrendPromptSettings>): TrendPromptSettings {
  const merged: TrendPromptSettings = {
    // User-editable sections - validate and sanitize
    userPrompt: {
      trendFocus: sanitizePromptText(userSettings.userPrompt?.trendFocus) || DEFAULT_TREND_SETTINGS.userPrompt.trendFocus,
      industryContext: sanitizePromptText(userSettings.userPrompt?.industryContext) || DEFAULT_TREND_SETTINGS.userPrompt.industryContext,
      timeframeContext: sanitizePromptText(userSettings.userPrompt?.timeframeContext) || DEFAULT_TREND_SETTINGS.userPrompt.timeframeContext,
      sourcePreferences: sanitizePromptText(userSettings.userPrompt?.sourcePreferences) || DEFAULT_TREND_SETTINGS.userPrompt.sourcePreferences,
    },
    
    // System-controlled sections - ALWAYS use defaults (never user input)
    systemPrompt: {
      ...DEFAULT_TREND_SETTINGS.systemPrompt
    },
    
    // URL verification settings - validate ranges
    urlVerification: {
      enabled: Boolean(userSettings.urlVerification?.enabled ?? DEFAULT_TREND_SETTINGS.urlVerification.enabled),
      timeout: validateTimeout(userSettings.urlVerification?.timeout) || DEFAULT_TREND_SETTINGS.urlVerification.timeout,
      fallbackToGenerated: Boolean(userSettings.urlVerification?.fallbackToGenerated ?? DEFAULT_TREND_SETTINGS.urlVerification.fallbackToGenerated),
    },
    
    // Model settings - validate ranges
    modelSettings: {
      temperature: validateTemperature(userSettings.modelSettings?.temperature) || DEFAULT_TREND_SETTINGS.modelSettings.temperature,
      maxTokens: validateMaxTokens(userSettings.modelSettings?.maxTokens) || DEFAULT_TREND_SETTINGS.modelSettings.maxTokens,
    }
  };

  return merged;
}

/**
 * Sanitize prompt text to prevent injection attacks
 */
function sanitizePromptText(text: string | undefined): string | undefined {
  if (!text || typeof text !== 'string') {
    return undefined;
  }

  // Remove potentially dangerous patterns while preserving legitimate content
  const sanitized = text
    .replace(/[<>{}]/g, '') // Remove potential template injection characters
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\${.*?}/g, '') // Remove template literals
    .trim();

  // Limit length to prevent excessive prompts
  const maxLength = 2000;
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + '...' : sanitized;
}

/**
 * Validate timeout value
 */
function validateTimeout(timeout: number | undefined): number | undefined {
  if (typeof timeout !== 'number' || isNaN(timeout)) {
    return undefined;
  }
  // Clamp between 1-15 seconds
  return Math.max(1000, Math.min(15000, timeout));
}

/**
 * Validate temperature value
 */
function validateTemperature(temperature: number | undefined): number | undefined {
  if (typeof temperature !== 'number' || isNaN(temperature)) {
    return undefined;
  }
  // Clamp between 0-1
  return Math.max(0, Math.min(1, temperature));
}

/**
 * Validate max tokens value
 */
function validateMaxTokens(maxTokens: number | undefined): number | undefined {
  if (typeof maxTokens !== 'number' || isNaN(maxTokens)) {
    return undefined;
  }
  // Clamp between 1000-4000
  return Math.max(1000, Math.min(4000, maxTokens));
}

/**
 * Get AI model from settings or fallback to default
 * Works in both client and server environments
 */
export function getAIModelFromSettings(): string {
  // Get model from config.yml dynamically
  try {
    if (typeof window === 'undefined') {
      // Server-side: use getAIModel from config reader
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getAIModel } = require('@/lib/config/reader');
      return getAIModel();
    } else {
      // Client-side: use constants as fallback  
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CONFIG_CONSTANTS } = require('@/lib/config/constants');
      return CONFIG_CONSTANTS.ai.defaultModel;
    }
  } catch (error) {
    console.warn('Failed to get AI model from config, using fallback:', error);
    return 'claude-sonnet-4-20250514';
  }
}

/**
 * Build the complete trend generation prompt using validated settings
 */
export function buildTrendGenerationPrompt(
  settings: TrendPromptSettings,
  currentMonth: string,
  limit: number,
  trendsPerCategory: number,
  companyProfile?: any
): string {
  // Build personalization context if provided
  const personalizationContext = companyProfile ? `
PERSONALIZATION CONTEXT:
- Target industry: ${companyProfile.industry}
${companyProfile.market ? `- Primary market: ${companyProfile.market}` : ''}
${companyProfile.customer ? `- Customer type: ${companyProfile.customer}` : ''}
${companyProfile.businessSize ? `- Business size: ${companyProfile.businessSize}` : ''}
${companyProfile.domain ? `- Company domain: ${companyProfile.domain}` : ''}
${companyProfile.priorities ? `- Key priorities: ${companyProfile.priorities.join(', ')}` : ''}

PERSONALIZATION REQUIREMENTS:
- Prioritize trends most relevant to ${companyProfile.industry} industry
${companyProfile.market ? `- Focus on trends impacting the ${companyProfile.market} market` : ''}
${companyProfile.customer ? `- Emphasize trends affecting ${companyProfile.customer} customers` : ''}
${companyProfile.businessSize ? `- Consider the scale and resources of ${companyProfile.businessSize} businesses` : ''}
- Include specific implications for this business profile in summaries
` : '';

  // Build category distribution prompt
  const categoryPrompt = `Generate exactly ${trendsPerCategory} trends for EACH of these categories:
1. CONSUMER trends (${trendsPerCategory} trends) - AI products, services, and experiences for end consumers
2. COMPETITION trends (${trendsPerCategory} trends) - Competitive moves, market dynamics, company strategies  
3. ECONOMY trends (${trendsPerCategory} trends) - Economic impacts, market valuations, financial implications
4. REGULATION trends (${trendsPerCategory} trends) - Regulatory developments, compliance, policy changes

ENSURE BALANCED DISTRIBUTION: The response must contain ${trendsPerCategory} trends from each category for a total of ${limit} trends.`;

  // Construct the main prompt optimized for web search API
  const prompt = `Generate ${limit} current, relevant AI/technology trends for ${currentMonth} with BALANCED CATEGORY DISTRIBUTION.

WEB SEARCH STRATEGY (the AI will search for these automatically):
- Search for "latest AI technology trends ${currentMonth.split(' ')[0]} ${currentMonth.split(' ')[1]}"
- Search for "AI industry news ${currentMonth.split(' ')[1]}"
- Search for "technology breakthroughs ${currentMonth.split(' ')[1]}"
- Search for "AI regulatory developments ${currentMonth.split(' ')[1]}"
- Search for specific categories: "AI consumer products news", "AI competition updates", "AI economy impact", "AI regulation changes"

USER REQUIREMENTS:
${settings.userPrompt.trendFocus}

INDUSTRY & AUDIENCE CONTEXT:
${settings.userPrompt.industryContext}

TIMEFRAME & CURRENCY REQUIREMENTS:
${settings.userPrompt.timeframeContext}

SOURCE & QUALITY REQUIREMENTS:
${settings.userPrompt.sourcePreferences}

${personalizationContext}

${categoryPrompt}

SYSTEM REQUIREMENTS (MANDATORY):
${settings.systemPrompt.responseFormat}
${settings.systemPrompt.validationRules}
${settings.systemPrompt.categoryRequirements}
${settings.systemPrompt.urlValidationRules}

Current context to consider:
- We're in ${currentMonth}, well into 2025
- AI adoption is mainstream across enterprises
- Regulatory frameworks like EU AI Act are now in effect
- Major tech companies have mature AI products
- Focus on what's NEW and EMERGING, not old news

Return as JSON array with this structure:
[
  {
    "title": "OpenAI Launches GPT-5 with Revolutionary Reasoning Capabilities",
    "summary": "OpenAI announced GPT-5 today with breakthrough reasoning abilities, achieving 95% accuracy on complex logical problems and reducing hallucinations by 80% compared to GPT-4. The model will be available through API access starting February 2025 with enterprise pricing at $0.10 per 1K tokens.",
    "impact_score": 9,
    "source": "TechCrunch",
    "source_url": "https://techcrunch.com/2025/01/15/openai-launches-gpt-5-revolutionary-reasoning-capabilities/",
    "category": "consumer"
  }
]

IMPORTANT: Use the web search results to find REAL, CURRENT articles. Each source_url MUST be an actual URL from the web search results, not a generated or placeholder URL. Only include trends that you found through web search with verified sources.`;

  return prompt;
}