import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Grafico } from '../../componentes/Resultados';
import { Termo } from '../../componentes/Termo';
import { SERIES, type ChaveSerie } from '../../dados/series';
import { useTaxas } from '../../dados/TaxasContext';
import type { DadosTaxas } from '../../dados/tipos';
import { fisher } from '../../financas/taxas';
import { CORES } from '../../utils/cores';
import { dataBr, mesAno, numeroBr } from '../../utils/formatacao';

const ORDEM: ChaveSerie[] = ['selic', 'cdi', 'ipca12m', 'ipcaMensal', 'tr', 'poupanca'];

interface PontoHistorico {
  mes: string;
  selic?: number;
  cdi?: number;
  ipca12m?: number;
  juroReal?: number;
}

/** Junta as séries mensais em uma tabela única e calcula o juro real (Fisher) de cada mês. */
function montarHistorico(h: DadosTaxas['historico']): PontoHistorico[] {
  const porMes = new Map<string, PontoHistorico>();
  const preencher = (campo: 'selic' | 'cdi' | 'ipca12m', serie: DadosTaxas['historico']['selic']) => {
    for (const p of serie) {
      const chave = p.data.slice(0, 7);
      const linha = porMes.get(chave) ?? { mes: chave };
      linha[campo] = p.valor;
      porMes.set(chave, linha);
    }
  };
  preencher('selic', h.selic);
  preencher('cdi', h.cdi);
  preencher('ipca12m', h.ipca12m);

  return [...porMes.values()]
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((l) => ({
      ...l,
      juroReal: l.cdi !== undefined && l.ipca12m !== undefined ? fisher(l.cdi / 100, l.ipca12m / 100) * 100 : undefined,
    }));
}

/** Bloco A do Módulo 0: as taxas do Banco Central explicadas, com o histórico de 2 anos. */
export function TaxasDoDia() {
  const { dados } = useTaxas();
  const historico = montarHistorico(dados.historico);
  const juroRealHoje = fisher(dados.cdi.valor / 100, dados.ipca12m.valor / 100);

  return (
    <section className="fl-bloco" aria-labelledby="titulo-taxas">
      <h2 id="titulo-taxas">Parte 1 · As taxas de hoje, explicadas</h2>
      <p className="fl-bloco-intro">
        Toda decisão financeira parte do "preço do dinheiro" no momento. Estas são as taxas oficiais, buscadas agora no Banco Central.
        Passe o mouse sobre os termos sublinhados para ver o que significam.
      </p>

      <div className="fl-cartoes-taxas">
        {ORDEM.map((chave) => {
          const info = SERIES[chave];
          const ponto = dados[chave];
          return (
            <article className="fl-cartao-taxa" key={chave}>
              <header>
                <span>{info.sigla}</span>
                <small>SGS {info.codigo}</small>
              </header>
              <strong>
                {numeroBr(ponto.valor, chave === 'tr' || chave === 'poupanca' ? 4 : 2)}
                <em> {info.unidade}</em>
              </strong>
              <small className="fl-cartao-taxa-data">Referência: {dataBr(ponto.data)}</small>
              <h3>{info.nome}</h3>
              <p>{info.explicacao}</p>
              <small>Quem define: {info.quemDefine}.</small>
            </article>
          );
        })}
      </div>

      <div className="fl-destaque-real">
        <strong>Juro real hoje: {numeroBr(juroRealHoje * 100)}% ao ano</strong>
        <p>
          O <Termo id="cdi">CDI</Termo> ({numeroBr(dados.cdi.valor)}%) parece alto, mas a <Termo id="ipca">inflação</Termo> dos últimos 12 meses
          ({numeroBr(dados.ipca12m.valor)}%) consome parte dele. Pela equação de Fisher, o ganho que sobra, a <Termo id="taxa-real">taxa real</Termo>, é de{' '}
          {numeroBr(juroRealHoje * 100)}% ao ano — e não {numeroBr(dados.cdi.valor - dados.ipca12m.valor)}%, que sairia de uma subtração simples.
        </p>
      </div>

      <Grafico
        titulo="Dois anos de taxas no Brasil"
        descricao="Linhas mensais de Selic, CDI, IPCA em 12 meses e juro real"
        fonte="Banco Central do Brasil (SGS) e IBGE. Juro real calculado pelo FinLab (Fisher)."
      >
        <LineChart data={historico} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={CORES.grade} strokeDasharray="3 3" />
          <XAxis dataKey="mes" tickFormatter={mesAno} minTickGap={24} />
          <YAxis tickFormatter={(y: number) => `${y}%`} width={52} domain={['auto', 'auto']} />
          <Tooltip
            formatter={(valor, nome) => [`${numeroBr(Number(valor))}%`, String(nome)]}
            labelFormatter={(m) => `Mês ${mesAno(String(m))}`}
          />
          <Legend />
          <Line dataKey="selic" name="Selic (meta)" stroke={CORES.tinta} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="cdi" name="CDI" stroke={CORES.verde} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="ipca12m" name="IPCA 12 meses" stroke={CORES.vermelho} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line dataKey="juroReal" name="Juro real (CDI descontada a inflação)" stroke={CORES.roxo} strokeWidth={3} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
        </LineChart>
      </Grafico>
    </section>
  );
}
