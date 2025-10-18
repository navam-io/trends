'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { NeedWizard } from '@/features/needs';
import { useFlags } from '@/lib/flags';
import { Button } from '@/lib/ui/button';
import { Target, TrendingUp } from 'lucide-react';

function NeedsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const trendId = searchParams.get('trendId');
  const flags = useFlags();
  const [showWizard, setShowWizard] = useState(true);

  // Check if needs feature is enabled
  if (!flags.needs?.enabled) {
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
                      Need Discovery
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Feature currently unavailable
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/trends')}
                    className="flex items-center gap-2 text-sm"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Back to Trends
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-md mx-auto text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Feature Not Available</h2>
            <p className="mt-1 text-sm text-gray-500">
              The Need Discovery feature is currently disabled. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleWizardComplete = (needs: unknown[]) => {
    console.log('Wizard completed with needs:', needs);
    setShowWizard(false);
    // TODO: Navigate to needs dashboard or results page
  };

  const handleWizardCancel = () => {
    // Navigate back to trends page
    router.push('/trends');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-indigo-600">Trenddit</h1>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-indigo-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Need Discovery
                    </h2>
                    <p className="text-gray-600 mt-1">
                      AI-powered business need identification
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/trends')}
                  className="flex items-center gap-2 text-sm"
                >
                  <TrendingUp className="h-4 w-4" />
                  Back to Trends
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showWizard ? (
          <NeedWizard
            selectedTrendId={trendId || undefined}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow p-8">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Need Discovery Complete!
              </h2>
              <p className="mt-2 text-gray-600">
                We&apos;ve successfully generated and prioritized your business needs. 
                Next, we&apos;ll help you find solutions to address these needs.
              </p>
              <div className="mt-6 flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowWizard(true)}
                  className="flex items-center gap-2"
                >
                  Run Again
                </Button>
                <Button
                  disabled
                  className="opacity-50 cursor-not-allowed"
                >
                  Find Solutions (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NeedsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <NeedsPageContent />
    </Suspense>
  );
}