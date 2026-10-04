import type { ReactNode } from 'react';
import { useTaxas } from '../dados/TaxasContext';
import { useTituloPagina } from '../hooks/useTituloPagina';
import { dataHoraBr, numeroBr } from '../utils/formatacao';
import { descreverOrigem } from './StatusDados';

interface ModuloLayoutProps {
  numero: number;
  titulo: string;
  /** Situação concreta que motiva o módulo, em 2–3 linhas. */
  situacao: ReactNode;
  /** Conteúdo em largura total, antes da simulação (ex.: as taxas do dia no Módulo 0). */
  introducao?: ReactNode;
  parametros: ReactNode;
  resultados: ReactNode;
  /** Quando há parâmetros editados, mostra o botão de restaurar os padrões. */
  onRedefinir?: () => void;
}

/**
 * Moldura comum a todos os módulos:
 *   cabeçalho (pergunta + situação) → parâmetros | resultados (veredito, gráficos, abas).
 * Na impressão, vira o cabeçalho do relatório com a data e as taxas usadas.
 */
export function ModuloLayout({ numero, titulo, situacao, introducao, parametros, resultados, onRedefinir }: ModuloLayoutProps) {
  const { dados, origem } = useTaxas();
  useTituloPagina(titulo);

  return (
    <article className="fl-modulo">
      <header className="fl-modulo-topo">
        <span className="fl-etiqueta">Módulo {numero}</span>
        <h1>{titulo}</h1>
        <p>{situacao}</p>
      </header>

      <div className="fl-so-impressao fl-relatorio-cabecalho">
        <strong>
          FinLab · Relatório do Módulo {numero} — {titulo}
        </strong>
        <p>Gerado em {dataHoraBr(new Date().toISOString())}.</p>
        <p>
          Taxas do Banco Central: Selic {numeroBr(dados.selic.valor)}% a.a. · CDI {numeroBr(dados.cdi.valor)}% a.a. · IPCA 12m{' '}
          {numeroBr(dados.ipca12m.valor)}% · TR {numeroBr(dados.tr.valor, 4)}% a.m. ({descreverOrigem(origem, dados.consultadoEm)}).
        </p>
      </div>

      {introducao}

      <div className="fl-grade">
        <aside className="fl-parametros">
          <h2>Parâmetros</h2>
          {parametros}
          {onRedefinir && (
            <button type="button" className="fl-botao-leve" onClick={onRedefinir}>
              Restaurar padrões
            </button>
          )}
        </aside>
        <div className="fl-resultados">{resultados}</div>
      </div>
    </article>
  );
}
