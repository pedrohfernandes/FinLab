/**
 * Módulo 0 — Poupança ou CDB? (o preço do dinheiro hoje)
 *
 * Pergunta: onde o meu dinheiro rende mais — de verdade, depois do imposto e da inflação?
 */
import { aliquotaIrRegressivo, DIAS_POR_MES, fatorBrutoNecessario, fatorLiquido } from '../../financas/impostos';
import { baseMensalPoupanca, regimePoupanca, rendimentoPoupancaMensal, type RegimePoupanca } from '../../financas/poupanca';
import { acumular, anualParaMensal, fisher, mensalParaAnual, percentualDoCdi, taxaCdbAnual } from '../../financas/taxas';

export interface EntradaPoupancaCdb {
  valor: number;
  prazoMeses: number;
  /** CDB paga este múltiplo do CDI (1 = 100% do CDI). */
  multiploCdi: number;
  /** Meta Selic, % a.a. como fração. */
  selic: number;
  /** CDI anualizado, como fração. */
  cdi: number;
  /** TR mensal, como fração. */
  tr: number;
  /** IPCA acumulado em 12 meses, como fração. */
  ipca12m: number;
}

export interface PontoEvolucao {
  mes: number;
  poupanca: number;
  cdbBruto: number;
  cdbLiquido: number;
  /** Quanto o valor inicial precisaria valer só para manter o poder de compra. */
  inflacao: number;
}

export interface ResultadoPoupancaCdb {
  regime: RegimePoupanca;
  baseMensalPoupanca: number;
  poupancaMensal: number;
  poupancaAnual: number;
  cdbAnualBruto: number;
  cdbMensalBruto: number;
  aliquotaIr: number;
  saldoFinal: { poupanca: number; cdbBruto: number; cdbLiquido: number; inflacao: number };
  ganhoPoupanca: number;
  ganhoCdbLiquido: number;
  inflacaoNoPeriodo: number;
  retornoRealPoupanca: number;
  retornoRealCdb: number;
  vencedor: 'poupanca' | 'cdb' | 'empate';
  /** Menor múltiplo do CDI com que o CDB líquido ainda empata com a poupança (1 = 100%). */
  multiploCdiDeEmpate: number;
  evolucao: PontoEvolucao[];
}

export const PRAZO_MAXIMO_MESES = 120;

export function validarEntrada(e: EntradaPoupancaCdb): string | null {
  if (!(e.valor > 0)) return 'Informe um valor aplicado maior que zero.';
  if (!Number.isInteger(e.prazoMeses) || e.prazoMeses < 1 || e.prazoMeses > PRAZO_MAXIMO_MESES)
    return `O prazo deve ser um número inteiro de meses entre 1 e ${PRAZO_MAXIMO_MESES}.`;
  if (!(e.multiploCdi > 0)) return 'O percentual do CDI deve ser maior que zero.';
  return null;
}

/** Pré-condição: validarEntrada(e) === null. */
export function calcularPoupancaCdb(e: EntradaPoupancaCdb): ResultadoPoupancaCdb {
  const n = e.prazoMeses;

  // Poupança: isenta de IR; rendimento mensal pela regra legal.
  const poupancaMensal = rendimentoPoupancaMensal(e.selic, e.tr);

  // CDB: "X% do CDI" aplicado à taxa diária, depois convertido em taxa mensal equivalente.
  const cdbAnualBruto = taxaCdbAnual(e.cdi, e.multiploCdi);
  const cdbMensalBruto = anualParaMensal(cdbAnualBruto);

  // IR regressivo pelo prazo (30 dias por mês), cobrado sobre o rendimento no resgate.
  const aliquotaIr = aliquotaIrRegressivo(n * DIAS_POR_MES);

  const inflacaoMensal = anualParaMensal(e.ipca12m);
  const evolucao: PontoEvolucao[] = Array.from({ length: n + 1 }, (_, mes) => {
    const brutoCdb = Math.pow(1 + cdbMensalBruto, mes);
    return {
      mes,
      poupanca: e.valor * Math.pow(1 + poupancaMensal, mes),
      cdbBruto: e.valor * brutoCdb,
      // Se resgatasse neste mês, a alíquota seria a do prazo decorrido.
      cdbLiquido: e.valor * fatorLiquido(brutoCdb, aliquotaIrRegressivo(mes * DIAS_POR_MES)),
      inflacao: e.valor * Math.pow(1 + inflacaoMensal, mes),
    };
  });
  const final = evolucao[n];

  const ganhoPoupanca = final.poupanca - e.valor;
  const ganhoCdbLiquido = final.cdbLiquido - e.valor;
  const inflacaoNoPeriodo = acumular(inflacaoMensal, n);

  // Percentual do CDI de empate: que CDB bruto, depois do IR, rende o mesmo que a poupança?
  const fatorPoupanca = Math.pow(1 + poupancaMensal, n);
  const fatorBrutoEmpate = fatorBrutoNecessario(fatorPoupanca, aliquotaIr);
  const cdbAnualEmpate = Math.pow(fatorBrutoEmpate, 12 / n) - 1;

  const diferenca = ganhoCdbLiquido - ganhoPoupanca;
  return {
    regime: regimePoupanca(e.selic),
    baseMensalPoupanca: baseMensalPoupanca(e.selic),
    poupancaMensal,
    poupancaAnual: mensalParaAnual(poupancaMensal),
    cdbAnualBruto,
    cdbMensalBruto,
    aliquotaIr,
    saldoFinal: final,
    ganhoPoupanca,
    ganhoCdbLiquido,
    inflacaoNoPeriodo,
    retornoRealPoupanca: fisher(final.poupanca / e.valor - 1, inflacaoNoPeriodo),
    retornoRealCdb: fisher(final.cdbLiquido / e.valor - 1, inflacaoNoPeriodo),
    vencedor: Math.abs(diferenca) < 0.005 ? 'empate' : diferenca > 0 ? 'cdb' : 'poupanca',
    multiploCdiDeEmpate: percentualDoCdi(cdbAnualEmpate, e.cdi),
    evolucao,
  };
}
