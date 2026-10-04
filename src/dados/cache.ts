/**
 * Cache das taxas no localStorage, para não consultar o BC a cada navegação.
 */
import type { DadosTaxas } from "./tipos";

const CHAVE = "finlab:taxas:v1";

/** Validade do cache: 6 horas. */
export const VALIDADE_CACHE_MS = 6 * 60 * 60 * 1000;

interface EntradaCache {
  salvoEm: number;
  dados: DadosTaxas;
}

export function lerCache(): EntradaCache | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const entrada = JSON.parse(bruto) as EntradaCache;
    return entrada?.dados?.selic ? entrada : null;
  } catch {
    return null;
  }
}

export function salvarCache(dados: DadosTaxas): void {
  try {
    const entrada: EntradaCache = { salvoEm: Date.now(), dados };
    localStorage.setItem(CHAVE, JSON.stringify(entrada));
  } catch {
    // sem cache, a próxima visita consulta o BC de novo
  }
}

export function cacheEstaValido(entrada: EntradaCache): boolean {
  return Date.now() - entrada.salvoEm < VALIDADE_CACHE_MS;
}
