/**
 * Casos de referência do Trabalho 2 (Cap. 11 — risco, beta, CAPM e carteiras).
 *
 * Os valores esperados vêm de (a) contas feitas à mão em séries pequenas e
 * (b) identidades que precisam valer, como "o beta da carteira é a média
 * ponderada dos betas" (slide 11.3) e "a fórmula de 2 ações do slide 11.2 é
 * um caso particular da fórmula geral".
 */
import { describe, expect, it } from 'vitest';
import { anualizarRetorno, anualizarVolatilidade, estimarBeta, perfilBeta, retornoCapm, retornosEmExcesso, retornosSimples } from '../capm';
import {
  betaCarteira,
  carteirasAleatorias,
  geradorAleatorio,
  matrizCovariancia,
  mediasDaMatriz,
  pesosAleatorios,
  pesosPorValor,
  retornoEsperadoCarteira,
  varianciaCarteira,
  varianciaDuasAcoes,
  varianciaIgualmentePonderada,
} from '../carteira';
import { correlacao, covariancia, desvioPadrao, media, regressaoLinear, variancia } from '../estatistica';
import { ErroCsv, lerPrecosCsv } from '../../utils/csvLeitura';
import { trechoEmComum } from '../../modulos/beta-capm/calculo';

/** Série de "retornos" pseudoaleatórios reproduzível, para testar identidades. */
function serie(semente: number, n = 60): number[] {
  const aleatorio = geradorAleatorio(semente);
  return Array.from({ length: n }, () => (aleatorio() - 0.5) * 0.2);
}

