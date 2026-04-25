import express from 'express';
import { searchDocs } from '../controllers/search.js';
import rateLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

// GET /search?q={file_name %like% } & tenant={tenantId} & file_name={file_name} ... - Search documents
router.get('/', rateLimiter, searchDocs);

export default router;
