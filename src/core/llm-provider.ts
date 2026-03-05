/**
 * Provedor LLM - Abstração sobre Vercel AI SDK
 */

import { generateText, streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import {
  type ModelConfig,
  type ProviderName,
  type ApiKeys,
  MODELOS_DISPONIVEIS,
  isProviderConfigured,
  getApiKey,
} from '../config/models.js';

export class ProviderNotConfiguredError extends Error {
  constructor(provider: ProviderName) {
    super(
      `Provider "${provider}" não está configurado. Configure a API key na página de Configurações.`
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

export class ModelNotFoundError extends Error {
  constructor(modelId: string) {
    super(
      `Modelo "${modelId}" não encontrado. Use 'listar-modelos' para ver os disponíveis.`
    );
    this.name = 'ModelNotFoundError';
  }
}

export interface LLMResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  latencyMs: number;
}

export interface GenerateParams {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMProvider {
  private modelConfig: ModelConfig;
  private model: LanguageModel;
  private apiKeys?: ApiKeys;

  constructor(modelKey: string, apiKeys?: ApiKeys) {
    const config = MODELOS_DISPONIVEIS[modelKey];
    if (!config) {
      throw new ModelNotFoundError(modelKey);
    }

    if (!isProviderConfigured(config.provider, apiKeys)) {
      throw new ProviderNotConfiguredError(config.provider);
    }

    this.modelConfig = config;
    this.apiKeys = apiKeys;
    this.model = this.createModel(config);
  }

  private createModel(config: ModelConfig): LanguageModel {
    switch (config.provider) {
      case 'openai': {
        const openai = createOpenAI({
          apiKey: getApiKey('openai', this.apiKeys),
        });
        return openai(config.modelId);
      }
      case 'anthropic': {
        const anthropic = createAnthropic({
          apiKey: getApiKey('anthropic', this.apiKeys),
        });
        return anthropic(config.modelId);
      }
      case 'google': {
        const google = createGoogleGenerativeAI({
          apiKey: getApiKey('google', this.apiKeys),
        });
        return google(config.modelId);
      }
      default:
        throw new Error(`Provider não suportado: ${config.provider}`);
    }
  }

  async generate(params: GenerateParams): Promise<LLMResponse> {
    const startTime = Date.now();

    const result = await generateText({
      model: this.model,
      system: params.system,
      prompt: params.prompt,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 4096,
    });

    const latencyMs = Date.now() - startTime;

    return {
      text: result.text,
      usage: {
        promptTokens: result.usage?.promptTokens ?? 0,
        completionTokens: result.usage?.completionTokens ?? 0,
        totalTokens: (result.usage?.promptTokens ?? 0) + (result.usage?.completionTokens ?? 0),
      },
      finishReason: result.finishReason ?? 'stop',
      latencyMs,
    };
  }

  async *generateStream(params: GenerateParams): AsyncGenerator<string, LLMResponse> {
    const startTime = Date.now();
    let fullText = '';
    let finalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    let finalFinishReason = 'stop';

    const result = streamText({
      model: this.model,
      system: params.system,
      prompt: params.prompt,
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 4096,
    });

    for await (const chunk of result.textStream) {
      fullText += chunk;
      yield chunk;
    }

    const finalResult = await result;
    const usage = await finalResult.usage;
    const finishReason = await finalResult.finishReason;
    finalUsage = {
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      totalTokens: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
    };
    finalFinishReason = finishReason ?? 'stop';

    const latencyMs = Date.now() - startTime;

    return {
      text: fullText,
      usage: finalUsage,
      finishReason: finalFinishReason,
      latencyMs,
    };
  }

  calcularCusto(promptTokens: number, completionTokens: number): number {
    const custoInput = (promptTokens / 1000) * this.modelConfig.costPer1kInput;
    const custoOutput = (completionTokens / 1000) * this.modelConfig.costPer1kOutput;
    return custoInput + custoOutput;
  }

  get config(): ModelConfig { return this.modelConfig; }
  get modelId(): string { return this.modelConfig.id; }
  get displayName(): string { return this.modelConfig.displayName; }
}
