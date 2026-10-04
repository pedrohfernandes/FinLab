/**
 * Imposto de Renda sobre aplicações de renda fixa (tabela regressiva).
 *
 * O imposto incide só sobre o RENDIMENTO (não sobre o valor aplicado) e é
 * cobrado no resgate; quanto mais tempo o dinheiro fica aplicado, menor a alíquota.
 */

/** Convenção simplificada: 1 mês = 30 dias corridos. */
export const DIAS_POR_MES = 30;

/**
 * Alíquota do IR regressivo pelo prazo da aplicação (em dias corridos):
 *   até 180 dias → 22,5% · 181 a 360 → 20% · 361 a 720 → 17,5% · acima de 720 → 15%
 *
 * Ex.: aliquotaIrRegressivo(400) = 0,175
 */
export function aliquotaIrRegressivo(dias: number): number {
  if (dias <= 180) return 0.225;
  if (dias <= 360) return 0.2;
  if (dias <= 720) return 0.175;
  return 0.15;
}

/**
 * Fator de crescimento LÍQUIDO de IR, dado o fator bruto da aplicação.
 *   fatorLíquido = 1 + (fatorBruto − 1)·(1 − alíquota)
 *
 * Ex.: fator bruto 1,10 com IR de 20% → 1 + 0,10·0,8 = 1,08
 */
export function fatorLiquido(fatorBruto: number, aliquota: number): number {
  return 1 + (fatorBruto - 1) * (1 - aliquota);
}

/**
 * Operação inversa: que fator bruto é necessário para chegar a um fator líquido.
 *   fatorBruto = 1 + (fatorLíquido − 1)/(1 − alíquota)
 */
export function fatorBrutoNecessario(fatorLiquidoAlvo: number, aliquota: number): number {
  return 1 + (fatorLiquidoAlvo - 1) / (1 - aliquota);
}

/**
 * Taxa MENSAL líquida de IR equivalente a uma aplicação a certa taxa anual bruta,
 * mantida por `meses` meses.
 *
 *   G   = (1 + i_a)^(meses/12)          (crescimento bruto no prazo)
 *   G'  = 1 + (G − 1)·(1 − alíquota)    (crescimento líquido no prazo)
 *   i_m = G'^(1/meses) − 1              (taxa mensal que produz G' em `meses` meses)
 *
 * Ex.: 13,65% a.a. por 24 meses, com IR de 15% ⇒ ≈ 0,92699% a.m.
 */
export function taxaMensalLiquida(taxaAnualBruta: number, meses: number, aliquota: number): number {
  const bruto = Math.pow(1 + taxaAnualBruta, meses / 12);
  return Math.pow(fatorLiquido(bruto, aliquota), 1 / meses) - 1;
}
