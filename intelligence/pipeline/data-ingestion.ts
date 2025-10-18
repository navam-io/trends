/**
 * Real-Time Intelligence Data Pipeline
 * Ingests, processes, and caches market intelligence from multiple sources
 */

import { z } from 'zod';
import { anthropic } from '@/lib/ai/anthropic';
import { getAIModel } from '@/lib/config/reader';

// Data Source Types
export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['social', 'news', 'financial', 'reviews', 'technical']),
  url: z.string(),
  apiKey: z.string().optional(),
  rateLimitPerHour: z.number(),
  reliability: z.number().min(0).max(1),
  enabled: z.boolean(),
});

export const RawIntelligenceSchema = z.object({
  sourceId: z.string(),
  sourceType: z.string(),
  rawData: z.any(),
  timestamp: z.date(),
  url: z.string().optional(),
  reliability: z.number().min(0).max(1),
});

export const ProcessedIntelligenceSchema = z.object({
  id: z.string(),
  type: z.enum(['trend', 'competitor', 'market_sentiment', 'regulatory', 'technical']),
  title: z.string(),
  summary: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()),
  entities: z.array(z.string()),
  tags: z.array(z.string()),
  impact_score: z.number().min(1).max(10),
  processed_at: z.date(),
  expires_at: z.date(),
});

export const MarketChangeSchema = z.object({
  type: z.enum(['trend_shift', 'competitor_activity', 'regulatory_change', 'market_opportunity']),
  description: z.string(),
  impact: z.enum(['low', 'medium', 'high']),
  affectedEntities: z.array(z.string()),
  timestamp: z.date(),
});

export type DataSource = z.infer<typeof DataSourceSchema>;
export type RawIntelligence = z.infer<typeof RawIntelligenceSchema>;
export type ProcessedIntelligence = z.infer<typeof ProcessedIntelligenceSchema>;
export type MarketChange = z.infer<typeof MarketChangeSchema>;

/**
 * Data Source Configuration
 * Defines available intelligence sources
 */
export const DATA_SOURCES: DataSource[] = [
  // Social Media Sources
  {
    id: 'reddit_ml',
    name: 'Reddit Machine Learning',
    type: 'social',
    url: 'https://www.reddit.com/r/MachineLearning.json',
    rateLimitPerHour: 100,
    reliability: 0.7,
    enabled: true,
  },
  {
    id: 'reddit_ai',
    name: 'Reddit Artificial Intelligence',
    type: 'social',
    url: 'https://www.reddit.com/r/artificial.json',
    rateLimitPerHour: 100,
    reliability: 0.7,
    enabled: true,
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    type: 'technical',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    rateLimitPerHour: 200,
    reliability: 0.8,
    enabled: true,
  },

  // News Sources
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'news',
    url: 'https://techcrunch.com/wp-json/wp/v2/posts',
    rateLimitPerHour: 50,
    reliability: 0.9,
    enabled: true,
  },
  {
    id: 'venturebeat',
    name: 'VentureBeat',
    type: 'news',
    url: 'https://venturebeat.com/wp-json/wp/v2/posts',
    rateLimitPerHour: 50,
    reliability: 0.8,
    enabled: true,
  },

  // Financial Sources
  {
    id: 'crunchbase',
    name: 'Crunchbase',
    type: 'financial',
    url: 'https://api.crunchbase.com/api/v4',
    rateLimitPerHour: 20,
    reliability: 0.95,
    enabled: false, // Requires paid API
  },

  // Review Sources  
  {
    id: 'g2',
    name: 'G2 Reviews',
    type: 'reviews',
    url: 'https://www.g2.com/api/v1',
    rateLimitPerHour: 100,
    reliability: 0.85,
    enabled: false, // Requires API access
  },
];

/**
 * Data Ingestion Engine
 * Orchestrates data collection from multiple sources
 */
export class DataIngestionEngine {
  private sources: Map<string, DataSource> = new Map();
  private rateLimits: Map<string, number[]> = new Map(); // Track API calls per hour
  private cache: Map<string, ProcessedIntelligence[]> = new Map();

  constructor() {
    this.initializeSources();
  }

