import { useCallback } from 'react';
import { useExecutionStore, useApiKeysStore } from '../store';

interface StreamOptions {
  onChunk?: (text: string) => void;
  onComplete?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export function useStream() {
  const { startExecution, appendOutput, setMetricas, setError, completeExecution } =
    useExecutionStore();

  const executeStream = useCallback(
    async (endpoint: string, body: Record<string, unknown>, options?: StreamOptions) => {
      startExecution();

      try {
        const apiKeyHeaders = useApiKeysStore.getState().getHeaders();
        const response = await fetch(`/api/execucao/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...apiKeyHeaders },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Stream não disponível');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              // Event type line - skip for now, we detect by data content
              continue;
            }

            if (line.startsWith('data:')) {
              const dataStr = line.slice(5).trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                // Determinar tipo de evento pelo conteúdo
                if (data.text !== undefined) {
                  appendOutput(data.text);
                  options?.onChunk?.(data.text);
                } else if (data.tempoExecucaoMs !== undefined) {
                  setMetricas(data);
                } else if (data.sucesso !== undefined) {
                  options?.onComplete?.(data);
                } else if (data.message) {
                  setError(data.message);
                  options?.onError?.(data.message);
                }
              } catch {
                // Ignorar linhas não-JSON
              }
            }
          }
        }

        completeExecution();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(message);
        options?.onError?.(message);
      }
    },
    [startExecution, appendOutput, setMetricas, setError, completeExecution]
  );

  return { executeStream };
}
