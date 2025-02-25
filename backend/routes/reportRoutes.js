const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { generatePDF, previewPDF } = require('../controllers/pdfController');

// PDF generation routes
router.post('/generate-pdf', protect, generatePDF);
router.post('/preview-pdf', protect, previewPDF);

module.exports = router;