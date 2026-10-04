/**
 * Consulta o Banco Central e grava src/dados/snapshot.json.
 *
 * O snapshot é o plano B do aplicativo: se a API estiver fora do ar (ou sem
 * internet ao rodar o projeto), o FinLab usa estes valores e avisa que são offline.
 *
 * Uso: npm run atualizar-dados
 */
import { writeFileSync } from "node:fs";
import { carregarTaxasDoBcb } from "../src/dados/bcb";

const dados = await carregarTaxasDoBcb();
writeFileSync(
  new URL("../src/dados/snapshot.json", import.meta.url),
  JSON.stringify(dados, null, 2) + "\n",
);

console.log("snapshot.json atualizado:");
console.log(`  Selic ${dados.selic.valor}% (${dados.selic.data})`);
console.log(`  CDI ${dados.cdi.valor}% (${dados.cdi.data})`);
console.log(`  IPCA 12m ${dados.ipca12m.valor}% (${dados.ipca12m.data})`);
console.log(`  TR ${dados.tr.valor}% (${dados.tr.data})`);
console.log(`  Poupança ${dados.poupanca.valor}% (${dados.poupanca.data})`);
