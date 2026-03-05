/**
 * Rotas para gerenciamento do histórico de execuções
 */

import { Router } from 'express';
import {
  listHistory,
  getExecution,
  deleteExecution,
  clearHistory,
} from '../services/history.service.js';

const router = Router();

/**
 * GET /api/historico
 * Lista histórico de execuções
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const entries = await listHistory(limit, offset);
    res.json({ historico: entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao listar histórico';
    res.status(500).json({ erro: message });
  }
});

/**
 * GET /api/historico/:id
 * Obtém detalhes de uma execução
 */
router.get('/:id', async (req, res) => {
  try {
    const entry = await getExecution(req.params.id);

    if (!entry) {
      return res.status(404).json({ erro: 'Execução não encontrada' });
    }

    res.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao obter execução';
    res.status(500).json({ erro: message });
  }
});

/**
 * DELETE /api/historico/:id
 * Remove uma execução do histórico
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteExecution(req.params.id);

    if (!deleted) {
      return res.status(404).json({ erro: 'Execução não encontrada' });
    }

    res.json({ sucesso: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao remover execução';
    res.status(500).json({ erro: message });
  }
});

/**
 * DELETE /api/historico
 * Limpa todo o histórico
 */
router.delete('/', async (_req, res) => {
  try {
    await clearHistory();
    res.json({ sucesso: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao limpar histórico';
    res.status(500).json({ erro: message });
  }
});

export default router;
