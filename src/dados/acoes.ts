/**
 * Catálogo das ações e do índice de mercado usados nos Módulos 3 e 4 (Trabalho 2).
 *
 * As 10 ações foram escolhidas para cobrir setores e comportamentos diferentes:
 * de empresas que acompanham de perto a bolsa (bancos, B3) a outras que dependem de
 * fatores próprios (elétricas, exportadoras) — o que gera betas e correlações bem
 * distintos, bom para ver a diversificação acontecer.
 */

export interface InfoAcao {
  /** Código de negociação na B3. */
  ticker: string;
  /** Código no Yahoo Finance (ações brasileiras levam o sufixo .SA). */
  tickerYahoo: string;
  empresa: string;
  setor: string;
  /** Por que essa ação está na lista: o que se espera ver nela. */
  destaque: string;
}

export const ACOES: InfoAcao[] = [
  {
    ticker: 'PETR4',
    tickerYahoo: 'PETR4.SA',
    empresa: 'Petrobras',
    setor: 'Petróleo e gás',
    destaque: 'Maior peso do Ibovespa; depende também do preço do petróleo e de decisões do governo.',
  },
  {
    ticker: 'VALE3',
    tickerYahoo: 'VALE3.SA',
    empresa: 'Vale',
    setor: 'Mineração',
    destaque: 'Exportadora de minério de ferro: sensível à China e ao dólar, não só à economia brasileira.',
  },
  {
    ticker: 'ITUB4',
    tickerYahoo: 'ITUB4.SA',
    empresa: 'Itaú Unibanco',
    setor: 'Bancos',
    destaque: 'Banco grande e muito negociado: tende a acompanhar o mercado de perto.',
  },
  {
    ticker: 'BBAS3',
    tickerYahoo: 'BBAS3.SA',
    empresa: 'Banco do Brasil',
    setor: 'Bancos',
    destaque: 'Banco com controle estatal: ao risco do setor soma-se o risco político.',
  },
  {
    ticker: 'WEGE3',
    tickerYahoo: 'WEGE3.SA',
    empresa: 'WEG',
    setor: 'Bens de capital',
    destaque: 'Industrial com receita global: parte do seu risco não tem relação com a bolsa brasileira.',
  },
  {
    ticker: 'ABEV3',
    tickerYahoo: 'ABEV3.SA',
    empresa: 'Ambev',
    setor: 'Bebidas',
    destaque: 'Consumo básico: as pessoas continuam comprando bebida na crise, o que costuma reduzir o beta.',
  },
  {
    ticker: 'B3SA3',
    tickerYahoo: 'B3SA3.SA',
    empresa: 'B3',
    setor: 'Serviços financeiros',
    destaque: 'A própria bolsa: ganha com o volume de negócios, que cresce quando o mercado está animado.',
  },
  {
    ticker: 'SUZB3',
    tickerYahoo: 'SUZB3.SA',
    empresa: 'Suzano',
    setor: 'Papel e celulose',
    destaque: 'Exportadora: costuma subir quando o dólar sobe — e o dólar sobe quando a bolsa cai.',
  },
  {
    ticker: 'TAEE11',
    tickerYahoo: 'TAEE11.SA',
    empresa: 'Taesa',
    setor: 'Transmissão de energia',
    destaque: 'Receita regulada e previsível: exemplo clássico de ação "defensiva", de beta baixo.',
  },
  {
    ticker: 'MGLU3',
    tickerYahoo: 'MGLU3.SA',
    empresa: 'Magazine Luiza',
    setor: 'Varejo',
    destaque: 'Varejo muito dependente de juros e crédito: exemplo de ação de beta alto.',
  },
];

/** O mercado (carteira de mercado na prática, Cap. 11.3): o Ibovespa. */
export const INDICE_MERCADO = {
  ticker: 'IBOV',
  tickerYahoo: '^BVSP',
  nome: 'Ibovespa',
} as const;

/** Formato de src/dados/cotacoes.json, gerado por `npm run atualizar-cotacoes`. */
export interface DadosCotacoes {
  /** Momento em que o script consultou as fontes (ISO com horário). */
  geradoEm: string;
  /** Meses da série, em ordem ("aaaa-mm"). O preço de cada mês é o do último pregão. */
  meses: string[];
  /** Preços de fechamento ajustados do Ibovespa, alinhados com `meses`. */
  indice: number[];
  /** Preços de fechamento ajustados por proventos, por ticker, alinhados com `meses`. */
  acoes: Record<string, number[]>;
  /** CDI acumulado em cada mês (% a.m.), alinhado com `meses` — cópia offline da série 4391. */
  cdiMensal: number[];
}

/** Procura uma ação do catálogo pelo ticker. */
export const acaoPorTicker = (ticker: string): InfoAcao | undefined => ACOES.find((a) => a.ticker === ticker);
