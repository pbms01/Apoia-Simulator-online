import { Link } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import ProcessPreview from '../components/ProcessPreview';
import { useProcessoStore } from '../store';

export default function HomePage() {
  const { processo, isLoading, error } = useProcessoStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo ao APOIA Simulator
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Simulador do Sistema de IA Jurídica do TRF2
        </p>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Carregando processo...</p>
          </div>
        ) : processo ? (
          <ProcessPreview />
        ) : (
          <FileUpload />
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {processo && (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            O que você deseja fazer?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/sintese"
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Síntese</h3>
              <p className="mt-1 text-sm text-gray-500">Gerar síntese do processo</p>
            </Link>

            <Link
              to="/ementa"
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 mx-auto bg-accent-100 rounded-full flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Ementa</h3>
              <p className="mt-1 text-sm text-gray-500">Gerar ementa de voto</p>
            </Link>

            <Link
              to="/revisao"
              className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow text-center group"
            >
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">Revisão</h3>
              <p className="mt-1 text-sm text-gray-500">Revisar texto jurídico</p>
            </Link>
          </div>
        </div>
      )}

      {/* Features */}
      {!processo && (
        <div className="max-w-4xl mx-auto pt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            Funcionalidades
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-gray-900">Streaming em Tempo Real</h3>
              <p className="mt-2 text-sm text-gray-500">
                Veja as respostas sendo geradas em tempo real
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-gray-900">Múltiplos Modelos</h3>
              <p className="mt-2 text-sm text-gray-500">
                OpenAI, Anthropic e Google disponíveis
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 font-medium text-gray-900">Métricas de Custo</h3>
              <p className="mt-2 text-sm text-gray-500">
                Acompanhe tokens e custos de cada execução
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