describe('estatística', () => {
  it('média, variância e desvio-padrão amostrais (divisor n − 1)', () => {
    const x = [2, 4, 4, 4, 5, 5, 7, 9];
    expect(media(x)).toBe(5);
    expect(variancia(x)).toBeCloseTo(32 / 7, 12);
    expect(desvioPadrao(x)).toBeCloseTo(Math.sqrt(32 / 7), 12);
  });

  it('correlação fica entre −1 e +1 e é ±1 para relações lineares exatas', () => {
    const x = [1, 2, 3, 4, 5];
    expect(correlacao(x, x.map((v) => 3 * v + 1))).toBeCloseTo(1, 12);
    expect(correlacao(x, x.map((v) => -2 * v))).toBeCloseTo(-1, 12);
    const c = correlacao(serie(1), serie(2));
    expect(c).toBeGreaterThan(-1);
    expect(c).toBeLessThan(1);
  });

  it('regressão linear conferida à mão', () => {
    // x̄ = 3, ȳ = 4, Σ(x−x̄)² = 10, Σ(x−x̄)(y−ȳ) = 6 ⇒ β = 0,6; α = 4 − 0,6·3 = 2,2
    // Erros: −0,8; 0,6; 1; −0,6; −0,2 ⇒ SQE = 2,4; SQT = 6 ⇒ R² = 0,6
    const r = regressaoLinear([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
    expect(r.beta).toBeCloseTo(0.6, 12);
    expect(r.alfa).toBeCloseTo(2.2, 12);
    expect(r.r2).toBeCloseTo(0.6, 12);
    expect(r.erroPadraoBeta).toBeCloseTo(Math.sqrt(2.4 / 3 / 10), 12);
    expect(r.erroPadraoAlfa).toBeCloseTo(Math.sqrt(0.8 * (1 / 5 + 9 / 10)), 12);
  });

  it('β da regressão = Cov(x, y) / Var(x)', () => {
    const x = serie(3);
    const y = serie(4).map((e, i) => 0.001 + 1.3 * x[i] + e);
    expect(regressaoLinear(x, y).beta).toBeCloseTo(covariancia(x, y) / variancia(x), 12);
  });
});

describe('CAPM e beta', () => {
  it('retornos simples a partir de preços', () => {
    const r = retornosSimples([100, 110, 99]);
    expect(r[0]).toBeCloseTo(0.1, 12);
    expect(r[1]).toBeCloseTo(-0.1, 12);
    expect(() => retornosSimples([0, 10])).toThrow();
  });

  it('recupera o beta de uma ação construída como 1,5 × mercado', () => {
    const mercado = serie(5);
    const rf = mercado.map(() => 0.01);
    // Rᵢ − r_f = 0 + 1,5·(R_m − r_f), sem ruído: β = 1,5, α = 0 e R² = 1.
    const acao = mercado.map((rm) => 0.01 + 1.5 * (rm - 0.01));
    const r = estimarBeta(acao, mercado, rf);
    expect(r.beta).toBeCloseTo(1.5, 10);
    expect(r.alfa).toBeCloseTo(0, 10);
    expect(r.r2).toBeCloseTo(1, 10);
    expect(retornosEmExcesso([0.05], [0.01])[0]).toBeCloseTo(0.04, 12);
  });

  it('SML: E[Rᵢ] = r_f + β(E[R_m] − r_f)', () => {
    expect(retornoCapm(0.14, 1.2, 0.06)).toBeCloseTo(0.212, 12);
    expect(retornoCapm(0.14, 0, 0.06)).toBe(0.14); // β = 0: só a taxa livre de risco
    expect(retornoCapm(0.14, 1, 0.06)).toBeCloseTo(0.2, 12); // β = 1: o retorno do mercado
  });

  it('anualização: taxa equivalente e volatilidade × √12', () => {
    expect(anualizarRetorno(0.01)).toBeCloseTo(0.126825, 6);
    expect(anualizarVolatilidade(0.05)).toBeCloseTo(0.05 * Math.sqrt(12), 12);
  });

  it('perfil do beta', () => {
    expect(perfilBeta(0.5)).toBe('defensiva');
    expect(perfilBeta(1)).toBe('neutra');
    expect(perfilBeta(1.8)).toBe('agressiva');
  });
});

describe('carteiras', () => {
  it('pesos pelo valor investido (slide 11.1)', () => {
    const w = pesosPorValor([3000, 7000]);
    expect(w[0]).toBeCloseTo(0.3, 12);
    expect(w[1]).toBeCloseTo(0.7, 12);
  });

  it('retorno esperado e beta da carteira são médias ponderadas', () => {
    expect(retornoEsperadoCarteira([0.5, 0.5], [0.1, 0.2])).toBeCloseTo(0.15, 12);
    expect(betaCarteira([0.25, 0.75], [0.8, 1.6])).toBeCloseTo(1.4, 12);
  });

  it('fórmula de 2 ações do slide 11.2 = fórmula geral com a matriz de covariâncias', () => {
    const a = serie(6);
    const b = serie(7);
    const w = [0.4, 0.6];
    const viaSlide = varianciaDuasAcoes(w[0], w[1], desvioPadrao(a), desvioPadrao(b), correlacao(a, b));
    const viaMatriz = varianciaCarteira(w, matrizCovariancia([a, b]));
    expect(viaMatriz).toBeCloseTo(viaSlide, 14);
    // E é igual à variância da série de retornos da carteira, mês a mês.
    expect(variancia(a.map((ra, i) => w[0] * ra + w[1] * b[i]))).toBeCloseTo(viaSlide, 14);
  });

  it('quanto menor a correlação, menor a variância da carteira', () => {
    const v = (corr: number) => varianciaDuasAcoes(0.5, 0.5, 0.3, 0.3, corr);
    expect(v(1)).toBeCloseTo(0.09, 12); // correlação 1: nenhuma diversificação
    expect(v(0)).toBeLessThan(v(1));
    expect(v(-1)).toBeCloseTo(0, 12); // correlação −1: risco eliminado
  });

  it('beta da série da carteira = média ponderada dos betas (slide 11.3)', () => {
    const mercado = serie(8);
    const rf = mercado.map(() => 0.008);
    const acoes = [serie(9), serie(10), serie(11)].map((ruido, k) => mercado.map((rm, i) => 0.5 * (k + 1) * rm + ruido[i]));
    const w = [0.2, 0.3, 0.5];
    const betas = acoes.map((r) => estimarBeta(r, mercado, rf).beta);
    const serieCarteira = mercado.map((_, i) => acoes.reduce((s, r, k) => s + w[k] * r[i], 0));
    expect(estimarBeta(serieCarteira, mercado, rf).beta).toBeCloseTo(betaCarteira(w, betas), 12);
  });

  it('fórmula da carteira igualmente ponderada coincide com a fórmula geral', () => {
    const cov = matrizCovariancia([serie(12), serie(13), serie(14), serie(15)]);
    const { varianciaMedia, covarianciaMedia } = mediasDaMatriz(cov);
    expect(varianciaIgualmentePonderada(4, varianciaMedia, covarianciaMedia)).toBeCloseTo(varianciaCarteira([0.25, 0.25, 0.25, 0.25], cov), 14);
    expect(varianciaIgualmentePonderada(1, varianciaMedia, covarianciaMedia)).toBeCloseTo(varianciaMedia, 14);
  });

  it('pesos aleatórios são não negativos e somam 1; a nuvem é reproduzível', () => {
    const w = pesosAleatorios(5, geradorAleatorio(1));
    expect(w.every((x) => x >= 0)).toBe(true);
    expect(w.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
    const cov = matrizCovariancia([serie(16), serie(17)]);
    const a = carteirasAleatorias(50, [0.1, 0.2], cov, 7);
    const b = carteirasAleatorias(50, [0.1, 0.2], cov, 7);
    expect(a).toEqual(b);
  });
});

describe('alinhamento do CSV com as cotações', () => {
  const meses = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

  it('usa o trecho contínuo mais recente em comum', () => {
    expect(trechoEmComum(meses, new Set(meses))).toEqual([0, 4]);
    // Falta agosto: fica só o trecho setembro–outubro.
    expect(trechoEmComum(meses, new Set(['2026-06', '2026-07', '2026-09', '2026-10']))).toEqual([3, 4]);
    // CSV termina antes das cotações.
    expect(trechoEmComum(meses, new Set(['2026-05', '2026-06', '2026-07']))).toEqual([0, 1]);
  });

  it('sem dois meses seguidos em comum, não há trecho', () => {
    expect(trechoEmComum(meses, new Set(['2025-01', '2025-02']))).toBeNull();
    expect(trechoEmComum(meses, new Set(['2026-10']))).toBeNull();
  });
});

describe('leitura de CSV de preços', () => {
  it('formato do Excel em português, com um preço por mês (o último)', () => {
    const csv = 'data;preco\n02/10/2026;10,00\n31/10/2026;11,00\n28/11/2026;1.234,50\n';
    expect(lerPrecosCsv(csv)).toEqual([
      { mes: '2026-10', preco: 11 },
      { mes: '2026-11', preco: 1234.5 },
    ]);
  });

  it('exportação do Yahoo: usa a coluna Adj Close e ignora linhas sem preço', () => {
    const csv = 'Date,Open,High,Low,Close,Adj Close,Volume\n2026-09-01,10,11,9,10.5,10.2,100\n2026-10-01,null,null,null,null,null,null\n2026-10-01,11,12,10,11.5,11.1,100';
    expect(lerPrecosCsv(csv)).toEqual([
      { mes: '2026-09', preco: 10.2 },
      { mes: '2026-10', preco: 11.1 },
    ]);
  });

  it('sem cabeçalho e fora de ordem', () => {
    expect(lerPrecosCsv('2026-11-30,12\n2026-10-31,10\n2026-10-15,9').map((p) => p.preco)).toEqual([10, 12]);
  });

  it('mensagens de erro em português', () => {
    expect(() => lerPrecosCsv('')).toThrow(ErroCsv);
    expect(() => lerPrecosCsv('data;preco\nontem;10')).toThrow(/data não reconhecida/);
    expect(() => lerPrecosCsv('data;preco\n01/10/2026;10')).toThrow(/dois meses/);
  });
});
