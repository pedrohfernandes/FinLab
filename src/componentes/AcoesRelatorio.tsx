/**
 * Botões de saída de cada módulo: relatório em PDF, tabela em CSV e link da simulação.
 */
import { useState } from 'react';
import { baixarCsv, type TabelaCsv } from '../utils/csv';

/**
 * Ações de saída do módulo:
 *  - PDF: abre a impressão do navegador (escolha "Salvar como PDF"); a folha de
 *    estilos de impressão esconde a navegação e mostra todas as abas.
 *  - CSV: tabela completa para abrir no Excel.
 *  - Link: copia a URL, que reproduz exatamente esta simulação.
 */
export function AcoesRelatorio({ csv }: { csv?: TabelaCsv }) {
  const [copiado, setCopiado] = useState(false);

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt('Copie o link desta simulação:', window.location.href);
    }
  };

  return (
    <div className="fl-acoes">
      <button type="button" onClick={() => window.print()}>
        Gerar relatório (PDF)
      </button>
      {csv && (
        <button type="button" onClick={() => baixarCsv(csv)}>
          Exportar tabela (CSV)
        </button>
      )}
      <button type="button" onClick={copiarLink}>
        {copiado ? 'Link copiado!' : 'Copiar link da simulação'}
      </button>
    </div>
  );
}
