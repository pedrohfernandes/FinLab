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
