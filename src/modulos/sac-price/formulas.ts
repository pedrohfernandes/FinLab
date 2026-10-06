/**
 * Fórmulas da aba Fórmulas do Módulo 2, em LaTeX e já com os números da simulação.
 */
import type { PassoFormula } from "../../componentes/Formula";
import { pmtPrice } from "../../financas/amortizacao";
import { anualParaMensal } from "../../financas/taxas";
import { brlTex, percentualTex } from "../../utils/formatacao";
import type { EntradaSacPrice, ResultadoSacPrice } from "./calculo";

/** Fórmulas do módulo, já com os números informados pelo usuário. */
export function formulasSacPrice(
  e: EntradaSacPrice,
  r: ResultadoSacPrice,
): PassoFormula[] {
  const pv = brlTex(e.principal);
  const n = e.prazo;
  const i = percentualTex(r.taxaMensal, 4);
  const amort = e.principal / n;
  const pmt = pmtPrice(e.principal, r.taxaMensal, n);

  const conversao: PassoFormula[] =
    e.tipoTaxa === "anual-efetiva"
      ? [
          {
            descricao:
              "A taxa foi informada ao ano, na forma efetiva. Convertemos para o mês pela taxa equivalente (juros compostos):",
            tex: `i = (1+${percentualTex(e.taxa)})^{1/12} - 1 = ${i}\\ \\text{a.m.}`,
          },
        ]
      : e.tipoTaxa === "anual-nominal"
        ? [
            {
              descricao:
                "A taxa foi informada ao ano, na forma nominal. Convertemos para o mês dividindo por 12 (taxa proporcional, como nos exemplos do Cap. 5):",
              tex: `i = \\frac{${percentualTex(e.taxa)}}{12} = ${i}\\ \\text{a.m.}`,
            },
          ]
        : [];

  return [
    ...conversao,
    {
      descricao:
        "SAC: a amortização é a mesma todo mês. Os juros incidem sobre o saldo devedor, que diminui, então a parcela diminui (uma progressão aritmética):",
      tex: `A = \\frac{PV}{n} = \\frac{${pv}}{${n}} = ${brlTex(amort)} \\qquad P_t = A + i\\cdot SD_{t-1} \\qquad \\text{razão da PA} = -i\\cdot A = -${brlTex(r.taxaMensal * amort)}`,
    },
    {
      descricao: "Soma dos juros do SAC (soma da PA):",
      tex: `J_{SAC} = i\\cdot PV\\cdot\\frac{n+1}{2} = ${i}\\cdot ${pv}\\cdot\\frac{${n}+1}{2} = ${brlTex(r.jurosSac)}`,
    },
    {
      descricao:
        "Price: a parcela é fixa. O valor financiado é o valor presente das n parcelas iguais (soma de uma PG de razão 1/(1+i)); isolando a parcela:",
      tex: `PV = PMT\\cdot\\frac{1-(1+i)^{-n}}{i} \\;\\Rightarrow\\; PMT = \\frac{${pv}\\cdot ${i}}{1-(1+${i})^{-${n}}} = ${brlTex(pmt)}`,
    },
    {
      descricao:
        "Juros totais da Price: tudo o que se paga acima do valor emprestado.",
      tex: `J_{Price} = n\\cdot PMT - PV = ${n}\\cdot ${brlTex(pmt)} - ${pv} = ${brlTex(r.jurosPrice)}`,
    },
    {
      descricao:
        "Equivalência: descontadas pela taxa do próprio contrato, as parcelas dos dois sistemas valem exatamente o valor emprestado.",
      tex: `\\sum_{t=1}^{n}\\frac{P^{SAC}_t}{(1+i)^t} = \\sum_{t=1}^{n}\\frac{PMT}{(1+i)^t} = PV = ${pv}`,
    },
    {
      descricao:
        "Ao seu custo de oportunidade, o desconto muda e os dois sistemas deixam de ser equivalentes:",
      tex: `r = (1+${percentualTex(e.custoOportunidadeAnual)})^{1/12}-1 = ${percentualTex(anualParaMensal(e.custoOportunidadeAnual), 4)}\\ \\text{a.m.} \\;\\Rightarrow\\; VP_{SAC} = ${brlTex(r.vpSacNaOportunidade)},\\ VP_{Price} = ${brlTex(r.vpPriceNaOportunidade)}`,
    },
    {
      descricao:
        'Diferença entre as parcelas iniciais (por que a Price "cabe" mais fácil no orçamento do começo):',
      tex: `P_1^{SAC} - PMT = ${brlTex(r.sac[0].parcela)} - ${brlTex(pmt)} = ${brlTex(r.sac[0].parcela - pmt)}`,
    },
  ];
}
