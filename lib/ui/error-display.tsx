import React from 'react';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './button';
import { clientConfig } from '@/lib/config/client';

interface ErrorDisplayProps {
  error: Error | unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ error, onRetry, className = '' }: ErrorDisplayProps) {
  let errorMessage = clientConfig.errors.messages.generation_failed;
  let errorDetails: string | undefined;
  
  if (error instanceof Error) {
    // Check for specific error types and use configured messages
    if (error.message.includes(clientConfig.errors.messages.api_key_missing)) {
      errorMessage = clientConfig.errors.messages.api_key_missing;
    } else if (error.message.includes(clientConfig.errors.messages.rate_limit)) {
      errorMessage = clientConfig.errors.messages.rate_limit;
    } else if (error.message.includes(clientConfig.errors.messages.network_error)) {
      errorMessage = clientConfig.errors.messages.network_error;
    } else if (clientConfig.errors.show_details) {
      errorDetails = error.message;
    }
  }
  
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorMessage}</p>
            {errorDetails && (
              <p className="mt-2 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
                {errorDetails}
              </p>
            )}
          </div>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InlineErrorProps {
  error: Error | unknown;
  className?: string;
}

export function InlineError({ error, className = '' }: InlineErrorProps) {
  let errorMessage = 'An error occurred';
  
  if (error instanceof Error) {
    if (error.message.includes(clientConfig.errors.messages.api_key_missing)) {
      errorMessage = clientConfig.errors.messages.api_key_missing;
    } else if (error.message.includes(clientConfig.errors.messages.rate_limit)) {
      errorMessage = 'Rate limit reached';
    } else if (error.message.includes(clientConfig.errors.messages.network_error)) {
      errorMessage = 'Network error';
    } else if (clientConfig.errors.show_details) {
      errorMessage = error.message;
    }
  }
  
  return (
    <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{errorMessage}</span>
    </div>
  );
}