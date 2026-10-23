
const { publishToQueue } = require("../../messaging/rabbitmq");

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function createCheckout({ customerName, product, amount }) {
  if (
    typeof customerName !== "string" ||
    !customerName.trim() ||
    typeof product !== "string" ||
    !product.trim() ||
    (typeof amount !== "number" && typeof amount !== "string") ||
    String(amount).trim() === "" ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0
  ) {
    throw new AppError("Dados do pedido inválidos.", 400);
  }

  const order = {
    customerName: customerName.trim(),
    product: product.trim(),
    amount: Number(amount),
  };

  await publishToQueue(order);

  return order;
}

module.exports = {
  createCheckout,
};
