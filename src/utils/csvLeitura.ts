/**
 * Leitura de um CSV de preços enviado pelo usuário (Módulo 3), para analisar
 * qualquer ação além das 10 do catálogo.
 *
 * Formatos aceitos:
 *  - Excel em português:  data;preco      → 31/10/2026;45,10   (milhar com ponto: 1.234,56)
 *  - Padrão internacional: data,preco      → 2026-10-31,45.10
 *  - Exportação do Yahoo Finance: Date,Open,High,Low,Close,Adj Close,Volume (usa "Adj Close")
 * Cabeçalho é opcional. Datas em dd/mm/aaaa, aaaa-mm-dd ou mm/aaaa.
 * Preços diários ou semanais são reduzidos a um por mês (o último de cada mês).
 */

export interface PrecoMes {
  /** "aaaa-mm" */
  mes: string;
  preco: number;
}

export class ErroCsv extends Error {}

/** Colunas de preço reconhecidas no cabeçalho, em ordem de preferência. */
const NOMES_PRECO = ['adj close', 'adj. close', 'fechamento ajustado', 'ajustado', 'preco', 'preço', 'fechamento', 'close', 'ultimo', 'último'];

/** Converte "31/10/2026", "2026-10-31", "2026-10" ou "10/2026" em "aaaa-mm" (ou null se não for data). */
function mesDe(texto: string): string | null {
  const t = texto.trim().replace(/^"|"$/g, '');
  let m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?/.exec(t);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;
  m = /^\d{1,2}\/(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`;
  m = /^(\d{1,2})\/(\d{4})$/.exec(t);
  if (m) return `${m[2]}-${m[1].padStart(2, '0')}`;
  return null;
}

/**
 * Converte um número escrito em qualquer dos dois padrões.
 * Com separador ";" ou tabulação, a vírgula é decimal e o ponto é milhar (padrão brasileiro);
 * com separador ",", o ponto é decimal.
 */
function numeroDe(texto: string, virgulaDecimal: boolean): number {
  let t = texto.trim().replace(/^"|"$/g, '').replace(/^R\$\s*/, '');
  if (virgulaDecimal) t = t.replace(/\./g, '').replace(',', '.');
  return parseFloat(t);
}

/**
 * Lê o CSV e devolve um preço por mês, em ordem cronológica.
 * Lança ErroCsv com uma mensagem em português quando o arquivo não pode ser usado.
 */
export function lerPrecosCsv(texto: string): PrecoMes[] {
  const linhas = texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '');
  if (linhas.length === 0) throw new ErroCsv('O arquivo está vazio.');

  // Separador: o que aparecer na primeira linha (";" tem prioridade, pois "," pode ser decimal).
  const separador = linhas[0].includes(';') ? ';' : linhas[0].includes('\t') ? '\t' : ',';
  const virgulaDecimal = separador !== ',';

  // Cabeçalho: se a primeira célula não for uma data, a primeira linha é de títulos.
  const primeira = linhas[0].split(separador);
  const temCabecalho = mesDe(primeira[0]) === null;
  let colunaPreco = 1;
  if (temCabecalho) {
    const titulos = primeira.map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase());
    const encontrada = NOMES_PRECO.map((nome) => titulos.indexOf(nome)).find((i) => i > 0);
    if (encontrada !== undefined) colunaPreco = encontrada;
  }

  const porMes = new Map<string, { data: string; preco: number }>();
  const dados = temCabecalho ? linhas.slice(1) : linhas;
  dados.forEach((linha, i) => {
    const celulas = linha.split(separador);
    const mes = mesDe(celulas[0] ?? '');
    const preco = numeroDe(celulas[colunaPreco] ?? '', virgulaDecimal);
    if (mes === null) throw new ErroCsv(`Linha ${i + (temCabecalho ? 2 : 1)}: data não reconhecida ("${celulas[0]}"). Use dd/mm/aaaa ou aaaa-mm-dd.`);
    // Linhas sem preço (feriados, "null" do Yahoo) são ignoradas.
    if (!Number.isFinite(preco)) return;
    if (preco <= 0) throw new ErroCsv(`Linha ${i + (temCabecalho ? 2 : 1)}: o preço deve ser positivo.`);
    // Guarda o último preço de cada mês (comparando a data completa, pois o arquivo pode vir fora de ordem).
    const data = celulas[0].trim();
    const ordenavel = /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(data) ? data.split('/').reverse().map((p) => p.padStart(2, '0')).join('-') : data;
    const atual = porMes.get(mes);
    if (!atual || ordenavel >= atual.data) porMes.set(mes, { data: ordenavel, preco });
  });

  const resultado = [...porMes.entries()].map(([mes, v]) => ({ mes, preco: v.preco })).sort((a, b) => (a.mes < b.mes ? -1 : 1));
  if (resultado.length < 2) throw new ErroCsv('O arquivo precisa de preços de pelo menos dois meses diferentes.');
  return resultado;
}
