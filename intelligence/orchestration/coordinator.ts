/**
 * Intelligence Orchestration System
 * Coordinates multiple AI agents for comprehensive analysis
 */

import { z } from 'zod';
import { 
  IntelligenceAgent,
  IntelligenceOrchestrator,
  IntelligenceQuery,
  SynthesizedIntelligence,
  ConfidenceScore,
  Analysis,
  Context,
  agentRegistry
} from '../agents/base';

/**
 * Context Sharing System
 * Enables agents to share insights and build on each other's analysis
 */
export class ContextSharingSystem {
  private sharedContext: Map<string, Map<string, any>> = new Map();

  shareContext(fromAgent: string, toAgent: string, context: Context): void {
    if (!this.sharedContext.has(toAgent)) {
      this.sharedContext.set(toAgent, new Map());
    }
    
    const agentContext = this.sharedContext.get(toAgent)!;
    agentContext.set(fromAgent, {
      context,
      timestamp: new Date(),
    });
  }

  getSharedContext(forAgent: string): Map<string, any> {
    return this.sharedContext.get(forAgent) || new Map();
  }

  clearContext(sessionId?: string): void {
    if (sessionId) {
      // Clear context for specific session
      this.sharedContext.clear();
    } else {
      this.sharedContext.clear();
    }
  }
}

/**
 * Confidence Aggregation Engine
 * Calculates overall confidence from multiple agent analyses
 */
export class ConfidenceAggregator {
  aggregateConfidence(analyses: Analysis[]): ConfidenceScore {
    if (analyses.length === 0) {
      return {
        overall: 0,
        breakdown: {},
        factors: ['No analyses available'],
      };
    }

    // Calculate weighted average confidence
    const totalWeight = analyses.length;
    const weightedSum = analyses.reduce((sum, analysis) => {
      return sum + analysis.confidence;
    }, 0);

    const overall = weightedSum / totalWeight;

    // Breakdown by analysis quality
    const breakdown: Record<string, number> = {};
    analyses.forEach((analysis, index) => {
      breakdown[`analysis_${index}`] = analysis.confidence;
    });

    // Identify confidence factors
    const factors: string[] = [];
    const highConfidenceCount = analyses.filter(a => a.confidence >= 0.8).length;
    const lowConfidenceCount = analyses.filter(a => a.confidence < 0.5).length;

    if (highConfidenceCount > 0) {
      factors.push(`${highConfidenceCount} high-confidence analyses`);
    }
    if (lowConfidenceCount > 0) {
      factors.push(`${lowConfidenceCount} low-confidence analyses`);
    }

    const evidenceCount = analyses.reduce((sum, a) => sum + a.evidence.length, 0);
    if (evidenceCount >= 10) {
      factors.push('Strong evidence base');
    } else if (evidenceCount < 5) {
      factors.push('Limited evidence available');
    }

    return {
      overall,
      breakdown,
      factors,
    };
  }
}

/**
 * Multi-Agent Intelligence Orchestrator
 * Main coordination class for agent collaboration
 */
export class MultiAgentOrchestrator implements IntelligenceOrchestrator {
  private contextSharing: ContextSharingSystem;
  private confidenceAggregator: ConfidenceAggregator;

  constructor() {
    this.contextSharing = new ContextSharingSystem();
    this.confidenceAggregator = new ConfidenceAggregator();
  }

