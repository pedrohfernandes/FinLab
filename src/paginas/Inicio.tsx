import { Link } from 'react-router-dom';
import { MODULOS } from '../app/modulos';
import { useTituloPagina } from '../hooks/useTituloPagina';

const ETAPAS = [
  { titulo: 'Uma situação real', texto: 'Cada módulo parte de uma pergunta do dia a dia: onde aplicar, como pagar, qual financiamento escolher.' },
  { titulo: 'Taxas de verdade', texto: 'Os valores padrão vêm do Banco Central, atualizados. Você pode alterar tudo e ver o resultado mudar na hora.' },
  { titulo: 'Veredito e explicação', texto: 'Uma resposta direta, seguida de explicação em linguagem simples, fórmulas com os seus números e o passo a passo do cálculo.' },
  { titulo: 'Relatório', texto: 'Gere um PDF da simulação, exporte as tabelas em CSV ou copie um link que reproduz o cenário.' },
];

export default function Inicio() {
  useTituloPagina('');

  return (
    <>
      <section className="fl-heroi">
        <p className="fl-etiqueta">Valor do dinheiro no tempo · Administração Financeira</p>
        <h1>
          Entenda o preço do dinheiro <span>no tempo.</span>
        </h1>
        <p className="fl-heroi-texto">
          O FinLab transforma decisões do dia a dia — aplicar, parcelar, financiar — em simulações com as taxas reais do Banco Central, e mostra a
          matemática por trás de cada resultado.
        </p>
        <div className="fl-heroi-acoes">
          <Link className="fl-botao" to={MODULOS[0].caminho}>
            Começar pelo Módulo 0
          </Link>
          <Link className="fl-botao fl-botao--leve" to={MODULOS[1].caminho}>
            Ir direto para "À vista ou parcelado?"
          </Link>
        </div>
      </section>

      <section className="fl-secao" aria-labelledby="titulo-trilha">
        <h2 id="titulo-trilha">A trilha</h2>
        <p className="fl-secao-intro">
          Os módulos têm uma ordem sugerida: o primeiro explica as taxas que os outros usam. Mas você pode abrir qualquer um.
        </p>
        <div className="fl-trilha">
          {MODULOS.map((m) => (
            <Link key={m.caminho} to={m.caminho} className="fl-cartao-modulo">
              <span className="fl-cartao-modulo-numero">Módulo {m.numero}</span>
              <h3>{m.titulo}</h3>
              <p>{m.resumo}</p>
              <ul>
                {m.conceitos.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <small>Conteúdo da disciplina: {m.capitulo}</small>
              <span className="fl-cartao-modulo-seta" aria-hidden="true">
                Abrir →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="fl-secao" aria-labelledby="titulo-como">
        <h2 id="titulo-como">Como cada módulo ensina</h2>
        <ol className="fl-etapas">
          {ETAPAS.map((etapa, i) => (
            <li key={etapa.titulo}>
              <span>{i + 1}</span>
              <div>
                <strong>{etapa.titulo}</strong>
                <p>{etapa.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="fl-secao-intro">
          Quer saber de onde vêm os dados e quais simplificações adotamos? Veja a página <Link to="/sobre">Sobre</Link>.
        </p>
      </section>
    </>
  );
}
