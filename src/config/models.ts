/**
 * Registro de modelos LLM disponíveis
 */

export type ProviderName = 'openai' | 'anthropic' | 'google';

export interface ModelConfig {
  id: string;
  provider: ProviderName;
  modelId: string;
  displayName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsStreaming: boolean;
  supportsImages: boolean;
}

export const MODELOS_DISPONIVEIS: Record<string, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o', provider: 'openai', modelId: 'gpt-4o', displayName: 'GPT-4o',
    contextWindow: 128000, costPer1kInput: 0.0025, costPer1kOutput: 0.01,
    supportsStreaming: true, supportsImages: true,
  },
  'gpt-4.1': {
    id: 'gpt-4.1', provider: 'openai', modelId: 'gpt-4.1', displayName: 'GPT-4.1',
    contextWindow: 1000000, costPer1kInput: 0.002, costPer1kOutput: 0.008,
    supportsStreaming: true, supportsImages: true,
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini', provider: 'openai', modelId: 'gpt-4.1-mini', displayName: 'GPT-4.1 Mini',
    contextWindow: 1000000, costPer1kInput: 0.0004, costPer1kOutput: 0.0016,
    supportsStreaming: true, supportsImages: true,
  },
  'o3-mini': {
    id: 'o3-mini', provider: 'openai', modelId: 'o3-mini', displayName: 'O3 Mini',
    contextWindow: 200000, costPer1kInput: 0.00115, costPer1kOutput: 0.0046,
    supportsStreaming: true, supportsImages: true,
  },
  'claude-sonnet-4': {
    id: 'claude-sonnet-4', provider: 'anthropic', modelId: 'claude-sonnet-4-20250514', displayName: 'Claude Sonnet 4',
    contextWindow: 200000, costPer1kInput: 0.003, costPer1kOutput: 0.015,
    supportsStreaming: true, supportsImages: true,
  },
  'claude-opus-4': {
    id: 'claude-opus-4', provider: 'anthropic', modelId: 'claude-opus-4-20250514', displayName: 'Claude Opus 4',
    contextWindow: 200000, costPer1kInput: 0.015, costPer1kOutput: 0.075,
    supportsStreaming: true, supportsImages: true,
  },
  'claude-3-5-haiku': {
    id: 'claude-3-5-haiku', provider: 'anthropic', modelId: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku',
    contextWindow: 200000, costPer1kInput: 0.0008, costPer1kOutput: 0.004,
    supportsStreaming: true, supportsImages: true,
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro', provider: 'google', modelId: 'gemini-2.5-pro-preview-05-06', displayName: 'Gemini 2.5 Pro',
    contextWindow: 1000000, costPer1kInput: 0.00125, costPer1kOutput: 0.01,
    supportsStreaming: true, supportsImages: true,
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash', provider: 'google', modelId: 'gemini-2.5-flash-preview-05-20', displayName: 'Gemini 2.5 Flash',
    contextWindow: 1000000, costPer1kInput: 0.00015, costPer1kOutput: 0.0006,
    supportsStreaming: true, supportsImages: true,
  },
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash', provider: 'google', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash',
    contextWindow: 1000000, costPer1kInput: 0.0001, costPer1kOutput: 0.0004,
    supportsStreaming: true, supportsImages: true,
  },
};

export type ApiKeys = Partial<Record<ProviderName, string>>;

export const API_KEY_ENV_VARS: Record<ProviderName, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODELOS_DISPONIVEIS[modelId];
}

export function listModels(): ModelConfig[] {
  return Object.values(MODELOS_DISPONIVEIS);
}

export function listModelsByProvider(provider: ProviderName): ModelConfig[] {
  return Object.values(MODELOS_DISPONIVEIS).filter((m) => m.provider === provider);
}

export function getApiKey(provider: ProviderName, apiKeys?: ApiKeys): string | undefined {
  return apiKeys?.[provider] || process.env[API_KEY_ENV_VARS[provider]];
}

export function isProviderConfigured(provider: ProviderName, apiKeys?: ApiKeys): boolean {
  return !!getApiKey(provider, apiKeys);
}

export function getConfiguredProviders(apiKeys?: ApiKeys): ProviderName[] {
  return (['openai', 'anthropic', 'google'] as ProviderName[]).filter(
    (p) => isProviderConfigured(p, apiKeys)
  );
}

export function getAvailableModels(apiKeys?: ApiKeys): ModelConfig[] {
  const configuredProviders = getConfiguredProviders(apiKeys);
  return Object.values(MODELOS_DISPONIVEIS).filter((m) =>
    configuredProviders.includes(m.provider)
  );
}
