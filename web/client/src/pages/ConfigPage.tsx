import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApiKeysStore } from '../store';

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini e outros modelos OpenAI',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5 Sonnet, Claude 3 Opus e outros modelos Anthropic',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Gemini Pro, Gemini Ultra e outros modelos Google',
    placeholder: 'AIza...',
  },
];

export default function ConfigPage() {
  const { keys, setKey, removeKey } = useApiKeysStore();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Initialize input values from store
    const initial: Record<string, string> = {};
    for (const p of providers) {
      initial[p.id] = keys[p.id] || '';
    }
    setInputValues(initial);
  }, [keys]);

  useEffect(() => {
    // Fetch server-side key status
    const fetchServerKeys = async () => {
      try {
        const response = await fetch('/api/config/server-keys');
        if (response.ok) {
          const data = await response.json();
          setServerKeys(data);
        }
      } catch {
        // Server keys endpoint may not exist yet
      }
    };
    fetchServerKeys();
  }, []);

  const handleSave = (providerId: string) => {
    const value = inputValues[providerId]?.trim() || '';
    if (value) {
      setKey(providerId, value);
    }
  };

  const handleClear = (providerId: string) => {
    removeKey(providerId);
    setInputValues((prev) => ({ ...prev, [providerId]: '' }));
  };

  const handleInputChange = (providerId: string, value: string) => {
    setInputValues((prev) => ({ ...prev, [providerId]: value }));
  };

  const toggleShowKey = (providerId: string) => {
    setShowKey((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const isConfigured = (providerId: string) => {
    return !!(keys[providerId] && keys[providerId].length > 0);
  };

  const hasServerKey = (providerId: string) => {
    return !!serverKeys[providerId];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          to="/"
          className="text-primary-500 hover:text-primary-600 text-sm font-medium inline-flex items-center space-x-1 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Voltar ao Início</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Configuração</h1>
        <p className="mt-2 text-gray-600">
          Configure suas API keys para acessar os modelos de IA. Você pode usar chaves próprias ou
          utilizar as chaves configuradas no servidor.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Aviso sobre armazenamento</p>
            <p className="mt-1">
              As API keys são armazenadas no <strong>localStorage</strong> do seu navegador. Elas não
              são enviadas para nenhum servidor além das APIs dos provedores de IA. Limpe os dados do
              navegador para removê-las completamente.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="space-y-6">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-gray-900">{provider.name}</h2>
                  {/* Status indicators */}
                  {isConfigured(provider.id) ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Key configurada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Não configurada</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{provider.description}</p>
              </div>
              {hasServerKey(provider.id) && (
                <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
                  Chave do servidor disponível
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <input
                  type={showKey[provider.id] ? 'text' : 'password'}
                  value={inputValues[provider.id] || ''}
                  onChange={(e) => handleInputChange(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey(provider.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey[provider.id] ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  )}
                </button>
              </div>
              <button
                onClick={() => handleSave(provider.id)}
                disabled={!inputValues[provider.id]?.trim()}
                className="px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={() => handleClear(provider.id)}
                disabled={!isConfigured(provider.id)}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Resumo da Configuração</h3>
        <div className="grid grid-cols-3 gap-4">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center space-x-2">
              {isConfigured(provider.id) || hasServerKey(provider.id) ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm text-gray-700">{provider.name}</span>
              {isConfigured(provider.id) && (
                <span className="text-xs text-green-600">(local)</span>
              )}
              {hasServerKey(provider.id) && !isConfigured(provider.id) && (
                <span className="text-xs text-primary-600">(servidor)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
