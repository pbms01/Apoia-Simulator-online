import { Link } from 'react-router-dom';
import { useModeloStore } from '../store';
import { useModels } from '../hooks/useModels';
import clsx from 'clsx';

interface ModelSelectorProps {
  multiSelect?: boolean;
  selectedModels?: string[];
  onSelectionChange?: (models: string[]) => void;
}

export default function ModelSelector({
  multiSelect = false,
  selectedModels = [],
  onSelectionChange,
}: ModelSelectorProps) {
  const { modelos, isLoading } = useModels();
  const { selectedModelo, setSelectedModelo } = useModeloStore();

  const handleSelect = (modeloId: string) => {
    if (multiSelect && onSelectionChange) {
      const newSelection = selectedModels.includes(modeloId)
        ? selectedModels.filter((id) => id !== modeloId)
        : [...selectedModels, modeloId];
      onSelectionChange(newSelection);
    } else {
      setSelectedModelo(modeloId);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (modelos.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <p className="font-medium">Nenhum modelo disponível</p>
        <p className="mt-1">
          Configure suas API keys na{' '}
          <Link to="/config" className="text-primary-600 hover:text-primary-700 underline font-medium">
            página de Configurações
          </Link>
        </p>
      </div>
    );
  }

  // Agrupar por provider
  const byProvider = modelos.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, typeof modelos>
  );

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {multiSelect ? 'Selecione os modelos para comparação' : 'Modelo'}
      </label>

      <div className="space-y-3">
        {Object.entries(byProvider).map(([provider, providerModelos]) => (
          <div key={provider}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{provider}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {providerModelos.map((modelo) => {
                const isSelected = multiSelect
                  ? selectedModels.includes(modelo.id)
                  : selectedModelo === modelo.id;

                return (
                  <button
                    key={modelo.id}
                    onClick={() => handleSelect(modelo.id)}
                    className={clsx(
                      'p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{modelo.displayName}</span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-primary-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center space-x-2">
                      <span>{(modelo.contextWindow / 1000).toFixed(0)}k ctx</span>
                      <span>•</span>
                      <span>
                        ${modelo.costPer1kInput.toFixed(4)}/{modelo.costPer1kOutput.toFixed(4)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
