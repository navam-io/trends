'use client';

import { useState } from 'react';
import { useNeedsStore } from '../stores/needsStore';
import { clsx } from 'clsx';

interface ChallengesStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

const commonChallenges = [
  { id: 'operational_efficiency', label: 'Operational Inefficiencies', description: 'Manual processes and workflow bottlenecks' },
  { id: 'data_silos', label: 'Data Silos', description: 'Disconnected systems and poor data visibility' },
  { id: 'customer_experience', label: 'Customer Experience', description: 'Improving customer satisfaction and retention' },
  { id: 'scalability', label: 'Scalability Issues', description: 'Growing business straining current systems' },
  { id: 'competition', label: 'Increased Competition', description: 'Staying competitive in changing markets' },
  { id: 'talent_shortage', label: 'Talent Shortage', description: 'Finding and retaining skilled workers' },
  { id: 'regulatory_compliance', label: 'Regulatory Compliance', description: 'Meeting industry regulations and standards' },
  { id: 'cost_management', label: 'Cost Management', description: 'Reducing operational costs while maintaining quality' },
  { id: 'digital_transformation', label: 'Digital Transformation', description: 'Modernizing legacy systems and processes' },
  { id: 'cybersecurity', label: 'Cybersecurity Risks', description: 'Protecting against security threats and breaches' },
];

export function ChallengesStep({ onNext, onPrevious }: ChallengesStepProps) {
  const { wizard, updateCompanyContext, completeStep, setError } = useNeedsStore();
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(
    wizard.companyContext.currentChallenges || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleChallenge = (challengeId: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChallenges.length === 0) {
      setError('Please select at least one current challenge');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      updateCompanyContext({ currentChallenges: selectedChallenges });
      completeStep('challenges');
      onNext();
    } catch (error) {
      setError('Failed to save challenges');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Current Challenges
        </h2>
        <p className="text-sm text-gray-600">
          Select the main challenges your company is currently facing. This helps us identify relevant needs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commonChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className={clsx(
                'relative rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md',
                selectedChallenges.includes(challenge.id)
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              )}
              onClick={() => toggleChallenge(challenge.id)}
            >
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    checked={selectedChallenges.includes(challenge.id)}
                    onChange={() => toggleChallenge(challenge.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-900 cursor-pointer">
                    {challenge.label}
                  </label>
                  <p className="text-gray-500">{challenge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedChallenges.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Selected {selectedChallenges.length} challenge{selectedChallenges.length !== 1 ? 's' : ''}. 
                  Our AI will focus on these areas when generating business needs.
                </p>
              </div>
            </div>
          </div>
        )}

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
            type="submit"
            disabled={isSubmitting || selectedChallenges.length === 0}
            className={clsx(
              'px-6 py-2 text-sm font-medium rounded-md transition-colors',
              isSubmitting || selectedChallenges.length === 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
            )}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}