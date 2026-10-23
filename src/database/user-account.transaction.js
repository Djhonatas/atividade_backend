
const pool = require("./pool");

async function createUserAndAccount({ name, email, passwordHash, balance = 0 }) {
  const client = await pool.connect();

  try {
    // Inicia a transação no PostgreSQL.
    await client.query("BEGIN");

    // Cria o usuário e recupera seu ID.
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, passwordHash]
    );

    const user = userResult.rows[0];

    // Cria uma conta vinculada ao usuário recém-criado.
    await client.query(
      `INSERT INTO accounts (user_id, balance)
       VALUES ($1, $2)`,
      [user.id, balance]
    );

    // Confirma as duas operações juntas.
    await client.query("COMMIT");

    return user;
  } catch (error) {
    // Se qualquer operação falhar, desfaz todas as alterações.
    await client.query("ROLLBACK");
    throw error;
  } finally {
    // Libera a conexão mesmo quando ocorre um erro.
    client.release();
  }
}

module.exports = { createUserAndAccount };
