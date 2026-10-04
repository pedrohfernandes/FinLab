/**
 * Valor presente e valor futuro de valores isolados e de séries de parcelas.
 *
 * Ref.: Cap. 4 — Avaliando fluxos de caixa em diferentes pontos no tempo;
 *       Perpetuidades, anuidades e outros casos especiais.
 */

/**
 * Valor futuro de um valor único.
 *   VF = VP·(1 + i)^n
 */
export function valorFuturo(vp: number, taxa: number, periodos: number): number {
  return vp * Math.pow(1 + taxa, periodos);
}

/**
 * Valor presente de um valor único.
 *   VP = VF / (1 + i)^n
 */
export function valorPresente(vf: number, taxa: number, periodos: number): number {
  return vf / Math.pow(1 + taxa, periodos);
}

/**
 * Valor presente de uma série de n parcelas iguais (anuidade).
 *
 * Cada parcela é trazida a valor presente e as parcelas são somadas:
 *   VP = Σ PMT/(1+i)^t,  t = 1..n
 * Os termos formam uma PG de razão 1/(1+i); a soma da PG dá a forma fechada:
 *   VP = PMT · [1 − (1+i)^−n] / i
 *
 * Se a 1ª parcela é paga no ato da compra (série antecipada), cada parcela
 * está um período mais perto de hoje, e o VP fica multiplicado por (1 + i).
 *
 * Ref.: Cap. 4 — anuidades.
 * Ex.: vpSerie(120, 0,01, 10) ≈ 1136,56
 */
export function vpSerie(pmt: number, taxa: number, n: number, antecipada = false): number {
  const fatorAntecipada = antecipada ? 1 + taxa : 1;
  if (Math.abs(taxa) < 1e-12) return pmt * n; // sem juros, a PG vira n termos iguais
  return pmt * ((1 - Math.pow(1 + taxa, -n)) / taxa) * fatorAntecipada;
}

/**
 * Derivada de vpSerie em relação à taxa (necessária ao método de Newton-Raphson).
 *   dVP/di = Σ −k·PMT/(1+i)^(k+1),  com k = t (postecipada) ou k = t − 1 (antecipada)
 */
export function derivadaVpSerie(pmt: number, taxa: number, n: number, antecipada = false): number {
  let soma = 0;
  for (let t = 1; t <= n; t++) {
    const k = antecipada ? t - 1 : t;
    soma += (-k * pmt) / Math.pow(1 + taxa, k + 1);
  }
  return soma;
}
