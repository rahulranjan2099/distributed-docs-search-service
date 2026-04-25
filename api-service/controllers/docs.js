const db = require('../models');
const { sendDocumentEvent } = require('../producers/documentProducer.js');
const { Document, Tenant } = db;
const sequelize = db.sequelize;

// Create a new document
const createDoc = async (req, res) => {
  let t;

  try {
    t = await sequelize.transaction();
    const { file_name, file_size, file_type, tenant_id } = req.body;

    // Validate
    if (!file_name || !tenant_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'file_name and tenant_id are required'
      });
    }

    // Check tenant inside transaction
    const tenant = await Tenant.findByPk(tenant_id, { transaction: t });

    if (!tenant) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Create document inside transaction
    const document = await Document.create(
      {
        file_name,
        file_size,
        file_type: file_type || 'unknown',
        tenant_id
      },
      { transaction: t }
    );

    // Commit DB changes first
    await t.commit();
    
    // Then send Kafka event (outside transaction)
    sendDocumentEvent('DOCUMENT_CREATED', document)
    .catch(err => console.error('Kafka error:', err));

    return res.status(201).json({
      success: true,
      message: 'Document created successfully',
      data: document
    });

  } catch (error) {
    if (t) {
      await t.rollback();
    }

    console.error('Error creating document:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
// Get document by ID
const getDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    const document = await Document.findByPk(id, {
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all documents (with optional filtering by tenant_id)
const getAllDocs = async (req, res) => {
  try {
    const { tenant_id } = req.query;
    let whereClause = {};

    if (tenant_id) {
      whereClause.tenant_id = tenant_id;
    }

    const documents = await Document.findAll({
      where: whereClause,
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });

    return res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove document by ID
const removeDoc = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.destroy();
    
    await sendDocumentEvent('DOCUMENT_DELETED', document);

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createDoc,
  getDoc,
  getAllDocs,
  removeDoc
}