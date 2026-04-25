import { Kafka } from 'kafkajs';

const kafkaBroker = process.env.KAFKA_BROKER;
console.log('kafkaBroker:searchapi..', kafkaBroker);
const kafka = new Kafka({
  clientId: 'search-service',
  brokers: [kafkaBroker],
  retry: {
    initialRetryTime: 1000,
    retries: 15,
    factor: 2,
    multiplier: 1.5,
  },
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

export default kafka;