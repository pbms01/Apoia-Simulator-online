import { useExecutionStore, type Metricas } from '../store';

interface MetricsDisplayProps {
  metricas?: Metricas;
}

export default function MetricsDisplay({ metricas: propMetricas }: MetricsDisplayProps) {
  const { metricas: storeMetricas, isExecuting } = useExecutionStore();
  const metricas = propMetricas || storeMetricas;

  if (!metricas && !isExecuting) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">Métricas de Execução</h3>

      {isExecuting && !metricas ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      ) : metricas ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Modelo</p>
            <p className="text-sm font-semibold text-gray-900">{metricas.modelo}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Tempo</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatTime(metricas.tempoExecucaoMs)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Tokens</p>
            <div className="text-sm">
              <span className="font-semibold text-gray-900">{metricas.tokens.total.toLocaleString()}</span>
              <span className="text-gray-500 text-xs ml-1">
                ({metricas.tokens.prompt.toLocaleString()} + {metricas.tokens.completion.toLocaleString()})
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">Custo</p>
            <p className="text-sm font-semibold text-green-600">
              {formatCurrency(metricas.custo.total)}
            </p>
          </div>
        </div>
      ) : null}

      {metricas && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Input: {formatCurrency(metricas.custo.input)} | Output:{' '}
              {formatCurrency(metricas.custo.output)}
            </span>
            <span className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Execução concluída
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
