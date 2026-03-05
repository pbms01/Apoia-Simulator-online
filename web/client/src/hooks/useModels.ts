import { useEffect } from 'react';
import { useModeloStore, useApiKeysStore } from '../store';

export function useModels() {
  const { modelos, isLoading, setModelos, setLoading } = useModeloStore();
  const { keys } = useApiKeysStore();

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const apiKeyHeaders = useApiKeysStore.getState().getHeaders();
        const response = await fetch('/api/modelos/disponiveis', {
          headers: apiKeyHeaders,
        });
        const data = await response.json();
        setModelos(data.modelos || []);
      } catch (error) {
        console.error('Erro ao carregar modelos:', error);
      } finally {
        setLoading(false);
      }
    };

    // Reset modelos so it refetches when keys change
    setModelos([]);
    fetchModels();
  }, [JSON.stringify(keys), setModelos, setLoading]);

  return { modelos, isLoading };
}
