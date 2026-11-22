/**
 * Página do Módulo 3 — Quanto risco essa ação carrega?: parâmetros, resultados e abas didáticas.
 * Só interface; os cálculos ficam em calculo.ts.
 */
import { useMemo, useState } from 'react';
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
import { CampoArquivo, CampoNumerico, CampoSelecao } from '../../componentes/Campos';
import { FonteCotacoes } from '../../componentes/FonteCotacoes';
import { ListaFormulas } from '../../componentes/Formula';
import { ModuloLayout } from '../../componentes/ModuloLayout';
import { AbasDidaticas, CartaoKpi, Grafico, GradeKpis, ParaLevar, Tabela, Veredito } from '../../componentes/Resultados';
import { Termo } from '../../componentes/Termo';
import { ACOES, acaoPorTicker } from '../../dados/acoes';
import { COTACOES, useLivreDeRiscoMensal } from '../../dados/cotacoes';
import { useTaxas } from '../../dados/TaxasContext';
import { estimarBeta, retornoCapm, retornosSimples } from '../../financas/capm';
import { useParametrosUrl } from '../../hooks/useParametrosUrl';
import { CORES } from '../../utils/cores';
import { ErroCsv, lerPrecosCsv, type PrecoMes } from '../../utils/csvLeitura';
import { brl, mesAno, numeroBr, percentual } from '../../utils/formatacao';
import {
  calcularBetaCapm,
  JANELAS,
  PREMIO_PADRAO,
  recortarJanela,
  trechoEmComum,
  validarEntrada,
  type EntradaBetaCapm,
  type PontoRegressao,
} from './calculo';
import { ExplicacaoBetaCapm } from './explicacoes';
import { formulasBetaCapm } from './formulas';

/** Valor do seletor de ação que abre o envio de CSV. */
const OPCAO_CSV = 'CSV';

type Parametros = { acao: string; janela: number; rf: number; premio: number };

