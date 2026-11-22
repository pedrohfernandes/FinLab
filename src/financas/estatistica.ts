/**
 * Estatística descritiva e regressão linear simples — a base para medir risco
 * (Cap. 11). Implementação própria, sem bibliotecas: cada fórmula fica visível.
 *
 * Convenção: as medidas são AMOSTRAIS (dividem por n − 1), como no Excel
 * (VAR.A, DESVPAD.A, COVARIAÇÃO.S), pois os retornos históricos são uma amostra.
 */

/** Média aritmética: x̄ = Σx / n. */
export function media(x: number[]): number {
  if (x.length === 0) throw new Error('média de uma série vazia');
  return x.reduce((soma, v) => soma + v, 0) / x.length;
}

/**
 * Covariância amostral: mede se duas séries andam juntas.
 *   Cov(x, y) = Σ (xᵢ − x̄)(yᵢ − ȳ) / (n − 1)
 * Positiva: tendem a subir e cair juntas. Negativa: quando uma sobe, a outra tende a cair.
 */
export function covariancia(x: number[], y: number[]): number {
  if (x.length !== y.length) throw new Error('séries de tamanhos diferentes');
  if (x.length < 2) throw new Error('são necessários ao menos 2 pontos');
  const mx = media(x);
  const my = media(y);
  let soma = 0;
  for (let i = 0; i < x.length; i++) soma += (x[i] - mx) * (y[i] - my);
  return soma / (x.length - 1);
}

/** Variância amostral: Var(x) = Cov(x, x) = Σ (xᵢ − x̄)² / (n − 1). */
export function variancia(x: number[]): number {
  return covariancia(x, x);
}

/** Desvio-padrão (volatilidade): SD(x) = √Var(x). Mesma unidade dos retornos. */
export function desvioPadrao(x: number[]): number {
  return Math.sqrt(variancia(x));
}

/**
 * Correlação de Pearson, sempre entre −1 e +1 (Cap. 11.2):
 *   Corr(x, y) = Cov(x, y) / (SD(x)·SD(y))
 * É a covariância "sem unidade": +1 = movem-se em sintonia perfeita;
 * 0 = sem relação linear; −1 = movem-se em sentidos opostos.
 */
export function correlacao(x: number[], y: number[]): number {
  return covariancia(x, y) / (desvioPadrao(x) * desvioPadrao(y));
}

export interface Regressao {
  /** Intercepto (α): valor de y previsto quando x = 0. */
  alfa: number;
  /** Inclinação (β): quanto y varia, em média, para cada 1 de variação em x. */
  beta: number;
  /** Coeficiente de determinação: fração da variância de y explicada por x (0 a 1). */
  r2: number;
  /** Erro padrão de β: a incerteza da estimativa da inclinação. */
  erroPadraoBeta: number;
  /** Erro padrão de α. */
  erroPadraoAlfa: number;
  /** Número de observações. */
  n: number;
}

/**
 * Regressão linear simples por mínimos quadrados ordinários (MQO):
 * encontra a reta y = α + β·x que minimiza a soma dos erros ao quadrado.
 *
 *   β = Cov(x, y) / Var(x)          α = ȳ − β·x̄
 *   R² = 1 − SQE / SQT              (SQE: soma dos erros², SQT: soma total dos desvios² de y)
 *   EP(β) = √[ SQE/(n−2) / Σ(xᵢ − x̄)² ]
 *   EP(α) = √[ SQE/(n−2) · (1/n + x̄² / Σ(xᵢ − x̄)²) ]
 *
 * No Cap. 11.3, x é o retorno em excesso do mercado e y o da ação: β é a
 * inclinação da "linha de melhor ajuste" e mede o risco sistemático.
 */
export function regressaoLinear(x: number[], y: number[]): Regressao {
  const n = x.length;
  if (n !== y.length) throw new Error('séries de tamanhos diferentes');
  if (n < 3) throw new Error('são necessários ao menos 3 pontos');

  const mx = media(x);
  const my = media(y);
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (x[i] - mx) ** 2;
    sxy += (x[i] - mx) * (y[i] - my);
    syy += (y[i] - my) ** 2;
  }
  if (sxx === 0) throw new Error('x não varia: a inclinação é indefinida');

  const beta = sxy / sxx;
  const alfa = my - beta * mx;

  let sqe = 0;
  for (let i = 0; i < n; i++) sqe += (y[i] - alfa - beta * x[i]) ** 2;
  const varianciaResidual = sqe / (n - 2);

  return {
    alfa,
    beta,
    r2: syy === 0 ? 1 : 1 - sqe / syy,
    erroPadraoBeta: Math.sqrt(varianciaResidual / sxx),
    erroPadraoAlfa: Math.sqrt(varianciaResidual * (1 / n + (mx * mx) / sxx)),
    n,
  };
}
