# Plano: Simulador APOIA - Versão Online

## Contexto

O projeto original ([Simulador-APOIA](https://github.com/pbms01/Simulador-APOIA)) é um simulador local da ferramenta APOIA do TRF2. Ele depende de:
- **Filesystem local**: prompts YAML em `data/prompts/`, processos JSON em `data/processos/`, histórico em `data/historico/`
- **Variáveis de ambiente locais**: chaves de API dos provedores LLM no `.env`
- **CLI local**: interface de linha de comando via Commander.js

Para rodar **inteiramente online**, precisamos resolver essas dependências do filesystem e permitir que o usuário configure suas próprias chaves de API pelo browser.

---

## Decisões Arquiteturais

### O que MANTER do original
- Stack principal: TypeScript, Express, React 18, Vite, Tailwind CSS, Zustand
- Vercel AI SDK v4 com suporte multi-provedor (OpenAI, Anthropic, Google)
- Streaming via SSE (Server-Sent Events)
- Estrutura de rotas da API (`/api/modelos`, `/api/processos`, `/api/execucao`, `/api/historico`, `/api/prompts`)
- Core: `llm-provider.ts`, `prompt-engine.ts`, `simulator.ts`
- Lógica de processamento: síntese, ementa, revisão

### O que REMOVER
- **CLI** (`src/cli.ts`, Commander.js): não faz sentido em app online
- **Scripts PowerShell** (`.ps1`): específicos para Windows local

### O que ADAPTAR

| Componente | Original (Local) | Online |
|---|---|---|
| **Prompts** | YAML no filesystem (`data/prompts/`) | Embarcados no código como módulos TS, ou servidos como assets estáticos no build |
| **Processos de exemplo** | JSON no filesystem (`data/processos/`) | Embarcados como assets estáticos; upload continua via API in-memory (já funciona assim) |
| **Histórico** | JSON no filesystem (`data/historico/`) | Armazenamento in-memory no servidor (sessão) + opcionalmente localStorage no cliente |
| **Chaves de API** | `.env` local | Configuradas pelo usuário via interface web, enviadas por request header ou armazenadas em sessão do servidor |
| **Configuração (.env)** | Arquivo `.env` no root | Variáveis de ambiente do serviço de deploy (Render/Railway/Vercel) para config do servidor + chaves do usuário via UI |

---

## Etapas de Implementação

### Fase 1: Setup do Projeto
1. Trazer o código da branch `gallant-brahmagupta` do repo original
2. Remover CLI e scripts PowerShell
3. Ajustar `package.json` (remover deps do CLI, ajustar scripts para deploy)
4. Configurar build unificado (servidor Express serve o client React em produção)

### Fase 2: Eliminar dependências do Filesystem

#### 2.1 Prompts
- Converter os prompts YAML para módulos TypeScript ou JSON estáticos
- Alterar `simulator.ts` para carregar prompts do módulo em vez de ler arquivos YAML
- Manter a mesma interface/API de prompts

#### 2.2 Histórico
- Substituir `history.service.ts` (que lê/escreve JSON no disco) por armazenamento in-memory
- O histórico existe apenas enquanto o servidor estiver ativo (aceitável para simulador)
- Alternativa futura: usar SQLite em memória ou serviço externo

#### 2.3 Processos de exemplo
- Embarcar os JSONs de exemplo como imports estáticos
- Upload de processos pelo usuário já funciona in-memory (via Multer + Map)

### Fase 3: Gerenciamento de Chaves de API via UI

#### 3.1 Backend
- Criar rota `POST /api/config/keys` para receber chaves de API do usuário
- Armazenar chaves em sessão (express-session) ou in-memory por conexão
- Modificar `LLMProvider` para aceitar chaves dinâmicas em vez de `process.env`
- Rota `GET /api/config/keys` para verificar quais provedores estão configurados (sem expor as chaves)

#### 3.2 Frontend
- Criar página/modal de **Configurações** para o usuário inserir suas chaves
- Salvar chaves no `localStorage` do browser (conveniência)
- Enviar chaves nos headers das requisições à API
- Indicar visualmente quais provedores estão disponíveis

### Fase 4: Ajustes para Deploy Online

#### 4.1 Build de produção
- Script `build` que compila o server TS e faz build do client Vite
- Express serve os arquivos estáticos do client em produção
- Configurar `PORT` via variável de ambiente

#### 4.2 Deploy
- **Plataforma recomendada**: Render.com ou Railway (suportam Node.js + build customizado)
- Alternativa: Vercel (com adaptações para serverless - mais complexo por causa do SSE)
- Dockerfile opcional para máxima portabilidade

#### 4.3 Segurança
- CORS configurado para o domínio de produção
- Rate limiting nas rotas de execução (evitar abuso)
- Chaves de API nunca são logadas nem persistidas no servidor
- Headers de segurança (helmet)

---

## Estrutura Final do Projeto

```
Apoia-Simulator-online/
├── src/
│   ├── core/
│   │   ├── llm-provider.ts    # Adaptado: aceita chaves dinâmicas
│   │   ├── prompt-engine.ts   # Adaptado: carrega prompts de módulos TS
│   │   └── simulator.ts      # Adaptado: sem leitura de filesystem
│   ├── processors/
│   │   ├── anonymizer.ts
│   │   └── peca-selector.ts
│   ├── data/
│   │   ├── prompts.ts         # Prompts embarcados como constantes TS
│   │   └── sample-processes.ts # Processos de exemplo embarcados
│   ├── types/
│   └── config/
├── web/
│   ├── server/
│   │   ├── index.ts           # Express com segurança (helmet, rate-limit)
│   │   ├── routes/
│   │   │   ├── modelos.ts
│   │   │   ├── processos.ts
│   │   │   ├── execucao.ts
│   │   │   ├── historico.ts
│   │   │   ├── prompts.ts
│   │   │   └── config.ts      # NOVO: gerenciamento de chaves
│   │   └── services/
│   │       ├── history.service.ts  # Adaptado: in-memory
│   │       └── keys.service.ts     # NOVO: gerenciamento de chaves
│   └── client/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── HomePage.tsx
│       │   │   ├── SintesePage.tsx
│       │   │   ├── EmentaPage.tsx
│       │   │   ├── RevisaoPage.tsx
│       │   │   ├── HistoricoPage.tsx
│       │   │   └── ConfigPage.tsx  # NOVO: configuração de chaves
│       │   ├── components/
│       │   ├── stores/
│       │   └── App.tsx
│       ├── vite.config.ts
│       └── tailwind.config.js
├── package.json
├── tsconfig.json
├── Dockerfile                  # Opcional
└── render.yaml                 # Config de deploy (Render.com)
```

---

## Resumo das Mudanças vs. Original

| # | Mudança | Complexidade |
|---|---------|-------------|
| 1 | Remover CLI e scripts PS1 | Baixa |
| 2 | Embarcar prompts YAML como módulos TS | Média |
| 3 | Histórico in-memory em vez de filesystem | Baixa |
| 4 | UI + API para chaves de API do usuário | Média |
| 5 | Build unificado (server + client) | Baixa |
| 6 | Configuração de deploy (Render/Railway) | Baixa |
| 7 | Segurança (helmet, rate-limit, CORS) | Baixa |

**Estimativa total**: ~7 etapas, nenhuma de alta complexidade. A maior parte do código core (LLM provider, prompt engine, simulator, processadores) é reutilizada com adaptações pontuais.
