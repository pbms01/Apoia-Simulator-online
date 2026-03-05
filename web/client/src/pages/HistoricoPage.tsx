import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

interface HistoricoEntry {
  id: string;
  tipo: 'SINTESE' | 'EMENTA' | 'REVISAO' | 'BENCHMARK';
  processoNumero?: string;
  modelo: string;
  dataExecucao: string;
  sucesso: boolean;
  tempoMs: number;
  custoTotal: number;
}

interface HistoricoDetail extends HistoricoEntry {
  resultado: unknown;
}

export default function HistoricoPage() {
  const [entries, setEntries] = useState<HistoricoEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HistoricoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/historico');
      const data = await response.json();
      setEntries(data.historico || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/historico/${id}`);
      const data = await response.json();
      setSelectedEntry(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este item do histórico?')) return;

    try {
      await fetch(`/api/historico/${id}`, { method: 'DELETE' });
      setEntries(entries.filter((e) => e.id !== id));
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error('Erro ao remover:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) return;

    try {
      await fetch('/api/historico', { method: 'DELETE' });
      setEntries([]);
      setSelectedEntry(null);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'SINTESE':
        return 'bg-primary-100 text-primary-700';
      case 'EMENTA':
        return 'bg-accent-100 text-accent-700';
      case 'REVISAO':
        return 'bg-green-100 text-green-700';
      case 'BENCHMARK':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Execuções</h1>
          <p className="text-gray-600">Visualize e gerencie suas execuções anteriores</p>
        </div>
        <div className="flex items-center space-x-4">
          {entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Limpar tudo
            </button>
          )}
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            ← Voltar ao início
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-gray-600">Carregando histórico...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-4 text-gray-500">Nenhuma execução no histórico</p>
          <Link
            to="/sintese"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
          >
            Fazer primeira execução →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={clsx(
                  'bg-white rounded-lg shadow p-4 cursor-pointer transition-all',
                  selectedEntry?.id === entry.id
                    ? 'ring-2 ring-primary-500'
                    : 'hover:shadow-md'
                )}
                onClick={() => handleViewDetail(entry.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={clsx(
                        'inline-block px-2 py-1 rounded text-xs font-medium',
                        getTipoColor(entry.tipo)
                      )}
                    >
                      {entry.tipo}
                    </span>
                    <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                      {entry.processoNumero || entry.modelo}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 flex items-center text-xs text-gray-500 space-x-3">
                  <span>
                    {format(new Date(entry.dataExecucao), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <span>•</span>
                  <span>{(entry.tempoMs / 1000).toFixed(1)}s</span>
                  <span>•</span>
                  <span>${entry.custoTotal.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {isLoadingDetail ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-gray-600">Carregando detalhes...</p>
              </div>
            ) : selectedEntry ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Detalhes da Execução</h3>
                    <span
                      className={clsx(
                        'px-2 py-1 rounded text-xs font-medium',
                        selectedEntry.sucesso
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {selectedEntry.sucesso ? 'Sucesso' : 'Erro'}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{selectedEntry.tipo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Modelo:</span>
                      <p className="font-medium">{selectedEntry.modelo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tempo:</span>
                      <p className="font-medium">{(selectedEntry.tempoMs / 1000).toFixed(2)}s</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Custo:</span>
                      <p className="font-medium">${selectedEntry.custoTotal.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resultado</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                      {JSON.stringify(selectedEntry.resultado, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <p className="mt-4">Selecione um item para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
