import { useEffect } from 'react';

/** Atualiza o título da aba do navegador. */
export function useTituloPagina(titulo: string): void {
  useEffect(() => {
    document.title = titulo ? `${titulo} · FinLab` : 'FinLab · Simuladores de valor do dinheiro no tempo';
  }, [titulo]);
}
