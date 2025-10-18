'use client';

import { Trend } from '../types/trend';
import { TrendCard } from './TrendCard';

interface TrendGridProps {
  trends: Trend[];
  onAnalyzeTrend?: (trendId: string) => void;
  analyzingTrendId?: string | null;
  onGenerateNeeds?: (trendId: string) => void;
}

export function TrendGrid({ trends, onAnalyzeTrend, analyzingTrendId, onGenerateNeeds }: TrendGridProps) {
  if (trends.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No trends found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trends.map((trend) => (
        <TrendCard
          key={trend.id}
          trend={trend}
          onAnalyze={onAnalyzeTrend ? () => onAnalyzeTrend(trend.id) : undefined}
          isAnalyzing={analyzingTrendId === trend.id}
          onGenerateNeeds={onGenerateNeeds ? () => onGenerateNeeds(trend.id) : undefined}
        />
      ))}
    </div>
  );
}