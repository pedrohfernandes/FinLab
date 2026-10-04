/**
 * Resolução numérica de equações f(x) = 0.
 *
 * Várias perguntas financeiras (qual a taxa embutida no parcelamento? qual a TIR?)
 * levam a equações polinomiais de grau alto, sem fórmula fechada. Resolvemos com
 * o método de Newton-Raphson, guardando cada iteração para mostrar ao aluno.
 */

export interface IteracaoNewton {
  /** Número da iteração (começa em 0). */
  k: number;
  /** Estimativa atual da raiz. */
  x: number;
  /** f(x) na estimativa atual: quanto falta para zerar a equação. */
  fx: number;
  /** f'(x): inclinação da curva na estimativa atual. */
  dfx: number;
}

export interface ResultadoNewton {
  raiz: number;
  convergiu: boolean;
  iteracoes: IteracaoNewton[];
}

export interface OpcoesNewton {
  /** Para quando |f(x)| fica abaixo deste valor. */
  tolerancia?: number;
  maxIteracoes?: number;
  /** Limite inferior de segurança para x (taxas nunca devem chegar a −100%). */
  minimo?: number;
}

/**
 * Método de Newton-Raphson.
 *
 * Ideia: em cada passo, trocar a curva pela sua reta tangente e usar o ponto
 * onde a reta cruza o eixo como nova estimativa:
 *   x_{k+1} = x_k − f(x_k)/f'(x_k)
 *
 * Para funções convexas e decrescentes (como o VP em função da taxa), partir
 * de x0 à esquerda da raiz garante convergência monótona.
 */
export function newtonRaphson(
  f: (x: number) => number,
  df: (x: number) => number,
  x0: number,
  { tolerancia = 1e-9, maxIteracoes = 50, minimo = -0.99 }: OpcoesNewton = {},
): ResultadoNewton {
  const iteracoes: IteracaoNewton[] = [];
  let x = x0;

  for (let k = 0; k < maxIteracoes; k++) {
    const fx = f(x);
    const dfx = df(x);
    iteracoes.push({ k, x, fx, dfx });

    if (Math.abs(fx) < tolerancia) return { raiz: x, convergiu: true, iteracoes };
    if (dfx === 0) return { raiz: x, convergiu: false, iteracoes };

    const proximo = Math.max(x - fx / dfx, minimo);
    if (Math.abs(proximo - x) < 1e-14) return { raiz: proximo, convergiu: true, iteracoes };
    x = proximo;
  }
  return { raiz: x, convergiu: false, iteracoes };
}
