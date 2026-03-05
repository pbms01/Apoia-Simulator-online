/**
 * Motor de execução de prompts
 */

import type { PromptConfig, PromptInput } from '../types/prompt.js';
import type { ProcessoJudicial } from '../types/process.js';
import type { ResultadoExecucao, MetricasExecucao } from '../types/result.js';
import { LLMProvider } from './llm-provider.js';
import { PecaSelector } from '../processors/peca-selector.js';
import { Anonymizer } from '../processors/anonymizer.js';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export class PromptEngine {
  private pecaSelector: PecaSelector;
  private anonymizer: Anonymizer;

  constructor() {
    this.pecaSelector = new PecaSelector();
    this.anonymizer = new Anonymizer();
  }

  async executar<T = string>(
    config: PromptConfig,
    input: PromptInput
  ): Promise<ResultadoExecucao<T>> {
    const inicio = Date.now();

    try {
      let contexto: string;

      if (config.alvo === 'PECAS' && input.processo) {
        contexto = this.prepararContextoPecas(input.processo, config);
      } else if (config.alvo === 'TEXTO' && input.texto) {
        contexto = input.texto;
      } else if (config.alvo === 'REFINAMENTO' && input.texto) {
        contexto = input.texto;
      } else {
        throw new Error(
          `Input inválido para o tipo de prompt "${config.alvo}". ` +
            `Esperado: ${config.alvo === 'PECAS' ? 'processo' : 'texto'}`
        );
      }

      const contextoFinal =
        input.anonimizar !== false ? this.anonymizer.anonimizar(contexto) : contexto;

      const promptFinal = this.montarPromptFinal(config, contextoFinal);

      // Pass apiKeys to LLMProvider
      const provider = new LLMProvider(input.modelo, input.apiKeys);

      let resultado: { text: string; usage: { promptTokens: number; completionTokens: number } };

      if (input.streaming && input.onChunk) {
        const generator = provider.generateStream({
          system: config.systemPrompt,
          prompt: promptFinal,
          temperature: input.parametrosOverride?.temperature ?? config.parametros?.temperature,
          maxTokens: input.parametrosOverride?.maxTokens ?? config.parametros?.maxTokens,
        });

        let fullText = '';
        let chunk = await generator.next();

        while (!chunk.done) {
          input.onChunk(chunk.value);
          fullText += chunk.value;
          chunk = await generator.next();
        }

        resultado = {
          text: fullText,
          usage: chunk.value.usage,
        };
      } else {
        resultado = await provider.generate({
          system: config.systemPrompt,
          prompt: promptFinal,
          temperature: input.parametrosOverride?.temperature ?? config.parametros?.temperature,
          maxTokens: input.parametrosOverride?.maxTokens ?? config.parametros?.maxTokens,
        });
      }

      const dadosProcessados = this.processarResposta<T>(resultado.text);

      const tempoExecucao = Date.now() - inicio;

      const metricas: MetricasExecucao = {
        tempoExecucao,
        tokens: {
          promptTokens: resultado.usage.promptTokens,
          completionTokens: resultado.usage.completionTokens,
          totalTokens: resultado.usage.promptTokens + resultado.usage.completionTokens,
        },
        custo: {
          custoEntrada: (resultado.usage.promptTokens / 1000) * provider.config.costPer1kInput,
          custoSaida: (resultado.usage.completionTokens / 1000) * provider.config.costPer1kOutput,
          custoTotal: provider.calcularCusto(resultado.usage.promptTokens, resultado.usage.completionTokens),
        },
        modelo: input.modelo,
        streaming: input.streaming ?? false,
      };

      return {
        sucesso: true,
        dados: dadosProcessados,
        metricas,
        promptFinal,
        respostaBruta: resultado.text,
      };
    } catch (error) {
      return {
        sucesso: false,
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        metricas: {
          tempoExecucao: Date.now() - inicio,
          tokens: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          custo: { custoEntrada: 0, custoSaida: 0, custoTotal: 0 },
          modelo: input.modelo,
          streaming: input.streaming ?? false,
        },
      };
    }
  }

  private prepararContextoPecas(processo: ProcessoJudicial, config: PromptConfig): string {
    const pecas = this.pecaSelector.selecionar(processo.pecas, config.selecaoPecas, config.categoria);

    const partes = [
      `PROCESSO: ${processo.numeroProcesso}`,
      `CLASSE: ${processo.classeProcessual}`,
      `AJUIZAMENTO: ${formatDate(processo.dataAjuizamento)}`,
      `ÓRGÃO JULGADOR: ${typeof processo.orgaoJulgador === 'object' ? processo.orgaoJulgador.nome : processo.orgaoJulgador}`,
      '',
      'PARTES:',
      ...processo.partes.map((p) => `- ${p.polo}: ${p.nome}`),
      '',
      `ASSUNTOS: ${processo.assuntos.map((a) => typeof a === 'string' ? a : a.descricao).join(', ')}`,
      '',
      'PEÇAS PROCESSUAIS:',
    ];

    for (const peca of pecas) {
      partes.push(`\n--- ${peca.tipo} (${peca.id}) - ${formatDate(peca.dataJuntada)} ---`);

      if (config.resumirPecas && peca.conteudo.length > 5000) {
        partes.push(peca.conteudo.substring(0, 5000) + '\n[...conteúdo truncado...]');
      } else {
        partes.push(peca.conteudo);
      }
    }

    return partes.join('\n');
  }

  private montarPromptFinal(config: PromptConfig, contexto: string): string {
    let prompt = config.template;

    const placeholders: Record<string, string> = {
      '{{textos}}': contexto,
      '{{texto}}': contexto,
      '{{TEXTOS}}': contexto,
      '{{TEXTO}}': contexto,
      '{{conteudo}}': contexto,
      '{{CONTEUDO}}': contexto,
    };

    for (const [placeholder, valor] of Object.entries(placeholders)) {
      if (prompt.includes(placeholder)) {
        prompt = prompt.replace(placeholder, valor);
        return prompt;
      }
    }

    return prompt + '\n\n' + contexto;
  }

  private processarResposta<T>(resposta: string): T {
    const jsonMatch = resposta.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as T;
      } catch {
        // Continue
      }
    }

    try {
      return JSON.parse(resposta) as T;
    } catch {
      return resposta as unknown as T;
    }
  }

  estimarTokens(texto: string): number {
    return Math.ceil(texto.length / 4);
  }
}
