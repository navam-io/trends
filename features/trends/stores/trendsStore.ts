import { create } from 'zustand';
import { Trend, TrendAnalysis, TrendCategory } from '../types/trend';

interface TrendsState {
  trends: Trend[];
  analyses: Record<string, TrendAnalysis>;
  selectedCategory: TrendCategory | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTrends: (trends: Trend[]) => void;
  addAnalysis: (trendId: string, analysis: TrendAnalysis) => void;
  setSelectedCategory: (category: TrendCategory | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTrendsStore = create<TrendsState>((set) => ({
  trends: [],
  analyses: {},
  selectedCategory: null,
  isLoading: false,
  error: null,
  
  setTrends: (trends) => set({ trends }),
  
  addAnalysis: (trendId, analysis) => 
    set((state) => ({
      analyses: {
        ...state.analyses,
        [trendId]: analysis,
      },
    })),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));