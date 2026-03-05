/**
 * Rotas para listagem de modelos LLM
 */

import { Router } from 'express';
import { MODELOS_DISPONIVEIS, getAvailableModels, type ApiKeys, type ProviderName } from '../../../src/config/models.js';

const router = Router();

/**
 * Parses the X-API-Keys header into an ApiKeys object
 */
function parseApiKeysHeader(req: { headers: Record<string, string | string[] | undefined> }): ApiKeys | undefined {
  const raw = req.headers['x-api-keys'];
  if (!raw || typeof raw !== 'string') return undefined;
  try {
    return JSON.parse(raw) as ApiKeys;
  } catch {
    return undefined;
  }
}

/**
 * GET /api/modelos
 * Lista todos os modelos disponíveis
 */
router.get('/', (_req, res) => {
  const modelos = Object.values(MODELOS_DISPONIVEIS).map((m) => ({
    id: m.id,
    provider: m.provider,
    displayName: m.displayName,
    contextWindow: m.contextWindow,
    costPer1kInput: m.costPer1kInput,
    costPer1kOutput: m.costPer1kOutput,
    supportsStreaming: m.supportsStreaming,
  }));

  res.json({ modelos });
});

/**
 * GET /api/modelos/disponiveis
 * Lista apenas modelos com API keys configuradas
 */
router.get('/disponiveis', (req, res) => {
  const apiKeys = parseApiKeysHeader(req);
  const modelos = getAvailableModels(apiKeys).map((m) => ({
    id: m.id,
    provider: m.provider,
    displayName: m.displayName,
    contextWindow: m.contextWindow,
    costPer1kInput: m.costPer1kInput,
    costPer1kOutput: m.costPer1kOutput,
    supportsStreaming: m.supportsStreaming,
  }));

  res.json({ modelos });
});

/**
 * GET /api/modelos/:id
 * Obtém detalhes de um modelo específico
 */
router.get('/:id', (req, res) => {
  const modelo = MODELOS_DISPONIVEIS[req.params.id as keyof typeof MODELOS_DISPONIVEIS];

  if (!modelo) {
    return res.status(404).json({ erro: 'Modelo não encontrado' });
  }

  res.json({ modelo });
});

export default router;
