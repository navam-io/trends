import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Trend {
  id: string;
  category: 'consumer' | 'competition' | 'economy' | 'regulation';
  title: string;
  summary: string;
  impact_score: number;
  source: string;
  source_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Need {
  id: string;
  user_id: string;
  trend_id: string;
  statement: string;
  priority: 'low' | 'medium' | 'high';
  created_at: Date;
  updated_at: Date;
}

export interface Solution {
  id: string;
  need_id: string;
  pattern: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  created_at: Date;
  updated_at: Date;
}