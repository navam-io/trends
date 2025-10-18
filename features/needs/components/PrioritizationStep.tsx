'use client';

import { useState } from 'react';
import { useNeedsStore } from '../stores/needsStore';
import { Need, NeedPriority } from '../types/need';
import { clsx } from 'clsx';

interface PrioritizationStepProps {
  onComplete: () => void;
  onPrevious: () => void;
}

export function PrioritizationStep({ onComplete, onPrevious }: PrioritizationStepProps) {
  const { 
    needs, 
    updateNeedPriority, 
    completeStep,
    toggleNeedSelection,
    selectedNeeds,
  } = useNeedsStore();

  const [matrixView, setMatrixView] = useState(true);

  // Create impact/effort matrix
  const getMatrixQuadrant = (need: Need) => {
    const highImpact = need.impactScore >= 6;
    const lowEffort = need.effortScore <= 5;
    
    if (highImpact && lowEffort) return 'quick_wins';
    if (highImpact && !lowEffort) return 'major_projects';
    if (!highImpact && lowEffort) return 'fill_ins';
    return 'questionable';
  };

  const organizeByMatrix = () => {
    const matrix = {
      quick_wins: needs.filter(need => getMatrixQuadrant(need) === 'quick_wins'),
      major_projects: needs.filter(need => getMatrixQuadrant(need) === 'major_projects'),
      fill_ins: needs.filter(need => getMatrixQuadrant(need) === 'fill_ins'),
      questionable: needs.filter(need => getMatrixQuadrant(need) === 'questionable'),
    };
    return matrix;
  };

  const organizeByPriority = () => {
    const grouped = {
      critical: needs.filter(need => need.priority === 'critical'),
      high: needs.filter(need => need.priority === 'high'),
      medium: needs.filter(need => need.priority === 'medium'),
      low: needs.filter(need => need.priority === 'low'),
    };
    return grouped;
  };

  const handlePriorityChange = (needId: string, priority: NeedPriority) => {
    updateNeedPriority(needId, priority);
  };

  const handleComplete = () => {
    completeStep('prioritization');
    onComplete();
  };

  const handleGenerateSolutions = () => {
    completeStep('prioritization');
    const firstSelectedNeed = needs.find(need => selectedNeeds.includes(need.id));
    if (firstSelectedNeed) {
      window.location.href = `/solutions?needId=${firstSelectedNeed.id}&needTitle=${encodeURIComponent(firstSelectedNeed.title)}&needDescription=${encodeURIComponent(firstSelectedNeed.description)}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderNeedCard = (need: Need, showSelection = false) => (
    <div
      key={need.id}
      className={clsx(
        'border rounded-lg p-4 transition-all hover:shadow-md',
        selectedNeeds.includes(need.id) && showSelection
          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
      onClick={() => showSelection && toggleNeedSelection(need.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900 flex-1">
          {need.title}
        </h4>
        {showSelection && (
          <input
            type="checkbox"
            checked={selectedNeeds.includes(need.id)}
            onChange={() => toggleNeedSelection(need.id)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        )}
      </div>
      
      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {need.description}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Impact: {need.impactScore}</span>
          <span className="text-gray-500">Effort: {need.effortScore}</span>
        </div>
        
        <select
          value={need.priority}
          onChange={(e) => handlePriorityChange(need.id, e.target.value as NeedPriority)}
          className="text-xs border-0 bg-transparent font-medium focus:ring-1 focus:ring-indigo-500 rounded text-gray-900"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="low" className="text-gray-900 bg-white">Low</option>
          <option value="medium" className="text-gray-900 bg-white">Medium</option>
          <option value="high" className="text-gray-900 bg-white">High</option>
          <option value="critical" className="text-gray-900 bg-white">Critical</option>
        </select>
      </div>
    </div>
  );

  if (needs.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No needs generated</h3>
        <p className="mt-1 text-sm text-gray-500">Go back to generate business needs first.</p>
        <div className="mt-6">
          <button
            onClick={onPrevious}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Previous Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Prioritize Business Needs
        </h2>
        <p className="text-sm text-gray-600">
          Review and prioritize your generated business needs. You can adjust priorities and select which needs to focus on first.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMatrixView(true)}
            className={clsx(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              matrixView
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Impact/Effort Matrix
          </button>
          <button
            onClick={() => setMatrixView(false)}
            className={clsx(
              'px-3 py-2 text-sm font-medium rounded-md transition-colors',
              !matrixView
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Priority List
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          {selectedNeeds.length} of {needs.length} needs selected
        </div>
      </div>

      {/* Matrix View */}
      {matrixView && (
        <div className="grid grid-cols-2 gap-4">
          {/* Quick Wins */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-green-600 rounded-full mr-2"></span>
              Quick Wins ({organizeByMatrix().quick_wins.length})
            </h3>
            <p className="text-xs text-green-700 mb-3">High Impact, Low Effort</p>
            <div className="space-y-2">
              {organizeByMatrix().quick_wins.map(need => renderNeedCard(need, true))}
            </div>
          </div>

          {/* Major Projects */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-orange-600 rounded-full mr-2"></span>
              Major Projects ({organizeByMatrix().major_projects.length})
            </h3>
            <p className="text-xs text-orange-700 mb-3">High Impact, High Effort</p>
            <div className="space-y-2">
              {organizeByMatrix().major_projects.map(need => renderNeedCard(need, true))}
            </div>
          </div>

          {/* Fill-ins */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-600 rounded-full mr-2"></span>
              Fill-ins ({organizeByMatrix().fill_ins.length})
            </h3>
            <p className="text-xs text-blue-700 mb-3">Low Impact, Low Effort</p>
            <div className="space-y-2">
              {organizeByMatrix().fill_ins.map(need => renderNeedCard(need, true))}
            </div>
          </div>

          {/* Questionable */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-3 h-3 bg-gray-600 rounded-full mr-2"></span>
              Questionable ({organizeByMatrix().questionable.length})
            </h3>
            <p className="text-xs text-gray-700 mb-3">Low Impact, High Effort</p>
            <div className="space-y-2">
              {organizeByMatrix().questionable.map(need => renderNeedCard(need, true))}
            </div>
          </div>
        </div>
      )}

      {/* Priority List View */}
      {!matrixView && (
        <div className="space-y-4">
          {Object.entries(organizeByPriority()).map(([priority, priorityNeeds]) => (
            <div key={priority} className="space-y-2">
              <h3 className={clsx(
                'text-sm font-medium px-3 py-1 rounded-full inline-block',
                getPriorityColor(priority)
              )}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority ({priorityNeeds.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {priorityNeeds.map(need => renderNeedCard(need, true))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-indigo-900">
              Prioritization Recommendation
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              Start with "Quick Wins" for immediate impact, then tackle "Major Projects" for long-term value. 
              Consider "Fill-ins" when you have spare capacity, and carefully evaluate "Questionable" items.
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleComplete}
            className="px-6 py-2 text-sm font-medium bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Complete Discovery
          </button>
          {selectedNeeds.length > 0 && (
            <button
              type="button"
              onClick={handleGenerateSolutions}
              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              Generate Solutions →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}