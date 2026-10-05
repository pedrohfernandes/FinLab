import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { AcoesRelatorio } from '../../componentes/AcoesRelatorio';
import { CampoNumerico } from '../../componentes/Campos';
import { ListaFormulas } from '../../componentes/Formula';
import { ModuloLayout } from '../../componentes/ModuloLayout';
import { AbasDidaticas, CartaoKpi, Grafico, GradeKpis, ParaLevar, Tabela, Veredito } from '../../componentes/Resultados';
import { Termo } from '../../componentes/Termo';
import { useTaxas } from '../../dados/TaxasContext';
import { aliquotaIrRegressivo, DIAS_POR_MES } from '../../financas/impostos';
import { useParametrosUrl } from '../../hooks/useParametrosUrl';
import { CORES } from '../../utils/cores';
import { brl, brl0, numeroBr, percentual } from '../../utils/formatacao';
import { calcularPoupancaCdb, PRAZO_MAXIMO_MESES, validarEntrada, type EntradaPoupancaCdb } from './calculo';
import { ExplicacaoPoupancaCdb } from './explicacoes';
import { formulasPoupancaCdb } from './formulas';
import { TaxasDoDia } from './TaxasDoDia';

export default function PoupancaCdbPagina() {
  const { dados } = useTaxas();
  const { valores: v, padroes, definir, redefinir, editado } = useParametrosUrl(() => ({
    valor: 10000,
    prazo: 24,
    percentualCdi: 100,
    selic: dados.selic.valor,
    cdi: dados.cdi.valor,
    tr: dados.tr.valor,
    ipca: dados.ipca12m.valor,
  }));

  const entrada: EntradaPoupancaCdb = {
    valor: v.valor,
    prazoMeses: Math.round(v.prazo),
    multiploCdi: v.percentualCdi / 100,
    selic: v.selic / 100,
    cdi: v.cdi / 100,
    tr: v.tr / 100,
    ipca12m: v.ipca / 100,
  };
  const erro = validarEntrada(entrada);
  const r = erro ? null : calcularPoupancaCdb(entrada);

  // Só comparamos com o valor oficial quando a pessoa não mexeu na Selic nem na TR.
  const taxasDoBc = v.selic === padroes.selic && v.tr === padroes.tr;
  const poupancaOficial = taxasDoBc ? dados.poupanca.valor / 100 : undefined;

  const parametros = (
    <>
      <CampoNumerico rotulo="Valor aplicado" moeda unidade="R$" valor={v.valor} min={0.01} onChange={(valor) => definir({ valor })} />
      <CampoNumerico rotulo="Prazo" unidade="meses" valor={v.prazo} min={1} max={PRAZO_MAXIMO_MESES} onChange={(prazo) => definir({ prazo: Math.round(prazo) })} />
      <CampoNumerico
        rotulo="Rendimento do CDB"
        unidade="% do CDI"
        valor={v.percentualCdi}
        min={1}
        max={300}
        dica="Bancos grandes costumam oferecer de 80% a 110% do CDI."
        onChange={(percentualCdi) => definir({ percentualCdi })}
      />
      <h3 className="fl-parametros-grupo">Premissas do mercado</h3>
      <p className="fl-parametros-nota">Já vêm do Banco Central. Altere para testar cenários, como "e se a Selic cair?".</p>
      <CampoNumerico rotulo="Meta Selic" unidade="% a.a." valor={v.selic} min={0} max={100} doBc={v.selic === padroes.selic} onChange={(selic) => definir({ selic })} />
      <CampoNumerico rotulo="CDI" unidade="% a.a." valor={v.cdi} min={0} max={100} doBc={v.cdi === padroes.cdi} onChange={(cdi) => definir({ cdi })} />
      <CampoNumerico rotulo="TR" unidade="% a.m." valor={v.tr} min={0} max={5} doBc={v.tr === padroes.tr} onChange={(tr) => definir({ tr })} />
      <CampoNumerico rotulo="Inflação (IPCA 12 meses)" unidade="%" valor={v.ipca} min={-10} max={100} doBc={v.ipca === padroes.ipca} onChange={(ipca) => definir({ ipca })} />
    </>
  );

  const linhasTabela = r
    ? r.evolucao.map((p) => ({ ...p, ir: p.mes === 0 ? undefined : aliquotaIrRegressivo(p.mes * DIAS_POR_MES) }))
    : [];

  return (
    <ModuloLayout
      numero={0}
      titulo="Poupança ou CDB?"
      situacao={
        <>
          Você tem um dinheiro parado e quer aplicá-lo. A poupança é simples e não paga imposto; o CDB promete render mais, mas tem Imposto
          de Renda. Qual realmente rende mais — e será que rende mais do que a inflação?
        </>
      }
      introducao={
        <>
          <TaxasDoDia />
          <h2 className="fl-titulo-parte">Parte 2 · Simule: poupança ou CDB?</h2>
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
              tipo={r.vencedor === 'cdb' ? 'positivo' : r.vencedor === 'poupanca' ? 'atencao' : 'neutro'}
              titulo={r.vencedor === 'cdb' ? 'O CDB rende mais.' : r.vencedor === 'poupanca' ? 'A poupança rende mais.' : 'Empate.'}
            >
              Em {entrada.prazoMeses} meses, o CDB de {numeroBr(v.percentualCdi, 0)}% do CDI termina com {brl(r.saldoFinal.cdbLiquido)} (já descontado o IR) e a poupança com{' '}
              {brl(r.saldoFinal.poupanca)}.{' '}
              {r.vencedor === 'empate'
                ? ''
                : `A diferença é de ${brl(Math.abs(r.ganhoCdbLiquido - r.ganhoPoupanca))} a favor ${r.vencedor === 'cdb' ? 'do CDB' : 'da poupança'}. `}
              O CDB só perde se pagar menos de {numeroBr(r.multiploCdiDeEmpate * 100, 1)}% do CDI.
            </Veredito>

            <GradeKpis umaLinha>
              <CartaoKpi
                rotulo="Poupança"
                valor={`${percentual(r.poupancaMensal, 4)} a.m.`}
                detalhe={
                  poupancaOficial !== undefined
                    ? `${percentual(r.poupancaAnual)} a.a. · BC informa ${percentual(poupancaOficial, 4)}`
                    : `${percentual(r.poupancaAnual)} a.a.`
                }
              />
              <CartaoKpi rotulo="CDB bruto" valor={`${percentual(r.cdbAnualBruto)} a.a.`} detalhe={`IR de ${percentual(r.aliquotaIr, 1)} no resgate`} />
              <CartaoKpi rotulo="Saldo final · poupança" valor={brl(r.saldoFinal.poupanca)} detalhe={`ganho de ${brl(r.ganhoPoupanca)}`} />
              <CartaoKpi rotulo="Saldo final · CDB líquido" valor={brl(r.saldoFinal.cdbLiquido)} detalhe={`ganho de ${brl(r.ganhoCdbLiquido)}`} />
              <CartaoKpi
                rotulo="Ganho real no período"
                valor={`CDB ${percentual(r.retornoRealCdb)}`}
                detalhe={`Poupança ${percentual(r.retornoRealPoupanca)} · inflação ${percentual(r.inflacaoNoPeriodo)}`}
              />
              <CartaoKpi rotulo="CDB empata com a poupança a" valor={`${numeroBr(r.multiploCdiDeEmpate * 100, 1)}% do CDI`} detalhe="neste prazo" />
            </GradeKpis>

            <Grafico
              titulo="Evolução do dinheiro mês a mês"
              descricao="Saldo da poupança, do CDB bruto, do CDB líquido de imposto e a linha da inflação"
              nota="A linha pontilhada mostra quanto o dinheiro precisaria valer só para manter o poder de compra. Acima dela, há ganho real; abaixo, o saldo cresce, mas compra menos."
            >
              <LineChart data={r.evolucao} margin={{ top: 8, right: 16, bottom: 20, left: 4 }}>
                <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
                <XAxis dataKey="mes" label={{ value: 'Meses', position: 'insideBottom', offset: -10 }} />
                <YAxis domain={['auto', 'auto']} tickFormatter={(y: number) => brl0(y)} width={84} />
                <Tooltip formatter={(valor, nome) => [brl(Number(valor)), String(nome)]} labelFormatter={(m) => `Mês ${m}`} />
                <Legend verticalAlign="top" />
                <Line dataKey="poupanca" name="Poupança" stroke={CORES.verde} strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line dataKey="cdbLiquido" name="CDB líquido de IR" stroke={CORES.roxo} strokeWidth={3} dot={false} isAnimationActive={false} />
                <Line dataKey="cdbBruto" name="CDB bruto" stroke={CORES.roxoClaro} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                <Line dataKey="inflacao" name="Valor corrigido pela inflação (IPCA)" stroke={CORES.cinza} strokeWidth={2} strokeDasharray="2 4" dot={false} isAnimationActive={false} />
              </LineChart>
            </Grafico>

            <AbasDidaticas
              abas={[
                { id: 'explicacao', rotulo: 'Explicação', conteudo: <ExplicacaoPoupancaCdb e={entrada} r={r} poupancaOficial={poupancaOficial} /> },
                { id: 'formulas', rotulo: 'Fórmulas', conteudo: <ListaFormulas passos={formulasPoupancaCdb(entrada, r)} /> },
                {
                  id: 'passo',
                  rotulo: 'Passo a passo',
                  conteudo: (
                    <div className="fl-texto">
                      <p>
                        Evolução mês a mês. Note que a coluna do CDB líquido "dá um salto" quando a alíquota do <Termo id="ir-regressivo">IR regressivo</Termo> cai
                        (aos 6, 12 e 24 meses): quanto mais tempo aplicado, menos imposto.
                      </p>
                      <Tabela
                        chave={(l) => l.mes}
                        linhas={linhasTabela}
                        colunas={[
                          { titulo: 'Mês', celula: (l) => l.mes },
                          { titulo: 'Poupança', celula: (l) => brl(l.poupanca) },
                          { titulo: 'CDB bruto', celula: (l) => brl(l.cdbBruto) },
                          { titulo: 'IR se resgatar', celula: (l) => (l.ir === undefined ? '—' : percentual(l.ir, 1)) },
                          { titulo: 'CDB líquido', celula: (l) => brl(l.cdbLiquido) },
                          { titulo: 'Inflação', celula: (l) => brl(l.inflacao) },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />

            <ParaLevar>
              Compare sempre o rendimento líquido de imposto e acima da inflação. Com a Selic acima de 8,5% ao ano, a poupança rende
              cerca de 0,5% ao mês mais a TR, e um CDB que pague pelo menos {numeroBr(r.multiploCdiDeEmpate * 100, 0)}% do CDI a supera neste prazo.
            </ParaLevar>

            <AcoesRelatorio
              csv={{
                nome: 'finlab-poupanca-cdb',
                cabecalho: ['Mês', 'Poupança', 'CDB bruto', 'Alíquota IR se resgatar', 'CDB líquido', 'Inflação'],
                linhas: linhasTabela.map((l) => [l.mes, l.poupanca, l.cdbBruto, l.ir ?? '', l.cdbLiquido, l.inflacao]),
              }}
            />
          </>
        )
      }
    />
  );
}
