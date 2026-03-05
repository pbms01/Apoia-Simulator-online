import { useProcessoStore, type DocumentoInfo } from '../store';

interface ProcessPreviewProps {
  processo?: DocumentoInfo;
  showClearButton?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProcessPreview({ processo: propProcesso, showClearButton = true }: ProcessPreviewProps) {
  const { processo: storeProcesso, clear } = useProcessoStore();
  const documento = propProcesso || storeProcesso;

  if (!documento) return null;

  // Renderização para tipo 'texto'
  if (documento.tipo === 'texto') {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary-700">Documento Carregado</h3>
            <p className="text-xl font-bold text-gray-900 mt-1">{documento.nome}</p>
          </div>
          {showClearButton && (
            <button
              onClick={clear}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remover documento"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              TEXTO
            </span>
          </div>
          {documento.tamanho && (
            <div className="text-gray-500">
              Tamanho: <span className="font-medium text-gray-700">{formatBytes(documento.tamanho)}</span>
            </div>
          )}
        </div>

        {documento.preview && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-500 mb-2">Preview do conteúdo:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-5">
              {documento.preview}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium">Texto simples</p>
              <p className="text-xs text-gray-500">pronto para processar</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Pronto para processar
          </div>
        </div>
      </div>
    );
  }

  // Renderização para tipo 'processo' (estruturado)
  const autor = documento.partes?.find((p) => p.polo === 'ATIVO');
  const reu = documento.partes?.find((p) => p.polo === 'PASSIVO');

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-primary-700">Processo Carregado</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{documento.numeroProcesso}</p>
        </div>
        {showClearButton && (
          <button
            onClick={clear}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Remover processo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4 text-sm mb-2">
        <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
          PROCESSO
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Classe:</span>
          <p className="font-medium">{documento.classeProcessual || '-'}</p>
        </div>
        <div>
          <span className="text-gray-500">Data de Ajuizamento:</span>
          <p className="font-medium">
            {documento.dataAjuizamento
              ? new Date(documento.dataAjuizamento).toLocaleDateString('pt-BR')
              : '-'}
          </p>
        </div>
      </div>

      {documento.assuntos && documento.assuntos.length > 0 && (
        <div>
          <span className="text-sm text-gray-500">Assuntos:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {documento.assuntos.map((assunto, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {assunto.descricao}
              </span>
            ))}
          </div>
        </div>
      )}

      {(autor || reu) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <span className="text-sm text-gray-500">Autor:</span>
            <p className="font-medium text-gray-900">{autor?.nome || '-'}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Réu:</span>
            <p className="font-medium text-gray-900">{reu?.nome || '-'}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="font-medium">{documento.totalPecas || 0} peças</p>
            <p className="text-xs text-gray-500">no processo</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Pronto para processar
        </div>
      </div>
    </div>
  );
}
