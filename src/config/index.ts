/**
 * Configuração central do simulador
 */

export * from './models.js';

/**
 * Configuração do simulador
 */
export interface SimulatorConfig {
  /** Modelo padrão */
  defaultModel: string;
  /** Temperature padrão */
  defaultTemperature: number;
  /** Max tokens padrão */
  defaultMaxTokens: number;
  /** Anonimizar por padrão */
  anonimizarPorPadrao: boolean;
  /** Usar streaming por padrão */
  streaming: boolean;
}

/**
 * Configuração padrão
 */
export const DEFAULT_CONFIG: SimulatorConfig = {
  defaultModel: 'gpt-4o',
  defaultTemperature: 0.3,
  defaultMaxTokens: 4096,
  anonimizarPorPadrao: true,
  streaming: false,
};
