import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { initRedis } from './config/redis.js';
import { initRabbitMQ } from './config/rabbitmq.js';
import { initSocket } from './sockets/socket.js';
import { env } from './config/env.js';

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Initialize Redis Client
  initRedis();

  // 3. Initialize RabbitMQ Queues
  await initRabbitMQ();

  // 4. Create HTTP Server
  const server = http.createServer(app);

  // 5. Initialize Socket.IO with Redis
  initSocket(server);

  // 6. Start Server Listening
  server.listen(env.port, () => {
    console.log(`🚔 Smart Police Station server running in ${env.nodeEnv} mode on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error(`Fatal Server Error: ${error.message}`);
  process.exit(1);
});
