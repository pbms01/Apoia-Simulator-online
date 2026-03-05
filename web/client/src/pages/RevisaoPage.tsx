import { Link } from 'react-router-dom';
import { useState } from 'react';
import ModelSelector from '../components/ModelSelector';
import PromptSelector from '../components/PromptSelector';
import StreamingOutput from '../components/StreamingOutput';
import MetricsDisplay from '../components/MetricsDisplay';
import { useModeloStore, useExecutionStore } from '../store';
import { useStream } from '../hooks/useStream';

export default function RevisaoPage() {
  const { selectedModelo } = useModeloStore();
  const { isExecuting, reset } = useExecutionStore();
  const { executeStream } = useStream();
  const [texto, setTexto] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const handleExecute = () => {
    if (!texto.trim()) return;

    executeStream('revisar', {
      texto,
      modelo: selectedModelo,
      promptId: selectedPrompt,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revisão de Texto</h1>
          <p className="text-gray-600">Revise textos jurídicos com linguagem simples</p>
        </div>
        <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          ← Voltar ao início
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input & Options */}
        <div className="lg:col-span-1 space-y-6">
          {/* Text Input */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-medium text-gray-700 mb-4">Texto para Revisar</h3>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui o texto jurídico para revisão com linguagem simples..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            <p className="mt-2 text-xs text-gray-500">
              {texto.length.toLocaleString()} caracteres
            </p>
          </div>

          {/* Info */}
          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <h4 className="font-medium text-green-800 text-sm">Pacto Nacional do Judiciário</h4>
            <p className="mt-1 text-xs text-green-700">
              A revisão segue os princípios de linguagem simples do Pacto Nacional do Judiciário,
              tornando textos jurídicos mais acessíveis ao cidadão.
            </p>
          </div>

          {/* Model Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <ModelSelector />
          </div>

          {/* Prompt Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <PromptSelector
              categoria="REVISAO"
              selectedPrompt={selectedPrompt}
              onSelect={setSelectedPrompt}
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={!texto.trim() || isExecuting}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isExecuting ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Revisando texto...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Revisar Texto</span>
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
          <StreamingOutput title="Texto Revisado" />
          <MetricsDisplay />
        </div>
      </div>
    </div>
  );
}
