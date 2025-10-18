'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Filter, Sparkles, ArrowRight, Building2, ShoppingCart, Handshake } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSolutionsStore } from '../stores/solutionsStore'
import { useNeedsStore } from '@/features/needs/stores/needsStore'
import { SolutionCard } from './SolutionCard'
import { ROICalculator } from './ROICalculator'
import type { SolutionApproach } from '../types/solution'
import { ErrorDisplay } from '@/lib/ui/error-display'
import { ProgressLoader, SolutionCardSkeleton } from '@/lib/ui/skeleton'

export function SolutionMatching() {
  const searchParams = useSearchParams()
  const needId = searchParams.get('needId')
  const needTitle = searchParams.get('needTitle')
  const needDescription = searchParams.get('needDescription')
  
  const [selectedApproach, setSelectedApproach] = useState<SolutionApproach | 'all'>('all')
  const [showROICalculator, setShowROICalculator] = useState(false)
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(null)
  const [viewDetailsSolution, setViewDetailsSolution] = useState<typeof solutions[0] | null>(null)
  
  const { 
    solutions, 
    setSolutions, 
    isGenerating, 
    setIsGenerating,
    selectedSolutions 
  } = useSolutionsStore()
  
  // Get rich context from needs store
  const { wizard } = useNeedsStore()
  
  const generateSolutions = trpc.solutions.generateSolutions.useMutation({
    onSuccess: (result) => {
      if (result.success && result.data) {
        setSolutions(result.data)
      }
      setIsGenerating(false)
    },
    onError: (error) => {
      console.error('Error generating solutions:', error)
      setIsGenerating(false)
    }
  })
  
  const getSolutions = trpc.solutions.getSolutionsByNeed.useQuery(
    { needId: needId || '' },
    { 
      enabled: !!needId && solutions.length === 0
    }
  )
  
  useEffect(() => {
    if (getSolutions.data?.success && getSolutions.data?.data) {
      setSolutions(getSolutions.data.data)
    }
  }, [getSolutions.data, setSolutions])
  
  useEffect(() => {
    if (needId && needTitle && needDescription && solutions.length === 0) {
      handleGenerateSolutions()
    }
  }, [needId, needTitle, needDescription])
  
  const handleGenerateSolutions = () => {
    if (!needId || !needTitle || !needDescription) return
    
    setIsGenerating(true)
    
    // Build enriched context from needs store
    const ctx = wizard.companyContext || {}
    const enrichedContext = {
      name: ctx.name || 'Your Company',
      industry: ctx.industry || 'technology',
      size: ctx.size || 'small-medium',
      maturity: ctx.techMaturity || 'medium',
      challenges: ctx.currentChallenges || [],
      goals: ctx.primaryGoals || [],
      budget: ctx.size === 'large' || ctx.size === 'government' ? 'High' : ctx.size === 'startup' ? 'Low' : 'Medium',
      trendContext: wizard.selectedTrendId ? `This need was generated from trend analysis (Trend ID: ${wizard.selectedTrendId})` : undefined
    }
    
    console.log('Generating solutions with context:', enrichedContext)
    
    generateSolutions.mutate({
      needId,
      needTitle,
      needDescription,
      companyContext: enrichedContext,
      preferences: {
        riskTolerance: 'medium'
      }
    })
  }
  
  const handleViewDetails = (solution: typeof solutions[0]) => {
    setViewDetailsSolution(solution)
  }

  const handleCalculateROI = (solutionId: string) => {
    setSelectedSolutionId(solutionId)
    setShowROICalculator(true)
  }
  
  const filteredSolutions = solutions.filter(solution => 
    selectedApproach === 'all' || solution.approach === selectedApproach
  )
  
  const approachOptions = [
    { value: 'all', label: 'All Approaches', icon: Filter },
    { value: 'build', label: 'Build', icon: Building2 },
    { value: 'buy', label: 'Buy', icon: ShoppingCart },
    { value: 'partner', label: 'Partner', icon: Handshake }
  ]
  
  if (isGenerating || getSolutions.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Solution Marketplace</h1>
            <p className="text-gray-600 mt-1">
              AI-matched solutions for your business needs
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProgressLoader message="Generating AI-powered solutions..." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(3)].map((_, i) => (
              <SolutionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (generateSolutions.isError || getSolutions.isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Solution Marketplace</h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay 
            error={generateSolutions.error || getSolutions.error} 
            onRetry={() => handleGenerateSolutions()}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solution Marketplace</h1>
              <p className="text-gray-600 mt-1">
                AI-matched solutions for your business needs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {solutions.length} solutions generated
              </span>
            </div>
          </div>
          
          {needTitle && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Solving for:</p>
              <p className="text-gray-900 font-semibold">{needTitle}</p>
              <p className="text-gray-600 text-sm mt-1">{needDescription}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filter by Approach</span>
          </div>
          <div className="flex gap-2">
            {approachOptions.map(option => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedApproach(option.value as SolutionApproach | 'all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    selectedApproach === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {filteredSolutions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No solutions found for the selected filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSolutions.map(solution => (
              <SolutionCard
                key={solution.id}
                solution={solution}
                onSelect={handleViewDetails}
                onCalculateROI={handleCalculateROI}
              />
            ))}
          </div>
        )}
        
        {selectedSolutions.length > 1 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-gray-700">
                <span className="font-semibold">{selectedSolutions.length} solutions</span> selected for comparison
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                Compare Solutions
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewDetailsSolution && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setViewDetailsSolution(null)}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{viewDetailsSolution.title}</h2>
                  {viewDetailsSolution.vendor && (
                    <p className="text-gray-600 mt-1">by {viewDetailsSolution.vendor}</p>
                  )}
                </div>
                <button
                  onClick={() => setViewDetailsSolution(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700">{viewDetailsSolution.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Cost Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initial Cost:</span>
                        <span className="font-medium">${viewDetailsSolution.estimatedCost.initial.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className="font-medium">${viewDetailsSolution.estimatedCost.monthly.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Annual:</span>
                        <span className="font-medium">${viewDetailsSolution.estimatedCost.annual.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">ROI Projections</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">3-Year Return:</span>
                        <span className="font-medium text-green-600">${viewDetailsSolution.roi.threeYearReturn.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Break-even:</span>
                        <span className="font-medium">{viewDetailsSolution.roi.breakEvenMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confidence:</span>
                        <span className="font-medium">{Math.round(viewDetailsSolution.roi.confidenceScore * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Key Benefits</h3>
                  <ul className="space-y-1">
                    {viewDetailsSolution.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Risks to Consider</h3>
                  <ul className="space-y-1">
                    {viewDetailsSolution.risks.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">!</span>
                        <span className="text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Requirements</h3>
                  <ul className="space-y-1">
                    {viewDetailsSolution.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">→</span>
                        <span className="text-gray-700">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {viewDetailsSolution.alternatives && viewDetailsSolution.alternatives.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Alternative Solutions</h3>
                    <div className="flex flex-wrap gap-2">
                      {viewDetailsSolution.alternatives.map((alt, i) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ROI Calculator Modal */}
        {showROICalculator && selectedSolutionId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ROICalculator
              solution={solutions.find(s => s.id === selectedSolutionId)!}
              onClose={() => {
                setShowROICalculator(false)
                setSelectedSolutionId(null)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}