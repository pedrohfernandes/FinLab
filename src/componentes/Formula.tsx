/**
 * Utiliza LaTeX para exibição de fórmulas matemáticas.
 */
import { useMemo, type ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface FormulaProps {
  /** Expressão em LaTeX. */
  tex: string;
  /** true: centralizada em bloco; false: dentro do texto. */
  bloco?: boolean;
}

/** Renderiza uma expressão LaTeX com KaTeX. */
export function Formula({ tex, bloco = true }: FormulaProps) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: bloco,
        throwOnError: false,
        output: "htmlAndMathml",
      }),
    [tex, bloco],
  );
  return (
    <span
      className={bloco ? "fl-formula fl-formula--bloco" : "fl-formula"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export interface PassoFormula {
  descricao: ReactNode;
  tex: string;
}

/** Sequência de fórmulas, cada uma precedida de uma frase que explica o que ela faz. */
export function ListaFormulas({ passos }: { passos: PassoFormula[] }) {
  return (
    <div className="fl-formulas">
      {passos.map((passo, i) => (
        <div className="fl-formulas-passo" key={i}>
          <p>{passo.descricao}</p>
          <Formula tex={passo.tex} />
        </div>
      ))}
    </div>
  );
}
