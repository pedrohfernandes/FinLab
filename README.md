# FinLab

**Simuladores de valor do dinheiro no tempo com dados do Banco Central.**

Trabalho 1 de Administração Financeira (CAD 167 · UFMG · 2º semestre de 2026).

**Autores:** Mariana Sampaio e Pedro Fernandes.

**Versão publicada online:** <https://pedrohfernandes.github.io/FinLab>

O FinLab é um aplicativo que **utiliza dados reais** da API do Banco Central e **gera relatórios** em PDF e CSV de simulações financeiras feitas pelos usuários. Cada resultado vem acompanhado da sua **fundamentação matemática** e **explicação didática** do tema: fórmulas com os números do usuário, demonstrações e passo a passo aplicados ao contexto financeiro brasileiro.

## Objetivo

Ensinar o **valor do dinheiro no tempo** a partir de decisões financeiras reais do brasileiro. O FinLab transforma decisões do dia a dia em simulações com as taxas reais do Brasil e mostra a matemática por trás de cada resultado.

O conteúdo utiliza como base os capítulos 4 (VPL e valor do dinheiro no tempo) e 5 (taxas de juros) de _Fundamentos de Finanças Empresariais_, de Berk, DeMarzo e Harford.

## Módulos

| Módulo | Pergunta              | Conteúdo da disciplina                                                                              |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| 0      | Poupança ou CDB?      | Taxas de juros (Selic, CDI, IPCA, TR), taxa equivalente, IR regressivo, taxa real (Fisher) — Cap. 5 |
| 1      | À vista ou parcelado? | Valor presente, anuidade (soma de PG), taxa implícita por Newton-Raphson — Caps. 4 e 5              |
| 2      | SAC ou Price?         | PA e PG, tabela de amortização, equivalência em valor presente — Cap. 5                             |

Os módulos formam uma trilha: o Módulo 0 explica as taxas e o "custo do dinheiro" que os outros dois usam. Mas qualquer um pode ser aberto diretamente.

### O que cada módulo mostra

- **Módulo 0 — Poupança ou CDB?** Explica cada taxa buscada no Banco Central (Selic, CDI, IPCA, TR e poupança), com histórico de dois anos e o **juro real** calculado pela equação de Fisher; Compara o rendimento da poupança (regra legal) com um CDB de X% do CDI, já descontado o Imposto de Renda regressivo e a inflação, e informa a partir de quantos % do CDI o CDB passa a compensar.
- **Módulo 1 — À vista ou parcelado?** Descobre a **taxa de juros escondida** no "parcelado sem juros" pelo método de Newton-Raphson e a compara com o que o dinheiro renderia aplicado, para dizer se compensa pagar à vista.
- **Módulo 2 — SAC ou Price?** Compara os dois sistemas de amortização (parcelas, juros, saldo devedor) e mostra por que "pagar menos juros" não significa "ser mais barato": em valor presente, descontado pela taxa do contrato, os dois valem o mesmo.

## Funcionalidades

### Em todos os módulos

