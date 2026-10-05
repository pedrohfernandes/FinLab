import type { PassoFormula } from '../../componentes/Formula';
import { brlTex, numeroBr, numeroTex, percentual, percentualTex } from '../../utils/formatacao';
import type { EntradaAvistaParcelado, ResultadoAvistaParcelado } from './calculo';

/** Fórmulas do módulo, já com os números informados pelo usuário. */
export function formulasAvistaParcelado(e: EntradaAvistaParcelado, r: ResultadoAvistaParcelado): PassoFormula[] {
  const n = e.parcelas;
  const expoente = e.antecipada ? 't-1' : 't';
  const fechada = e.antecipada
    ? `PMT\\cdot\\frac{1-(1+i)^{-n}}{i}\\cdot(1+i)`
    : `PMT\\cdot\\frac{1-(1+i)^{-n}}{i}`;
  const m = numeroTex(r.prazoMedioMeses, 1);
  const rend = percentualTex(e.rendimentoBrutoAnual);
  const ir = percentualTex(r.aliquotaIr, 1);
  const rl = percentualTex(r.taxaLiquidaMensal, 4);

  return [
    {
      descricao: 'O preço à vista é o valor presente das parcelas, descontadas pela taxa de juros embutida i:',
      tex: `${brlTex(e.precoAvista)} = \\sum_{t=1}^{${n}} \\frac{${brlTex(e.valorParcela)}}{(1+i)^{${expoente}}}`,
    },
    {
      descricao: 'As parcelas formam uma progressão geométrica de razão 1/(1+i). Somando a PG, a série vira uma fórmula fechada:',
      tex: `VP = ${fechada}`,
    },
    {
      descricao: 'Não há como isolar i nessa equação. Por isso usamos o método de Newton-Raphson, que melhora a estimativa a cada passo:',
      tex: `i_{k+1} = i_k - \\frac{f(i_k)}{f'(i_k)}, \\quad f(i) = VP(i) - ${brlTex(e.precoAvista)}`,
    },
    {
      descricao: 'Resultado: a taxa embutida no parcelamento, ao mês e convertida para o ano (taxa equivalente):',
      tex: `i \\approx ${percentualTex(r.taxaImplicita, 4)}\\ \\text{a.m.} \\quad\\Rightarrow\\quad (1+i)^{12}-1 \\approx ${percentualTex(r.taxaImplicitaAnual)}\\ \\text{a.a.}`,
    },
    {
      descricao: `Quanto a sua aplicação rende por mês, já descontado o IR (prazo médio de ${numeroBr(r.prazoMedioMeses, 1)} meses, alíquota de ${percentual(r.aliquotaIr, 1)}):`,
      tex: `r = \\left[\\,1 + \\left((1+${rend})^{${m}/12}-1\\right)(1-${ir})\\,\\right]^{1/${m}} - 1 = ${rl}\\ \\text{a.m.}`,
    },
    {
      descricao: 'Valor das parcelas em reais de hoje, descontadas pela taxa líquida da sua aplicação:',
      tex: `VP = ${brlTex(e.valorParcela)}\\cdot\\frac{1-(1+${rl})^{-${n}}}{${rl}}${e.antecipada ? `\\cdot(1+${rl})` : ''} = ${brlTex(r.vpParcelas)}`,
    },
  ];
}
