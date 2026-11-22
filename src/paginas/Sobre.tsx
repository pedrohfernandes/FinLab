/**
 * Página Sobre: objetivo, origem dos dados, simplificações assumidas e confiabilidade dos cálculos.
 */
import { ACOES } from '../dados/acoes';
import { SERIES } from '../dados/series';
import { useTituloPagina } from '../hooks/useTituloPagina';

export default function Sobre() {
  useTituloPagina('Sobre');

  return (
    <article className="fl-sobre">
      <header className="fl-modulo-topo">
        <span className="fl-etiqueta">Sobre o projeto</span>
        <h1>Metodologia, fontes e limites</h1>
        <p>Como o FinLab calcula, de onde vêm os dados e o que ele deliberadamente simplifica.</p>
      </header>

      <section className="fl-bloco">
        <h2>Objetivo</h2>
        <p>
          Ensinar o <strong>valor do dinheiro no tempo</strong> a partir de decisões financeiras reais do brasileiro. Trabalho 1 da
          disciplina de Administração Financeira (CAD 167, UFMG, 2º semestre de 2026). O conteúdo segue os capítulos 4 (VPL e valor do
          dinheiro no tempo) e 5 (taxas de juros) de <em>Fundamentos de Finanças Empresariais</em>, de Berk, DeMarzo e Harford.
        </p>
        <p>
          Os Módulos 3 e 4 formam o Trabalho 2, sobre <strong>gestão de investimentos</strong>: risco sistemático, beta, CAPM e diversificação de
          carteiras, conforme o capítulo 11 (Risco sistemático e prêmio de risco em ações) do mesmo livro.
        </p>
      </section>

      <section className="fl-bloco">
        <h2>De onde vêm os dados</h2>
        <p>
          Todas as taxas vêm da API pública de dados abertos do Banco Central do Brasil (Sistema Gerenciador de Séries Temporais), sem
          intermediários. O aplicativo guarda a última consulta por 6 horas e, se a internet falhar, usa uma cópia de referência salva no próprio
          projeto, sempre avisando qual das três origens está em uso (ao vivo, cache ou offline).
        </p>
        <div className="fl-tabela" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Série</th>
                <th scope="col">Código SGS</th>
                <th scope="col">Unidade</th>
                <th scope="col">Usada em</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(SERIES).map((s) => (
                <tr key={s.codigo}>
                  <td>{s.nome}</td>
                  <td>{s.codigo}</td>
                  <td>{s.unidade}</td>
                  <td>{s.usadaEm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fl-bloco">
        <h2>Preços de ações (Módulos 3 e 4)</h2>
        <p>
          Os preços mensais das 10 ações e do Ibovespa vêm do <strong>Yahoo Finance</strong>: o fechamento do último pregão de cada mês, ajustado por
          dividendos, juros sobre capital próprio e desdobramentos, de modo que a variação de um mês para o outro é o retorno total do acionista. O
          Yahoo não permite consultas diretas a partir do navegador, por isso os preços são capturados por um script do projeto (
          <code>npm run atualizar-cotacoes</code>) e gravados junto com o site, com a data da captura sempre visível. A taxa livre de risco mês a mês
          (CDI acumulado no mês, série 4391) é consultada ao vivo no Banco Central, com uma cópia gravada para quando a consulta falhar. No Módulo 3,
          também é possível enviar um CSV com os preços de qualquer outra ação; o arquivo é lido apenas no navegador.
        </p>
        <div className="fl-tabela" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Ação</th>
                <th scope="col">Empresa</th>
                <th scope="col">Setor</th>
              </tr>
            </thead>
            <tbody>
              {ACOES.map((a) => (
                <tr key={a.ticker}>
                  <td>{a.ticker}</td>
                  <td>{a.empresa}</td>
                  <td>{a.setor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fl-bloco">
        <h2>Simplificações assumidas</h2>
        <p>Simular é simplificar. Estas são as escolhas que você deve ter em mente ao interpretar os resultados:</p>
        <ul className="fl-lista">
          <li>
            <strong>Taxas constantes.</strong> Selic, CDI, TR e inflação são mantidas iguais durante todo o prazo. Na vida real, elas mudam — e
            projetar juros para anos à frente é a maior fonte de erro em qualquer decisão financeira.
          </li>
          <li>
            <strong>CDI e dias úteis.</strong> O "X% do CDI" incide sobre a taxa diária (252 dias úteis por ano) e é convertido em taxa mensal
            equivalente; feriados específicos não são considerados.
          </li>
          <li>
            <strong>Imposto de Renda.</strong> A alíquota regressiva usa 30 dias por mês. No Módulo 0, vale a do prazo total. Nos Módulos 1 e 2, o
            dinheiro é resgatado aos poucos, então usamos a alíquota do prazo médio de aplicação. Na prática, cada parcela resgatada tem o seu prazo.
          </li>
          <li>
            <strong>Poupança.</strong> Ignoramos o "aniversário" da poupança (a data de depósito que define quando o rendimento é creditado) e
            tratamos o rendimento como mensal contínuo. A regra para Selic acima de 8,5% foi conferida com a rentabilidade oficial de outubro de 2026;
            a regra para Selic abaixo foi conferida com a de março de 2021 (ver testes automatizados).
          </li>
          <li>
            <strong>Taxa nominal × efetiva.</strong> Quando uma taxa é anual, o Módulo 2 deixa você escolher a convenção (nominal ÷ 12, como nos
            slides do Cap. 5, ou efetiva/equivalente), pois ela muda o resultado.
          </li>
          <li>
            <strong>Fora do escopo.</strong> IOF, tarifas, seguros, correção do saldo devedor pela TR nos financiamentos e valorização de bens
            não entram nas contas.
          </li>
          <li>
            <strong>Beta e mercado (Módulos 3 e 4).</strong> O Ibovespa representa a carteira de mercado e o CDI, a taxa livre de risco, como sugere o
            slide 11.3. O beta é estimado por regressão linear com 5 anos de retornos mensais (60 meses); é uma estimativa com erro, e o intervalo de
            confiança mostrado usa a aproximação β ± 2 erros padrão.
          </li>
          <li>
            <strong>Prêmio de mercado.</strong> O CAPM precisa do prêmio esperado, que não é observável. O padrão de 5% ao ano é uma premissa didática,
            editável. O prêmio realizado nos últimos 5 anos é mostrado para comparação, mas não é usado como expectativa: em períodos curtos ele oscila
            muito e pode até ser negativo.
          </li>
          <li>
            <strong>Anualização.</strong> Médias mensais viram taxas anuais equivalentes, (1 + r)<sup>12</sup> − 1; volatilidades são multiplicadas por
            √12 e covariâncias por 12, o que supõe retornos mensais independentes.
          </li>
          <li>
            <strong>Carteiras.</strong> Só posições compradas (pesos de 0% a 100%), rebalanceadas todo mês, sem custos de corretagem nem impostos. A
            nuvem de carteiras aleatórias usa uma semente fixa, para que o relatório seja reproduzível.
          </li>
        </ul>
      </section>

      <section className="fl-bloco">
        <h2>Confiabilidade dos cálculos</h2>
        <p>
          Todas as funções de matemática financeira ficam em uma pasta isolada do restante do aplicativo, com comentários explicando cada fórmula, e são
          cobertas por testes automatizados que usam exemplos dos slides da disciplina e valores oficiais do Banco Central.
        </p>
      </section>
    </article>
  );
}
