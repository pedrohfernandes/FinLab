/**
 * Entrega as taxas do Banco Central a todo o aplicativo e decide de onde elas vêm
 * (cache, consulta ao vivo ou cópia offline).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { carregarTaxasDoBcb } from './bcb';
import { cacheEstaValido, lerCache, salvarCache } from './cache';
import snapshot from './snapshot.json';
import type { DadosTaxas, OrigemDados } from './tipos';

interface TaxasEstado {
  /** Sempre definido: começa no snapshot e é substituído quando a consulta termina. */
  dados: DadosTaxas;
  origem: OrigemDados;
  carregando: boolean;
  /** Força uma nova consulta ao BC, ignorando o cache. */
  atualizar: () => void;
}

const TaxasContext = createContext<TaxasEstado | null>(null);

/**
 * Estratégia de obtenção das taxas (a interface sempre indica qual foi usada):
 *   1. cache local com menos de 6 h  → "cache"
 *   2. consulta ao BC (timeout de 8 s) → "ao-vivo"
 *   3. falhou? cache antigo ou snapshot versionado no repositório → "offline"
 */
export function TaxasProvider({ children }: { children: ReactNode }) {
  // Começa na cópia offline para a tela nunca ficar vazia enquanto a consulta ao BC não termina.
  const [dados, setDados] = useState<DadosTaxas>(snapshot as DadosTaxas);
  const [origem, setOrigem] = useState<OrigemDados>('offline');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (ignorarCache: boolean) => {
    const emCache = lerCache();
    if (!ignorarCache && emCache && cacheEstaValido(emCache)) {
      setDados(emCache.dados);
      setOrigem('cache');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    try {
      const novos = await carregarTaxasDoBcb();
      salvarCache(novos);
      setDados(novos);
      setOrigem('ao-vivo');
    } catch {
      setDados(emCache ? emCache.dados : (snapshot as DadosTaxas));
      setOrigem('offline');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(false);
  }, [carregar]);

  const valor = useMemo<TaxasEstado>(
    () => ({ dados, origem, carregando, atualizar: () => void carregar(true) }),
    [dados, origem, carregando, carregar],
  );

  return <TaxasContext.Provider value={valor}>{children}</TaxasContext.Provider>;
}

export function useTaxas(): TaxasEstado {
  const contexto = useContext(TaxasContext);
  if (!contexto) throw new Error('useTaxas precisa estar dentro de <TaxasProvider>');
  return contexto;
}
