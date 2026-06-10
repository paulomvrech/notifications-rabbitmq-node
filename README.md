# 📬 API de Notificações com RabbitMQ (Node.js + TypeScript)

Projeto de estudo demonstrando **mensageria assíncrona** com RabbitMQ.
Uma API REST publica notificações em uma fila, e um worker as processa em
background — desacoplando o recebimento do processamento.

## 🏗️ Arquitetura

```
Cliente → API (Express) → RabbitMQ → Worker → "envia e-mail"
```

## 🛠️ Tecnologias
- Node.js + TypeScript
- Express
- RabbitMQ (via amqplib)
- Docker / Docker Compose

## 🚀 Como rodar

```bash
# 1. Suba o RabbitMQ
docker compose up -d

# 2. Instale dependências
npm install

# 3. Em terminais separados:
npm run api      # sobe a API REST
npm run worker   # sobe o worker consumidor
```

## 🧪 Testando

```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{"to":"teste@email.com","subject":"Olá","body":"Mensagem de teste"}'
```

Painel do RabbitMQ: http://localhost:15672 (admin / admin123)

## 📚 Conceitos demonstrados
- Producer/Consumer desacoplados
- Filas duráveis e mensagens persistentes
- Acknowledgements manuais (ack/nack)
- Distribuição de carga com prefetch
- Desligamento gracioso (graceful shutdown)