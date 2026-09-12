import { connectDB } from './config/database.js';
import { initRabbitMQ, QUEUES } from './config/rabbitmq.js';
import { sendRealtimeEvent } from './sockets/socket.js';
import { sendSMS } from './services/twilio.service.js';
import Notification from './models/Notification.js';
import User from './models/User.js';
import Complaint from './models/Complaint.js';
import FIR from './models/FIR.js';
import SOS from './models/SOS.js';
import DailyReport from './models/DailyReport.js';
import AuditLog from './models/AuditLog.js';

const startWorker = async () => {
  await connectDB();
  const mq = await initRabbitMQ();

  if (!mq || !mq.channel) {
    console.warn('RabbitMQ unavailable. Worker will retry connection in 10s...');
    setTimeout(startWorker, 10000);
    return;
  }

  const { channel } = mq;
  console.log('👷 Police Background Asynchronous Worker Active');

  // 1. Process SOS Emergency Notifications
  channel.consume(QUEUES.SOS_ALERTS, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      const { sos, message, recipientPhones = [] } = data;

      // Realtime alerts
      sendRealtimeEvent('control-room', 'sos:new', { message, sos });
      if (sos.nearestStationId?._id || sos.nearestStationId) {
        sendRealtimeEvent(`station:${sos.nearestStationId?._id || sos.nearestStationId}`, 'sos:new', { message, sos });
      }
      if (sos.assignedOfficerId?._id || sos.assignedOfficerId) {
        sendRealtimeEvent(`officer:${sos.assignedOfficerId?._id || sos.assignedOfficerId}`, 'sos:new', { message, sos });
      }

      // Send SMS alert to emergency dispatch phones
      for (const phone of recipientPhones) {
        if (phone) {
          await sendSMS(phone, `🚨 POLICE EMERGENCY SOS: Alert #${sos.sosId} at ${sos.location?.address || 'GPS location'}. Immediate dispatch active.`);
        }
      }

      channel.ack(msg);
    } catch (err) {
      console.error('Error processing SOS alert job:', err.message);
      channel.nack(msg, false, false); // Dead-letter or discard malformed
    }
  });

  // 2. Process General Notifications
  channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      const { recipientId, title, message, type, referenceType, referenceId } = data;

      // Create persistent notification record
      const notif = await Notification.create({
        recipientId,
        type,
        title,
        message,
        referenceType,
        referenceId
      });

      // Emit to rooms
      sendRealtimeEvent(`citizen:${recipientId}`, 'notification:new', { notification: notif });
      sendRealtimeEvent(`officer:${recipientId}`, 'notification:new', { notification: notif });

      channel.ack(msg);
    } catch (err) {
      console.error('Error processing notification job:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // 3. Process Case Updates
  channel.consume(QUEUES.CASE_UPDATES, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      const { complaintId, citizenId, title, note } = data;

      if (citizenId) {
        sendRealtimeEvent(`citizen:${citizenId}`, 'complaint:updated', {
          message: `Update on complaint: ${note}`
        });
      }

      channel.ack(msg);
    } catch (err) {
      console.error('Error processing case update job:', err.message);
      channel.nack(msg, false, false);
    }
  });

  // 4. Process Audit Logs
  channel.consume(QUEUES.AUDIT_LOGS, async (msg) => {
    if (!msg) return;
    try {
      const logData = JSON.parse(msg.content.toString());
      await AuditLog.create(logData);
      channel.ack(msg);
    } catch (err) {
      console.error('Error saving asynchronous audit log job:', err.message);
      channel.nack(msg, false, false);
    }
  });
};

startWorker().catch((err) => {
  console.error('Fatal worker error:', err);
});
