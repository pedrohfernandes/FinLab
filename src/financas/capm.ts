/**
 * Risco sistemático, beta e CAPM.
 *
 * Convenção do projeto: toda taxa é uma FRAÇÃO (0,01 = 1%).
 *
 * Ref.: Cap. 11 — Risco Sistemático e Prêmio de Risco em Ações
 *       (11.3 Medindo o risco sistemático; 11.4 O CAPM).
 */
import { regressaoLinear, type Regressao } from './estatistica';

/**
 * Retornos simples período a período a partir de uma série de preços:
 *   Rₜ = Pₜ / Pₜ₋₁ − 1
 * Com preços ajustados por proventos, é o retorno total (variação + dividendos).
 * n preços geram n − 1 retornos.
 */
export function retornosSimples(precos: number[]): number[] {
  const retornos: number[] = [];
  for (let t = 1; t < precos.length; t++) {
    if (!(precos[t - 1] > 0)) throw new Error(`preço inválido na posição ${t - 1}`);
    retornos.push(precos[t] / precos[t - 1] - 1);
  }
  return retornos;
}

/**
 * Retorno em excesso: quanto o ativo rendeu ACIMA da taxa livre de risco no mesmo período.
 *   Rᵢ − r_f
 * É o que remunera o risco: ninguém precisa correr risco para ganhar r_f.
 */
export function retornosEmExcesso(retornos: number[], livreDeRisco: number[]): number[] {
  if (retornos.length !== livreDeRisco.length) throw new Error('séries de tamanhos diferentes');
  return retornos.map((r, i) => r - livreDeRisco[i]);
}

/**
 * Estima o beta pela regressão dos retornos em excesso da ação contra os do mercado
 * (slide 11.3: "toma-se como variável dependente (Rᵢ − R_f) e como variável
 * independente (R_m − R_f)"):
 *   Rᵢ − r_f = α + β·(R_m − r_f) + ε
 *
 * O β é a inclinação da reta: a variação percentual esperada no retorno da ação
 * para cada 1% de variação no retorno do mercado. Equivale a Cov(Rᵢ, R_m) / Var(R_m).
 *
 * O R² da regressão é a parcela da variância da ação explicada pelo mercado, isto é,
 * a fração SISTEMÁTICA do risco; 1 − R² é a fração específica (diversificável).
 */
export function estimarBeta(retornosAcao: number[], retornosMercado: number[], livreDeRisco: number[]): Regressao {
  return regressaoLinear(retornosEmExcesso(retornosMercado, livreDeRisco), retornosEmExcesso(retornosAcao, livreDeRisco));
}

/**
 * Retorno esperado (ou exigido) pelo CAPM — a Linha do Mercado de Títulos (SML), Cap. 11.4:
 *   E[Rᵢ] = r_f + βᵢ · (E[R_Mkt] − r_f)
 *
 * O prêmio de risco do ativo é o prêmio do mercado multiplicado pelo seu beta:
 * só o risco sistemático é remunerado, porque o específico pode ser eliminado
 * de graça pela diversificação.
 *
 * Ex.: capm(0,14; 1,2; 0,06) = 0,14 + 1,2·0,06 = 0,212
 */
export function retornoCapm(livreDeRisco: number, beta: number, premioMercado: number): number {
  return livreDeRisco + beta * premioMercado;
}

/**
 * Média de retornos mensais → taxa anual EQUIVALENTE (juros compostos, como no Cap. 5):
 *   anual = (1 + média mensal)^12 − 1
 */
export function anualizarRetorno(mediaMensal: number): number {
  return Math.pow(1 + mediaMensal, 12) - 1;
}

/**
 * Volatilidade mensal → anual. Supondo retornos mensais independentes, as variâncias
 * se somam ao longo dos 12 meses: Var_anual = 12·Var_mensal  ⇒  SD_anual = SD_mensal·√12.
 */
export function anualizarVolatilidade(desvioMensal: number): number {
  return desvioMensal * Math.sqrt(12);
}

/** Intervalo de aproximadamente 95% de confiança para o beta: β ± 2·EP(β). */
export function intervaloBeta(r: Regressao): [number, number] {
  return [r.beta - 2 * r.erroPadraoBeta, r.beta + 2 * r.erroPadraoBeta];
}

/** Classificação didática do beta. */
export type PerfilBeta = 'defensiva' | 'neutra' | 'agressiva';

/**
 * β < 0,8: defensiva (oscila menos que o mercado); β > 1,2: agressiva (amplifica o mercado);
 * entre os dois: acompanha o mercado. Limites de arredondamento didático, não regra do livro.
 */
export function perfilBeta(beta: number): PerfilBeta {
  if (beta < 0.8) return 'defensiva';
  if (beta > 1.2) return 'agressiva';
  return 'neutra';
}
