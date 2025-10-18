'use client'

import { Check, Clock, DollarSign, TrendingUp, AlertCircle, Building2, ShoppingCart, Handshake } from 'lucide-react'
import type { Solution } from '../types/solution'
import { useSolutionsStore } from '../stores/solutionsStore'

interface SolutionCardProps {
  solution: Solution
  onSelect?: (solution: Solution) => void
  onCalculateROI?: (solutionId: string) => void
}

const approachConfig = {
  build: {
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Build'
  },
  buy: {
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Buy'
  },
  partner: {
    icon: Handshake,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Partner'
  }
}

export function SolutionCard({ solution, onSelect, onCalculateROI }: SolutionCardProps) {
  const { selectedSolutions, toggleSolutionSelection } = useSolutionsStore()
  const isSelected = selectedSolutions.includes(solution.id)
  const config = approachConfig[solution.approach]
  const Icon = config.icon
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  return (
    <div className={`bg-white rounded-lg border-2 p-6 transition-all ${
      isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{solution.title}</h3>
            {solution.vendor && (
              <p className="text-sm text-gray-600">by {solution.vendor}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleSolutionSelection(solution.id)}
          className={`p-2 rounded-lg transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          }`}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-gray-600 mb-4">{solution.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Total Cost</span>
          </div>
          <p className="font-semibold text-gray-900">
            {formatCurrency(solution.estimatedCost.initial + solution.estimatedCost.annual)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(solution.estimatedCost.monthly)}/mo
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Timeline</span>
          </div>
          <p className="font-semibold text-gray-900">
            {solution.implementationTime.min}-{solution.implementationTime.max} {solution.implementationTime.unit}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">ROI</p>
          <p className="font-semibold text-blue-600">
            {formatCurrency(solution.roi.threeYearReturn)}
          </p>
          <p className="text-xs text-gray-500">3 years</p>
        </div>
        
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Break-even</p>
          <p className="font-semibold text-green-600">
            {solution.roi.breakEvenMonths} mo
          </p>
        </div>
        
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Match</p>
          <p className={`font-semibold ${getMatchScoreColor(solution.matchScore)}`}>
            {Math.round(solution.matchScore * 100)}%
          </p>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Key Benefits</p>
          <div className="flex flex-wrap gap-1">
            {solution.benefits.slice(0, 3).map((benefit, index) => (
              <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {benefit}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Risks</p>
          <div className="flex flex-wrap gap-1">
            {solution.risks.slice(0, 3).map((risk, index) => (
              <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                {risk}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onSelect?.(solution)}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          View Details
        </button>
        <button
          onClick={() => onCalculateROI?.(solution.id)}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Calculate ROI
        </button>
      </div>
    </div>
  )
}