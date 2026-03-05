# Simulador APOIA

Simulador local do sistema APOIA (Assistente Pessoal Operada por Inteligência Artificial) do TRF2.

## Sobre

O APOIA é uma ferramenta de inteligência artificial generativa desenvolvida pelo Tribunal Regional Federal da 2ª Região (TRF2). Este simulador replica o comportamento do APOIA para:

- Testar e validar prompts jurídicos
- Comparar performance entre diferentes modelos de LLM
- Prototipar fluxos de análise processual
- Benchmarking de qualidade de respostas

## Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| **Síntese Processual** | Resumo estruturado de processos judiciais |
| **Geração de Ementas** | Criação de ementas a partir de votos |
| **Revisão de Texto** | Reescrita clara e objetiva mantendo conteúdo |
| **Comparação de Modelos** | Arena para benchmark de LLMs |

## Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd apoia-simulator

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas API keys

# Compilar TypeScript
npm run build
```

## Configuração

Copie `.env.example` para `.env` e configure pelo menos uma API key:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## Uso

### Listar Modelos Disponíveis

```bash
npx apoia-sim listar-modelos
npx apoia-sim listar-modelos --disponiveis  # Apenas com API key configurada
```

### Listar Prompts

```bash
npx apoia-sim listar-prompts
npx apoia-sim listar-prompts --categoria SINTESE
```

### Gerar Síntese Processual

```bash
npx apoia-sim sintetizar -p data/processos/previdenciario-001.json
npx apoia-sim sintetizar -p data/processos/previdenciario-001.json -m claude-3-haiku
npx apoia-sim sintetizar -p data/processos/previdenciario-001.json --json -o resultado.json
```

### Gerar Ementa

```bash
npx apoia-sim ementa -v data/votos/voto-exemplo.txt
npx apoia-sim ementa -v data/votos/voto-exemplo.txt -m gpt-4o
```

### Revisar Texto

```bash
npx apoia-sim revisar -t meu-texto.txt
npx apoia-sim revisar -t meu-texto.txt --diff  # Mostra alterações
```

### Benchmark de Modelos

```bash
npx apoia-sim benchmark -p data/processos/previdenciario-001.json -m gpt-4o-mini,claude-3-haiku
npx apoia-sim benchmark -p data/processos/previdenciario-001.json --prompt sintese-processual-v1
```

## Modelos Suportados

| Modelo | Provider | Contexto | Custo (1k tokens) |
|--------|----------|----------|-------------------|
| gpt-4o | OpenAI | 128k | $0.0025/$0.01 |
| gpt-4o-mini | OpenAI | 128k | $0.00015/$0.0006 |
| claude-3-5-sonnet | Anthropic | 200k | $0.003/$0.015 |
| claude-3-haiku | Anthropic | 200k | $0.00025/$0.00125 |
| gemini-2.0-flash | Google | 1M | $0.00015/$0.0006 |
| gemini-1.5-pro | Google | 2M | $0.00125/$0.005 |

## Desenvolvimento

```bash
# Modo desenvolvimento
npm run dev

# Executar testes
npm test

# Cobertura de testes
npm run test:coverage

# Lint
npm run lint

# Formatar código
npm run format
```

## Estrutura do Projeto

```
apoia-simulator/
├── src/
│   ├── cli.ts              # Interface de linha de comando
│   ├── core/               # Motor principal
│   │   ├── llm-provider.ts # Abstração de provedores LLM
│   │   ├── prompt-engine.ts# Motor de execução
│   │   └── simulator.ts    # Classe principal
│   ├── processors/         # Processadores
│   │   ├── anonymizer.ts   # Anonimização de dados
│   │   └── peca-selector.ts# Seleção de peças
│   ├── config/             # Configurações
│   │   └── models.ts       # Registro de modelos
│   └── types/              # Definições de tipos
├── data/
│   ├── prompts/            # Templates de prompts (YAML)
│   ├── processos/          # Processos mock (JSON)
│   └── votos/              # Votos de exemplo
└── tests/                  # Testes unitários
```

## Licença

MIT

## Referências

- [APOIA - TRF2](https://github.com/trf2-jus-br/apoia)
- [Manual APOIA](https://trf2.gitbook.io/apoia)
- [Vercel AI SDK](https://ai-sdk.dev/docs)
