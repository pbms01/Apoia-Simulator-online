/**
 * Tipos para representação de processos judiciais
 * Baseado nas tabelas unificadas do CNJ e padrões do APOIA
 */

/**
 * Representa uma peça processual (documento do processo)
 */
export interface PecaProcessual {
  /** Identificador único da peça (ex: "PET1", "SENT", "CONT1") */
  id: string;

  /** Código do tipo de peça conforme tabela MNI */
  codigo: string;

  /** Descrição do tipo (ex: "PETIÇÃO INICIAL", "SENTENÇA") */
  tipo: string;

  /** Conteúdo textual da peça */
  conteudo: string;

  /** Data de juntada aos autos */
  dataJuntada: Date;

  /** Número de páginas */
  numeroPaginas: number;

  /** Nível de sigilo (0 = público, 1-5 = níveis de restrição) */
  nivelSigilo: number;
}

/**
 * Representa uma parte do processo (autor, réu, terceiro)
 */
export interface ParteProcessual {
  /** Nome completo ou razão social */
  nome: string;

  /** Tipo de participação */
  polo: 'ATIVO' | 'PASSIVO' | 'TERCEIRO';

  /** Tipo de pessoa */
  tipoPessoa: 'FISICA' | 'JURIDICA';

  /** CPF ou CNPJ (para anonimização) */
  documento?: string;

  /** Advogados constituídos */
  advogados?: Advogado[];
}

/**
 * Representa um advogado
 */
export interface Advogado {
  nome: string;
  oab: string;
}

/**
 * Representa um movimento processual
 */
export interface MovimentoProcessual {
  /** Data do movimento */
  data: Date;

  /** Código do movimento conforme tabela SGT */
  codigo: number | string;

  /** Descrição do movimento */
  descricao: string;

  /** Complemento/observação */
  complemento?: string;
}

/**
 * Representa um assunto processual
 */
export interface AssuntoProcessual {
  codigo: number;
  descricao: string;
  principal: boolean;
}

/**
 * Representa o órgão julgador
 */
export interface OrgaoJulgador {
  codigo: number;
  nome: string;
}

/**
 * Representa um processo judicial completo
 */
export interface ProcessoJudicial {
  /** Número único do processo (CNJ) */
  numeroProcesso: string;

  /** Classe processual (ex: "Ação Civil Pública") */
  classeProcessual: string;

  /** Código da classe conforme tabela TPU */
  codigoClasse?: number;

  /** Assuntos do processo */
  assuntos: (AssuntoProcessual | string)[];

  /** Data de ajuizamento */
  dataAjuizamento: Date;

  /** Órgão julgador */
  orgaoJulgador: OrgaoJulgador | string;

  /** Partes do processo */
  partes: ParteProcessual[];

  /** Peças processuais */
  pecas: PecaProcessual[];

  /** Movimentos processuais */
  movimentos: MovimentoProcessual[];

  /** Valor da causa */
  valorCausa?: number;

  /** Prioridade (idoso, deficiente, etc.) */
  prioridade?: string[];

  /** Segredo de justiça */
  segredoJustica?: boolean;
}

/**
 * Dados de processo carregados de arquivo JSON
 * (com datas como strings para facilitar serialização)
 */
export interface ProcessoJudicialJSON {
  numeroProcesso: string;
  classeProcessual: string;
  codigoClasse: number;
  assuntos: AssuntoProcessual[];
  dataAjuizamento: string;
  orgaoJulgador: OrgaoJulgador;
  partes: ParteProcessual[];
  pecas: Array<Omit<PecaProcessual, 'dataJuntada'> & { dataJuntada: string }>;
  movimentos: Array<Omit<MovimentoProcessual, 'data'> & { data: string }>;
  valorCausa?: number;
  prioridade?: string[];
  segredoJustica: boolean;
}

/**
 * Converte processo JSON para objeto com datas tipadas
 */
export function parseProcessoJSON(json: ProcessoJudicialJSON): ProcessoJudicial {
  return {
    ...json,
    dataAjuizamento: new Date(json.dataAjuizamento),
    pecas: json.pecas.map((p) => ({
      ...p,
      dataJuntada: new Date(p.dataJuntada),
    })),
    movimentos: json.movimentos.map((m) => ({
      ...m,
      data: new Date(m.data),
    })),
  };
}
