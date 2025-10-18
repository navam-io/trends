/**
 * Multi-Tier Intelligent Caching for Trends
 * Provides instant trend retrieval with smart invalidation
 */

import { Trend, TrendCategory } from '../types/trend';

export interface TrendCacheEntry {
  trends: Trend[];
  timestamp: number;
  category?: TrendCategory;
  freshness: number; // 0-1 score
}

export interface CacheMetrics {
  hitRate: number;
  avgAge: number;
  totalEntries: number;
}

class TrendCacheManager {
  private readonly CACHE_KEY = 'trends_smart_cache';
  private readonly FRESHNESS_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours (consider fresh)
  private readonly MAX_CACHE_AGE = 8 * 60 * 60 * 1000; // 8 hours (max before expiry)
  private readonly MAX_ENTRIES = 10;

  /**
   * Get cached trends instantly - this should never block
   */
  getInstantTrends(category?: TrendCategory, limit: number = 20): Trend[] | null {
    try {
      const cached = this.getCacheData();
      if (!cached || cached.length === 0) return null;

      // Find best matching cache entry
      const bestEntry = this.findBestEntry(cached, category, limit);
      if (!bestEntry) return null;

      // Return trends immediately, regardless of age
      return this.selectTrends(bestEntry.trends, category, limit);
    } catch (error) {
      console.warn('Instant cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Get fresh cached trends (within freshness threshold)
   */
  getFreshTrends(category?: TrendCategory, limit: number = 20): Trend[] | null {
    try {
      const cached = this.getCacheData();
      if (!cached || cached.length === 0) return null;

      const bestEntry = this.findBestEntry(cached, category, limit);
      if (!bestEntry || !this.isFresh(bestEntry)) return null;

      return this.selectTrends(bestEntry.trends, category, limit);
    } catch (error) {
      console.warn('Fresh cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache new trends with intelligent categorization
   */
  cacheTrends(trends: Trend[], category?: TrendCategory): void {
    try {
      const cached = this.getCacheData() || [];
      
      // Calculate freshness score
      const freshness = this.calculateFreshness(trends);
      
      const newEntry: TrendCacheEntry = {
        trends,
        timestamp: Date.now(),
        category,
        freshness
      };

      // Add new entry and maintain cache size
      const updatedCache = [newEntry, ...cached]
        .slice(0, this.MAX_ENTRIES)
        .filter(entry => this.isNotExpired(entry));

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.warn('Failed to cache trends:', error);
    }
  }

  /**
   * Check if background refresh is needed
   * Only returns true if cache is truly stale or empty
   */
  shouldRefresh(category?: TrendCategory): boolean {
    try {
      const cached = this.getCacheData();
      if (!cached || cached.length === 0) {
        return true; // No cache at all
      }

      // Find the most recent cache entry
      const mostRecent = cached.reduce((latest, entry) =>
        entry.timestamp > latest.timestamp ? entry : latest
      );

      // Only refresh if the most recent cache is beyond freshness threshold
      const age = Date.now() - mostRecent.timestamp;
      return age > this.FRESHNESS_THRESHOLD; // > 2 hours old
    } catch (error) {
      console.warn('Failed to check refresh status:', error);
      return false; // Don't refresh on error - use what we have
    }
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics {
    try {
      const cached = this.getCacheData() || [];
      const now = Date.now();
      
      const totalEntries = cached.length;
      const avgAge = cached.reduce((sum, entry) => 
        sum + (now - entry.timestamp), 0) / totalEntries;
      
      // Estimate hit rate based on freshness
      const freshEntries = cached.filter(entry => this.isFresh(entry)).length;
      const hitRate = totalEntries > 0 ? freshEntries / totalEntries : 0;

      return { hitRate, avgAge, totalEntries };
    } catch {
      return { hitRate: 0, avgAge: 0, totalEntries: 0 };
    }
  }

  /**
   * Clear expired cache entries
   */
  cleanup(): void {
    try {
      const cached = this.getCacheData() || [];
      const validEntries = cached.filter(entry => this.isNotExpired(entry));
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(validEntries));
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // Private methods

  private getCacheData(): TrendCacheEntry[] | null {
    try {
      const data = localStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private findBestEntry(
    cached: TrendCacheEntry[], 
    category?: TrendCategory, 
    limit: number = 20
  ): TrendCacheEntry | null {
    // Priority: exact category match > no category > freshness > trend count
    const scored = cached
      .map(entry => ({
        entry,
        score: this.scoreEntry(entry, category, limit)
      }))
      .sort((a, b) => b.score - a.score);

    return scored.length > 0 ? scored[0].entry : null;
  }

  private scoreEntry(
    entry: TrendCacheEntry, 
    targetCategory?: TrendCategory, 
    targetLimit: number = 20
  ): number {
    let score = 0;

    // Category match bonus
    if (targetCategory && entry.category === targetCategory) {
      score += 1000;
    } else if (!targetCategory && !entry.category) {
      score += 800; // Mixed content preferred when no category specified
    }

    // Freshness bonus (0-100)
    score += entry.freshness * 100;

    // Recency bonus (0-100)
    const age = Date.now() - entry.timestamp;
    const recencyBonus = Math.max(0, 100 - (age / this.FRESHNESS_THRESHOLD) * 100);
    score += recencyBonus;

    // Size adequacy bonus
    const availableTrends = this.selectTrends(entry.trends, targetCategory, 999).length;
    if (availableTrends >= targetLimit) {
      score += 50;
    } else {
      score += (availableTrends / targetLimit) * 50;
    }

    return score;
  }

  private selectTrends(
    trends: Trend[], 
    category?: TrendCategory, 
    limit: number = 20
  ): Trend[] {
    let filtered = trends;

    // Filter by category if specified
    if (category) {
      filtered = trends.filter(trend => trend.category === category);
    }

    // Return up to limit, maintaining balance if mixed content
    if (!category && filtered.length > limit) {
      // For mixed content, maintain category balance
      const categories = ['consumer', 'competition', 'economy', 'regulation'] as const;
      const perCategory = Math.ceil(limit / categories.length);
      
      const balanced: Trend[] = [];
      for (const cat of categories) {
        const categoryTrends = filtered
          .filter(t => t.category === cat)
          .slice(0, perCategory);
        balanced.push(...categoryTrends);
      }
      
      return balanced.slice(0, limit);
    }

    return filtered.slice(0, limit);
  }

  private calculateFreshness(trends: Trend[]): number {
    // Calculate freshness based on trend metadata
    const now = Date.now();
    const avgAge = trends.reduce((sum, trend) => {
      const trendAge = now - new Date(trend.created_at).getTime();
      return sum + trendAge;
    }, 0) / trends.length;

    // Fresher trends get higher scores
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Math.max(0, 1 - (avgAge / maxAge));
  }

  private isFresh(entry: TrendCacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.FRESHNESS_THRESHOLD;
  }

  private isNotExpired(entry: TrendCacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < this.MAX_CACHE_AGE;
  }
}

// Export singleton instance
export const trendCache = new TrendCacheManager();