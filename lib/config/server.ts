// Server-side configuration with Node.js dependencies
import { getConfig } from '@/lib/config/reader';

// Full server configuration interface
export interface ServerConfig {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  ai: {
    provider: string;
    model: string;
    temperature: number;
    max_tokens: number;
    systemPrompt: string;
    retry: {
      max_attempts: number;
      initial_delay: number;
      max_delay: number;
      backoff_factor: number;
    };
    streaming: {
      enabled: boolean;
      chunk_size: number;
      flush_interval: number;
    };
  };
  cache: {
    redis: {
      enabled: boolean;
      ttl: {
        trends: number;
        needs: number;
        solutions: number;
        analysis: number;
      };
    };
    memory: {
      enabled: boolean;
      max_size: number;
      ttl: {
        trends: number;
        needs: number;
        solutions: number;
      };
    };
  };
  errors: {
    show_details: boolean;
    logging: {
      enabled: boolean;
      service: string;
    };
    messages: {
      api_key_missing: string;
      rate_limit: string;
      network_error: string;
      generation_failed: string;
    };
  };
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
  rate_limiting: {
    user: {
      trends: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
      needs: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
      solutions: {
        requests_per_minute: number;
        requests_per_hour: number;
      };
    };
  };
  performance: {
    prefetch: {
      enabled: boolean;
      strategies: string[];
    };
    lazy_loading: {
      enabled: boolean;
      threshold: number;
    };
  };
  development: {
    mock_enabled: boolean;
    verbose_logging: boolean;
    api_endpoints: {
      openai: string;
    };
  };
}

// Load configuration from config.yml (server-side only)
let configCache: ServerConfig | null = null;

export function loadServerConfig(): ServerConfig {
  if (configCache) {
    return configCache;
  }

  try {
    // Use the centralized config reader and merge with defaults for missing fields
    const baseConfig = getConfig();
    const defaultConfig = getDefaultServerConfig();
    
    // Merge the configs to ensure all required fields are present
    configCache = {
      ...defaultConfig,
      ...baseConfig,
      ai: {
        ...defaultConfig.ai,
        ...baseConfig.ai,
      },
    };
    
    return configCache;
  } catch (error) {
    console.error('Failed to load config.yml:', error);
    
    // Return default configuration if file loading fails
    return getDefaultServerConfig();
  }
}

// Get default server configuration
function getDefaultServerConfig(): ServerConfig {
  return {
    app: {
      name: 'Trends',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    ai: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      max_tokens: 4000,
      systemPrompt: 'You are a market intelligence analyst with deep knowledge of current AI and technology trends. Curate current trends from authoritative sources. Always return valid JSON.',
      retry: {
        max_attempts: 3,
        initial_delay: 1000,
        max_delay: 10000,
        backoff_factor: 2,
      },
      streaming: {
        enabled: true,
        chunk_size: 50,
        flush_interval: 100,
      },
    },
    cache: {
      redis: {
        enabled: true,
        ttl: {
          trends: 1800,
          needs: 3600,
          solutions: 3600,
          analysis: 7200,
        },
      },
      memory: {
        enabled: true,
        max_size: 100,
        ttl: {
          trends: 900,
          needs: 1800,
          solutions: 1800,
        },
      },
    },
    errors: {
      show_details: true,
      logging: {
        enabled: true,
        service: 'sentry',
      },
      messages: {
        api_key_missing: 'OpenAI API key is not configured. Please contact support.',
        rate_limit: 'You\'ve reached the rate limit. Please try again in a few minutes.',
        network_error: 'Unable to connect to the AI service. Please check your internet connection.',
        generation_failed: 'Failed to generate content. Please try again or contact support if the issue persists.',
      },
    },
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
    rate_limiting: {
      user: {
        trends: {
          requests_per_minute: 10,
          requests_per_hour: 100,
        },
        needs: {
          requests_per_minute: 5,
          requests_per_hour: 50,
        },
        solutions: {
          requests_per_minute: 5,
          requests_per_hour: 50,
        },
      },
    },
    performance: {
      prefetch: {
        enabled: true,
        strategies: ['viewport', 'hover', 'priority'],
      },
      lazy_loading: {
        enabled: true,
        threshold: 0.1,
      },
    },
    development: {
      mock_enabled: process.env.NODE_ENV === 'development',
      verbose_logging: process.env.NODE_ENV === 'development',
      api_endpoints: {
        openai: process.env.OPENAI_API_ENDPOINT || 'https://api.openai.com/v1',
      },
    },
  };
}

// Export a singleton instance for server-side use
export const serverConfig = loadServerConfig();