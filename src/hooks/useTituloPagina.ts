import { useEffect } from 'react';

/**
 * Atualiza o título da aba do navegador, no formato "FinLab - Título".
 * O navegador usa o título como nome sugerido do PDF, e "?" não é aceito em nomes de
 * arquivo (viraria "_"), então ele é removido: "Poupança ou CDB?" → "FinLab - Poupança ou CDB".
 */
export function useTituloPagina(titulo: string): void {
  useEffect(() => {
    const limpo = titulo.replace(/[?:*"<>|\\/]/g, '').trim();
    document.title = limpo ? `FinLab - ${limpo}` : 'FinLab - Simuladores de valor do dinheiro no tempo';
  }, [titulo]);
}
