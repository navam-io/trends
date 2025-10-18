/**
 * Progressive Trend Grid
 * Shows trends as they arrive from streaming generation
 */

import React from 'react';
import { Trend, TrendCategory } from '../types/trend';
import { TrendCard } from './TrendCard';
import { StreamingProgress } from './streaming-progress';
import { Button } from '@/lib/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';

export interface ProgressiveTrendGridProps {
  trends: Trend[];
  totalTrends: number;
  selectedCategory: TrendCategory | 'all';
  
  // Streaming state
  isLoading: boolean;
  isStreaming: boolean;
  isComplete: boolean;
  hasCache: boolean;
  
  // Progress
  progress: number;
  batchesReceived: number;
  totalBatches: number;
  estimatedTimeRemaining: number;
  
  // Actions
  onRefresh: () => void;
  onTrendSelect: (trend: Trend) => void;
  
  // Error handling
  error?: string | null;
}

export function ProgressiveTrendGrid({
  trends,
  totalTrends,
  selectedCategory,
  isLoading,
  isStreaming,
  isComplete,
  hasCache,
  progress,
  batchesReceived,
  totalBatches,
  estimatedTimeRemaining,
  onRefresh,
  onTrendSelect,
  error
}: ProgressiveTrendGridProps) {
  // Filter trends by category
  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(trend => trend.category === selectedCategory);
  
  // Show skeletons for expected trends while loading
  const expectedCount = selectedCategory === 'all' ? 20 : 5;
  const showSkeletons = isStreaming && filteredTrends.length < expectedCount;
  const skeletonCount = Math.max(0, expectedCount - filteredTrends.length);
  
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {(isStreaming || isComplete || error) && (
        <StreamingProgress
          progress={progress}
          batchesReceived={batchesReceived}
          totalBatches={totalBatches}
          estimatedTimeRemaining={estimatedTimeRemaining}
          isComplete={isComplete}
          hasCache={hasCache}
          error={error}
          totalTrends={totalTrends}
        />
      )}
      
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {selectedCategory === 'all' ? 'All Trends' : `${selectedCategory} Trends`}
          </h2>
          
          {hasCache && !isStreaming && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Sparkles className="h-4 w-4" />
              Instant cache + fresh data
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            {filteredTrends.length} {filteredTrends.length === 1 ? 'trend' : 'trends'}
            {isStreaming && ` (${batchesReceived}/${totalBatches} batches)`}
          </div>
        </div>
        
        <Button
          onClick={onRefresh}
          disabled={isStreaming}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isStreaming ? 'animate-spin' : ''}`} />
          {isStreaming ? 'Generating...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Trend Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Real Trends */}
        {filteredTrends.map((trend, index) => (
          <div
            key={trend.id}
            className="animate-fade-in"
            style={{
              animationDelay: `${(index % 5) * 100}ms` // Stagger animation within batch
            }}
          >
            <div 
              onClick={() => onTrendSelect(trend)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <TrendCard trend={trend} />
            </div>
          </div>
        ))}
        
        {/* Skeleton Cards */}
        {showSkeletons && Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="animate-pulse bg-white border border-gray-200 rounded-lg p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State */}
      {!isLoading && !isStreaming && filteredTrends.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No trends found</h3>
            <p className="text-sm">
              {selectedCategory === 'all' 
                ? 'Try refreshing to generate fresh trends' 
                : `No ${selectedCategory} trends available. Try refreshing or selecting a different category.`
              }
            </p>
          </div>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Trends
          </Button>
        </div>
      )}
    </div>
  );
}