/**
 * Módulo 4 — Diversificar reduz o risco? (carteiras)
 *
 * Pergunta: ao juntar ações numa carteira, o que acontece com o retorno esperado,
 * com a volatilidade e com o beta? Até onde a diversificação consegue reduzir o risco?
 *
 * Ref.: Cap. 11.1 (retorno esperado de uma carteira), 11.2 (volatilidade de uma
 *       carteira) e 11.3 (beta de uma carteira).
 */
import { anualizarRetorno, anualizarVolatilidade, estimarBeta, retornoCapm, retornosSimples } from '../../financas/capm';
import {
  betaCarteira,
  carteirasAleatorias,
  matrizCovariancia,
  mediasDaMatriz,
  retornoEsperadoCarteira,
  varianciaCarteira,
  varianciaIgualmentePonderada,
  type PontoCarteira,
} from '../../financas/carteira';
import { correlacao, desvioPadrao, media } from '../../financas/estatistica';

/** De onde vem o retorno esperado de cada ação. */
export type BaseRetorno = 'capm' | 'historico';

/** Quantas carteiras aleatórias desenhar na nuvem. */
export const QUANTIDADE_ALEATORIAS = 1500;

/** Até quantas ações a curva de diversificação vai. */
export const MAXIMO_CURVA = 30;

export interface EntradaCarteira {
  tickers: string[];
  /** Pesos (frações que somam 1), na ordem de `tickers`. */
  pesos: number[];
  /** Preços de cada ação (mesma ordem de `tickers`), alinhados com `meses`. */
  precos: number[][];
  meses: string[];
  precosMercado: number[];
  /** CDI de cada mês (fração a.m.), alinhado com `meses`. */
  livreDeRiscoMensal: number[];
  /** CDI de hoje (fração a.a.), para o CAPM. */
  livreDeRiscoAtual: number;
  /** Prêmio de mercado esperado (fração a.a.). */
  premioMercado: number;
  base: BaseRetorno;
}

export interface Ativo {
  ticker: string;
  peso: number;
  beta: number;
  /** Retorno esperado anual, conforme a base escolhida. */
  retornoEsperado: number;
  /** Volatilidade anual. */
  volatilidade: number;
}

export interface PontoCurva {
  quantidade: number;
  volatilidade: number;
}

export interface PontoAcumuladoCarteira {
  mes: string;
  carteira: number;
  mercado: number;
  livreDeRisco: number;
}

export interface ResultadoCarteira {
  ativos: Ativo[];
  /** Matriz de correlações entre as ações escolhidas. */
  correlacoes: number[][];
  carteira: {
    retornoEsperado: number;
    volatilidade: number;
    /** Σ wᵢ·σᵢ: a volatilidade que a carteira teria se todas as correlações fossem 1 (sem diversificação). */
    volatilidadeSemDiversificacao: number;
    beta: number;
    /** Beta estimado direto pela regressão da série da carteira (confere com a média ponderada). */
    betaPorRegressao: number;
    /** Fração sistemática da variância da carteira (R² da regressão contra o Ibovespa). */
    sistematico: number;
  };
  volatilidadeMercado: number;
  /** Nuvem de carteiras aleatórias (risco × retorno, anuais). */
  nuvem: PontoCarteira[];
  /** A carteira de menor volatilidade encontrada na nuvem. */
  menorRisco: PontoCarteira;
  /** Volatilidade de uma carteira igualmente ponderada com k ações típicas do grupo (precisa de 2+ ações). */
  curva: PontoCurva[];
  /** Piso da curva: √(covariância média), o risco que nenhuma diversificação dentro do grupo elimina. */
  pisoDiversificacao: number | null;
  acumulado: PontoAcumuladoCarteira[];
}

export function validarEntrada(e: EntradaCarteira): string | null {
  if (e.tickers.length === 0) return 'Escolha pelo menos uma ação, dando a ela um peso maior que zero.';
  if (e.pesos.some((w) => w < 0)) return 'Os pesos não podem ser negativos.';
  const soma = e.pesos.reduce((s, w) => s + w, 0);
  if (Math.abs(soma - 1) > 0.0005)
    return `Os pesos somam ${(soma * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%, mas precisam somar 100%. Use "Ajustar para 100%".`;
  return null;
}

