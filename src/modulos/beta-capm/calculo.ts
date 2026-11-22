/**
 * Módulo 3 — Quanto risco essa ação carrega? (beta e CAPM)
 *
 * Pergunta: quanto uma ação oscila junto com o mercado (β), quanto do seu risco
 * a diversificação elimina, e que retorno ela precisa oferecer para compensar
 * o risco que NÃO dá para eliminar?
 *
 * Ref.: Cap. 11.3 (medindo o risco sistemático) e 11.4 (CAPM).
 */
import {
  anualizarRetorno,
  anualizarVolatilidade,
  estimarBeta,
  intervaloBeta,
  perfilBeta,
  retornoCapm,
  retornosEmExcesso,
  retornosSimples,
  type PerfilBeta,
} from '../../financas/capm';
import { desvioPadrao, media, type Regressao } from '../../financas/estatistica';

/** Janelas de estimação oferecidas (em meses de retornos). 60 = "5 anos de retornos mensais" (slide 11.3). */
export const JANELAS = [24, 36, 60] as const;

/** Mínimo de retornos mensais para uma regressão minimamente útil. */
export const MINIMO_RETORNOS = 12;

/**
 * Prêmio de mercado esperado padrão (% a.a.). É uma PREMISSA didática, editável:
 * o prêmio histórico de poucos anos é instável e pode até ser negativo (como em
 * 2021–2026, quando o Ibovespa rendeu menos que o CDI), o que não serve como expectativa.
 */
export const PREMIO_PADRAO = 5;

/**
 * Encontra, nos meses das cotações, o trecho contínuo MAIS RECENTE em que o CSV
 * enviado tem preço em todos os meses. Devolve os índices [início, fim] (inclusivos)
 * ou null se não houver ao menos dois meses seguidos em comum.
 */
export function trechoEmComum(mesesCotacoes: string[], mesesCsv: Set<string>): [number, number] | null {
  let fim = mesesCotacoes.length - 1;
  while (fim >= 0 && !mesesCsv.has(mesesCotacoes[fim])) fim--;
  if (fim < 1) return null;
  let inicio = fim;
  while (inicio > 0 && mesesCsv.has(mesesCotacoes[inicio - 1])) inicio--;
  return inicio < fim ? [inicio, fim] : null;
}

export interface EntradaBetaCapm {
  /** Meses dos preços ("aaaa-mm"), em ordem. */
  meses: string[];
  /** Preços ajustados da ação, alinhados com `meses`. */
  precosAcao: number[];
  /** Pontos do Ibovespa, alinhados com `meses`. */
  precosMercado: number[];
  /** CDI de cada mês (fração a.m.), alinhado com `meses`. O do 1º mês não é usado. */
  livreDeRiscoMensal: number[];
  /** Taxa livre de risco de HOJE para o CAPM (CDI anual, fração). */
  livreDeRiscoAtual: number;
  /** Prêmio de risco de mercado ESPERADO, E[R_m] − r_f (fração a.a.). */
  premioMercado: number;
}

/** Um mês da regressão. */
export interface PontoRegressao {
  mes: string;
  retornoAcao: number;
  retornoMercado: number;
  livreDeRisco: number;
  /** Rᵢ − r_f */
  excessoAcao: number;
  /** R_m − r_f */
  excessoMercado: number;
  /** α + β·(R_m − r_f): o que a reta prevê. */
  previsto: number;
  /** Diferença entre o realizado e o previsto: a parte específica da ação naquele mês. */
  erro: number;
}

/** Evolução de R$ 100 investidos no início do período. */
export interface PontoAcumulado {
  mes: string;
  acao: number;
  mercado: number;
  livreDeRisco: number;
}

export interface ResultadoBetaCapm {
  regressao: Regressao;
  intervaloBeta: [number, number];
  perfil: PerfilBeta;
  pontos: PontoRegressao[];
  acumulado: PontoAcumulado[];
  /** Retornos médios anualizados (taxa equivalente) no período. */
  historico: {
    retornoAcao: number;
    retornoMercado: number;
    livreDeRisco: number;
    /** Prêmio de mercado REALIZADO no período: E[R_m] − r_f históricos. */
    premioMercado: number;
    volatilidadeAcao: number;
    volatilidadeMercado: number;
  };
  /** Decomposição da variância dos retornos em excesso (somam 1). */
  risco: {
    /** Fração sistemática = R² (explicada pelo mercado). */
    sistematico: number;
    /** Fração específica = 1 − R² (eliminável pela diversificação). */
    especifico: number;
    /** Volatilidade anual dos retornos em excesso da ação. */
    volatilidadeTotal: number;
    /** Parte sistemática da volatilidade: β·SD(R_m − r_f), anualizada. */
    volatilidadeSistematica: number;
  };
  /** E[Rᵢ] = r_f + β·prêmio, com a taxa de hoje e o prêmio esperado. */
  retornoExigido: number;
  /** Retorno esperado do mercado: r_f + prêmio (o ponto β = 1 da SML). */
  retornoMercadoEsperado: number;
}

