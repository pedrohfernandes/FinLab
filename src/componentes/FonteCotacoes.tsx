/**
 * Linha de fonte dos dados de mercado (Módulos 3 e 4): de onde vêm os preços e o CDI mensal.
 */
import { COTACOES, type LivreDeRiscoMensal } from '../dados/cotacoes';
import { dataBr, mesAno } from '../utils/formatacao';

/** Texto com as fontes dos preços (Yahoo, capturados pelo script) e do CDI mensal (BC, ao vivo ou cópia). */
export function descreverFontes(cdi: LivreDeRiscoMensal): string {
  const periodo = `${mesAno(COTACOES.meses[0])} a ${mesAno(COTACOES.meses[COTACOES.meses.length - 1])}`;
  const origemCdi = cdi.carregando ? 'consultando o Banco Central…' : cdi.origem === 'ao-vivo' ? 'Banco Central, ao vivo' : 'cópia offline do Banco Central';
  return `Preços mensais ajustados por proventos: Yahoo Finance, ${periodo}, capturados em ${dataBr(COTACOES.geradoEm)} · CDI mensal (SGS 4391): ${origemCdi}`;
}

export function FonteCotacoes({ cdi }: { cdi: LivreDeRiscoMensal }) {
  return (
    <p className="fl-fonte-mercado">
      <span className={`fl-status-ponto fl-status-ponto--${cdi.carregando ? 'carregando' : cdi.origem}`} aria-hidden="true" />
      {descreverFontes(cdi)}
    </p>
  );
}
