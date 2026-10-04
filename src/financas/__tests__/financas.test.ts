/**
 * Casos de referência do domínio financeiro.
 *
 * Os valores esperados vêm de (a) exemplos dos slides do Cap. 5, (b) fórmulas
 * fechadas conferidas por cálculo independente e (c) valores oficiais do
 * Banco Central (série SGS 195 — rentabilidade da poupança).
 */
import { describe, expect, it } from 'vitest';
import { aliquotaIrRegressivo, fatorBrutoNecessario, fatorLiquido, taxaMensalLiquida } from '../impostos';
import { derivadaVpSerie, valorFuturo, valorPresente, vpSerie } from '../fluxos';
import { newtonRaphson } from '../raizes';
import { pmtPrice, tabelaAmortizacao, totaisAmortizacao, vpDasParcelas } from '../amortizacao';
import { baseMensalPoupanca, rendimentoPoupancaMensal } from '../poupanca';
import { anualParaMensal, fisher, mensalParaAnual, percentualDoCdi, taxaCdbAnual, taxaMensalDe } from '../taxas';

describe('taxas', () => {
  it('converte taxa anual em mensal equivalente e volta', () => {
    expect(anualParaMensal(0.12)).toBeCloseTo(0.009488793, 8);
    expect(mensalParaAnual(anualParaMensal(0.1365))).toBeCloseTo(0.1365, 12);
    expect(mensalParaAnual(0.01)).toBeCloseTo(0.126825, 6); // 1% a.m. ≠ 12% a.a.
  });

  it('taxa nominal é proporcional (convenção dos slides do Cap. 5)', () => {
    expect(taxaMensalDe(0.63, 'anual-nominal')).toBeCloseTo(0.0525, 12);
    expect(taxaMensalDe(0.12, 'anual-efetiva')).toBeCloseTo(anualParaMensal(0.12), 12);
    expect(taxaMensalDe(0.01, 'mensal')).toBe(0.01);
  });

  it('equação de Fisher', () => {
    expect(fisher(0.1365, 0.0422)).toBeCloseTo(0.0904817, 6);
    expect(fisher(0.05, 0.05)).toBeCloseTo(0, 12);
  });

  it('CDB a X% do CDI incide sobre a taxa diária', () => {
    expect(taxaCdbAnual(0.1365, 1)).toBeCloseTo(0.1365, 12);
    expect(taxaCdbAnual(0.1365, 1.1)).toBeCloseTo(0.1511312, 6);
    expect(percentualDoCdi(taxaCdbAnual(0.1365, 0.85), 0.1365)).toBeCloseTo(0.85, 12);
  });
});

describe('impostos', () => {
  it('alíquota regressiva nos limites de dias', () => {
    expect(aliquotaIrRegressivo(180)).toBe(0.225);
    expect(aliquotaIrRegressivo(181)).toBe(0.2);
    expect(aliquotaIrRegressivo(360)).toBe(0.2);
    expect(aliquotaIrRegressivo(361)).toBe(0.175);
    expect(aliquotaIrRegressivo(720)).toBe(0.175);
    expect(aliquotaIrRegressivo(721)).toBe(0.15);
  });

  it('fator líquido e sua inversa', () => {
    expect(fatorLiquido(1.1, 0.2)).toBeCloseTo(1.08, 12);
    expect(fatorBrutoNecessario(fatorLiquido(1.23, 0.175), 0.175)).toBeCloseTo(1.23, 12);
  });

  it('taxa mensal líquida de 13,65% a.a. por 24 meses com IR de 15%', () => {
    expect(taxaMensalLiquida(0.1365, 24, 0.15)).toBeCloseTo(0.00926987, 8);
  });
});

describe('fluxos', () => {
  it('valor futuro e presente são inversos', () => {
    expect(valorFuturo(1000, 0.01, 12)).toBeCloseTo(1126.825, 3);
    expect(valorPresente(valorFuturo(1000, 0.01, 12), 0.01, 12)).toBeCloseTo(1000, 9);
  });

  it('VP de série: forma fechada coincide com a soma termo a termo', () => {
    const soma = Array.from({ length: 10 }, (_, t) => 120 / Math.pow(1.01, t + 1)).reduce((a, b) => a + b, 0);
    expect(vpSerie(120, 0.01, 10)).toBeCloseTo(soma, 9);
    expect(vpSerie(120, 0.01, 10)).toBeCloseTo(1136.5565, 3);
  });

  it('série antecipada vale (1 + i) vezes a postecipada; taxa zero soma as parcelas', () => {
    expect(vpSerie(120, 0.01, 10, true)).toBeCloseTo(vpSerie(120, 0.01, 10) * 1.01, 9);
    expect(vpSerie(120, 0, 10)).toBe(1200);
  });

  it('derivada analítica confere com derivada numérica', () => {
    const h = 1e-7;
    const numerica = (vpSerie(120, 0.02 + h, 10) - vpSerie(120, 0.02 - h, 10)) / (2 * h);
    expect(derivadaVpSerie(120, 0.02, 10)).toBeCloseTo(numerica, 3);
  });
});

