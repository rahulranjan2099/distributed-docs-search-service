const { Kafka } = require('kafkajs')

const kafkaBroker = process.env.KAFKA_BROKER
console.log('kafkaBrokerapiservice..', kafkaBroker)
const kafka = new Kafka({
    clientId: 'api-service',
    brokers: [kafkaBroker]
});

const producer = kafka.producer()

const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('Kafka producer connected');
    } catch (error) {
        console.error('Error connecting Kafka producer:', error);
    }
}

module.exports = {
    kafka,
    producer,
    connectProducer
}