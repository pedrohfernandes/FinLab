import type { ReactNode } from 'react';
import { GLOSSARIO, type IdTermo } from '../conteudo/glossario';

/** Palavra técnica sublinhada, com a definição ao passar o mouse ou focar com o teclado. */
export function Termo({ id, children }: { id: IdTermo; children: ReactNode }) {
  return (
    <span className="fl-termo" tabIndex={0} aria-label={`${typeof children === 'string' ? children : id}: ${GLOSSARIO[id]}`}>
      {children}
      <span className="fl-termo-dica" role="tooltip">
        {GLOSSARIO[id]}
      </span>
    </span>
  );
}
