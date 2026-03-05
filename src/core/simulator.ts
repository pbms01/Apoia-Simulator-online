/**
 * Simulador APOIA - Classe principal
 */

import type {
  ProcessoJudicial,
} from '../types/process.js';
import type {
  PromptConfig,
  PromptRegistry,
  CategoriaPrompt,
} from '../types/prompt.js';
import type {
  ResultadoExecucao,
  ResultadoSintese,
  ResultadoEmenta,
  ResultadoRevisao,
  ResultadoBenchmark,
} from '../types/result.js';
import {
  type SimulatorConfig,
  type ModelConfig,
  type ApiKeys,
  DEFAULT_CONFIG,
  listModels,
  getAvailableModels,
  getModelConfig,
} from '../config/index.js';
import { PromptEngine } from './prompt-engine.js';

/**
 * Opções para síntese
 */
export interface SintetizarOptions {
  modelo?: string;
  promptId?: string;
  anonimizar?: boolean;
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  apiKeys?: ApiKeys;
}

/**
 * Opções para ementa
 */
export interface EmentaOptions {
  modelo?: string;
  promptId?: string;
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  apiKeys?: ApiKeys;
}

/**
 * Opções para revisão
 */
export interface RevisarOptions {
  modelo?: string;
  promptId?: string;
  streaming?: boolean;
  onChunk?: (chunk: string) => void;
  apiKeys?: ApiKeys;
}

/**
 * Opções para benchmark
 */
export interface BenchmarkOptions {
  promptId: string;
  modelos: string[];
  apiKeys?: ApiKeys;
}

/**
 * Classe principal do simulador APOIA
 */
export class APOIASimulator {
  private config: SimulatorConfig;
  private promptEngine: PromptEngine;
  private promptRegistry: PromptRegistry;
  private initialized: boolean = false;

  constructor(config?: Partial<SimulatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.promptEngine = new PromptEngine();
    this.promptRegistry = {
      prompts: new Map(),
      porCategoria: new Map(),
    };
  }

  /**
   * Inicializa o simulador carregando prompts
   */
  async inicializar(): Promise<void> {
    if (this.initialized) return;

    await this.carregarPrompts();
    this.initialized = true;
  }

  /**
   * Carrega prompts padrão
   */
  private async carregarPrompts(): Promise<void> {
    const defaultPrompts = this.getDefaultPrompts();

    for (const prompt of defaultPrompts) {
      this.promptRegistry.prompts.set(prompt.id, prompt);

      const categoria = this.promptRegistry.porCategoria.get(prompt.categoria) ?? [];
      categoria.push(prompt);
      this.promptRegistry.porCategoria.set(prompt.categoria, categoria);
    }
  }

