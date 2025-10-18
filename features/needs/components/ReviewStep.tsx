'use client';

import { useNeedsStore } from '../stores/needsStore';
import { trpc } from '@/lib/trpc/client';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Trend } from '@/features/trends/types/trend';

interface ReviewStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function ReviewStep({ onNext, onPrevious }: ReviewStepProps) {
  const { wizard, completeStep } = useNeedsStore();
  const { companyContext, selectedTrendId } = wizard;
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch the selected trend using tRPC
  const getTrendQuery = trpc.trends.getById.useQuery(
    { trendId: selectedTrendId! },
    { enabled: !!selectedTrendId }
  );

  useEffect(() => {
    if (selectedTrendId) {
      setLoading(true);
    }
  }, [selectedTrendId]);

  useEffect(() => {
    if (getTrendQuery.data) {
      setSelectedTrend(getTrendQuery.data);
      setLoading(false);
    } else if (getTrendQuery.error) {
      console.error('Error fetching trend:', getTrendQuery.error);
      setSelectedTrend(null);
      setLoading(false);
    } else if (!getTrendQuery.isLoading && !getTrendQuery.data) {
      setLoading(false);
    }
  }, [getTrendQuery.data, getTrendQuery.error, getTrendQuery.isLoading]);

  const handleContinue = () => {
    completeStep('review');
    onNext();
  };

  const formatList = (items: string[] = []) => {
    return items.map(item => item.replace(/_/g, ' ')).join(', ');
  };

  const getIndustryLabel = (industry: string) => {
    const industries = {
      technology: 'Technology',
      healthcare: 'Healthcare',
      finance: 'Financial Services',
      retail: 'Retail & E-commerce',
      manufacturing: 'Manufacturing',
      education: 'Education',
      government: 'Government',
      other: 'Other',
    };
    return industries[industry as keyof typeof industries] || industry;
  };

  const getSizeLabel = (size: string) => {
    const sizes = {
      startup: 'Startup (1-50 employees)',
      small: 'Small (51-200 employees)',
      medium: 'Medium (201-1000 employees)',
      enterprise: 'Enterprise (1000+ employees)',
    };
    return sizes[size as keyof typeof sizes] || size;
  };

  const getTechMaturityLabel = (maturity: string) => {
    const levels = {
      low: 'Low - Limited technology adoption',
      medium: 'Medium - Some digital transformation',
      high: 'High - Advanced technology integration',
    };
    return levels[maturity as keyof typeof levels] || maturity;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Review Your Information
        </h2>
        <p className="text-sm text-gray-600">
          Please review the information below before we generate personalized business needs for your company.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Profile</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-700">Company Name</dt>
              <dd className="text-sm text-gray-900">{companyContext.name || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">Industry</dt>
              <dd className="text-sm text-gray-900">
                {companyContext.industry ? getIndustryLabel(companyContext.industry) : 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">Company Size</dt>
              <dd className="text-sm text-gray-900">
                {companyContext.size ? getSizeLabel(companyContext.size) : 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">Technology Maturity</dt>
              <dd className="text-sm text-gray-900">
                {companyContext.techMaturity ? getTechMaturityLabel(companyContext.techMaturity) : 'Not specified'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Selected Trend */}
        {selectedTrend && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Selected AI Trend</h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-blue-900">{selectedTrend.title}</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedTrend.summary}</p>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedTrend.category}
                </span>
                <span className="text-blue-600">
                  Impact: {selectedTrend.impact_score}/10
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Challenges */}
      <div className="bg-red-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Challenges</h3>
        {companyContext.currentChallenges && companyContext.currentChallenges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {companyContext.currentChallenges.map((challenge) => (
              <span
                key={challenge}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-red-100 text-red-800"
              >
                {challenge.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No challenges specified</p>
        )}
      </div>

      {/* Primary Goals */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Goals</h3>
        {companyContext.primaryGoals && companyContext.primaryGoals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {companyContext.primaryGoals.map((goal) => (
              <span
                key={goal}
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-green-100 text-green-800"
              >
                {goal.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No goals specified</p>
        )}
      </div>

      {/* AI Generation Preview */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-indigo-900">
              Ready for AI Analysis
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              Our AI will analyze the selected trend in context of your company profile, challenges, and goals 
              to generate specific, actionable business needs tailored to your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Generate Business Needs
        </button>
      </div>
    </div>
  );
}