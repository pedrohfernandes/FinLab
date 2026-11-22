/** Metadados da trilha de módulos, usados pela navegação e pela página inicial. */
export interface InfoModulo {
  numero: number;
  caminho: string;
  titulo: string;
  resumo: string;
  conceitos: string[];
  capitulo: string;
  /** Trabalho da disciplina a que o módulo pertence (1: valor do dinheiro no tempo; 2: gestão de investimentos). */
  trabalho: 1 | 2;
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
    trabalho: 1,
  },
  {
    numero: 1,
    caminho: '/avista-parcelado',
    titulo: 'À vista ou parcelado?',
    resumo:
      'Descubra a taxa de juros escondida no "parcelado sem juros" e compare com o que o seu dinheiro renderia aplicado.',
    conceitos: ['Valor presente', 'Soma de PG (anuidade)', 'Taxa implícita', 'Newton-Raphson'],
    capitulo: 'Caps. 4 e 5',
    trabalho: 1,
  },
  {
    numero: 2,
    caminho: '/sac-price',
    titulo: 'SAC ou Price?',
    resumo:
      'Compare os dois sistemas de financiamento mais usados no Brasil e entenda por que "pagar menos juros" não significa "ser mais barato".',
    conceitos: ['Progressão aritmética e geométrica', 'Tabela de amortização', 'Equivalência em valor presente'],
    capitulo: 'Cap. 5',
    trabalho: 1,
  },
  {
    numero: 3,
    caminho: '/beta-capm',
    titulo: 'Quanto risco essa ação carrega?',
    resumo:
      'Meça o beta de uma ação com 5 anos de dados reais, separe o risco que a diversificação elimina do que ela não elimina e calcule o retorno exigido pelo CAPM.',
    conceitos: ['Retorno em excesso', 'Beta por regressão linear', 'Risco sistemático × específico', 'CAPM e SML'],
    capitulo: 'Cap. 11.3–11.4',
    trabalho: 2,
  },
  {
    numero: 4,
    caminho: '/carteira',
    titulo: 'Diversificar reduz o risco?',
    resumo:
      'Monte uma carteira com ações da B3 e veja, com dados reais, como a correlação entre elas derruba a volatilidade — até o limite do risco de mercado.',
    conceitos: ['Retorno esperado da carteira', 'Variância e correlação', 'Beta da carteira', 'Carteiras aleatórias'],
    capitulo: 'Cap. 11.1–11.3',
    trabalho: 2,
  },
];
