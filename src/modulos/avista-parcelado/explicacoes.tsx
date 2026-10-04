import { Termo } from '../../componentes/Termo';
import { brl, meses, percentual } from '../../utils/formatacao';
import type { EntradaAvistaParcelado, ResultadoAvistaParcelado } from './calculo';

/** Texto da aba "Explicação": muda conforme o resultado da simulação. */
export function ExplicacaoAvistaParcelado({ e, r }: { e: EntradaAvistaParcelado; r: ResultadoAvistaParcelado }) {
  const semJuros = r.taxaImplicita <= 0;

  return (
    <div className="fl-texto">
      <h4>Todo parcelamento é um empréstimo</h4>
      <p>
        Quando a loja oferece {brl(e.precoAvista)} à vista ou {e.parcelas}× de {brl(e.valorParcela)}, ela está dizendo: "se você não
        pagar hoje, eu financio a compra e você me devolve {brl(r.totalParcelado)} aos poucos".{' '}
        {semJuros ? (
          <>
            Aqui as parcelas somam <strong>{brl(r.totalParcelado)}</strong>, que não passa do preço à vista: não há juros embutidos. É
            um parcelamento realmente sem juros.
          </>
        ) : (
          <>
            A diferença de <strong>{brl(r.totalParcelado - e.precoAvista)}</strong> são juros, mesmo que o anúncio diga "sem juros".
          </>
        )}
      </p>

      {!semJuros && (
        <>
          <h4>Qual é a <Termo id="taxa-implicita">taxa implícita</Termo>?</h4>
          <p>
            É a taxa de juros que, aplicada ao preço à vista, gera exatamente essas parcelas. Aqui ela é de{' '}
            <strong>{percentual(r.taxaImplicita)} ao mês</strong>, o que equivale a <strong>{percentual(r.taxaImplicitaAnual)} ao ano</strong>{' '}
            (<Termo id="taxa-equivalente">taxa equivalente</Termo>). Não existe fórmula direta para achá-la: ela é calculada por
            aproximações sucessivas com o método de <Termo id="newton-raphson">Newton-Raphson</Termo>
            {r.convergiu ? `, que chegou ao resultado em ${r.iteracoes.length} passos` : ''}. Veja a aba "Passo a passo".
          </p>
        </>
      )}

      <h4>E o que o seu dinheiro renderia?</h4>
      <p>
        Se, em vez de pagar tudo agora, você deixar o dinheiro aplicado a {percentual(e.rendimentoBrutoAnual)} ao ano
        {e.isento ? ' (isento de IR)' : <>, o <Termo id="ir-regressivo">Imposto de Renda</Termo> leva {percentual(r.aliquotaIr, 1)} do
          rendimento (o dinheiro fica, em média, {meses(Math.round(r.prazoMedioMeses * 10) / 10)} aplicado)</>}
        . Sobra um rendimento líquido de <strong>{percentual(r.taxaLiquidaMensal)} ao mês</strong> — esse é o seu{' '}
        <Termo id="custo-oportunidade">custo de oportunidade</Termo>.
      </p>

      <h4>Comparando as duas taxas</h4>
      <p>
        {semJuros ? (
          <>Como o parcelamento não cobra juros, ele só tem vantagem: você paga depois e o dinheiro rende enquanto isso.</>
        ) : r.taxaImplicita > r.taxaLiquidaMensal ? (
          <>
            O parcelamento cobra <strong>{percentual(r.taxaImplicita)}</strong> ao mês e o seu dinheiro rende só{' '}
            <strong>{percentual(r.taxaLiquidaMensal)}</strong>. Ou seja, parcelar custa mais do que a aplicação devolve. Trazendo as
            parcelas para hoje, elas valem <strong>{brl(r.vpParcelas)}</strong>, contra {brl(e.precoAvista)} à vista: pagar à vista
            economiza o equivalente a <strong>{brl(r.diferenca)}</strong> em reais de hoje.
          </>
        ) : (
          <>
            O parcelamento cobra <strong>{percentual(r.taxaImplicita)}</strong> ao mês e o seu dinheiro rende{' '}
            <strong>{percentual(r.taxaLiquidaMensal)}</strong>. Ou seja, os juros do parcelamento são menores do que a aplicação paga.
            As parcelas valem <strong>{brl(r.vpParcelas)}</strong> em reais de hoje, contra {brl(e.precoAvista)} à vista: parcelar e
            manter o dinheiro aplicado rende o equivalente a <strong>{brl(-r.diferenca)}</strong> a mais.
          </>
        )}
      </p>

      <h4>O que a conta não mostra</h4>
      <p>
        A matemática compara só dinheiro. Na vida real, pesam também a disciplina (o dinheiro aplicado vai mesmo ficar intocado?), o
        risco de o rendimento ser menor do que o esperado e a possibilidade de negociar um desconto à vista maior. Se você não tem o
        dinheiro, o parcelamento é a única opção, e então vale comparar as taxas embutidas entre lojas.
      </p>
    </div>
  );
}
