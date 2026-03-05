import { describe, it, expect, beforeEach } from 'vitest';
import { PecaSelector } from '../../src/processors/peca-selector.js';
import type { PecaProcessual } from '../../src/types/process.js';

describe('PecaSelector', () => {
  let selector: PecaSelector;
  let pecasMock: PecaProcessual[];

  beforeEach(() => {
    selector = new PecaSelector();

    pecasMock = [
      {
        id: 'PET1',
        codigo: 'PET1',
        tipo: 'PETIÇÃO INICIAL',
        conteudo: 'Conteúdo da petição inicial...',
        dataJuntada: new Date('2023-01-01'),
        numeroPaginas: 10,
        nivelSigilo: 0,
      },
      {
        id: 'CONT1',
        codigo: 'CONT',
        tipo: 'CONTESTAÇÃO',
        conteudo: 'Conteúdo da contestação...',
        dataJuntada: new Date('2023-02-01'),
        numeroPaginas: 15,
        nivelSigilo: 0,
      },
      {
        id: 'SENT1',
        codigo: 'SENT',
        tipo: 'SENTENÇA',
        conteudo: 'Conteúdo da sentença...',
        dataJuntada: new Date('2023-03-01'),
        numeroPaginas: 5,
        nivelSigilo: 0,
      },
      {
        id: 'CERT1',
        codigo: 'CERT',
        tipo: 'CERTIDÃO',
        conteudo: 'Conteúdo da certidão...',
        dataJuntada: new Date('2023-01-15'),
        numeroPaginas: 1,
        nivelSigilo: 0,
      },
      {
        id: 'SIGILOSO1',
        codigo: 'DOC',
        tipo: 'DOCUMENTO SIGILOSO',
        conteudo: 'Conteúdo sigiloso...',
        dataJuntada: new Date('2023-01-20'),
        numeroPaginas: 3,
        nivelSigilo: 1,
      },
    ];
  });

  describe('selecionar sem configuração', () => {
    it('deve selecionar peças por categoria SINTESE', () => {
      const resultado = selector.selecionar(pecasMock, undefined, 'SINTESE');
      expect(resultado.length).toBe(3); // PET1, CONT, SENT
      expect(resultado.map((p) => p.id)).toContain('PET1');
      expect(resultado.map((p) => p.id)).toContain('CONT1');
      expect(resultado.map((p) => p.id)).toContain('SENT1');
    });

    it('deve excluir peças sigilosas', () => {
      const resultado = selector.selecionar(pecasMock, undefined, 'SINTESE');
      expect(resultado.map((p) => p.id)).not.toContain('SIGILOSO1');
    });

    it('deve ordenar por data de juntada', () => {
      const resultado = selector.selecionar(pecasMock, undefined, 'SINTESE');
      const datas = resultado.map((p) => p.dataJuntada.getTime());
      expect(datas).toEqual([...datas].sort((a, b) => a - b));
    });
  });

  describe('selecionar com configuração PRINCIPAIS', () => {
    it('deve selecionar apenas peças principais', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'PRINCIPAIS',
      });
      expect(resultado.length).toBe(3);
      expect(resultado.map((p) => p.id)).not.toContain('CERT1');
    });
  });

  describe('selecionar com configuração RECENTES', () => {
    it('deve selecionar peças mais recentes', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'RECENTES',
        limite: 2,
      });
      expect(resultado.length).toBe(2);
      // Verifica que retornou as mais recentes (SENT1 e CONT1 têm datas mais recentes)
      const ids = resultado.map(p => p.id);
      expect(ids).toContain('SENT1');
      expect(ids).toContain('CONT1');
    });
  });

  describe('selecionar com configuração TODAS', () => {
    it('deve retornar todas as peças públicas', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'TODAS',
      });
      expect(resultado.length).toBe(4); // Exceto sigilosa
    });
  });

  describe('selecionar com filtros de tipo', () => {
    it('deve incluir apenas tipos especificados', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'TODAS',
        tiposIncluir: ['SENT', 'CONT'],
      });
      expect(resultado.length).toBe(2);
      expect(resultado.map((p) => p.id)).toContain('SENT1');
      expect(resultado.map((p) => p.id)).toContain('CONT1');
    });

    it('deve excluir tipos especificados', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'TODAS',
        tiposExcluir: ['CERT'],
      });
      expect(resultado.map((p) => p.id)).not.toContain('CERT1');
    });
  });

  describe('selecionar com limite', () => {
    it('deve respeitar limite de peças', () => {
      const resultado = selector.selecionar(pecasMock, {
        estrategia: 'TODAS',
        limite: 2,
      });
      expect(resultado.length).toBe(2);
    });
  });

  describe('selecionarPorCategoria', () => {
    it('deve selecionar peças para EMENTA', () => {
      const resultado = selector.selecionarPorCategoria(pecasMock, 'EMENTA');
      expect(resultado.map((p) => p.id)).toContain('SENT1');
    });

    it('deve selecionar peças para TRIAGEM', () => {
      const resultado = selector.selecionarPorCategoria(pecasMock, 'TRIAGEM');
      expect(resultado.map((p) => p.id)).toContain('PET1');
      expect(resultado.map((p) => p.id)).toContain('CONT1');
    });
  });

  describe('estimarTokens', () => {
    it('deve estimar tokens corretamente', () => {
      const pecas = [
        {
          ...pecasMock[0],
          conteudo: 'a'.repeat(400), // 400 caracteres = ~100 tokens
        },
      ];
      const tokens = selector.estimarTokens(pecas);
      expect(tokens).toBe(100);
    });

    it('deve somar tokens de múltiplas peças', () => {
      const pecas = [
        { ...pecasMock[0], conteudo: 'a'.repeat(400) },
        { ...pecasMock[1], conteudo: 'b'.repeat(200) },
      ];
      const tokens = selector.estimarTokens(pecas);
      expect(tokens).toBe(150); // (400 + 200) / 4
    });
  });

  describe('selecionarComLimiteTokens', () => {
    it('deve respeitar limite de tokens', () => {
      const pecasGrandes = pecasMock.map((p) => ({
        ...p,
        conteudo: 'x'.repeat(4000), // 1000 tokens cada
      }));
      const resultado = selector.selecionarComLimiteTokens(pecasGrandes, 2000, 'SINTESE');
      // Deve parar antes de ultrapassar 2000 tokens
      expect(selector.estimarTokens(resultado)).toBeLessThanOrEqual(2000);
    });
  });

  describe('isPecaAuxiliar', () => {
    it('deve identificar certidão como auxiliar', () => {
      expect(selector.isPecaAuxiliar(pecasMock[3])).toBe(true);
    });

    it('deve identificar petição como não auxiliar', () => {
      expect(selector.isPecaAuxiliar(pecasMock[0])).toBe(false);
    });

    it('deve identificar sentença como não auxiliar', () => {
      expect(selector.isPecaAuxiliar(pecasMock[2])).toBe(false);
    });
  });
});
