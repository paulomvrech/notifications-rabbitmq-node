import express, { Request, Response } from "express";
import { getChannel, closeConnection } from "../rabbitmq/connection";
import { env } from "../config/env";

//Esta é a API que o cliente chama.
// Ela não envia o e-mail — só publica uma mensagem na fila e responde imediatamente.
// Esse desacoplamento é o coração da mensageria.

const app = express();
app.use(express.json());

// Formato da mensagem que ira ser trafegada, tipagem
interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

// Rota principal para o disparo de notificacao
app.post("/notifications", async (req, res) => {
  const { to, subject, body } = req.body as Partial<NotificationMessage>;

  // Validacao basica de entrada(body)
  if (!to || !subject || !body) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios: to, subject, bodt" });
  }

  try {
    // Chamando a funcao que garante que existe uma conexao e canal
    const channel = await getChannel();

    // assertQueue garante que a fila existe, se nao exisir é criada
    // durable: true => a fila sobrevive a reinicios do RabbitMQ
    await channel.assertQueue(env.notificationQueue, { durable: true });

    const message: NotificationMessage = { to, subject, body };

    // Mensagem trafegam como Buffer(bytes), serializamos para JSON string
    const payload = Buffer.from(JSON.stringify(message));

    // sendToQueue publica na fila(via default exchange)
    // persistent: true => a mensagem é gravada em disco, nao só na memória
    channel.sendToQueue(env.notificationQueue, payload, { persistent: true });

    console.log(`📤 Notificação enfileirada para: ${to}`);

    // Resondemos com 202 Accepted: "aceitei o pedido, vou processar depois"
    // Esse é o status HTTP semanticamente correto para processamento assincrono
    return res.status(202).json({ message: "Notificação enfileirada" });
  } catch (err) {
    console.error("Erro ao publicar mensagem:", err);
    return res.status(500).json({ error: "Falha ao enfileirar notificação." });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(env.port, () => {
  console.log(`🚀 API rodando em http://localhost:${env.port}`);
});

// Desligamento correto, ao receber CTRL+C fecha a conexao antes de sair
process.on("SIGINT", async () => {
  console.log("\nDesligando API...");
  await closeConnection();
  process.exit(0);
});
