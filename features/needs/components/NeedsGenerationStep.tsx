'use client';

import { useState, useEffect } from 'react';
import { useNeedsStore } from '../stores/needsStore';
import { trpc } from '@/lib/trpc/client';
import { Need } from '../types/need';
import { clsx } from 'clsx';
import { ErrorDisplay } from '@/lib/ui/error-display';
import { ProgressLoader, NeedCardSkeleton } from '@/lib/ui/skeleton';

interface NeedsGenerationStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function NeedsGenerationStep({ onNext, onPrevious }: NeedsGenerationStepProps) {
  const { 
    wizard, 
    setGeneratedNeeds, 
    completeStep, 
    setError,
    isGenerating,
    setGenerating
  } = useNeedsStore();
  
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [generatedNeeds, setLocalGeneratedNeeds] = useState<Need[]>([]);

  const generateNeedsMutation = trpc.needs.generateFromTrend.useMutation({
    onSuccess: (needs) => {
      setLocalGeneratedNeeds(needs);
      setGeneratedNeeds(needs);
      setGenerationStatus('success');
      setError(null);
    },
    onError: (error) => {
      setError(error.message || 'Failed to generate business needs');
      setGenerationStatus('error');
    },
    onSettled: () => {
      setGenerating(false);
    },
  });

  const handleGenerate = async () => {
    if (!wizard.selectedTrendId || !wizard.companyContext.id) {
      setError('Missing trend or company information');
      return;
    }

    setGenerating(true);
    setGenerationStatus('generating');
    setError(null);

    try {
      await generateNeedsMutation.mutateAsync({
        trendId: wizard.selectedTrendId,
        companyContext: wizard.companyContext as any, // Type assertion for required fields
        maxNeeds: 5,
      });
    } catch (error) {
      // Error handled in mutation callbacks
    }
  };

  const handleContinue = () => {
    completeStep('needs_generation');
    onNext();
  };

  const handleRegenerate = () => {
    setGenerationStatus('idle');
    setLocalGeneratedNeeds([]);
    handleGenerate();
  };

  // Auto-generate on component mount if not already generated
  useEffect(() => {
    if (generationStatus === 'idle' && wizard.generatedNeeds.length === 0) {
      handleGenerate();
    } else if (wizard.generatedNeeds.length > 0) {
      setLocalGeneratedNeeds(wizard.generatedNeeds);
      setGenerationStatus('success');
    }
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      automation: 'bg-purple-100 text-purple-800',
      data_insights: 'bg-blue-100 text-blue-800',
      customer_experience: 'bg-green-100 text-green-800',
      operational_efficiency: 'bg-indigo-100 text-indigo-800',
      competitive_advantage: 'bg-red-100 text-red-800',
      risk_management: 'bg-orange-100 text-orange-800',
      cost_reduction: 'bg-yellow-100 text-yellow-800',
      innovation: 'bg-pink-100 text-pink-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          AI-Generated Business Needs
        </h2>
        <p className="text-sm text-gray-600">
          Based on your company profile and selected trend, our AI has generated personalized business needs.
        </p>
      </div>

      {/* Generation Status */}
      {generationStatus === 'generating' && (
        <>
          <ProgressLoader 
            message="Analyzing your company context and trend..." 
            showAfter={0}
          />
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <NeedCardSkeleton key={i} />
            ))}
          </div>
        </>
      )}

      {/* Error State */}
      {generationStatus === 'error' && (
        <ErrorDisplay 
          error={new Error('Failed to generate business needs')}
          onRetry={handleRegenerate}
        />
      )}

      {/* Success State - Generated Needs */}
      {generationStatus === 'success' && generatedNeeds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Generated Business Needs ({generatedNeeds.length})
            </h3>
            <button
              onClick={handleRegenerate}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {generatedNeeds.map((need, index) => (
              <div
                key={need.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 flex-1">
                    {need.title}
                  </h4>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={clsx(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getPriorityColor(need.priority)
                    )}>
                      {need.priority}
                    </span>
                    <span className={clsx(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      getCategoryColor(need.category)
                    )}>
                      {need.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {need.description}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Impact: </span>
                    <span className="text-gray-900">{need.impactScore}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Effort: </span>
                    <span className="text-gray-900">{need.effortScore}/10</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Urgency: </span>
                    <span className="text-gray-900">{need.urgencyScore}/10</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Business Value: </span>
                    <span className="text-gray-900">{need.businessValue}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Stakeholders: </span>
                    <span className="text-gray-900">{need.stakeholders.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Successfully generated {generatedNeeds.length} personalized business needs. 
                  Next, we'll help you prioritize them for maximum impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isGenerating}
          className={clsx(
            'px-6 py-2 text-sm font-medium border rounded-md transition-colors',
            isGenerating
              ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          )}
        >
          Previous
        </button>
        
        <button
          type="button"
          onClick={handleContinue}
          disabled={isGenerating || generationStatus !== 'success'}
          className={clsx(
            'px-6 py-2 text-sm font-medium rounded-md transition-colors',
            isGenerating || generationStatus !== 'success'
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          )}
        >
          {isGenerating ? 'Generating...' : 'Continue to Prioritization'}
        </button>
      </div>
    </div>
  );
}