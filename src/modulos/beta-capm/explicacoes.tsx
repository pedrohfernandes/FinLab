/**
 * Texto da aba Explicação do Módulo 3: muda conforme a ação e o resultado.
 */
import { Termo } from '../../componentes/Termo';
import { numeroBr, percentual } from '../../utils/formatacao';
import type { EntradaBetaCapm, ResultadoBetaCapm } from './calculo';

export function ExplicacaoBetaCapm({ e, r, nomeAcao }: { e: EntradaBetaCapm; r: ResultadoBetaCapm; nomeAcao: string }) {
  const { beta, r2, alfa } = r.regressao;
  const [betaMin, betaMax] = r.intervaloBeta;
  const meses = r.regressao.n;
  const premioHistoricoNegativo = r.historico.premioMercado <= 0;
  // Desempenho do período comparado com o que o CAPM "pediria" com os dados do próprio período.
  const exigidoNoPeriodo = r.historico.livreDeRisco + beta * r.historico.premioMercado;

  return (
    <div className="fl-texto">
      <h4>O que o beta diz sobre {nomeAcao}</h4>
      <p>
        O <Termo id="beta">beta</Termo> mede quanto a ação costuma se mover quando o mercado se move. Com β = <strong>{numeroBr(beta)}</strong>,
        quando o Ibovespa sobe ou cai 1% além do CDI, {nomeAcao} tende a subir ou cair cerca de <strong>{numeroBr(beta)}%</strong> além do CDI.{' '}
        {r.perfil === 'defensiva' && 'É uma ação defensiva: amortece os movimentos do mercado.'}
        {r.perfil === 'neutra' && 'Ela acompanha o mercado de perto.'}
        {r.perfil === 'agressiva' && 'É uma ação agressiva: amplifica os movimentos do mercado, nas altas e nas quedas.'}
      </p>
      <p>
        Esse número é uma <strong>estimativa</strong> feita com {meses} meses de dados, não uma constante da empresa. Com cerca de 95% de confiança,
        o beta verdadeiro está entre <strong>{numeroBr(betaMin)}</strong> e <strong>{numeroBr(betaMax)}</strong>.
        {betaMax - betaMin > 0.8 && ' É um intervalo largo: os retornos dessa ação têm muito ruído próprio, e o beta deve ser usado com cautela.'}
      </p>

      <h4>Risco sistemático × risco específico</h4>
      <p>
        Só <strong>{percentual(r2, 0)}</strong> da variação mensal de {nomeAcao} acompanha o mercado — esse é o{' '}
        <Termo id="risco-sistematico">risco sistemático</Termo> (o R² da regressão). Os outros <strong>{percentual(1 - r2, 0)}</strong> vêm de
        notícias da própria empresa ou do setor: é o <Termo id="risco-especifico">risco específico</Termo>.
      </p>
      <p>
        A diferença importa porque o risco específico pode ser eliminado de graça: basta ter várias ações em carteira, e as surpresas boas de umas
        compensam as ruins de outras (veja o Módulo 4). Por isso o mercado <strong>não paga</strong> por ele. Só o risco sistemático, que nenhuma
        diversificação remove, exige um prêmio. É essa a ideia central do CAPM.
      </p>

      <h4>O retorno que a ação precisa oferecer (CAPM)</h4>
      <p>
        Pela <Termo id="sml">Linha do Mercado de Títulos</Termo>, quem investe em {nomeAcao} deve exigir a taxa livre de risco de hoje (
        {percentual(e.livreDeRiscoAtual)}, o CDI) mais β vezes o <Termo id="premio-mercado">prêmio de mercado</Termo> ({percentual(e.premioMercado)}):{' '}
        <strong>{percentual(r.retornoExigido)} ao ano</strong>. Esse é também o <strong>custo do capital próprio</strong> da empresa — o retorno que ela
        precisa entregar aos acionistas (Cap. 12).
      </p>

      <h4>Por que o prêmio de mercado não vem do histórico?</h4>
      <p>
        O CAPM usa o prêmio <strong>esperado</strong>, olhando para frente. O histórico deste período dá{' '}
        <strong>{percentual(r.historico.premioMercado)} ao ano</strong>: o Ibovespa rendeu {percentual(r.historico.retornoMercado)} a.a. e o CDI{' '}
        {percentual(r.historico.livreDeRisco)} a.a.
        {premioHistoricoNegativo
          ? ' A bolsa rendeu MENOS que a renda fixa. Usar esse número no CAPM daria a conclusão absurda de que ações de maior risco deveriam render menos que o CDI. Nenhum investidor compraria ações esperando isso; o que aconteceu foi um período ruim, não uma expectativa.'
          : ' Mesmo positivo, um prêmio medido em poucos anos oscila muito de um período para outro e é um estimador pobre da expectativa de longo prazo.'}{' '}
        Por isso o prêmio é uma premissa sua, editável nos parâmetros.
      </p>

      <h4>E o desempenho passado?</h4>
      <p>
        No período, {nomeAcao} rendeu {percentual(r.historico.retornoAcao)} ao ano. Com o CDI e o prêmio que de fato ocorreram, o CAPM indicaria{' '}
        {percentual(exigidoNoPeriodo)}. O intercepto da regressão (α = {percentual(alfa, 2)} ao mês) mede essa diferença mês a mês.{' '}
        {Math.abs(alfa) < 2 * r.regressao.erroPadraoAlfa
          ? 'Ele não é estatisticamente diferente de zero (está dentro de 2 erros padrão): não dá para afirmar que a ação bateu ou perdeu do CAPM — a diferença cabe no acaso.'
          : alfa > 0
            ? 'Ele é estatisticamente positivo: a ação rendeu mais do que o seu risco sistemático justificaria neste período. Isso descreve o passado e não garante nada para o futuro.'
            : 'Ele é estatisticamente negativo: a ação rendeu menos do que o seu risco sistemático justificaria neste período. Isso descreve o passado e não garante nada para o futuro.'}
      </p>
    </div>
  );
}
