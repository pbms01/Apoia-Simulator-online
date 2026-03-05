import { useExecutionStore } from '../store';
import clsx from 'clsx';

interface StreamingOutputProps {
  title?: string;
}

export default function StreamingOutput({ title = 'Resultado' }: StreamingOutputProps) {
  const { isExecuting, output, error } = useExecutionStore();

  if (!output && !error && !isExecuting) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className="flex items-center space-x-2">
          {isExecuting && (
            <span className="flex items-center text-sm text-primary-600">
              <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processando...
            </span>
          )}
          {output && (
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Copiar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">Erro na execução</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : (
          <div
            className={clsx(
              'prose prose-sm max-w-none whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg min-h-[200px] max-h-[500px] overflow-auto',
              isExecuting && 'cursor-blink'
            )}
          >
            {output || (
              <span className="text-gray-400">Aguardando execução...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
