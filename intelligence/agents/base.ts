/**
 * Intelligence Agent Base Classes
 * Foundation for multi-agent AI intelligence system
 */

import { z } from 'zod';

// Core Intelligence Types
export const ContextSchema = z.object({
  company: z.object({
    industry: z.string(),
    size: z.enum(['startup', 'small', 'medium', 'enterprise']),
    techMaturity: z.enum(['low', 'medium', 'high']),
  }).optional(),
  user: z.object({
    role: z.enum(['cto', 'innovation_director', 'compliance_officer', 'engineering_manager']),
    experience: z.enum(['junior', 'mid', 'senior']),
  }).optional(),
  domain: z.string().optional(),
  timeHorizon: z.enum(['3months', '6months', '1year', '2years']).default('6months'),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
});

export const ReasoningStepSchema = z.object({
  step: z.number(),
  description: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
});

export const AnalysisSchema = z.object({
  conclusion: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.array(ReasoningStepSchema),
  evidence: z.array(z.string()),
  alternatives: z.array(z.string()),
  dataSourcesused: z.array(z.string()),
  timestamp: z.date(),
});

export const OutcomeSchema = z.object({
  recommendationId: z.string(),
  actualResult: z.enum(['success', 'failure', 'partial', 'in_progress']),
  userFeedback: z.number().min(1).max(5).optional(),
  implementationNotes: z.string().optional(),
  timestamp: z.date(),
});

export type Context = z.infer<typeof ContextSchema>;
export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;

/**
 * Abstract Intelligence Agent Base Class
 * All specialized agents extend this foundation
 */
export abstract class IntelligenceAgent {
  protected agentType: string;
  protected version: string;
  protected capabilities: string[];

  constructor(agentType: string, version: string = '1.0.0') {
    this.agentType = agentType;
    this.version = version;
    this.capabilities = [];
  }

  /**
   * Core analysis method - must be implemented by all agents
   */
  abstract analyze(context: Context): Promise<Analysis>;

  /**
   * Learn from implementation outcomes to improve future recommendations
   */
  abstract learn(outcome: Outcome): Promise<void>;

  /**
   * Get current confidence level for this agent's domain
   */
  abstract getConfidence(): number;

  /**
   * Get the reasoning chain for transparency
   */
  abstract getReasoningChain(): ReasoningStep[];

  /**
   * Validate if this agent can handle the given context
   */
  canHandle(context: Context): boolean {
    return true; // Base implementation - agents can override
  }

  /**
   * Get agent metadata
   */
  getMetadata() {
    return {
      type: this.agentType,
      version: this.version,
      capabilities: this.capabilities,
    };
  }

  /**
   * Health check for agent availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Basic health check - agents can override
      return true;
    } catch (error) {
      console.error(`Health check failed for ${this.agentType}:`, error);
      return false;
    }
  }
}

/**
 * Intelligence Orchestrator
 * Coordinates multiple agents for comprehensive analysis
 */
export interface IntelligenceOrchestrator {
  coordinate(
    agents: IntelligenceAgent[],
    query: IntelligenceQuery
  ): Promise<SynthesizedIntelligence>;
  
  shareContext(
    fromAgent: string,
    toAgent: string,
    context: Context
  ): void;
  
  aggregateConfidence(analyses: Analysis[]): ConfidenceScore;
}

export const IntelligenceQuerySchema = z.object({
  query: z.string(),
  context: ContextSchema,
  requiredAgents: z.array(z.string()).optional(),
  maxResponseTime: z.number().default(30000), // 30 seconds
});

export const SynthesizedIntelligenceSchema = z.object({
  primaryConclusion: z.string(),
  overallConfidence: z.number().min(0).max(1),
  agentAnalyses: z.array(AnalysisSchema),
  crossAgentInsights: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  riskFactors: z.array(z.string()),
  alternativePerspectives: z.array(z.string()),
  timestamp: z.date(),
});

export const ConfidenceScoreSchema = z.object({
  overall: z.number().min(0).max(1),
  breakdown: z.record(z.number().min(0).max(1)), // by agent type
  factors: z.array(z.string()),
});

export type IntelligenceQuery = z.infer<typeof IntelligenceQuerySchema>;
export type SynthesizedIntelligence = z.infer<typeof SynthesizedIntelligenceSchema>;
export type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;

/**
 * Agent Registry
 * Manages available intelligence agents
 */
export class AgentRegistry {
  private agents: Map<string, IntelligenceAgent> = new Map();

  register(agent: IntelligenceAgent): void {
    const metadata = agent.getMetadata();
    this.agents.set(metadata.type, agent);
  }

  get(agentType: string): IntelligenceAgent | undefined {
    return this.agents.get(agentType);
  }

  getAll(): IntelligenceAgent[] {
    return Array.from(this.agents.values());
  }

  getAvailable(context: Context): IntelligenceAgent[] {
    return this.getAll().filter(agent => agent.canHandle(context));
  }

  async getHealthy(): Promise<IntelligenceAgent[]> {
    const healthChecks = await Promise.all(
      this.getAll().map(async agent => ({
        agent,
        healthy: await agent.healthCheck()
      }))
    );

    return healthChecks
      .filter(check => check.healthy)
      .map(check => check.agent);
  }
}

// Global registry instance
export const agentRegistry = new AgentRegistry();