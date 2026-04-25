const express = require('express')
const router = express.Router()

// controllers
const { createDoc, getDoc, getAllDocs, removeDoc } = require('../controllers/docs')

router.post('/', createDoc)
router.get('/', getAllDocs)
router.get('/:id', getDoc)
router.delete('/:id', removeDoc)

module.exports = router