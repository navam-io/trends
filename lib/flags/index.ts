import { useEffect, useState } from 'react';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  userOverrides?: string[];
}

// Mock feature flags - replace with PostHog in production
const FLAGS: Record<string, FeatureFlag> = {
  'trends.enabled': {
    id: 'trends.enabled',
    name: 'Trends Feature',
    enabled: true,
    rolloutPercentage: 100,
  },
  'trends.ai_analysis': {
    id: 'trends.ai_analysis',
    name: 'AI Trend Analysis',
    enabled: true,
    rolloutPercentage: 100,
  },
  'trends.export': {
    id: 'trends.export',
    name: 'Export Trends',
    enabled: true,
    rolloutPercentage: 100,
  },
  'needs.enabled': {
    id: 'needs.enabled',
    name: 'Needs Discovery',
    enabled: true,
    rolloutPercentage: 100,
  },
  'solutions.enabled': {
    id: 'solutions.enabled',
    name: 'Solution Matching',
    enabled: false,
    rolloutPercentage: 0,
  },
};

export function useFeatureFlag(flagId: string): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const flag = FLAGS[flagId];
    if (!flag) {
      console.warn(`Feature flag ${flagId} not found`);
      setEnabled(false);
      return;
    }

    // Simple rollout logic
    if (!flag.enabled) {
      setEnabled(false);
      return;
    }

    if (flag.rolloutPercentage === 100) {
      setEnabled(true);
      return;
    }

    // Random rollout
    const random = Math.random() * 100;
    setEnabled(random < flag.rolloutPercentage);
  }, [flagId]);

  return enabled;
}

export function getFeatureFlag(flagId: string): boolean {
  const flag = FLAGS[flagId];
  if (!flag || !flag.enabled) return false;
  
  if (flag.rolloutPercentage === 100) return true;
  
  // For server-side, always return true if enabled (no random rollout)
  return flag.enabled;
}

export function getAllFlags(): Record<string, FeatureFlag> {
  return FLAGS;
}

export function useFlags() {
  const [flags, setFlags] = useState<Record<string, { enabled: boolean }>>({});

  useEffect(() => {
    const processedFlags: Record<string, { enabled: boolean }> = {};
    
    Object.entries(FLAGS).forEach(([key, flag]) => {
      // Organize flags by feature
      const parts = key.split('.');
      if (parts.length === 2) {
        const [feature, subFlag] = parts;
        if (!processedFlags[feature]) {
          processedFlags[feature] = { enabled: false };
        }
        
        if (subFlag === 'enabled') {
          processedFlags[feature].enabled = flag.enabled && 
            (flag.rolloutPercentage === 100 || Math.random() * 100 < flag.rolloutPercentage);
        }
      }
    });
    
    setFlags(processedFlags);
  }, []);

  return flags;
}