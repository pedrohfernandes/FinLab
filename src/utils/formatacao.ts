/** Formatação de números, moeda e datas no padrão brasileiro. */

export const brl = (x: number): string => x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Reais sem centavos, para eixos de gráfico. */
export const brl0 = (x: number): string =>
  x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** Número com casas decimais fixas (vírgula decimal, ponto de milhar). */
export const numeroBr = (x: number, casas = 2): string =>
  x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** Recebe uma FRAÇÃO (0,0925) e devolve "9,25%". */
export const percentual = (fracao: number, casas = 2): string => `${numeroBr(fracao * 100, casas)}%`;

/** "2026-10-04" → "04/10/2026" (sem passar por Date, para não sofrer com fuso horário). */
export const dataBr = (iso: string): string => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

/** "2026-10" ou "2026-10-04" → "10/26". */
export const mesAno = (iso: string): string => {
  const [ano, mes] = iso.split('-');
  return `${mes}/${ano.slice(2)}`;
};

export const dataHoraBr = (iso: string): string =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** Número para dentro de uma fórmula LaTeX (a vírgula decimal precisa de chaves). */
export const numeroTex = (x: number, casas = 2): string => numeroBr(x, casas).replace(',', '{,}');

/** Fração → porcentagem em LaTeX: 0,0925 → "9{,}25\%". */
export const percentualTex = (fracao: number, casas = 2): string => `${numeroTex(fracao * 100, casas)}\\%`;

/** Valor em reais dentro de LaTeX: "R\$\,1.080{,}00". */
export const brlTex = (x: number): string => `R\\$\\,${numeroTex(x)}`;

/** Pluraliza "mês/meses". */
export const meses = (n: number): string => `${n} ${n === 1 ? 'mês' : 'meses'}`;
