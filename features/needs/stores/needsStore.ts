'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Need, 
  CompanyContext, 
  WizardStep, 
  WizardState,
  NeedMatrix,
  NeedPriority 
} from '../types/need';

interface NeedsStore {
  // Wizard state
  wizard: WizardState;
  
  // Generated needs
  needs: Need[];
  selectedNeeds: string[];
  needMatrix: NeedMatrix | null;
  
  // Loading states
  isGenerating: boolean;
  isPrioritizing: boolean;
  isSaving: boolean;
  
  // Error handling
  error: string | null;
  
  // Wizard actions
  setCurrentStep: (step: WizardStep) => void;
  completeStep: (step: WizardStep) => void;
  updateCompanyContext: (context: Partial<CompanyContext>) => void;
  setSelectedTrend: (trendId: string) => void;
  
  // Need actions
  setGeneratedNeeds: (needs: Need[]) => void;
  toggleNeedSelection: (needId: string) => void;
  updateNeedPriority: (needId: string, priority: NeedPriority) => void;
  setNeedMatrix: (matrix: NeedMatrix) => void;
  
  // Loading states
  setGenerating: (loading: boolean) => void;
  setPrioritizing: (loading: boolean) => void;
  setSaving: (loading: boolean) => void;
  
  // Error handling
  setError: (error: string | null) => void;
  
  // Reset functions
  resetWizard: () => void;
  resetNeeds: () => void;
  resetAll: () => void;
}

const initialWizardState: WizardState = {
  currentStep: 'company_info',
  completedSteps: [],
  companyContext: {},
  selectedTrendId: undefined,
  generatedNeeds: [],
  isGenerating: false,
};

const initialNeedMatrix: NeedMatrix = {
  high_impact_low_effort: [],
  high_impact_high_effort: [],
  low_impact_low_effort: [],
  low_impact_high_effort: [],
};

export const useNeedsStore = create<NeedsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      wizard: initialWizardState,
      needs: [],
      selectedNeeds: [],
      needMatrix: null,
      isGenerating: false,
      isPrioritizing: false,
      isSaving: false,
      error: null,

      // Wizard actions
      setCurrentStep: (step) =>
        set((state) => ({
          wizard: { ...state.wizard, currentStep: step },
          error: null,
        }), false, 'setCurrentStep'),

      completeStep: (step) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            completedSteps: state.wizard.completedSteps.includes(step)
              ? state.wizard.completedSteps
              : [...state.wizard.completedSteps, step],
          },
        }), false, 'completeStep'),

      updateCompanyContext: (context) =>
        set((state) => ({
          wizard: {
            ...state.wizard,
            companyContext: { ...state.wizard.companyContext, ...context },
          },
          error: null,
        }), false, 'updateCompanyContext'),

      setSelectedTrend: (trendId) =>
        set((state) => ({
          wizard: { ...state.wizard, selectedTrendId: trendId },
        }), false, 'setSelectedTrend'),

      // Need actions
      setGeneratedNeeds: (needs) =>
        set((state) => ({
          needs,
          wizard: { ...state.wizard, generatedNeeds: needs },
        }), false, 'setGeneratedNeeds'),

      toggleNeedSelection: (needId) =>
        set((state) => ({
          selectedNeeds: state.selectedNeeds.includes(needId)
            ? state.selectedNeeds.filter(id => id !== needId)
            : [...state.selectedNeeds, needId],
        }), false, 'toggleNeedSelection'),

      updateNeedPriority: (needId, priority) =>
        set((state) => ({
          needs: state.needs.map(need =>
            need.id === needId ? { ...need, priority } : need
          ),
        }), false, 'updateNeedPriority'),

      setNeedMatrix: (matrix) =>
        set({ needMatrix: matrix }, false, 'setNeedMatrix'),

      // Loading states
      setGenerating: (loading) =>
        set({ isGenerating: loading }, false, 'setGenerating'),

      setPrioritizing: (loading) =>
        set({ isPrioritizing: loading }, false, 'setPrioritizing'),

      setSaving: (loading) =>
        set({ isSaving: loading }, false, 'setSaving'),

      // Error handling
      setError: (error) =>
        set({ error }, false, 'setError'),

      // Reset functions
      resetWizard: () =>
        set((state) => ({
          wizard: initialWizardState,
          error: null,
        }), false, 'resetWizard'),

      resetNeeds: () =>
        set({
          needs: [],
          selectedNeeds: [],
          needMatrix: null,
        }, false, 'resetNeeds'),

      resetAll: () =>
        set({
          wizard: initialWizardState,
          needs: [],
          selectedNeeds: [],
          needMatrix: null,
          isGenerating: false,
          isPrioritizing: false,
          isSaving: false,
          error: null,
        }, false, 'resetAll'),
    }),
    {
      name: 'needs-store',
      // Only persist essential data, not loading states
      partialize: (state: NeedsStore) => ({
        wizard: {
          ...state.wizard,
          isGenerating: false, // Don't persist loading states
        },
        needs: state.needs,
        selectedNeeds: state.selectedNeeds,
      }),
    }
  )
);

// Computed selectors for common queries
export const useNeedsSelectors = () => {
  const store = useNeedsStore();
  
  return {
    // Get needs by priority
    needsByPriority: (priority: NeedPriority) =>
      store.needs.filter(need => need.priority === priority),
    
    // Get selected need objects
    selectedNeedObjects: () =>
      store.needs.filter(need => store.selectedNeeds.includes(need.id)),
    
    // Check if wizard step is completed
    isStepCompleted: (step: WizardStep) => 
      store.wizard.completedSteps.includes(step),
    
    // Check if wizard is ready for need generation
    isReadyForGeneration: () => {
      const { companyContext, selectedTrendId } = store.wizard;
      return !!(
        companyContext.name &&
        companyContext.industry &&
        companyContext.size &&
        companyContext.techMaturity &&
        companyContext.currentChallenges?.length &&
        companyContext.primaryGoals?.length &&
        selectedTrendId
      );
    },
    
    // Get wizard progress percentage
    wizardProgress: () => {
      const totalSteps = 6; // Total number of wizard steps
      return (store.wizard.completedSteps.length / totalSteps) * 100;
    },
    
    // Check if any needs are selected
    hasSelectedNeeds: () => store.selectedNeeds.length > 0,
    
    // Get needs count by category
    needsCountByCategory: () => {
      const counts: Record<string, number> = {};
      store.needs.forEach(need => {
        counts[need.category] = (counts[need.category] || 0) + 1;
      });
      return counts;
    },
  };
};