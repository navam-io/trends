import { clientConfig } from '@/lib/config/client';

export interface StreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Process streaming responses from AI APIs
 */
export async function processStreamingResponse(
  response: Response,
  options: StreamingOptions
): Promise<string> {
  if (!clientConfig.features.streaming_responses) {
    // Fallback to non-streaming if disabled
    const text = await response.text();
    options.onComplete?.(text);
    return text;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process chunks based on configured chunk size (default 50)
      const chunkSize = 50;
      const flushInterval = 100;
      while (buffer.length >= chunkSize) {
        const chunkToSend = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);
        fullText += chunkToSend;
        options.onChunk?.(chunkToSend);
        
        // Add small delay for smooth streaming effect
        await new Promise(resolve => setTimeout(resolve, flushInterval));
      }
    }

    // Send remaining buffer
    if (buffer.length > 0) {
      fullText += buffer;
      options.onChunk?.(buffer);
    }

    options.onComplete?.(fullText);
    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Streaming failed');
    options.onError?.(err);
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * React hook for streaming text responses
 */
export function useStreamingText() {
  const [text, setText] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const stream = React.useCallback(async (
    fetchFn: () => Promise<Response>,
    options?: Partial<StreamingOptions>
  ) => {
    setText('');
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetchFn();
      
      await processStreamingResponse(response, {
        onChunk: (chunk) => {
          setText(prev => prev + chunk);
          options?.onChunk?.(chunk);
        },
        onComplete: (fullText) => {
          setText(fullText);
          setIsStreaming(false);
          options?.onComplete?.(fullText);
        },
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
          options?.onError?.(err);
        },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Streaming failed');
      setError(error);
      setIsStreaming(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setText('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    text,
    isStreaming,
    error,
    stream,
    reset,
  };
}

// Import React for the hook
import React from 'react';