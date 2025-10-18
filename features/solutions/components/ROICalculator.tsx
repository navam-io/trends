'use client'

import { useState } from 'react'
import { X, Calculator, TrendingUp, DollarSign, Clock, PieChart } from 'lucide-react'
import type { Solution } from '../types/solution'

interface ROICalculatorProps {
  solution: Solution
  onClose: () => void
  onSave?: (roiData: any) => void
}

export function ROICalculator({ solution, onClose, onSave }: ROICalculatorProps) {
  const [inputs, setInputs] = useState({
    expectedRevenue: 50000,
    costSavings: 20000,
    productivityGains: 15000,
    customCosts: solution.estimatedCost.annual,
    timeHorizonYears: 3
  })
  
  const [results, setResults] = useState<{
    monthlyROI: number
    annualROI: number
    breakEven: number
    totalReturn: number
    netPresentValue: number
    irr: number
  } | null>(null)
  
  const handleCalculate = () => {
    const totalBenefit = inputs.expectedRevenue + inputs.costSavings + inputs.productivityGains
    const annualCost = inputs.customCosts || solution.estimatedCost.annual
    const initialCost = solution.estimatedCost.initial
    
    const monthlyROI = (totalBenefit / 12) - (annualCost / 12)
    const annualROI = totalBenefit - annualCost
    const breakEven = initialCost / (totalBenefit / 12)
    const totalReturn = (annualROI * inputs.timeHorizonYears) - initialCost
    
    const discountRate = 0.10
    let npv = -initialCost
    for (let year = 1; year <= inputs.timeHorizonYears; year++) {
      npv += annualROI / Math.pow(1 + discountRate, year)
    }
    
    const irr = annualROI / initialCost
    
    setResults({
      monthlyROI,
      annualROI,
      breakEven: Math.ceil(breakEven),
      totalReturn,
      netPresentValue: npv,
      irr
    })
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(value)
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ROI Calculator</h2>
            <p className="text-gray-600 mt-1">{solution.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                Input Parameters
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Annual Revenue Increase
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.expectedRevenue}
                      onChange={(e) => setInputs({...inputs, expectedRevenue: Number(e.target.value)})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Cost Savings
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.costSavings}
                      onChange={(e) => setInputs({...inputs, costSavings: Number(e.target.value)})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Productivity Gains (Annual Value)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.productivityGains}
                      onChange={(e) => setInputs({...inputs, productivityGains: Number(e.target.value)})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Annual Cost (Override)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.customCosts}
                      onChange={(e) => setInputs({...inputs, customCosts: Number(e.target.value)})}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Horizon (Years)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={inputs.timeHorizonYears}
                      onChange={(e) => setInputs({...inputs, timeHorizonYears: Number(e.target.value)})}
                      min="1"
                      max="10"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleCalculate}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Calculate ROI
                </button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                ROI Analysis Results
              </h3>
              
              {results ? (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Monthly ROI</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(results.monthlyROI)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Annual ROI</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(results.annualROI)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-gray-600">Break-even</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {results.breakEven} months
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <PieChart className="w-4 h-4 text-purple-600" />
                        <p className="text-sm text-gray-600">IRR</p>
                      </div>
                      <p className="text-xl font-bold text-purple-600">
                        {formatPercent(results.irr)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Financial Metrics</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Return ({inputs.timeHorizonYears} years)</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(results.totalReturn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Net Present Value (10% discount)</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(results.netPresentValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Initial Investment</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(solution.estimatedCost.initial)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSave?.(results)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Save Analysis
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Enter your parameters and click "Calculate ROI" to see results
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}