  async ingestData(sourceIds?: string[]): Promise<RawIntelligence[]> {
    const targetSources = sourceIds 
      ? sourceIds.map(id => this.sources.get(id)).filter(Boolean) as DataSource[]
      : Array.from(this.sources.values()).filter(s => s.enabled);

    const ingestionPromises = targetSources.map(source => 
      this.ingestFromSource(source)
    );

    const results = await Promise.allSettled(ingestionPromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<RawIntelligence[]> => 
        result.status === 'fulfilled'
      )
      .flatMap(result => result.value);
  }

  async processIntelligence(rawData: RawIntelligence[]): Promise<ProcessedIntelligence[]> {
    const processingPromises = rawData.map(raw => this.processRawData(raw));
    const results = await Promise.allSettled(processingPromises);

    return results
      .filter((result): result is PromiseFulfilledResult<ProcessedIntelligence> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  async cacheIntelligence(intelligence: ProcessedIntelligence[]): Promise<void> {
    const now = new Date();
    
    // Group by type for efficient caching
    const byType = intelligence.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, ProcessedIntelligence[]>);

    // Cache with expiration
    Object.entries(byType).forEach(([type, items]) => {
      const cacheKey = `${type}_${now.getTime()}`;
      this.cache.set(cacheKey, items);
    });

    // Clean expired cache entries
    this.cleanExpiredCache();
  }

  async invalidateCache(trigger: MarketChange): Promise<void> {
    // Invalidate relevant cache entries based on market change
    const relevantKeys = Array.from(this.cache.keys()).filter(key => 
      trigger.affectedEntities.some(entity => key.includes(entity.toLowerCase()))
    );

    relevantKeys.forEach(key => this.cache.delete(key));
  }

  getCachedIntelligence(type: string, maxAge: number = 3600000): ProcessedIntelligence[] {
    const now = new Date().getTime();
    const relevantEntries = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith(type))
      .filter(([key]) => {
        const timestamp = parseInt(key.split('_').pop() || '0');
        return now - timestamp < maxAge;
      });

    return relevantEntries.flatMap(([_, items]) => items);
  }

  // Private Implementation Methods

  private initializeSources(): void {
    DATA_SOURCES.forEach(source => {
      this.sources.set(source.id, source);
      this.rateLimits.set(source.id, []);
    });
  }

  private async ingestFromSource(source: DataSource): Promise<RawIntelligence[]> {
    try {
      // Check rate limits
      if (!this.checkRateLimit(source.id, source.rateLimitPerHour)) {
        console.warn(`Rate limit exceeded for source: ${source.name}`);
        return [];
      }

      // Record API call
      this.recordApiCall(source.id);

      // Fetch data based on source type
      const rawData = await this.fetchFromSource(source);
      
      return rawData.map(data => ({
        sourceId: source.id,
        sourceType: source.type,
        rawData: data,
        timestamp: new Date(),
        url: source.url,
        reliability: source.reliability,
      }));

    } catch (error) {
      console.error(`Failed to ingest from ${source.name}:`, error);
      return [];
    }
  }

