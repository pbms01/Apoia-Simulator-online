/**
 * Rotas para upload e gerenciamento de documentos/processos
 * Aceita tanto processos judiciais estruturados quanto textos simples
 */

import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import type { ProcessoJudicial, PecaProcessual } from '../../../src/types/process.js';

const router = Router();

/**
 * Tipos de documento suportados
 */
type TipoDocumento = 'processo' | 'texto';

/**
 * Documento armazenado (pode ser processo estruturado ou texto simples)
 */
interface DocumentoArmazenado {
  tipo: TipoDocumento;
  nome: string;
  processo?: ProcessoJudicial;
  texto?: string;
  uploadedAt: Date;
}

// Armazenamento em memória dos documentos uploadados
const documentosUploadados = new Map<string, DocumentoArmazenado>();

// Configuração do Multer para upload de arquivos
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/json', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.json', '.txt', '.md'];

    const hasAllowedType = allowedTypes.includes(file.mimetype);
    const hasAllowedExtension = allowedExtensions.some(ext => file.originalname.endsWith(ext));

    if (hasAllowedType || hasAllowedExtension) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JSON, TXT ou MD são permitidos'));
    }
  },
});

/**
 * Tenta converter um JSON em ProcessoJudicial
 * Retorna null se não for um processo válido
 */
function tentarConverterParaProcesso(json: unknown): ProcessoJudicial | null {
  if (!json || typeof json !== 'object') return null;

  const obj = json as Record<string, unknown>;

  // Se tem peças, tentamos montar um processo
  if (Array.isArray(obj.pecas) && obj.pecas.length > 0) {
    // Gerar número fictício se não existir
    const numeroProcesso = obj.numeroProcesso as string || `DOC-${Date.now()}`;

    // Mapear peças com valores default para campos ausentes
    const pecas: PecaProcessual[] = obj.pecas.map((p: Record<string, unknown>, idx: number) => ({
      id: (p.id as string) || `peca-${idx + 1}`,
      codigo: (p.codigo as string) || `${idx + 1}`,
      tipo: (p.tipo as string) || 'OUTROS',
      dataJuntada: p.dataJuntada ? new Date(p.dataJuntada as string) : new Date(),
      numeroPaginas: (p.numeroPaginas as number) || 1,
      nivelSigilo: (p.nivelSigilo as number) || 0,
      conteudo: (p.conteudo as string) || '',
    }));

    return {
      numeroProcesso,
      classeProcessual: (obj.classeProcessual as string) || 'DOCUMENTO',
      assuntos: Array.isArray(obj.assuntos) ? obj.assuntos as string[] : [],
      partes: Array.isArray(obj.partes) ? obj.partes as ProcessoJudicial['partes'] : [],
      dataAjuizamento: obj.dataAjuizamento ? new Date(obj.dataAjuizamento as string) : new Date(),
      orgaoJulgador: (obj.orgaoJulgador as string) || '',
      pecas,
      movimentos: Array.isArray(obj.movimentos) ? obj.movimentos.map((m: Record<string, unknown>) => ({
        data: m.data ? new Date(m.data as string) : new Date(),
        codigo: (m.codigo as string) || '',
        descricao: (m.descricao as string) || '',
      })) : [],
    };
  }

  return null;
}

/**
 * Extrai texto de um JSON (procura campos comuns de texto)
 */
function extrairTextoDeJson(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;

  const obj = json as Record<string, unknown>;

  // Campos comuns que podem conter texto
  const camposTexto = ['texto', 'conteudo', 'content', 'text', 'body', 'voto', 'decisao', 'sentenca'];

  for (const campo of camposTexto) {
    if (typeof obj[campo] === 'string' && obj[campo]) {
      return obj[campo] as string;
    }
  }

  // Se tem peças, concatenar conteúdo das peças
  if (Array.isArray(obj.pecas)) {
    const textos = obj.pecas
      .map((p: Record<string, unknown>) => p.conteudo as string)
      .filter(Boolean);
    if (textos.length > 0) {
      return textos.join('\n\n---\n\n');
    }
  }

  return null;
}

