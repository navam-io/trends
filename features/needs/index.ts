// Public API for Needs feature - CLIENT SIDE ONLY
export { NeedWizard } from './components/NeedWizard';
export { CompanyProfileStep } from './components/CompanyProfileStep';
export { ChallengesStep } from './components/ChallengesStep';
export { GoalsStep } from './components/GoalsStep';
export { ReviewStep } from './components/ReviewStep';
export { NeedsGenerationStep } from './components/NeedsGenerationStep';
export { PrioritizationStep } from './components/PrioritizationStep';
export { SelectedTrendDisplay } from './components/SelectedTrendDisplay';

export { useNeedsStore, useNeedsSelectors } from './stores/needsStore';

export type { 
  Need, 
  CompanyContext, 
  NeedPriority, 
  NeedCategory,
  WizardStep,
  WizardState,
  NeedMatrix,
  GenerateNeedsInput
} from './types/need';

// Server-side exports should be imported directly where needed
// export { needsRouter } from './server/router'; // Don't export server code from client index