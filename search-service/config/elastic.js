import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTIC_URL || 'http://localhost:9200',
});

export default client;