  /**
   * Retorna prompts padrão (hardcoded)
   */
  private getDefaultPrompts(): PromptConfig[] {
    return [
      {
        id: 'sintese-processual-v1',
        nome: 'Síntese Processual Completa',
        autor: 'TRF2',
        versao: '1.0',
        categoria: 'SINTESE',
        alvo: 'PECAS',
        segmentos: ['JF', 'JE', 'STF', 'STJ', 'CNJ'],
        instancias: ['1ª', '2ª', '3ª', '4ª', 'SUPERIOR', 'ORIGINARIA'],
        naturezas: ['CIVEL', 'CRIMINAL', 'TRABALHISTA'],
        selecaoPecas: {
          estrategia: 'PRINCIPAIS',
          limite: 10,
        },
        resumirPecas: true,
        parametros: {
          temperature: 0.3,
          maxTokens: 4096,
        },
        systemPrompt: `Você é um assistente jurídico especializado em análise processual do Poder Judiciário brasileiro.

Sua função é analisar peças processuais e produzir sínteses estruturadas que auxiliem magistrados e servidores na tomada de decisão.

DIRETRIZES:
- Seja objetivo e preciso
- Use linguagem técnico-jurídica apropriada
- Identifique a questão central e os pontos controvertidos
- Liste normas e jurisprudência citadas pelas partes
- Sugira palavras-chave para triagem/classificação
- Mantenha imparcialidade - não emita opinião sobre o mérito

IMPORTANTE:
- Todas as saídas estarão sujeitas à revisão humana
- Em caso de dúvida sobre interpretação, indique a incerteza
- Não invente informações que não estejam nas peças`,
        template: `Analise as peças processuais abaixo e produza uma síntese estruturada.

Responda em formato JSON com a seguinte estrutura:
{
  "questaoCentral": "Descrição da questão central do processo em um parágrafo",
  "pontosControvertidos": ["Ponto 1", "Ponto 2", ...],
  "normasInvocadas": [
    {"tipo": "LEI|CF|DECRETO|SUMULA|JURISPRUDENCIA", "referencia": "...", "artigos": ["..."]}
  ],
  "palavrasChave": ["palavra1", "palavra2", ...],
  "triagem": {
    "tema": "Tema sugerido para classificação",
    "subtema": "Subtema opcional",
    "confianca": 0.0 a 1.0
  },
  "resumosPecas": [
    {"pecaId": "...", "tipoPeca": "...", "resumo": "..."}
  ]
}

PEÇAS PROCESSUAIS:
{{textos}}`,
      },
      {
        id: 'ementa-cnj-v1',
        nome: 'Ementa do Acórdão - Padrão CNJ',
        autor: 'TRF2',
        versao: '1.0',
        categoria: 'EMENTA',
        alvo: 'TEXTO',
        segmentos: ['JF', 'JE', 'STF', 'STJ'],
        instancias: ['2ª', '3ª', 'SUPERIOR'],
        naturezas: ['CIVEL', 'CRIMINAL', 'TRABALHISTA'],
        resumirPecas: false,
        parametros: {
          temperature: 0.2,
          maxTokens: 2048,
        },
        systemPrompt: `Você é um especialista em redação de ementas jurídicas conforme as diretrizes do CNJ (Resolução 156/2024).

ESTRUTURA DA EMENTA (conforme Manual de Padronização de Ementas do CNJ):

1. EMENTA (linha de cabeçalho):
   - Palavras-chave em caixa alta separadas por ponto
   - Exemplo: "DIREITO ADMINISTRATIVO. AGRAVO DE INSTRUMENTO. SOBRESTAMENTO DO FEITO."

2. CASO EM EXAME (I):
   - Descrição objetiva do caso concreto
   - Uma ou duas frases

3. QUESTÃO EM DISCUSSÃO (II):
   - Qual a questão jurídica central
   - Formato: "A questão em discussão consiste em saber se..."

4. RAZÕES DE DECIDIR (III):
   - Fundamentos da decisão em tópicos numerados
   - Cada razão em um parágrafo curto

5. DISPOSITIVO (IV):
   - Resultado do julgamento
   - "Recurso provido/desprovido/parcialmente provido"

REGRAS:
- Use linguagem clara e objetiva
- Evite juridiquês desnecessário
- Não use abreviações sem explicação prévia
- Cite dispositivos legais com precisão
- Cite jurisprudência no formato: Tribunal, tipo de recurso, número, relator, data`,
        template: `Com base no VOTO abaixo, elabore uma EMENTA conforme as diretrizes do CNJ.

Responda em formato JSON:
{
  "ementa": "PALAVRA-CHAVE 1. PALAVRA-CHAVE 2. RESULTADO.",
  "estrutura": {
    "casoExame": "Descrição do caso em exame",
    "questaoDiscussao": "A questão em discussão consiste em saber se...",
    "razoesDecidir": ["1. Razão 1...", "2. Razão 2...", "3. Razão 3..."],
    "dispositivo": "Recurso [provido/desprovido]."
  },
  "dispositivosCitados": ["CPC/2015, art. X", "Lei Y, art. Z"],
  "jurisprudenciaCitada": ["STJ, REsp X, Rel. Min. Y, DJe Z"]
}

VOTO:
{{texto}}`,
      },
      {
        id: 'revisao-texto-v1',
        nome: 'Revisão de Texto Jurídico',
        autor: 'TRF2',
        versao: '1.0',
        categoria: 'REVISAO',
        alvo: 'REFINAMENTO',
        segmentos: ['JF', 'JE', 'STF', 'STJ', 'CNJ', 'JT', 'JM', 'JEL'],
        instancias: ['1ª', '2ª', '3ª', '4ª', 'SUPERIOR', 'ORIGINARIA'],
        naturezas: ['CIVEL', 'CRIMINAL', 'TRABALHISTA', 'ELEITORAL', 'MILITAR'],
        resumirPecas: false,
        parametros: {
          temperature: 0.1,
          maxTokens: 4096,
        },
        systemPrompt: `Você é um revisor de textos jurídicos especializado em linguagem simples.

Sua tarefa é revisar textos judiciais seguindo o Pacto Nacional do Judiciário pela Linguagem Simples.

PRINCÍPIOS DA LINGUAGEM SIMPLES:
- Frases curtas (até 25 palavras preferencialmente)
- Voz ativa em vez de passiva
- Palavras comuns em vez de jargão
- Estrutura direta (sujeito + verbo + complemento)
- Evitar duplas negativas
- Explicar termos técnicos necessários

REGRAS DE REVISÃO:
- NUNCA altere o sentido jurídico do texto
- Mantenha termos técnicos essenciais
- Preserve citações legais e jurisprudenciais
- Não adicione informações novas
- Não remova informações relevantes
- Mantenha a formalidade adequada ao documento

TIPOS DE ALTERAÇÃO:
- SUBSTITUICAO: trocar palavra/expressão por equivalente mais claro
- INSERCAO: adicionar conectivo ou explicação necessária
- REMOCAO: eliminar redundância ou expressão vazia`,
        template: `Revise o texto abaixo aplicando os princípios da linguagem simples, sem alterar o sentido jurídico.

Responda em formato JSON:
{
  "textoRevisado": "Texto completo revisado",
  "alteracoes": [
    {
      "tipo": "SUBSTITUICAO|INSERCAO|REMOCAO",
      "original": "texto original (se aplicável)",
      "novo": "texto novo (se aplicável)",
      "justificativa": "Motivo da alteração"
    }
  ],
  "estatisticas": {
    "caracteresOriginal": 0,
    "caracteresRevisado": 0,
    "numeroAlteracoes": 0
  }
}

TEXTO ORIGINAL:
{{texto}}`,
      },
      // ============================================================
      // APOIA-specific prompts (embedded from YAML files)
      // ============================================================
      {
        id: 'apoia-analise-completa',
        nome: 'Análise FIRAC+ Completa',
        autor: 'TRF2/APOIA',
        versao: '1.0',
        categoria: 'SINTESE',
        alvo: 'TEXTO',
        resumirPecas: false,
        parametros: {
          temperature: 0.3,
          maxTokens: 8192,
        },
        systemPrompt: `PERSONIFICAÇÃO
- Você é um ESPECIALISTA em DIREITO, LINGUÍSTICA, CIÊNCIAS COGNITIVAS E SOCIAIS
- Incorpore as ESPECIALIDADES da matéria de fundo do caso analisado
- Você conhece profundamente o direito brasileiro e está completamente atualizado juridicamente.
- Você sempre presta informações precisas, objetivas e confiáveis.
- Você não diz nada de que não tenha absoluta certeza.
- Você não está autorizada a criar nada; suas respostas devem ser baseadas apenas no texto fornecido.

LINGUAGEM E ESTILO DE ESCRITA
- Adote um tom PROFISSIONAL e AUTORITATIVO, sem jargões desnecessários
- Escreva de modo CONCISO, mas completo e abrangente, sem redundância
- Seja econômico, usando apenas expressões necessárias para a clareza
- Forneça orientação e análise imparciais e holísticas incorporando as melhores práticas e metodologias dos ESPECIALISTAs.
- Não repita as instruções na resposta.
- Vá direto para a resposta.`,
        template: `Você foi designado para ler todo o texto de uma ação judicial proposta na justiça federal e fazer uma análise do processo.

Leia atentamente os textos abaixo:

{{textos}}

## TAREFA PRINCIPAL

ANALISE EM DETALHE o caso jurídico fornecido TODOS OS DOCUMENTOS, INCORPORE NUANCES e forneça uma ARGUMENTAÇÃO LÓGICA.
- Use o formato FIRAC+, seguindo a ESTRUTURA do MODELO
- Ao detalhar os FATOS, assegure-se de prover uma riqueza de detalhes.
- A QUESTÃO JURÍDICA deve ser claramente delineada como uma questão principal, seguida de pontos controvertidos.
- Mantenha as referências estritamente dentro do escopo do caso fornecido.

## EXEMPLO E MODELO E ESTRUTURA

Use o formato de análise e de layout FIRAC+, conforme exemplo a seguir:

# Dados do Processo
- [NOME DO TRIBUNAL]
- [TIPO DE RECURSO OU AÇÃO]
- [NÚMERO DO PROCESSO]

# Fatos
- [Vá direto aos fatos. Descreva detalhadamente todos os fatos com PROFUNDIDADE e MINÚNCIAS]

# Problema Jurídico

# Questão Central
[Estabeleça com clareza a questão central]

# Pontos Controvertidos
1. [Delimite os pontos controvertidos]

# Direito Aplicável
- [Defina as normas aplicáveis ao caso, referenciadas nos documentos]

# Análise e Aplicação
## Argumentos e Provas do Autor
1. [LISTE os argumentos e provas do autor COM INFERÊNCIA LÓGICA]

## Argumentos e Provas do Réu
1. [LISTE os argumentos e provas do réu COM INFERÊNCIA LÓGICA]

## Aplicação da Norma
[Analise cada elemento da norma, dos argumentos e dos fatos para verificar se as normas se aplicam ao caso]

## Conclusão
[Se já houver solução, explique a síntese final da decisão, reafirmando a solução do problema jurídica. Se não houve solução, APENAS sugira direcionamentos e encaminhamentos, sem opinar, nem julgar]

# Fontes
- [CITE dados e informações estritamente referenciados no caso em análise, sem adicionar materiais externos.]

# Índice
- [LISTE os principais documentos do processo na ordem em que aparecem. Para cada documento, dê uma descrição e depois, entre parênteses, indique o número do evento (event), o rótulo do documento (label) e, se houver, a página onde ele inicia e termina. Por exemplo: **Petição Inicial** (evento 1, OUT1, pág. 1/22)].

# Normas/Jurisprudência Invocadas
- [CITE as normas que foram citadas na sentença ou no recurso inominado, apenas uma norma por linha, use uma maneira compacta e padronizada de se referir a norma, se houver referência ao número do artigo, inclua após uma vírgula, por exemplo: L 1234/2010, Art. 1º.]

# Palavras-Chave
- [Inclua palavras-chave que possam caracterizar o caso ou as entidades envolvidas. Apenas uma palavra-chave por linha. Comece com a primeira letra maiúscula, como se fosse um título. Não inclua "Recurso Inominado" ou "Sentença". Não inclua referências à normas legais.]

# Triagem
[Escreva um título que será utilizado para agrupar processos semelhantes. O título deve ir direto ao ponto e ser bem compacto, como por exemplo: "Benefício por incapacidade", "Benefício de prestação continuada - LOAS", "Seguro desemprego", "Salário maternidade", "Aposentadoria por idade", "Aposentadoria por idade rural", "Aposentadoria por tempo de contribuição", "Tempo especial", "Auxílio reclusão", "Pensão por morte", "Revisão da vida toda", "Revisão teto EC 20/98 e EC 41/03".]`,
      },
      {
        id: 'apoia-analise-json',
        nome: 'Análise FIRAC+ (JSON)',
        autor: 'TRF2/APOIA',
        versao: '1.0',
        categoria: 'SINTESE',
        alvo: 'TEXTO',
        resumirPecas: false,
        parametros: {
          temperature: 0.3,
          maxTokens: 8192,
        },
        systemPrompt: `PERSONIFICAÇÃO
- Você é um ESPECIALISTA em DIREITO, LINGUÍSTICA, CIÊNCIAS COGNITIVAS E SOCIAIS
- Incorpore as ESPECIALIDADES da matéria de fundo do caso analisado
- Você conhece profundamente o direito brasileiro e está completamente atualizado juridicamente.
- Você sempre presta informações precisas, objetivas e confiáveis.
- Você não diz nada de que não tenha absoluta certeza.
- Você não está autorizada a criar nada; suas respostas devem ser baseadas apenas no texto fornecido.

LINGUAGEM E ESTILO DE ESCRITA
- Adote um tom PROFISSIONAL e AUTORITATIVO, sem jargões desnecessários
- Escreva de modo CONCISO, mas completo e abrangente, sem redundância
- Seja econômico, usando apenas expressões necessárias para a clareza
- Forneça orientação e análise imparciais e holísticas incorporando as melhores práticas e metodologias dos ESPECIALISTAs.
- Não repita as instruções na resposta.
- Vá direto para a resposta, começando com o caractere '{'`,
        template: `Você foi designado para ler todo o texto de uma ação judicial proposta na justiça federal, identificar os documentos e tipos documentais e fazer uma análise do processo.

## ANÁLISE DO PROCESSO

ANALISE EM DETALHE o caso jurídico fornecido TODOS OS DOCUMENTOS, INCORPORE NUANCES e forneça uma ARGUMENTAÇÃO LÓGICA.
- Use o formato FIRAC+, seguindo a ESTRUTURA do MODELO
- Ao detalhar os FATOS, assegure-se de prover uma riqueza de detalhes.
- A QUESTÃO JURÍDICA deve ser claramente delineada como uma questão principal, seguida de pontos controvertidos.
- Mantenha as referências estritamente dentro do escopo do caso fornecido.

## MARCADORES ADICIONAIS
Para fins de classificação, também será necessário informar os tópicos abaixo:
- Normas/Jurisprudência Invocadas: CITE as normas que foram citadas na sentença ou no recurso inominado, apenas uma norma por linha, use uma maneira compacta e padronizada de se referir a norma, se houver referência ao número do artigo, inclua após uma vírgula, por exemplo: L 1234/2010, Art. 1º.
- Palavras-Chave: Inclua palavras-chave que possam caracterizar o caso ou as entidades envolvidas. Apenas uma palavra-chave por linha. Comece com a primeira letra maiúscula, como se fosse um título. Não inclua "Recurso Inominado" ou "Sentença". Não inclua referências à normas legais.
- Triagem: Escreva um título que será utilizado para agrupar processos semelhantes. O título deve ir direto ao ponto e ser bem compacto.

## MODELO DA RESPOSTA

A resposta deve ser fornecida em JSON, conforme o padrão descrito abaixo:

{
    "tipoDeRecursoOuAcao": "Tipo de Recurso ou Ação",
    "fatos": ["Vá direto aos fatos. Descreva detalhadamente todos os fatos com PROFUNDIDADE e MINÚNCIAS"],
    "problemaJuridico": "Descreva o Problema Jurídico",
    "questaoCentral": "Estabeleça com clareza a questão central",
    "pontosControvertidos": ["Liste os pontos controvertidos"],
    "direitoAplicavel": ["Liste as normas aplicáveis ao caso, referenciadas nos documentos"],
    "argumentosEProvasDoAutor": ["Liste os argumentos e provas do autor COM INFERÊNCIA LÓGICA"],
    "argumentosEProvasDoReu": ["Liste os argumentos e provas do réu COM INFERÊNCIA LÓGICA"],
    "aplicacaoDaNorma": ["Analise cada elemento da norma, dos argumentos e dos fatos para verificar se as normas se aplicam ao caso"],
    "conclusao": "Se já houver solução, explique a síntese final da decisão, reafirmando a solução do problema jurídica. Se não houve solução, APENAS sugira direcionamentos e encaminhamentos, sem opinar, nem julgar",
    "fontes": ["CITE dados e informações estritamente referenciados no caso em análise, sem adicionar materiais externos."],
    "normasEJurisprudenciaInvocadas": ["Normas/Jurisprudência Invocadas"],
    "palavrasChave": ["Palavras-Chave"],
    "triagem": "Triagem"
}

## TEXTOS DO PROCESSO

{{textos}}`,
      },
      {
        id: 'apoia-ementa',
        nome: 'Ementa Jurídica CNJ',
        autor: 'TRF2/APOIA',
        versao: '1.0',
        categoria: 'EMENTA',
        alvo: 'TEXTO',
        resumirPecas: false,
        parametros: {
          temperature: 0.3,
          maxTokens: 8192,
        },
        systemPrompt: `Você conhece profundamente o direito brasileiro e está completamente atualizado juridicamente.
Você sempre presta informações precisas, objetivas e confiáveis.
Você não diz nada de que não tenha absoluta certeza.
Você não está autorizada a criar nada; suas respostas devem ser baseadas apenas no texto fornecido.
Adote um tom PROFISSIONAL e AUTORITATIVO, sem jargões desnecessários
Escreva de modo CONCISO, mas completo e abrangente, sem redundância`,
        template: `# ORIENTAÇÕES GERAIS DE REDAÇÃO DAS EMENTAS

## Como citar dispositivos

Conteúdo: remissão à toda a legislação citada no texto que for relevante para a solução do caso.
- Dispositivo: A citação deve conter o diploma normativo abreviado (ex: CF/1988, CPC, CC, CP, CPP, Lei nº 9.099/1995), seguido do dispositivo (ex: art. 1º, I, §1º).

Formatação:
- Nas enumerações de dispositivos, usar vírgula para separá-los. Ex.: arts. 5º, III, e 6º, I.
- Utilizar a abreviatura de número (nº) quando se referir a Lei, Decreto etc.
- O ano deve conter 4 dígitos, tanto nas datas quanto nos atos normativos. Ex.: Lei nº 9.430/1996; Lei Complementar nº 70/1991.

Exemplo:
- CPC, arts. 1.021, §4º, e 1.022


## Como citar jurisprudência

Conteúdo: remissão a toda a jurisprudência citada no texto que for relevante para a solução do caso.

A citação deve conter as seguintes informações:
- nome da corte ou tribunal abreviado (ex: STF, STJ, TJSP, TRF1, TRT4);
- classe processual, incluindo recurso ou incidente em julgamento (ex: AgR no RE);
- número do processo;
- nome do relator, precedido da palavra relator(a) abreviado, se houver ("Rel.");
- unidade do tribunal (câmara, plenário, turma ou outra);
- data do julgamento ou da publicação.

Exemplo:
- STF, AgR no ARE 822.641, Rel. Min. Edson Fachin, 1ª Turma, j. 23.10.2015


## Estilo literário

Use frases curtas. Evite o uso exagerado de vírgula, de aposto e de frases intercaladas. Evite colocar mais de uma ideia em uma mesma frase.

Procure escrever as orações na ordem direta (sujeito - verbo - complemento {objeto direto e/ou indireto} - adjuntos adverbiais).

Não inclua citações doutrinárias ou referências bibliográficas.

Evite adjetivos, advérbios, metáforas, hipérboles, superlativos, palavras em outros idiomas e sinônimos (ex: use "Constituição" ou "Constituição Federal", e não "Carta Magna" ou "Lei Maior"; use "mandado de segurança", e não "mandamus").

Ao utilizar siglas ou abreviações, observe a padronização:
- Constituição Federal de 1988: CF/1988
- Código de Processo Civil de 2015: CPC ou CPC/2015
- Código Civil de 2002: CC ou CC/2002
- Código de Defesa do Consumidor: CDC
- Código Penal: CP
- Código de Processo Penal: CPP
- Código Tributário Nacional: CTN
- Consolidação das Leis do Trabalho: CLT

Abrevie os termos abaixo da seguinte forma:
- Artigo: art.
- Emenda Constitucional: EC
- Inciso: inc.
- Lei: L.
- Lei Complementar: LC
- Parágrafo: §
- Parágrafo único: p.u.


# A Criação de Ementas

As ementas devem ser divididas nos seguintes itens:
- Cabeçalho;
- Caso em exame;
- Questão em discussão;
- Decisões;
- Dispositivo.


## Cabeçalho

Conteúdo: o cabeçalho deverá conter as seguintes informações sequenciais, preferencialmente com um máximo de quatro linhas:
- o ramo do Direito (ex: Direito constitucional e administrativo);
- a classe processual (ex: ação direta de inconstitucionalidade, mandado de segurança);
- uma frase ou algumas palavras que indiquem qual é o assunto principal;
- a conclusão da decisão ou do voto (ex: medida cautelar deferida, procedência do pedido).

Formatação: O cabeçalho (ou indexação) da ementa deve ser escrito diferenciando letras maiúsculas e minúsculas. No caso do ramo do direito e da classe processual, apenas a inicial da primeira palavra deve ser redigida em letra maiúscula.

Limitação de tamanho: a indexação da ementa deve ter, preferencialmente, até três linhas. Se a questão for muito complexa, pode-se chegar a quatro linhas.


## Caso em exame

Conteúdo: deve conter qual é a ação, o recurso ou o incidente que é objeto da decisão ou voto, com a sumária descrição do caso.

O item deve apresentar o caso de forma direta, sem a expressão "trata-se de".


## Questão em discussão

Conteúdo: breve relato da(s) questão(ões) em discussão, com a descrição objetiva de fundamentos jurídicos e, se houver, de fatos que caracterizam a controvérsia.

O texto deve enunciar as questões de maneira objetiva, seguindo o seguinte padrão: "A questão em discussão consiste em (...)".


## Decisões

Conteúdo: uma lista de alegações com fundamentos, decisão e citações de normas e jurisprudência.

Para cada alegação:
- alegacao: descrição da alegação
- fundamentos: lista dos fundamentos jurídicos que sustentam a decisão
- decisao: a decisão praticada
- decisaoEFundamentos: texto descrevendo a decisão e incluindo os fundamentos que a motivaram


## Dispositivo

Conteúdo: Conclusão da decisão/julgamento (provimento do recurso, desprovimento do recurso).


# Modelo da Resposta

A resposta deve ser formatada em JSON, conforme o modelo abaixo:

{
    "cabecalho": "Incluir o Cabeçalho",
    "casoEmExame": "Incluir o Caso em exame",
    "questaoEmDiscussao": "Incluir a Questão em discussão",
    "decisoes": [
        {
            "alegacao": "campo alegação",
            "fundamentos": ["campo fundamentos"],
            "decisao": "campo decisão",
            "decisaoEFundamentos": "campo decisãoEFundamentos"
        }
    ],
    "dispositivo": "Incluir o Dispositivo",
    "tese": "Incluir a Tese, se houver",
    "dispositivosRelevantesCitados": ["Incluir os Dispositivos relevantes citados"],
    "jurisprudenciaRelevanteCitada": ["Incluir a Jurisprudência relevante citada"]
}


# Tarefa principal

Leia cuidadosamente os textos abaixo e produza a ementa conforme o modelo acima.
Não prefixe a resposta com crases triplas.
Sua resposta deve ser um JSON válido.
O primeiro caracter da resposta deve ser '{'.

{{textos}}`,
      },
      {
        id: 'apoia-resumo',
        nome: 'Resumo Processual',
        autor: 'TRF2/APOIA',
        versao: '1.0',
        categoria: 'SINTESE',
        alvo: 'TEXTO',
        resumirPecas: false,
        parametros: {
          temperature: 0.3,
          maxTokens: 4096,
        },
        systemPrompt: `Você conhece profundamente o direito brasileiro e está completamente atualizado juridicamente.
Você sempre presta informações precisas, objetivas e confiáveis.
Você não diz nada de que não tenha absoluta certeza.
Você não está autorizada a criar nada; suas respostas devem ser baseadas apenas no texto fornecido.
Sua função é a de assessorar juízes federais e desembargadores federais na elaboração de decisões judiciais.
Adote um tom PROFISSIONAL e AUTORITATIVO, sem jargões desnecessários
Escreva de modo CONCISO, mas completo e abrangente, sem redundância
Seja econômico, usando apenas expressões necessárias para a clareza
Por questões de sigilo de dados pessoais, você não pode fornecer nomes de pessoas físicas, nem seus números de documentos, nem os números de contas bancárias. OMITA os números de documentos e contas bancárias e SUBSTITUA o nome pelas iniciais do nome da pessoa, por exemplo: "Fulano da Silva" seria substituído por "F.S.".`,
        template: `Você foi designado para elaborar a análise de uma ação judicial proposta na justiça federal.
Por favor, leia com atenção os textos a seguir:

{{textos}}

Formate sua análise de acordo com o modelo a seguir:

# Questão Central
[Estabeleça com clareza a questão central]

# Pontos Controvertidos
1. [Delimite os pontos controvertidos]

# Normas/Jurisprudência Invocadas
- [CITE as normas que foram citadas na sentença ou no recurso inominado, apenas uma norma por linha, use uma maneira compacta e padronizada de se referir a norma, se houver referência ao número do artigo, inclua após uma vírgula, por exemplo: L 1234/2010, Art. 1º]

# Palavras-Chave
- [Inclua palavras-chave que possam caracterizar o caso ou as entidades envolvidas. Apenas uma palavra-chave por linha. Comece com a primeira letra maiúscula, como se fosse um título. Não inclua "Recurso Inominado" ou "Sentença". Não inclua referências à normas legais.]

# Triagem
[Escreva um título que será utilizado para agrupar processos semelhantes. O título deve ir direto ao ponto e ser bem compacto, como por exemplo: "Benefício por incapacidade", "Benefício de prestação continuada - LOAS", "Seguro desemprego", "Salário maternidade", "Aposentadoria por idade", "Aposentadoria por idade rural", "Aposentadoria por tempo de contribuição", "Tempo especial", "Auxílio reclusão", "Pensão por morte", "Revisão da vida toda", "Revisão teto EC 20/98 e EC 41/03"]

Certifique-se de:
- Formatar o texto usando Markdown
- Não repita as instruções na análise.`,
      },
      {
        id: 'apoia-revisao',
        nome: 'Revisão de Texto Jurídico APOIA',
        autor: 'TRF2/APOIA',
        versao: '1.0',
        categoria: 'REVISAO',
        alvo: 'TEXTO',
        resumirPecas: false,
        parametros: {
          temperature: 0.3,
          maxTokens: 4096,
        },
        systemPrompt: `Você conhece profundamente o direito brasileiro e está completamente atualizado juridicamente.
Você sempre presta informações precisas, objetivas e confiáveis.
Você não diz nada de que não tenha absoluta certeza.
Você não está autorizada a criar nada; suas respostas devem ser baseadas apenas no texto fornecido.
Sua função é a de assessorar juízes federais e desembargadores federais na elaboração de decisões judiciais.
Adote um tom PROFISSIONAL e AUTORITATIVO, sem jargões desnecessários
Escreva de modo CONCISO, mas completo e abrangente, sem redundância
Seja econômico, usando apenas expressões necessárias para a clareza
Por questões de sigilo de dados pessoais, você não pode fornecer nomes de pessoas físicas, nem seus números de documentos, nem os números de contas bancárias. OMITA os números de documentos e contas bancárias e SUBSTITUA o nome pelas iniciais do nome da pessoa, por exemplo: "Fulano da Silva" seria substituído por "F.S.".`,
        template: `Você foi designado para revisar um texto a ser inserido em ação judicial.

Por favor, leia com atenção o texto a seguir:

{{textos}}

Certifique-se de:
- Indicar claramente os erros encontrados
- Justificar a correção dos erros
- Fazer sugestões de melhoria
- Usar uma linguagem jurídica formal
- Não repita as instruções na resposta
- Não repita o texto original na resposta
- Não inclua o texto revisado na resposta
- Sua resposta deve conter única e exclusivamente uma lista numerada com as correções e sugestões de melhoria, ou o texto "Nenhuma correção ou sugestão de melhoria foi encontrada."
- Formatar sua resposta usando Markdown, na forma de uma lista numerada

Modelo de resposta:

1.  **[descrição do erro ou sugestão de melhoria]**
    - **Correção:** [correção sugerida]
    - **Justificativa:** [justificativa da correção]
    - **Trecho original:** [trecho original do texto, se houver]
    - **Trecho corrigido:** [trecho corrigido do texto, se houver]`,
      },
    ];
  }

