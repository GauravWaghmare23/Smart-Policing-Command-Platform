import amqp from 'amqplib';
import { env } from './env.js';

let amqpConnection = null;
let amqpChannel = null;
let isRabbitAvailable = false;

export const QUEUES = {
  NOTIFICATIONS: 'police.notifications',
  SOS_ALERTS: 'police.sos.alerts',
  CASE_UPDATES: 'police.case.updates',
  DAILY_REPORTS: 'police.daily.reports',
  AUDIT_LOGS: 'police.audit.logs'
};

export const initRabbitMQ = async () => {
  try {
    amqpConnection = await amqp.connect(env.rabbitmqUrl);
    amqpChannel = await amqpConnection.createChannel();

    // Assert all required persistent queues
    for (const queueName of Object.values(QUEUES)) {
      await amqpChannel.assertQueue(queueName, { durable: true });
    }

    isRabbitAvailable = true;
    console.log('RabbitMQ connected successfully at:', env.rabbitmqUrl);

    amqpConnection.on('error', (err) => {
      isRabbitAvailable = false;
      console.warn('RabbitMQ connection error:', err.message);
    });

    amqpConnection.on('close', () => {
      isRabbitAvailable = false;
    });

    return { connection: amqpConnection, channel: amqpChannel };
  } catch (err) {
    isRabbitAvailable = false;
    console.warn(`RabbitMQ connection skipped (${err.message}). Synchronous fallbacks active.`);
    return null;
  }
};

export const getRabbitChannel = () => amqpChannel;
export const checkRabbitAvailable = () => isRabbitAvailable;

export const publishToQueue = async (queue, messageData) => {
  if (isRabbitAvailable && amqpChannel) {
    try {
      const buffer = Buffer.from(JSON.stringify(messageData));
      return amqpChannel.sendToQueue(queue, buffer, { persistent: true });
    } catch (err) {
      console.warn(`Failed to publish to RabbitMQ queue ${queue}:`, err.message);
    }
  }
  return false;
};
