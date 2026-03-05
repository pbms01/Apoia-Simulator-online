/**
 * Rotas para gerenciamento de prompts
 */

import { Router } from 'express';
import { APOIASimulator } from '../../../src/core/simulator.js';

const router = Router();

// Instância do simulador
let simulator: APOIASimulator | null = null;

async function getSimulator(): Promise<APOIASimulator> {
  if (!simulator) {
    simulator = new APOIASimulator();
    await simulator.inicializar();
  }
  return simulator;
}

/**
 * GET /api/prompts
 * Lista todos os prompts disponíveis
 */
router.get('/', async (_req, res) => {
  try {
    const sim = await getSimulator();
    const prompts = sim.listarPrompts();

    // Formatar para resposta
    const formatted = prompts.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: (p as { descricao?: string }).descricao || '',
      categoria: p.categoria,
      autor: p.autor,
      versao: p.versao,
      outputFormat: (p as { outputFormat?: string }).outputFormat || 'text',
    }));

    res.json(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ erro: message });
  }
});

/**
 * GET /api/prompts/categoria/:categoria
 * Lista prompts por categoria (SINTESE, EMENTA, REVISAO)
 */
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const sim = await getSimulator();

    const validCategories = ['SINTESE', 'EMENTA', 'REVISAO'];
    if (!validCategories.includes(categoria.toUpperCase())) {
      return res.status(400).json({ erro: 'Categoria inválida. Use: SINTESE, EMENTA ou REVISAO' });
    }

    const prompts = sim.listarPrompts(categoria.toUpperCase() as 'SINTESE' | 'EMENTA' | 'REVISAO');

    // Formatar para resposta
    const formatted = prompts.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: (p as { descricao?: string }).descricao || '',
      categoria: p.categoria,
      autor: p.autor,
      versao: p.versao,
      outputFormat: (p as { outputFormat?: string }).outputFormat || 'text',
    }));

    res.json(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ erro: message });
  }
});

/**
 * GET /api/prompts/:id
 * Obtém detalhes de um prompt específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sim = await getSimulator();
    const prompt = sim.getPrompt(id);

    if (!prompt) {
      return res.status(404).json({ erro: 'Prompt não encontrado' });
    }

    res.json({
      id: prompt.id,
      nome: prompt.nome,
      descricao: (prompt as { descricao?: string }).descricao || '',
      categoria: prompt.categoria,
      autor: prompt.autor,
      versao: prompt.versao,
      outputFormat: (prompt as { outputFormat?: string }).outputFormat || 'text',
      systemPrompt: prompt.systemPrompt,
      template: prompt.template,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({ erro: message });
  }
});

export default router;
