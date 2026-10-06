/**
 * Termo técnico sublinhado, com a definição do glossário em balão ao passar o mouse ou focar.
 */
import type { ReactNode } from 'react';
import { GLOSSARIO, type IdTermo } from '../conteudo/glossario';

/** Palavra técnica sublinhada, com a definição ao passar o mouse ou focar com o teclado. */
export function Termo({ id, children }: { id: IdTermo; children: ReactNode }) {
  return (
    // tabIndex permite abrir o balão pelo teclado: o CSS mostra a dica em :hover e em :focus.
    <span className="fl-termo" tabIndex={0} aria-label={`${typeof children === 'string' ? children : id}: ${GLOSSARIO[id]}`}>
      {children}
      <span className="fl-termo-dica" role="tooltip">
        {GLOSSARIO[id]}
      </span>
    </span>
  );
}
