/**
 * Tipos para configuração e execução de prompts
 * Baseado na taxonomia do APOIA
 */

import type { ProcessoJudicial } from './process.js';
import type { ApiKeys } from '../config/models.js';

/**
 * Categoria do prompt conforme taxonomia APOIA
 */
export type CategoriaPrompt =
  | 'SINTESE' // Resumos e sínteses
  | 'EMENTA' // Geração de ementas
  | 'REVISAO' // Revisão de texto
  | 'RELATORIO' // Relatórios de acervo
  | 'CHAT' // Conversação
  | 'TRIAGEM' // Classificação/triagem
  | 'EXTRACAO'; // Extração de informações

/**
 * Tipo de alvo do prompt
 */
export type AlvoPrompt =
  | 'PECAS' // Opera sobre peças processuais
  | 'TEXTO' // Opera sobre texto livre
  | 'REFINAMENTO'; // Refina texto existente

/**
 * Segmento de justiça
 */
export type SegmentoJustica =
  | 'JF' // Justiça Federal
  | 'JE' // Justiça Estadual
  | 'JT' // Justiça do Trabalho
  | 'JM' // Justiça Militar
  | 'JEL' // Justiça Eleitoral
  | 'STF'
  | 'STJ'
  | 'CNJ';

/**
 * Instância processual
 */
export type Instancia = '1ª' | '2ª' | '3ª' | '4ª' | 'SUPERIOR' | 'ORIGINARIA';

/**
 * Natureza/matéria
 */
export type Natureza = 'CIVEL' | 'CRIMINAL' | 'TRABALHISTA' | 'ELEITORAL' | 'MILITAR';

/**
 * Configuração de seleção de peças
 */
export interface SelecaoPecasConfig {
  /** Estratégia de seleção */
  estrategia: 'TODAS' | 'PRINCIPAIS' | 'RECENTES' | 'CUSTOMIZADA';
  /** Tipos de peças a incluir */
  tiposIncluir?: string[];
  /** Tipos de peças a excluir */
  tiposExcluir?: string[];
  /** Limite máximo de peças */
  limite?: number;
}

/**
 * Parâmetros de execução do modelo
 */
export interface ParametrosModelo {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Metadados do prompt
 */
export interface PromptMetadata {
  dataCriacao: Date;
  dataAtualizacao: Date;
  estrelas: number;
  usosTotal: number;
}

/**
 * Configuração completa de um prompt
 */
export interface PromptConfig {
  /** Identificador único */
  id: string;

  /** Nome descritivo */
  nome: string;

  /** Autor/origem */
  autor: string;

  /** Versão do prompt */
  versao: string;

  /** Categoria funcional */
  categoria: CategoriaPrompt;

  /** Tipo de entrada esperada */
  alvo: AlvoPrompt;

  /** Segmentos aplicáveis */
  segmentos?: SegmentoJustica[];

  /** Instâncias aplicáveis */
  instancias?: Instancia[];

  /** Naturezas aplicáveis */
  naturezas?: Natureza[];

  /** Template do prompt (com placeholders) */
  template: string;

  /** System prompt (instruções ao modelo) */
  systemPrompt: string;

  /** Configuração de seleção de peças */
  selecaoPecas?: SelecaoPecasConfig;

  /** Parâmetros de execução */
  parametros?: ParametrosModelo;

  /** Resumir peças antes de enviar */
  resumirPecas: boolean;

  /** Metadados */
  metadata?: PromptMetadata;
}

/**
 * Entrada para execução de prompt
 */
export interface PromptInput {
  /** ID do prompt a executar */
  promptId: string;

  /** Processo alvo (para prompts baseados em peças) */
  processo?: ProcessoJudicial;

  /** Texto de entrada (para prompts baseados em texto) */
  texto?: string;

  /** Modelo LLM a usar */
  modelo: string;

  /** Sobrescrever parâmetros */
  parametrosOverride?: ParametrosModelo;

  /** Habilitar anonimização */
  anonimizar?: boolean;

  /** Habilitar streaming */
  streaming?: boolean;

  /** Callback para chunks de streaming */
  onChunk?: (chunk: string) => void;

  /** API keys dinâmicas */
  apiKeys?: ApiKeys;
}

/**
 * Registro de prompts carregados
 */
export interface PromptRegistry {
  prompts: Map<string, PromptConfig>;
  porCategoria: Map<CategoriaPrompt, PromptConfig[]>;
}

/**
 * Dados YAML do prompt (para carregamento)
 */
export interface PromptYAML {
  id: string;
  nome: string;
  autor: string;
  versao: string;
  categoria: CategoriaPrompt;
  alvo: AlvoPrompt;
  segmentos?: SegmentoJustica[];
  instancias?: Instancia[];
  naturezas?: Natureza[];
  template: string;
  systemPrompt: string;
  selecaoPecas?: SelecaoPecasConfig;
  parametros?: ParametrosModelo;
  resumirPecas: boolean;
}
