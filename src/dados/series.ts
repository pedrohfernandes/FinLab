/**
 * Catálogo das séries do Banco Central (Sistema Gerenciador de Séries Temporais — SGS)
 * usadas pelo FinLab. Os textos alimentam os cartões do Módulo 0.
 */

export type ChaveSerie = 'selic' | 'cdi' | 'ipca12m' | 'ipcaMensal' | 'tr' | 'poupanca';

export interface InfoSerie {
  /** Código da série no SGS. */
  codigo: number;
  nome: string;
  sigla: string;
  unidade: string;
  quemDefine: string;
  /** Onde a série é usada no FinLab. */
  usadaEm: string;
  /** Explicação para quem nunca ouviu falar do assunto. */
  explicacao: string;
}

export const SERIES: Record<ChaveSerie, InfoSerie> = {
  selic: {
    codigo: 432,
    nome: 'Meta da taxa Selic',
    sigla: 'Selic',
    unidade: '% a.a.',
    quemDefine: 'Copom (Banco Central), a cada ~45 dias',
    usadaEm: 'Regra da poupança (Módulo 0)',
    explicacao:
      'É a taxa básica de juros da economia. Serve de referência para todas as outras: quando sobe, financiamentos e empréstimos ficam mais caros e as aplicações de renda fixa passam a render mais.',
  },
  cdi: {
    codigo: 4389,
    nome: 'CDI anualizado (base 252)',
    sigla: 'CDI',
    unidade: '% a.a.',
    quemDefine: 'Mercado: é a taxa dos empréstimos entre bancos',
    usadaEm: 'CDB e custo de oportunidade (todos os módulos)',
    explicacao:
      'Fica sempre muito próximo da Selic e é a régua dos investimentos: um CDB que paga "100% do CDI" rende essa taxa. Por isso o usamos como custo de oportunidade do dinheiro.',
  },
  ipca12m: {
    codigo: 13522,
    nome: 'IPCA acumulado em 12 meses',
    sigla: 'IPCA 12m',
    unidade: '%',
    quemDefine: 'IBGE',
    usadaEm: 'Taxa real e inflação (Módulo 0)',
    explicacao:
      'É a inflação oficial: quanto os preços subiram nos últimos 12 meses. Um investimento só aumenta seu poder de compra se render mais que isso.',
  },
  ipcaMensal: {
    codigo: 433,
    nome: 'IPCA do mês',
    sigla: 'IPCA mês',
    unidade: '% a.m.',
    quemDefine: 'IBGE',
    usadaEm: 'Contexto de inflação (Módulo 0)',
    explicacao: 'A inflação medida em um único mês. É volátil; por isso olhamos o acumulado de 12 meses.',
  },
  tr: {
    codigo: 226,
    nome: 'Taxa Referencial (TR)',
    sigla: 'TR',
    unidade: '% a.m.',
    quemDefine: 'Banco Central, a partir das taxas de CDBs',
    usadaEm: 'Rendimento da poupança (Módulo 0)',
    explicacao:
      'Hoje está perto de zero, mas ainda importa: ela é somada ao rendimento da poupança e corrige o saldo devedor de muitos financiamentos imobiliários.',
  },
  poupanca: {
    codigo: 195,
    nome: 'Rentabilidade da poupança',
    sigla: 'Poupança',
    unidade: '% no mês',
    quemDefine: 'Regra legal (Lei 12.703/2012), calculada a partir da Selic e da TR',
    usadaEm: 'Conferência do cálculo da poupança (Módulo 0)',
    explicacao:
      'O que a caderneta rende em um mês. Usamos este valor oficial para conferir se o nosso cálculo da regra da poupança está correto.',
  },
};
