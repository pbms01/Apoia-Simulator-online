/**
 * Rotas para execução de operações com SSE (Server-Sent Events)
 * Suporta tanto processos estruturados quanto textos simples
 */

import { Router } from 'express';
import { APOIASimulator } from '../../../src/core/simulator.js';
import { documentosUploadados, type DocumentoArmazenado } from './processos.js';
import { saveExecution } from '../services/history.service.js';
import type { ProcessoJudicial, PecaProcessual } from '../../../src/types/process.js';
import type { ApiKeys } from '../../../src/config/models.js';

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
 * Extrai texto de um documento (processo ou texto)
 */
function extrairTextoDocumento(doc: DocumentoArmazenado): string {
  if (doc.tipo === 'texto' && doc.texto) {
    return doc.texto;
  }

  if (doc.tipo === 'processo' && doc.processo) {
    return doc.processo.pecas
      .map(p => `=== ${p.tipo} ===\n\n${p.conteudo}`)
      .join('\n\n---\n\n');
  }

  return '';
}

/**
 * Converte texto simples em um ProcessoJudicial (para síntese)
 */
function textoParaProcesso(texto: string, nome: string): ProcessoJudicial {
  const peca: PecaProcessual = {
    id: 'peca-1',
    codigo: '1',
    tipo: 'DOCUMENTO',
    dataJuntada: new Date(),
    numeroPaginas: Math.ceil(texto.length / 3000),
    nivelSigilo: 0,
    conteudo: texto,
  };

  return {
    numeroProcesso: `DOC-${Date.now()}`,
    classeProcessual: 'DOCUMENTO',
    assuntos: [],
    partes: [],
    dataAjuizamento: new Date(),
    orgaoJulgador: '',
    pecas: [peca],
    movimentos: [],
  };
}

/**
 * POST /api/execucao/sintetizar
 * Executa síntese de processo/documento com streaming SSE
 */
router.post('/sintetizar', async (req, res) => {
  const { processoId, texto, modelo, promptId, anonimizar = false } = req.body;
  const apiKeys = parseApiKeysHeader(req);

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let processo: ProcessoJudicial;
    let nomeDocumento = 'Documento';

    // Opção 1: Texto direto no request
    if (texto) {
      processo = textoParaProcesso(texto, 'Texto direto');
      nomeDocumento = 'Texto direto';
    }
    // Opção 2: ID de documento uploadado
    else if (processoId) {
      const doc = documentosUploadados.get(processoId);
      if (!doc) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento não encontrado' })}\n\n`);
        return res.end();
      }

      nomeDocumento = doc.nome;

      if (doc.tipo === 'processo' && doc.processo) {
        processo = doc.processo;
      } else if (doc.tipo === 'texto' && doc.texto) {
        processo = textoParaProcesso(doc.texto, doc.nome);
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento sem conteúdo' })}\n\n`);
        return res.end();
      }
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Forneça processoId ou texto' })}\n\n`);
      return res.end();
    }

    const sim = await getSimulator();

    // Enviar evento de início
    res.write(`event: start\ndata: ${JSON.stringify({ modelo, promptId, anonimizar, documento: nomeDocumento })}\n\n`);

    // Executar síntese
    const resultado = await sim.sintetizar(processo, {
      modelo: modelo,
      promptId: promptId,
      anonimizar,
      streaming: true,
      onChunk: (chunk: string) => {
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      apiKeys,
    });

    // Enviar métricas
    res.write(`event: metrics\ndata: ${JSON.stringify(resultado.metricas)}\n\n`);

    // Enviar resultado completo
    res.write(`event: complete\ndata: ${JSON.stringify(resultado)}\n\n`);

    // Salvar no histórico
    await saveExecution({
      tipo: 'SINTESE',
      processoId,
      processoNumero: processo.numeroProcesso,
      modelo,
      resultado,
    });

    res.write(`event: close\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/execucao/ementa
 * Executa geração de ementa com streaming SSE
 */
router.post('/ementa', async (req, res) => {
  const { processoId, texto, modelo, promptId } = req.body;
  const apiKeys = parseApiKeysHeader(req);

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let textoFinal: string;
    let nomeDocumento = 'Documento';

    // Opção 1: Texto direto no request
    if (texto) {
      textoFinal = texto;
      nomeDocumento = 'Texto direto';
    }
    // Opção 2: ID de documento uploadado
    else if (processoId) {
      const doc = documentosUploadados.get(processoId);
      if (!doc) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento não encontrado' })}\n\n`);
        return res.end();
      }

      nomeDocumento = doc.nome;
      textoFinal = extrairTextoDocumento(doc);

      if (!textoFinal) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento sem conteúdo' })}\n\n`);
        return res.end();
      }
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Forneça processoId ou texto' })}\n\n`);
      return res.end();
    }

    const sim = await getSimulator();

    // Enviar evento de início
    res.write(`event: start\ndata: ${JSON.stringify({ modelo, promptId, documento: nomeDocumento })}\n\n`);

    // Executar geração de ementa
    const resultado = await sim.gerarEmenta(textoFinal, {
      modelo: modelo,
      promptId: promptId,
      streaming: true,
      onChunk: (chunk: string) => {
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      apiKeys,
    });

    // Enviar métricas
    res.write(`event: metrics\ndata: ${JSON.stringify(resultado.metricas)}\n\n`);

    // Enviar resultado completo
    res.write(`event: complete\ndata: ${JSON.stringify(resultado)}\n\n`);

    // Salvar no histórico
    await saveExecution({
      tipo: 'EMENTA',
      processoId,
      modelo,
      resultado,
    });

    res.write(`event: close\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/execucao/revisar
 * Executa revisão de texto com streaming SSE
 */
router.post('/revisar', async (req, res) => {
  const { processoId, texto, modelo, promptId } = req.body;
  const apiKeys = parseApiKeysHeader(req);

  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    let textoFinal: string;
    let nomeDocumento = 'Documento';

    // Opção 1: Texto direto no request
    if (texto) {
      textoFinal = texto;
      nomeDocumento = 'Texto direto';
    }
    // Opção 2: ID de documento uploadado
    else if (processoId) {
      const doc = documentosUploadados.get(processoId);
      if (!doc) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento não encontrado' })}\n\n`);
        return res.end();
      }

      nomeDocumento = doc.nome;
      textoFinal = extrairTextoDocumento(doc);

      if (!textoFinal) {
        res.write(`event: error\ndata: ${JSON.stringify({ message: 'Documento sem conteúdo' })}\n\n`);
        return res.end();
      }
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Forneça processoId ou texto' })}\n\n`);
      return res.end();
    }

    const sim = await getSimulator();

    // Enviar evento de início
    res.write(`event: start\ndata: ${JSON.stringify({ modelo, promptId, documento: nomeDocumento })}\n\n`);

    // Executar revisão
    const resultado = await sim.revisarTexto(textoFinal, {
      modelo: modelo,
      promptId: promptId,
      streaming: true,
      onChunk: (chunk: string) => {
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      apiKeys,
    });

    // Enviar métricas
    res.write(`event: metrics\ndata: ${JSON.stringify(resultado.metricas)}\n\n`);

    // Enviar resultado completo
    res.write(`event: complete\ndata: ${JSON.stringify(resultado)}\n\n`);

    // Salvar no histórico
    await saveExecution({
      tipo: 'REVISAO',
      processoId,
      modelo,
      resultado,
    });

    res.write(`event: close\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    res.end();
  }
});

export default router;
