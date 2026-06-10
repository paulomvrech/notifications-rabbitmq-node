import amqp, { Channel } from "amqplib";
import { env } from "../config/env";

// Guarda a conexao e o canal em variaveis de modulo
let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
let channel: Channel | null = null;

// Garante que existe uma conexao e canal abertos e retorna o canal
// Usar essa funcao sempre que preciar publicar ou consumir
export async function getChannel(): Promise<Channel> {
  if (channel) return channel;

  console.log("🔌 Conetando ao RabbitMQ...");
  connection = await amqp.connect(env.rabbitmqUrl);

  // Se a conexao cair
  connection.on("error", (err) =>
    console.error("Erro na conexão RabbitMQ", err),
  );
  connection.on("close", () => {
    console.warn("Conexão com RabbitMQ fechada.");
    connection = null;
    channel = null;
  });

  channel = await connection.createChannel();
  console.log("✅ Conectado ao RabbitMQ.");

  return channel;
}

// Fecha tudo de forma limpa, util ao desligar a aplicacao (Ctrl+C)
export async function closeConnection(): Promise<void> {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}
