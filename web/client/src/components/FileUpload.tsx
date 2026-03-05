import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { useProcessoStore, type DocumentoInfo } from '../store';

const ALLOWED_EXTENSIONS = ['.json', '.txt', '.md'];

export default function FileUpload() {
  const { setProcesso, setLoading, setError } = useProcessoStore();
  const [isDragging, setIsDragging] = useState(false);

  const isAllowedFile = (filename: string) => {
    return ALLOWED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (!isAllowedFile(file.name)) {
        setError('Formatos permitidos: JSON, TXT, MD');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/processos/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.erro || 'Erro ao fazer upload');
        }

        // Construir objeto DocumentoInfo baseado na resposta
        const documento: DocumentoInfo = {
          id: data.id,
          tipo: data.tipo,
          nome: data.nome,
        };

        if (data.tipo === 'processo' && data.processo) {
          documento.numeroProcesso = data.processo.numeroProcesso;
          documento.classeProcessual = data.processo.classeProcessual;
          documento.assuntos = data.processo.assuntos;
          documento.partes = data.processo.partes;
          documento.totalPecas = data.processo.totalPecas;
          documento.dataAjuizamento = data.processo.dataAjuizamento;
        } else if (data.tipo === 'texto') {
          documento.preview = data.preview;
          documento.tamanho = data.tamanho;
        }

        setProcesso(documento);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao processar arquivo';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [setProcesso, setLoading, setError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      className={clsx(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
        isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <div>
          <p className="text-lg font-medium text-gray-700">
            Arraste um arquivo aqui
          </p>
          <p className="text-sm text-gray-500 mt-1">ou clique para selecionar</p>
        </div>

        <input
          type="file"
          accept=".json,.txt,.md"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition-colors"
        >
          Selecionar Arquivo
        </label>

        <p className="text-xs text-gray-400">
          Formatos aceitos: JSON (processo ou texto), TXT, MD
        </p>
      </div>
    </div>
  );
}
