# FinLab

**Simuladores de valor do dinheiro no tempo com dados do Banco Central.**

Trabalho 1 de Administração Financeira (CAD 167 · UFMG · 2º semestre de 2026).

O FinLab transforma decisões do dia a dia em simulações com as taxas reais do Brasil e mostra a matemática por trás de cada resultado.

| Módulo | Pergunta              | Conteúdo da disciplina                                                                              |
| ------ | --------------------- | --------------------------------------------------------------------------------------------------- |
| 0      | Poupança ou CDB?      | Taxas de juros (Selic, CDI, IPCA, TR), taxa equivalente, IR regressivo, taxa real (Fisher) — Cap. 5 |
| 1      | À vista ou parcelado? | Valor presente, anuidade (soma de PG), taxa implícita por Newton-Raphson — Caps. 4 e 5              |
| 2      | SAC ou Price?         | PA e PG, tabela de amortização, equivalência em valor presente — Cap. 5                             |

Cada módulo traz: veredito, gráficos, abas **Explicação**, **Fórmulas** (com os números do usuário) e **Passo a passo**, além de relatório em PDF, tabelas em CSV e link que reproduz a simulação.

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

As taxas vêm da API pública do Banco Central (Sistema Gerenciador de Séries Temporais, SGS), sem chave de acesso:

| Série                      | Código SGS |
| -------------------------- | ---------- |
| Meta Selic                 | 432        |
| CDI anualizado             | 4389       |
| IPCA acumulado em 12 meses | 13522      |
| IPCA mensal                | 433        |
| TR                         | 226        |
| Rentabilidade da poupança  | 195        |

A origem dos dados é sempre exibida: **Ao vivo** → **Cache local** (válido por 6 horas) → **Offline** (cópia de referência do repositório).

## Estrutura do código

```
src/
├── financas/     Matemática financeira pura, sem React. Cada função é comentada com
│                 a fórmula e a referência ao capítulo. Testes em __tests__/.
├── dados/        Captura de dados: cliente do Banco Central, cache e snapshot offline
├── modulos/      Um diretório por módulo (cálculo, fórmulas, explicações e página)
├── componentes/  Componentes reutilizáveis (campos, abas, gráficos, fórmulas…)
├── paginas/      Início e Sobre
├── app/          Roteamento e layout
└── estilos/      Tokens, estilos globais e de impressão
```

Regras: `financas/` não importa nada de React nem de `dados/`; as páginas não fazem requisições, só consomem `useTaxas()`.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` roda os testes, gera o build e publica a cada push na `main`. Configure uma vez em **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Limites do modelo

As simplificações adotadas (taxas constantes, IR por prazo médio, "aniversário" da poupança etc.) estão descritas na página **Sobre** do aplicativo. Os resultados são educacionais e não constituem recomendação de investimento.
