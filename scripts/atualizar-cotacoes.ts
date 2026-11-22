/**
 * Captura de dados do Trabalho 2: baixa 5 anos de preços mensais das ações do
 * catálogo e do Ibovespa (Yahoo Finance) e o CDI mensal (Banco Central), e grava
 * tudo alinhado mês a mês em src/dados/cotacoes.json.
 *
 * Por que 61 meses: o Cap. 11.3 diz que a maioria das fontes estima o beta com
 * "5 anos de retornos mensais" = 60 retornos, e cada retorno precisa de dois preços.
 *
 * Só entram meses COMPLETOS: o mês corrente fica de fora, porque o "preço do mês"
 * seria o de hoje, e não o do último pregão do mês.
 *
 * Uso: npm run atualizar-cotacoes
 */
import { writeFileSync } from 'node:fs';
import { ACOES, INDICE_MERCADO, type DadosCotacoes } from '../src/dados/acoes';
import { buscarCdiMensal } from '../src/dados/bcb';
import { buscarPrecosMensais, type PrecoMensal } from './yahoo';

/** Quantidade de preços mensais (60 retornos). */
const TOTAL_MESES = 61;

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const chaveMes = (ano: number, mesZeroBase: number) => {
  const d = new Date(ano, mesZeroBase, 1);
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}`;
};

// Janela: os 61 meses completos que terminam no mês passado.
const hoje = new Date();
const meses = Array.from({ length: TOTAL_MESES }, (_, i) =>
  chaveMes(hoje.getFullYear(), hoje.getMonth() - TOTAL_MESES + i),
);
const primeiroMes = meses[0];
const ultimoMes = meses[meses.length - 1];
// Uma folga de alguns dias antes do 1º mês, para não perder o primeiro preço por causa de fuso.
const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - TOTAL_MESES, -5);

/** Alinha os preços com a janela de meses; falha se faltar algum mês. */
function alinhar(nome: string, precos: PrecoMensal[]): number[] {
  const porMes = new Map(precos.map((p) => [p.mes, p.preco]));
  return meses.map((mes) => {
    const preco = porMes.get(mes);
    if (preco === undefined) throw new Error(`${nome}: sem preço em ${mes}`);
    return preco;
  });
}

console.log(`Baixando ${TOTAL_MESES} meses (${primeiroMes} a ${ultimoMes})…`);

// Uma ação por vez: o Yahoo limita requisições em rajada.
const acoes: Record<string, number[]> = {};
for (const acao of ACOES) {
  acoes[acao.ticker] = alinhar(acao.ticker, await buscarPrecosMensais(acao.tickerYahoo, inicio, hoje));
  console.log(`  ${acao.ticker.padEnd(7)} ok`);
}
const indice = alinhar(INDICE_MERCADO.nome, await buscarPrecosMensais(INDICE_MERCADO.tickerYahoo, inicio, hoje));
console.log(`  ${INDICE_MERCADO.nome} ok`);

const cdiPorMes = await buscarCdiMensal(primeiroMes, ultimoMes);
const cdiMensal = meses.map((mes) => {
  const valor = cdiPorMes.get(mes);
  if (valor === undefined) throw new Error(`CDI mensal (BC 4391): sem valor em ${mes}`);
  return valor;
});
console.log('  CDI mensal (Banco Central) ok');

const dados: DadosCotacoes = { geradoEm: new Date().toISOString(), meses, indice, acoes, cdiMensal };
writeFileSync(new URL('../src/dados/cotacoes.json', import.meta.url), JSON.stringify(dados, null, 2) + '\n');
console.log('cotacoes.json atualizado.');