/**
 * POST /api/processos/upload
 * Upload de arquivo (JSON, TXT ou MD)
 */
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const conteudo = req.file.buffer.toString('utf-8');
    const nomeArquivo = req.file.originalname;
    const id = uuidv4();

    // Detectar tipo de arquivo
    const isJson = nomeArquivo.endsWith('.json') || req.file.mimetype === 'application/json';

    if (isJson) {
      // Tentar fazer parse do JSON
      let json: unknown;
      try {
        json = JSON.parse(conteudo);
      } catch {
        return res.status(400).json({ erro: 'JSON inválido' });
      }

      // Tentar converter para processo estruturado
      const processo = tentarConverterParaProcesso(json);

      if (processo) {
        // É um processo estruturado
        documentosUploadados.set(id, {
          tipo: 'processo',
          nome: nomeArquivo,
          processo,
          uploadedAt: new Date(),
        });

        return res.json({
          id,
          tipo: 'processo',
          nome: nomeArquivo,
          processo: {
            numeroProcesso: processo.numeroProcesso,
            classeProcessual: processo.classeProcessual,
            assuntos: processo.assuntos,
            partes: processo.partes,
            totalPecas: processo.pecas.length,
            dataAjuizamento: processo.dataAjuizamento,
          },
        });
      }

      // Tentar extrair texto do JSON
      const texto = extrairTextoDeJson(json);

      if (texto) {
        documentosUploadados.set(id, {
          tipo: 'texto',
          nome: nomeArquivo,
          texto,
          uploadedAt: new Date(),
        });

        return res.json({
          id,
          tipo: 'texto',
          nome: nomeArquivo,
          preview: texto.substring(0, 500) + (texto.length > 500 ? '...' : ''),
          tamanho: texto.length,
        });
      }

      // JSON não reconhecido - usar como texto bruto
      documentosUploadados.set(id, {
        tipo: 'texto',
        nome: nomeArquivo,
        texto: conteudo,
        uploadedAt: new Date(),
      });

      return res.json({
        id,
        tipo: 'texto',
        nome: nomeArquivo,
        preview: conteudo.substring(0, 500) + (conteudo.length > 500 ? '...' : ''),
        tamanho: conteudo.length,
      });
    }

    // Arquivo de texto simples (TXT ou MD)
    documentosUploadados.set(id, {
      tipo: 'texto',
      nome: nomeArquivo,
      texto: conteudo,
      uploadedAt: new Date(),
    });

    return res.json({
      id,
      tipo: 'texto',
      nome: nomeArquivo,
      preview: conteudo.substring(0, 500) + (conteudo.length > 500 ? '...' : ''),
      tamanho: conteudo.length,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar arquivo';
    res.status(400).json({ erro: message });
  }
});

/**
 * POST /api/processos/texto
 * Envio direto de texto (sem arquivo)
 */