/** Pré-condição: validarEntrada(e) === null. */
export function calcularCarteira(e: EntradaCarteira): ResultadoCarteira {
  const rf = e.livreDeRiscoMensal.slice(1);
  const rm = retornosSimples(e.precosMercado);
  const retornos = e.precos.map(retornosSimples);

  // Matriz de covariâncias mensal → anual (×12, coerente com a volatilidade × √12).
  const covMensal = matrizCovariancia(retornos);
  const covAnual = covMensal.map((linha) => linha.map((c) => c * 12));

  const ativos: Ativo[] = e.tickers.map((ticker, i) => {
    const beta = estimarBeta(retornos[i], rm, rf).beta;
    return {
      ticker,
      peso: e.pesos[i],
      beta,
      retornoEsperado: e.base === 'capm' ? retornoCapm(e.livreDeRiscoAtual, beta, e.premioMercado) : anualizarRetorno(media(retornos[i])),
      volatilidade: anualizarVolatilidade(desvioPadrao(retornos[i])),
    };
  });
  const esperados = ativos.map((a) => a.retornoEsperado);

  // Carteira (slides 11.1–11.3).
  const volatilidade = Math.sqrt(Math.max(0, varianciaCarteira(e.pesos, covAnual)));
  const serieCarteira = rm.map((_, t) => retornos.reduce((s, r, i) => s + e.pesos[i] * r[t], 0));
  const regressaoCarteira = estimarBeta(serieCarteira, rm, rf);

  // Nuvem de carteiras aleatórias (slide 11.4). Com uma ação só, a "nuvem" é um ponto.
  const nuvem = e.tickers.length > 1 ? carteirasAleatorias(QUANTIDADE_ALEATORIAS, esperados, covAnual) : [];
  const menorRisco = nuvem.reduce<PontoCarteira>(
    (melhor, p) => (p.volatilidade < melhor.volatilidade ? p : melhor),
    { pesos: e.pesos, retorno: retornoEsperadoCarteira(e.pesos, esperados), volatilidade },
  );

  // Curva de diversificação com as médias do grupo escolhido.
  let curva: PontoCurva[] = [];
  let pisoDiversificacao: number | null = null;
  if (e.tickers.length > 1) {
    const { varianciaMedia, covarianciaMedia } = mediasDaMatriz(covAnual);
    curva = Array.from({ length: MAXIMO_CURVA }, (_, i) => ({
      quantidade: i + 1,
      volatilidade: Math.sqrt(Math.max(0, varianciaIgualmentePonderada(i + 1, varianciaMedia, covarianciaMedia))),
    }));
    pisoDiversificacao = Math.sqrt(Math.max(0, covarianciaMedia));
  }

  // R$ 100 na carteira (rebalanceada todo mês para os pesos escolhidos), no Ibovespa e no CDI.
  const acumulado: PontoAcumuladoCarteira[] = [{ mes: e.meses[0], carteira: 100, mercado: 100, livreDeRisco: 100 }];
  serieCarteira.forEach((rc, t) => {
    const a = acumulado[t];
    acumulado.push({ mes: e.meses[t + 1], carteira: a.carteira * (1 + rc), mercado: a.mercado * (1 + rm[t]), livreDeRisco: a.livreDeRisco * (1 + rf[t]) });
  });

  return {
    ativos,
    correlacoes: retornos.map((a) => retornos.map((b) => correlacao(a, b))),
    carteira: {
      retornoEsperado: retornoEsperadoCarteira(e.pesos, esperados),
      volatilidade,
      volatilidadeSemDiversificacao: e.pesos.reduce((s, w, i) => s + w * ativos[i].volatilidade, 0),
      beta: betaCarteira(e.pesos, ativos.map((a) => a.beta)),
      betaPorRegressao: regressaoCarteira.beta,
      sistematico: regressaoCarteira.r2,
    },
    volatilidadeMercado: anualizarVolatilidade(desvioPadrao(rm)),
    nuvem,
    menorRisco,
    curva,
    pisoDiversificacao,
    acumulado,
  };
}
