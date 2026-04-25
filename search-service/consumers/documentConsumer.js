import kafka from '../config/kafka.js';
import client from '../config/elastic.js';
import redis from "../config/redis.js";

const consumer = kafka.consumer({ groupId: 'search-group' });

// Add retry logic for connection
const connectWithRetry = async (retries = 20, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to Kafka... (${i + 1}/${retries})`);
      await consumer.connect();
      console.log('✅ Successfully connected to Kafka!');
      return true;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('Failed to connect after all retries');
        throw error;
      }
      console.log(`Waiting ${delay/1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const runConsumer = async () => {
  // Connect with retry logic
  await connectWithRetry();
  
  // Subscribe with retry logic
  let subscribed = false;
  for (let i = 0; i < 10; i++) {
    try {
      await consumer.subscribe({ topic: 'documents', fromBeginning: false });
      console.log('✅ Successfully subscribed to topic: documents');
      subscribed = true;
      break;
    } catch (error) {
      console.error(`Subscribe attempt ${i + 1} failed:`, error.message);
      if (i === 9) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!subscribed) return;

  // Run consumer
  await consumer.run({
    eachMessage: async ({ message }) => {
      let event;

      try {
        event = JSON.parse(message.value.toString());
      } catch (err) {
        console.error('Invalid message:', err);
        return;
      }

      const { type, data } = event;

      try {
        console.log('processed event..', data)
        const keysByTenantId = await redis.keys(`search:${data.tenant_id}*`);
        console.log('Invalidating cache keys:', keysByTenantId);
        
        if (type === 'DOCUMENT_CREATED' || type === 'DOCUMENT_UPDATED') {
          await client.index({
            index: 'documents',
            id: data.id,
            document: data,
          }).then(async() => {
            console.log('Indexed document:', data.id, data)
            if (keysByTenantId.length) await redis.del(keysByTenantId);
          })
          .catch(err => console.error('Failed to index document:', err));
        }
        
        if (type === 'DOCUMENT_DELETED') {
          await client.delete({
            index: 'documents',
            id: data.id,
          }).then(async()=>{
            if (keysByTenantId.length) await redis.del(keysByTenantId);
          }).catch(err => {
            if (err.meta?.statusCode !== 404) throw err;
          });
        }

      } catch (err) {
        console.error('Failed to process event:', err);
        throw err; // important for retry
      }
    },
  });
};

export { runConsumer };