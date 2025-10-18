export { SolutionMatching } from './components/SolutionMatching'
export { SolutionCard } from './components/SolutionCard'
export { SolutionComparison } from './components/SolutionComparison'
export { ROICalculator } from './components/ROICalculator'
export { solutionsRouter } from './server/router'
export { useSolutionsStore } from './stores/solutionsStore'
export type { 
  Solution, 
  SolutionApproach, 
  SolutionCategory,
  GenerateSolutionsInput,
  SolutionComparison as SolutionComparisonType
} from './types/solution'