// Client-side configuration - no Node.js dependencies
export interface ClientConfig {
  ui: {
    loading: {
      skeleton: {
        enabled: boolean;
        animation: string;
        duration: number;
      };
      progress: {
        enabled: boolean;
        show_after: number;
        messages: string[];
      };
    };
  };
  features: {
    use_mock_data: boolean;
    streaming_responses: boolean;
    detailed_errors: boolean;
    aggressive_caching: boolean;
  };
  errors: {
    show_details: boolean;
    messages: {
      api_key_missing: string;
      rate_limit: string;
      network_error: string;
      generation_failed: string;
    };
  };
}

// Default client configuration
export const defaultClientConfig: ClientConfig = {
  ui: {
    loading: {
      skeleton: {
        enabled: true,
        animation: 'pulse',
        duration: 1000,
      },
      progress: {
        enabled: true,
        show_after: 2000,
        messages: [
          'Analyzing market trends...',
          'Generating insights...',
          'Preparing recommendations...',
          'Almost there...',
        ],
      },
    },
  },
  features: {
    use_mock_data: false,
    streaming_responses: true,
    detailed_errors: true,
    aggressive_caching: true,
  },
  errors: {
    show_details: process.env.NODE_ENV === 'development',
    messages: {
      api_key_missing: 'OpenAI API key is not configured. Please contact support.',
      rate_limit: 'You\'ve reached the rate limit. Please try again in a few minutes.',
      network_error: 'Unable to connect to the AI service. Please check your internet connection.',
      generation_failed: 'Failed to generate content. Please try again or contact support if the issue persists.',
    },
  },
};

// Client-side config instance
export const clientConfig = defaultClientConfig;