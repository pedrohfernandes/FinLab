/**
 * Página do Módulo 4 — Diversificar reduz o risco?: parâmetros, resultados e abas didáticas.
 * Só interface; os cálculos ficam em calculo.ts.
 */
import { useMemo } from 'react';
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AcoesRelatorio } from '../../componentes/AcoesRelatorio';
import { CampoNumerico, CampoSelecao } from '../../componentes/Campos';
import { FonteCotacoes } from '../../componentes/FonteCotacoes';
import { ListaFormulas } from '../../componentes/Formula';
import { ModuloLayout } from '../../componentes/ModuloLayout';
import { AbasDidaticas, CartaoKpi, Grafico, GradeKpis, ParaLevar, Tabela, Veredito } from '../../componentes/Resultados';
import { ACOES } from '../../dados/acoes';
import { COTACOES, useLivreDeRiscoMensal } from '../../dados/cotacoes';
import { useTaxas } from '../../dados/TaxasContext';
import { useParametrosUrl } from '../../hooks/useParametrosUrl';
import { CORES } from '../../utils/cores';
import { brl, mesAno, numeroBr, percentual } from '../../utils/formatacao';
import { PREMIO_PADRAO } from '../beta-capm/calculo';
import { calcularCarteira, validarEntrada, type Ativo, type BaseRetorno, type EntradaCarteira } from './calculo';
import { ExplicacaoCarteira } from './explicacoes';
import { formulasCarteira } from './formulas';

/** Carteira inicial: cinco setores diferentes, 20% em cada. */
const CARTEIRA_PADRAO: Record<string, number> = { ITUB4: 20, WEGE3: 20, ABEV3: 20, SUZB3: 20, TAEE11: 20 };

/** Chave do peso de cada ação na URL (ex.: w_PETR4=25). */
const chavePeso = (ticker: string) => `w_${ticker}`;

type Parametros = Record<string, number | string>;

/** Cor de fundo da célula da matriz: verde para correlação positiva, laranja para negativa. */
function corCorrelacao(c: number): string {
  const intensidade = Math.min(1, Math.abs(c)) * 0.55;
  return c >= 0 ? `rgba(13, 107, 88, ${intensidade})` : `rgba(181, 101, 29, ${intensidade})`;
}

