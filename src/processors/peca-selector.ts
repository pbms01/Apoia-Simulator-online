/**
 * Seletor de peças processuais relevantes
 */

import type { PecaProcessual } from '../types/process.js';
import type { CategoriaPrompt, SelecaoPecasConfig } from '../types/prompt.js';

/**
 * Códigos de peças por relevância (baseado no APOIA)
 */
const PECAS_PRINCIPAIS = [
  'PET1', // Petição Inicial
  'PETICAO_INICIAL',
  'CONT', // Contestação
  'CONTESTACAO',
  'SENT', // Sentença
  'SENTENCA',
  'ACOR', // Acórdão
  'ACORDAO',
  'VOTO', // Voto
  'DECIS', // Decisão
  'DECISAO',
  'DESPADEC', // Despacho/Decisão
  'DESPACHO',
  'RECURSO', // Recurso genérico
  'APEL', // Apelação
  'APELACAO',
  'AGRAVO', // Agravo
  'EMBDECL', // Embargos de Declaração
  'PARECER', // Parecer
  'LAUDO', // Laudo pericial
];

/**
 * Peças geralmente menos relevantes para síntese
 */
const PECAS_AUXILIARES = [
  'CERT', // Certidão
  'CERTIDAO',
  'COMPROV', // Comprovante
  'COMPROVANTE',
  'PROCUR', // Procuração
  'PROCURACAO',
  'GUIA', // Guia de recolhimento
  'OFICIO', // Ofício
  'MANDAT', // Mandato
  'MANDATO',
  'AR', // Aviso de Recebimento
  'INTIMACAO', // Intimação
];

/**
 * Mapeamento de categoria para tipos de peças prioritárias
 */
const PRIORIDADE_POR_CATEGORIA: Record<CategoriaPrompt, string[]> = {
  SINTESE: ['PET1', 'PETICAO_INICIAL', 'CONT', 'CONTESTACAO', 'SENT', 'SENTENCA', 'ACOR', 'ACORDAO', 'DECISAO'],
  EMENTA: ['ACOR', 'ACORDAO', 'VOTO', 'SENT', 'SENTENCA'],
  REVISAO: ['SENT', 'SENTENCA', 'ACOR', 'ACORDAO', 'DECISAO', 'DESPACHO'],
  RELATORIO: ['SENT', 'SENTENCA', 'ACOR', 'ACORDAO', 'PET1', 'PETICAO_INICIAL'],
  CHAT: PECAS_PRINCIPAIS,
  TRIAGEM: ['PET1', 'PETICAO_INICIAL', 'CONT', 'CONTESTACAO'],
  EXTRACAO: ['PET1', 'PETICAO_INICIAL', 'SENT', 'SENTENCA', 'ACOR', 'ACORDAO', 'CERTIDAO'],
};

/**
 * Opções de seleção
 */
export interface SelectorOptions {
  /** Máximo de peças a selecionar */
  maxPecas?: number;
  /** Máximo de tokens estimado */
  maxTokens?: number;
  /** Tipos de peças a excluir */
  tiposExcluidos?: string[];
}

/**
 * Classe para seleção de peças relevantes
 */
export class PecaSelector {
  /**
   * Seleciona peças conforme configuração do prompt
   */
  selecionar(
    pecas: PecaProcessual[],
    config?: SelecaoPecasConfig,
    categoria?: CategoriaPrompt
  ): PecaProcessual[] {
    if (!config) {
      // Usar seleção padrão por categoria
      return this.selecionarPorCategoria(pecas, categoria ?? 'SINTESE');
    }

    let resultado = [...pecas];

    // Filtrar por nível de sigilo (apenas públicas por padrão)
    resultado = resultado.filter((p) => p.nivelSigilo === 0);

    // Aplicar filtros de tipo
    if (config.tiposIncluir?.length) {
      resultado = resultado.filter((p) =>
        config.tiposIncluir!.some(
          (tipo) => p.codigo.toUpperCase().startsWith(tipo.toUpperCase()) || p.tipo.toUpperCase().includes(tipo.toUpperCase())
        )
      );
    }

    if (config.tiposExcluir?.length) {
      resultado = resultado.filter(
        (p) =>
          !config.tiposExcluir!.some(
            (tipo) => p.codigo.toUpperCase().startsWith(tipo.toUpperCase()) || p.tipo.toUpperCase().includes(tipo.toUpperCase())
          )
      );
    }

    // Aplicar estratégia
    switch (config.estrategia) {
      case 'TODAS':
        // Manter todas (já filtradas)
        break;

      case 'PRINCIPAIS':
        resultado = this.selecionarPrincipais(resultado);
        break;

      case 'RECENTES':
        resultado = this.selecionarRecentes(resultado, config.limite ?? 10);
        break;

      case 'CUSTOMIZADA':
        // Já aplicados os filtros acima
        break;
    }

    // Aplicar limite
    if (config.limite && resultado.length > config.limite) {
      resultado = resultado.slice(0, config.limite);
    }

    // Ordenar por data de juntada
    resultado.sort((a, b) => new Date(a.dataJuntada).getTime() - new Date(b.dataJuntada).getTime());

    return resultado;
  }

