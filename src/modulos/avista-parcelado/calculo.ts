/**
 * Módulo 1 — À vista ou parcelado?
 *
 * Pergunta: o "parcelado sem juros" é mesmo sem juros? Se eu tenho o dinheiro,
 * compensa mais pagar à vista ou parcelar e deixar o dinheiro rendendo?
 */
import { derivadaVpSerie, vpSerie } from '../../financas/fluxos';
import { aliquotaIrRegressivo, DIAS_POR_MES, taxaMensalLiquida } from '../../financas/impostos';
import { newtonRaphson, type IteracaoNewton } from '../../financas/raizes';
import { mensalParaAnual } from '../../financas/taxas';

export interface EntradaAvistaParcelado {
  precoAvista: number;
  parcelas: number;
  valorParcela: number;
  /** true quando a 1ª parcela é paga no ato da compra (entrada). */
  antecipada: boolean;
  /** Rendimento bruto anual da aplicação, como fração. */
  rendimentoBrutoAnual: number;
  /** true para aplicações isentas de IR (LCI/LCA). */
  isento: boolean;
}

export interface PontoCurva {
  /** Taxa de desconto em % a.m. */
  taxa: number;
  /** Valor presente das parcelas a essa taxa. */
  vp: number;
}

export interface ResultadoAvistaParcelado {
  totalParcelado: number;
  /** Taxa de juros mensal embutida no parcelamento (fração). */
  taxaImplicita: number;
  taxaImplicitaAnual: number;
  convergiu: boolean;
  iteracoes: IteracaoNewton[];
  /** Quanto tempo, em média, o dinheiro fica aplicado enquanto as parcelas são pagas. */
  prazoMedioMeses: number;
  aliquotaIr: number;
  taxaLiquidaMensal: number;
  taxaLiquidaAnual: number;
  /** Valor das parcelas, em reais de hoje, descontadas pela taxa líquida da aplicação. */
  vpParcelas: number;
  /** vpParcelas − preço à vista. Positivo: o parcelamento custa mais que pagar à vista. */
  diferenca: number;
  avistaMelhor: boolean;
  curva: PontoCurva[];
}

/** Mensagem de erro se a entrada não permite o cálculo; null se está tudo certo. */
export function validarEntrada(e: EntradaAvistaParcelado): string | null {
  if (!(e.precoAvista > 0)) return 'Informe um preço à vista maior que zero.';
  if (!(e.valorParcela > 0)) return 'Informe um valor de parcela maior que zero.';
  if (!Number.isInteger(e.parcelas) || e.parcelas < 1) return 'O número de parcelas deve ser um inteiro a partir de 1.';
  if (e.antecipada && e.parcelas === 1)
    return 'Com uma única parcela paga no ato não há prazo, então não existe juro a calcular: desmarque a opção de entrada ou aumente o número de parcelas.';
  return null;
}

/** Pré-condição: validarEntrada(e) === null. */
export function calcularAvistaParcelado(e: EntradaAvistaParcelado): ResultadoAvistaParcelado {
  const { precoAvista, parcelas: n, valorParcela: pmt, antecipada } = e;

  // Taxa implícita: o i que faz o valor presente das parcelas igualar o preço à vista.
  // Começamos em i = 0 (juro zero): a curva VP(i) é decrescente e convexa, então
  // Newton converge sempre pela esquerda da raiz.
  const { raiz, convergiu, iteracoes } = newtonRaphson(
    (i) => vpSerie(pmt, i, n, antecipada) - precoAvista,
    (i) => derivadaVpSerie(pmt, i, n, antecipada),
    0,
  );

  // Prazo médio em que o dinheiro fica aplicado: as parcelas saem nos meses 1..n
  // (ou 0..n−1 se a primeira é no ato), então a média é (n+1)/2 (ou (n−1)/2).
  const prazoMedioMeses = antecipada ? (n - 1) / 2 : (n + 1) / 2;
  const aliquotaIr = e.isento ? 0 : aliquotaIrRegressivo(Math.round(prazoMedioMeses * DIAS_POR_MES));
  const taxaLiquidaMensal = taxaMensalLiquida(e.rendimentoBrutoAnual, prazoMedioMeses, aliquotaIr);

  const vpParcelas = vpSerie(pmt, taxaLiquidaMensal, n, antecipada);
  const diferenca = vpParcelas - precoAvista;

  // Curva do valor presente em função da taxa de desconto (gráfico didático).
  const iMax = Math.max(0.03, Math.abs(raiz) * 2, taxaLiquidaMensal * 2);
  const curva: PontoCurva[] = Array.from({ length: 61 }, (_, k) => {
    const i = (iMax * k) / 60;
    return { taxa: i * 100, vp: vpSerie(pmt, i, n, antecipada) };
  });

  return {
    totalParcelado: pmt * n,
    taxaImplicita: raiz,
    taxaImplicitaAnual: mensalParaAnual(raiz),
    convergiu,
    iteracoes,
    prazoMedioMeses,
    aliquotaIr,
    taxaLiquidaMensal,
    taxaLiquidaAnual: mensalParaAnual(taxaLiquidaMensal),
    vpParcelas,
    diferenca,
    avistaMelhor: diferenca > 0,
    curva,
  };
}
