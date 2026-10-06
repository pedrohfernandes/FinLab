/**
 * Mostra de onde vieram as taxas (ao vivo, cache ou offline) e a faixa de taxas do topo.
 */
import { useTaxas } from '../dados/TaxasContext';
import { dataBr, dataHoraBr } from '../utils/formatacao';

/** Texto que explica de onde vieram as taxas exibidas. */
export function descreverOrigem(origem: 'ao-vivo' | 'cache' | 'offline', consultadoEm: string): string {
  switch (origem) {
    case 'ao-vivo':
      return `Ao vivo · Banco Central · consultado em ${dataHoraBr(consultadoEm)}`;
    case 'cache':
      return `Cache local · Banco Central · consultado em ${dataHoraBr(consultadoEm)}`;
    case 'offline':
      return `Offline · dados de referência de ${dataBr(consultadoEm)}`;
  }
}

/** Indicador da origem dos dados, com botão para atualizar. */
export function StatusDados() {
  const { dados, origem, carregando, atualizar } = useTaxas();
  return (
    <div className="fl-status">
      <span className={`fl-status-ponto fl-status-ponto--${carregando ? 'carregando' : origem}`} aria-hidden="true" />
      <span>{carregando ? 'Consultando o Banco Central…' : descreverOrigem(origem, dados.consultadoEm)}</span>
      <button type="button" onClick={atualizar} disabled={carregando}>
        Atualizar
      </button>
    </div>
  );
}

/** Faixa fixa no topo com as taxas do dia. */
export function FaixaTaxas() {
  const { dados } = useTaxas();
  const itens = [
    { nome: 'Selic', valor: dados.selic.valor, sufixo: '% a.a.' },
    { nome: 'CDI', valor: dados.cdi.valor, sufixo: '% a.a.' },
    { nome: 'IPCA 12m', valor: dados.ipca12m.valor, sufixo: '%' },
    { nome: 'TR', valor: dados.tr.valor, sufixo: '% a.m.', casas: 4 },
  ];
  return (
    <div className="fl-faixa">
      <ul>
        {itens.map((i) => (
          <li key={i.nome}>
            <span>{i.nome}</span>
            <strong>
              {i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: i.casas ?? 2 })}
              {i.sufixo}
            </strong>
          </li>
        ))}
      </ul>
      <StatusDados />
    </div>
  );
}