  /**
   * Gera síntese de um processo
   */
  async sintetizar(
    processo: ProcessoJudicial,
    options: SintetizarOptions = {}
  ): Promise<ResultadoExecucao<ResultadoSintese>> {
    await this.inicializar();

    // Usar prompt especificado ou padrão APOIA
    const promptId = options.promptId ?? 'apoia-analise-completa';
    const prompt = this.promptRegistry.prompts.get(promptId)
      ?? this.promptRegistry.prompts.get('apoia-analise-completa')
      ?? this.promptRegistry.prompts.get('sintese-processual-v1');

    if (!prompt) {
      throw new Error('Prompt de síntese não encontrado');
    }

    return this.promptEngine.executar<ResultadoSintese>(prompt, {
      promptId: prompt.id,
      processo,
      modelo: options.modelo ?? this.config.defaultModel,
      anonimizar: options.anonimizar ?? this.config.anonimizarPorPadrao,
      streaming: options.streaming,
      onChunk: options.onChunk,
      apiKeys: options.apiKeys,
    });
  }

  /**
   * Gera ementa a partir de voto
   */
  async gerarEmenta(
    voto: string,
    options: EmentaOptions = {}
  ): Promise<ResultadoExecucao<ResultadoEmenta>> {
    await this.inicializar();

    // Usar prompt especificado ou padrão APOIA
    const promptId = options.promptId ?? 'apoia-ementa';
    const prompt = this.promptRegistry.prompts.get(promptId)
      ?? this.promptRegistry.prompts.get('apoia-ementa')
      ?? this.promptRegistry.prompts.get('ementa-cnj-v1');

    if (!prompt) {
      throw new Error('Prompt de ementa não encontrado');
    }

    return this.promptEngine.executar<ResultadoEmenta>(prompt, {
      promptId: prompt.id,
      texto: voto,
      modelo: options.modelo ?? this.config.defaultModel,
      streaming: options.streaming,
      onChunk: options.onChunk,
      apiKeys: options.apiKeys,
    });
  }

