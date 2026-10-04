/** Definições curtas exibidas ao passar o mouse (ou focar) sobre um termo sublinhado. */
export const GLOSSARIO = {
  selic: 'Taxa básica de juros da economia, definida pelo Copom (Banco Central). Referência para todas as outras taxas.',
  cdi: 'Taxa dos empréstimos entre bancos. Anda colada na Selic e é a régua dos investimentos de renda fixa.',
  ipca: 'Inflação oficial do Brasil, medida pelo IBGE: quanto os preços subiram no período.',
  tr: 'Taxa Referencial. Hoje próxima de zero, é somada ao rendimento da poupança e corrige financiamentos imobiliários.',
  poupanca: 'Caderneta de poupança: rende por regra fixa em lei e é isenta de Imposto de Renda para pessoa física.',
  cdb: 'Certificado de Depósito Bancário: você empresta dinheiro ao banco e recebe juros. Costuma pagar um percentual do CDI.',
  'lci-lca': 'Letras de crédito imobiliário/do agronegócio: investimentos de bancos isentos de Imposto de Renda.',
  'ir-regressivo': 'Alíquota de Imposto de Renda que diminui quanto mais tempo o dinheiro fica aplicado: de 22,5% (até 6 meses) a 15% (mais de 2 anos).',
  'taxa-real': 'Rendimento depois de descontar a inflação: mostra quanto o seu poder de compra realmente aumentou.',
  'taxa-nominal': 'Taxa "de vitrine", sem descontar a inflação. Também chamada de taxa proporcional quando se divide a taxa anual por 12.',
  'taxa-equivalente': 'Taxas de períodos diferentes que rendem exatamente o mesmo (ex.: 12,68% a.a. equivale a 1% a.m. em juros compostos).',
  'valor-presente': 'Quanto um valor que será pago ou recebido no futuro vale hoje, descontados os juros.',
  'custo-oportunidade': 'O que o seu dinheiro renderia na melhor alternativa disponível. É a taxa usada para comparar valores no tempo.',
  'taxa-implicita': 'A taxa de juros escondida em um preço parcelado: aquela que, aplicada ao preço à vista, gera as parcelas cobradas.',
  amortizacao: 'A parte da parcela que realmente reduz a dívida (o resto são juros).',
  'saldo-devedor': 'Quanto ainda falta pagar do valor emprestado, sem contar os juros futuros.',
  sac: 'Sistema de Amortização Constante: a dívida cai o mesmo valor todo mês, então a parcela começa alta e diminui.',
  price: 'Tabela Price: parcelas de valor igual do início ao fim; no começo, a maior parte da parcela é juros.',
  'juros-compostos': 'Juros que incidem sobre o capital e também sobre os juros já acumulados ("juros sobre juros").',
  'newton-raphson': 'Método numérico que chega à solução de uma equação por aproximações sucessivas, cada uma melhor que a anterior.',
} as const;

export type IdTermo = keyof typeof GLOSSARIO;
