// Public API for Trends feature - CLIENT SIDE ONLY
export { TrendCard } from './components/TrendCard';
export { TrendGrid } from './components/TrendGrid';
export { TrendFilters } from './components/TrendFilters';
export { TrendPersonalization } from './components/TrendPersonalization';

export { useTrendsStore } from './stores/trendsStore';

export type { Trend, TrendCategory, TrendAnalysis } from './types/trend';

// Server-side exports should be imported directly where needed
// export { trendsRouter } from './server/router'; // Don't export server code from client index