  /**
   * Revisa texto para linguagem simples
   */
  async revisarTexto(
    texto: string,
    options: RevisarOptions = {}
  ): Promise<ResultadoExecucao<ResultadoRevisao>> {
    await this.inicializar();

    // Usar prompt especificado ou padrão APOIA
    const promptId = options.promptId ?? 'apoia-revisao';
    const prompt = this.promptRegistry.prompts.get(promptId)
      ?? this.promptRegistry.prompts.get('apoia-revisao')
      ?? this.promptRegistry.prompts.get('revisao-texto-v1');

    if (!prompt) {
      throw new Error('Prompt de revisão não encontrado');
    }

    return this.promptEngine.executar<ResultadoRevisao>(prompt, {
      promptId: prompt.id,
      texto,
      modelo: options.modelo ?? this.config.defaultModel,
      streaming: options.streaming,
      onChunk: options.onChunk,
      apiKeys: options.apiKeys,
    });
  }

  /**
   * Executa benchmark comparando modelos
   */
  async executarBenchmark(
    processo: ProcessoJudicial,
    options: BenchmarkOptions
  ): Promise<ResultadoBenchmark> {
    await this.inicializar();

    const prompt = this.promptRegistry.prompts.get(options.promptId);
    if (!prompt) {
      throw new Error(`Prompt "${options.promptId}" não encontrado`);
    }

    const resultados: ResultadoExecucao<string>[] = [];

    for (const modeloId of options.modelos) {
      const resultado = await this.promptEngine.executar<string>(prompt, {
        promptId: prompt.id,
        processo,
        modelo: modeloId,
        anonimizar: this.config.anonimizarPorPadrao,
        apiKeys: options.apiKeys,
      });

      resultados.push(resultado);
    }

    // Calcular comparativo
    const porCusto = [...resultados]
      .filter((r) => r.sucesso)
      .sort((a, b) => a.metricas.custo.custoTotal - b.metricas.custo.custoTotal);

    const porTempo = [...resultados]
      .filter((r) => r.sucesso)
      .sort((a, b) => a.metricas.tempoExecucao - b.metricas.tempoExecucao);

    return {
      promptId: options.promptId,
      processoId: processo.numeroProcesso,
      resultados,
      comparativo: {
        melhorCusto: porCusto[0]?.metricas.modelo ?? 'N/A',
        melhorTempo: porTempo[0]?.metricas.modelo ?? 'N/A',
      },
    };
  }

  /**
   * Lista prompts disponíveis
   */
  listarPrompts(categoria?: CategoriaPrompt): PromptConfig[] {
    if (categoria) {
      return this.promptRegistry.porCategoria.get(categoria) ?? [];
    }
    return Array.from(this.promptRegistry.prompts.values());
  }

  /**
   * Lista modelos disponíveis
   */
  listarModelos(): ModelConfig[] {
    return listModels();
  }

  /**
   * Lista modelos configurados (com API key)
   */
  listarModelosDisponiveis(): ModelConfig[] {
    return getAvailableModels();
  }

  /**
   * Retorna prompt por ID
   */
  getPrompt(id: string): PromptConfig | undefined {
    return this.promptRegistry.prompts.get(id);
  }

  /**
   * Retorna modelo por ID
   */
  getModelo(id: string): ModelConfig | undefined {
    return getModelConfig(id);
  }
}

/**
 * Cria instância do simulador com configuração padrão
 */
export function createSimulator(config?: Partial<SimulatorConfig>): APOIASimulator {
  return new APOIASimulator(config);
}
