import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface AIConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  retry?: {
    max_attempts: number;
    initial_delay: number;
    max_delay: number;
    backoff_factor: number;
  };
  streaming?: {
    enabled: boolean;
    chunk_size: number;
    flush_interval: number;
  };
}

interface Config {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  ai: AIConfig;
  [key: string]: unknown;
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = path.join(process.cwd(), 'config.yml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    cachedConfig = yaml.load(fileContents) as Config;
    
    // Process environment variable substitutions
    const configStr = JSON.stringify(cachedConfig);
    const processedStr = configStr.replace(/\$\{([^}]+)\}/g, (match, expr) => {
      try {
        // Safely evaluate simple expressions like NODE_ENV
        if (expr === 'NODE_ENV') {
          return process.env.NODE_ENV || 'development';
        }
        // Handle ternary expressions for development flags
        if (expr.includes('NODE_ENV')) {
          const isDev = process.env.NODE_ENV === 'development';
          if (expr.includes('?')) {
            return expr.includes('true : false') ? String(isDev) : String(!isDev);
          }
        }
        // Handle environment variable with fallback
        if (expr.includes('||')) {
          const [envVar, fallback] = expr.split('||').map((s: string) => s.trim());
          const envVarName = envVar.replace(/process\.env\./, '').replace(/['"]/g, '');
          return process.env[envVarName] || fallback.replace(/['"]/g, '');
        }
        return match;
      } catch {
        return match;
      }
    });
    
    cachedConfig = JSON.parse(processedStr);
    return cachedConfig!;
  } catch (error) {
    console.error('Error reading config.yml:', error);
    // Fallback configuration
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
      },
    };
  }
}

export function getAIConfig(): AIConfig {
  const config = getConfig();
  return config.ai;
}

export function getAIModel(): string {
  const aiConfig = getAIConfig();
  return aiConfig.model;
}