/**
 * Anonimizador de dados sensíveis em textos jurídicos
 */

/**
 * Padrão de anonimização
 */
interface AnonymizationPattern {
  nome: string;
  regex: RegExp;
  substituicao: string;
}

/**
 * Padrões para identificação de dados sensíveis
 * IMPORTANTE: A ordem dos padrões importa! Padrões mais específicos devem vir primeiro.
 */
const PADROES: AnonymizationPattern[] = [
  // Cartão de crédito deve vir antes de telefone (16 dígitos com separadores)
  {
    nome: 'CARTAO_CREDITO',
    regex: /\b\d{4}[\s.-]?\d{4}[\s.-]?\d{4}[\s.-]?\d{4}\b/g,
    substituicao: '[CARTAO_ANONIMIZADO]',
  },
  // CNPJ deve vir antes de CPF (mais específico - 14 dígitos)
  {
    nome: 'CNPJ',
    regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    substituicao: '[CNPJ_ANONIMIZADO]',
  },
  // CPF (11 dígitos com formatação específica)
  {
    nome: 'CPF',
    regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    substituicao: '[CPF_ANONIMIZADO]',
  },
  {
    nome: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    substituicao: '[EMAIL_ANONIMIZADO]',
  },
  // Telefone com DDD entre parênteses - padrão mais específico
  {
    nome: 'TELEFONE_DDD',
    regex: /\(\d{2}\)\s?\d{4,5}-?\d{4}/g,
    substituicao: '[TELEFONE_ANONIMIZADO]',
  },
  // Telefone com +55
  {
    nome: 'TELEFONE_55',
    regex: /\+55\s?\d{2}\s?\d{4,5}-?\d{4}/g,
    substituicao: '[TELEFONE_ANONIMIZADO]',
  },
  // Telefone simples (sem DDD, 8-9 dígitos com hífen)
  {
    nome: 'TELEFONE_SIMPLES',
    regex: /\b\d{4,5}-\d{4}\b/g,
    substituicao: '[TELEFONE_ANONIMIZADO]',
  },
  {
    nome: 'CEP',
    regex: /\b\d{5}-?\d{3}\b/g,
    substituicao: '[CEP_ANONIMIZADO]',
  },
  {
    nome: 'RG',
    regex: /\b(?:RG[\s:]*)?(\d{1,2}\.?\d{3}\.?\d{3}-?[0-9Xx])\b/gi,
    substituicao: '[RG_ANONIMIZADO]',
  },
  {
    nome: 'OAB',
    regex: /\bOAB[\s\/]*[A-Z]{2}[\s:]*\d{3,6}\b/gi,
    substituicao: '[OAB_ANONIMIZADO]',
  },
  {
    nome: 'CONTA_BANCARIA',
    regex: /\b(?:conta|c\/c|c\.c\.)[\s:]*\d{4,12}[-.]?\d?\b/gi,
    substituicao: '[CONTA_ANONIMIZADA]',
  },
  {
    nome: 'AGENCIA',
    regex: /\b(?:ag[eê]ncia|ag\.?)[\s:]*\d{4,6}[-.]?\d?\b/gi,
    substituicao: '[AGENCIA_ANONIMIZADA]',
  },
  {
    nome: 'PLACA',
    regex: /\b[A-Z]{3}-?\d{4}\b|\b[A-Z]{3}\d[A-Z]\d{2}\b/gi,
    substituicao: '[PLACA_ANONIMIZADA]',
  },
];

/**
 * Termos jurídicos que precedem nomes (para identificação)
 */
const TERMOS_ANTES_NOME = [
  'autor',
  'autora',
  'autores',
  'autoras',
  'réu',
  'ré',
  'réus',
  'rés',
  'requerente',
  'requerido',
  'requerida',
  'reclamante',
  'reclamado',
  'reclamada',
  'apelante',
  'apelado',
  'apelada',
  'agravante',
  'agravado',
  'agravada',
  'impetrante',
  'impetrado',
  'impetrada',
  'exequente',
  'executado',
  'executada',
  'embargante',
  'embargado',
  'embargada',
  'paciente',
  'querelante',
  'querelado',
  'denunciante',
  'denunciado',
  'denunciada',
];

/**
 * Termos jurídicos que NÃO devem ser anonimizados
 */
