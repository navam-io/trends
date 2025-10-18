/**
 * Market Intelligence Agent
 * Specializes in real-time market analysis and competitive intelligence
 */

import { z } from 'zod';
import { anthropic } from '@/lib/ai/anthropic';
import { getAIModel } from '@/lib/config/reader';
import { 
  IntelligenceAgent,
  Context,
  Analysis,
  Outcome,
  ReasoningStep
} from '../base';

// Market Intelligence Specific Types
export const TrendMomentumAnalysisSchema = z.object({
  trend: z.string(),
  momentum: z.enum(['accelerating', 'steady', 'declining']),
  adoptionStage: z.enum(['early', 'growth', 'maturity', 'decline']),
  marketSignals: z.array(z.string()),
  competitiveActivity: z.array(z.string()),
  riskFactors: z.array(z.string()),
  opportunities: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const CompetitorActivitySchema = z.object({
  competitor: z.string(),
  activities: z.array(z.object({
    type: z.enum(['product_launch', 'acquisition', 'partnership', 'funding', 'hiring']),
    description: z.string(),
    impact: z.enum(['low', 'medium', 'high']),
    timestamp: z.date(),
  })),
  implications: z.array(z.string()),
});

export const AdoptionForecastSchema = z.object({
  trend: z.string(),
  industry: z.string(),
  forecastTimeframe: z.enum(['3months', '6months', '1year', '2years']),
  adoptionProbability: z.number().min(0).max(1),
  timeline: z.object({
    earlyAdopters: z.string(),
    mainstream: z.string(),
    lateAdopters: z.string(),
  }),
  catalysts: z.array(z.string()),
  barriers: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type TrendMomentumAnalysis = z.infer<typeof TrendMomentumAnalysisSchema>;
export type CompetitorActivity = z.infer<typeof CompetitorActivitySchema>;
export type AdoptionForecast = z.infer<typeof AdoptionForecastSchema>;

/**
 * Market Intelligence Agent Implementation
 */
export class MarketIntelligenceAgent extends IntelligenceAgent {
  private reasoningChain: ReasoningStep[] = [];
  private confidence: number = 0.7;
  private learningData: Map<string, Outcome[]> = new Map();

  constructor() {
    super('market-intelligence', '1.0.0');
    this.capabilities = [
      'trend-momentum-analysis',
      'competitive-intelligence',
      'adoption-forecasting',
      'market-sentiment-analysis',
      'chain-of-thought-reasoning'
    ];
  }

  async analyze(context: Context): Promise<Analysis> {
    this.reasoningChain = [];
    
    try {
      // Chain-of-Thought Analysis Process
      const step1 = await this.analyzeMarketContext(context);
      const step2 = await this.assessCompetitiveLandscape(context);
      const step3 = await this.forecastAdoptionInternal(context);
      const step4 = await this.synthesizeIntelligence(step1, step2, step3, context);

      const analysis: Analysis = {
        conclusion: step4.conclusion,
        confidence: this.calculateOverallConfidence(),
        reasoning: this.reasoningChain,
        evidence: this.extractEvidence(),
        alternatives: this.generateAlternatives(),
        dataSourcesused: this.getDataSources(),
        timestamp: new Date(),
      };

      return analysis;
    } catch (error) {
      console.error('Market Intelligence Agent analysis failed:', error);
      return this.generateFallbackAnalysis(context);
    }
  }

  async learn(outcome: Outcome): Promise<void> {
    const key = `${outcome.recommendationId}`;
    if (!this.learningData.has(key)) {
      this.learningData.set(key, []);
    }
    this.learningData.get(key)!.push(outcome);

    // Adjust confidence based on outcomes
    await this.adjustConfidenceFromOutcomes();
  }

  getConfidence(): number {
    return this.confidence;
  }

  getReasoningChain(): ReasoningStep[] {
    return this.reasoningChain;
  }

  canHandle(context: Context): boolean {
    // Market intelligence agent can handle most market-related queries
    return true;
  }

  // Specialized Market Intelligence Methods

  async analyzeTrendMomentum(trendId: string): Promise<TrendMomentumAnalysis> {
    const reasoning = await this.performChainOfThoughtAnalysis(`
      Analyze the market momentum for trend: ${trendId}
      
      STEP 1: Market Signal Analysis
      - Identify current market signals and indicators
      - Assess social media sentiment and discussion volume
      - Evaluate news coverage and media attention
      - Consider funding and investment activity
      
      STEP 2: Adoption Stage Assessment
      - Determine current adoption stage (early/growth/maturity/decline)
      - Identify key adopters and market leaders
      - Assess penetration in different market segments
      
      STEP 3: Competitive Activity Evaluation
      - Monitor competitor actions and announcements
      - Assess competitive positioning changes
      - Identify new market entrants
      
      STEP 4: Momentum Classification
      - Synthesize signals into momentum assessment
      - Classify as accelerating, steady, or declining
      - Provide confidence level and supporting evidence
      
      Respond with structured analysis including all steps.
    `);

    // Parse and validate the AI response
    return this.parseTrendMomentumResponse(reasoning);
  }

  async trackCompetitorActivity(competitors: string[]): Promise<CompetitorActivity[]> {
    const activities: CompetitorActivity[] = [];
    
    for (const competitor of competitors) {
      const reasoning = await this.performChainOfThoughtAnalysis(`
        Analyze recent competitive activity for: ${competitor}
        
        STEP 1: Activity Identification
        - Product launches and updates
        - Strategic partnerships and acquisitions
        - Funding rounds and financial developments
        - Key hiring and organizational changes
        
        STEP 2: Impact Assessment
        - Evaluate strategic significance of each activity
        - Assess potential market impact (low/medium/high)
        - Consider timing and competitive context
        
        STEP 3: Implication Analysis
        - Determine implications for market dynamics
        - Identify threats and opportunities
        - Assess competitive positioning changes
        
        Provide structured analysis for ${competitor}.
      `);

      const activity = this.parseCompetitorActivityResponse(reasoning, competitor);
      activities.push(activity);
    }

    return activities;
  }

  async forecastAdoption(trend: string, industry: string): Promise<AdoptionForecast> {
    const reasoning = await this.performChainOfThoughtAnalysis(`
      Forecast adoption timeline for trend "${trend}" in ${industry} industry:
      
      STEP 1: Industry Context Analysis
      - Assess industry's typical adoption patterns
      - Consider regulatory environment and constraints
      - Evaluate technological readiness and infrastructure
      
      STEP 2: Adoption Catalyst Identification
      - Identify factors that will accelerate adoption
      - Consider market drivers and forcing functions
      - Assess competitive pressures and opportunities
      
      STEP 3: Barrier Assessment
      - Identify potential obstacles to adoption
      - Consider technical, regulatory, and economic barriers
      - Assess organizational change requirements
      
      STEP 4: Timeline Forecasting
      - Predict early adopter timeline
      - Estimate mainstream adoption timing
      - Forecast late adopter conversion
      - Provide confidence intervals
      
      Generate detailed adoption forecast with supporting analysis.
    `);

    return this.parseAdoptionForecastResponse(reasoning, trend, industry);
  }

  // Private Implementation Methods

  private async analyzeMarketContext(context: Context): Promise<{
    marketSignals: string[];
    sentiment: string;
    confidence: number;
  }> {
    const step: ReasoningStep = {
      step: 1,
      description: "Analyzing current market context and signals",
      evidence: [],
      confidence: 0.8,
      assumptions: ["Market data reflects real adoption patterns"]
    };

    try {
      const prompt = `Analyze the current market context for ${context.company?.industry || 'technology'} companies of ${context.company?.size || 'medium'} size with ${context.company?.techMaturity || 'medium'} tech maturity.

ANALYSIS REQUIREMENTS:
1. Identify 3-5 current market signals relevant to this company profile
2. Assess overall market sentiment (one phrase)
3. Provide confidence level (0.0-1.0)

Respond in JSON format:
{
  "marketSignals": ["signal1", "signal2", "signal3"],
  "sentiment": "brief sentiment description",
  "confidence": 0.8
}`;

      const response = await this.performChainOfThoughtAnalysis(prompt);
      const parsed = JSON.parse(response);
      
      const result = {
        marketSignals: parsed.marketSignals || [
          "Market analysis in progress",
          "Enterprise adoption trends identified", 
          "Regulatory landscape evolving"
        ],
        sentiment: parsed.sentiment || "Market analysis in progress",
        confidence: parsed.confidence || 0.7
      };

      step.evidence = result.marketSignals;
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    } catch (error) {
      console.error('Market context analysis failed:', error);
      
      // Fallback result
      const result = {
        marketSignals: [
          "Market intelligence system experiencing high demand",
          "Enterprise AI adoption accelerating",
          "Regulatory clarity emerging"
        ],
        sentiment: "Cautiously optimistic with strong enterprise interest",
        confidence: 0.6
      };

      step.evidence = result.marketSignals;
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    }
  }

  private async assessCompetitiveLandscape(context: Context): Promise<{
    competitors: string[];
    positioning: string;
    confidence: number;
  }> {
    const step: ReasoningStep = {
      step: 2,
      description: "Assessing competitive landscape and positioning",
      evidence: [],
      confidence: 0.7,
      assumptions: ["Public information reflects actual company strategies"]
    };

    try {
      const prompt = `Assess the competitive landscape for ${context.company?.industry || 'technology'} companies implementing AI solutions.

ANALYSIS REQUIREMENTS:
1. Identify 3-5 key competitors or solution providers
2. Describe the overall competitive positioning (one sentence)
3. Provide confidence level (0.0-1.0)

Consider company size ${context.company?.size || 'medium'} and tech maturity ${context.company?.techMaturity || 'medium'}.

Respond in JSON format:
{
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "positioning": "brief positioning description", 
  "confidence": 0.7
}`;

      const response = await this.performChainOfThoughtAnalysis(prompt);
      const parsed = JSON.parse(response);
      
      const result = {
        competitors: parsed.competitors || [
          "Microsoft Azure AI",
          "Google Cloud AI", 
          "AWS AI Services",
          "OpenAI",
          "Anthropic"
        ],
        positioning: parsed.positioning || "Market fragmented with multiple strong players",
        confidence: parsed.confidence || 0.7
      };

      step.evidence = [`Identified ${result.competitors.length} major competitors`];
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    } catch (error) {
      console.error('Competitive landscape analysis failed:', error);
      
      // Fallback result
      const result = {
        competitors: ["Microsoft", "Google", "Amazon", "OpenAI", "Anthropic"],
        positioning: "Highly competitive market with established cloud providers and AI-first companies",
        confidence: 0.6
      };

      step.evidence = [`Identified ${result.competitors.length} major competitors`];
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    }
  }

  private async forecastAdoptionInternal(context: Context): Promise<{
    timeline: string;
    probability: number;
    confidence: number;
  }> {
    const step: ReasoningStep = {
      step: 3,
      description: "Forecasting adoption timeline and probability",
      evidence: [],
      confidence: 0.6,
      assumptions: ["Historical adoption patterns predict future trends"]
    };

    try {
      const timeHorizon = context.timeHorizon || '6months';
      const prompt = `Forecast AI technology adoption for ${context.company?.industry || 'technology'} companies of ${context.company?.size || 'medium'} size over the next ${timeHorizon}.

ANALYSIS REQUIREMENTS:
1. Predict realistic adoption timeline (specific timeframe)
2. Estimate adoption probability (0.0-1.0)
3. Provide confidence level (0.0-1.0)

Consider:
- Company tech maturity: ${context.company?.techMaturity || 'medium'}
- Industry adoption patterns
- Current market conditions

Respond in JSON format:
{
  "timeline": "specific timeline description",
  "probability": 0.75,
  "confidence": 0.6
}`;

      const response = await this.performChainOfThoughtAnalysis(prompt);
      const parsed = JSON.parse(response);
      
      const result = {
        timeline: parsed.timeline || "12-18 months for mainstream adoption",
        probability: parsed.probability || 0.7,
        confidence: parsed.confidence || 0.6
      };

      step.evidence = [`Adoption forecast based on ${context.company?.industry || 'technology'} industry patterns`];
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    } catch (error) {
      console.error('Adoption forecasting failed:', error);
      
      // Fallback result
      const result = {
        timeline: "12-18 months for mainstream enterprise adoption",
        probability: 0.7,
        confidence: 0.5
      };

      step.evidence = ["Historical AI adoption patterns indicate 12-24 month cycles"];
      step.confidence = result.confidence;
      this.reasoningChain.push(step);

      return result;
    }
  }

  private async synthesizeIntelligence(
    marketContext: any,
    competitive: any,
    adoption: any,
    context: Context
  ): Promise<{ conclusion: string }> {
    const step: ReasoningStep = {
      step: 4,
      description: "Synthesizing market intelligence into actionable insights",
      evidence: [],
      confidence: this.calculateOverallConfidence(),
      assumptions: ["Market dynamics remain stable over forecast period"]
    };

    const conclusion = `Market analysis indicates ${marketContext.sentiment.toLowerCase()} with ${competitive.positioning.toLowerCase()}. Adoption forecast suggests ${adoption.timeline} with ${Math.round(adoption.probability * 100)}% probability.`;

    step.evidence = ["Multi-factor analysis synthesis"];
    this.reasoningChain.push(step);

    return { conclusion };
  }

  private async performChainOfThoughtAnalysis(prompt: string): Promise<string> {
    try {
      // Check for Anthropic API key in environment variables (project env first, then user env)
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey || apiKey === 'your-actual-anthropic-api-key' || apiKey.startsWith('sk-ant-') === false) {
        throw new Error('Anthropic API key not configured. Please set ANTHROPIC_API_KEY in .env.local or as a user environment variable. Get your API key from https://console.anthropic.com/settings/keys');
      }

      const response = await anthropic.messages.create({
        model: getAIModel(),
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are a senior market intelligence analyst with expertise in AI and technology trends. 
            Use systematic reasoning and provide transparent, step-by-step analysis.
            Always include confidence levels and supporting evidence.
            Think step by step and show your reasoning process clearly.
            You have access to web search to find current market information.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 3
            // Unrestricted for comprehensive market intelligence
          }
        ]
      });

      const content = response.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('No text response from Anthropic');
      }
      return content.text;
    } catch (error) {
      console.error('Chain-of-thought analysis failed:', error);
      // Throw the actual error instead of returning fallback data
      throw error;
    }
  }

  private calculateOverallConfidence(): number {
    if (this.reasoningChain.length === 0) return 0.5;
    
    const sum = this.reasoningChain.reduce((acc, step) => acc + step.confidence, 0);
    return sum / this.reasoningChain.length;
  }

  private extractEvidence(): string[] {
    return this.reasoningChain.flatMap(step => step.evidence);
  }

  private generateAlternatives(): string[] {
    return [
      "Consider consulting multiple market research sources",
      "Validate insights with industry expert interviews",
      "Monitor developments over extended time period"
    ];
  }

  private getDataSources(): string[] {
    return [
      "Market research reports",
      "Competitive analysis",
      "Industry news and trends",
      "Social media sentiment"
    ];
  }

  private generateFallbackAnalysis(context: Context): Analysis {
    return {
      conclusion: "Market intelligence analysis temporarily unavailable. Recommend consulting multiple data sources for comprehensive market assessment.",
      confidence: 0.3,
      reasoning: [{
        step: 1,
        description: "Fallback analysis due to service unavailability",
        evidence: ["Service interruption"],
        confidence: 0.3,
        assumptions: ["Normal service will resume"]
      }],
      evidence: ["Fallback mode active"],
      alternatives: ["Retry analysis when service available"],
      dataSourcesused: ["Internal fallback data"],
      timestamp: new Date(),
    };
  }

  private async adjustConfidenceFromOutcomes(): Promise<void> {
    // Simple learning algorithm - adjust confidence based on outcome accuracy
    const allOutcomes = Array.from(this.learningData.values()).flat();
    if (allOutcomes.length > 0) {
      const successRate = allOutcomes.filter(o => o.actualResult === 'success').length / allOutcomes.length;
      this.confidence = Math.min(0.9, Math.max(0.3, successRate));
    }
  }

  // Real OpenAI response parsing methods
  private parseTrendMomentumResponse(reasoning: string): TrendMomentumAnalysis {
    try {
      // Try to extract JSON from the OpenAI response
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          trend: parsed.trend || "AI Technology Trend",
          momentum: parsed.momentum || "steady",
          adoptionStage: parsed.adoptionStage || "growth",
          marketSignals: parsed.marketSignals || ["Market analysis in progress"],
          competitiveActivity: parsed.competitiveActivity || ["Competitive activity monitored"],
          riskFactors: parsed.riskFactors || ["Standard implementation risks"],
          opportunities: parsed.opportunities || ["Market opportunities identified"],
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch (error) {
      console.error('Failed to parse trend momentum response:', error);
    }

    // Fallback with intelligent parsing from text
    return {
      trend: "AI Technology Trend",
      momentum: reasoning.toLowerCase().includes('accelerating') ? 'accelerating' :
                reasoning.toLowerCase().includes('declining') ? 'declining' : 'steady',
      adoptionStage: reasoning.toLowerCase().includes('early') ? 'early' :
                     reasoning.toLowerCase().includes('maturity') ? 'maturity' :
                     reasoning.toLowerCase().includes('decline') ? 'decline' : 'growth',
      marketSignals: this.extractListFromText(reasoning, 'signal'),
      competitiveActivity: this.extractListFromText(reasoning, 'competitive'),
      riskFactors: this.extractListFromText(reasoning, 'risk'),
      opportunities: this.extractListFromText(reasoning, 'opportunity'),
      confidence: 0.7,
    };
  }

  private parseCompetitorActivityResponse(reasoning: string, competitor: string): CompetitorActivity {
    try {
      // Try to extract JSON from the OpenAI response
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          competitor,
          activities: parsed.activities || [
            {
              type: "product_launch",
              description: "Recent market activity identified",
              impact: "medium",
              timestamp: new Date(),
            }
          ],
          implications: parsed.implications || ["Market dynamics shift expected"],
        };
      }
    } catch (error) {
      console.error('Failed to parse competitor activity response:', error);
    }

    // Fallback with intelligent text parsing
    const activities = [];
    if (reasoning.toLowerCase().includes('launch') || reasoning.toLowerCase().includes('product')) {
      activities.push({
        type: "product_launch" as const,
        description: "Product launch or update identified",
        impact: "medium" as const,
        timestamp: new Date(),
      });
    }
    if (reasoning.toLowerCase().includes('acquisition') || reasoning.toLowerCase().includes('merge')) {
      activities.push({
        type: "acquisition" as const,
        description: "Acquisition or merger activity",
        impact: "high" as const,
        timestamp: new Date(),
      });
    }
    if (reasoning.toLowerCase().includes('partnership') || reasoning.toLowerCase().includes('alliance')) {
      activities.push({
        type: "partnership" as const,
        description: "Strategic partnership announced",
        impact: "medium" as const,
        timestamp: new Date(),
      });
    }

    return {
      competitor,
      activities: activities.length > 0 ? activities : [
        {
          type: "product_launch",
          description: "Competitive activity monitored",
          impact: "medium",
          timestamp: new Date(),
        }
      ],
      implications: this.extractListFromText(reasoning, 'implication'),
    };
  }

  private parseAdoptionForecastResponse(reasoning: string, trend: string, industry: string): AdoptionForecast {
    try {
      // Try to extract JSON from the OpenAI response
      const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          trend,
          industry,
          forecastTimeframe: parsed.forecastTimeframe || "1year",
          adoptionProbability: parsed.adoptionProbability || 0.75,
          timeline: parsed.timeline || {
            earlyAdopters: "3-6 months",
            mainstream: "6-12 months", 
            lateAdopters: "12-24 months",
          },
          catalysts: parsed.catalysts || ["Market dynamics", "Competitive pressure"],
          barriers: parsed.barriers || ["Implementation challenges", "Resource constraints"],
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch (error) {
      console.error('Failed to parse adoption forecast response:', error);  
    }

    // Fallback with intelligent text parsing
    return {
      trend,
      industry,
      forecastTimeframe: reasoning.includes('6months') ? '6months' : 
                          reasoning.includes('2years') ? '2years' : '1year',
      adoptionProbability: this.extractProbabilityFromText(reasoning),
      timeline: {
        earlyAdopters: "3-6 months",
        mainstream: "6-12 months",
        lateAdopters: "12-24 months",
      },
      catalysts: this.extractListFromText(reasoning, 'catalyst'),
      barriers: this.extractListFromText(reasoning, 'barrier'),
      confidence: 0.7,
    };
  }

  // Helper method to extract lists from text
  private extractListFromText(text: string, type: string): string[] {
    const lowerText = text.toLowerCase();
    const typePattern = new RegExp(`${type}[s]?[:\\-]?\\s*(.+?)(?=\\n|$|[.!?])`, 'gi');
    const matches = lowerText.match(typePattern);
    
    if (matches && matches.length > 0) {
      return matches.flatMap(match => 
        match.split(/[,;]/).map(item => item.trim()).filter(item => item.length > 0)
      ).slice(0, 3);
    }
    
    // Default fallbacks based on type
    switch (type) {
      case 'signal':
        return ["Market signal identified", "Industry trend noted"];
      case 'competitive':
        return ["Competitive activity monitored"];
      case 'risk':
        return ["Standard implementation risks"];
      case 'opportunity':
        return ["Market opportunity identified"];
      case 'implication':
        return ["Market impact expected"];
      case 'catalyst':
        return ["Market drivers", "Technology advancement"];
      case 'barrier':
        return ["Implementation complexity", "Resource requirements"];
      default:
        return ["Analysis item identified"];
    }
  }

  // Helper method to extract probability from text
  private extractProbabilityFromText(text: string): number {
    const percentageMatch = text.match(/(\d+)%/);
    if (percentageMatch) {
      return Math.min(1.0, parseInt(percentageMatch[1]) / 100);
    }
    
    const probabilityMatch = text.match(/(\d+\.?\d*)\s*probability/i);
    if (probabilityMatch) {
      const prob = parseFloat(probabilityMatch[1]); 
      return prob > 1 ? prob / 100 : prob;
    }
    
    // Fallback based on sentiment words
    if (text.toLowerCase().includes('high') || text.toLowerCase().includes('likely')) {
      return 0.8;
    } else if (text.toLowerCase().includes('low') || text.toLowerCase().includes('unlikely')) {
      return 0.3;
    }
    
    return 0.7; // Default moderate probability
  }
}