'use client';

import { trpc } from '@/lib/trpc/client';
import { Badge } from '@/lib/ui/badge';
import { Card, CardContent } from '@/lib/ui/card';
import {
  TrendingUp,
  ExternalLink,
  Calendar,
  Target,
  Loader2
} from 'lucide-react';
import { parseCitationsToReact } from '@/features/trends/utils/citation-renderer';

interface SelectedTrendDisplayProps {
  trendId: string;
}

export function SelectedTrendDisplay({ trendId }: SelectedTrendDisplayProps) {
  const { data: trend, isLoading, error } = trpc.trends.getById.useQuery(
    { trendId },
    { 
      enabled: !!trendId,
      // Retry only once if not found
      retry: 1,
      // Use cache from trends list if available
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Helper functions from TrendRowView for consistent styling
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'consumer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'competition': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'economy': return 'bg-green-100 text-green-800 border-green-200';
      case 'regulation': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeftBorderColor = (category: string) => {
    switch (category) {
      case 'consumer': return 'border-l-blue-500';
      case 'competition': return 'border-l-purple-500';
      case 'economy': return 'border-l-green-500';
      case 'regulation': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-sm text-gray-600">Loading selected trend...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !trend) {
    return (
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Selected Trend Not Available
              </span>
            </div>
            <div className="text-xs text-orange-700">
              The trend you selected may no longer be available. This can happen if trends were regenerated or your session expired.
            </div>
            <div className="flex items-center gap-2 mt-2">
              <a 
                href="/trends" 
                className="text-xs text-orange-800 hover:text-orange-900 underline font-medium"
              >
                ← Back to Trends
              </a>
              <span className="text-xs text-orange-600">or continue with the discovery wizard below</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mb-6 border-l-4 ${getLeftBorderColor(trend.category)}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>Selected Trend</span>
          </div>
        </div>

        {/* Trend Title */}
        <h3 className="font-semibold text-gray-900 text-base mb-3">
          {parseCitationsToReact(trend.title)}
        </h3>
        
        {/* Metadata badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge className={`text-xs ${getCategoryColor(trend.category)}`}>
            {trend.category}
          </Badge>
          
          <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(trend.impact_score)}`}>
            Impact: {trend.impact_score}/10
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            <span>{new Date(trend.created_at).toLocaleDateString()}</span>
          </div>
          
          {/* Source link */}
          <a 
            href={trend.source_url || `https://google.com/search?q=${encodeURIComponent(trend.source)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            <span>{trend.source}</span>
          </a>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {parseCitationsToReact(trend.summary)}
        </p>

        {/* Helper text */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            We'll generate business needs based on this trend and your company profile.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}