describe('Newton-Raphson', () => {
  it('encontra a taxa implícita de 10 × R$ 120 contra R$ 1.080 à vista', () => {
    const r = newtonRaphson(
      (i) => vpSerie(120, i, 10) - 1080,
      (i) => derivadaVpSerie(120, i, 10),
      0,
    );
    expect(r.convergiu).toBe(true);
    expect(r.raiz).toBeCloseTo(0.01962998, 7);
    expect(r.iteracoes[0].x).toBe(0); // começa supondo juros zero
  });

  it('com a 1ª parcela no ato a taxa implícita é maior', () => {
    const r = newtonRaphson(
      (i) => vpSerie(120, i, 10, true) - 1080,
      (i) => derivadaVpSerie(120, i, 10, true),
      0,
    );
    expect(r.raiz).toBeCloseTo(0.02422732, 7);
  });

  it('raiz de uma função simples: x² − 2 = 0', () => {
    const r = newtonRaphson((x) => x * x - 2, (x) => 2 * x, 1);
    expect(r.raiz).toBeCloseTo(Math.SQRT2, 9);
  });
});

describe('amortização', () => {
  it('SAC — Exemplo 1 do Cap. 5: R$ 10.000, 4% a.m., 4 parcelas', () => {
    const t = tabelaAmortizacao(10000, 0.04, 4, 'SAC');
    expect(t.map((l) => l.juros)).toEqual([400, 300, 200, 100]);
    expect(t.map((l) => l.parcela)).toEqual([2900, 2800, 2700, 2600]);
    expect(t[3].saldoFinal).toBe(0);
  });

  it('SAC — Exemplo 2 do Cap. 5: R$ 60.000, 63% a.a. nominal, 4 meses → R$ 7.875 de juros', () => {
    const t = tabelaAmortizacao(60000, taxaMensalDe(0.63, 'anual-nominal'), 4, 'SAC');
    expect(totaisAmortizacao(t).juros).toBeCloseTo(7875, 6);
  });

  it('Price — parcela fixa de R$ 888,49 para R$ 10.000, 1% a.m., 12 meses', () => {
    expect(pmtPrice(10000, 0.01, 12)).toBeCloseTo(888.48789, 4);
    const t = tabelaAmortizacao(10000, 0.01, 12, 'PRICE');
    expect(new Set(t.map((l) => l.parcela.toFixed(6))).size).toBe(1);
    expect(t[11].saldoFinal).toBe(0);
  });

  it('Price — exemplo do slide: R$ 40.000, 15% a.a. nominal, 60 meses → R$ 951,60', () => {
    expect(pmtPrice(40000, 0.15 / 12, 60)).toBeCloseTo(951.5972, 3);
  });

  it('SAC paga R$ 650,00 de juros e Price R$ 661,85 (R$ 10.000, 1% a.m., 12 meses)', () => {
    expect(totaisAmortizacao(tabelaAmortizacao(10000, 0.01, 12, 'SAC')).juros).toBeCloseTo(650, 6);
    expect(totaisAmortizacao(tabelaAmortizacao(10000, 0.01, 12, 'PRICE')).juros).toBeCloseTo(661.8546, 3);
  });

  it('equivalência: descontadas pela taxa do contrato, SAC e Price valem o valor financiado', () => {
    const sac = tabelaAmortizacao(10000, 0.01, 12, 'SAC');
    const price = tabelaAmortizacao(10000, 0.01, 12, 'PRICE');
    expect(vpDasParcelas(sac, 0.01)).toBeCloseTo(10000, 6);
    expect(vpDasParcelas(price, 0.01)).toBeCloseTo(10000, 6);
  });

  it('a amortização total sempre devolve o principal', () => {
    for (const sistema of ['SAC', 'PRICE'] as const) {
      const t = tabelaAmortizacao(25000, 0.0173, 48, sistema);
      expect(totaisAmortizacao(t).amortizacao).toBeCloseTo(25000, 6);
    }
  });

  it('taxa zero: parcelas iguais ao principal dividido pelo prazo', () => {
    expect(pmtPrice(1200, 0, 12)).toBe(100);
  });
});

describe('poupança', () => {
  it('Selic alta: 0,5% a.m. + TR (valor oficial do BC em 01/10/2026: 0,6624%)', () => {
    expect(baseMensalPoupanca(0.1375)).toBe(0.005);
    expect(rendimentoPoupancaMensal(0.1375, 0.001616)).toBeCloseTo(0.006624, 6);
  });

  it('Selic baixa: 70% da Selic mensalizada (valor oficial do BC em 15/03/2021: 0,1159%, Selic 2,00%, TR 0)', () => {
    expect(rendimentoPoupancaMensal(0.02, 0)).toBeCloseTo(0.001159, 6);
  });

  it('o limite de 8,5% pertence ao regime de Selic baixa', () => {
    expect(baseMensalPoupanca(0.085)).toBeCloseTo(Math.pow(1 + 0.7 * 0.085, 1 / 12) - 1, 12);
    expect(baseMensalPoupanca(0.0851)).toBe(0.005);
  });
});
