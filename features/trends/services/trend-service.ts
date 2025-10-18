/**
 * Trend Service
 * Centralized service for accessing trends across the application
 * Replaces direct mockTrends imports with dynamic trend fetching
 */

import { Trend, TrendCategory } from '../types/trend';

// Master cache for trends - single source of truth
let masterTrendsCache: { trends: Trend[], timestamp: number } | null = null;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours (trends don't change frequently)
const STORAGE_KEY = 'trends_master_cache';

/**
 * Get master trends dataset with multi-layer caching (localStorage + memory)
 */
export async function getTrends(category?: TrendCategory, limit: number = 20): Promise<Trend[]> {
  // Try memory cache first
  if (masterTrendsCache && (Date.now() - masterTrendsCache.timestamp) < CACHE_DURATION) {
    return filterTrendsByCategory(masterTrendsCache.trends, category, limit);
  }
  
  // Try localStorage cache
  const cachedData = getFromLocalStorage();
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    masterTrendsCache = cachedData; // Restore to memory
    return filterTrendsByCategory(cachedData.trends, category, limit);
  }
  
  try {
    // Check if we're on the server-side or client-side
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // On server-side, use the trend generator directly  
      const { generateDynamicTrends } = await import('../server/trend-generator');
      
      // Generate fresh mixed dataset (always mixed, regardless of category param)
      const trends = await generateDynamicTrends(undefined, 20); // Always get mixed set of 20
      
      // Cache in memory only (no localStorage on server)
      const cacheData = { trends, timestamp: Date.now() };
      masterTrendsCache = cacheData;
      
      // Return filtered results
      return filterTrendsByCategory(trends, category, limit);
    } else {
      // On client-side, this should not happen as trends should be fetched via tRPC
      // But if it does, return empty array or cached data
      throw new Error('Trend generation should happen on server-side via tRPC');
    }
  } catch (error) {
    console.error('Error fetching trends:', error);
    
    // Return stale cached data if available (always enabled for better UX)
    if (masterTrendsCache) {
      console.warn('Returning stale cached data due to error');
      return filterTrendsByCategory(masterTrendsCache.trends, category, limit);
    }
    
    // Try stale localStorage data as last resort
    const staleData = getFromLocalStorage();
    if (staleData) {
      console.warn('Returning stale localStorage data due to error');
      return filterTrendsByCategory(staleData.trends, category, limit);
    }
    
    // Re-throw error for proper handling by UI
    throw error;
  }
}

/**
 * Get a single trend by ID
 */
export async function getTrendById(trendId: string): Promise<Trend | null> {
  try {
    // First check memory cache
    if (masterTrendsCache && masterTrendsCache.trends) {
      const trend = masterTrendsCache.trends.find(t => t.id === trendId);
      if (trend) {
        return trend;
      }
    }
    
    // Check localStorage cache
    const cachedData = getFromLocalStorage();
    if (cachedData && cachedData.trends) {
      const trend = cachedData.trends.find(t => t.id === trendId);
      if (trend) {
        // Update memory cache with found data
        masterTrendsCache = cachedData;
        return trend;
      }
    }
    
    // If not found in cache, return null
    // The tRPC router will handle generating fresh trends if needed
    return null;
  } catch (error) {
    console.error('Error fetching trend by ID:', error);
    throw error;
  }
}

/**
 * Get trends for display in components (limited set)
 */
export async function getTrendsForDisplay(limit: number = 5): Promise<Trend[]> {
  return await getTrends(undefined, limit);
}

/**
 * Clear trends cache (useful for forced refresh)
 */
export function clearTrendsCache(): void {
  masterTrendsCache = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear trends from localStorage:', error);
  }
}

/**
 * Update trends cache with new trends (useful after personalized generation)
 */
export function updateTrendsCache(trends: Trend[]): void {
  const cacheData = { trends, timestamp: Date.now() };
  
  // Update memory cache
  masterTrendsCache = cacheData;
  
  // Update localStorage cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    }
  } catch (error) {
    console.warn('Failed to update trends in localStorage:', error);
  }
}

/**
 * Get cached trends without API call (for immediate display)
 */
export function getCachedTrends(category?: TrendCategory): Trend[] | null {
  // Check memory cache first
  if (masterTrendsCache && (Date.now() - masterTrendsCache.timestamp) < CACHE_DURATION) {
    return filterTrendsByCategory(masterTrendsCache.trends, category, 20);
  }
  
  // Check localStorage cache
  const cachedData = getFromLocalStorage();
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
    return filterTrendsByCategory(cachedData.trends, category, 20);
  }
  
  // Return null instead of empty array to indicate no cache
  return null;
}

/**
 * Filter trends by category on client-side
 */
function filterTrendsByCategory(trends: Trend[], category?: TrendCategory, limit?: number): Trend[] {
  let filtered = trends;
  
  // Apply category filter if specified
  if (category) {
    filtered = trends.filter(trend => trend.category === category);
  }
  
  // Apply limit if specified
  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  
  return filtered;
}

/**
 * Save trends to localStorage with error handling
 */
function saveToLocalStorage(data: { trends: Trend[], timestamp: number }): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (error) {
    console.warn('Failed to save trends to localStorage:', error);
  }
}

/**
 * Get trends from localStorage with error handling
 */
function getFromLocalStorage(): { trends: Trend[], timestamp: number } | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.warn('Failed to read trends from localStorage:', error);
  }
  return null;
}

/**
 * Preload trends for better performance
 */
export async function preloadTrends(): Promise<void> {
  try {
    // Preload the master mixed dataset once
    // This will cache it for all category filters
    await getTrends(undefined, 20);
    console.log('Master trends dataset preloaded successfully');
  } catch (error) {
    console.error('Error preloading trends:', error);
  }
}