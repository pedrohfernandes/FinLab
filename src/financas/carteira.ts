/**
 * Retorno e risco de carteiras de ações.
 *
 * Convenção do projeto: toda taxa é uma FRAÇÃO (0,01 = 1%); pesos somam 1.
 *
 * Ref.: Cap. 11 — 11.1 O retorno esperado de uma carteira; 11.2 A volatilidade
 *       de uma carteira; 11.3 (beta de uma carteira).
 */
import { covariancia } from './estatistica';

/**
 * Peso de cada ativo (slide 11.1):  wᵢ = Valor do investimentoᵢ / Valor total da carteira.
 * Recebe os valores investidos e devolve os pesos (somam 1).
 */
export function pesosPorValor(valores: number[]): number[] {
  const total = valores.reduce((s, v) => s + v, 0);
  if (!(total > 0)) throw new Error('o valor total da carteira deve ser positivo');
  return valores.map((v) => v / total);
}

/** Média ponderada genérica: Σ wᵢ·xᵢ. */
function mediaPonderada(pesos: number[], valores: number[]): number {
  if (pesos.length !== valores.length) throw new Error('pesos e valores de tamanhos diferentes');
  return pesos.reduce((s, w, i) => s + w * valores[i], 0);
}

/**
 * Retorno esperado da carteira (slide 11.1): média ponderada dos retornos esperados.
 *   E[R_p] = w₁E[R₁] + w₂E[R₂] + … + wₙE[Rₙ]
 */
export function retornoEsperadoCarteira(pesos: number[], retornosEsperados: number[]): number {
  return mediaPonderada(pesos, retornosEsperados);
}

/**
 * Beta da carteira (slide 11.3): "o beta médio ponderado dos títulos contidos na carteira".
 *   β_p = Σ wᵢ·βᵢ
 */
export function betaCarteira(pesos: number[], betas: number[]): number {
  return mediaPonderada(pesos, betas);
}

/**
 * Variância de uma carteira de DUAS ações, exatamente como no slide 11.2:
 *   Var(R_p) = w₁²SD(R₁)² + w₂²SD(R₂)² + 2·w₁·w₂·Corr(R₁,R₂)·SD(R₁)·SD(R₂)
 *
 * O último termo é o que a diversificação ataca: quanto menor a correlação,
 * menor a variância da carteira.
 */
export function varianciaDuasAcoes(w1: number, w2: number, dp1: number, dp2: number, corr: number): number {
  return w1 * w1 * dp1 * dp1 + w2 * w2 * dp2 * dp2 + 2 * w1 * w2 * corr * dp1 * dp2;
}

/**
 * Matriz de covariâncias: Σᵢⱼ = Cov(Rᵢ, Rⱼ). Na diagonal ficam as variâncias.
 * `series[i]` são os retornos do ativo i, todos no mesmo período.
 */
export function matrizCovariancia(series: number[][]): number[][] {
  const n = series.length;
  const cov = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      // A matriz é simétrica (Cov(a,b) = Cov(b,a)): calcula uma vez e preenche os dois lados.
      cov[i][j] = covariancia(series[i], series[j]);
      cov[j][i] = cov[i][j];
    }
  }
  return cov;
}

/**
 * Variância de uma carteira com n ações — a generalização do slide 11.2:
 *   Var(R_p) = Σᵢ Σⱼ wᵢ·wⱼ·Cov(Rᵢ, Rⱼ)
 * Com n = 2 dá exatamente a fórmula de varianciaDuasAcoes, pois
 * Cov(R₁,R₂) = Corr(R₁,R₂)·SD(R₁)·SD(R₂).
 */
export function varianciaCarteira(pesos: number[], cov: number[][]): number {
  let v = 0;
  for (let i = 0; i < pesos.length; i++) {
    for (let j = 0; j < pesos.length; j++) v += pesos[i] * pesos[j] * cov[i][j];
  }
  return v;
}

/**
 * Variância de uma carteira IGUALMENTE ponderada com k ações "típicas" do grupo,
 * a partir da variância média e da covariância média entre pares:
 *   Var(R_p) = (1/k)·(variância média) + (1 − 1/k)·(covariância média)
 *
 * Quando k cresce, o primeiro termo (risco específico) some e sobra a covariância
 * média — o risco sistemático, que a diversificação não elimina (slide 11.2).
 */
export function varianciaIgualmentePonderada(k: number, varianciaMedia: number, covarianciaMedia: number): number {
  return varianciaMedia / k + (1 - 1 / k) * covarianciaMedia;
}

/** Médias das variâncias (diagonal) e das covariâncias entre pares diferentes (fora da diagonal). */
export function mediasDaMatriz(cov: number[][]): { varianciaMedia: number; covarianciaMedia: number } {
  const n = cov.length;
  let somaVar = 0;
  let somaCov = 0;
  for (let i = 0; i < n; i++) {
    somaVar += cov[i][i];
    for (let j = i + 1; j < n; j++) somaCov += cov[i][j];
  }
  const pares = (n * (n - 1)) / 2;
  return { varianciaMedia: somaVar / n, covarianciaMedia: pares > 0 ? somaCov / pares : 0 };
}

/**
 * Gerador de números pseudoaleatórios com semente (mulberry32). Com a mesma semente,
 * gera sempre a mesma sequência — assim a nuvem de carteiras não muda a cada
 * renderização e o relatório em PDF é reproduzível.
 */
export function geradorAleatorio(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sorteia pesos aleatórios (todos ≥ 0, somando 1), uniformes sobre todas as combinações
 * possíveis: sorteia −ln(u) para cada ativo e normaliza (distribuição de Dirichlet).
 * Normalizar números uniformes simples concentraria as carteiras perto de pesos iguais.
 */
export function pesosAleatorios(n: number, aleatorio: () => number): number[] {
  const brutos = Array.from({ length: n }, () => -Math.log(1 - aleatorio()));
  return pesosPorValor(brutos);
}

export interface PontoCarteira {
  pesos: number[];
  retorno: number;
  volatilidade: number;
}

/**
 * Carteiras aleatórias com os ativos escolhidos (como no gráfico do slide 11.4,
 * "Mean-Variance Efficient Frontier and Random Portfolios"). Cada ponto é uma
 * combinação de pesos; o contorno superior esquerdo da nuvem aproxima a fronteira eficiente.
 *
 * `retornos` e `cov` devem estar na mesma escala de tempo (ex.: ambos anuais).
 */
export function carteirasAleatorias(
  quantidade: number,
  retornos: number[],
  cov: number[][],
  semente = 2026,
): PontoCarteira[] {
  const aleatorio = geradorAleatorio(semente);
  return Array.from({ length: quantidade }, () => {
    const pesos = pesosAleatorios(retornos.length, aleatorio);
    return {
      pesos,
      retorno: retornoEsperadoCarteira(pesos, retornos),
      volatilidade: Math.sqrt(Math.max(0, varianciaCarteira(pesos, cov))),
    };
  });
}
