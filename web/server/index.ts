/**
 * Servidor Express para a interface web do APOIA Simulator
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Configurar caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Carregar variáveis de ambiente do diretório raiz do projeto
// Usar override: true para sobrescrever variáveis de ambiente do sistema
dotenv.config({ path: path.join(rootDir, '.env'), override: true });

import modelosRouter from './routes/modelos.js';
import processosRouter from './routes/processos.js';
import execucaoRouter from './routes/execucao.js';
import historicoRouter from './routes/historico.js';
import promptsRouter from './routes/prompts.js';
import configRouter from './routes/config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for execution routes
const execucaoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { erro: 'Muitas requisições. Tente novamente em um minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rotas da API
app.use('/api/modelos', modelosRouter);
app.use('/api/processos', processosRouter);
app.use('/api/execucao', execucaoLimiter, execucaoRouter);
app.use('/api/historico', historicoRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/config', configRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDist, {
    maxAge: '1d',
    etag: true,
  }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro:', err.message);
  res.status(500).json({ erro: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor APOIA rodando em http://localhost:${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}/api`);
});

export default app;
