/**
 * Exportação de tabelas em CSV no formato que o Excel em português abre direto:
 * separador ";" e vírgula decimal, com BOM para preservar os acentos.
 */

export interface TabelaCsv {
  /** Nome do arquivo, sem extensão. */
  nome: string;
  cabecalho: string[];
  linhas: (string | number)[][];
}

function celula(valor: string | number): string {
  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 8 });
  }
  return /[;"\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function gerarCsv({ cabecalho, linhas }: TabelaCsv): string {
  return [cabecalho, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n');
}

export function baixarCsv(tabela: TabelaCsv): void {
  const blob = new Blob(['﻿' + gerarCsv(tabela)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${tabela.nome}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
