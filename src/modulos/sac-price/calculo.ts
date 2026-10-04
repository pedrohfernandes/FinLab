/**
 * Módulo 2 — SAC ou Price?
 *
 * Pergunta: com o mesmo valor, a mesma taxa e o mesmo prazo, qual sistema de
 * amortização é melhor? A resposta surpreende: na taxa do contrato, os dois valem
 * o mesmo; o que decide é o seu custo de oportunidade.
 */
import { tabelaAmortizacao, totaisAmortizacao, vpDasParcelas, type LinhaAmortizacao } from '../../financas/amortizacao';
import { anualParaMensal, taxaMensalDe, type TipoTaxa } from '../../financas/taxas';

export interface EntradaSacPrice {
  principal: number;
  /** Taxa do contrato, como fração, na convenção de `tipoTaxa`. */
  taxa: number;
  tipoTaxa: TipoTaxa;
  prazo: number;
  /** Quanto o seu dinheiro renderia, líquido de IR, ao ano (fração). */
  custoOportunidadeAnual: number;
}

export interface ResultadoSacPrice {
  taxaMensal: number;
  taxaOportunidadeMensal: number;
  sac: LinhaAmortizacao[];
  price: LinhaAmortizacao[];
  jurosSac: number;
  jurosPrice: number;
  vpSacNoContrato: number;
  vpPriceNoContrato: number;
  vpSacNaOportunidade: number;
  vpPriceNaOportunidade: number;
  /** Qual sistema custa menos em valor presente ao custo de oportunidade do usuário. */
  maisBarato: 'SAC' | 'PRICE' | 'igual';
  /** Diferença de valor presente entre os dois sistemas ao custo de oportunidade. */
  economia: number;
}

export const PRAZO_MAXIMO_MESES = 360;

export function validarEntrada(e: EntradaSacPrice): string | null {
  if (!(e.principal > 0)) return 'Informe um valor emprestado maior que zero.';
  if (!(e.taxa >= 0)) return 'A taxa de juros não pode ser negativa.';
  if (!Number.isInteger(e.prazo) || e.prazo < 1 || e.prazo > PRAZO_MAXIMO_MESES)
    return `O prazo deve ser um número inteiro de meses entre 1 e ${PRAZO_MAXIMO_MESES}.`;
  return null;
}

/** Pré-condição: validarEntrada(e) === null. */
export function calcularSacPrice(e: EntradaSacPrice): ResultadoSacPrice {
  const taxaMensal = taxaMensalDe(e.taxa, e.tipoTaxa);
  const taxaOportunidadeMensal = anualParaMensal(e.custoOportunidadeAnual);

  const sac = tabelaAmortizacao(e.principal, taxaMensal, e.prazo, 'SAC');
  const price = tabelaAmortizacao(e.principal, taxaMensal, e.prazo, 'PRICE');

  const vpSacNaOportunidade = vpDasParcelas(sac, taxaOportunidadeMensal);
  const vpPriceNaOportunidade = vpDasParcelas(price, taxaOportunidadeMensal);
  const diferenca = vpSacNaOportunidade - vpPriceNaOportunidade;

  return {
    taxaMensal,
    taxaOportunidadeMensal,
    sac,
    price,
    jurosSac: totaisAmortizacao(sac).juros,
    jurosPrice: totaisAmortizacao(price).juros,
    vpSacNoContrato: vpDasParcelas(sac, taxaMensal),
    vpPriceNoContrato: vpDasParcelas(price, taxaMensal),
    vpSacNaOportunidade,
    vpPriceNaOportunidade,
    maisBarato: Math.abs(diferenca) < 0.005 ? 'igual' : diferenca < 0 ? 'SAC' : 'PRICE',
    economia: Math.abs(diferenca),
  };
}
