const express = require('express');
const router = express.Router();

// controllers
const { registerTenant, updateTenant, getTenant, getAllTenants } = require('../controllers/tenant');

// Routes
// POST /tenants - Register a new tenant
router.post('/register', registerTenant);

// GET /tenants - Get all tenants
router.get('/getAll', getAllTenants);

// GET /tenants/:id - Get tenant by ID
router.get('/:id', getTenant);

// PUT /tenants/:id - Update tenant
router.put('/:id', updateTenant);

module.exports = router;
