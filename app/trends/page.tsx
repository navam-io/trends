'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { TrendFilters } from '@/features/trends';
import { TrendCategory, Trend } from '@/features/trends';
import { SimpleTrendGrid } from '@/features/trends/components/simple-trend-grid';
import { useFastTrends } from '@/features/trends/hooks/use-fast-trends';
import { TrendRowView } from '@/features/trends/components/TrendRowView';
import { TrendPersonalization, type PersonalizationProfile } from '@/features/trends/components/TrendPersonalization';
import { trpc } from '@/lib/trpc/client';
import { useFeatureFlag } from '@/lib/flags';
import { 
  TrendingUp, 
  Download,
  Grid3X3,
  List,
  Search,
  Settings
} from 'lucide-react';
import { ErrorDisplay } from '@/lib/ui/error-display';
import { TrendCardSkeleton, ProgressLoader } from '@/lib/ui/skeleton';

interface CompanyProfile {
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  techMaturity: 'low' | 'medium' | 'high';
  domain?: string;
  priorities?: string[];
}

type ViewMode = 'cards' | 'rows';

export default function TrendsPage() {
  const router = useRouter();
  
  // View and UI state
  const [selectedCategory, setSelectedCategory] = useState<TrendCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Company profile state
  const [companyProfile] = useState<CompanyProfile>({
    industry: 'technology',
    size: 'medium', 
    techMaturity: 'high',
    domain: '',
    priorities: ['scalability', 'innovation'],
  });

  // Personalization state
  const [isGeneratingPersonalized, setIsGeneratingPersonalized] = useState(false);


  // Hydration-safe state to prevent SSR/client mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Feature flags
  const exportEnabled = useFeatureFlag('trends.export');

  // Fast trends hook - provides instant cache + fresh generation
  const fastTrends = useFastTrends({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    limit: 20,
    autoStart: true,
  });

  const exportMutation = trpc.trends.export.useMutation();
  const regenerateTrendsMutation = trpc.trends.regenerateForProfile.useMutation({
    onSuccess: () => {
      // Force refresh using fast trends hook
      fastTrends.refresh();
    },
    onError: (error) => {
      console.error('Failed to regenerate personalized trends:', error);
    },
  });



  // Client-side filtering - apply search filters (category is handled by hook)
  const filteredTrends = React.useMemo(() => {
    if (!fastTrends.trends) return [];
    
    let filtered = fastTrends.trends;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(trend => 
        trend.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [fastTrends.trends, searchQuery]);



  const handleExport = () => {
    if (!exportEnabled || !fastTrends.trends) return;
    const trendIds = fastTrends.trends.map((t) => t.id);
    exportMutation.mutate({ format: 'pdf', trendIds });
  };


  const handleGenerateNeeds = (trendId: string) => {
    // The personalization profile will be automatically loaded from localStorage
    // by the CompanyProfileStep component, so we just need to pass the trendId
    router.push(`/needs?trendId=${trendId}`);
  };

  const handleTrendSelect = (trend: Trend) => {
    handleGenerateNeeds(trend.id);
  };

  const handleGeneratePersonalizedTrends = (profile: PersonalizationProfile) => {
    setIsGeneratingPersonalized(true);
    
    regenerateTrendsMutation.mutate(
      { personalizationProfile: profile },
      {
        onSuccess: () => {
          // Set a small delay to allow the UI to update with fresh data
          setTimeout(() => {
            setIsGeneratingPersonalized(false);
          }, 500);
        },
        onError: () => {
          setIsGeneratingPersonalized(false);
        },
      }
    );
  };




  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-indigo-600">Trends</h1>
                <div className="h-8 w-px bg-gray-300"></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Trend Intelligence
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Track and analyze trends for your enterprise
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                
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


                {exportEnabled && isHydrated && fastTrends.trends && fastTrends.trends.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    {exportMutation.isPending ? 'Exporting...' : 'Export'}
                  </Button>
                )}

                {/* Settings Button */}
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings')}
                  className="flex items-center gap-2 text-sm"
                  title="Trend Generation Settings"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
            
            {/* Personalization */}
            <TrendPersonalization
              onGenerateTrends={handleGeneratePersonalizedTrends}
              isGenerating={isGeneratingPersonalized}
            />

            {/* Filters and Search */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex-shrink-0">
                  <TrendFilters
                    selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
                    onCategoryChange={(category) => setSelectedCategory(category || 'all')}
                  />
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Input
                    placeholder="Search trends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {fastTrends.error && (
              <ErrorDisplay 
                error={fastTrends.error} 
                onRetry={() => fastTrends.refresh()}
              />
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
                  Trend Intelligence ({isHydrated ? filteredTrends.length : 0})
                </h2>
                <div className="text-sm text-gray-700 font-medium">
                  View: {viewMode === 'cards' ? 'Card Grid' : 'Detailed Rows'}
                </div>
              </div>

              {!isHydrated ? (
                <>
                  <ProgressLoader message="Loading market trends..." />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <TrendCardSkeleton key={i} />
                    ))}
                  </div>
                </>
              ) : viewMode === 'cards' ? (
                <SimpleTrendGrid
                  trends={filteredTrends}
                  selectedCategory={selectedCategory}
                  isLoading={fastTrends.isLoading}
                  isComplete={fastTrends.isComplete}
                  hasCache={fastTrends.hasCache}
                  onRefresh={fastTrends.refresh}
                  onTrendSelect={handleTrendSelect}
                  error={fastTrends.error}
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
      </div>
    </div>
  );
}