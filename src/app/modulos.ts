/** Metadados da trilha de módulos, usados pela navegação e pela página inicial. */
export interface InfoModulo {
  numero: number;
  caminho: string;
  titulo: string;
  resumo: string;
  conceitos: string[];
  capitulo: string;
}

export const MODULOS: InfoModulo[] = [
  {
    numero: 0,
    caminho: '/poupanca-cdb',
    titulo: 'Poupança ou CDB?',
    resumo:
      'Veja as taxas de juros do Brasil hoje, o que cada uma significa, e descubra onde o seu dinheiro rende mais — depois do imposto e da inflação.',
    conceitos: ['Selic, CDI, IPCA e TR', 'Taxa equivalente', 'IR regressivo', 'Taxa real (Fisher)'],
    capitulo: 'Cap. 5',
  },
  {
    numero: 1,
    caminho: '/avista-parcelado',
    titulo: 'À vista ou parcelado?',
    resumo:
      'Descubra a taxa de juros escondida no "parcelado sem juros" e compare com o que o seu dinheiro renderia aplicado.',
    conceitos: ['Valor presente', 'Soma de PG (anuidade)', 'Taxa implícita', 'Newton-Raphson'],
    capitulo: 'Caps. 4 e 5',
  },
  {
    numero: 2,
    caminho: '/sac-price',
    titulo: 'SAC ou Price?',
    resumo:
      'Compare os dois sistemas de financiamento mais usados no Brasil e entenda por que "pagar menos juros" não significa "ser mais barato".',
    conceitos: ['Progressão aritmética e geométrica', 'Tabela de amortização', 'Equivalência em valor presente'],
    capitulo: 'Cap. 5',
  },
];
