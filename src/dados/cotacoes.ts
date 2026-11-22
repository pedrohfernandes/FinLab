/**
 * Dados de mercado dos Módulos 3 e 4: preços mensais (cotacoes.json, capturados do
 * Yahoo Finance pelo script `npm run atualizar-cotacoes`) e a taxa livre de risco
 * mês a mês (CDI, série 4391 do Banco Central), consultada ao vivo.
 */
import { useEffect, useState } from 'react';
import { buscarCdiMensal } from './bcb';
import arquivo from './cotacoes.json';
import type { DadosCotacoes } from './acoes';
import type { OrigemDados } from './tipos';

/** Preços mensais gravados no repositório. */
export const COTACOES = arquivo as DadosCotacoes;

export interface LivreDeRiscoMensal {
  /** CDI de cada mês de COTACOES.meses, como FRAÇÃO (0,0107 = 1,07% a.m.). */
  valores: number[];
  /** 'ao-vivo' quando veio agora do BC; 'offline' quando é a cópia de cotacoes.json. */
  origem: Extract<OrigemDados, 'ao-vivo' | 'offline'>;
  carregando: boolean;
}

const copiaOffline = (): number[] => COTACOES.cdiMensal.map((v) => v / 100);

// Uma única consulta por visita ao site: os Módulos 3 e 4 compartilham o resultado.
let consulta: Promise<number[]> | null = null;

/** Busca no BC o CDI de todos os meses das cotações; falha se faltar algum mês. */
function consultarBc(): Promise<number[]> {
  consulta ??= buscarCdiMensal(COTACOES.meses[0], COTACOES.meses[COTACOES.meses.length - 1]).then((porMes) =>
    COTACOES.meses.map((mes) => {
      const valor = porMes.get(mes);
      if (valor === undefined) throw new Error(`CDI de ${mes} ausente na resposta do BC`);
      return valor / 100;
    }),
  );
  // Se falhar, a próxima página que pedir tenta de novo.
  consulta.catch(() => (consulta = null));
  return consulta;
}

/**
 * Taxa livre de risco mensal alinhada com as cotações.
 * Começa na cópia offline (a tela nunca fica vazia) e troca pela consulta ao vivo
 * quando ela termina. Se o BC falhar, continua com a cópia e avisa.
 */
export function useLivreDeRiscoMensal(): LivreDeRiscoMensal {
  const [estado, setEstado] = useState<LivreDeRiscoMensal>({ valores: copiaOffline(), origem: 'offline', carregando: true });

  useEffect(() => {
    let ativo = true;
    consultarBc()
      .then((valores) => ativo && setEstado({ valores, origem: 'ao-vivo', carregando: false }))
      .catch(() => ativo && setEstado({ valores: copiaOffline(), origem: 'offline', carregando: false }));
    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
