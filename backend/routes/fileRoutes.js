const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    uploadLogo, 
    uploadWatermark, 
    uploadHeader, 
    uploadFooter, 
    uploadSignature, 
    deleteFile, 
    serveFile 
} = require('../controllers/fileController');

// File upload routes
router.post('/upload-logo', protect, uploadLogo);
router.post('/upload-watermark', protect, uploadWatermark);
router.post('/upload-header', protect, uploadHeader);
router.post('/upload-footer', protect, uploadFooter);
router.post('/upload-signature', protect, uploadSignature);

// File deletion route
router.delete('/:type/:filename', protect, deleteFile);

// Serve files
router.get('/uploads/:type/:filename', serveFile);

module.exports = router;