'use client';

import { useState } from 'react';
import { useNeedsStore } from '../stores/needsStore';
import { clsx } from 'clsx';

interface GoalsStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

const primaryGoals = [
  { id: 'increase_revenue', label: 'Increase Revenue', description: 'Drive growth and expand market share' },
  { id: 'reduce_costs', label: 'Reduce Costs', description: 'Optimize operations and cut expenses' },
  { id: 'improve_efficiency', label: 'Improve Efficiency', description: 'Streamline processes and increase productivity' },
  { id: 'enhance_customer_experience', label: 'Enhance Customer Experience', description: 'Improve satisfaction and loyalty' },
  { id: 'accelerate_innovation', label: 'Accelerate Innovation', description: 'Foster creativity and new product development' },
  { id: 'expand_market_reach', label: 'Expand Market Reach', description: 'Enter new markets or customer segments' },
  { id: 'improve_decision_making', label: 'Improve Decision Making', description: 'Better data-driven insights and analytics' },
  { id: 'ensure_compliance', label: 'Ensure Compliance', description: 'Meet regulatory requirements and standards' },
  { id: 'attract_retain_talent', label: 'Attract & Retain Talent', description: 'Build a strong, skilled workforce' },
  { id: 'strengthen_competitive_advantage', label: 'Strengthen Competitive Advantage', description: 'Differentiate from competitors' },
];

export function GoalsStep({ onNext, onPrevious }: GoalsStepProps) {
  const { wizard, updateCompanyContext, completeStep, setError } = useNeedsStore();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    wizard.companyContext.primaryGoals || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGoals.length === 0) {
      setError('Please select at least one primary goal');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      updateCompanyContext({ primaryGoals: selectedGoals });
      completeStep('goals');
      onNext();
    } catch (error) {
      setError('Failed to save goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Primary Goals
        </h2>
        <p className="text-sm text-gray-600">
          What are your company's main objectives for the next 12-18 months? Select all that apply.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {primaryGoals.map((goal) => (
            <div
              key={goal.id}
              className={clsx(
                'relative rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md',
                selectedGoals.includes(goal.id)
                  ? 'border-green-600 bg-green-50 ring-2 ring-green-600'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              )}
              onClick={() => toggleGoal(goal.id)}
            >
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    type="checkbox"
                    checked={selectedGoals.includes(goal.id)}
                    onChange={() => toggleGoal(goal.id)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label className="font-medium text-gray-900 cursor-pointer">
                    {goal.label}
                  </label>
                  <p className="text-gray-500">{goal.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedGoals.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Selected {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''}. 
                  We'll prioritize business needs that align with these objectives.
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
            disabled={isSubmitting || selectedGoals.length === 0}
            className={clsx(
              'px-6 py-2 text-sm font-medium rounded-md transition-colors',
              isSubmitting || selectedGoals.length === 0
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