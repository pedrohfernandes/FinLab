import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { ResponsiveContainer } from 'recharts';

/** Cartão com um indicador numérico. */
export function CartaoKpi({ rotulo, valor, detalhe }: { rotulo: ReactNode; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="fl-kpi">
      <span className="fl-kpi-rotulo">{rotulo}</span>
      <strong className="fl-kpi-valor">{valor}</strong>
      {detalhe && <small className="fl-kpi-detalhe">{detalhe}</small>}
    </div>
  );
}

export function GradeKpis({ children }: { children: ReactNode }) {
  return <div className="fl-kpis">{children}</div>;
}

/**
 * A resposta da pergunta do módulo, sempre visível acima das abas didáticas.
 *  - positivo: há uma opção claramente melhor
 *  - atencao:  a melhor opção exige cuidado ou contraria o senso comum
 *  - neutro:   depende do perfil de quem decide
 */
export function Veredito({
  tipo,
  titulo,
  children,
}: {
  tipo: 'positivo' | 'atencao' | 'neutro';
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className={`fl-veredito fl-veredito--${tipo}`} aria-live="polite">
      <strong>{titulo}</strong>
      <p>{children}</p>
    </section>
  );
}

/** Moldura de gráfico com título, descrição para leitores de tela e altura fixa. */
export function Grafico({
  titulo,
  descricao,
  altura = 320,
  children,
}: {
  titulo: string;
  descricao?: string;
  altura?: number;
  children: ReactElement;
}) {
  return (
    <figure className="fl-grafico" aria-label={descricao ?? titulo}>
      <figcaption>{titulo}</figcaption>
      <div style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

interface Aba {
  id: string;
  rotulo: string;
  conteudo: ReactNode;
}

/**
 * Abas didáticas (Explicação / Fórmulas / Passo a passo). A primeira fica aberta
 * por padrão. Todas as abas são renderizadas, e na impressão todas aparecem.
 */
export function AbasDidaticas({ abas }: { abas: Aba[] }) {
  const prefixo = useId();
  const [ativa, setAtiva] = useState(abas[0].id);

  return (
    <section className="fl-abas">
      <div className="fl-abas-lista" role="tablist">
        {abas.map((aba) => (
          <button
            key={aba.id}
            role="tab"
            id={`${prefixo}-aba-${aba.id}`}
            aria-selected={ativa === aba.id}
            aria-controls={`${prefixo}-painel-${aba.id}`}
            className={ativa === aba.id ? 'fl-aba fl-aba--ativa' : 'fl-aba'}
            onClick={() => setAtiva(aba.id)}
          >
            {aba.rotulo}
          </button>
        ))}
      </div>
      {abas.map((aba) => (
        <div
          key={aba.id}
          role="tabpanel"
          id={`${prefixo}-painel-${aba.id}`}
          aria-labelledby={`${prefixo}-aba-${aba.id}`}
          hidden={ativa !== aba.id}
          className="fl-painel"
        >
          <h3 className="fl-so-impressao">{aba.rotulo}</h3>
          {aba.conteudo}
        </div>
      ))}
    </section>
  );
}

interface Coluna<T> {
  titulo: string;
  celula: (linha: T) => ReactNode;
}

/** Tabela com rolagem e cabeçalho fixo. */
export function Tabela<T>({ colunas, linhas, chave }: { colunas: Coluna<T>[]; linhas: T[]; chave: (linha: T) => string | number }) {
  return (
    <div className="fl-tabela" tabIndex={0}>
      <table>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.titulo} scope="col">
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={chave(l)}>
              {colunas.map((c) => (
                <td key={c.titulo}>{c.celula(l)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Frase-regra que fecha o módulo. */
export function ParaLevar({ children }: { children: ReactNode }) {
  return (
    <aside className="fl-levar">
      <span>Para levar</span>
      <p>{children}</p>
    </aside>
  );
}
