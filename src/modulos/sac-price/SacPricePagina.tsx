import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { AcoesRelatorio } from '../../componentes/AcoesRelatorio';
import { CampoNumerico, CampoSelecao } from '../../componentes/Campos';
import { ListaFormulas } from '../../componentes/Formula';
import { ModuloLayout } from '../../componentes/ModuloLayout';
import { AbasDidaticas, CartaoKpi, Grafico, GradeKpis, ParaLevar, Tabela, Veredito } from '../../componentes/Resultados';
import { Termo } from '../../componentes/Termo';
import { useTaxas } from '../../dados/TaxasContext';
import { aliquotaIrRegressivo, DIAS_POR_MES, taxaMensalLiquida } from '../../financas/impostos';
import { mensalParaAnual, type TipoTaxa } from '../../financas/taxas';
import { useParametrosUrl } from '../../hooks/useParametrosUrl';
import { CORES } from '../../utils/cores';
import { brl, brl0, percentual } from '../../utils/formatacao';
import type { LinhaAmortizacao } from '../../financas/amortizacao';
import { calcularSacPrice, PRAZO_MAXIMO_MESES, validarEntrada, type EntradaSacPrice } from './calculo';
import { ExplicacaoSacPrice } from './explicacoes';
import { formulasSacPrice } from './formulas';

type Parametros = {
  principal: number;
  /** Em %, na convenção de `tipoTaxa`. */
  taxa: number;
  tipoTaxa: TipoTaxa;
  prazo: number;
  /** % a.a. líquido de IR. */
  oportunidade: number;
};

const TIPOS: { valor: TipoTaxa; rotulo: string }[] = [
  { valor: 'mensal', rotulo: 'Ao mês' },
  { valor: 'anual-efetiva', rotulo: 'Ao ano — efetiva (equivalente)' },
  { valor: 'anual-nominal', rotulo: 'Ao ano — nominal (÷ 12)' },
];

/** Balão do gráfico de composição: mostra a parcela inteira, as duas partes e o saldo. */
function BalaoParcela({ active, payload }: { active?: boolean; payload?: { payload: LinhaAmortizacao }[] }) {
  if (!active || !payload?.length) return null;
  const l = payload[0].payload;
  return (
    <div className="fl-balao">
      <strong>Mês {l.mes}</strong>
      <div>Parcela: {brl(l.parcela)}</div>
      <div>Amortização: {brl(l.amortizacao)}</div>
      <div>Juros: {brl(l.juros)}</div>
      <div>Saldo devedor depois: {brl(l.saldoFinal)}</div>
    </div>
  );
}

/** Barras empilhadas (uma por mês): a parte escura reduz a dívida, a clara são juros. */
function ComposicaoParcela({ dados, cor, corClara, maximo }: { dados: LinhaAmortizacao[]; cor: string; corClara: string; maximo: number }) {
  return (
    <BarChart data={dados} margin={{ top: 14, right: 12, bottom: 22, left: 4 }} barCategoryGap={dados.length > 60 ? 0 : '12%'}>
      <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="mes" interval="preserveStartEnd" minTickGap={14} label={{ value: 'Mês', position: 'insideBottom', offset: -12 }} />
      <YAxis domain={[0, maximo]} tickFormatter={(y: number) => brl0(y)} width={76} />
      <Tooltip content={<BalaoParcela />} cursor={{ fill: 'rgba(23, 58, 54, 0.06)' }} />
      <Legend verticalAlign="top" height={32} formatter={(nome: string) => <span style={{ color: CORES.tinta }}>{nome}</span>} />
      <Bar dataKey="amortizacao" name="Amortização (reduz a dívida)" stackId="p" fill={cor} isAnimationActive={false} />
      <Bar dataKey="juros" name="Juros" stackId="p" fill={corClara} stroke={dados.length > 36 ? undefined : cor} strokeWidth={0.5} isAnimationActive={false} />
    </BarChart>
  );
}

