import { PersonalizationProfile } from '@/features/trends/components/TrendPersonalization';
import { CompanyContext } from '@/features/needs/types/need';

const PERSONALIZATION_STORAGE_KEY = 'trenddit_personalization_profile';

/**
 * Get the current personalization profile from localStorage
 */
export function getPersonalizationProfile(): PersonalizationProfile | null {
  try {
    if (typeof window === 'undefined') return null;
    
    const saved = localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load personalization profile:', error);
  }
  return null;
}

/**
 * Convert PersonalizationProfile to partial CompanyContext
 * This allows pre-filling the needs discovery wizard with trends personalization data
 */
export function personalizationToCompanyContext(profile: PersonalizationProfile): Partial<CompanyContext> {
  return {
    industry: profile.industry as CompanyContext['industry'],
    market: profile.market as CompanyContext['market'],
    customer: profile.customer as CompanyContext['customer'],
    size: profile.businessSize as CompanyContext['size'],
    // These fields will still need to be filled by the user in the needs wizard
    name: undefined,
    techMaturity: undefined,
    currentChallenges: [],
    primaryGoals: [],
  };
}

/**
 * Check if personalization data exists and return pre-filled company context
 */
export function getPreFilledCompanyContext(): Partial<CompanyContext> {
  const profile = getPersonalizationProfile();
  if (profile) {
    return personalizationToCompanyContext(profile);
  }
  return {};
}