'use client';

import { useState, useEffect } from 'react';
import { useNeedsStore, useNeedsSelectors } from '../stores/needsStore';
import { WizardStep } from '../types/need';
import { CompanyProfileStep } from './CompanyProfileStep';
import { ChallengesStep } from './ChallengesStep';
import { GoalsStep } from './GoalsStep';
import { ReviewStep } from './ReviewStep';
import { NeedsGenerationStep } from './NeedsGenerationStep';
import { PrioritizationStep } from './PrioritizationStep';
import dynamic from 'next/dynamic';

const SelectedTrendDisplay = dynamic(() => import('./SelectedTrendDisplay').then(mod => ({ default: mod.SelectedTrendDisplay })), {
  ssr: false,
  loading: () => (
    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse"></div>
        <span className="text-sm text-gray-600">Loading selected trend...</span>
      </div>
    </div>
  )
});
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';

const progressBarVariants = cva(
  'h-2 rounded-full transition-all duration-300',
  {
    variants: {
      progress: {
        0: 'w-0',
        16: 'w-1/6',
        33: 'w-1/3',
        50: 'w-1/2',
        66: 'w-2/3', 
        83: 'w-5/6',
        100: 'w-full',
      },
    },
  }
);

const stepIndicatorVariants = cva(
  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
  {
    variants: {
      status: {
        completed: 'bg-green-600 text-white',
        current: 'bg-indigo-600 text-white',
        upcoming: 'bg-gray-200 text-gray-600',
      },
    },
  }
);

interface NeedWizardProps {
  selectedTrendId?: string;
  onComplete?: (needs: any[]) => void;
  onCancel?: () => void;
}

const wizardSteps: { step: WizardStep; title: string; description: string }[] = [
  {
    step: 'company_info',
    title: 'Company Profile',
    description: 'Tell us about your company',
  },
  {
    step: 'challenges',
    title: 'Current Challenges',
    description: 'What challenges are you facing?',
  },
  {
    step: 'goals',
    title: 'Primary Goals',
    description: 'What are your main objectives?',
  },
  {
    step: 'review',
    title: 'Review',
    description: 'Review your information',
  },
  {
    step: 'needs_generation',
    title: 'Generate Needs',
    description: 'AI-powered need discovery',
  },
  {
    step: 'prioritization',
    title: 'Prioritize',
    description: 'Organize and prioritize needs',
  },
];

export function NeedWizard({ selectedTrendId, onComplete, onCancel }: NeedWizardProps) {
  const {
    wizard,
    setCurrentStep,
    setSelectedTrend,
    resetWizard,
    error,
    setError,
  } = useNeedsStore();
  
  const { wizardProgress, isStepCompleted } = useNeedsSelectors();
  const progress = wizardProgress();

  // Initialize with selected trend if provided
  useEffect(() => {
    if (selectedTrendId && selectedTrendId !== wizard.selectedTrendId) {
      setSelectedTrend(selectedTrendId);
    }
  }, [selectedTrendId, wizard.selectedTrendId, setSelectedTrend]);

  const handleStepClick = (step: WizardStep) => {
    const stepIndex = wizardSteps.findIndex(s => s.step === step);
    const currentStepIndex = wizardSteps.findIndex(s => s.step === wizard.currentStep);
    
    // Only allow clicking on completed steps or the next step
    if (stepIndex <= currentStepIndex || isStepCompleted(step)) {
      setCurrentStep(step);
      setError(null);
    }
  };

  const handleNext = () => {
    const currentIndex = wizardSteps.findIndex(s => s.step === wizard.currentStep);
    if (currentIndex < wizardSteps.length - 1) {
      setCurrentStep(wizardSteps[currentIndex + 1].step);
    }
  };

  const handlePrevious = () => {
    const currentIndex = wizardSteps.findIndex(s => s.step === wizard.currentStep);
    if (currentIndex > 0) {
      setCurrentStep(wizardSteps[currentIndex - 1].step);
    }
  };

  const handleCancel = () => {
    resetWizard();
    onCancel?.();
  };

  const handleComplete = () => {
    onComplete?.(wizard.generatedNeeds);
  };

  const renderCurrentStep = () => {
    switch (wizard.currentStep) {
      case 'company_info':
        return <CompanyProfileStep onNext={handleNext} />;
      case 'challenges':
        return <ChallengesStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 'goals':
        return <GoalsStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 'review':
        return <ReviewStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 'needs_generation':
        return <NeedsGenerationStep onNext={handleNext} onPrevious={handlePrevious} />;
      case 'prioritization':
        return (
          <PrioritizationStep 
            onComplete={handleComplete} 
            onPrevious={handlePrevious} 
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Progress Section */}
      <div className="mb-8">        
        {selectedTrendId && (
          <div className="mb-6">
            <SelectedTrendDisplay trendId={selectedTrendId} />
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8 px-4">
        {wizardSteps.map((stepInfo, index) => {
          const isCompleted = isStepCompleted(stepInfo.step);
          const isCurrent = wizard.currentStep === stepInfo.step;
          const isClickable = isCompleted || isCurrent || 
            (index > 0 && isStepCompleted(wizardSteps[index - 1].step));

          return (
            <div key={stepInfo.step} className="flex flex-col items-center">
              <button
                onClick={() => handleStepClick(stepInfo.step)}
                disabled={!isClickable}
                className={clsx(
                  stepIndicatorVariants({
                    status: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming'
                  }),
                  !isClickable && 'cursor-not-allowed opacity-50',
                  isClickable && 'hover:scale-105 cursor-pointer'
                )}
              >
                {isCompleted ? '✓' : index + 1}
              </button>
              <div className="mt-2 text-center">
                <p className="text-xs font-medium text-gray-900">
                  {stepInfo.title}
                </p>
                <p className="text-xs text-gray-500">
                  {stepInfo.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-500">
        Step {wizardSteps.findIndex(s => s.step === wizard.currentStep) + 1} of {wizardSteps.length}
      </div>
    </div>
  );
}