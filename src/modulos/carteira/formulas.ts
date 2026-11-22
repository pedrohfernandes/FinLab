/**
 * Fórmulas da aba Fórmulas do Módulo 4, em LaTeX e já com os números da simulação.
 */
import type { PassoFormula } from '../../componentes/Formula';
import { numeroTex, percentualTex } from '../../utils/formatacao';
import type { EntradaCarteira, ResultadoCarteira } from './calculo';

/** "0{,}20\cdot 12{,}5\% + 0{,}80\cdot 9{,}1\%" — soma ponderada escrita por extenso. */
const somaPonderada = (pesos: number[], valores: string[]) => pesos.map((w, i) => `${numeroTex(w)}\\cdot ${valores[i]}`).join(' + ');

export function formulasCarteira(e: EntradaCarteira, r: ResultadoCarteira): PassoFormula[] {
  const a = r.ativos;
  const passos: PassoFormula[] = [
    {
      descricao: 'Peso de cada ação: a fração do valor total da carteira aplicada nela (slide 11.1). Os pesos somam 1:',
      tex: a.map((x) => `w_{\\text{${x.ticker}}} = ${numeroTex(x.peso)}`).join(',\\ '),
    },
    {
      descricao:
        e.base === 'capm'
          ? 'Retorno esperado de cada ação pelo CAPM (Módulo 3), e o da carteira como média ponderada (slide 11.1):'
          : 'Retorno esperado de cada ação pela média histórica anualizada, e o da carteira como média ponderada (slide 11.1):',
      tex: `E[R_p] = \\sum w_i\\,E[R_i] = ${somaPonderada(
        a.map((x) => x.peso),
        a.map((x) => percentualTex(x.retornoEsperado, 1)),
      )} = ${percentualTex(r.carteira.retornoEsperado)}`,
    },
    {
      descricao: 'Beta da carteira: a média ponderada dos betas (slide 11.3):',
      tex: `\\beta_p = \\sum w_i\\,\\beta_i = ${somaPonderada(
        a.map((x) => x.peso),
        a.map((x) => numeroTex(x.beta)),
      )} = ${numeroTex(r.carteira.beta)}`,
    },
  ];

  if (a.length === 2) {
    const [x, y] = a;
    passos.push({
      descricao: 'Variância de uma carteira com duas ações, como no slide 11.2:',
      tex: `\\operatorname{Var}(R_p) = w_1^2 SD(R_1)^2 + w_2^2 SD(R_2)^2 + 2 w_1 w_2 \\operatorname{Corr}(R_1,R_2) SD(R_1) SD(R_2) = ${numeroTex(x.peso)}^2\\cdot ${percentualTex(x.volatilidade, 1)}^2 + ${numeroTex(y.peso)}^2\\cdot ${percentualTex(y.volatilidade, 1)}^2 + 2\\cdot${numeroTex(x.peso)}\\cdot${numeroTex(y.peso)}\\cdot${numeroTex(r.correlacoes[0][1])}\\cdot${percentualTex(x.volatilidade, 1)}\\cdot${percentualTex(y.volatilidade, 1)}`,
    });
  } else if (a.length > 2) {
    passos.push({
      descricao: `Variância de uma carteira com ${a.length} ações: a fórmula do slide 11.2 generalizada, somando todos os pares (cada par entra com sua covariância):`,
      tex: `\\operatorname{Var}(R_p) = \\sum_i \\sum_j w_i\\,w_j\\,\\operatorname{Cov}(R_i,R_j) = \\sum_i \\sum_j w_i\\,w_j\\,\\operatorname{Corr}(R_i,R_j)\\,SD(R_i)\\,SD(R_j)`,
    });
  }

  passos.push({
    descricao:
      'Volatilidade da carteira, comparada com a média ponderada das volatilidades (que seria a volatilidade se todas as correlações fossem 1, isto é, sem nenhum ganho de diversificação):',
    tex: `SD(R_p) = \\sqrt{\\operatorname{Var}(R_p)} = ${percentualTex(r.carteira.volatilidade)} \\quad<\\quad \\sum w_i\\,SD(R_i) = ${percentualTex(r.carteira.volatilidadeSemDiversificacao)}`,
  });

  if (r.pisoDiversificacao !== null) {
    passos.push({
      descricao:
        'Carteira igualmente ponderada com n ações típicas do grupo: o 1º termo (risco específico) encolhe com n; o 2º (covariância média, risco comum) permanece:',
      tex: `\\operatorname{Var}(R_p) = \\frac{1}{n}\\,\\overline{\\operatorname{Var}} + \\left(1 - \\frac{1}{n}\\right)\\overline{\\operatorname{Cov}} \\quad\\xrightarrow{\\;n\\to\\infty\\;}\\quad \\overline{\\operatorname{Cov}} \\;\\Rightarrow\\; SD \\to ${percentualTex(r.pisoDiversificacao, 1)}`,
    });
  }

  passos.push({
    descricao: 'As medidas são anuais: a covariância mensal é multiplicada por 12 e a volatilidade por √12.',
    tex: `\\operatorname{Cov}_{anual} = 12\\cdot\\operatorname{Cov}_{mensal} \\qquad SD_{anual} = \\sqrt{12}\\cdot SD_{mensal}`,
  });
  return passos;
}
