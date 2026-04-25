const db = require('../models');
const { Tenant } = db;

// Register a new tenant
const registerTenant = async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    // Validate input
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'first_name, last_name, and email are required'
      });
    }

    // Check if email already exists
    const existingTenant = await Tenant.findOne({ where: { email } });
    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new tenant
    const tenant = await Tenant.create({
      first_name,
      last_name,
      email
    });

    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error registering tenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update tenant information
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email } = req.body;

    // Find tenant
    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if new email already exists (only if email is being updated)
    if (email && email !== tenant.email) {
      const existingTenant = await Tenant.findOne({ where: { email } });
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update tenant
    await tenant.update({
      first_name: first_name || tenant.first_name,
      last_name: last_name || tenant.last_name,
      email: email || tenant.email
    });

    return res.status(200).json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get tenant by ID
const getTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id, {
      include: ['documents']
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all tenants
const getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      include: ['documents']
    });

    return res.status(200).json({
      success: true,
      data: tenants
    });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  registerTenant,
  updateTenant,
  getTenant,
  getAllTenants
};
