'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/lib/ui/button';
import { Card, CardContent } from '@/lib/ui/card';
import { 
  Settings, 
  Zap, 
  Building2, 
  Globe, 
  Users, 
  Target 
} from 'lucide-react';

export interface PersonalizationProfile {
  industry: string;
  market: string;
  customer: string;
  businessSize: string;
}

interface TrendPersonalizationProps {
  onGenerateTrends: (profile: PersonalizationProfile) => void;
  isGenerating?: boolean;
}

const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'energy', label: 'Energy' },
  { value: 'education', label: 'Education' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'real-estate', label: 'Real Estate' },
];

const MARKET_OPTIONS = [
  { value: 'us', label: 'United States' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia Pacific' },
  { value: 'middle-east', label: 'Middle East' },
  { value: 'africa', label: 'Africa' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'global', label: 'Global' },
];

const CUSTOMER_OPTIONS = [
  { value: 'business', label: 'Business (B2B)' },
  { value: 'consumer', label: 'Consumer (B2C)' },
  { value: 'government', label: 'Government (B2G)' },
];

const BUSINESS_SIZE_OPTIONS = [
  { value: 'startup', label: 'Startup (1-50 employees)' },
  { value: 'small-medium', label: 'Small & Medium (51-500 employees)' },
  { value: 'large', label: 'Large Enterprise (500+ employees)' },
  { value: 'government', label: 'Government Agency' },
  { value: 'non-profit', label: 'Non-profit Organization' },
];

// Default profile
const DEFAULT_PROFILE: PersonalizationProfile = {
  industry: 'technology',
  market: 'us',
  customer: 'business',
  businessSize: 'small-medium',
};

const STORAGE_KEY = 'trenddit_personalization_profile';

export function TrendPersonalization({ onGenerateTrends, isGenerating = false }: TrendPersonalizationProps) {
  const [profile, setProfile] = useState<PersonalizationProfile>(DEFAULT_PROFILE);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedProfile = JSON.parse(saved);
        setProfile({ ...DEFAULT_PROFILE, ...savedProfile });
      }
    } catch (error) {
      console.warn('Failed to load personalization profile:', error);
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn('Failed to save personalization profile:', error);
    }
  }, [profile]);

  const handleProfileChange = (field: keyof PersonalizationProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateTrends = () => {
    onGenerateTrends(profile);
  };

  const getOptionLabel = (options: any[], value: string) => {
    return options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-medium text-gray-900">Personalized Trends</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Hide' : 'Customize'}
            </Button>
            <Button
              onClick={handleGenerateTrends}
              disabled={isGenerating}
              className="flex items-center gap-1 text-xs h-8 px-3"
            >
              <Zap className="h-3 w-3" />
              {isGenerating ? 'Generating...' : 'Generate Trends'}
            </Button>
          </div>
        </div>

        {/* Current Selection Summary */}
        {!isExpanded && (
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{getOptionLabel(INDUSTRY_OPTIONS, profile.industry)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>{getOptionLabel(MARKET_OPTIONS, profile.market)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{getOptionLabel(CUSTOMER_OPTIONS, profile.customer)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{getOptionLabel(BUSINESS_SIZE_OPTIONS, profile.businessSize)}</span>
            </div>
          </div>
        )}

        {/* Expanded Form */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Industry */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  Industry
                </label>
                <select
                  value={profile.industry}
                  onChange={(e) => handleProfileChange('industry', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {INDUSTRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Market */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Globe className="h-3 w-3 inline mr-1" />
                  Market
                </label>
                <select
                  value={profile.market}
                  onChange={(e) => handleProfileChange('market', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {MARKET_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Users className="h-3 w-3 inline mr-1" />
                  Customer
                </label>
                <select
                  value={profile.customer}
                  onChange={(e) => handleProfileChange('customer', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {CUSTOMER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Target className="h-3 w-3 inline mr-1" />
                  Business Size
                </label>
                <select
                  value={profile.businessSize}
                  onChange={(e) => handleProfileChange('businessSize', e.target.value)}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {BUSINESS_SIZE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Tip:</strong> Customize your profile to get trends most relevant to your business context. 
              Your selections are automatically saved for future sessions.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export the profile type and options for use in other components
export { INDUSTRY_OPTIONS, MARKET_OPTIONS, CUSTOMER_OPTIONS, BUSINESS_SIZE_OPTIONS, DEFAULT_PROFILE, STORAGE_KEY };