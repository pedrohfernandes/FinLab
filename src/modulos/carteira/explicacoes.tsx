/**
 * Texto da aba Explicação do Módulo 4: muda conforme a carteira montada.
 */
import { Termo } from '../../componentes/Termo';
import { numeroBr, percentual } from '../../utils/formatacao';
import type { EntradaCarteira, ResultadoCarteira } from './calculo';

export function ExplicacaoCarteira({ e, r }: { e: EntradaCarteira; r: ResultadoCarteira }) {
  const c = r.carteira;
  const n = r.ativos.length;
  const ganho = c.volatilidadeSemDiversificacao - c.volatilidade;

  // Par mais e menos correlacionado, para exemplificar.
  let maior = { i: 0, j: 0, valor: -Infinity };
  let menor = { i: 0, j: 0, valor: Infinity };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const v = r.correlacoes[i][j];
      if (v > maior.valor) maior = { i, j, valor: v };
      if (v < menor.valor) menor = { i, j, valor: v };
    }
  }
  const nome = (i: number) => r.ativos[i].ticker;

  return (
    <div className="fl-texto">
      <h4>O retorno se soma; o risco, não</h4>
      <p>
        O retorno esperado da carteira é simplesmente a média ponderada dos retornos das ações: {percentual(c.retornoEsperado)} ao ano. Com o risco é
        diferente. Se as ações subissem e caíssem sempre juntas (<Termo id="correlacao">correlação</Termo> 1), a{' '}
        <Termo id="volatilidade">volatilidade</Termo> da carteira seria a média ponderada das volatilidades: {percentual(c.volatilidadeSemDiversificacao)}.
        {n > 1 ? (
          <>
            {' '}
            Mas ela é de <strong>{percentual(c.volatilidade)}</strong>: a <Termo id="diversificacao">diversificação</Termo> eliminou{' '}
            <strong>{numeroBr(ganho * 100, 1)} pontos percentuais</strong> de risco sem custar nada de retorno esperado.
          </>
        ) : (
          ' Com uma ação só, não há o que compensar: o risco da carteira é o risco da ação.'
        )}
      </p>

      {n > 1 && (
        <>
          <h4>Por que funciona: as ações não andam juntas o tempo todo</h4>
          <p>
            Quando uma ação tem um mês ruim por um motivo só dela, outra pode ter um mês bom. O quanto isso acontece é medido pela correlação.
            {n > 2 || maior.valor !== menor.valor ? (
              <>
                {' '}
                Nesta carteira, o par mais parecido é {nome(maior.i)} e {nome(maior.j)} (correlação {numeroBr(maior.valor)}); o mais diferente é{' '}
                {nome(menor.i)} e {nome(menor.j)} ({numeroBr(menor.valor)}). Pares com correlação baixa são os que mais reduzem o risco (slide 11.2).
              </>
            ) : (
              <> A correlação entre as duas é de {numeroBr(maior.valor)}: quanto mais longe de 1, maior a redução de risco (slide 11.2).</>
            )}
          </p>
        </>
      )}

      {r.pisoDiversificacao !== null && (
        <>
          <h4>Até onde dá para diversificar?</h4>
          <p>
            O gráfico de diversificação mostra uma carteira com pesos iguais e cada vez mais ações parecidas com as escolhidas. A volatilidade cai rápido
            no início e depois se estabiliza perto de <strong>{percentual(r.pisoDiversificacao, 1)}</strong>. Esse piso é o{' '}
            <Termo id="risco-sistematico">risco sistemático</Termo>: o que todas as ações têm em comum (juros, economia, política). Ele não some, por mais
            ações que se acrescente.
          </p>
        </>
      )}

      <h4>O risco que sobra é o que o mercado paga</h4>
      <p>
        O <Termo id="beta">beta</Termo> da carteira é a média ponderada dos betas: <strong>{numeroBr(c.beta)}</strong> (a regressão da série de retornos
        da própria carteira dá {numeroBr(c.betaPorRegressao)}, o mesmo número). Ele mede justamente o risco que a diversificação não elimina.
        No período, {percentual(c.sistematico, 0)} da variância da carteira acompanhou o Ibovespa.{' '}
        {e.base === 'capm'
          ? `Como os retornos esperados vêm do CAPM, a carteira deve render CDI + β da carteira × prêmio = ${percentual(c.retornoEsperado)} ao ano: quem diversifica corre menos risco total e recebe o mesmo retorno, pois só o beta é remunerado.`
          : 'Os retornos esperados aqui são as médias históricas: lembre-se de que 5 anos de retornos passados são uma estimativa muito ruidosa do futuro.'}
      </p>

      {n > 1 && (
        <>
          <h4>Carteiras aleatórias</h4>
          <p>
            A nuvem cinza mostra {r.nuvem.length.toLocaleString('pt-BR')} combinações sorteadas das mesmas ações, como no gráfico do slide 11.4. Entre
            elas, a de menor risco tem volatilidade de {percentual(r.menorRisco.volatilidade)} e retorno esperado de {percentual(r.menorRisco.retorno)}. As
            carteiras na borda de cima e à esquerda são as mais eficientes: nenhuma outra dá mais retorno com o mesmo risco.
          </p>
        </>
      )}
    </div>
  );
}
