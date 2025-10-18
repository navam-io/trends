import { anthropic } from '@/lib/ai/anthropic'
import { getAIModel } from '@/lib/config/reader'
import { serverConfig } from '@/lib/config/server'
import type {
  Solution,
  GenerateSolutionsInput,
  ComparisonCriteria,
  SolutionComparison
} from '../types/solution'

/**
 * Extract a balanced JSON object from text starting with '{'
 * This properly handles nested braces and finds the matching closing brace
 */
function extractBalancedJSON(text: string): string {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Handle escape sequences
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    // Handle string boundaries
    if (char === '"') {
      inString = !inString;
      continue;
    }

    // Only count braces outside of strings
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;

        // When we've closed all braces, we've found the end of the JSON
        if (braceCount === 0) {
          return text.substring(0, i + 1);
        }
      }
    }
  }

  // If we couldn't find balanced braces, return the original text
  return text;
}

/**
 * Robust JSON extraction from AI responses with markdown and conversational text
 * Tries multiple strategies and logs extensively for debugging
 */
function extractJSONFromResponse(response: string, expectedKey: string = 'solutions'): string {
  console.log('=== JSON Extraction Debug ===');
  console.log('Response length:', response.length);
  console.log('First 500 chars:', response.substring(0, 500));
  console.log('Last 200 chars:', response.substring(Math.max(0, response.length - 200)));

  // Strategy 1: Look for the expected JSON key with flexible whitespace
  const keyPattern = new RegExp(`\\{[\\s\\S]*?"${expectedKey}"[\\s\\S]*?:`, 'i');
  const keyMatch = response.search(keyPattern);

  if (keyMatch !== -1) {
    console.log(`✓ Found "${expectedKey}" key at position ${keyMatch}`);
    const jsonStart = response.substring(keyMatch);

    // Find the opening brace before the key
    const openBrace = jsonStart.indexOf('{');
    if (openBrace !== -1) {
      const extracted = extractBalancedJSON(jsonStart.substring(openBrace));
      console.log('✓ Extracted using balanced braces, length:', extracted.length);
      console.log('Extracted JSON (first 300 chars):', extracted.substring(0, 300));
      return extracted;
    }
  }

  console.log(`✗ Could not find "${expectedKey}" key, trying backup strategies...`);

  // Strategy 2: Find ANY JSON object (starts with { followed by "key": pattern)
  const anyObjectPattern = /\{\s*"[^"]+"\s*:/;
  const objectMatch = response.search(anyObjectPattern);

  if (objectMatch !== -1) {
    console.log(`✓ Found JSON object pattern at position ${objectMatch}`);
    const extracted = extractBalancedJSON(response.substring(objectMatch));
    console.log('✓ Extracted using object pattern, length:', extracted.length);
    console.log('Extracted JSON (first 300 chars):', extracted.substring(0, 300));
    return extracted;
  }

  console.log('✗ Could not find JSON object pattern, trying array...');

  // Strategy 3: Find JSON array (starts with [)
  const arrayPattern = /\[\s*\{/;
  const arrayMatch = response.search(arrayPattern);

  if (arrayMatch !== -1) {
    console.log(`✓ Found JSON array pattern at position ${arrayMatch}`);
    // For arrays, we need to match brackets instead of braces
    const arrayStart = response.substring(arrayMatch);
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < arrayStart.length; i++) {
      const char = arrayStart[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '[') bracketCount++;
        if (char === ']') {
          bracketCount--;
          if (bracketCount === 0) {
            const extracted = arrayStart.substring(0, i + 1);
            console.log('✓ Extracted array, length:', extracted.length);
            return extracted;
          }
        }
      }
    }
  }

  console.log('✗ All extraction strategies failed!');
  console.log('Returning original response (will likely fail to parse)');
  return response;
}

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

    // When AI uses web search, content may have multiple blocks
    // The JSON might be in ANY block, not necessarily the last one!
    const textBlocks = completion.content.filter(block => block.type === 'text')

    if (textBlocks.length === 0) {
      console.error('No text blocks in AI response:', JSON.stringify(completion.content, null, 2))
      throw new Error('No text response from Anthropic')
    }

    console.log(`Found ${textBlocks.length} text blocks in AI response`);

    // Search ALL text blocks for the one containing JSON with our expected key
    let responseWithJSON = '';
    let foundBlockIndex = -1;

    for (let i = 0; i < textBlocks.length; i++) {
      const blockText = textBlocks[i].text;
      console.log(`\nBlock ${i + 1}/${textBlocks.length} - Length: ${blockText.length}`);
      console.log(`First 200 chars: ${blockText.substring(0, 200)}`);

      // Check for JSON structure: "solutions": not just the word "solutions"
      // This prevents matching conversational text like "I'll research solutions"
      const hasJSONKey = blockText.includes('"solutions"') && blockText.includes(':');
      const hasJSONObject = blockText.includes('{') && blockText.includes('}');
      const hasJSONArray = blockText.includes('[') && blockText.includes(']');
      const looksLikeJSON = (hasJSONKey && hasJSONObject) || (hasJSONKey && hasJSONArray);

      if (looksLikeJSON) {
        console.log(`✓ Block ${i + 1} contains JSON structure with "solutions" key - using this block!`);
        responseWithJSON = blockText;
        foundBlockIndex = i;
        break;
      } else if (blockText.includes('"solutions"')) {
        console.log(`⚠ Block ${i + 1} has "solutions" but no JSON structure - skipping`);
      }
    }

    if (!responseWithJSON) {
      console.error('✗ No block contains JSON with "solutions" key - using last block as fallback');
      responseWithJSON = textBlocks[textBlocks.length - 1].text;
      foundBlockIndex = textBlocks.length - 1;
    }

    let response = responseWithJSON;

    // Strip markdown code blocks if present (```json...```)
    if (response.trim().startsWith('```')) {
      console.log('Removing markdown code block wrapper');
      response = response.replace(/^```(?:json)?\n?/, '');
      response = response.replace(/\n?```$/, '');
      response = response.trim();
    }

    console.log(`\nUsing block ${foundBlockIndex + 1} for JSON extraction`);

    // Use robust JSON extraction with extensive logging
    const jsonContent = extractJSONFromResponse(response, 'solutions');

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
      console.log('✓ Successfully parsed JSON');
      console.log('Parsed structure keys:', Object.keys(parsed));
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Error:', parseError instanceof Error ? parseError.message : 'Unknown error');
      console.error('Attempted to parse:', jsonContent.substring(0, 1000));
      console.error('Parse error at position:', parseError instanceof SyntaxError ? (parseError as any).message : 'unknown');
      throw new Error(`Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }

    const solutions = parsed.solutions || []

    if (!Array.isArray(solutions) || solutions.length === 0) {
      console.error('Invalid solutions array in parsed response:', parsed);
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

    // Log the full error stack for debugging
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    
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

