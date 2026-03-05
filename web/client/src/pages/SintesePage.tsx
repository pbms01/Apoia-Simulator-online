import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ProcessPreview from '../components/ProcessPreview';
import ModelSelector from '../components/ModelSelector';
import PromptSelector from '../components/PromptSelector';
import StreamingOutput from '../components/StreamingOutput';
import MetricsDisplay from '../components/MetricsDisplay';
import { useProcessoStore, useModeloStore, useExecutionStore } from '../store';
import { useStream } from '../hooks/useStream';
import { useState } from 'react';

export default function SintesePage() {
  const { processo, isLoading: processoLoading } = useProcessoStore();
  const { selectedModelo } = useModeloStore();
  const { isExecuting, reset } = useExecutionStore();
  const { executeStream } = useStream();
  const [anonimizar, setAnonimizar] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleExecute = () => {
    if (!processo) return;

    executeStream('sintetizar', {
      processoId: processo.id,
      modelo: selectedModelo,
      promptId: selectedPrompt,
      anonimizar,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Síntese Processual</h1>
          <p className="text-gray-600">Gere uma síntese estruturada do processo judicial</p>
        </div>
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Voltar ao início
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Process & Options */}
        <div className="lg:col-span-1 space-y-6">
          {/* Process Upload/Preview */}
          {processoLoading ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
          ) : processo ? (
            <ProcessPreview />
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-medium text-gray-700 mb-4">Carregar Processo</h3>
              <FileUpload />
            </div>
          )}

          {/* Model Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <ModelSelector />
          </div>

          {/* Prompt Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <PromptSelector
              categoria="SINTESE"
              selectedPrompt={selectedPrompt}
              onSelect={setSelectedPrompt}
            />
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Opções</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={anonimizar}
                onChange={(e) => setAnonimizar(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Anonimizar dados sensíveis</span>
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Remove CPF, CNPJ, nomes e outros dados pessoais
            </p>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={!processo || isExecuting}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Executar Síntese</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          {(useExecutionStore.getState().output || useExecutionStore.getState().error) && (
            <button
              onClick={reset}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Limpar resultado
            </button>
          )}
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-2 space-y-6">
          <StreamingOutput title="Síntese do Processo" />
          <MetricsDisplay />
        </div>
      </div>
    </div>
  );
}