/** Balão do gráfico de dispersão: o mês e os dois retornos em excesso. */
function BalaoMes({ active, payload }: { active?: boolean; payload?: { payload: { mes: string; x: number; y: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="fl-balao">
      <strong>{mesAno(p.mes)}</strong>
      <div>Mercado − CDI: {numeroBr(p.x)}%</div>
      <div>Ação − CDI: {numeroBr(p.y)}%</div>
    </div>
  );
}

/** Balão da SML: ação, beta e retorno exigido. */
function BalaoSml({ active, payload }: { active?: boolean; payload?: { payload: { ticker: string; x: number; y: number } }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="fl-balao">
      <strong>{p.ticker}</strong>
      <div>β = {numeroBr(p.x)}</div>
      <div>Retorno exigido: {numeroBr(p.y)}% a.a.</div>
    </div>
  );
}

export default function BetaCapmPagina() {
  const { dados } = useTaxas();
  const cdi = useLivreDeRiscoMensal();
  const { valores: v, padroes, definir, redefinir, editado } = useParametrosUrl<Parametros>(() => ({
    acao: 'WEGE3',
    janela: 60,
    rf: dados.cdi.valor,
    premio: PREMIO_PADRAO,
  }));

  // O CSV fica só nesta tela (não cabe no link da simulação).
  const [csv, setCsv] = useState<{ nome: string; precos: PrecoMes[] } | null>(null);
  const [erroCsv, setErroCsv] = useState<string | null>(null);

  const usandoCsv = v.acao === OPCAO_CSV;
  const info = acaoPorTicker(v.acao);
  const nomeAcao = usandoCsv ? (csv ? csv.nome.replace(/\.(csv|txt)$/i, '') : 'ação do CSV') : v.acao;

  // Séries completas da ação escolhida, alinhadas com os meses das cotações.
  const series = useMemo((): { meses: string[]; acao: number[]; mercado: number[]; rf: number[]; aviso?: string } | string => {
    if (!usandoCsv) {
      const precos = COTACOES.acoes[v.acao] ?? COTACOES.acoes.WEGE3;
      return { meses: COTACOES.meses, acao: precos, mercado: COTACOES.indice, rf: cdi.valores };
    }
    if (!csv) return 'Envie um arquivo CSV com os preços mensais (ou diários) da ação.';
    const porMes = new Map(csv.precos.map((p) => [p.mes, p.preco]));
    const trecho = trechoEmComum(COTACOES.meses, new Set(porMes.keys()));
    if (!trecho)
      return `O CSV não tem meses seguidos em comum com o Ibovespa disponível (${mesAno(COTACOES.meses[0])} a ${mesAno(COTACOES.meses[COTACOES.meses.length - 1])}).`;
    const [i, f] = trecho;
    const meses = COTACOES.meses.slice(i, f + 1);
    return {
      meses,
      acao: meses.map((m) => porMes.get(m)!),
      mercado: COTACOES.indice.slice(i, f + 1),
      rf: cdi.valores.slice(i, f + 1),
      aviso: f < COTACOES.meses.length - 1 ? `O CSV termina em ${mesAno(COTACOES.meses[f])}; a análise usa até esse mês.` : undefined,
    };
  }, [usandoCsv, csv, v.acao, cdi.valores]);

  const entrada: EntradaBetaCapm | null =
    typeof series === 'string'
      ? null
      : {
          meses: recortarJanela(series.meses, v.janela),
          precosAcao: recortarJanela(series.acao, v.janela),
          precosMercado: recortarJanela(series.mercado, v.janela),
          livreDeRiscoMensal: recortarJanela(series.rf, v.janela),
          livreDeRiscoAtual: v.rf / 100,
          premioMercado: v.premio / 100,
        };
  const erro = typeof series === 'string' ? series : validarEntrada(entrada!);
  const r = erro || !entrada ? null : calcularBetaCapm(entrada);

  // SML: as 10 ações do catálogo, com o beta da mesma janela, para comparar.
  const pontosSml = useMemo(() => {
    const n = Math.min(v.janela, COTACOES.meses.length - 1);
    const rm = retornosSimples(recortarJanela(COTACOES.indice, n));
    const rf = recortarJanela(cdi.valores, n).slice(1);
    return ACOES.map((a) => {
      const beta = estimarBeta(retornosSimples(recortarJanela(COTACOES.acoes[a.ticker], n)), rm, rf).beta;
      return { ticker: a.ticker, x: beta, y: retornoCapm(v.rf / 100, beta, v.premio / 100) * 100 };
    });
  }, [v.janela, v.rf, v.premio, cdi.valores]);

  const parametros = (
    <>
      <CampoSelecao
        rotulo="Ação"
        valor={v.acao}
        opcoes={[...ACOES.map((a) => ({ valor: a.ticker, rotulo: `${a.ticker} · ${a.empresa}` })), { valor: OPCAO_CSV, rotulo: 'Outra ação (enviar CSV)…' }]}
        onChange={(acao) => definir({ acao })}
        dica={info ? `${info.setor}. ${info.destaque}` : undefined}
      />
      {usandoCsv && (
        <CampoArquivo
          rotulo="Arquivo de preços (CSV)"
          aceitar=".csv,.txt"
          erro={erroCsv}
          onCarregar={(nome, conteudo) => {
            try {
              setCsv({ nome, precos: lerPrecosCsv(conteudo) });
              setErroCsv(null);
            } catch (e) {
              setCsv(null);
              setErroCsv(e instanceof ErroCsv ? e.message : 'Não foi possível ler o arquivo.');
            }
          }}
          dica={
            <>
              Duas colunas, <code>data;preco</code> (ex.: <code>31/10/2026;45,10</code>), ou o CSV exportado do Yahoo Finance. Use preços ajustados por
              proventos. O arquivo é lido só no seu navegador.
            </>
          }
        />
      )}
      <CampoSelecao
        rotulo="Período de estimação"
        valor={String(v.janela)}
        opcoes={JANELAS.map((j) => ({ valor: String(j), rotulo: `${j} meses (${j / 12} anos)${j === 60 ? ' · padrão do livro' : ''}` }))}
        onChange={(janela) => definir({ janela: Number(janela) })}
        dica="O livro (slide 11.3) indica 5 anos de retornos mensais. Janelas menores reagem mais rápido a mudanças, mas estimam com mais erro."
      />
      <h3 className="fl-parametros-grupo">Premissas do CAPM</h3>
      <CampoNumerico
        rotulo="Taxa livre de risco (CDI hoje)"
        unidade="% a.a."
        valor={v.rf}
        min={0}
        max={100}
        doBc={v.rf === padroes.rf}
        onChange={(rf) => definir({ rf })}
      />
      <CampoNumerico
        rotulo="Prêmio de mercado esperado"
        unidade="% a.a."
        valor={v.premio}
        min={-20}
        max={30}
        onChange={(premio) => definir({ premio })}
        dica={
          r ? (
            <>
              Premissa sua: quanto a bolsa deve render acima do CDI daqui para frente. Para comparar, o prêmio que de fato ocorreu no período foi de{' '}
              {percentual(r.historico.premioMercado)} a.a. (veja a explicação).
            </>
          ) : (
            'Premissa sua: quanto a bolsa deve render acima do CDI daqui para frente.'
          )
        }
      />
    </>
  );

  const dispersao = r ? r.pontos.map((p) => ({ mes: p.mes, x: p.excessoMercado * 100, y: p.excessoAcao * 100 })) : [];
  const xs = dispersao.map((p) => p.x);
  const xMin = Math.min(...xs, 0);
  const xMax = Math.max(...xs, 0);
  const betaMaxSml = r ? Math.max(2, ...pontosSml.map((p) => p.x), r.regressao.beta) * 1.08 : 2;

  return (
    <ModuloLayout
      numero={3}
      titulo="Quanto risco essa ação carrega?"
      situacao={
        <>
          Duas ações podem oscilar o mesmo tanto e, ainda assim, ter riscos muito diferentes para quem investe. Parte do sobe e desce de uma ação vem do
          mercado inteiro; parte é só dela. Qual parte o mercado remunera — e que retorno a ação precisa oferecer para valer o risco?
        </>
      }
      introducao={<FonteCotacoes cdi={cdi} />}
      parametros={parametros}
      onRedefinir={editado ? redefinir : undefined}
      resultados={
        erro || !r || !entrada ? (
          <Veredito tipo="atencao" titulo={usandoCsv && !csv ? 'Envie os preços da ação' : 'Ajuste os parâmetros'}>
            {erro}
          </Veredito>
        ) : (
          <>
            {typeof series !== 'string' && series.aviso && <p className="fl-parametros-nota">{series.aviso}</p>}
            <Veredito
              tipo={v.premio <= 0 ? 'atencao' : 'neutro'}
              titulo={`${nomeAcao}: β = ${numeroBr(r.regressao.beta)} — ${
                r.perfil === 'defensiva' ? 'oscila menos que o mercado.' : r.perfil === 'agressiva' ? 'amplifica o mercado.' : 'acompanha o mercado.'
              }`}
            >
              Para cada 1% que o Ibovespa sobe ou cai além do CDI, {nomeAcao} tende a se mover {numeroBr(r.regressao.beta)}%.{' '}
              {v.premio <= 0 ? (
                <>
                  Com um prêmio de mercado de {percentual(v.premio / 100)}, o CAPM diria que correr risco não compensa — informe um prêmio esperado positivo
                  para obter o retorno exigido.
                </>
              ) : (
                <>
                  Pelo CAPM, quem compra essa ação deve exigir <strong>{percentual(r.retornoExigido)} ao ano</strong> ({percentual(r.retornoExigido - entrada.livreDeRiscoAtual)}{' '}
                  acima do CDI).
                </>
              )}{' '}
              Só {percentual(r.risco.sistematico, 0)} do risco dela vem do mercado; os outros {percentual(r.risco.especifico, 0)} somem com a diversificação.
            </Veredito>

            <GradeKpis umaLinha>
              <CartaoKpi
                rotulo="Beta (β)"
                valor={numeroBr(r.regressao.beta)}
                detalhe={`entre ${numeroBr(r.intervaloBeta[0])} e ${numeroBr(r.intervaloBeta[1])} (≈95%)`}
              />
              <CartaoKpi rotulo="Retorno exigido (CAPM)" valor={`${percentual(r.retornoExigido)} a.a.`} detalhe={`mercado: ${percentual(r.retornoMercadoEsperado)} a.a.`} />
              <CartaoKpi rotulo="Risco sistemático" valor={percentual(r.risco.sistematico, 0)} detalhe={`R² da regressão · específico ${percentual(r.risco.especifico, 0)}`} />
              <CartaoKpi
                rotulo="Volatilidade anual"
                valor={percentual(r.historico.volatilidadeAcao, 1)}
                detalhe={`Ibovespa: ${percentual(r.historico.volatilidadeMercado, 1)}`}
              />
              <CartaoKpi
                rotulo={`Retorno no período (${r.regressao.n} meses)`}
                valor={`${percentual(r.historico.retornoAcao, 1)} a.a.`}
                detalhe={`Ibovespa ${percentual(r.historico.retornoMercado, 1)} · CDI ${percentual(r.historico.livreDeRisco, 1)}`}
              />
            </GradeKpis>

            <div className="fl-barra-risco" role="img" aria-label={`Risco sistemático ${percentual(r.risco.sistematico, 0)}, específico ${percentual(r.risco.especifico, 0)}`}>
              <span style={{ width: `${r.risco.sistematico * 100}%` }}>Sistemático {percentual(r.risco.sistematico, 0)}</span>
              <span style={{ width: `${r.risco.especifico * 100}%` }}>Específico (diversificável) {percentual(r.risco.especifico, 0)}</span>
            </div>

            <div className="fl-graficos-duplos">
              <Grafico
                titulo="Retornos em excesso e a reta do beta"
                descricao="Dispersão dos retornos mensais em excesso da ação contra os do mercado, com a reta de regressão"
                nota="Cada ponto é um mês. A inclinação da reta é o beta (slide 11.3). Quanto mais espalhados os pontos em volta da reta, maior o risco específico."
              >
                <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 4 }}>
                  <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={['auto', 'auto']}
                    tickFormatter={(x: number) => `${numeroBr(x, 0)}%`}
                    label={{ value: 'Ibovespa − CDI (% no mês)', position: 'insideBottom', offset: -14 }}
                  />
                  <YAxis type="number" dataKey="y" domain={['auto', 'auto']} tickFormatter={(y: number) => `${numeroBr(y, 0)}%`} width={48} />
                  <Tooltip content={<BalaoMes />} />
                  <ReferenceLine x={0} stroke={CORES.cinza} />
                  <ReferenceLine y={0} stroke={CORES.cinza} />
                  <Scatter data={dispersao} fill={CORES.verde} fillOpacity={0.7} isAnimationActive={false} />
                  <ReferenceLine
                    segment={[
                      { x: xMin, y: (r.regressao.alfa + (r.regressao.beta * xMin) / 100) * 100 },
                      { x: xMax, y: (r.regressao.alfa + (r.regressao.beta * xMax) / 100) * 100 },
                    ]}
                    stroke={CORES.roxo}
                    strokeWidth={2.5}
                    label={{ value: `β = ${numeroBr(r.regressao.beta)}`, fill: CORES.roxo, position: 'insideTopRight' }}
                  />
                </ScatterChart>
              </Grafico>

              <Grafico
                titulo="Linha do Mercado de Títulos (SML)"
                descricao="Retorno exigido pelo CAPM em função do beta, com as ações do catálogo"
                nota="Pelo CAPM, todo ativo fica sobre a reta: quanto maior o beta, maior o retorno exigido. O ponto β = 1 é o próprio mercado."
              >
                <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 4 }}>
                  <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, Math.ceil(betaMaxSml * 2) / 2]}
                    tickFormatter={(x: number) => numeroBr(x, 1)}
                    label={{ value: 'Beta (β)', position: 'insideBottom', offset: -14 }}
                  />
                  <YAxis type="number" dataKey="y" domain={['auto', 'auto']} tickFormatter={(y: number) => `${numeroBr(y, 0)}%`} width={48} />
                  <Tooltip content={<BalaoSml />} />
                  <ReferenceLine
                    segment={[
                      { x: 0, y: v.rf },
                      { x: Math.ceil(betaMaxSml * 2) / 2, y: (v.rf / 100 + (Math.ceil(betaMaxSml * 2) / 2) * (v.premio / 100)) * 100 },
                    ]}
                    stroke={CORES.roxo}
                    strokeWidth={2}
                  />
                  <Scatter data={pontosSml.filter((p) => p.ticker !== v.acao)} fill={CORES.cinza} isAnimationActive={false}>
                    <LabelList dataKey="ticker" position="top" fontSize={10} fill={CORES.cinza} />
                  </Scatter>
                  <ReferenceDot x={0} y={v.rf} r={5} fill={CORES.laranja} stroke="#fff" label={{ value: 'CDI', position: 'right', fill: CORES.laranja }} />
                  <ReferenceDot
                    x={1}
                    y={r.retornoMercadoEsperado * 100}
                    r={5}
                    fill={CORES.tinta}
                    stroke="#fff"
                    label={{ value: 'Mercado', position: 'left', fill: CORES.tinta }}
                  />
                  <ReferenceDot
                    x={r.regressao.beta}
                    y={r.retornoExigido * 100}
                    r={8}
                    fill={CORES.verde}
                    stroke="#fff"
                    label={{ value: nomeAcao, position: 'bottom', fill: CORES.verde, fontWeight: 700 }}
                  />
                </ScatterChart>
              </Grafico>
            </div>

            <Grafico
              titulo="Quanto teriam virado R$ 100 no período"
              descricao="Evolução de 100 reais investidos na ação, no Ibovespa e no CDI"
              nota="Retorno total (com proventos). Volatilidade é o tamanho dos solavancos da linha; o beta mede o quanto eles coincidem com os do Ibovespa."
            >
              <LineChart data={r.acumulado} margin={{ top: 8, right: 16, bottom: 8, left: 4 }}>
                <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                <XAxis dataKey="mes" tickFormatter={mesAno} minTickGap={24} />
                <YAxis domain={['auto', 'auto']} tickFormatter={(y: number) => `R$ ${numeroBr(y, 0)}`} width={64} />
                <Tooltip formatter={(valor, nome) => [brl(Number(valor)), String(nome)]} labelFormatter={(m) => mesAno(String(m))} />
                <Legend verticalAlign="top" />
                <Line dataKey="acao" name={nomeAcao} stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line dataKey="mercado" name="Ibovespa" stroke={CORES.roxo} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="livreDeRisco" name="CDI" stroke={CORES.laranja} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </Grafico>

            <AbasDidaticas
              abas={[
                { id: 'explicacao', rotulo: 'Explicação', conteudo: <ExplicacaoBetaCapm e={entrada} r={r} nomeAcao={nomeAcao} /> },
                { id: 'formulas', rotulo: 'Fórmulas', conteudo: <ListaFormulas passos={formulasBetaCapm(entrada, r, nomeAcao)} /> },
                {
                  id: 'passo',
                  rotulo: 'Passo a passo',
                  conteudo: (
                    <div className="fl-texto">
                      <p>
                        Os {r.regressao.n} meses usados na regressão. O "previsto" é o que a reta (α + β·excesso do mercado) indica; o "erro" é a parte do
                        mês que se deve só à empresa — o <Termo id="risco-especifico">risco específico</Termo>.
                      </p>
                      <Tabela<PontoRegressao>
                        chave={(l) => l.mes}
                        linhas={r.pontos}
                        colunas={[
                          { titulo: 'Mês', celula: (l) => mesAno(l.mes) },
                          { titulo: nomeAcao, celula: (l) => percentual(l.retornoAcao) },
                          { titulo: 'Ibovespa', celula: (l) => percentual(l.retornoMercado) },
                          { titulo: 'CDI', celula: (l) => percentual(l.livreDeRisco) },
                          { titulo: 'Ação − CDI', celula: (l) => percentual(l.excessoAcao) },
                          { titulo: 'Ibov − CDI', celula: (l) => percentual(l.excessoMercado) },
                          { titulo: 'Previsto', celula: (l) => percentual(l.previsto) },
                          { titulo: 'Erro', celula: (l) => percentual(l.erro) },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />

            <ParaLevar>
              O mercado não paga por todo o risco de uma ação, só pela parte que acompanha a bolsa e não pode ser diversificada. Quem mede essa parte é o
              beta, não a volatilidade: {nomeAcao} oscila {percentual(r.historico.volatilidadeAcao, 0)} ao ano, mas o retorno exigido depende só de β ={' '}
              {numeroBr(r.regressao.beta)}.
            </ParaLevar>

            <AcoesRelatorio
              csv={{
                nome: `finlab-beta-${nomeAcao.toLowerCase()}`,
                cabecalho: ['Mês', `Retorno ${nomeAcao}`, 'Retorno Ibovespa', 'CDI do mês', 'Excesso ação', 'Excesso mercado', 'Previsto pela reta', 'Erro'],
                linhas: r.pontos.map((l) => [l.mes, l.retornoAcao, l.retornoMercado, l.livreDeRisco, l.excessoAcao, l.excessoMercado, l.previsto, l.erro]),
              }}
            />
          </>
        )
      }
    />
  );
}
