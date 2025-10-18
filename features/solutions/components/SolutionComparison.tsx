'use client'

import { Check, X, Minus } from 'lucide-react'
import type { Solution } from '../types/solution'

interface SolutionComparisonProps {
  solutions: Solution[]
  onSelectWinner?: (solutionId: string) => void
  onClose?: () => void
}

export function SolutionComparison({ solutions, onSelectWinner, onClose }: SolutionComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const getScoreColor = (score: number, inverse: boolean = false) => {
    const adjustedScore = inverse ? 1 - score : score
    if (adjustedScore >= 0.8) return 'text-green-600 bg-green-50'
    if (adjustedScore >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }
  
  const comparisonRows = [
    {
      label: 'Approach',
      getValue: (s: Solution) => s.approach.charAt(0).toUpperCase() + s.approach.slice(1),
      type: 'text'
    },
    {
      label: 'Total Cost (Year 1)',
      getValue: (s: Solution) => formatCurrency(s.estimatedCost.initial + s.estimatedCost.annual),
      type: 'currency',
      inverse: true
    },
    {
      label: 'Monthly Cost',
      getValue: (s: Solution) => formatCurrency(s.estimatedCost.monthly),
      type: 'currency',
      inverse: true
    },
    {
      label: 'Implementation Time',
      getValue: (s: Solution) => `${s.implementationTime.min}-${s.implementationTime.max} ${s.implementationTime.unit}`,
      type: 'text'
    },
    {
      label: '3-Year ROI',
      getValue: (s: Solution) => formatCurrency(s.roi.threeYearReturn),
      type: 'currency'
    },
    {
      label: 'Break-even',
      getValue: (s: Solution) => `${s.roi.breakEvenMonths} months`,
      type: 'text',
      inverse: true
    },
    {
      label: 'Match Score',
      getValue: (s: Solution) => `${Math.round(s.matchScore * 100)}%`,
      type: 'percent',
      score: (s: Solution) => s.matchScore
    },
    {
      label: 'Confidence',
      getValue: (s: Solution) => `${Math.round(s.roi.confidenceScore * 100)}%`,
      type: 'percent',
      score: (s: Solution) => s.roi.confidenceScore
    }
  ]
  
  const featureComparison = [
    {
      category: 'Benefits',
      items: solutions.map(s => s.benefits)
    },
    {
      category: 'Risks',
      items: solutions.map(s => s.risks),
      isNegative: true
    },
    {
      category: 'Requirements',
      items: solutions.map(s => s.requirements)
    }
  ]
  
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Solution Comparison</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Quick Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {solutions.map((solution) => (
                <div
                  key={solution.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{solution.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{solution.description}</p>
                  {solution.vendor && (
                    <p className="text-sm text-gray-500">Vendor: {solution.vendor}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Detailed Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Criteria</th>
                    {solutions.map((solution) => (
                      <th key={solution.id} className="text-center py-3 px-4 font-semibold text-gray-700">
                        {solution.approach.charAt(0).toUpperCase() + solution.approach.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700 font-medium">{row.label}</td>
                      {solutions.map((solution) => (
                        <td key={solution.id} className="py-3 px-4 text-center">
                          {row.score ? (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              getScoreColor(row.score(solution), row.inverse)
                            }`}>
                              {row.getValue(solution)}
                            </span>
                          ) : (
                            <span className="text-gray-900">{row.getValue(solution)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Feature Comparison</h3>
            {featureComparison.map((feature) => (
              <div key={feature.category} className="mb-4">
                <h4 className={`font-medium mb-2 ${
                  feature.isNegative ? 'text-red-700' : 'text-gray-700'
                }`}>
                  {feature.category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {feature.items.map((items, solutionIndex) => (
                    <div
                      key={solutionIndex}
                      className={`rounded-lg p-3 border ${
                        feature.isNegative 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <ul className="space-y-1">
                        {items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className={`text-sm flex items-start gap-2 ${
                              feature.isNegative ? 'text-red-700' : 'text-green-700'
                            }`}
                          >
                            {feature.isNegative ? (
                              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            )}
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Based on your requirements, we recommend the solution with the highest match score
          </p>
          <div className="flex gap-2">
            {solutions.map((solution) => (
              <button
                key={solution.id}
                onClick={() => onSelectWinner?.(solution.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Select {solution.approach}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}