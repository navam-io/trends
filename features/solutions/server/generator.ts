import { anthropic } from '@/lib/ai/anthropic'
import { getAIModel } from '@/lib/config/reader'
import { serverConfig } from '@/lib/config/server'
import type { 
  Solution, 
  GenerateSolutionsInput, 
  ComparisonCriteria,
  SolutionComparison 
} from '../types/solution'

export async function generateSolutions(input: GenerateSolutionsInput): Promise<Solution[]> {
  const { needTitle, needDescription, companyContext, preferences } = input
  
  const prompt = `You are an expert enterprise solution architect with deep knowledge of current technology markets, vendors, and implementation approaches. Generate 3 specific, actionable solutions for this business need.

COMPANY PROFILE:
- Company: ${companyContext.name}
- Industry: ${companyContext.industry}
- Size: ${companyContext.size} 
- Technology Maturity: ${companyContext.maturity}
${companyContext.budget ? `- Budget Range: ${companyContext.budget}` : ''}

${companyContext.challenges && companyContext.challenges.length > 0 ? `
CURRENT BUSINESS CHALLENGES:
${companyContext.challenges.map(challenge => `- ${challenge}`).join('\n')}
` : ''}

${companyContext.goals && companyContext.goals.length > 0 ? `
PRIMARY BUSINESS GOALS:
${companyContext.goals.map(goal => `- ${goal}`).join('\n')}
` : ''}

BUSINESS NEED TO SOLVE:
- Need: ${needTitle}
- Details: ${needDescription}

${companyContext.trendContext ? `
RELATED TREND CONTEXT:
${companyContext.trendContext}
` : ''}

SOLUTION REQUIREMENTS:
Generate exactly 3 solutions using these approaches:
1. BUILD - Custom development with internal/contract teams
2. BUY - Purchase existing software/platform solutions  
3. PARTNER - Engage consulting firms or technology partners

For each solution, provide:

REALISTIC COSTS based on ${companyContext.industry} industry and ${companyContext.size} company size:
- Initial investment (setup, licenses, implementation)
- Monthly ongoing costs (subscriptions, maintenance, support)
- Annual total cost of ownership

IMPLEMENTATION TIMELINES appropriate for ${companyContext.maturity} tech maturity:
- Realistic min/max timeframes in months
- Consider complexity and company readiness

ROI PROJECTIONS with business justification:
- Break-even period in months
- 3-year financial return based on ${companyContext.industry} benchmarks
- Confidence score based on solution maturity and fit

VENDOR/TECHNOLOGY RECOMMENDATIONS:
- For BUY: Name actual vendors/products in the market today
- For PARTNER: Name real consulting firms or system integrators
- For BUILD: Specify technologies, frameworks, platforms to use

RISK ASSESSMENT specific to ${companyContext.size} ${companyContext.industry} companies:
- Technical risks
- Business risks  
- Implementation risks
- Ongoing operational risks

Return valid JSON with this exact structure:
{
  "solutions": [
    {
      "approach": "build|buy|partner",
      "title": "Specific descriptive title",
      "description": "Detailed 2-3 sentence description with specifics",
      "category": "automation|analytics|customer_experience|infrastructure|security|data_management|collaboration|process_optimization",
      "vendor": "Actual vendor name (required for buy/partner, omit for build)",
      "estimatedCost": {
        "initial": realistic_number,
        "monthly": realistic_number, 
        "annual": realistic_number
      },
      "implementationTime": {
        "min": number,
        "max": number,
        "unit": "months"
      },
      "roi": {
        "breakEvenMonths": realistic_number,
        "threeYearReturn": realistic_number,
        "confidenceScore": 0.6_to_0.9
      },
      "risks": ["specific_risk_1", "specific_risk_2", "specific_risk_3", "specific_risk_4"],
      "benefits": ["specific_benefit_1", "specific_benefit_2", "specific_benefit_3", "specific_benefit_4", "specific_benefit_5"],
      "requirements": ["specific_requirement_1", "specific_requirement_2", "specific_requirement_3"],
      "alternatives": ["real_alternative_1", "real_alternative_2", "real_alternative_3"],
      "matchScore": 0.7_to_0.95_based_on_company_fit
    }
  ]
}

IMPORTANT:
- Use REAL vendor names, not generic ones (GitHub, Salesforce, Microsoft, etc.)
- Base costs on actual market rates for ${companyContext.industry} industry
- Consider ${companyContext.size} company constraints and capabilities
- Solutions must directly address the stated business challenges and goals
- Make solutions actionable and implementable within 12 months
- Ensure financial projections are realistic and justified
${companyContext.challenges && companyContext.challenges.length > 0 ? `- Each solution should explain how it addresses: ${companyContext.challenges.join(', ')}` : ''}
${companyContext.goals && companyContext.goals.length > 0 ? `- Each solution should advance these goals: ${companyContext.goals.join(', ')}` : ''}`

  try {
    const completion = await anthropic.messages.create({
      model: getAIModel(),
      max_tokens: 3000,
      temperature: 0.3,
      system: 'You are an expert enterprise solution architect with current knowledge of technology vendors, market rates, and implementation approaches. You have web search access to find the latest vendor information and pricing. Always return valid JSON with realistic, actionable solutions.',
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
          // Unrestricted for broader access to solution information
        }
      ]
    })

    const content = completion.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('No text response from Anthropic')
    }
    let response = content.text

    // Strip markdown code blocks if present (```json...```)
    if (response.trim().startsWith('```')) {
      // Remove opening ```json or ```
      response = response.replace(/^```(?:json)?\n?/, '');
      // Remove closing ```
      response = response.replace(/\n?```$/, '');
      response = response.trim();
    }

    const parsed = JSON.parse(response)
    const solutions = parsed.solutions || []
    
    if (!Array.isArray(solutions) || solutions.length === 0) {
      throw new Error('Invalid response format from AI')
    }
    
    return solutions.map((sol: any, index: number) => ({
      id: `solution_${Date.now()}_${index}`,
      needId: input.needId,
      ...sol,
      createdAt: new Date()
    }))
  } catch (error) {
    console.error('Error generating AI solutions:', error)
    
    // Re-throw with appropriate error message
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error(serverConfig.errors.messages.api_key_missing)
      } else if (error.message.includes('rate limit')) {
        throw new Error(serverConfig.errors.messages.rate_limit)
      } else if (error.message.includes('network')) {
        throw new Error(serverConfig.errors.messages.network_error)
      }
    }
    
    throw new Error(serverConfig.errors.messages.generation_failed)
  }
}

export async function compareSolutions(
  solutionIds: string[], 
  criteria: ComparisonCriteria[]
): Promise<SolutionComparison> {
  const weights: Record<ComparisonCriteria, number> = {
    cost: 0.25,
    time: 0.20,
    roi: 0.25,
    risk: 0.15,
    complexity: 0.05,
    scalability: 0.05,
    maintenance: 0.05
  }
  
  criteria.forEach(criterion => {
    weights[criterion] = weights[criterion] * 1.5
  })
  
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  Object.keys(weights).forEach(key => {
    weights[key as ComparisonCriteria] = weights[key as ComparisonCriteria] / totalWeight
  })
  
  return {
    criteria: criteria[0],
    weights,
    solutions: [],
    winner: solutionIds[0]
  }
}

export async function calculateROI(
  solutionId: string,
  customInputs?: {
    expectedRevenue?: number
    costSavings?: number
    productivityGains?: number
    initialInvestment?: number
    monthlyCost?: number
  }
): Promise<{
  monthlyROI: number
  annualROI: number
  paybackPeriod: number
  netPresentValue: number
  internalRateOfReturn: number
}> {
  // Get required inputs or throw error
  if (!customInputs || !customInputs.initialInvestment || !customInputs.monthlyCost) {
    throw new Error('ROI calculation requires initial investment and monthly cost inputs')
  }
  
  const revenue = customInputs.expectedRevenue || 0
  const savings = customInputs.costSavings || 0
  const productivity = customInputs.productivityGains || 0
  
  const totalMonthlyBenefit = (revenue + savings + productivity) / 12
  const monthlyCost = customInputs.monthlyCost
  const initialInvestment = customInputs.initialInvestment
  
  // Calculate actual ROI metrics
  const monthlyROI = totalMonthlyBenefit - monthlyCost
  const annualROI = (totalMonthlyBenefit * 12) - (monthlyCost * 12)
  
  // Calculate payback period
  const paybackPeriod = monthlyROI > 0 ? Math.ceil(initialInvestment / monthlyROI) : -1
  
  // Simplified NPV calculation (3-year horizon, 10% discount rate)
  const discountRate = 0.10
  const years = 3
  let npv = -initialInvestment
  for (let year = 1; year <= years; year++) {
    npv += annualROI / Math.pow(1 + discountRate, year)
  }
  
  // Simplified IRR calculation
  const irr = annualROI > 0 ? (annualROI - initialInvestment) / initialInvestment : 0
  
  return {
    monthlyROI,
    annualROI,
    paybackPeriod,
    netPresentValue: Math.round(npv),
    internalRateOfReturn: irr
  }
}