| Funcionalidade             | Como funciona                                                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Parâmetros editáveis**   | Todos os campos têm um valor padrão. As taxas de mercado vêm do Banco Central e aparecem com o selo **"valor do BC"**; ao editar, o selo some. O botão **Restaurar padrões** volta ao cenário inicial. |
| **Resultado imediato**     | O resultado é recalculado a cada alteração. Valores inválidos ou fora dos limites são sinalizados no campo e não entram no cálculo.                                                                    |
| **Veredito**               | Uma resposta direta à pergunta do módulo, sempre visível acima dos detalhes.                                                                                                                           |
| **Indicadores e gráficos** | Cartões com os números-chave e gráficos interativos (passe o mouse para ver os valores). Alguns gráficos trazem a fonte dos dados e uma frase explicando como lê-los.                                  |
| **Abas didáticas**         | **Explicação** (texto que muda conforme o resultado), **Fórmulas** (com os seus números já substituídos, renderizadas em LaTeX) e **Passo a passo** (iterações do método numérico ou tabela completa). |
| **Glossário**              | Termos como CDI, TR e custo de oportunidade aparecem sublinhados; passe o mouse (ou use o foco do teclado) para ver a definição.                                                                       |
| **Para levar**             | Uma regra de bolso em uma frase, no fim de cada módulo.                                                                                                                                                |
| **Relatório em PDF**       | Veja [Exportação de relatórios](#exportação-de-relatórios).                                                                                                                                            |
| **Exportação em CSV**      | Veja [Exportação de relatórios](#exportação-de-relatórios).                                                                                                                                            |
| **Link da simulação**      | Veja [Link da simulação](#link-da-simulação).                                                                                                                                                          |

### Na página inicial e no topo

- **Faixa de taxas:** Selic, CDI, IPCA em 12 meses e TR do dia, sempre visíveis, com a **origem dos dados** (ao vivo, cache ou offline) e o botão **Atualizar**, que força uma nova consulta ao Banco Central.
- **Página Sobre:** metodologia, tabela das séries do Banco Central usadas e a lista de simplificações assumidas.

## Como executar

### 1. Pré-requisito: Node.js

Instale o **Node.js 20 ou superior** (versão LTS) em <https://nodejs.org>. Para conferir, abra um terminal e rode:

```
node -v
npm -v
```

### 2. Instalar e rodar

Na pasta do projeto:

```
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente <http://localhost:5173>). A primeira instalação precisa de internet.

> O aplicativo consulta a API do Banco Central ao abrir. **Sem internet, ele continua funcionando** com uma cópia de referência das taxas e avisa isso na faixa do topo.

### Outros comandos

| Comando                   | O que faz                                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| `npm run build`           | Confere os tipos e gera a versão final na pasta `dist/`                         |
| `npm run preview`         | Serve a pasta `dist/` localmente                                                |
| `npm test`                | Roda os testes do domínio financeiro                                            |
| `npm run atualizar-dados` | Consulta o Banco Central e atualiza a cópia offline (`src/dados/snapshot.json`) |

## Captura de dados

As taxas vêm da API pública de dados abertos do Banco Central (Sistema Gerenciador de Séries Temporais, SGS), **sem chave de acesso**. A consulta é feita direto do navegador, sem servidor intermediário.

| Série                      | Código SGS | Usada em                                  |
| -------------------------- | ---------- | ----------------------------------------- |
| Meta Selic                 | 432        | Regra da poupança                         |
| CDI anualizado             | 4389       | Rendimento do CDB e custo de oportunidade |
| IPCA acumulado em 12 meses | 13522      | Inflação e taxa real (Fisher)             |
| IPCA mensal                | 433        | Contexto de inflação                      |
| TR                         | 226        | Rendimento da poupança                    |
| Rentabilidade da poupança  | 195        | Conferência do cálculo da poupança        |

### Como os dados são obtidos

A cada abertura, o aplicativo segue esta ordem e **sempre informa na faixa do topo qual foi usada**:

1. **Cache local** (navegador): se a última consulta tem menos de **6 horas**, usa-a sem acessar a rede. Origem: _Cache local_.
2. **Banco Central (ao vivo):** consulta as seis séries em paralelo. Origem: _Ao vivo_.
3. **Cópia offline:** se a consulta falhar (sem internet, API fora do ar, resposta vazia), usa o último cache ou o arquivo `src/dados/snapshot.json`, versionado no repositório. Origem: _Offline_, com a data dos dados.

Detalhes do tratamento:

- Cada série é consultada por intervalo de datas (~25 meses para Selic, CDI e IPCA 12m; 60 dias para TR e poupança). O Banco Central limita séries diárias a janelas de até 10 anos.
- O **último valor válido** de cada série é o do dia (datas futuras já agendadas pela API são ignoradas).
- Para o gráfico de histórico, cada série é reduzida a **um ponto por mês** (o último do mês).
- O botão **Atualizar** ignora o cache e consulta o Banco Central de novo.
- Para renovar a cópia offline, rode `npm run atualizar-dados` e envie o `snapshot.json` atualizado.

## Exportação de relatórios

Cada módulo tem, no final, os botões de exportação.

### Relatório em PDF — "Gerar relatório (PDF)"

Abre a janela de impressão do navegador; escolha **Salvar como PDF**. A folha de estilos de impressão prepara o relatório automaticamente:

- esconde a navegação e os botões;
- mostra **todas as abas** (Explicação, Fórmulas e Passo a passo), não só a aberta;
- inclui um bloco com as **taxas do Banco Central usadas** e a origem dos dados (ao vivo, cache ou offline);
- usa papel **A4 retrato**;
- repete em todas as páginas um **cabeçalho** ("FinLab · Módulo N — título" e a data de geração) e um rodapé com **"Página X de Y"**.

O nome sugerido do arquivo é o título da página, no formato `FinLab - Poupança ou CDB`.

Observações:

- O cabeçalho e a numeração de páginas dependem de **Chrome ou Edge atuais**. Em outros navegadores, o PDF é gerado normalmente, mas sem eles.
- Os gráficos são desenhados no tamanho da janela no momento de imprimir, então o número de páginas varia um pouco com ela. Para um resultado consistente, imprima com a janela **maximizada**.

### Tabela em CSV — "Exportar tabela (CSV)"

Baixa a tabela completa do cálculo, em formato que o **Excel em português abre direto** (separador `;`, vírgula decimal e acentos preservados).

| Módulo | Arquivo                              | Conteúdo                                                                            |
| ------ | ------------------------------------ | ----------------------------------------------------------------------------------- |
| 0      | `finlab-poupanca-cdb.csv`            | Evolução mês a mês: poupança, CDB bruto, alíquota de IR, CDB líquido e inflação     |
| 1      | `finlab-avista-parcelado-newton.csv` | Iterações do método de Newton-Raphson: estimativa da taxa, f(i) e f'(i)             |
| 2      | `finlab-sac-price.csv`               | Tabela de amortização completa de SAC e Price (parcela, juros, amortização e saldo) |

## Link da simulação

O botão **Copiar link da simulação** copia o endereço da página com os parâmetros que você alterou. Quem abrir o link vê **exatamente o mesmo cenário**, o que serve para compartilhar um caso didático, enviar um exercício ou voltar a uma simulação depois.

- Só o que foi **editado** entra no link; o restante usa os padrões. Por isso o link continua acompanhando as taxas do Banco Central para os campos que você não mexeu.
- Os parâmetros ficam depois do `?` do endereço. Exemplo (Módulo 2, R$ 300 mil em 120 meses a 1% ao mês):

  ```
  https://pedrohfernandes.github.io/FinLab/#/sac-price?principal=300000&taxa=1&prazo=120
  ```

- **Restaurar padrões** limpa os parâmetros do link.
- Se o navegador não permitir copiar automaticamente, o aplicativo abre uma caixa com o link para você copiar à mão.

| Módulo | Parâmetros do link                                              |
| ------ | --------------------------------------------------------------- |
| 0      | `valor`, `prazo`, `percentualCdi`, `selic`, `cdi`, `tr`, `ipca` |
| 1      | `avista`, `n`, `parcela`, `antecipada`, `rendimento`, `isento`  |
| 2      | `principal`, `taxa`, `tipoTaxa`, `prazo`, `oportunidade`        |

## Estrutura do código

```
src/
├── financas/     Matemática financeira pura, sem React. Cada função é comentada com
│                 a fórmula e a referência ao capítulo. Testes em __tests__/.
├── dados/        Captura de dados: cliente do Banco Central, cache e snapshot offline
├── modulos/      Um diretório por módulo (cálculo, fórmulas, explicações e página)
├── componentes/  Componentes reutilizáveis (campos, abas, gráficos, fórmulas…)
├── hooks/        Parâmetros na URL e título da página
├── utils/        Formatação de números e exportação de CSV
├── conteudo/     Glossário
├── paginas/      Início e Sobre
├── app/          Roteamento e layout
└── estilos/      Tokens, estilos globais e de impressão
```

Regras: `financas/` não importa nada dos frameworks utilizados. Nela se encontram as definições estáticas dos cálculos realizados na aplicação.

### Tecnologias

React 19 e TypeScript, Vite, React Router, Recharts para os gráficos, KaTeX para as fórmulas e Vitest para os testes.

## Testes

```
npm test
```

Os testes cobrem a matemática financeira (`src/financas/__tests__/`) com casos de referência: os exemplos de SAC dos slides do Capítulo 5, a parcela da Price, a equivalência entre SAC e Price em valor presente, a taxa implícita por Newton-Raphson, a alíquota regressiva do IR nos limites de dias e a regra da poupança conferida com valores oficiais do Banco Central (outubro de 2026 e março de 2021).

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda os testes, gera o build e publica a cada push na `main`. Se os testes falharem, a publicação não acontece.

## Limites do modelo

As simplificações adotadas (taxas constantes, IR por prazo médio, "aniversário" da poupança etc.) estão descritas na página **Sobre** do aplicativo. Os resultados são educacionais e não constituem recomendação de investimento.
