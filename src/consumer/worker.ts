import { getChannel, closeConnection } from "../rabbitmq/connection";
import { env } from "../config/env";

// É um processo separado da API
// Ele fica ouvindo a fila e processa cada mensagem que chega
// Em produção, poderiamos rodar vários workers em paralelo para dar conta do volume — e o RabbitMQ distribui a carga entre eles

// Formato da mensagem que ira ser trafegada, tipagem
interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

// Simula um envio de e-mail que demora(ex: chamar um servico externo de disparo)
async function sendEmail(notification: NotificationMessage): Promise<void> {
  console.log(`✉ Enviando e-mail para ${notification.to}`);
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log(`✅ E-mail enviado: "${notification.subject}"`);
}

async function startWorker(): Promise<void> {
  // Chamando a funcao que garante que existe uma conexao e canal
  const channel = await getChannel();

  // assertQueue garante que a fila existe, se nao exisir é criada
  // durable: true => a fila sobrevive a reinicios do RabbitMQ
  await channel.assertQueue(env.notificationQueue, { durable: true });

  // Distribui a carga de forma justa entre multiplos workers
  // prefetch(1) => "só me entregue 1 mensagem por vez, só me de a proxima depois que eu confirmar(ack) a atual"
  channel.prefetch(1);

  console.log(`👂 Worker ouvindo a fila "${env.notificationQueue}"...`);

  // noAck: false => nos confirmamos manualmente quando terminar
  // Se o worker morrer antes do ack, a mensagem volta para a fila
  await channel.consume(
    env.notificationQueue,
    async (msg) => {
      if (!msg) return;

      try {
        const notification: NotificationMessage = JSON.parse(
          msg.content.toString(),
        );

        // Chamando a funcao que simula o envio do e-mail
        await sendEmail(notification);

        // ack = "processei com sucesso, pode descartar a mensagem"
        channel.ack(msg);
      } catch (err) {
        console.error("Erro ao processar mensagem:", err);

        // nack com requeue: false => descarta(ou manda para uma dead-letter queue, se configurada)
        // nack com requeue: true => reenfileiraria
        channel.nack(msg, false, false);
      }
    },
    { noAck: false },
  );
}

startWorker().catch((err) => {
  console.error("Falha ao iniciar worker:", err);
  process.exit(1);
});

// Desligamento correto, ao receber CTRL+C fecha a conexao antes de sair
process.on("SIGINT", async () => {
  console.log("\nDescligando worker...");
  await closeConnection();
  process.exit(0);
});
