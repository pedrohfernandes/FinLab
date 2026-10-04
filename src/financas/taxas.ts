/**
 * Conversões e propriedades de taxas de juros.
 *
 * Convenção do projeto: toda taxa neste módulo é uma FRAÇÃO (0,01 = 1%).
 * A interface é quem converte de/para porcentagem.
 *
 * Ref.: Cap. 5 — Cotações e ajustes de taxas de juros.
 */

/** Dias úteis considerados em um ano (convenção do mercado para o CDI). */
export const DIAS_UTEIS_ANO = 252;

/** Como uma taxa foi informada. */
export type TipoTaxa = 'mensal' | 'anual-efetiva' | 'anual-nominal';

/**
 * Taxa anual → taxa mensal EQUIVALENTE (juros compostos).
 *
 * Duas taxas são equivalentes quando, aplicadas ao mesmo capital pelo mesmo
 * tempo, rendem o mesmo. Como 1 ano = 12 meses:
 *   (1 + i_a) = (1 + i_m)^12   ⇒   i_m = (1 + i_a)^(1/12) − 1
 *
 * Ex.: anualParaMensal(0,12) ≈ 0,009489 (12% a.a. ≈ 0,9489% a.m.)
 */
export function anualParaMensal(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

/**
 * Taxa mensal → taxa anual EQUIVALENTE (juros compostos).
 *   i_a = (1 + i_m)^12 − 1
 *
 * Ex.: mensalParaAnual(0,01) ≈ 0,126825 (1% a.m. ≈ 12,68% a.a., e não 12%)
 */
export function mensalParaAnual(taxaMensal: number): number {
  return Math.pow(1 + taxaMensal, 12) - 1;
}

/**
 * Converte a taxa informada para taxa mensal efetiva, conforme sua convenção:
 *  - 'mensal':         já é a taxa do mês;
 *  - 'anual-efetiva':  taxa equivalente composta, i_m = (1 + i_a)^(1/12) − 1;
 *  - 'anual-nominal':  taxa PROPORCIONAL, i_m = i_a / 12 (usada nos exemplos
 *                      de SAC/Price do Cap. 5: 63% a.a. → 5,25% a.m.).
 */
export function taxaMensalDe(valor: number, tipo: TipoTaxa): number {
  switch (tipo) {
    case 'mensal':
      return valor;
    case 'anual-efetiva':
      return anualParaMensal(valor);
    case 'anual-nominal':
      return valor / 12;
  }
}

/**
 * Taxa acumulada após n períodos a uma taxa constante por período.
 *   acumulada = (1 + i)^n − 1
 */
export function acumular(taxaPorPeriodo: number, periodos: number): number {
  return Math.pow(1 + taxaPorPeriodo, periodos) - 1;
}

/**
 * Equação de Fisher: taxa REAL a partir da taxa nominal e da inflação.
 *   (1 + nominal) = (1 + real)·(1 + inflação)   ⇒   real = (1 + nominal)/(1 + inflação) − 1
 *
 * Note que NÃO é a subtração simples: 13,65% de juros com 4,22% de inflação
 * dá 9,05% reais (e não 9,43%).
 *
 * Ex.: fisher(0,1365, 0,0422) ≈ 0,090482
 */
export function fisher(nominal: number, inflacao: number): number {
  return (1 + nominal) / (1 + inflacao) - 1;
}

/**
 * Taxa anual de um CDB que paga "X% do CDI".
 *
 * O CDI é divulgado como taxa anual (base 252 dias úteis), mas o "X% do CDI"
 * incide sobre a taxa DIÁRIA. Por isso:
 *   d     = (1 + CDI)^(1/252) − 1
 *   anual = (1 + X·d)^252 − 1
 *
 * Com X = 100% devolve o próprio CDI. Com X = 110% o resultado é um pouco
 * diferente de 1,10 × CDI — é o efeito dos juros compostos.
 *
 * Ex.: taxaCdbAnual(0,1365, 1,1) ≈ 0,151131
 */
export function taxaCdbAnual(cdiAnual: number, percentualDoCdi: number): number {
  const diaria = Math.pow(1 + cdiAnual, 1 / DIAS_UTEIS_ANO) - 1;
  return Math.pow(1 + percentualDoCdi * diaria, DIAS_UTEIS_ANO) - 1;
}

/**
 * Operação inversa de taxaCdbAnual: quantos % do CDI uma taxa anual representa.
 *   X = ((1 + anual)^(1/252) − 1) / ((1 + CDI)^(1/252) − 1)
 */
export function percentualDoCdi(taxaAnual: number, cdiAnual: number): number {
  const diariaCdb = Math.pow(1 + taxaAnual, 1 / DIAS_UTEIS_ANO) - 1;
  const diariaCdi = Math.pow(1 + cdiAnual, 1 / DIAS_UTEIS_ANO) - 1;
  return diariaCdb / diariaCdi;
}