  private async fetchFromSource(source: DataSource): Promise<any[]> {
    const headers: Record<string, string> = {
      'User-Agent': 'Trends-Intelligence-Engine/1.0',
    };

    if (source.apiKey) {
      headers['Authorization'] = `Bearer ${source.apiKey}`;
    }

    try {
      const response = await fetch(source.url, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      switch (source.type) {
        case 'social':
          return this.parseSocialData(data, source.id);
        case 'news':
          return this.parseNewsData(data, source.id);
        case 'technical':
          return this.parseTechnicalData(data, source.id);
        case 'financial':
          return this.parseFinancialData(data, source.id);
        case 'reviews':
          return this.parseReviewData(data, source.id);
        default:
          return Array.isArray(data) ? data : [data];
      }
    } catch (error) {
      console.error(`Fetch failed for ${source.name}:`, error);
      return [];
    }
  }

  private async processRawData(raw: RawIntelligence): Promise<ProcessedIntelligence> {
    try {
      // Use AI to comprehensively analyze the raw intelligence data
      const analysisPrompt = `Analyze this intelligence data from ${raw.sourceId} (${raw.sourceType} source):

DATA TO ANALYZE:
${JSON.stringify(raw.rawData, null, 2)}

SOURCE RELIABILITY: ${raw.reliability}

ANALYSIS REQUIREMENTS:
1. Classify the intelligence type (trend, competitor, market_sentiment, regulatory, technical)
2. Extract a clear, concise title (max 100 chars)
3. Generate a comprehensive summary (2-3 sentences)
4. Determine sentiment (positive, neutral, negative)
5. Identify key entities mentioned (companies, technologies, people)
6. Extract relevant tags for categorization
7. Calculate business impact score (1-10) considering market relevance and potential disruption
8. Assess overall confidence in the analysis (0.0-1.0)

Respond in JSON format:
{
  "type": "trend|competitor|market_sentiment|regulatory|technical",
  "title": "concise title",
  "summary": "comprehensive summary",
  "sentiment": "positive|neutral|negative",
  "entities": ["entity1", "entity2", "entity3"],
  "tags": ["tag1", "tag2", "tag3"],
  "impact_score": 7,
  "confidence": 0.85
}`;

      const response = await anthropic.messages.create({
        model: getAIModel(),
        max_tokens: 1500,
        temperature: 0.2,
        system: 'You are an expert intelligence analyst specializing in technology and market trends. Analyze data comprehensively and objectively. Use web search to verify and supplement information when needed.',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 2
            // Unrestricted for comprehensive data ingestion
          }
        ]
      });

      // Parse AI response with intelligent fallbacks
      let aiAnalysis;
      try {
        const content = response.content[0];
        const responseText = content && content.type === 'text' ? content.text : '{}';
        aiAnalysis = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI analysis, using fallback:', parseError);
        aiAnalysis = this.generateFallbackAnalysis(raw);
      }

      // Create processed intelligence with AI analysis
      const processed: ProcessedIntelligence = {
        id: `${raw.sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: this.validateIntelligenceType(aiAnalysis.type) || this.inferIntelligenceType(raw),
        title: aiAnalysis.title || this.extractTitle(raw.rawData),
        summary: aiAnalysis.summary || this.extractSummary(raw.rawData),
        sentiment: this.validateSentiment(aiAnalysis.sentiment) || this.analyzeSentiment(raw.rawData),
        confidence: Math.min(raw.reliability, aiAnalysis.confidence || 0.7),
        sources: [raw.sourceId],
        entities: Array.isArray(aiAnalysis.entities) ? aiAnalysis.entities.slice(0, 5) : this.extractEntities(raw.rawData),
        tags: Array.isArray(aiAnalysis.tags) ? aiAnalysis.tags.slice(0, 5) : this.extractTags(raw.rawData),
        impact_score: this.validateImpactScore(aiAnalysis.impact_score) || this.calculateImpactScore(raw.rawData, raw.reliability),
        processed_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      return processed;
    } catch (error) {
      console.error('AI processing failed, using fallback analysis:', error);
      return this.generateFallbackProcessedIntelligence(raw);
    }
  }

  private checkRateLimit(sourceId: string, limitPerHour: number): boolean {
    const calls = this.rateLimits.get(sourceId) || [];
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCalls = calls.filter(timestamp => timestamp > oneHourAgo);
    
    return recentCalls.length < limitPerHour;
  }

  private recordApiCall(sourceId: string): void {
    const calls = this.rateLimits.get(sourceId) || [];
    calls.push(Date.now());
    this.rateLimits.set(sourceId, calls);
  }

  private cleanExpiredCache(): void {
    const now = new Date().getTime();
    const expiredKeys = Array.from(this.cache.entries())
      .filter(([_, items]) => items.some(item => item.expires_at.getTime() < now))
      .map(([key]) => key);

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  // Data parsing methods (simplified for MVP)
  private parseSocialData(data: any, sourceId: string): any[] {
    if (sourceId.includes('reddit')) {
      return data.data?.children?.map((child: any) => child.data) || [];
    }
    return Array.isArray(data) ? data : [data];
  }

  private parseNewsData(data: any, sourceId: string): any[] {
    return Array.isArray(data) ? data : [data];
  }

  private parseTechnicalData(data: any, sourceId: string): any[] {
    if (sourceId === 'hackernews') {
      return Array.isArray(data) ? data.slice(0, 10) : []; // Top 10 stories
    }
    return Array.isArray(data) ? data : [data];
  }

  private parseFinancialData(data: any, sourceId: string): any[] {
    return data.data || [];
  }

  private parseReviewData(data: any, sourceId: string): any[] {
    return data.data || [];
  }

  private inferIntelligenceType(raw: RawIntelligence): ProcessedIntelligence['type'] {
    const content = JSON.stringify(raw.rawData).toLowerCase();
    
    if (content.includes('competitor') || content.includes('acquisition')) {
      return 'competitor';
    }
    if (content.includes('regulation') || content.includes('compliance')) {
      return 'regulatory';
    }
    if (content.includes('trend') || content.includes('ai') || content.includes('ml')) {
      return 'trend';
    }
    if (content.includes('sentiment') || content.includes('market')) {
      return 'market_sentiment';
    }
    
    return 'technical';
  }

  private extractTitle(data: any): string {
    return data.title || data.name || data.headline || 'Untitled Intelligence';
  }

  private extractSummary(data: any): string {
    return data.summary || data.description || data.content?.substring(0, 200) || 'No summary available';
  }

  private analyzeSentiment(data: any): ProcessedIntelligence['sentiment'] {
    // Simplified sentiment analysis
    const content = JSON.stringify(data).toLowerCase();
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'growth', 'success'];
    const negativeWords = ['bad', 'poor', 'negative', 'decline', 'failure', 'risk'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractEntities(data: any): string[] {
    // Simplified entity extraction
    const content = JSON.stringify(data).toLowerCase();
    const entities = ['openai', 'google', 'microsoft', 'anthropic', 'ai', 'machine learning'];
    
    return entities.filter(entity => content.includes(entity));
  }

  private extractTags(data: any): string[] {
    // Simplified tag extraction
    const content = JSON.stringify(data).toLowerCase();
    const tags = ['ai', 'ml', 'nlp', 'computer vision', 'robotics', 'automation'];
    
    return tags.filter(tag => content.includes(tag));
  }

  private calculateImpactScore(data: any, reliability: number): number {
    // Simplified impact scoring
    const content = JSON.stringify(data).toLowerCase();
    let score = 5; // Base score
    
    if (content.includes('breakthrough') || content.includes('revolutionary')) score += 3;
    if (content.includes('funding') || content.includes('acquisition')) score += 2;
    if (content.includes('regulation') || content.includes('policy')) score += 2;
    
    return Math.min(10, Math.max(1, Math.round(score * reliability)));
  }

  // AI Processing Helper Methods

  private validateIntelligenceType(type: string): ProcessedIntelligence['type'] | null {
    const validTypes: ProcessedIntelligence['type'][] = ['trend', 'competitor', 'market_sentiment', 'regulatory', 'technical'];
    return validTypes.includes(type as ProcessedIntelligence['type']) ? type as ProcessedIntelligence['type'] : null;
  }

  private validateSentiment(sentiment: string): ProcessedIntelligence['sentiment'] | null {
    const validSentiments: ProcessedIntelligence['sentiment'][] = ['positive', 'neutral', 'negative'];
    return validSentiments.includes(sentiment as ProcessedIntelligence['sentiment']) ? sentiment as ProcessedIntelligence['sentiment'] : null;
  }

  private validateImpactScore(score: any): number | null {
    const numScore = typeof score === 'number' ? score : parseInt(score);
    return !isNaN(numScore) && numScore >= 1 && numScore <= 10 ? numScore : null;
  }

  private generateFallbackAnalysis(raw: RawIntelligence): any {
    return {
      type: this.inferIntelligenceType(raw),
      title: this.extractTitle(raw.rawData),
      summary: this.extractSummary(raw.rawData),
      sentiment: this.analyzeSentiment(raw.rawData),
      entities: this.extractEntities(raw.rawData),
      tags: this.extractTags(raw.rawData),
      impact_score: this.calculateImpactScore(raw.rawData, raw.reliability),
      confidence: raw.reliability * 0.8, // Reduced confidence for fallback
    };
  }

  private generateFallbackProcessedIntelligence(raw: RawIntelligence): ProcessedIntelligence {
    return {
      id: `${raw.sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.inferIntelligenceType(raw),
      title: this.extractTitle(raw.rawData),
      summary: this.extractSummary(raw.rawData),
      sentiment: this.analyzeSentiment(raw.rawData),
      confidence: raw.reliability * 0.7, // Reduced confidence for complete fallback
      sources: [raw.sourceId],
      entities: this.extractEntities(raw.rawData),
      tags: this.extractTags(raw.rawData),
      impact_score: this.calculateImpactScore(raw.rawData, raw.reliability),
      processed_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }
}

// Global data ingestion engine instance
export const dataIngestionEngine = new DataIngestionEngine();