  async coordinate(
    agents: IntelligenceAgent[],
    query: IntelligenceQuery
  ): Promise<SynthesizedIntelligence> {
    const startTime = Date.now();
    const { maxResponseTime } = query;

    try {
      // Phase 1: Parallel agent analysis
      const analysisPromises = agents.map(async (agent) => {
        try {
          const analysis = await this.executeWithTimeout(
            agent.analyze(query.context),
            maxResponseTime / 2 // Give each agent half the total time
          );
          
          return {
            agent: agent.getMetadata().type,
            analysis,
          };
        } catch (error) {
          console.error(`Agent ${agent.getMetadata().type} analysis failed:`, error);
          return null;
        }
      });

      const analysisResults = await Promise.all(analysisPromises);
      const validAnalyses = analysisResults
        .filter((result): result is NonNullable<typeof result> => result !== null);

      if (validAnalyses.length === 0) {
        throw new Error('No agents could complete analysis');
      }

      // Phase 2: Cross-agent insight synthesis
      const crossAgentInsights = this.synthesizeCrossAgentInsights(validAnalyses);

      // Phase 3: Generate primary conclusion
      const primaryConclusion = this.generatePrimaryConclusion(
        validAnalyses,
        crossAgentInsights,
        query.query
      );

      // Phase 4: Aggregate confidence scores
      const analyses = validAnalyses.map(r => r.analysis);
      const confidenceScore = this.aggregateConfidence(analyses);

      // Phase 5: Extract recommended actions and risks
      const recommendedActions = this.extractRecommendedActions(analyses);
      const riskFactors = this.extractRiskFactors(analyses);
      const alternativePerspectives = this.extractAlternativePerspectives(analyses);

      return {
        primaryConclusion,
        overallConfidence: confidenceScore.overall,
        agentAnalyses: analyses,
        crossAgentInsights,
        recommendedActions,
        riskFactors,
        alternativePerspectives,
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Multi-agent coordination failed:', error);
      throw new Error(`Intelligence synthesis failed: ${error}`);
    }
  }

  shareContext(fromAgent: string, toAgent: string, context: Context): void {
    this.contextSharing.shareContext(fromAgent, toAgent, context);
  }

  aggregateConfidence(analyses: Analysis[]): ConfidenceScore {
    return this.confidenceAggregator.aggregateConfidence(analyses);
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout')), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private synthesizeCrossAgentInsights(
    analysisResults: Array<{agent: string; analysis: Analysis}>
  ): string[] {
    const insights: string[] = [];

    // Look for convergent conclusions
    const conclusions = analysisResults.map(r => r.analysis.conclusion.toLowerCase());
    const commonThemes = this.findCommonThemes(conclusions);
    
    if (commonThemes.length > 0) {
      insights.push(`Multiple agents converge on: ${commonThemes.join(', ')}`);
    }

    // Identify conflicting perspectives
    const highConfidence = analysisResults.filter(r => r.analysis.confidence >= 0.8);
    const lowConfidence = analysisResults.filter(r => r.analysis.confidence < 0.5);
    
    if (highConfidence.length > 0 && lowConfidence.length > 0) {
      insights.push('Mixed confidence levels indicate uncertainty in some analysis areas');
    }

    // Cross-reference evidence
    const allEvidence = analysisResults.flatMap(r => r.analysis.evidence);
    const evidenceOverlap = this.findEvidenceOverlap(allEvidence);
    
    if (evidenceOverlap.length > 0) {
      insights.push(`Strong evidence support: ${evidenceOverlap.slice(0, 3).join(', ')}`);
    }

    return insights;
  }

  private generatePrimaryConclusion(
    analysisResults: Array<{agent: string; analysis: Analysis}>,
    crossAgentInsights: string[],
    originalQuery: string
  ): string {
    // Weight conclusions by confidence
    const weightedConclusions = analysisResults
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence)
      .slice(0, 3); // Top 3 most confident

    const primaryInsight = weightedConclusions[0]?.analysis.conclusion || 'Analysis inconclusive';
    
    const confidenceLevel = weightedConclusions[0]?.analysis.confidence || 0;
    const confidenceText = confidenceLevel >= 0.8 ? 'High confidence' :
                          confidenceLevel >= 0.6 ? 'Moderate confidence' :
                          'Low confidence';

    return `${confidenceText}: ${primaryInsight}`;
  }

  private extractRecommendedActions(analyses: Analysis[]): string[] {
    const actions: string[] = [];
    
    // Extract actions from reasoning steps
    analyses.forEach(analysis => {
      analysis.reasoning.forEach(step => {
        if (step.description.includes('recommend') || step.description.includes('should')) {
          actions.push(step.description);
        }
      });
    });

    // Deduplicate and return top actions
    return [...new Set(actions)].slice(0, 5);
  }

  private extractRiskFactors(analyses: Analysis[]): string[] {
    const risks: string[] = [];
    
    analyses.forEach(analysis => {
      analysis.reasoning.forEach(step => {
        if (step.confidence < 0.5) {
          risks.push(`Low confidence: ${step.description}`);
        }
        
        step.assumptions.forEach(assumption => {
          risks.push(`Assumption: ${assumption}`);
        });
      });
    });

    return [...new Set(risks)].slice(0, 5);
  }

  private extractAlternativePerspectives(analyses: Analysis[]): string[] {
    const alternatives: string[] = [];
    
    analyses.forEach(analysis => {
      alternatives.push(...analysis.alternatives);
    });

    return [...new Set(alternatives)].slice(0, 5);
  }

  private findCommonThemes(texts: string[]): string[] {
    // Simple keyword extraction for common themes
    const keywords = texts.flatMap(text => 
      text.split(' ').filter(word => word.length > 4)
    );
    
    const frequency: Record<string, number> = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    return Object.entries(frequency)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([keyword]) => keyword);
  }

  private findEvidenceOverlap(evidence: string[]): string[] {
    const evidenceCount: Record<string, number> = {};
    
    evidence.forEach(item => {
      evidenceCount[item] = (evidenceCount[item] || 0) + 1;
    });

    return Object.entries(evidenceCount)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .map(([evidence]) => evidence);
  }
}

// Global orchestrator instance
export const multiAgentOrchestrator = new MultiAgentOrchestrator();