export default function SacPricePagina() {
  const { dados } = useTaxas();

  const { valores: v, padroes, definir, redefinir, editado } = useParametrosUrl<Parametros>((p) => {
    // Custo de oportunidade padrão: CDI líquido de IR. O dinheiro que sobra por causa das
    // parcelas menores fica aplicado, em média, metade do prazo.
    const mesesAplicado = Math.max(1, ((p.prazo ?? 12) + 1) / 2);
    const aliquota = aliquotaIrRegressivo(Math.round(mesesAplicado * DIAS_POR_MES));
    const liquido = mensalParaAnual(taxaMensalLiquida(dados.cdi.valor / 100, mesesAplicado, aliquota)) * 100;
    return { principal: 10000, taxa: 1, tipoTaxa: 'mensal', prazo: 12, oportunidade: Math.round(liquido * 100) / 100 };
  });

  const tipoTaxa: TipoTaxa = TIPOS.some((t) => t.valor === v.tipoTaxa) ? v.tipoTaxa : 'mensal';
  const entrada: EntradaSacPrice = {
    principal: v.principal,
    taxa: v.taxa / 100,
    tipoTaxa,
    prazo: Math.round(v.prazo),
    custoOportunidadeAnual: v.oportunidade / 100,
  };
  const erro = validarEntrada(entrada);
  const r = erro ? null : calcularSacPrice(entrada);

  const parametros = (
    <>
      <CampoNumerico rotulo="Valor emprestado" moeda unidade="R$" valor={v.principal} min={0.01} onChange={(principal) => definir({ principal })} />
      <CampoNumerico rotulo="Taxa de juros do empréstimo" unidade="%" valor={v.taxa} min={0} max={500} onChange={(taxa) => definir({ taxa })} />
      <CampoSelecao
        rotulo="A taxa é informada…"
        valor={tipoTaxa}
        opcoes={TIPOS}
        onChange={(t) => definir({ tipoTaxa: t })}
        dica={
          <>
            <Termo id="taxa-nominal">Nominal</Termo> e <Termo id="taxa-equivalente">efetiva</Termo> dão taxas mensais diferentes. Os slides do Cap. 5 usam a nominal.
          </>
        }
      />
      <CampoNumerico rotulo="Prazo" unidade="meses" valor={v.prazo} min={1} max={PRAZO_MAXIMO_MESES} onChange={(prazo) => definir({ prazo: Math.round(prazo) })} />
      <CampoNumerico
        rotulo="Seu custo de oportunidade (líquido)"
        unidade="% a.a."
        valor={v.oportunidade}
        min={0}
        max={100}
        doBc={v.oportunidade === padroes.oportunidade}
        dica={
          <>
            Quanto o seu dinheiro renderia aplicado. Padrão: <Termo id="cdi">CDI</Termo> de hoje, já descontado o IR.
          </>
        }
        onChange={(oportunidade) => definir({ oportunidade })}
      />
    </>
  );

  const linhasTabela = r ? r.sac.map((s, k) => ({ s, p: r.price[k] })) : [];
  const maxParcela = r ? Math.max(r.sac[0].parcela, r.price[0].parcela) * 1.05 : 0;

  return (
    <ModuloLayout
      numero={2}
      titulo="SAC ou Price?"
      situacao={
        <>
          Você vai financiar R$ 10.000 em 12 meses a 1% ao mês. O banco oferece dois sistemas de amortização e diz que um "paga menos
          juros". Isso significa que ele é mais barato? Compare os dois e descubra o que realmente decide.
        </>
      }
      parametros={parametros}
      onRedefinir={editado ? redefinir : undefined}
      resultados={
        erro || !r ? (
          <Veredito tipo="atencao" titulo="Ajuste os parâmetros">
            {erro}
          </Veredito>
        ) : (
          <>
            <Veredito
              tipo={r.maisBarato === 'igual' ? 'neutro' : 'atencao'}
              titulo={r.maisBarato === 'igual' ? 'Os dois custam o mesmo.' : 'Pagar menos juros não significa ser mais barato.'}
            >
              Na taxa do contrato, SAC e Price valem exatamente o mesmo ({brl(entrada.principal)} em valor presente), embora a Price pague{' '}
              {brl(r.jurosPrice - r.jurosSac)} a mais de juros.{' '}
              {r.maisBarato === 'igual'
                ? 'Ao seu custo de oportunidade, a diferença também é nula.'
                : `Ao seu custo de oportunidade (${percentual(entrada.custoOportunidadeAnual)} ao ano), o ${r.maisBarato === 'SAC' ? 'SAC' : 'Price'} sai ${brl(r.economia)} mais barato em valor presente.`}
            </Veredito>

            <GradeKpis>
              <CartaoKpi rotulo="Parcela SAC" valor={`${brl(r.sac[0].parcela)} → ${brl(r.sac[r.sac.length - 1].parcela)}`} detalhe="primeira → última" />
              <CartaoKpi rotulo="Parcela Price" valor={brl(r.price[0].parcela)} detalhe="fixa do início ao fim" />
              <CartaoKpi rotulo="Juros totais" valor={`SAC ${brl(r.jurosSac)}`} detalhe={`Price ${brl(r.jurosPrice)}`} />
              <CartaoKpi rotulo="Valor presente ao contrato" valor={brl(r.vpSacNoContrato)} detalhe={`SAC = Price = ${brl(r.vpPriceNoContrato)}`} />
              <CartaoKpi rotulo="Valor presente ao seu custo" valor={`SAC ${brl(r.vpSacNaOportunidade)}`} detalhe={`Price ${brl(r.vpPriceNaOportunidade)}`} />
            </GradeKpis>

            <div className="fl-graficos-duplos">
              <Grafico titulo="SAC: composição de cada parcela" descricao="Barras empilhadas de amortização e juros por mês no SAC" altura={300}>
                <ComposicaoParcela dados={r.sac} cor={CORES.verde} corClara={CORES.verdeClaro} maximo={maxParcela} />
              </Grafico>
              <Grafico titulo="Price: composição de cada parcela" descricao="Barras empilhadas de amortização e juros por mês na Price" altura={300}>
                <ComposicaoParcela dados={r.price} cor={CORES.roxo} corClara={CORES.roxoClaro} maximo={maxParcela} />
              </Grafico>
            </div>

            <Grafico titulo="Saldo devedor ao longo do contrato" descricao="No SAC a dívida cai em linha reta; na Price ela cai devagar no começo." altura={280}>
              <LineChart
                data={[
                  { mes: 0, sac: entrada.principal, price: entrada.principal },
                  ...r.sac.map((s, k) => ({ mes: s.mes, sac: s.saldoFinal, price: r.price[k].saldoFinal })),
                ]}
                margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
              >
                <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(y: number) => brl0(y)} width={84} />
                <Tooltip formatter={(valor, nome) => [brl(Number(valor)), String(nome)]} labelFormatter={(m) => `Mês ${m}`} />
                <Legend />
                <Line dataKey="sac" name="SAC" stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line dataKey="price" name="Price" stroke={CORES.roxo} strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </Grafico>

            <AbasDidaticas
              abas={[
                { id: 'explicacao', rotulo: 'Explicação', conteudo: <ExplicacaoSacPrice e={entrada} r={r} /> },
                { id: 'formulas', rotulo: 'Fórmulas', conteudo: <ListaFormulas passos={formulasSacPrice(entrada, r)} /> },
                {
                  id: 'passo',
                  rotulo: 'Passo a passo',
                  conteudo: (
                    <div className="fl-texto">
                      <p>Tabela de amortização completa. Em cada mês: juros = taxa × saldo inicial; parcela = juros + amortização.</p>
                      <Tabela
                        chave={(l) => l.s.mes}
                        linhas={linhasTabela}
                        colunas={[
                          { titulo: 'Mês', celula: (l) => l.s.mes },
                          { titulo: 'SAC parcela', celula: (l) => brl(l.s.parcela) },
                          { titulo: 'SAC juros', celula: (l) => brl(l.s.juros) },
                          { titulo: 'SAC saldo', celula: (l) => brl(l.s.saldoFinal) },
                          { titulo: 'Price parcela', celula: (l) => brl(l.p.parcela) },
                          { titulo: 'Price juros', celula: (l) => brl(l.p.juros) },
                          { titulo: 'Price saldo', celula: (l) => brl(l.p.saldoFinal) },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />

            <ParaLevar>
              Comparar sistemas de amortização pelos juros totais engana: o que vale é o valor presente. O que decide entre SAC e Price é
              o seu custo de oportunidade e o formato de parcela que cabe no seu orçamento.
            </ParaLevar>

            <AcoesRelatorio
              csv={{
                nome: 'finlab-sac-price',
                cabecalho: ['Mês', 'SAC parcela', 'SAC juros', 'SAC amortização', 'SAC saldo', 'Price parcela', 'Price juros', 'Price amortização', 'Price saldo'],
                linhas: linhasTabela.map(({ s, p }) => [s.mes, s.parcela, s.juros, s.amortizacao, s.saldoFinal, p.parcela, p.juros, p.amortizacao, p.saldoFinal]),
              }}
            />
          </>
        )
      }
    />
  );
}
