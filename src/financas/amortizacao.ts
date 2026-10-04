/**
 * Sistemas de amortização de empréstimos: SAC e Price (Tabela Price).
 *
 * Em ambos, a cada mês:  parcela = juros + amortização
 *   juros        = taxa × saldo devedor do início do mês
 *   amortização  = parte da parcela que reduz a dívida
 *
 * Ref.: Cap. 5 — Aplicação: taxas de descapitalização e empréstimos.
 */

export type SistemaAmortizacao = 'SAC' | 'PRICE';

export interface LinhaAmortizacao {
  mes: number;
  saldoInicial: number;
  juros: number;
  amortizacao: number;
  parcela: number;
  saldoFinal: number;
}

/**
 * Parcela fixa da Tabela Price.
 *
 * O valor financiado é o valor presente das n parcelas iguais (PG de razão 1/(1+i)):
 *   PV = PMT · [1 − (1+i)^−n] / i   ⇒   PMT = PV·i / [1 − (1+i)^−n]
 *
 * Ex.: pmtPrice(10000, 0,01, 12) ≈ 888,49
 */
export function pmtPrice(principal: number, taxa: number, n: number): number {
  if (Math.abs(taxa) < 1e-12) return principal / n;
  return (principal * taxa) / (1 - Math.pow(1 + taxa, -n));
}

/**
 * Tabela de amortização completa.
 *
 * SAC:   amortização constante A = PV/n; os juros caem junto com o saldo, então
 *        as parcelas formam uma PA decrescente de razão −i·A.
 * Price: parcela constante; no início quase tudo é juros e a amortização cresce
 *        em PG de razão (1 + i).
 */
export function tabelaAmortizacao(
  principal: number,
  taxaMensal: number,
  n: number,
  sistema: SistemaAmortizacao,
): LinhaAmortizacao[] {
  const linhas: LinhaAmortizacao[] = [];
  const parcelaPrice = pmtPrice(principal, taxaMensal, n);
  let saldo = principal;

  for (let mes = 1; mes <= n; mes++) {
    const juros = saldo * taxaMensal;
    const amortizacao = sistema === 'SAC' ? principal / n : parcelaPrice - juros;
    const saldoFinal = mes === n ? 0 : saldo - amortizacao; // evita resíduo de ponto flutuante
    linhas.push({ mes, saldoInicial: saldo, juros, amortizacao, parcela: juros + amortizacao, saldoFinal });
    saldo = saldoFinal;
  }
  return linhas;
}

/** Totais pagos ao longo do contrato. */
export function totaisAmortizacao(linhas: LinhaAmortizacao[]) {
  return linhas.reduce(
    (t, l) => ({ juros: t.juros + l.juros, amortizacao: t.amortizacao + l.amortizacao, parcelas: t.parcelas + l.parcela }),
    { juros: 0, amortizacao: 0, parcelas: 0 },
  );
}

/**
 * Valor presente das parcelas de uma tabela, descontadas a `taxaMensal`.
 *   VP = Σ parcela_t / (1 + r)^t
 *
 * Descontando pela PRÓPRIA taxa do contrato, SAC e Price valem o mesmo: o valor financiado.
 */
export function vpDasParcelas(linhas: LinhaAmortizacao[], taxaMensal: number): number {
  return linhas.reduce((soma, l) => soma + l.parcela / Math.pow(1 + taxaMensal, l.mes), 0);
}