  /**
   * Seleciona peças por categoria de prompt
   */
  selecionarPorCategoria(pecas: PecaProcessual[], categoria: CategoriaPrompt): PecaProcessual[] {
    const prioridade = PRIORIDADE_POR_CATEGORIA[categoria] ?? PECAS_PRINCIPAIS;

    // Filtrar peças públicas
    const pecasPublicas = pecas.filter((p) => p.nivelSigilo === 0);

    // Encontrar peças prioritárias
    const principais = pecasPublicas.filter((p) =>
      prioridade.some(
        (codigo) => p.codigo.toUpperCase().startsWith(codigo.toUpperCase()) || p.tipo.toUpperCase().includes(codigo.toUpperCase())
      )
    );

    // Se não encontrou nenhuma principal, retorna as 5 maiores
    if (principais.length === 0) {
      return [...pecasPublicas].sort((a, b) => b.numeroPaginas - a.numeroPaginas).slice(0, 5);
    }

    // Ordenar por data
    principais.sort((a, b) => new Date(a.dataJuntada).getTime() - new Date(b.dataJuntada).getTime());

    return principais;
  }

  /**
   * Seleciona peças principais (petição, contestação, sentença, etc.)
   */
  private selecionarPrincipais(pecas: PecaProcessual[]): PecaProcessual[] {
    const principais = pecas.filter((p) =>
      PECAS_PRINCIPAIS.some(
        (codigo) => p.codigo.toUpperCase().startsWith(codigo.toUpperCase()) || p.tipo.toUpperCase().includes(codigo.toUpperCase())
      )
    );

    // Se não encontrou nenhuma principal, retorna as 5 maiores
    if (principais.length === 0) {
      return [...pecas].sort((a, b) => b.numeroPaginas - a.numeroPaginas).slice(0, 5);
    }

    return principais;
  }

  /**
   * Seleciona peças mais recentes
   */
  private selecionarRecentes(pecas: PecaProcessual[], limite: number): PecaProcessual[] {
    return [...pecas]
      .sort((a, b) => new Date(b.dataJuntada).getTime() - new Date(a.dataJuntada).getTime())
      .slice(0, limite);
  }

  /**
   * Estima tokens de um conjunto de peças
   */
  estimarTokens(pecas: PecaProcessual[]): number {
    const totalCaracteres = pecas.reduce((sum, p) => sum + p.conteudo.length, 0);
    // Estimativa: ~4 caracteres por token em português
    return Math.ceil(totalCaracteres / 4);
  }

  /**
   * Seleciona peças respeitando limite de tokens
   */
  selecionarComLimiteTokens(
    pecas: PecaProcessual[],
    maxTokens: number,
    categoria?: CategoriaPrompt
  ): PecaProcessual[] {
    // Primeiro, selecionar por categoria
    const selecionadas = this.selecionarPorCategoria(pecas, categoria ?? 'SINTESE');

    // Depois, limitar por tokens
    const resultado: PecaProcessual[] = [];
    let tokensAcumulados = 0;

    for (const peca of selecionadas) {
      const tokensEstimados = Math.ceil(peca.conteudo.length / 4);
      if (tokensAcumulados + tokensEstimados > maxTokens) {
        break;
      }
      resultado.push(peca);
      tokensAcumulados += tokensEstimados;
    }

    return resultado;
  }

  /**
   * Verifica se uma peça é do tipo auxiliar
   */
  isPecaAuxiliar(peca: PecaProcessual): boolean {
    return PECAS_AUXILIARES.some(
      (codigo) => peca.codigo.toUpperCase().startsWith(codigo.toUpperCase()) || peca.tipo.toUpperCase().includes(codigo.toUpperCase())
    );
  }
}

/**
 * Instância singleton para uso rápido
 */
export const pecaSelector = new PecaSelector();
