/**
 * Simple Trend Grid
 * Simplified version for reliable loading with fast trends hook
 */

import React from 'react';
import { Trend, TrendCategory } from '../types/trend';
import { TrendCard } from './TrendCard';
import { Button } from '@/lib/ui/button';
import { TrendCardSkeleton } from '@/lib/ui/skeleton';
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export interface SimpleTrendGridProps {
  trends: Trend[];
  selectedCategory: TrendCategory | 'all';
  isLoading: boolean;
  isComplete: boolean;
  hasCache: boolean;
  onRefresh: () => void;
  onTrendSelect: (trend: Trend) => void;
  error?: string | null;
}

export function SimpleTrendGrid({
  trends,
  selectedCategory,
  isLoading,
  isComplete,
  hasCache,
  onRefresh,
  onTrendSelect,
  error
}: SimpleTrendGridProps) {
  // Filter trends by category
  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(trend => trend.category === selectedCategory);
  
  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      {(isLoading || isComplete || hasCache) && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          error 
            ? 'bg-red-50 border-red-200'
            : isLoading 
              ? 'bg-blue-50 border-blue-200'
              : 'bg-green-50 border-green-200'
        }`}>
          {isLoading ? (
            <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
          ) : isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Sparkles className="h-5 w-5 text-blue-500" />
          )}
          
          <div className="flex-1">
            <p className={`font-medium ${
              error 
                ? 'text-red-900'
                : isLoading 
                  ? 'text-blue-900'
                  : 'text-green-900'
            }`}>
              {error 
                ? 'Generation Error'
                : isLoading 
                  ? 'Generating fresh trends...'
                  : 'Trends loaded successfully'
              }
            </p>
            <p className={`text-sm ${
              error 
                ? 'text-red-700'
                : isLoading 
                  ? 'text-blue-700'
                  : 'text-green-700'
            }`}>
              {error 
                ? error
                : isLoading 
                  ? 'AI is analyzing current market developments'
                  : `${filteredTrends.length} trends available${hasCache ? ' (with instant cache)' : ''}`
              }
            </p>
          </div>
          
          {hasCache && !isLoading && (
            <div className="flex items-center gap-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              <Sparkles className="h-3 w-3" />
              Instant Load
            </div>
          )}
        </div>
      )}
      
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {selectedCategory === 'all' ? 'All Trends' : `${selectedCategory} Trends`}
          </h2>
          
          <div className="text-sm text-gray-600">
            {filteredTrends.length} {filteredTrends.length === 1 ? 'trend' : 'trends'}
          </div>
        </div>
        
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Generating...' : 'Refresh'}
        </Button>
      </div>
      
      {/* Trend Grid */}
      {isLoading && filteredTrends.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <TrendCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      ) : filteredTrends.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrends.map((trend, index) => (
            <div
              key={trend.id}
              className="animate-fade-in cursor-pointer transition-transform hover:scale-[1.02]"
              style={{
                animationDelay: `${(index % 6) * 100}ms` // Stagger animation
              }}
              onClick={() => onTrendSelect(trend)}
            >
              <TrendCard trend={trend} />
            </div>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No trends found</h3>
            <p className="text-sm">
              {selectedCategory === 'all' 
                ? 'Click refresh to generate fresh trends' 
                : `No ${selectedCategory} trends available. Try refreshing or selecting a different category.`
              }
            </p>
          </div>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Generate Trends
          </Button>
        </div>
      ) : null}
    </div>
  );
}