/** Valida a entrada; devolve a mensagem de erro ou null. */
export function validarEntrada(e: EntradaBetaCapm): string | null {
  const n = e.meses.length;
  if (e.precosAcao.length !== n || e.precosMercado.length !== n || e.livreDeRiscoMensal.length !== n)
    return 'As séries de preços e de juros não cobrem os mesmos meses.';
  if (n - 1 < MINIMO_RETORNOS) return `São necessários pelo menos ${MINIMO_RETORNOS + 1} meses de preços (${MINIMO_RETORNOS} retornos).`;
  if (!(e.livreDeRiscoAtual > -1)) return 'Informe uma taxa livre de risco válida.';
  return null;
}

/** Pré-condição: validarEntrada(e) === null. */
export function calcularBetaCapm(e: EntradaBetaCapm): ResultadoBetaCapm {
  // 1. Retornos mensais (n preços → n − 1 retornos). O r_f de cada retorno é o CDI do MESMO mês.
  const ri = retornosSimples(e.precosAcao);
  const rm = retornosSimples(e.precosMercado);
  const rf = e.livreDeRiscoMensal.slice(1);

  // 2. Regressão dos retornos em excesso (slide 11.3).
  const regressao = estimarBeta(ri, rm, rf);
  const xi = retornosEmExcesso(ri, rf);
  const xm = retornosEmExcesso(rm, rf);

  const pontos: PontoRegressao[] = ri.map((_, t) => {
    const previsto = regressao.alfa + regressao.beta * xm[t];
    return {
      mes: e.meses[t + 1],
      retornoAcao: ri[t],
      retornoMercado: rm[t],
      livreDeRisco: rf[t],
      excessoAcao: xi[t],
      excessoMercado: xm[t],
      previsto,
      erro: xi[t] - previsto,
    };
  });

  // 3. Quanto teria virado R$ 100 aplicados em cada alternativa.
  const acumulado: PontoAcumulado[] = [{ mes: e.meses[0], acao: 100, mercado: 100, livreDeRisco: 100 }];
  ri.forEach((_, t) => {
    const anterior = acumulado[t];
    acumulado.push({
      mes: e.meses[t + 1],
      acao: anterior.acao * (1 + ri[t]),
      mercado: anterior.mercado * (1 + rm[t]),
      livreDeRisco: anterior.livreDeRisco * (1 + rf[t]),
    });
  });

  // 4. Médias históricas anualizadas (taxa equivalente, como no Cap. 5).
  const retornoMercadoHist = anualizarRetorno(media(rm));
  const livreDeRiscoHist = anualizarRetorno(media(rf));

  // 5. Decomposição do risco: Var(excesso da ação) = β²·Var(excesso do mercado) + Var(erros).
  //    A fração sistemática é exatamente o R² da regressão.
  const volatilidadeTotal = anualizarVolatilidade(desvioPadrao(xi));
  const volatilidadeSistematica = anualizarVolatilidade(Math.abs(regressao.beta) * desvioPadrao(xm));

  return {
    regressao,
    intervaloBeta: intervaloBeta(regressao),
    perfil: perfilBeta(regressao.beta),
    pontos,
    acumulado,
    historico: {
      retornoAcao: anualizarRetorno(media(ri)),
      retornoMercado: retornoMercadoHist,
      livreDeRisco: livreDeRiscoHist,
      premioMercado: retornoMercadoHist - livreDeRiscoHist,
      volatilidadeAcao: anualizarVolatilidade(desvioPadrao(ri)),
      volatilidadeMercado: anualizarVolatilidade(desvioPadrao(rm)),
    },
    risco: {
      sistematico: regressao.r2,
      especifico: 1 - regressao.r2,
      volatilidadeTotal,
      volatilidadeSistematica,
    },
    // 6. CAPM (slide 11.4): taxa livre de risco de hoje + β × prêmio esperado.
    retornoExigido: retornoCapm(e.livreDeRiscoAtual, regressao.beta, e.premioMercado),
    retornoMercadoEsperado: e.livreDeRiscoAtual + e.premioMercado,
  };
}

/**
 * Recorta as séries para os últimos `janela` retornos (janela + 1 preços).
 * Se houver menos dados, usa tudo o que existe.
 */
export function recortarJanela<T>(serie: T[], janela: number): T[] {
  return serie.slice(Math.max(0, serie.length - (janela + 1)));
}
