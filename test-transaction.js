
const bcrypt = require("bcryptjs");
const pool = require("./src/database/pool");
const {
  createUserAndAccount,
} = require("./src/database/user-account.transaction");

async function main() {
  const email = `transacao.${Date.now()}@teste.com`;
  const passwordHash = await bcrypt.hash("SenhaTeste123!", 10);

  try {
    // TESTE 1: criação bem-sucedida.
    const user = await createUserAndAccount({
      name: "Teste Transacao",
      email,
      passwordHash,
      balance: 100,
    });

    const accountResult = await pool.query(
      "SELECT id, user_id, balance FROM accounts WHERE user_id = $1",
      [user.id]
    );

    console.log("TESTE 1 - Criação bem-sucedida:");
    console.log("Usuário:", user);
    console.log("Conta:", accountResult.rows[0]);

    // TESTE 2: força uma falha na criação da conta.
    const failedEmail = `rollback.${Date.now()}@teste.com`;

    try {
      await createUserAndAccount({
        name: "Teste Rollback",
        email: failedEmail,
        passwordHash,
        balance: "valor-invalido",
      });
    } catch (error) {
      console.log("\nTESTE 2 - Falha provocada:", error.message);
    }

    // Confirma que o usuário do segundo teste não foi mantido.
    const rollbackResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [failedEmail]
    );

    console.log(
      "Usuário permaneceu após rollback?",
      rollbackResult.rowCount > 0
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Erro no teste:", error);
  process.exitCode = 1;
});
