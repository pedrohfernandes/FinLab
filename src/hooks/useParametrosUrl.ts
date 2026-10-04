import { useSearchParams } from 'react-router-dom';

type Valor = number | string | boolean;

/**
 * Guarda os parâmetros de uma simulação na URL, para que o link reproduza o cenário.
 *
 * Só o que o usuário editou vai para a URL; o resto vem dos padrões. Isso permite
 * que os padrões acompanhem as taxas do Banco Central quando elas terminam de
 * carregar, sem sobrescrever o que a pessoa escolheu.
 *
 * `calcularPadroes` recebe o que já foi editado porque alguns padrões dependem de
 * outros campos (ex.: o IR padrão depende do prazo).
 */
export function useParametrosUrl<T extends Record<string, Valor>>(calcularPadroes: (editados: Partial<T>) => T) {
  const [params, setParams] = useSearchParams();

  const modelo = calcularPadroes({});
  const editados: Partial<T> = {};
  for (const chave of Object.keys(modelo) as (keyof T & string)[]) {
    const bruto = params.get(chave);
    if (bruto === null) continue;
    const exemplo = modelo[chave];
    if (typeof exemplo === 'number') {
      const n = parseFloat(bruto);
      if (Number.isFinite(n)) editados[chave] = n as T[typeof chave];
    } else if (typeof exemplo === 'boolean') {
      editados[chave] = (bruto === '1') as T[typeof chave];
    } else {
      editados[chave] = bruto as T[typeof chave];
    }
  }

  const padroes = calcularPadroes(editados);
  const valores = { ...padroes, ...editados } as T;

  const definir = (parcial: Partial<T>) =>
    setParams(
      (anterior) => {
        const proximo = new URLSearchParams(anterior);
        for (const [chave, valor] of Object.entries(parcial)) {
          proximo.set(chave, typeof valor === 'boolean' ? (valor ? '1' : '0') : String(valor));
        }
        return proximo;
      },
      { replace: true },
    );

  const redefinir = () => setParams({}, { replace: true });

  return { valores, padroes, definir, redefinir, editado: Object.keys(editados).length > 0 };
}
