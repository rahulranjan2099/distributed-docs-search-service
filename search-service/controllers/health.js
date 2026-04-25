// controllers/health.js
import { sequelize } from '../models/index.js';
import redis from '../config/redis.js';
import client from '../config/elastic.js';
import kafka from '../config/kafka.js';

const healthCheck = async (req, res) => {
  const services = {};

  // DB check
  try {
    await sequelize.authenticate();
    services.database = 'up';
  } catch (err) {
    services.database = 'down';
  }

  // Redis check
  try {
    await redis.ping();
    services.redis = 'up';
  } catch (err) {
    services.redis = 'down';
  }

  // Elasticsearch check
  try {
    await client.cluster.health();
    services.elasticsearch = 'up';
  } catch (err) {
    services.elasticsearch = 'down';
  }

  // Kafka check
  try {
    const admin = kafka.admin();
    await admin.connect();
    await admin.disconnect();
    services.kafka = 'up';
  } catch (err) {
    services.kafka = 'down';
  }

  const isHealthy = Object.values(services).every(
    (status) => status === 'up'
  );

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    services
  });
};

export { healthCheck };