import { describe, it, expect, beforeEach } from 'vitest';
import { Anonymizer } from '../../src/processors/anonymizer.js';

describe('Anonymizer', () => {
  let anonymizer: Anonymizer;

  beforeEach(() => {
    anonymizer = new Anonymizer();
  });

  describe('anonimizar CPF', () => {
    it('deve anonimizar CPF com pontuação', () => {
      const texto = 'O CPF do autor é 123.456.789-00';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('O CPF do autor é [CPF_ANONIMIZADO]');
    });

    it('deve anonimizar CPF sem pontuação', () => {
      const texto = 'CPF: 12345678900';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('CPF: [CPF_ANONIMIZADO]');
    });

    it('deve anonimizar múltiplos CPFs', () => {
      const texto = 'CPF 123.456.789-00 e CPF 987.654.321-00';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('CPF [CPF_ANONIMIZADO] e CPF [CPF_ANONIMIZADO]');
    });

    it('deve manter consistência com substituições numeradas', () => {
      const texto = 'CPF 123.456.789-00 aparece novamente: 123.456.789-00';
      const resultado = anonymizer.anonimizar(texto, { substituicoesNumeradas: true });
      expect(resultado).toBe('CPF [CPF_1] aparece novamente: [CPF_1]');
    });
  });

  describe('anonimizar CNPJ', () => {
    it('deve anonimizar CNPJ com pontuação', () => {
      const texto = 'CNPJ: 12.345.678/0001-90';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('CNPJ: [CNPJ_ANONIMIZADO]');
    });

    it('deve anonimizar CNPJ sem pontuação', () => {
      const texto = 'CNPJ: 12345678000190';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('CNPJ: [CNPJ_ANONIMIZADO]');
    });
  });

  describe('anonimizar emails', () => {
    it('deve anonimizar emails', () => {
      const texto = 'Contato: joao.silva@email.com';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Contato: [EMAIL_ANONIMIZADO]');
    });

    it('deve anonimizar múltiplos emails', () => {
      const texto = 'Emails: a@b.com e c@d.org';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Emails: [EMAIL_ANONIMIZADO] e [EMAIL_ANONIMIZADO]');
    });
  });

  describe('anonimizar telefones', () => {
    it('deve anonimizar telefone com DDD', () => {
      const texto = 'Tel: (21) 99999-8888';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Tel: [TELEFONE_ANONIMIZADO]');
    });

    it('deve anonimizar telefone com formato simples', () => {
      const texto = 'Telefone: 99999-8888';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Telefone: [TELEFONE_ANONIMIZADO]');
    });
  });

  describe('anonimizar OAB', () => {
    it('deve anonimizar número OAB', () => {
      const texto = 'Advogado OAB/RJ 123456';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Advogado [OAB_ANONIMIZADO]');
    });

    it('deve anonimizar OAB com diferentes formatos', () => {
      const texto = 'OAB SP 12345';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('[OAB_ANONIMIZADO]');
    });
  });

  describe('anonimizar nomes', () => {
    it('deve anonimizar nomes após termos jurídicos', () => {
      const texto = 'A autora Maria da Silva Santos requer';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toContain('[NOME_ANONIMIZADO]');
    });

    it('deve anonimizar nome de réu', () => {
      const texto = 'O réu João Carlos Pereira contestou';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toContain('[NOME_ANONIMIZADO]');
    });

    it('NÃO deve anonimizar termos jurídicos', () => {
      const texto = 'O Ministério Público Federal ajuizou ação';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe(texto);
    });

    it('NÃO deve anonimizar INSS', () => {
      const texto = 'O Instituto Nacional do Seguro Social contestou';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).not.toContain('[NOME_ANONIMIZADO]');
    });

    it('deve manter nomes se opção habilitada', () => {
      const texto = 'A autora Maria da Silva Santos requer';
      const resultado = anonymizer.anonimizar(texto, { manterNomes: true });
      expect(resultado).toBe(texto);
    });
  });

  describe('anonimizar CEP', () => {
    it('deve anonimizar CEP', () => {
      const texto = 'CEP: 12345-678';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('CEP: [CEP_ANONIMIZADO]');
    });

    it('deve manter CEP se opção habilitada', () => {
      const texto = 'CEP: 12345-678';
      const resultado = anonymizer.anonimizar(texto, { manterEnderecos: true });
      expect(resultado).toBe(texto);
    });
  });

  describe('anonimizar dados bancários', () => {
    it('deve anonimizar conta bancária', () => {
      const texto = 'Conta: 123456-7';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('[CONTA_ANONIMIZADA]');
    });

    it('deve anonimizar agência', () => {
      const texto = 'Agência: 1234';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('[AGENCIA_ANONIMIZADA]');
    });
  });

  describe('anonimizar cartão de crédito', () => {
    it('deve anonimizar número de cartão', () => {
      const texto = 'Cartão: 1234567890123456';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Cartão: [CARTAO_ANONIMIZADO]');
    });
  });

  describe('anonimizar placa de veículo', () => {
    it('deve anonimizar placa antiga', () => {
      const texto = 'Placa ABC-1234';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Placa [PLACA_ANONIMIZADA]');
    });

    it('deve anonimizar placa Mercosul', () => {
      const texto = 'Placa ABC1D23';
      const resultado = anonymizer.anonimizar(texto);
      expect(resultado).toBe('Placa [PLACA_ANONIMIZADA]');
    });
  });

  describe('getSubstituicoes', () => {
    it('deve retornar mapeamento de substituições', () => {
      const texto = 'CPF: 123.456.789-00';
      anonymizer.anonimizar(texto, { substituicoesNumeradas: true });
      const subs = anonymizer.getSubstituicoes();
      expect(subs.size).toBe(1);
      expect(subs.get('123.456.789-00')).toBe('[CPF_1]');
    });
  });

  describe('getEstatisticas', () => {
    it('deve retornar estatísticas de anonimização', () => {
      const texto = 'CPF: 123.456.789-00, CNPJ: 12.345.678/0001-90';
      anonymizer.anonimizar(texto, { substituicoesNumeradas: true });
      const stats = anonymizer.getEstatisticas();
      expect(stats.CPF).toBe(1);
      expect(stats.CNPJ).toBe(1);
    });
  });

  describe('reset', () => {
    it('deve resetar estado do anonimizador', () => {
      const texto = 'CPF: 123.456.789-00';
      anonymizer.anonimizar(texto, { substituicoesNumeradas: true });
      anonymizer.reset();
      expect(anonymizer.getSubstituicoes().size).toBe(0);
      expect(Object.keys(anonymizer.getEstatisticas()).length).toBe(0);
    });
  });
});
