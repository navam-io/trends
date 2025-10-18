import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">Trends</h1>
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
          Transform AI Trends into
          <span className="block text-indigo-600">Engineering Roadmaps</span>
        </h2>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          AI-powered advisory platform that guides enterprises through the complete lifecycle of AI adoption - 
          from trend analysis to implementation planning.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/trends"
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
          >
            Explore AI Trends
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
          >
            Learn More
          </a>
        </div>
      </div>

      <div id="features" className="mt-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Your AI Adoption Journey
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Five steps from trends to implementation
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
              1
            </div>
            <h3 className="text-lg font-medium text-gray-900">Trend Intelligence</h3>
            <p className="mt-2 text-sm text-gray-500">
              Track AI trends across consumer behavior, competition, economy, and regulation.
            </p>
          </div>

          <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
              2
            </div>
            <h3 className="text-lg font-medium text-gray-900">Need Discovery</h3>
            <p className="mt-2 text-sm text-gray-500">
              Identify specific business needs based on AI trends and your enterprise context.
            </p>
          </div>

          <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
              3
            </div>
            <h3 className="text-lg font-medium text-gray-900">Solution Matching</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get AI-powered recommendations for build vs buy vs partner decisions with ROI analysis.
            </p>
            <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">New!</span>
          </div>

          <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm opacity-50">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-400 text-white">
              4
            </div>
            <h3 className="text-lg font-medium text-gray-900">Tech Advisory</h3>
            <p className="mt-2 text-sm text-gray-500">
              Generate tech stacks, analyze complexity, and compare vendors.
            </p>
            <span className="absolute top-2 right-2 text-xs bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
          </div>

          <div className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm opacity-50">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-400 text-white">
              5
            </div>
            <h3 className="text-lg font-medium text-gray-900">Implementation Planning</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create detailed roadmaps with milestones, resources, and risk assessments.
            </p>
            <span className="absolute top-2 right-2 text-xs bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
