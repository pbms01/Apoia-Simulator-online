/**
 * Serviço para gerenciamento do histórico de execuções (in-memory)
 */

import { v4 as uuidv4 } from 'uuid';

export interface HistoryEntry {
  id: string;
  tipo: 'SINTESE' | 'EMENTA' | 'REVISAO';
  processoId?: string;
  processoNumero?: string;
  modelo: string;
  dataExecucao: string;
  sucesso: boolean;
  tempoMs: number;
  custoTotal: number;
}

export interface FullHistoryEntry extends HistoryEntry {
  resultado: unknown;
}

export interface SaveExecutionParams {
  tipo: 'SINTESE' | 'EMENTA' | 'REVISAO';
  processoId?: string;
  processoNumero?: string;
  modelo: string;
  resultado: {
    sucesso: boolean;
    metricas: {
      tempoExecucao: number;
      custo: {
        custoTotal: number;
      };
    };
  };
}

// In-memory storage
const historyIndex: HistoryEntry[] = [];
const fullEntries: Map<string, FullHistoryEntry> = new Map();

/**
 * Salva uma execução no histórico
 */
export async function saveExecution(params: SaveExecutionParams): Promise<string> {
  const id = uuidv4();
  const entry: HistoryEntry = {
    id,
    tipo: params.tipo,
    processoId: params.processoId,
    processoNumero: params.processoNumero,
    modelo: params.modelo,
    dataExecucao: new Date().toISOString(),
    sucesso: params.resultado.sucesso,
    tempoMs: params.resultado.metricas.tempoExecucao,
    custoTotal: params.resultado.metricas.custo.custoTotal,
  };

  const fullEntry: FullHistoryEntry = {
    ...entry,
    resultado: params.resultado,
  };

  // Store in memory
  historyIndex.unshift(entry);
  fullEntries.set(id, fullEntry);

  return id;
}

/**
 * Lista histórico de execuções
 */
export async function listHistory(limit = 50, offset = 0): Promise<HistoryEntry[]> {
  return historyIndex.slice(offset, offset + limit);
}

/**
 * Obtém execução completa por ID
 */
export async function getExecution(id: string): Promise<FullHistoryEntry | null> {
  return fullEntries.get(id) ?? null;
}

/**
 * Remove execução do histórico
 */
export async function deleteExecution(id: string): Promise<boolean> {
  const index = historyIndex.findIndex((e) => e.id === id);
  if (index === -1) {
    return false;
  }

  historyIndex.splice(index, 1);
  fullEntries.delete(id);
  return true;
}

/**
 * Limpa todo o histórico
 */
export async function clearHistory(): Promise<void> {
  historyIndex.length = 0;
  fullEntries.clear();
}
