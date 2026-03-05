import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos
export interface Modelo {
  id: string;
  provider: string;
  displayName: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsStreaming: boolean;
}

/**
 * Informação de documento (pode ser processo estruturado ou texto)
 */
export interface DocumentoInfo {
  id: string;
  tipo: 'processo' | 'texto';
  nome: string;
  // Campos para processo
  numeroProcesso?: string;
  classeProcessual?: string;
  assuntos?: Array<{ codigo: number; descricao: string; principal: boolean }>;
  partes?: Array<{ nome: string; polo: string; tipoPessoa: string }>;
  totalPecas?: number;
  dataAjuizamento?: string;
  // Campos para texto
  preview?: string;
  tamanho?: number;
}

// Manter ProcessoInfo para compatibilidade
export type ProcessoInfo = DocumentoInfo;

export interface Metricas {
  tempoExecucaoMs: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  custo: {
    input: number;
    output: number;
    total: number;
  };
  modelo: string;
}

export interface HistoricoEntry {
  id: string;
  tipo: 'SINTESE' | 'EMENTA' | 'REVISAO' | 'BENCHMARK';
  processoNumero?: string;
  modelo: string;
  dataExecucao: string;
  sucesso: boolean;
  tempoMs: number;
  custoTotal: number;
}

// Store de Documentos/Processos
interface ProcessoStore {
  processo: DocumentoInfo | null;
  isLoading: boolean;
  error: string | null;
  setProcesso: (processo: DocumentoInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useProcessoStore = create<ProcessoStore>((set) => ({
  processo: null,
  isLoading: false,
  error: null,
  setProcesso: (processo) => set({ processo, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ processo: null, error: null }),
}));

// Store de Execução
interface ExecutionStore {
  isExecuting: boolean;
  output: string;
  metricas: Metricas | null;
  error: string | null;
  startExecution: () => void;
  appendOutput: (text: string) => void;
  setMetricas: (metricas: Metricas) => void;
  setError: (error: string) => void;
  reset: () => void;
  completeExecution: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  isExecuting: false,
  output: '',
  metricas: null,
  error: null,
  startExecution: () => set({ isExecuting: true, output: '', metricas: null, error: null }),
  appendOutput: (text) => set((state) => ({ output: state.output + text })),
  setMetricas: (metricas) => set({ metricas }),
  setError: (error) => set({ error, isExecuting: false }),
  reset: () => set({ isExecuting: false, output: '', metricas: null, error: null }),
  completeExecution: () => set({ isExecuting: false }),
}));

// Store de Modelos
interface ModeloStore {
  modelos: Modelo[];
  selectedModelo: string;
  isLoading: boolean;
  setModelos: (modelos: Modelo[]) => void;
  setSelectedModelo: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useModeloStore = create<ModeloStore>()(
  persist(
    (set) => ({
      modelos: [],
      selectedModelo: 'gpt-4o-mini',
      isLoading: false,
      setModelos: (modelos) => set({ modelos }),
      setSelectedModelo: (selectedModelo) => set({ selectedModelo }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'apoia-modelo-storage',
      partialize: (state) => ({ selectedModelo: state.selectedModelo }),
    }
  )
);

// Store de Histórico
interface HistoricoStore {
  entries: HistoricoEntry[];
  isLoading: boolean;
  setEntries: (entries: HistoricoEntry[]) => void;
  addEntry: (entry: HistoricoEntry) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useHistoricoStore = create<HistoricoStore>((set) => ({
  entries: [],
  isLoading: false,
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  removeEntry: (id) => set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ entries: [] }),
}));

// Store de API Keys
interface ApiKeysStore {
  keys: Record<string, string>;
  setKey: (provider: string, key: string) => void;
  removeKey: (provider: string) => void;
  clearKeys: () => void;
  getHeaders: () => Record<string, string>;
}

export const useApiKeysStore = create<ApiKeysStore>()(
  persist(
    (set, get) => ({
      keys: {},
      setKey: (provider, key) =>
        set((state) => ({ keys: { ...state.keys, [provider]: key } })),
      removeKey: (provider) =>
        set((state) => {
          const { [provider]: _, ...rest } = state.keys;
          return { keys: rest };
        }),
      clearKeys: () => set({ keys: {} }),
      getHeaders: () => {
        const keys = get().keys;
        const hasKeys = Object.values(keys).some((k) => k.length > 0);
        if (!hasKeys) return {} as Record<string, string>;
        return { 'X-API-Keys': JSON.stringify(keys) } as Record<string, string>;
      },
    }),
    {
      name: 'apoia-api-keys-storage',
    }
  )
);
