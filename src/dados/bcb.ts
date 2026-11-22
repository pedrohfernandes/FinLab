/**
 * Cliente da API de dados abertos do Banco Central (SGS).
 *
 * Sem chave de acesso e com CORS liberado, então funciona direto do navegador.
 *
 * Este arquivo não usa nenhuma API exclusiva do navegador: o mesmo código roda
 * no script `npm run atualizar-dados` (Node) que gera o snapshot offline.
 */
import { SERIES } from "./series";
import type { DadosTaxas, Ponto } from "./tipos";

const URL_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const TIMEOUT_PADRAO_MS = 8000;

interface LinhaBcb {
  data: string; // dd/mm/aaaa
  valor: string; // "13.65"
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Date → "dd/mm/aaaa" (formato exigido pela API). */
function paraBcb(d: Date): string {
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Date → "aaaa-mm-dd" no fuso local. */
export function paraIso(d: Date): string {
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** "dd/mm/aaaa" → "aaaa-mm-dd". */
function isoDeBcb(data: string): string {
  const [dia, mes, ano] = data.split("/");
  return `${ano}-${mes}-${dia}`;
}

/** Busca uma série em um intervalo de datas. */
export async function buscarSerie(
  codigo: number,
  inicio: Date,
  fim: Date,
  timeoutMs = TIMEOUT_PADRAO_MS,
): Promise<Ponto[]> {
  const montarUrl = (ate: Date) =>
    `${URL_BASE}.${codigo}/dados?formato=json&dataInicial=${paraBcb(inicio)}&dataFinal=${paraBcb(ate)}`;
  try {
    return await consultar(montarUrl(fim), codigo, timeoutMs, "default");
  } catch (erro) {
    // A API do BC às vezes responde "304" com corpo vazio, e o cache do próprio BC
    // guarda essa resposta para AQUELE endereço por até 15 minutos — repetir a mesma
    // consulta devolve o mesmo erro. A segunda tentativa usa outro endereço: a data
    // final um dia depois. Os dados não mudam, porque datas futuras são descartadas
    // por quem usa a série.
    // Se o problema foi tempo esgotado, não insiste: o BC está lento ou fora do ar,
    // e o chamador já tem o plano B (cache ou cópia offline).
    if (erro instanceof Error && erro.name === "AbortError") throw erro;
    const diaSeguinte = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate() + 1);
    return consultar(montarUrl(diaSeguinte), codigo, timeoutMs, "no-store");
  }
}

/** Uma requisição à API do BC, com tempo limite e validação da resposta. */
async function consultar(
  url: string,
  codigo: number,
  timeoutMs: number,
  cache: RequestCache,
): Promise<Ponto[]> {
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), timeoutMs);

  try {
    const resposta = await fetch(url, { signal: controle.signal, cache });
    if (!resposta.ok)
      throw new Error(
        `BCB respondeu ${resposta.status} para a série ${codigo}`,
      );
    const corpo: unknown = await resposta.json();
    if (!Array.isArray(corpo))
      throw new Error(`Resposta inesperada do BCB para a série ${codigo}`);
    return (corpo as LinhaBcb[]).map((l) => ({
      data: isoDeBcb(l.data),
      valor: parseFloat(l.valor),
    }));
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Reduz uma série a um ponto por mês (o último valor de cada mês).
 * Entrada e saída ordenadas por data.
 */
export function mensalizar(pontos: Ponto[]): Ponto[] {
  const porMes = new Map<string, Ponto>();
  for (const p of pontos) porMes.set(p.data.slice(0, 7), p); // o último sobrescreve
  return [...porMes.values()];
}

/**
 * CDI acumulado em cada mês (série 4391, % a.m.), de `primeiroMes` a `ultimoMes`
 * (formato "aaaa-mm"). Devolve um mapa "aaaa-mm" → valor em %.
 * É a taxa livre de risco mensal dos Módulos 3 e 4.
 */
export async function buscarCdiMensal(
  primeiroMes: string,
  ultimoMes: string,
  timeoutMs = TIMEOUT_PADRAO_MS,
): Promise<Map<string, number>> {
  const [anoI, mesI] = primeiroMes.split("-").map(Number);
  const [anoF, mesF] = ultimoMes.split("-").map(Number);
  // Série mensal: cada valor vem datado no dia 1º do mês a que se refere.
  const pontos = await buscarSerie(
    SERIES.cdiMensal.codigo,
    new Date(anoI, mesI - 1, 1),
    new Date(anoF, mesF - 1, 1),
    timeoutMs,
  );
  return new Map(
    pontos
      .filter((p) => Number.isFinite(p.valor))
      .map((p) => [p.data.slice(0, 7), p.valor]),
  );
}

/** Subtrai meses de uma data, mantendo o dia. */
const meses = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() - n, d.getDate());

/**
 * Consulta todas as séries e monta o conjunto de taxas.
 * Lança erro se qualquer série falhar ou vier vazia (o chamador usa o fallback).
 */
export async function carregarTaxasDoBcb(
  hoje: Date = new Date(),
): Promise<DadosTaxas> {
  const hojeIso = paraIso(hoje);
  const dias60 = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() - 60,
  );

  const [selic, cdi, ipca12m, ipcaMensal, tr, poupanca] = await Promise.all([
    buscarSerie(SERIES.selic.codigo, meses(hoje, 25), hoje),
    buscarSerie(SERIES.cdi.codigo, meses(hoje, 25), hoje),
    buscarSerie(SERIES.ipca12m.codigo, meses(hoje, 25), hoje),
    buscarSerie(SERIES.ipcaMensal.codigo, meses(hoje, 6), hoje),
    buscarSerie(SERIES.tr.codigo, dias60, hoje),
    buscarSerie(SERIES.poupanca.codigo, dias60, hoje),
  ]);

  /** Último ponto com data até hoje (a API às vezes devolve datas futuras já agendadas). */
  const ultimo = (pontos: Ponto[], nome: string): Ponto => {
    const validos = pontos.filter(
      (p) => p.data <= hojeIso && Number.isFinite(p.valor),
    );
    const p = validos[validos.length - 1];
    if (!p) throw new Error(`Série ${nome} veio vazia`);
    return p;
  };

  return {
    selic: ultimo(selic, "Selic"),
    cdi: ultimo(cdi, "CDI"),
    ipca12m: ultimo(ipca12m, "IPCA 12m"),
    ipcaMensal: ultimo(ipcaMensal, "IPCA mensal"),
    tr: ultimo(tr, "TR"),
    poupanca: ultimo(poupanca, "Poupança"),
    historico: {
      selic: mensalizar(selic.filter((p) => p.data <= hojeIso)),
      cdi: mensalizar(cdi.filter((p) => p.data <= hojeIso)),
      ipca12m: mensalizar(ipca12m.filter((p) => p.data <= hojeIso)),
    },
    consultadoEm: new Date().toISOString(),
  };
}
