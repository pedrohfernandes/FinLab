/**
 * Texto da aba Explicação do Módulo 2: muda conforme o resultado da simulação.
 */
import { Termo } from '../../componentes/Termo';
import { anualParaMensal } from '../../financas/taxas';
import { brl, percentual } from '../../utils/formatacao';
import type { EntradaSacPrice, ResultadoSacPrice } from './calculo';

/** Texto da aba "Explicação": muda conforme o resultado da simulação. */
export function ExplicacaoSacPrice({ e, r }: { e: EntradaSacPrice; r: ResultadoSacPrice }) {
  const primeiraSac = r.sac[0].parcela;
  const ultimaSac = r.sac[r.sac.length - 1].parcela;
  const parcelaPrice = r.price[0].parcela;
  const custoMaiorQueContrato = r.taxaOportunidadeMensal > r.taxaMensal;

  return (
    <div className="fl-texto">
      <h4>Duas formas de devolver o mesmo empréstimo</h4>
      <p>
        Em qualquer financiamento, cada parcela tem duas partes: os <strong>juros</strong> do mês (taxa × <Termo id="saldo-devedor">saldo devedor</Termo>) e
        a <Termo id="amortizacao">amortização</Termo>, que é o que realmente reduz a dívida. A diferença entre SAC e Price está só em como essa
        divisão é feita.
      </p>
      <ul>
        <li>
          <strong><Termo id="sac">SAC</Termo>:</strong> a amortização é igual todo mês. Como a dívida cai rápido, os juros caem junto e a
          parcela vai diminuindo, de <strong>{brl(primeiraSac)}</strong> até <strong>{brl(ultimaSac)}</strong>.
        </li>
        <li>
          <strong><Termo id="price">Price</Termo>:</strong> a parcela é sempre <strong>{brl(parcelaPrice)}</strong>. No começo quase tudo é
          juros; a amortização cresce aos poucos.
        </li>
      </ul>

      <h4>Por que a Price paga mais juros?</h4>
      <p>
        Porque ela devolve o principal mais devagar: você fica mais tempo devendo o dinheiro do banco. No total, o SAC paga{' '}
        <strong>{brl(r.jurosSac)}</strong> de juros e a Price paga <strong>{brl(r.jurosPrice)}</strong> — uma diferença de{' '}
        <strong>{brl(r.jurosPrice - r.jurosSac)}</strong>.
      </p>

      <h4>Mas isso significa que a Price é pior?</h4>
      <p>
        Não necessariamente. R$ 1 pago daqui a 10 anos vale menos que R$ 1 pago hoje, então somar parcelas de épocas diferentes é
        enganoso. O correto é trazer todas para hoje (<Termo id="valor-presente">valor presente</Termo>). Fazendo isso com a própria taxa do contrato
        ({percentual(r.taxaMensal)} ao mês), os dois sistemas valem exatamente o valor emprestado, <strong>{brl(e.principal)}</strong>. Os juros
        a mais da Price são o preço de ficar mais tempo com o dinheiro, e não um prejuízo escondido.
      </p>

      <h4>O que decide, então?</h4>
      <p>
        O seu <Termo id="custo-oportunidade">custo de oportunidade</Termo>: quanto o dinheiro que sobra no seu bolso renderia. Com um rendimento de{' '}
        {percentual(r.taxaOportunidadeMensal)} ao mês
        {custoMaiorQueContrato ? ' (maior que a taxa do empréstimo)' : ' (menor que a taxa do empréstimo)'},
        {r.maisBarato === 'igual' ? (
          ' os dois sistemas têm o mesmo custo em valor presente.'
        ) : (
          <>
            {' '}
            o <strong>{r.maisBarato === 'SAC' ? 'SAC' : 'Price'}</strong> custa menos em valor presente: <strong>{brl(r.economia)}</strong> a menos.
            {r.maisBarato === 'SAC'
              ? ' Como o seu dinheiro rende menos do que a dívida custa, compensa quitar o principal mais cedo.'
              : ' Como o seu dinheiro rende mais do que a dívida custa, compensa pagar mais devagar e deixar a diferença aplicada.'}
          </>
        )}{' '}
        Como bancos costumam cobrar mais do que o mercado paga a quem aplica, o caso mais comum é o SAC levar vantagem.
      </p>

      <h4>E na prática?</h4>
      <p>
        A parcela inicial do SAC é {brl(primeiraSac - parcelaPrice)} maior que a da Price. Se o orçamento do começo do contrato é
        apertado, a Price pode ser a única que cabe; se a renda tende a crescer, o SAC alivia com o tempo. Escolher entre os dois é uma
        decisão de fluxo de caixa, não de "qual é mais barato".
      </p>

      {e.tipoTaxa !== 'mensal' && (
        <>
          <h4>Cuidado com o jeito de informar a taxa</h4>
          <p>
            "{percentual(e.taxa)} ao ano" pode significar duas taxas mensais diferentes. Na forma <Termo id="taxa-nominal">nominal</Termo> divide-se por 12:{' '}
            {percentual(e.taxa / 12, 4)} ao mês. Na forma efetiva, usa-se a <Termo id="taxa-equivalente">taxa equivalente</Termo>:{' '}
            {percentual(anualParaMensal(e.taxa), 4)} ao mês. Você está usando a forma{' '}
            <strong>{e.tipoTaxa === 'anual-nominal' ? 'nominal' : 'efetiva'}</strong>; confira no contrato qual vale para o seu caso.
          </p>
        </>
      )}
    </div>
  );
}
