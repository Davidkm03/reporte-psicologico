const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} = require('../controllers/templateController');

router.route('/')
    .post(protect, createTemplate)
    .get(protect, getTemplates);

router.route('/:id')
    .get(protect, getTemplateById)
    .put(protect, updateTemplate)
    .delete(protect, deleteTemplate);

module.exports = router;
