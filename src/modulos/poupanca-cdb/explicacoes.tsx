/**
 * Texto da aba Explicação do Módulo 0: muda conforme o resultado da simulação.
 */
import { Termo } from '../../componentes/Termo';
import { brl, numeroBr, percentual } from '../../utils/formatacao';
import type { EntradaPoupancaCdb, ResultadoPoupancaCdb } from './calculo';

interface Props {
  e: EntradaPoupancaCdb;
  r: ResultadoPoupancaCdb;
  /** Rentabilidade oficial da poupança no último mês, como fração; só quando as taxas são as do BC. */
  poupancaOficial?: number;
}

/** Texto da aba "Explicação": muda conforme o resultado da simulação. */
export function ExplicacaoPoupancaCdb({ e, r, poupancaOficial }: Props) {
  const confere = poupancaOficial !== undefined && Math.abs(poupancaOficial - r.poupancaMensal) < 0.00005;

  return (
    <div className="fl-texto">
      <h4>O que está sendo comparado</h4>
      <p>
        A <Termo id="poupanca">poupança</Termo> é simples e isenta de Imposto de Renda, mas rende por uma regra fixa. Um{' '}
        <Termo id="cdb">CDB</Termo> rende em função do <Termo id="cdi">CDI</Termo> e paga <Termo id="ir-regressivo">Imposto de Renda</Termo> sobre o ganho.
        Para comparar de verdade, é preciso olhar o rendimento <em>líquido</em>, depois do imposto, e acima da inflação.
      </p>

      <h4>Como a poupança rende hoje</h4>
      <p>
        {r.regime === 'selic-alta' ? (
          <>
            Com a <Termo id="selic">Selic</Termo> em {percentual(e.selic)} ao ano (acima de 8,5%), a regra legal é: <strong>0,5% ao mês mais a{' '}
            <Termo id="tr">TR</Termo></strong>. Resultado: {percentual(r.poupancaMensal, 4)} ao mês, ou {percentual(r.poupancaAnual)} ao ano.
          </>
        ) : (
          <>
            Com a <Termo id="selic">Selic</Termo> em {percentual(e.selic)} ao ano (8,5% ou menos), a regra legal muda: a poupança passa a render{' '}
            <strong>70% da Selic mais a <Termo id="tr">TR</Termo></strong>. Resultado: {percentual(r.poupancaMensal, 4)} ao mês, ou{' '}
            {percentual(r.poupancaAnual)} ao ano. Foi assim que, em 2020–2021, a poupança chegou a render menos que a inflação.
          </>
        )}{' '}
        {poupancaOficial !== undefined &&
          (confere ? (
            <>
              O Banco Central divulga {numeroBr(poupancaOficial * 100, 4)}% para o último mês: o nosso cálculo confere.
            </>
          ) : (
            <>O Banco Central divulga {numeroBr(poupancaOficial * 100, 4)}% para o último mês, um pouco diferente do cálculo, porque as datas de referência das taxas não coincidem.</>
          ))}
      </p>

      <h4>Como o CDB rende</h4>
      <p>
        Um CDB de {numeroBr(e.multiploCdi * 100, 0)}% do CDI rende {percentual(r.cdbAnualBruto)} ao ano <em>bruto</em>. Depois de {e.prazoMeses}{' '}
        meses, o Imposto de Renda leva {percentual(r.aliquotaIr, 1)} do rendimento, e é daí que vem o valor líquido de{' '}
        <strong>{brl(r.saldoFinal.cdbLiquido)}</strong> (ganho de {brl(r.ganhoCdbLiquido)}). A poupança termina com{' '}
        <strong>{brl(r.saldoFinal.poupanca)}</strong> (ganho de {brl(r.ganhoPoupanca)}).{' '}
        {r.vencedor === 'empate' ? (
          'Os dois empatam.'
        ) : (
          <>
            Em {e.prazoMeses} meses, {r.vencedor === 'cdb' ? 'o CDB' : 'a poupança'} rende{' '}
            <strong>{brl(Math.abs(r.ganhoCdbLiquido - r.ganhoPoupanca))}</strong> a mais. O CDB só perde da poupança se pagar menos de{' '}
            <strong>{numeroBr(r.multiploCdiDeEmpate * 100, 1)}% do CDI</strong> neste prazo.
          </>
        )}
      </p>

      <h4>E o ganho real?</h4>
      <p>
        Render dinheiro não basta: é preciso render mais do que os preços sobem. Com a <Termo id="ipca">inflação</Termo> acumulada de{' '}
        {percentual(r.inflacaoNoPeriodo)} no período, o ganho real (<Termo id="taxa-real">taxa real</Termo>, pela equação de Fisher) é de{' '}
        <strong>{percentual(r.retornoRealCdb)}</strong> no CDB e <strong>{percentual(r.retornoRealPoupanca)}</strong> na poupança.{' '}
        {r.retornoRealPoupanca < 0
          ? 'Um ganho real negativo significa que o dinheiro rende, mas compra menos coisas no final.'
          : 'Ganho real positivo significa que o seu poder de compra aumentou.'}
      </p>

      <h4>Como isso aparece nos outros módulos</h4>
      <p>
        O rendimento líquido que você calculou aqui é o <Termo id="custo-oportunidade">custo de oportunidade</Termo> do dinheiro, a régua usada nos Módulos 1 e 2
        para decidir entre pagar à vista ou parcelar e entre SAC e Price.
      </p>
    </div>
  );
}
