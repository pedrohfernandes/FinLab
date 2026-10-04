/**
 * Rendimento da caderneta de poupança (regra vigente desde maio de 2012).
 *
 *  - Se a meta Selic é MAIOR que 8,5% a.a.: rende 0,5% ao mês + TR.
 *  - Se a meta Selic é MENOR OU IGUAL a 8,5% a.a.: rende 70% da Selic (ao ano,
 *    convertida em taxa mensal equivalente) + TR.
 *
 * A TR entra de forma composta: rendimento = (1 + base)·(1 + TR) − 1.
 * O rendimento da poupança para pessoa física é isento de Imposto de Renda.
 */

/** Meta Selic que separa os dois regimes (8,5% a.a.). */
export const LIMITE_SELIC_POUPANCA = 0.085;

export type RegimePoupanca = 'selic-alta' | 'selic-baixa';

export function regimePoupanca(selicMetaAnual: number): RegimePoupanca {
  return selicMetaAnual > LIMITE_SELIC_POUPANCA ? 'selic-alta' : 'selic-baixa';
}

/**
 * Parte "fixa" do rendimento mensal, antes da TR.
 *  - Selic alta:  0,5% a.m.
 *  - Selic baixa: (1 + 70%·Selic)^(1/12) − 1
 */
export function baseMensalPoupanca(selicMetaAnual: number): number {
  if (regimePoupanca(selicMetaAnual) === 'selic-alta') return 0.005;
  return Math.pow(1 + 0.7 * selicMetaAnual, 1 / 12) - 1;
}

/**
 * Rendimento mensal total da poupança.
 *   rendimento = (1 + base)·(1 + TR) − 1
 *
 * Ex.: Selic 13,75% e TR 0,1616% ⇒ 1,005 × 1,001616 − 1 ≈ 0,6624% a.m.
 */
export function rendimentoPoupancaMensal(selicMetaAnual: number, trMensal: number): number {
  return (1 + baseMensalPoupanca(selicMetaAnual)) * (1 + trMensal) - 1;
}