router.post('/texto', (req, res) => {
  try {
    const { texto, nome } = req.body as { texto?: string; nome?: string };

    if (!texto || typeof texto !== 'string') {
      return res.status(400).json({ erro: 'Campo "texto" é obrigatório' });
    }

    const id = uuidv4();

    documentosUploadados.set(id, {
      tipo: 'texto',
      nome: nome || 'Texto direto',
      texto,
      uploadedAt: new Date(),
    });

    res.json({
      id,
      tipo: 'texto',
      nome: nome || 'Texto direto',
      preview: texto.substring(0, 500) + (texto.length > 500 ? '...' : ''),
      tamanho: texto.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar texto';
    res.status(400).json({ erro: message });
  }
});

/**
 * POST /api/processos/json
 * Envio direto de JSON (sem upload de arquivo)
 */
router.post('/json', (req, res) => {
  try {
    const json = req.body;
    const id = uuidv4();

    // Tentar converter para processo
    const processo = tentarConverterParaProcesso(json);

    if (processo) {
      documentosUploadados.set(id, {
        tipo: 'processo',
        nome: 'JSON direto',
        processo,
        uploadedAt: new Date(),
      });

      return res.json({
        id,
        tipo: 'processo',
        nome: 'JSON direto',
        processo: {
          numeroProcesso: processo.numeroProcesso,
          classeProcessual: processo.classeProcessual,
          assuntos: processo.assuntos,
          partes: processo.partes,
          totalPecas: processo.pecas.length,
          dataAjuizamento: processo.dataAjuizamento,
        },
      });
    }

    // Tentar extrair texto
    const texto = extrairTextoDeJson(json);

    if (texto) {
      documentosUploadados.set(id, {
        tipo: 'texto',
        nome: 'JSON direto',
        texto,
        uploadedAt: new Date(),
      });

      return res.json({
        id,
        tipo: 'texto',
        nome: 'JSON direto',
        preview: texto.substring(0, 500) + (texto.length > 500 ? '...' : ''),
        tamanho: texto.length,
      });
    }

    // Usar JSON como texto bruto
    const textoRaw = JSON.stringify(json, null, 2);
    documentosUploadados.set(id, {
      tipo: 'texto',
      nome: 'JSON direto',
      texto: textoRaw,
      uploadedAt: new Date(),
    });

    res.json({
      id,
      tipo: 'texto',
      nome: 'JSON direto',
      preview: textoRaw.substring(0, 500) + (textoRaw.length > 500 ? '...' : ''),
      tamanho: textoRaw.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar JSON';
    res.status(400).json({ erro: message });
  }
});

/**
 * GET /api/processos
 * Lista todos os documentos uploadados
 */
router.get('/', (_req, res) => {
  const documentos = Array.from(documentosUploadados.entries()).map(([id, data]) => ({
    id,
    tipo: data.tipo,
    nome: data.nome,
    ...(data.tipo === 'processo' && data.processo ? {
      numeroProcesso: data.processo.numeroProcesso,
      classeProcessual: data.processo.classeProcessual,
      totalPecas: data.processo.pecas.length,
    } : {}),
    ...(data.tipo === 'texto' && data.texto ? {
      tamanho: data.texto.length,
    } : {}),
    uploadedAt: data.uploadedAt,
  }));

  res.json({ processos: documentos });
});

/**
 * GET /api/processos/:id
 * Obtém documento completo por ID
 */
router.get('/:id', (req, res) => {
  const data = documentosUploadados.get(req.params.id);

  if (!data) {
    return res.status(404).json({ erro: 'Documento não encontrado' });
  }

  res.json({ id: req.params.id, ...data });
});

/**
 * GET /api/processos/:id/pecas
 * Lista peças de um processo (só funciona para tipo 'processo')
 */
router.get('/:id/pecas', (req, res) => {
  const data = documentosUploadados.get(req.params.id);

  if (!data) {
    return res.status(404).json({ erro: 'Documento não encontrado' });
  }

  if (data.tipo !== 'processo' || !data.processo) {
    return res.status(400).json({ erro: 'Documento não é um processo estruturado' });
  }

  const pecas = data.processo.pecas.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    tipo: p.tipo,
    dataJuntada: p.dataJuntada,
    numeroPaginas: p.numeroPaginas,
    nivelSigilo: p.nivelSigilo,
    tamanhoConteudo: p.conteudo.length,
  }));

  res.json({ pecas });
});

/**
 * GET /api/processos/:id/texto
 * Obtém o texto do documento (funciona para ambos os tipos)
 */
router.get('/:id/texto', (req, res) => {
  const data = documentosUploadados.get(req.params.id);

  if (!data) {
    return res.status(404).json({ erro: 'Documento não encontrado' });
  }

  if (data.tipo === 'texto') {
    return res.json({ texto: data.texto });
  }

  if (data.tipo === 'processo' && data.processo) {
    // Concatenar texto de todas as peças
    const texto = data.processo.pecas
      .map(p => `=== ${p.tipo} ===\n\n${p.conteudo}`)
      .join('\n\n---\n\n');
    return res.json({ texto });
  }

  res.status(400).json({ erro: 'Documento sem texto disponível' });
});

/**
 * DELETE /api/processos/:id
 * Remove documento uploadado
 */
router.delete('/:id', (req, res) => {
  const deleted = documentosUploadados.delete(req.params.id);

  if (!deleted) {
    return res.status(404).json({ erro: 'Documento não encontrado' });
  }

  res.json({ sucesso: true });
});

// Exportar map para uso em outras rotas
export { documentosUploadados };
export type { DocumentoArmazenado, TipoDocumento };
export default router;