/** Balão da nuvem de carteiras. */
function BalaoRisco({ active, payload }: { active?: boolean; payload?: { payload: { x: number; y: number; nome?: string } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="fl-balao">
      <strong>{p.nome ?? 'Carteira aleatória'}</strong>
      <div>Volatilidade: {numeroBr(p.x, 1)}% a.a.</div>
      <div>Retorno esperado: {numeroBr(p.y, 1)}% a.a.</div>
    </div>
  );
}

export default function CarteiraPagina() {
  const { dados } = useTaxas();
  const cdi = useLivreDeRiscoMensal();
  const { valores: v, padroes, definir, redefinir, editado } = useParametrosUrl<Parametros>(() => ({
    ...Object.fromEntries(ACOES.map((a) => [chavePeso(a.ticker), CARTEIRA_PADRAO[a.ticker] ?? 0])),
    base: 'capm',
    rf: dados.cdi.valor,
    premio: PREMIO_PADRAO,
  }));

  const peso = (ticker: string) => Number(v[chavePeso(ticker)]) || 0;
  const somaPesos = ACOES.reduce((s, a) => s + peso(a.ticker), 0);
  const escolhidas = ACOES.filter((a) => peso(a.ticker) > 0);
  const base = (v.base === 'historico' ? 'historico' : 'capm') as BaseRetorno;
  const rf = Number(v.rf);
  const premio = Number(v.premio);

  const entrada: EntradaCarteira = {
    tickers: escolhidas.map((a) => a.ticker),
    pesos: escolhidas.map((a) => peso(a.ticker) / 100),
    precos: escolhidas.map((a) => COTACOES.acoes[a.ticker]),
    meses: COTACOES.meses,
    precosMercado: COTACOES.indice,
    livreDeRiscoMensal: cdi.valores,
    livreDeRiscoAtual: rf / 100,
    premioMercado: premio / 100,
    base,
  };
  const erro = validarEntrada(entrada);
  // A nuvem de 1.500 carteiras é o cálculo mais pesado: só refaz quando algum dado de entrada muda de fato
  // (a `entrada` é um objeto novo a cada renderização, então a comparação é feita pelo conteúdo).
  const chave = JSON.stringify([entrada.tickers, entrada.pesos, base, rf, premio, cdi.valores]);
  const r = useMemo(() => (erro ? null : calcularCarteira(entrada)), [chave, erro]);

  /** Escala os pesos das ações escolhidas para somarem 100%. */
  const ajustarPara100 = () => {
    if (somaPesos <= 0) return;
    definir(Object.fromEntries(escolhidas.map((a) => [chavePeso(a.ticker), Math.round((peso(a.ticker) / somaPesos) * 10000) / 100])));
  };
  /** Dá o mesmo peso a todas as ações escolhidas. */
  const pesosIguais = () => {
    if (escolhidas.length === 0) return;
    definir(Object.fromEntries(escolhidas.map((a) => [chavePeso(a.ticker), Math.round((100 / escolhidas.length) * 100) / 100])));
  };

  const parametros = (
    <>
      <p className="fl-parametros-nota">Quanto do dinheiro vai em cada ação. Deixe 0% nas que ficam de fora.</p>
      <div className="fl-pesos">
        {ACOES.map((a) => (
          <CampoNumerico
            key={a.ticker}
            rotulo={a.ticker}
            unidade="%"
            valor={peso(a.ticker)}
            min={0}
            max={100}
            onChange={(w) => definir({ [chavePeso(a.ticker)]: w })}
          />
        ))}
      </div>
      <p className={Math.abs(somaPesos - 100) > 0.05 ? 'fl-soma-pesos fl-soma-pesos--erro' : 'fl-soma-pesos'}>
        Soma: {numeroBr(somaPesos, 2)}% · {escolhidas.length} {escolhidas.length === 1 ? 'ação' : 'ações'}
      </p>
      <div className="fl-botoes-pesos">
        <button type="button" className="fl-botao-leve" onClick={pesosIguais}>
          Pesos iguais
        </button>
        <button type="button" className="fl-botao-leve" onClick={ajustarPara100}>
          Ajustar para 100%
        </button>
      </div>

      <h3 className="fl-parametros-grupo">Retorno esperado</h3>
      <CampoSelecao
        rotulo="Retorno esperado de cada ação"
        valor={base}
        opcoes={[
          { valor: 'capm', rotulo: 'Pelo CAPM (r_f + β × prêmio)' },
          { valor: 'historico', rotulo: 'Média histórica (5 anos)' },
        ]}
        onChange={(b) => definir({ base: b })}
        dica="O CAPM olha para frente e depende só do beta. A média histórica mostra o que de fato aconteceu, mas é uma previsão muito ruidosa."
      />
      {base === 'capm' && (
        <>
          <CampoNumerico rotulo="Taxa livre de risco (CDI hoje)" unidade="% a.a." valor={rf} min={0} max={100} doBc={rf === padroes.rf} onChange={(x) => definir({ rf: x })} />
          <CampoNumerico
            rotulo="Prêmio de mercado esperado"
            unidade="% a.a."
            valor={premio}
            min={-20}
            max={30}
            onChange={(x) => definir({ premio: x })}
            dica="Premissa sua: quanto a bolsa deve render acima do CDI. O Módulo 3 explica por que não usamos o histórico."
          />
        </>
      )}
    </>
  );

  const c = r?.carteira;
  const ganho = c ? c.volatilidadeSemDiversificacao - c.volatilidade : 0;
  const pontosAcoes = r ? r.ativos.map((a) => ({ x: a.volatilidade * 100, y: a.retornoEsperado * 100, nome: a.ticker })) : [];
  const pontosNuvem = r ? r.nuvem.map((p) => ({ x: p.volatilidade * 100, y: p.retorno * 100 })) : [];

  return (
    <ModuloLayout
      numero={4}
      titulo="Diversificar reduz o risco?"
      situacao={
        <>
          "Não coloque todos os ovos na mesma cesta" é o conselho mais antigo dos investimentos. Mas quanto risco ele elimina de verdade — e existe um
          risco que nenhuma cesta resolve? Monte uma carteira com ações da B3 e meça com 5 anos de dados reais.
        </>
      }
      introducao={<FonteCotacoes cdi={cdi} />}
      parametros={parametros}
      onRedefinir={editado ? redefinir : undefined}
      resultados={
        erro || !r || !c ? (
          <Veredito tipo="atencao" titulo="Ajuste a carteira">
            {erro}
          </Veredito>
        ) : (
          <>
            <Veredito
              tipo={r.ativos.length === 1 ? 'atencao' : 'positivo'}
              titulo={
                r.ativos.length === 1
                  ? 'Uma ação só não é uma carteira diversificada.'
                  : `A diversificação cortou ${numeroBr(ganho * 100, 1)} p.p. de volatilidade.`
              }
            >
              {r.ativos.length === 1 ? (
                <>
                  Todo o risco de {r.ativos[0].ticker} ({percentual(c.volatilidade, 1)} ao ano) fica com você, inclusive a parte específica que poderia ser
                  eliminada de graça. Acrescente outras ações para ver a volatilidade cair.
                </>
              ) : (
                <>
                  Sua carteira de {r.ativos.length} ações oscila <strong>{percentual(c.volatilidade, 1)} ao ano</strong>. Se as ações andassem sempre
                  juntas, seriam {percentual(c.volatilidadeSemDiversificacao, 1)}. O retorno esperado continua {percentual(c.retornoEsperado, 1)} ao ano: o
                  risco caiu sem custar retorno. Com β = {numeroBr(c.beta)}, a carteira {c.beta < 1 ? 'oscila menos' : 'oscila mais'} que o Ibovespa (
                  {percentual(r.volatilidadeMercado, 1)}).
                </>
              )}
            </Veredito>

            <GradeKpis umaLinha>
              <CartaoKpi rotulo="Retorno esperado" valor={`${percentual(c.retornoEsperado, 1)} a.a.`} detalhe={base === 'capm' ? 'pelo CAPM' : 'média histórica'} />
              <CartaoKpi rotulo="Volatilidade da carteira" valor={`${percentual(c.volatilidade, 1)} a.a.`} detalhe={`sem diversificar: ${percentual(c.volatilidadeSemDiversificacao, 1)}`} />
              <CartaoKpi rotulo="Beta da carteira" valor={numeroBr(c.beta)} detalhe="média ponderada dos betas" />
              <CartaoKpi rotulo="Risco sistemático" valor={percentual(c.sistematico, 0)} detalhe="da variância da carteira (R²)" />
              {r.pisoDiversificacao !== null && (
                <CartaoKpi rotulo="Piso da diversificação" valor={`${percentual(r.pisoDiversificacao, 1)} a.a.`} detalhe="risco comum que não some" />
              )}
            </GradeKpis>

            <div className={r.curva.length > 0 ? 'fl-graficos-duplos' : undefined}>
              <Grafico
                titulo="Risco × retorno: ações, sua carteira e carteiras aleatórias"
                descricao="Volatilidade e retorno esperado de cada ação, da carteira montada e de 1.500 carteiras aleatórias"
                nota="Cada ponto cinza é uma combinação sorteada das mesmas ações (como no slide 11.4). Repare que a carteira fica à esquerda das ações: menos risco."
                altura={360}
              >
                <ScatterChart margin={{ top: 12, right: 20, bottom: 24, left: 4 }}>
                  <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 'auto']}
                    tickFormatter={(x: number) => `${numeroBr(x, 0)}%`}
                    label={{ value: 'Volatilidade (% a.a.)', position: 'insideBottom', offset: -14 }}
                  />
                  <YAxis type="number" dataKey="y" domain={['auto', 'auto']} tickFormatter={(y: number) => `${numeroBr(y, 0)}%`} width={48} />
                  <Tooltip content={<BalaoRisco />} />
                  <Scatter data={pontosNuvem} fill={CORES.cinza} fillOpacity={0.25} shape="circle" isAnimationActive={false} />
                  <Scatter data={pontosAcoes} fill={CORES.roxo} isAnimationActive={false}>
                    <LabelList dataKey="nome" position="top" fontSize={11} fill={CORES.roxo} />
                  </Scatter>
                  <ReferenceDot
                    x={c.volatilidade * 100}
                    y={c.retornoEsperado * 100}
                    r={9}
                    fill={CORES.verde}
                    stroke="#fff"
                    strokeWidth={2}
                    label={{ value: 'Sua carteira', position: 'left', fill: CORES.verde, fontWeight: 700 }}
                  />
                </ScatterChart>
              </Grafico>

              {r.curva.length > 0 && r.pisoDiversificacao !== null && (
                <Grafico
                  titulo="Quanto mais ações, menos risco — até um limite"
                  descricao="Volatilidade de uma carteira com pesos iguais em função do número de ações"
                  nota="Carteira igualmente ponderada com n ações típicas das escolhidas. A linha tracejada é o risco comum a todas (sistemático), que não some."
                  altura={360}
                >
                  <LineChart data={r.curva.map((p) => ({ n: p.quantidade, vol: p.volatilidade * 100 }))} margin={{ top: 12, right: 20, bottom: 24, left: 4 }}>
                    <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                    <XAxis dataKey="n" label={{ value: 'Número de ações', position: 'insideBottom', offset: -14 }} />
                    <YAxis domain={[0, 'auto']} tickFormatter={(y: number) => `${numeroBr(y, 0)}%`} width={48} />
                    <Tooltip formatter={(valor) => [`${numeroBr(Number(valor), 1)}% a.a.`, 'Volatilidade']} labelFormatter={(n) => `${n} ações`} />
                    <ReferenceLine
                      y={r.pisoDiversificacao * 100}
                      stroke={CORES.laranja}
                      strokeDasharray="6 4"
                      label={{ value: `Risco sistemático ≈ ${numeroBr(r.pisoDiversificacao * 100, 1)}%`, position: 'insideBottomLeft', offset: -16, fill: CORES.laranja }}
                    />
                    <Line dataKey="vol" name="Volatilidade" stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </Grafico>
              )}
            </div>

            <Grafico
              titulo="Quanto teriam virado R$ 100 na carteira"
              descricao="Evolução de 100 reais na carteira, no Ibovespa e no CDI"
              nota="Carteira rebalanceada todo mês para os pesos escolhidos, com proventos reinvestidos. Desempenho passado, não previsão."
            >
              <LineChart data={r.acumulado} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
                <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickFormatter={mesAno} minTickGap={24} />
                <YAxis domain={['auto', 'auto']} tickFormatter={(y: number) => `R$ ${numeroBr(y, 0)}`} width={64} />
                <Tooltip formatter={(valor, nome) => [brl(Number(valor)), String(nome)]} labelFormatter={(m) => mesAno(String(m))} />
                <Legend verticalAlign="top" />
                <Line dataKey="carteira" name="Sua carteira" stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line dataKey="mercado" name="Ibovespa" stroke={CORES.roxo} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="livreDeRisco" name="CDI" stroke={CORES.laranja} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </Grafico>

            <AbasDidaticas
              abas={[
                { id: 'explicacao', rotulo: 'Explicação', conteudo: <ExplicacaoCarteira e={entrada} r={r} /> },
                { id: 'formulas', rotulo: 'Fórmulas', conteudo: <ListaFormulas passos={formulasCarteira(entrada, r)} /> },
                {
                  id: 'passo',
                  rotulo: 'Passo a passo',
                  conteudo: (
                    <div className="fl-texto">
                      <h4>As ações da carteira</h4>
                      <Tabela<Ativo>
                        chave={(a) => a.ticker}
                        linhas={r.ativos}
                        colunas={[
                          { titulo: 'Ação', celula: (a) => a.ticker },
                          { titulo: 'Peso', celula: (a) => percentual(a.peso, 1) },
                          { titulo: 'Beta', celula: (a) => numeroBr(a.beta) },
                          { titulo: 'Retorno esperado', celula: (a) => percentual(a.retornoEsperado, 1) },
                          { titulo: 'Volatilidade', celula: (a) => percentual(a.volatilidade, 1) },
                          { titulo: 'Peso × beta', celula: (a) => numeroBr(a.peso * a.beta, 3) },
                        ]}
                      />
                      {r.ativos.length > 1 && (
                        <>
                          <h4>Correlações entre as ações (5 anos de retornos mensais)</h4>
                          <div className="fl-tabela fl-matriz" tabIndex={0}>
                            <table>
                              <thead>
                                <tr>
                                  <th scope="col" />
                                  {r.ativos.map((a) => (
                                    <th key={a.ticker} scope="col">
                                      {a.ticker}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {r.ativos.map((a, i) => (
                                  <tr key={a.ticker}>
                                    <th scope="row">{a.ticker}</th>
                                    {r.correlacoes[i].map((corr, j) => (
                                      <td key={j} style={{ background: corCorrelacao(corr) }}>
                                        {numeroBr(corr)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p>
                            Verde mais forte: as duas ações andam mais juntas (diversificam pouco). Quanto mais claro — ou laranja, se negativa — mais uma
                            compensa a outra.
                          </p>
                          <h4>A carteira aleatória de menor risco encontrada</h4>
                          <p>
                            {r.ativos.map((a, i) => `${a.ticker} ${percentual(r.menorRisco.pesos[i], 1)}`).join(' · ')} — volatilidade de{' '}
                            {percentual(r.menorRisco.volatilidade, 1)} e retorno esperado de {percentual(r.menorRisco.retorno, 1)} ao ano.
                          </p>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />

            <ParaLevar>
              Diversificar elimina o risco específico de cada empresa sem custar retorno — é o único "almoço grátis" das finanças. O que sobra é o risco de
              mercado, medido pelo beta, e é só por ele que o investidor é remunerado.
            </ParaLevar>

            <AcoesRelatorio
              csv={{
                nome: 'finlab-carteira',
                cabecalho: ['Ação', 'Peso', 'Beta', 'Retorno esperado (a.a.)', 'Volatilidade (a.a.)', ...r.ativos.map((a) => `Correlação com ${a.ticker}`)],
                linhas: r.ativos.map((a, i) => [a.ticker, a.peso, a.beta, a.retornoEsperado, a.volatilidade, ...r.correlacoes[i]]),
              }}
            />
          </>
        )
      }
    />
  );
}
