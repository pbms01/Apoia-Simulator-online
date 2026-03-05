import { useState, useEffect } from 'react';

interface PromptInfo {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  autor: string;
  versao: string;
  outputFormat: string;
}

interface PromptDetails extends PromptInfo {
  systemPrompt: string;
  template: string;
}

interface PromptSelectorProps {
  categoria: 'SINTESE' | 'EMENTA' | 'REVISAO';
  selectedPrompt: string | null;
  onSelect: (promptId: string) => void;
}

export default function PromptSelector({ categoria, selectedPrompt, onSelect }: PromptSelectorProps) {
  const [prompts, setPrompts] = useState<PromptInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptDetails, setPromptDetails] = useState<PromptDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showPromptText, setShowPromptText] = useState(false);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/prompts/categoria/${categoria}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar prompts');
        }
        const data = await response.json();
        setPrompts(data);

        // Selecionar o primeiro prompt APOIA por padrão se nenhum estiver selecionado
        if (!selectedPrompt && data.length > 0) {
          const apoiaPrompt = data.find((p: PromptInfo) => p.id.startsWith('apoia-'));
          onSelect(apoiaPrompt?.id || data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, [categoria]);

  // Carregar detalhes do prompt selecionado
  useEffect(() => {
    const fetchPromptDetails = async () => {
      if (!selectedPrompt) {
        setPromptDetails(null);
        return;
      }

      setIsLoadingDetails(true);
      try {
        const response = await fetch(`/api/prompts/${selectedPrompt}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar detalhes do prompt');
        }
        const data = await response.json();
        setPromptDetails(data);
      } catch (err) {
        console.error('Erro ao carregar detalhes do prompt:', err);
        setPromptDetails(null);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchPromptDetails();
  }, [selectedPrompt]);

  const renderPromptDetails = () => {
    if (!selectedPrompt) return null;

    return (
      <div className="mt-4 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={() => setShowPromptText(!showPromptText)}
          className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span className="font-medium">
            {showPromptText ? 'Ocultar texto do prompt' : 'Ver texto do prompt'}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${showPromptText ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPromptText && (
          <div className="mt-3 space-y-4">
            {isLoadingDetails ? (
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ) : promptDetails ? (
              <>
                {promptDetails.systemPrompt && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      System Prompt
                    </h4>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                      {promptDetails.systemPrompt}
                    </pre>
                  </div>
                )}
                {promptDetails.template && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Template
                    </h4>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                      {promptDetails.template}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Não foi possível carregar os detalhes do prompt.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        Erro ao carregar prompts: {error}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        Nenhum prompt disponível para esta categoria
      </div>
    );
  }

  // Se só há um prompt, mostrar info simplificada mas permitir ver detalhes
  if (prompts.length === 1) {
    return (
      <div>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Prompt:</span> {prompts[0].nome}
          {prompts[0].autor && (
            <span className="text-gray-400 ml-2">({prompts[0].autor})</span>
          )}
        </div>
        {renderPromptDetails()}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Selecione o Prompt
      </label>
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <label
            key={prompt.id}
            className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPrompt === prompt.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="prompt"
              value={prompt.id}
              checked={selectedPrompt === prompt.id}
              onChange={() => onSelect(prompt.id)}
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{prompt.nome}</span>
                {prompt.autor && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {prompt.autor}
                  </span>
                )}
              </div>
              {prompt.descricao && (
                <p className="text-sm text-gray-500 mt-1">{prompt.descricao}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">v{prompt.versao}</span>
                {prompt.outputFormat && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    prompt.outputFormat === 'json'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {prompt.outputFormat.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
      {renderPromptDetails()}
    </div>
  );
}
