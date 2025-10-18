/**
 * Streaming Progress Indicator
 * Shows real-time progress for trend generation
 */

import React from 'react';
import { Progress } from '@/lib/ui/progress';
import { Badge } from '@/lib/ui/badge';
import { Loader2, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export interface StreamingProgressProps {
  progress: number; // 0-1
  batchesReceived: number;
  totalBatches: number;
  estimatedTimeRemaining: number; // milliseconds
  isComplete: boolean;
  hasCache: boolean;
  error?: string | null;
  totalTrends: number;
}

export function StreamingProgress({
  progress,
  batchesReceived,
  totalBatches,
  estimatedTimeRemaining,
  isComplete,
  hasCache,
  error,
  totalTrends
}: StreamingProgressProps) {
  const progressPercentage = Math.round(progress * 100);
  const timeRemainingSeconds = Math.ceil(estimatedTimeRemaining / 1000);
  
  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <div className="flex-1">
          <p className="font-medium text-red-900">Generation Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  if (isComplete) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <div className="flex-1">
          <p className="font-medium text-green-900">Generation Complete</p>
          <p className="text-sm text-green-700">
            Generated {totalTrends} fresh trends with real-time data
          </p>
        </div>
        {hasCache && (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Cached + Fresh
          </Badge>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          <div>
            <p className="font-medium text-blue-900">
              {hasCache ? 'Refreshing with latest trends' : 'Generating fresh trends'}
            </p>
            <p className="text-sm text-blue-700">
              AI is searching the web for current developments
            </p>
          </div>
        </div>
        
        {hasCache && (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            <Zap className="h-3 w-3 mr-1" />
            Instant Cache
          </Badge>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">
            Batch {batchesReceived} of {totalBatches} completed
          </span>
          <span className="font-medium text-blue-900">
            {progressPercentage}%
          </span>
        </div>
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-blue-100"
          indicatorClassName="bg-blue-500"
        />
      </div>
      
      {/* Time Remaining */}
      {estimatedTimeRemaining > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Clock className="h-4 w-4" />
          <span>
            {timeRemainingSeconds > 60 
              ? `~${Math.ceil(timeRemainingSeconds / 60)} min remaining`
              : `~${timeRemainingSeconds}s remaining`
            }
          </span>
        </div>
      )}
      
      {/* Batch Status */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: totalBatches }).map((_, index) => {
          const isReceived = index < batchesReceived;
          const isCurrent = index === batchesReceived;
          
          return (
            <div
              key={index}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-colors
                ${isReceived 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }
              `}
            >
              {isReceived ? '✓' : isCurrent ? '⟳' : '○'} Batch {index + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}