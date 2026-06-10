import "dotenv/config";

// Centralizar e validar as variaveis de ambiente em um unico ponto
// Se alguma variavel obrigatoria faltar, a aplicacao falha logo cedo
function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${key}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  rabbitmqUrl: required("RABBITMQ_URL"),
  notificationQueue: required("NOTITICATION_QUEUE"),
};
