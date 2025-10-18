import { create } from 'zustand'
import type { Solution, ComparisonCriteria, SolutionApproach } from '../types/solution'

interface SolutionsState {
  solutions: Solution[]
  selectedSolutions: string[]
  comparisonCriteria: ComparisonCriteria[]
  filters: {
    approach?: SolutionApproach
    maxBudget?: number
    maxTimeMonths?: number
  }
  currentNeedId: string | null
  isGenerating: boolean
  isComparing: boolean
  
  setSolutions: (solutions: Solution[]) => void
  addSolution: (solution: Solution) => void
  toggleSolutionSelection: (solutionId: string) => void
  setComparisonCriteria: (criteria: ComparisonCriteria[]) => void
  setFilters: (filters: SolutionsState['filters']) => void
  setCurrentNeedId: (needId: string | null) => void
  setIsGenerating: (isGenerating: boolean) => void
  setIsComparing: (isComparing: boolean) => void
  clearSelection: () => void
  reset: () => void
}

export const useSolutionsStore = create<SolutionsState>((set) => ({
  solutions: [],
  selectedSolutions: [],
  comparisonCriteria: ['cost', 'time', 'roi'],
  filters: {},
  currentNeedId: null,
  isGenerating: false,
  isComparing: false,
  
  setSolutions: (solutions) => set({ solutions }),
  
  addSolution: (solution) => set((state) => ({
    solutions: [...state.solutions, solution]
  })),
  
  toggleSolutionSelection: (solutionId) => set((state) => ({
    selectedSolutions: state.selectedSolutions.includes(solutionId)
      ? state.selectedSolutions.filter(id => id !== solutionId)
      : [...state.selectedSolutions, solutionId]
  })),
  
  setComparisonCriteria: (criteria) => set({ comparisonCriteria: criteria }),
  
  setFilters: (filters) => set({ filters }),
  
  setCurrentNeedId: (needId) => set({ currentNeedId: needId }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setIsComparing: (isComparing) => set({ isComparing }),
  
  clearSelection: () => set({ selectedSolutions: [] }),
  
  reset: () => set({
    solutions: [],
    selectedSolutions: [],
    comparisonCriteria: ['cost', 'time', 'roi'],
    filters: {},
    currentNeedId: null,
    isGenerating: false,
    isComparing: false
  })
}))