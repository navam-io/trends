/**
 * Enhanced Unified Trends Page
 * Merges Trends and Intelligence features into one comprehensive experience
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { Button } from '@/lib/ui/button';
import { Badge } from '@/lib/ui/badge';
import { Input } from '@/lib/ui/input';
import { TrendFilters } from '@/features/trends';
import { TrendCategory } from '@/features/trends';
import { EnhancedTrendGrid } from '@/features/trends/components/EnhancedTrendGrid';
import { TrendRowView } from '@/features/trends/components/TrendRowView';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  Activity,
  Loader2,
  Zap,
  Download,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
}

type ViewMode = 'cards' | 'rows';

export default function EnhancedTrendsPage() {
  const router = useRouter();
  
  // View and UI state
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardExpanded, setDashboardExpanded] = useState(true);

  // Company profile state
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    industry: 'technology',
    size: 'medium', 
    techMaturity: 'high',
  });

  // Feature flags
  const exportEnabled = useFeatureFlag('trends.export');

  // API queries and mutations - always fetch mixed dataset for client-side filtering
  const { data: allTrends, isLoading, error } = trpc.trends.list.useQuery({
    limit: 20, // Always get mixed dataset of 20 trends
  }, {
    staleTime: 30 * 60 * 1000, // 30 minutes - prevent auto-refresh
    gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  });

  const exportMutation = trpc.trends.export.useMutation();

  // Intelligence queries
  const dashboardQuery = trpc.intelligence.getIntelligenceDashboard.useQuery();
  const synthesizeIntelligence = trpc.intelligence.synthesizeMarketIntelligence.useMutation();


  // Client-side filtering - apply category and search filters to master dataset
  const filteredTrends = React.useMemo(() => {
    if (!allTrends) return [];
    
    let filtered = allTrends;
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(trend => trend.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(trend => 
        trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [allTrends, selectedCategory, searchQuery]);

  // Event handlers

  const handleMarketSynthesis = (query: string) => {
    synthesizeIntelligence.mutate({
      query,
      confidenceThreshold: 0.7,
      includeReasoningChain: true,
    });
  };

  const handleExport = () => {
    if (!exportEnabled || !allTrends) return;
    const trendIds = allTrends.map((t) => t.id);
    exportMutation.mutate({ format: 'pdf', trendIds });
  };


  const handleGenerateNeeds = (trendId: string) => {
    router.push(`/needs?trendId=${trendId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI-First Trend Intelligence
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-time market intelligence with multi-agent reasoning
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                  Live Intelligence Active
                </Badge>
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex items-center gap-2 h-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'rows' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('rows')}
                    className="flex items-center gap-2 h-8"
                  >
                    <List className="h-4 w-4" />
                    Rows
                  </Button>
                </div>

                {exportEnabled && allTrends && allTrends.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export PDF'}
                  </Button>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Intelligence Dashboard - Collapsible */}
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Live Intelligence Dashboard
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDashboardExpanded(!dashboardExpanded)}
                    className="p-1"
                  >
                    {dashboardExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              {dashboardExpanded && (
                <CardContent className="space-y-4">
                  {/* Dashboard Metrics */}
                  {dashboardQuery.data ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {dashboardQuery.data.summary.totalInsights}
                        </div>
                        <div className="text-sm text-gray-600">Active Insights</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(dashboardQuery.data.summary.averageConfidence * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(dashboardQuery.data.summary.cacheHitRate * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Cache Hit Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {dashboardQuery.data.systemHealth.agentsOnline}
                        </div>
                        <div className="text-sm text-gray-600">Agents Online</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  )}

                  {/* Live Market Synthesis */}
                  <div className="pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Live Market Intelligence Synthesis</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask the AI intelligence system anything about market trends..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            handleMarketSynthesis(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        disabled={synthesizeIntelligence.isPending}
                        onClick={() => {
                          const input = document.querySelector('input') as HTMLInputElement;
                          if (input?.value) {
                            handleMarketSynthesis(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        {synthesizeIntelligence.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Analyze'
                        )}
                      </Button>
                    </div>

                    {synthesizeIntelligence.data && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {Math.round(synthesizeIntelligence.data.confidence * 100)}% confidence
                          </Badge>
                          <Badge variant="secondary">
                            {synthesizeIntelligence.data.metadata.processingTime}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          {synthesizeIntelligence.data.synthesis}
                        </p>

                        {synthesizeIntelligence.data.crossAgentInsights.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Cross-Agent Insights:</h4>
                            {synthesizeIntelligence.data.crossAgentInsights.map((insight: string, index: number) => (
                              <div key={index} className="text-xs text-gray-600 pl-4 border-l-2 border-blue-200">
                                {insight}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Company Profile & Filters */}
            <div className="space-y-4">
              {/* Company Profile Setup */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    AI Analysis Setup - Configure your company profile for personalized intelligence
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Industry</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.industry}
                      onChange={(e) => setCompanyProfile(prev => ({ ...prev, industry: e.target.value }))}
                    >
                      <option value="technology">Technology</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="finance">Finance</option>
                      <option value="retail">Retail</option>
                      <option value="manufacturing">Manufacturing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Company Size</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.size}
                      onChange={(e) => setCompanyProfile(prev => ({ 
                        ...prev, 
                        size: e.target.value as CompanyProfile['size']
                      }))}
                    >
                      <option value="startup">Startup (1-50)</option>
                      <option value="small">Small (51-200)</option>
                      <option value="medium">Medium (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Tech Maturity</label>
                    <select
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                      value={companyProfile.techMaturity}
                      onChange={(e) => setCompanyProfile(prev => ({ 
                        ...prev, 
                        techMaturity: e.target.value as CompanyProfile['techMaturity']
                      }))}
                    >
                      <option value="low">Low - Basic systems</option>
                      <option value="medium">Medium - Modern stack</option>
                      <option value="high">High - Cutting edge</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <TrendFilters
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search trends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  Failed to load trends. Please try again later.
                </p>
              </div>
            )}

            {/* Export Success */}
            {exportMutation.isSuccess && (
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  {exportMutation.data.message}
                </p>
              </div>
            )}

            {/* Trends Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Enhanced Trend Intelligence ({filteredTrends.length})
                </h2>
                <div className="text-sm text-gray-500">
                  View: {viewMode === 'cards' ? 'Card Grid' : 'Detailed Rows'}
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 bg-white p-6 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : viewMode === 'cards' ? (
                <EnhancedTrendGrid
                  trends={filteredTrends}
                  companyProfile={companyProfile}
                  onGenerateNeeds={handleGenerateNeeds}
                />
              ) : (
                <TrendRowView
                  trends={filteredTrends}
                  companyProfile={companyProfile}
                  onGenerateNeeds={handleGenerateNeeds}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Live Market Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Live Market Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardQuery.data ? (
                  <div className="space-y-3">
                    {dashboardQuery.data.marketSignals.map((signal: { signal: string; strength: string; confidence: number }, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{signal.signal}</span>
                          <Badge 
                            variant={signal.strength === 'strong' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {signal.strength}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          {Math.round(signal.confidence * 100)}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>


            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/needs')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Business Need Discovery
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/solutions')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Solution Marketplace
                </Button>
                {exportEnabled && allTrends && allTrends.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export All Trends'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}