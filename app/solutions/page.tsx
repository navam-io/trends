import { Suspense } from 'react'
import { SolutionMatching } from '@/features/solutions'
import { Loader2 } from 'lucide-react'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading Solutions...
        </h2>
      </div>
    </div>
  )
}

export default function SolutionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SolutionMatching />
    </Suspense>
  )
}