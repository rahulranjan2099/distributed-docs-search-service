// scripts/createIndex.js
import client from '../config/elastic.js';

const exists = await client.indices.exists({ index: 'documents' });

if (!exists) {    
async function createIndex() {
  await client.indices.create({
    index: 'documents',
    body: {
      mappings: {
        properties: {
          file_name: { type: 'text' },
          file_type: { type: 'text' },
          tenant_id: { type: 'integer' },
          createdAt: { type: 'date' },
        }
      }
    }
  });

  console.log("Index created");
}

createIndex();
}