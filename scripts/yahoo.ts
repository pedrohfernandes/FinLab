/**
 * Cliente mínimo do Yahoo Finance para baixar preços MENSAIS de ações e índices.
 *
 * Roda só no script `npm run atualizar-cotacoes` (Node): o Yahoo não libera CORS,
 * então o navegador não consegue chamá-lo direto. Por isso os preços são
 * capturados aqui e gravados em src/dados/cotacoes.json, que o site lê.
 */

const URL_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const TIMEOUT_MS = 15000;

/** Preço de um mês: o fechamento AJUSTADO do último pregão do mês. */
export interface PrecoMensal {
  /** "aaaa-mm" */
  mes: string;
  preco: number;
}

interface RespostaChart {
  chart: {
    result:
      | {
          timestamp: number[];
          meta: { exchangeTimezoneName?: string; gmtoffset?: number };
          indicators: { adjclose?: { adjclose: (number | null)[] }[]; quote: { close: (number | null)[] }[] };
        }[]
      | null;
    error: { description: string } | null;
  };
}

/**
 * Baixa os preços mensais de `tickerYahoo` entre `inicio` e `fim`.
 *
 * Usa o fechamento AJUSTADO (adjclose), que já incorpora dividendos, JCP e
 * desdobramentos: assim, a variação de um mês para o outro é o retorno total que
 * o acionista teve, e não só a variação do preço na tela.
 * (Índices como o Ibovespa não têm ajuste; o próprio índice já reinveste os proventos.)
 */
export async function buscarPrecosMensais(tickerYahoo: string, inicio: Date, fim: Date): Promise<PrecoMensal[]> {
  const periodo1 = Math.floor(inicio.getTime() / 1000);
  const periodo2 = Math.floor(fim.getTime() / 1000);
  const url = `${URL_BASE}/${encodeURIComponent(tickerYahoo)}?interval=1mo&period1=${periodo1}&period2=${periodo2}&events=div%2Csplit`;

  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    // O Yahoo recusa requisições sem um User-Agent de navegador.
    const resposta = await fetch(url, { signal: controle.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!resposta.ok) throw new Error(`Yahoo respondeu ${resposta.status} para ${tickerYahoo}`);
    const corpo = (await resposta.json()) as RespostaChart;
    const resultado = corpo.chart.result?.[0];
    if (!resultado) throw new Error(`Yahoo sem dados para ${tickerYahoo}: ${corpo.chart.error?.description ?? 'resposta vazia'}`);

    const ajustados = resultado.indicators.adjclose?.[0]?.adjclose ?? resultado.indicators.quote[0].close;
    // As datas vêm em segundos (UTC) no início de cada mês, no fuso da bolsa (B3: UTC−3).
    // Somar o deslocamento evita que "01/10 00:00 em São Paulo" vire "30/09" em UTC.
    const deslocamento = resultado.meta.gmtoffset ?? 0;
    const precos: PrecoMensal[] = [];
    resultado.timestamp.forEach((t, i) => {
      const preco = ajustados[i];
      if (preco === null || preco === undefined || !Number.isFinite(preco)) return;
      precos.push({ mes: new Date((t + deslocamento) * 1000).toISOString().slice(0, 7), preco });
    });
    return precos;
  } finally {
    clearTimeout(temporizador);
  }
}
