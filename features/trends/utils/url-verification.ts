/**
 * URL Verification utilities
 * Verifies that source URLs are real and accessible, not fake/generated links
 */

export interface UrlVerificationResult {
  url: string;
  isValid: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

/**
 * Verify if a URL is accessible and returns a real article
 */
export async function verifyUrl(url: string, timeout: number = 5000): Promise<UrlVerificationResult> {
  const startTime = Date.now();
  
  try {
    // Basic URL validation first
    if (!isValidUrlFormat(url)) {
      return {
        url,
        isValid: false,
        error: 'Invalid URL format',
        responseTime: Date.now() - startTime
      };
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Use HEAD request to check if URL exists without downloading full content
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TrendsBot/1.0; URL Verification)',
        },
      });

      clearTimeout(timeoutId);
      
      return {
        url,
        isValid: response.ok,
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return {
          url,
          isValid: false,
          error: 'Request timeout',
          responseTime: timeout
        };
      }

      return {
        url,
        isValid: false,
        error: fetchError.message || 'Network error',
        responseTime: Date.now() - startTime
      };
    }
  } catch (error: any) {
    return {
      url,
      isValid: false,
      error: error.message || 'Unknown error',
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Verify multiple URLs concurrently with rate limiting
 */
export async function verifyUrls(
  urls: string[], 
  timeout: number = 5000,
  concurrency: number = 3
): Promise<UrlVerificationResult[]> {
  // Process URLs in batches to avoid overwhelming servers
  const results: UrlVerificationResult[] = [];
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchPromises = batch.map(url => verifyUrl(url, timeout));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to be respectful to servers
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Check if URL has a valid format
 */
function isValidUrlFormat(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Must use HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Must have a valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false;
    }
    
    // Check for suspicious patterns
    if (isBlacklistedDomain(urlObj.hostname)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if domain is blacklisted (known fake/placeholder domains)
 */
function isBlacklistedDomain(hostname: string): boolean {
  const blacklistedDomains = [
    'example.com',
    'example.org',
    'example.net',
    'placeholder.com',
    'fake.com',
    'test.com',
    'localhost',
    '127.0.0.1'
  ];
  
  const blacklistedPatterns = [
    /^fake-/,
    /^test-/,
    /^placeholder-/,
    /^mock-/
  ];
  
  // Check exact matches
  if (blacklistedDomains.includes(hostname.toLowerCase())) {
    return true;
  }
  
  // Check pattern matches
  return blacklistedPatterns.some(pattern => pattern.test(hostname.toLowerCase()));
}

/**
 * Enhanced URL validation that checks if URL looks like a specific article
 * (vs homepage/category page) and is from a reputable source
 */
export function isValidArticleUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Check basic format first
    if (!isValidUrlFormat(url)) {
      return false;
    }
    
    // Check if it's from a reputable tech publication
    if (!isReputableSource(urlObj.hostname)) {
      return false;
    }
    
    // Check if URL structure suggests a specific article
    if (!hasArticlePattern(url)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if domain is from a reputable tech publication
 */
function isReputableSource(hostname: string): boolean {
  const reputableDomains = [
    'techcrunch.com',
    'www.techcrunch.com',
    'reuters.com',
    'www.reuters.com',
    'bloomberg.com',
    'www.bloomberg.com',
    'theverge.com',
    'www.theverge.com',
    'venturebeat.com',
    'www.venturebeat.com',
    'wired.com',
    'www.wired.com',
    'arstechnica.com',
    'www.arstechnica.com',
    'forbes.com',
    'www.forbes.com',
    'wsj.com',
    'www.wsj.com',
    'cnbc.com',
    'www.cnbc.com',
    'cnn.com',
    'www.cnn.com',
    'bbc.com',
    'www.bbc.com',
    'nytimes.com',
    'www.nytimes.com',
    'washingtonpost.com',
    'www.washingtonpost.com',
    'ft.com',
    'www.ft.com'
  ];
  
  return reputableDomains.includes(hostname.toLowerCase());
}

/**
 * Check if URL has patterns that suggest a specific article
 */
function hasArticlePattern(url: string): boolean {
  const articlePatterns = [
    /\/\d{4}\/\d{1,2}\/\d{1,2}\//, // Date pattern: /2025/01/15/
    /\/\d{4}\/[a-z0-9-]+/,          // Year + slug: /2025/article-slug
    /\/story\/[a-z0-9-]+/,          // Wired pattern: /story/article-slug
    /\/articles\/\d{4}-\d{2}-\d{2}\//, // Bloomberg: /articles/2025-01-15/
    /\/news\/[a-z0-9-]+/,           // General news pattern
    /\/[a-z]+\/\d{4}\/\d{2}\/[a-z0-9-]+/, // Category/year/month/slug
    /\/[a-z0-9-]{10,}$/,            // Long slug at end (likely article)
  ];
  
  // Check if URL matches any article pattern
  const hasPattern = articlePatterns.some(pattern => pattern.test(url));
  
  // Check it's not just a category page
  const isCategoryPage = /\/(category|topic|section|tag|topics|sections|categories)\/[^/]+\/?$/i.test(url);
  
  // Check it's not just a homepage
  const isHomepage = /^https?:\/\/[^/]+\/?$/i.test(url);
  
  return hasPattern && !isCategoryPage && !isHomepage;
}