// Removed server config dependency for client-side compatibility

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry
  } = options;

  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on certain errors
      if (shouldNotRetry(lastError)) {
        throw lastError;
      }
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Call retry callback if provided
      onRetry?.(attempt, lastError);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Determine if an error should not be retried
 */
function shouldNotRetry(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry on API key errors
  if (message.includes('api key') || message.includes('unauthorized')) {
    return true;
  }
  
  // Don't retry on validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return true;
  }
  
  // Don't retry on not found errors
  if (message.includes('not found') || message.includes('404')) {
    return true;
  }
  
  return false;
}

/**
 * React hook for retry functionality
 */
export function useRetry() {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  const retryWithState = React.useCallback(async <T,>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    setIsRetrying(true);
    setRetryCount(0);
    
    try {
      const result = await withRetry(fn, {
        ...options,
        onRetry: (attempt, error) => {
          setRetryCount(attempt);
          options.onRetry?.(attempt, error);
        }
      });
      
      setIsRetrying(false);
      return result;
    } catch (error) {
      setIsRetrying(false);
      throw error;
    }
  }, []);
  
  const reset = React.useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);
  
  return {
    retryCount,
    isRetrying,
    retry: retryWithState,
    reset
  };
}

// Import React for the hook
import React from 'react';