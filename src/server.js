
const app = require("./app");
const pool = require("./database/pool");
const { connectRabbitMQ, closeRabbitMQ } = require("./messaging/rabbitmq");
const { port, databaseUrl, rabbitmqUrl, jwtSecret } = require("./config/env");

let server;

async function startServer() {
  if (!databaseUrl || !rabbitmqUrl || !jwtSecret) {
    throw new Error(
      "Configure DATABASE_URL, RABBITMQ_URL e JWT_SECRET."
    );
  }

  await pool.query("SELECT 1");
  await connectRabbitMQ();

  server = app.listen(port, "0.0.0.0", () => {
    console.log(`API executando na porta ${port}`);
  });
}

async function shutdown() {
  console.log("Encerrando a aplicação...");

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await closeRabbitMQ();
  await pool.end();

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startServer().catch((error) => {
  console.error("Falha ao iniciar a aplicação:", error);
  process.exit(1);
});
