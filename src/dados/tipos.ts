/** Um valor de uma série do Banco Central em uma data. */
export interface Ponto {
  /** Data no formato ISO (aaaa-mm-dd). */
  data: string;
  /** Valor como publicado pelo BC, em % (ex.: 13.65 = 13,65%). */
  valor: number;
}

/** Conjunto de taxas usado por todos os módulos. */
export interface DadosTaxas {
  /** Meta Selic, % a.a. */
  selic: Ponto;
  /** CDI anualizado (base 252), % a.a. */
  cdi: Ponto;
  /** IPCA acumulado em 12 meses, %. */
  ipca12m: Ponto;
  /** IPCA do mês, %. */
  ipcaMensal: Ponto;
  /** Taxa Referencial, % a.m. */
  tr: Ponto;
  /** Rentabilidade oficial da poupança, % no período de um mês. */
  poupanca: Ponto;
  /** Últimos ~24 meses, um ponto por mês (último valor de cada mês). */
  historico: {
    selic: Ponto[];
    cdi: Ponto[];
    ipca12m: Ponto[];
  };
  /** Momento da consulta ao BC (ISO com horário). */
  consultadoEm: string;
}

/** De onde vieram os dados exibidos. */
export type OrigemDados = 'ao-vivo' | 'cache' | 'offline';
