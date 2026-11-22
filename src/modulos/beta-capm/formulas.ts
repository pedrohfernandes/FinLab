/**
 * Fórmulas da aba Fórmulas do Módulo 3, em LaTeX e já com os números da simulação.
 */
import type { PassoFormula } from '../../componentes/Formula';
import { numeroTex, percentualTex } from '../../utils/formatacao';
import type { EntradaBetaCapm, ResultadoBetaCapm } from './calculo';

export function formulasBetaCapm(e: EntradaBetaCapm, r: ResultadoBetaCapm, nomeAcao: string): PassoFormula[] {
  const reg = r.regressao;
  const exemplo = r.pontos[r.pontos.length - 1];
  return [
    {
      descricao: `Retorno de cada mês a partir dos preços ajustados por proventos. No último mês (${exemplo.mes}), por exemplo:`,
      tex: `R_t = \\frac{P_t}{P_{t-1}} - 1 \\quad\\Rightarrow\\quad R_{${nomeAcao}} = ${percentualTex(exemplo.retornoAcao)},\\quad R_m = ${percentualTex(exemplo.retornoMercado)}`,
    },
    {
      descricao: 'Retorno em excesso: o que sobrou acima do CDI do mesmo mês (a remuneração por ter corrido risco):',
      tex: `R_i - r_f = ${percentualTex(exemplo.retornoAcao)} - ${percentualTex(exemplo.livreDeRisco)} = ${percentualTex(exemplo.excessoAcao)} \\qquad R_m - r_f = ${percentualTex(exemplo.excessoMercado)}`,
    },
    {
      descricao: `Regressão linear dos ${reg.n} retornos em excesso da ação contra os do mercado (slide 11.3). O beta é a inclinação da reta:`,
      tex: `R_i - r_f = \\alpha + \\beta\\,(R_m - r_f) + \\varepsilon \\qquad \\beta = \\frac{\\operatorname{Cov}(R_i, R_m)}{\\operatorname{Var}(R_m)} = ${numeroTex(reg.beta)} \\qquad \\alpha = ${percentualTex(reg.alfa)}\\ \\text{a.m.}`,
    },
    {
      descricao: 'Incerteza da estimativa: com cerca de 95% de confiança, o beta verdadeiro está a até 2 erros padrão do estimado:',
      tex: `\\beta \\pm 2\\,EP(\\beta) = ${numeroTex(reg.beta)} \\pm 2\\cdot${numeroTex(reg.erroPadraoBeta)} \\;\\Rightarrow\\; [${numeroTex(r.intervaloBeta[0])};\\ ${numeroTex(r.intervaloBeta[1])}]`,
    },
    {
      descricao:
        'Decomposição do risco: a variância do retorno em excesso da ação se divide entre a parte que vem do mercado (sistemática) e a parte própria da empresa (específica). A fração sistemática é o R² da regressão:',
      tex: `\\underbrace{\\operatorname{Var}(R_i - r_f)}_{\\text{total}} = \\underbrace{\\beta^2\\operatorname{Var}(R_m - r_f)}_{\\text{sistemático: } ${numeroTex(r.risco.sistematico * 100, 0)}\\%} + \\underbrace{\\operatorname{Var}(\\varepsilon)}_{\\text{específico: } ${numeroTex(r.risco.especifico * 100, 0)}\\%}`,
    },
    {
      descricao: 'CAPM — Linha do Mercado de Títulos (slide 11.4), com a taxa livre de risco de hoje e o prêmio de mercado esperado:',
      tex: `E[R_i] = r_f + \\beta\\,(E[R_{Mkt}] - r_f) = ${percentualTex(e.livreDeRiscoAtual)} + ${numeroTex(reg.beta)}\\cdot ${percentualTex(e.premioMercado)} = ${percentualTex(r.retornoExigido)}\\ \\text{a.a.}`,
    },
    {
      descricao: 'Para comparar com taxas anuais, as médias mensais viram taxas anuais equivalentes e a volatilidade é multiplicada por √12:',
      tex: `\\bar R_{anual} = (1 + \\bar R_{mensal})^{12} - 1 = ${percentualTex(r.historico.retornoAcao)} \\qquad \\sigma_{anual} = \\sigma_{mensal}\\sqrt{12} = ${percentualTex(r.historico.volatilidadeAcao)}`,
    },
  ];
}
