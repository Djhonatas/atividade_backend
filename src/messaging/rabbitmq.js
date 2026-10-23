
const amqp = require("amqplib");
const { rabbitmqUrl } = require("../config/env");

const QUEUE = "checkout_queue";

let connection;
let channel;

async function connectRabbitMQ() {
  if (channel) {
    return channel;
  }

  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createConfirmChannel();

  await channel.assertQueue(QUEUE, {
    durable: true,
  });

  connection.on("error", (error) => {
    console.error("Erro na conexão RabbitMQ:", error.message);
  });

  connection.on("close", () => {
    channel = null;
    connection = null;
    console.error("Conexão RabbitMQ encerrada.");
  });

  console.log("Conectado ao RabbitMQ.");

  return channel;
}

async function publishToQueue(message) {
  if (!channel) {
    throw new Error("RabbitMQ não está conectado.");
  }

  await new Promise((resolve, reject) => {
    channel.sendToQueue(
      QUEUE,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });
}

async function closeRabbitMQ() {
  const currentChannel = channel;
  const currentConnection = connection;

  channel = null;
  connection = null;

  if (currentChannel) {
    await currentChannel.close().catch(() => {});
  }

  if (currentConnection) {
    await currentConnection.close().catch(() => {});
  }
}

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  closeRabbitMQ,
  QUEUE,
};