const EXCECOES_JURIDICAS = new Set([
  'Ministério Público Federal',
  'Ministério Público',
  'Ministério Público Estadual',
  'Instituto Nacional do Seguro Social',
  'Instituto Nacional',
  'Justiça Federal',
  'Tribunal Regional Federal',
  'Superior Tribunal de Justiça',
  'Supremo Tribunal Federal',
  'União Federal',
  'União',
  'Advocacia Geral da União',
  'Defensoria Pública',
  'Defensoria Pública da União',
  'Procuradoria Geral',
  'Conselho Nacional de Justiça',
  'Banco Central do Brasil',
  'Caixa Econômica Federal',
  'Banco do Brasil',
  'INSS',
  'IBAMA',
  'INCRA',
  'Receita Federal',
  'Fazenda Nacional',
  'Fazenda Pública',
]);

/**
 * Opções de anonimização
 */
export interface AnonymizationOptions {
  /** Manter nomes próprios (não anonimizar) */
  manterNomes?: boolean;
  /** Manter endereços (não anonimizar CEPs) */
  manterEnderecos?: boolean;
  /** Usar substituições numeradas para rastreamento */
  substituicoesNumeradas?: boolean;
}

/**
 * Classe para anonimização de dados sensíveis
 */
export class Anonymizer {
  private substituicoes: Map<string, string> = new Map();
  private contadores: Record<string, number> = {};

  /**
   * Anonimiza texto substituindo dados sensíveis
   */
  anonimizar(texto: string, opcoes: AnonymizationOptions = {}): string {
    // Reset estado para cada texto
    this.reset();

    let resultado = texto;

    // Aplicar padrões de anonimização
    for (const padrao of PADROES) {
      // Pular CEP se manterEnderecos
      if (padrao.nome === 'CEP' && opcoes.manterEnderecos) {
        continue;
      }

      if (opcoes.substituicoesNumeradas) {
        resultado = this.substituirPadraoNumerado(resultado, padrao);
      } else {
        resultado = resultado.replace(padrao.regex, padrao.substituicao);
      }
    }

    // Anonimizar nomes próprios (se não desabilitado)
    if (!opcoes.manterNomes) {
      resultado = this.anonimizarNomes(resultado, opcoes.substituicoesNumeradas);
    }

    return resultado;
  }

  /**
   * Substitui ocorrências de um padrão com numeração
   */
  private substituirPadraoNumerado(texto: string, padrao: AnonymizationPattern): string {
    return texto.replace(padrao.regex, (match) => {
      // Verificar se já foi substituído
      if (this.substituicoes.has(match)) {
        return this.substituicoes.get(match)!;
      }

      // Criar nova substituição numerada
      this.contadores[padrao.nome] = (this.contadores[padrao.nome] || 0) + 1;
      const substituto = `[${padrao.nome}_${this.contadores[padrao.nome]}]`;
      this.substituicoes.set(match, substituto);

      return substituto;
    });
  }

  /**
   * Anonimiza nomes próprios após termos jurídicos
   */
  private anonimizarNomes(texto: string, numerado = false): string {
    // Padrão para capturar nomes após termos jurídicos
    const termos = TERMOS_ANTES_NOME.join('|');
    const padraoNome = new RegExp(
      `\\b(${termos})\\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+(?:\\s+(?:de|da|do|das|dos|e))?(?:\\s+[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+){1,5})`,
      'gi'
    );

    return texto.replace(padraoNome, (match, termo, nome) => {
      // Verificar se é uma exceção jurídica
      for (const excecao of EXCECOES_JURIDICAS) {
        if (nome.includes(excecao) || excecao.includes(nome)) {
          return match;
        }
      }

      if (numerado) {
        if (this.substituicoes.has(nome)) {
          return `${termo} ${this.substituicoes.get(nome)}`;
        }
        this.contadores['NOME'] = (this.contadores['NOME'] || 0) + 1;
        const substituto = `[NOME_${this.contadores['NOME']}]`;
        this.substituicoes.set(nome, substituto);
        return `${termo} ${substituto}`;
      }

      return `${termo} [NOME_ANONIMIZADO]`;
    });
  }

  /**
   * Retorna mapeamento de substituições (para debug/reversão)
   */
  getSubstituicoes(): Map<string, string> {
    return new Map(this.substituicoes);
  }

  /**
   * Retorna estatísticas de anonimização
   */
  getEstatisticas(): Record<string, number> {
    return { ...this.contadores };
  }

  /**
   * Reseta estado do anonimizador
   */
  reset(): void {
    this.substituicoes.clear();
    this.contadores = {};
  }
}

/**
 * Instância singleton para uso rápido
 */
export const anonymizer = new Anonymizer();
