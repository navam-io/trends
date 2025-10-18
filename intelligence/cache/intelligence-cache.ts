/**
 * Intelligence Caching System
 * High-performance caching for AI-generated intelligence with smart invalidation
 */

import { z } from 'zod';
import { ProcessedIntelligence, MarketChange } from '../pipeline/data-ingestion';

// Cache Configuration
export const CacheConfigSchema = z.object({
  defaultTTL: z.number().default(3600000), // 1 hour
  maxCacheSize: z.number().default(1000),
  compressionEnabled: z.boolean().default(true),
  persistentCache: z.boolean().default(false),
});

export const CacheEntrySchema = z.object({
  key: z.string(),
  data: z.any(),
  createdAt: z.date(),
  expiresAt: z.date(),
  accessCount: z.number().default(0),
  lastAccessed: z.date(),
  tags: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  dataHash: z.string(),
});

export const CacheStatsSchema = z.object({
  totalEntries: z.number(),
  hitRate: z.number(),
  missRate: z.number(),
  evictionCount: z.number(),
  totalSize: z.number(),
  averageConfidence: z.number(),
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;
export type CacheEntry = z.infer<typeof CacheEntrySchema>;
export type CacheStats = z.infer<typeof CacheStatsSchema>;

/**
 * Confidence Scoring Engine
 * Calculates and tracks confidence scores for intelligence data
 */
export class ConfidenceScorer {
  private historicalAccuracy: Map<string, number[]> = new Map();
  private sourceReliability: Map<string, number> = new Map();

  calculateConfidence(intelligence: ProcessedIntelligence): number {
    const factors = {
      sourceReliability: this.getSourceReliability(intelligence.sources),
      evidenceStrength: this.assessEvidenceStrength(intelligence),
      consensusScore: this.calculateConsensusScore(intelligence),
      recencyBoost: this.calculateRecencyBoost(intelligence.processed_at),
      historicalAccuracy: this.getHistoricalAccuracy(intelligence.type),
    };

    // Weighted average of confidence factors
    const weights = {
      sourceReliability: 0.3,
      evidenceStrength: 0.25,
      consensusScore: 0.2,
      recencyBoost: 0.15,
      historicalAccuracy: 0.1,
    };

    const confidence = Object.entries(factors).reduce((sum, [factor, value]) => {
      return sum + (value * weights[factor as keyof typeof weights]);
    }, 0);

    return Math.min(1, Math.max(0, confidence));
  }

  updateAccuracy(intelligenceType: string, actualOutcome: number): void {
    if (!this.historicalAccuracy.has(intelligenceType)) {
      this.historicalAccuracy.set(intelligenceType, []);
    }
    
    const history = this.historicalAccuracy.get(intelligenceType)!;
    history.push(actualOutcome);
    
    // Keep only last 100 outcomes for each type
    if (history.length > 100) {
      history.shift();
    }
  }

  updateSourceReliability(sourceId: string, reliability: number): void {
    this.sourceReliability.set(sourceId, reliability);
  }

  getConfidenceBreakdown(intelligence: ProcessedIntelligence): Record<string, number> {
    return {
      sourceReliability: this.getSourceReliability(intelligence.sources),
      evidenceStrength: this.assessEvidenceStrength(intelligence),
      consensusScore: this.calculateConsensusScore(intelligence),
      recencyBoost: this.calculateRecencyBoost(intelligence.processed_at),
      historicalAccuracy: this.getHistoricalAccuracy(intelligence.type),
    };
  }

  private getSourceReliability(sources: string[]): number {
    if (sources.length === 0) return 0.5;
    
    const reliabilities = sources.map(source => 
      this.sourceReliability.get(source) || 0.5
    );
    
    return reliabilities.reduce((sum, rel) => sum + rel, 0) / reliabilities.length;
  }

  private assessEvidenceStrength(intelligence: ProcessedIntelligence): number {
    let strength = 0.5; // Base strength
    
    // More sources increase evidence strength
    if (intelligence.sources.length > 3) strength += 0.2;
    else if (intelligence.sources.length > 1) strength += 0.1;
    
    // More entities suggest broader validation
    if (intelligence.entities.length > 5) strength += 0.2;
    else if (intelligence.entities.length > 2) strength += 0.1;
    
    // Tags suggest topic relevance
    if (intelligence.tags.length > 3) strength += 0.1;
    
    return Math.min(1, strength);
  }

  private calculateConsensusScore(intelligence: ProcessedIntelligence): number {
    // Simplified consensus calculation
    // In real implementation, this would check agreement across sources
    return intelligence.confidence || 0.7;
  }

  private calculateRecencyBoost(processedAt: Date): number {
    const hoursOld = (Date.now() - processedAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursOld < 1) return 1.0;      // Very recent
    if (hoursOld < 6) return 0.9;      // Recent
    if (hoursOld < 24) return 0.8;     // Same day
    if (hoursOld < 72) return 0.6;     // Within 3 days
    
    return 0.4; // Older data
  }

  private getHistoricalAccuracy(intelligenceType: string): number {
    const history = this.historicalAccuracy.get(intelligenceType) || [];
    if (history.length === 0) return 0.5; // Default for new types
    
    return history.reduce((sum, accuracy) => sum + accuracy, 0) / history.length;
  }
}

/**
 * Intelligent Cache System
 * High-performance caching with confidence-based eviction and smart invalidation
 */
export class IntelligenceCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private confidenceScorer: ConfidenceScorer;
  private stats: CacheStats;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...CacheConfigSchema.parse({}), ...config };
    this.confidenceScorer = new ConfidenceScorer();
    this.stats = {
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      totalSize: 0,
      averageConfidence: 0,
    };
  }

  async set(
    key: string, 
    data: any, 
    options: {
      ttl?: number;
      tags?: string[];
      confidence?: number;
    } = {}
  ): Promise<void> {
    const now = new Date();
    const ttl = options.ttl || this.config.defaultTTL;
    const confidence = options.confidence || 0.7;

    // Calculate data hash for integrity checking
    const dataHash = this.calculateHash(data);

    const entry: CacheEntry = {
      key,
      data,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      accessCount: 0,
      lastAccessed: now,
      tags: options.tags || [],
      confidence,
      dataHash,
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxCacheSize) {
      await this.evictLeastValuable();
    }

    this.cache.set(key, entry);
    this.updateStats();
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.missRate++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt.getTime() < Date.now()) {
      this.cache.delete(key);
      this.stats.missRate++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    this.stats.hitRate++;
    return entry.data;
  }

  async invalidate(pattern: string | RegExp | MarketChange): Promise<void> {
    const keysToDelete: string[] = [];

    if (typeof pattern === 'string') {
      // Simple string pattern matching
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
    } else if (pattern instanceof RegExp) {
      // Regex pattern matching
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
    } else {
      // Market change-based invalidation
      const marketChange = pattern as MarketChange;
      for (const [key, entry] of this.cache.entries()) {
        if (this.shouldInvalidateForMarketChange(entry, marketChange)) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateStats();
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateStats();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.updateStats();
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getCacheEntries(filter?: {
    minConfidence?: number;
    tags?: string[];
    maxAge?: number;
  }): CacheEntry[] {
    const entries = Array.from(this.cache.values());
    
    if (!filter) return entries;

    return entries.filter(entry => {
      if (filter.minConfidence && entry.confidence < filter.minConfidence) {
        return false;
      }
      
      if (filter.tags && !filter.tags.some(tag => entry.tags.includes(tag))) {
        return false;
      }
      
      if (filter.maxAge) {
        const age = Date.now() - entry.createdAt.getTime();
        if (age > filter.maxAge) return false;
      }
      
      return true;
    });
  }

  // Confidence-based caching methods

  async cacheWithConfidence(
    key: string,
    intelligence: ProcessedIntelligence
  ): Promise<void> {
    const confidence = this.confidenceScorer.calculateConfidence(intelligence);
    
    // High confidence data gets longer TTL
    const ttl = confidence > 0.8 ? this.config.defaultTTL * 2 :
                confidence > 0.6 ? this.config.defaultTTL :
                this.config.defaultTTL / 2;

    await this.set(key, intelligence, {
      ttl,
      confidence,
      tags: [...intelligence.tags, intelligence.type],
    });
  }

  getConfidenceBreakdown(intelligence: ProcessedIntelligence): Record<string, number> {
    return this.confidenceScorer.getConfidenceBreakdown(intelligence);
  }

  updateAccuracy(intelligenceType: string, actualOutcome: number): void {
    this.confidenceScorer.updateAccuracy(intelligenceType, actualOutcome);
  }

  // Private methods

  private async evictLeastValuable(): Promise<void> {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());
    
    // Calculate value score for each entry
    const scoredEntries = entries.map(([key, entry]) => ({
      key,
      entry,
      value: this.calculateEntryValue(entry),
    }));

    // Sort by value (ascending) and evict the least valuable
    scoredEntries.sort((a, b) => a.value - b.value);
    
    const toEvict = Math.max(1, Math.floor(this.cache.size * 0.1)); // Evict 10%
    
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(scoredEntries[i].key);
      this.stats.evictionCount++;
    }
  }

  private calculateEntryValue(entry: CacheEntry): number {
    const ageScore = 1 - (Date.now() - entry.createdAt.getTime()) / (24 * 60 * 60 * 1000); // Newer is better
    const accessScore = Math.min(1, entry.accessCount / 10); // More access is better
    const confidenceScore = entry.confidence; // Higher confidence is better
    
    return (ageScore * 0.3) + (accessScore * 0.4) + (confidenceScore * 0.3);
  }

  private shouldInvalidateForMarketChange(entry: CacheEntry, change: MarketChange): boolean {
    // Check if entry is affected by the market change
    const entryContent = JSON.stringify(entry.data).toLowerCase();
    
    return change.affectedEntities.some(entity => 
      entryContent.includes(entity.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(entity.toLowerCase()))
    );
  }

  private calculateHash(data: any): string {
    return btoa(JSON.stringify(data)).substring(0, 16);
  }

  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values())
      .reduce((size, entry) => size + JSON.stringify(entry.data).length, 0);
    
    const confidences = Array.from(this.cache.values()).map(entry => entry.confidence);
    this.stats.averageConfidence = confidences.length > 0 
      ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length 
      : 0;
  }
}

// Global cache instances
export const intelligenceCache = new IntelligenceCache();
export const confidenceScorer = new ConfidenceScorer();