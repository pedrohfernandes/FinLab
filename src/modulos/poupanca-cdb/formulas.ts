/**
 * Fórmulas da aba Fórmulas do Módulo 0, em LaTeX e já com os números da simulação.
 */
import type { PassoFormula } from "../../componentes/Formula";
import {
  brlTex,
  numeroTex,
  percentual,
  percentualTex,
} from "../../utils/formatacao";
import type { EntradaPoupancaCdb, ResultadoPoupancaCdb } from "./calculo";

/** Fórmulas do módulo, já com os números usados na simulação. */
export function formulasPoupancaCdb(
  e: EntradaPoupancaCdb,
  r: ResultadoPoupancaCdb,
): PassoFormula[] {
  const n = e.prazoMeses;
  const v = brlTex(e.valor);
  const base =
    r.regime === "selic-alta"
      ? {
          descricao: `A Selic (${percentual(e.selic)}) está acima de 8,5% ao ano, então a poupança rende 0,5% ao mês mais a TR, compostos:`,
          tex: `p = (1 + 0{,}5\\%)\\,(1 + ${percentualTex(e.tr, 4)}) - 1 = ${percentualTex(r.poupancaMensal, 4)}\\ \\text{a.m.}`,
        }
      : {
          descricao: `A Selic (${percentual(e.selic)}) está em 8,5% ao ano ou menos, então a poupança rende 70% da Selic (convertida em taxa mensal equivalente) mais a TR:`,
          tex: `p = \\left[(1 + 0{,}7\\cdot ${percentualTex(e.selic)})^{1/12}\\right]\\,(1 + ${percentualTex(e.tr, 4)}) - 1 = ${percentualTex(r.poupancaMensal, 4)}\\ \\text{a.m.}`,
        };

  return [
    base,
    {
      descricao:
        "CDB que paga X% do CDI: o percentual incide sobre a taxa DIÁRIA do CDI (252 dias úteis por ano), e depois voltamos à taxa anual e à mensal equivalente:",
      tex: `d = (1+${percentualTex(e.cdi)})^{1/252}-1 \\;\\Rightarrow\\; i_a = (1 + ${numeroTex(e.multiploCdi * 100, 1)}\\%\\cdot d)^{252}-1 = ${percentualTex(r.cdbAnualBruto)} \\;\\Rightarrow\\; i_m = (1+i_a)^{1/12}-1 = ${percentualTex(r.cdbMensalBruto, 4)}`,
    },
    {
      descricao: `Saldo bruto depois de ${n} meses, por juros compostos:`,
      tex: `S_{poup} = ${v}\\cdot(1+${percentualTex(r.poupancaMensal, 4)})^{${n}} = ${brlTex(r.saldoFinal.poupanca)} \\qquad S_{CDB}^{bruto} = ${v}\\cdot(1+${percentualTex(r.cdbMensalBruto, 4)})^{${n}} = ${brlTex(r.saldoFinal.cdbBruto)}`,
    },
    {
      descricao: `O Imposto de Renda do CDB (alíquota de ${percentual(r.aliquotaIr, 1)} para ${n * 30} dias) incide só sobre o rendimento:`,
      tex: `S_{CDB}^{liq} = V + (S_{CDB}^{bruto} - V)(1 - ${percentualTex(r.aliquotaIr, 1)}) = ${brlTex(r.saldoFinal.cdbLiquido)}`,
    },
    {
      descricao:
        "Para saber o ganho de verdade, descontamos a inflação do período pela equação de Fisher (não é uma simples subtração):",
      tex: `r_{real} = \\frac{1+r_{nominal}}{1+\\pi} - 1 \\quad\\Rightarrow\\quad CDB:\\ \\frac{1+${percentualTex(r.saldoFinal.cdbLiquido / e.valor - 1)}}{1+${percentualTex(r.inflacaoNoPeriodo)}} - 1 = ${percentualTex(r.retornoRealCdb)}`,
    },
    {
      descricao:
        "Percentual do CDI de empate: o CDB bruto que, depois do IR, rende o mesmo que a poupança:",
      tex: `F_b = 1 + \\frac{F_{poup}-1}{1-IR} \\;\\Rightarrow\\; i_a = F_b^{12/${n}} - 1 \\;\\Rightarrow\\; X^* = \\frac{(1+i_a)^{1/252}-1}{(1+CDI)^{1/252}-1} = ${numeroTex(r.multiploCdiDeEmpate * 100, 1)}\\%\\text{ do CDI}`,
    },
  ];
}
