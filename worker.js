
const pool = require("./src/database/pool");
const {
  connectRabbitMQ,
  closeRabbitMQ,
  QUEUE,
} = require("./src/messaging/rabbitmq");

function isValidOrder(order) {
  return (
    order &&
    typeof order.customerName === "string" &&
    order.customerName.trim() !== "" &&
    typeof order.product === "string" &&
    order.product.trim() !== "" &&
    (typeof order.amount === "number" ||
      typeof order.amount === "string") &&
    String(order.amount).trim() !== "" &&
    Number.isFinite(Number(order.amount)) &&
    Number(order.amount) > 0
  );
}

async function processOrder(message, channel) {
  try {
    const order = JSON.parse(message.content.toString());

    if (!isValidOrder(order)) {
      throw new Error("Dados do pedido inválidos.");
    }

    await pool.query(
      `INSERT INTO orders (customer_name, product, amount)
       VALUES ($1, $2, $3)`,
      [
        order.customerName.trim(),
        order.product.trim(),
        Number(order.amount),
      ]
    );

    console.log(`Pedido processado: ${order.product}`);
    channel.ack(message);
  } catch (error) {
    console.error("Erro ao processar pedido:", error.message);

    // Mensagens inválidas não serão recolocadas na fila.
    channel.nack(message, false, false);
  }
}

async function startWorker() {
  const channel = await connectRabbitMQ();

  channel.prefetch(1);

  await channel.consume(QUEUE, (message) => {
    if (message) {
      processOrder(message, channel).catch((error) => {
        console.error("Erro inesperado no processamento:", error);
      });
    }
  });

  console.log(`Worker aguardando mensagens na fila: ${QUEUE}`);
}

async function shutdown() {
  console.log("Encerrando o worker...");

  await closeRabbitMQ();
  await pool.end();

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

startWorker().catch((error) => {
  console.error("Falha ao iniciar o worker:", error);
  process.exit(1);
});
