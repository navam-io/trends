/**
 * Fast Trends Hook
 * Simplified approach using mutations instead of problematic subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Trend, TrendCategory } from '../types/trend';

export interface FastTrendsState {
  trends: Trend[];
  isLoading: boolean;
  isComplete: boolean;
  hasCache: boolean;
  error: string | null;
  refresh: () => void;
}

export interface UseFastTrendsOptions {
  category?: TrendCategory;
  limit?: number;
  autoStart?: boolean;
}

export function useFastTrends(options: UseFastTrendsOptions = {}): FastTrendsState {
  const {
    category,
    limit = 20,
    autoStart = true,
  } = options;

  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasCache, setHasCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Instant cache query
  const { data: instantData, refetch: refetchInstant } = trpc.trends.instant.useQuery(
    { category, limit },
    {
      enabled: autoStart,
      staleTime: 2 * 60 * 60 * 1000, // 2 hours - match server cache freshness threshold
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch if we have cached data
      refetchOnReconnect: false, // Don't refetch on reconnect
    }
  );

  // Regular list query as fallback
  const { data: listData, refetch: refetchList } = trpc.trends.list.useQuery(
    { limit, refresh: false },
    {
      enabled: false, // Only use when needed
      staleTime: 2 * 60 * 60 * 1000, // 2 hours - match cache freshness
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );

  // Handle instant data
  useEffect(() => {
    if (instantData) {
      console.log('📦 Instant data received:', instantData);
      
      if (instantData.trends.length > 0) {
        // Filter by category if needed
        const filteredTrends = category
          ? instantData.trends.filter(t => t.category === category)
          : instantData.trends;

        setTrends(filteredTrends);
        setHasCache(instantData.cached);
        setIsComplete(true); // We have data, mark as complete

        // Only regenerate if cache explicitly says we should AND we don't have enough trends
        // This prevents unnecessary regeneration on every page load
        if (instantData.shouldRefresh && filteredTrends.length < limit * 0.5) {
          console.log('⚠️ Insufficient cached trends, generating fresh in background');
          // Generate in background without blocking UI
          generateFreshTrends();
        } else if (filteredTrends.length >= limit * 0.75) {
          // We have plenty of cached trends (>75% of requested), use them!
          console.log('✅ Using cached trends (' + filteredTrends.length + ' available), no regeneration needed');
          setIsLoading(false);
        } else {
          console.log('✅ Using cached trends, sufficient for display');
          setIsLoading(false);
        }
      } else {
        console.log('📭 No cached trends, generating fresh');
        generateFreshTrends();
      }
    }
  }, [instantData, category, limit]);

  // Handle list data fallback
  useEffect(() => {
    if (listData && listData.length > 0 && trends.length === 0) {
      console.log('📋 Using list data as fallback:', listData.length, 'trends');
      
      const filteredTrends = category 
        ? listData.filter(t => t.category === category)
        : listData;
        
      setTrends(filteredTrends);
      setIsComplete(true);
      setIsLoading(false);
    }
  }, [listData, category, trends.length]);

  // Generate fresh trends function
  const generateFreshTrends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Starting fresh trend generation');
      
      // Use the list endpoint with refresh=true to force generation
      const freshData = await refetchList({
        throwOnError: true,
        cancelRefetch: true,
      });
      
      if (freshData.data && freshData.data.length > 0) {
        console.log('✅ Fresh trends generated:', freshData.data.length);
        
        const filteredTrends = category 
          ? freshData.data.filter(t => t.category === category)
          : freshData.data;
          
        setTrends(filteredTrends);
        setIsComplete(true);
        setHasCache(false); // Fresh data, not from cache
      } else {
        throw new Error('No trends generated');
      }
    } catch (err) {
      console.error('❌ Fresh generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate trends');
      
      // Fallback to any existing trends
      if (trends.length === 0 && listData && listData.length > 0) {
        console.log('🔄 Using existing list data as fallback');
        const filteredTrends = category 
          ? listData.filter(t => t.category === category)
          : listData;
        setTrends(filteredTrends);
        setIsComplete(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, refetchList, trends.length, listData]);

  // Refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    setTrends([]);
    setHasCache(false);
    setIsComplete(false);
    setError(null);
    
    // Force fresh generation
    await generateFreshTrends();
  }, [generateFreshTrends]);

  return {
    trends,
    isLoading,
    isComplete,
    hasCache,
    error,
    refresh,
  };
}