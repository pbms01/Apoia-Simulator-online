/**
 * Tipos para resultados de execução do simulador
 */

/**
 * Resultado de uma síntese processual
 */
export interface ResultadoSintese {
  /** Questão central do processo */
  questaoCentral: string;

  /** Pontos controvertidos */
  pontosControvertidos: string[];

  /** Normas e jurisprudência citadas */
  normasInvocadas: NormaInvocada[];

  /** Palavras-chave para triagem */
  palavrasChave: string[];

  /** Sugestão de triagem/classificação */
  triagem: {
    tema: string;
    subtema?: string;
    confianca: number; // 0-1
  };

  /** Resumos das peças analisadas */
  resumosPecas: ResumoPeca[];
}

/**
 * Norma ou jurisprudência invocada
 */
export interface NormaInvocada {
  tipo: 'LEI' | 'DECRETO' | 'CF' | 'SUMULA' | 'JURISPRUDENCIA';
  referencia: string;
  artigos?: string[];
}

/**
 * Resumo de uma peça processual
 */
export interface ResumoPeca {
  pecaId: string;
  tipoPeca: string;
  resumo: string;
}

/**
 * Resultado de geração de ementa
 */
export interface ResultadoEmenta {
  /** Linha de ementa (tema principal) */
  ementa: string;

  /** Seções estruturadas conforme CNJ */
  estrutura: {
    casoExame: string;
    questaoDiscussao: string;
    razoesDecidir: string[];
    dispositivo: string;
  };

  /** Dispositivos legais relevantes */
  dispositivosCitados: string[];

  /** Jurisprudência citada */
  jurisprudenciaCitada: string[];
}

/**
 * Alteração em revisão de texto
 */
export interface AlteracaoRevisao {
  tipo: 'SUBSTITUICAO' | 'INSERCAO' | 'REMOCAO';
  original?: string;
  novo?: string;
  justificativa: string;
}

/**
 * Resultado de revisão de texto
 */
export interface ResultadoRevisao {
  /** Texto revisado */
  textoRevisado: string;

  /** Lista de alterações */
  alteracoes: AlteracaoRevisao[];

  /** Estatísticas */
  estatisticas: {
    caracteresOriginal: number;
    caracteresRevisado: number;
    numeroAlteracoes: number;
  };
}

/**
 * Métricas de uso de tokens
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Métricas de custo
 */
export interface CustoMetricas {
  custoEntrada: number; // USD
  custoSaida: number; // USD
  custoTotal: number; // USD
}

/**
 * Métricas completas de execução
 */
export interface MetricasExecucao {
  /** Tempo total em ms */
  tempoExecucao: number;
  /** Uso de tokens */
  tokens: TokenUsage;
  /** Custo estimado */
  custo: CustoMetricas;
  /** Modelo utilizado */
  modelo: string;
  /** Se usou streaming */
  streaming: boolean;
}

/**
 * Resultado genérico de execução
 */
export interface ResultadoExecucao<T = unknown> {
  /** Sucesso da execução */
  sucesso: boolean;

  /** Dados do resultado */
  dados?: T;

  /** Mensagem de erro (se falha) */
  erro?: string;

  /** Métricas de execução */
  metricas: MetricasExecucao;

  /** Prompt final enviado (para debug) */
  promptFinal?: string;

  /** Resposta bruta do modelo */
  respostaBruta?: string;
}

/**
 * Comparativo de benchmark
 */
export interface ComparativoBenchmark {
  melhorCusto: string; // Model ID
  melhorTempo: string; // Model ID
  melhorQualidade?: string; // Model ID (se avaliado)
}

/**
 * Resultado de benchmark
 */
export interface ResultadoBenchmark {
  promptId: string;
  processoId: string;
  resultados: ResultadoExecucao<string>[];
  comparativo: ComparativoBenchmark;
}
