'use client';

import { Trend } from '../types/trend';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { Shield, ShieldAlert, ShieldX } from 'lucide-react';
import { parseCitationsToReact } from '../utils/citation-renderer';

const cardVariants = cva(
  'rounded-lg border p-6 transition-all hover:shadow-lg cursor-pointer',
  {
    variants: {
      category: {
        consumer: 'border-blue-200 hover:border-blue-400 bg-blue-50/50',
        competition: 'border-purple-200 hover:border-purple-400 bg-purple-50/50',
        economy: 'border-green-200 hover:border-green-400 bg-green-50/50',
        regulation: 'border-orange-200 hover:border-orange-400 bg-orange-50/50',
      },
    },
  }
);

const categoryBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      category: {
        consumer: 'bg-blue-100 text-blue-800',
        competition: 'bg-purple-100 text-purple-800',
        economy: 'bg-green-100 text-green-800',
        regulation: 'bg-orange-100 text-orange-800',
      },
    },
  }
);

interface TrendCardProps {
  trend: Trend;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  onGenerateNeeds?: () => void;
}

/**
 * Get appropriate icon for source verification status
 */
function getSourceVerificationIcon(verified?: boolean) {
  if (verified === true) {
    return <Shield className="h-3 w-3 text-green-500" />;
  } else if (verified === false) {
    return <ShieldAlert className="h-3 w-3 text-orange-500" />;
  }
  return <ShieldAlert className="h-3 w-3 text-gray-400" />;
}

export function TrendCard({ trend, onAnalyze, isAnalyzing, onGenerateNeeds }: TrendCardProps) {
  const impactColor = trend.impact_score >= 8 ? 'text-red-600' : 
                     trend.impact_score >= 5 ? 'text-yellow-600' : 
                     'text-green-600';

  return (
    <div className={cardVariants({ category: trend.category })}>
      <div className="flex items-start justify-between mb-3">
        <span className={categoryBadgeVariants({ category: trend.category })}>
          {trend.category}
        </span>
        <div className="flex items-center gap-1">
          <span className={clsx('text-sm font-semibold', impactColor)}>
            {trend.impact_score}/10
          </span>
          <span className="text-xs text-gray-500">impact</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {parseCitationsToReact(trend.title)}
      </h3>

      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
        {parseCitationsToReact(trend.summary)}
      </p>

      {/* Web Search Citations */}
      {trend.web_search_citations && trend.web_search_citations.length > 0 && (
        <div className="mb-4 pt-3 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {trend.web_search_citations.map((citation, index) => (
              <a
                key={index}
                href={citation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={citation.title}
              >
                <span className="text-gray-700">[{index + 1}]</span>
                <span className="text-gray-600 truncate max-w-[150px]">{citation.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {trend.source_url ? (
            <div className="flex items-center gap-1">
              {getSourceVerificationIcon(trend.source_verified)}
              <a
                href={trend.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "underline decoration-dotted underline-offset-2 transition-colors",
                  trend.source_verified 
                    ? "hover:text-indigo-600 text-gray-600" 
                    : "hover:text-orange-600 text-orange-600"
                )}
                onClick={(e) => e.stopPropagation()}
                title={
                  trend.source_verified === true 
                    ? "Verified source - URL confirmed accessible"
                    : trend.source_verified === false 
                      ? "Unverified source - URL may not be real"
                      : "Source verification unknown"
                }
              >
                {trend.source}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <ShieldX className="h-3 w-3 text-red-500" />
              <span className="text-red-600">{trend.source} (No Link)</span>
            </div>
          )}
          <span>•</span>
          <span>{new Date(trend.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze();
              }}
              disabled={isAnalyzing}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                isAnalyzing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          )}
          
          {onGenerateNeeds && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateNeeds();
              }}
              className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              Generate Needs
            </button>
          )}
        </div>
      </div>
    </div>
  );
}