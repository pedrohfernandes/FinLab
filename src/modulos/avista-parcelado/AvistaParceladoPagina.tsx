import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { AcoesRelatorio } from '../../componentes/AcoesRelatorio';
import { CampoCaixa, CampoNumerico } from '../../componentes/Campos';
import { ListaFormulas } from '../../componentes/Formula';
import { ModuloLayout } from '../../componentes/ModuloLayout';
import { AbasDidaticas, CartaoKpi, Grafico, GradeKpis, ParaLevar, Tabela, Veredito } from '../../componentes/Resultados';
import { Termo } from '../../componentes/Termo';
import { useTaxas } from '../../dados/TaxasContext';
import { useParametrosUrl } from '../../hooks/useParametrosUrl';
import { brl, brl0, numeroBr, percentual } from '../../utils/formatacao';
import { CORES } from '../../utils/cores';
import { calcularAvistaParcelado, validarEntrada, type EntradaAvistaParcelado } from './calculo';
import { ExplicacaoAvistaParcelado } from './explicacoes';
import { formulasAvistaParcelado } from './formulas';

type Parametros = {
  avista: number;
  n: number;
  parcela: number;
  antecipada: boolean;
  /** % a.a. bruto. */
  rendimento: number;
  isento: boolean;
};

export default function AvistaParceladoPagina() {
  const { dados } = useTaxas();
  const { valores: v, padroes, definir, redefinir, editado } = useParametrosUrl<Parametros>(() => ({
    avista: 1080,
    n: 10,
    parcela: 120,
    antecipada: false,
    rendimento: dados.cdi.valor, // % a.a. bruto: o CDI de hoje
    isento: false,
  }));

  const entrada: EntradaAvistaParcelado = {
    precoAvista: v.avista,
    parcelas: Math.round(v.n),
    valorParcela: v.parcela,
    antecipada: v.antecipada,
    rendimentoBrutoAnual: v.rendimento / 100,
    isento: v.isento,
  };
  const erro = validarEntrada(entrada);
  const r = erro ? null : calcularAvistaParcelado(entrada);

  const parametros = (
    <>
      <CampoNumerico rotulo="Preço à vista" moeda unidade="R$" valor={v.avista} min={0.01} onChange={(avista) => definir({ avista })} />
      <CampoNumerico rotulo="Número de parcelas" valor={v.n} min={1} max={120} onChange={(n) => definir({ n: Math.round(n) })} />
      <CampoNumerico rotulo="Valor de cada parcela" moeda unidade="R$" valor={v.parcela} min={0.01} onChange={(parcela) => definir({ parcela })} />
      <CampoCaixa rotulo="A 1ª parcela é paga no ato (entrada)" marcado={v.antecipada} onChange={(antecipada) => definir({ antecipada })} />
      <CampoNumerico
        rotulo="Rendimento da aplicação (bruto)"
        unidade="% a.a."
        valor={v.rendimento}
        min={0}
        max={100}
        doBc={v.rendimento === padroes.rendimento}
        dica={
          <>
            Padrão: o <Termo id="cdi">CDI</Termo> de hoje, que um CDB de 100% do CDI paga.
          </>
        }
        onChange={(rendimento) => definir({ rendimento })}
      />
      <CampoCaixa
        rotulo="Aplicação isenta de IR (LCI/LCA)"
        marcado={v.isento}
        onChange={(isento) => definir({ isento })}
        dica="Sem marcar, o IR regressivo é calculado automaticamente pelo prazo."
      />
    </>
  );

  return (
    <ModuloLayout
      numero={1}
      titulo="À vista ou parcelado?"
      situacao={
        <>
          A loja oferece o produto por R$ 1.080 à vista ou em 10× de R$ 120 "sem juros". Será que é sem juros mesmo? E, se você tem o
          dinheiro, o que rende mais: pagar tudo agora ou parcelar e deixar o dinheiro aplicado?
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
              tipo={r.avistaMelhor ? 'positivo' : 'atencao'}
              titulo={r.avistaMelhor ? 'Pague à vista.' : 'Parcele e deixe o dinheiro rendendo.'}
            >
              {r.avistaMelhor
                ? `O parcelamento embute ${percentual(r.taxaImplicita)} ao mês, mais do que a sua aplicação rende líquida (${percentual(r.taxaLiquidaMensal)} ao mês). Pagando à vista, você economiza o equivalente a ${brl(r.diferenca)} em reais de hoje.`
                : r.taxaImplicita <= 0
                  ? `As parcelas não custam mais que o preço à vista, então parcelar só traz vantagem: o dinheiro continua rendendo. Ganho equivalente a ${brl(-r.diferenca)} em reais de hoje.`
                  : `Os juros embutidos (${percentual(r.taxaImplicita)} ao mês) são menores que o rendimento líquido da sua aplicação (${percentual(r.taxaLiquidaMensal)} ao mês). Parcelando, você ganha o equivalente a ${brl(-r.diferenca)} em reais de hoje.`}
            </Veredito>

            <GradeKpis>
              <CartaoKpi rotulo="Total pago parcelado" valor={brl(r.totalParcelado)} detalhe={`${brl(r.totalParcelado - entrada.precoAvista)} a mais que à vista`} />
              <CartaoKpi rotulo="Taxa embutida" valor={`${percentual(r.taxaImplicita)} a.m.`} detalhe={`${percentual(r.taxaImplicitaAnual)} a.a.`} />
              <CartaoKpi rotulo="Seu rendimento líquido" valor={`${percentual(r.taxaLiquidaMensal)} a.m.`} detalhe={`${percentual(r.taxaLiquidaAnual)} a.a. depois do IR`} />
              <CartaoKpi rotulo="Parcelas em reais de hoje" valor={brl(r.vpParcelas)} detalhe={`contra ${brl(entrada.precoAvista)} à vista`} />
            </GradeKpis>

            <Grafico
              titulo="Quanto valem as parcelas hoje, conforme a taxa de desconto"
              descricao="Curva do valor presente das parcelas em função da taxa. Onde ela cruza o preço à vista está a taxa embutida no parcelamento."
              nota={
                <>
                  <strong>Linha vermelha:</strong> taxa embutida, onde as parcelas valem o preço à vista.
                  <br />
                  <strong>Ponto roxo:</strong> as parcelas descontadas ao seu rendimento valem {brl(r.vpParcelas)}.{' '}
                  {r.avistaMelhor
                    ? 'Acima do preço à vista, pagar à vista compensa.'
                    : 'Abaixo do preço à vista, parcelar compensa.'}
                </>
              }
            >
              <LineChart data={r.curva} margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
                <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                <XAxis
                  dataKey="taxa"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickFormatter={(x: number) => `${numeroBr(x, 1)}%`}
                  label={{ value: 'Taxa de desconto (% ao mês)', position: 'insideBottom', offset: -12 }}
                />
                <YAxis domain={['auto', 'auto']} tickFormatter={(y: number) => brl0(y)} width={84} />
                <Tooltip
                  formatter={(valor) => [brl(Number(valor)), 'Valor presente das parcelas']}
                  labelFormatter={(x) => `Taxa de desconto: ${numeroBr(Number(x), 2)}% a.m.`}
                />
                <Line dataKey="vp" name="Valor presente das parcelas" stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                <ReferenceLine y={entrada.precoAvista} stroke={CORES.laranja} strokeDasharray="6 4" label={{ value: 'Preço à vista', fill: CORES.laranja, position: 'insideTopRight' }} />
                <ReferenceLine x={r.taxaImplicita * 100} stroke={CORES.vermelho} label={{ value: `Taxa embutida: ${numeroBr(r.taxaImplicita * 100, 2)}% a.m.`, fill: CORES.vermelho, position: 'insideTopLeft' }} />
                <ReferenceDot x={r.taxaLiquidaMensal * 100} y={r.vpParcelas} r={7} fill={CORES.roxo} stroke="#fff" label={{ value: `Seu rendimento: ${numeroBr(r.taxaLiquidaMensal * 100, 2)}% a.m.`, fill: CORES.roxo, position: 'right' }} />
              </LineChart>
            </Grafico>

            <AbasDidaticas
              abas={[
                { id: 'explicacao', rotulo: 'Explicação', conteudo: <ExplicacaoAvistaParcelado e={entrada} r={r} /> },
                { id: 'formulas', rotulo: 'Fórmulas', conteudo: <ListaFormulas passos={formulasAvistaParcelado(entrada, r)} /> },
                {
                  id: 'passo',
                  rotulo: 'Passo a passo',
                  conteudo: (
                    <div className="fl-texto">
                      <p>
                        O método começa supondo juros zero e, a cada passo, usa a inclinação da curva para chegar mais perto da taxa
                        que zera a diferença <em>f(i) = valor presente das parcelas − preço à vista</em>. Quando f(i) fica
                        praticamente zero, encontramos a taxa embutida.
                      </p>
                      <Tabela
                        chave={(l) => l.k}
                        linhas={r.iteracoes}
                        colunas={[
                          { titulo: 'Passo', celula: (l) => l.k },
                          { titulo: 'Estimativa da taxa (% a.m.)', celula: (l) => numeroBr(l.x * 100, 6) },
                          { titulo: 'f(i) em R$', celula: (l) => numeroBr(l.fx, 6) },
                          { titulo: "f'(i)", celula: (l) => numeroBr(l.dfx, 2) },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />

            <ParaLevar>
              Compare a taxa embutida no parcelamento com o que o seu dinheiro rende. Se a taxa embutida for maior, pague à vista; se
              for menor, parcele e deixe o dinheiro rendendo.
            </ParaLevar>

            <AcoesRelatorio
              csv={{
                nome: 'finlab-avista-parcelado-newton',
                cabecalho: ['Passo', 'Taxa estimada (% a.m.)', 'f(i) em R$', "f'(i)"],
                linhas: r.iteracoes.map((l) => [l.k, l.x * 100, l.fx, l.dfx]),
              }}
            />
          </>
        )
      }
    />
  );
}
