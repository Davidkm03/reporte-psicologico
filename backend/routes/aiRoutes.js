const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    chatWithAssistant, 
    generateContent, 
    enhanceText, 
    testAiConnection 
} = require('../controllers/aiController');

// AI routes
router.post('/chat', protect, chatWithAssistant);
router.post('/generate-content', protect, generateContent);
router.post('/enhance-text', protect, enhanceText);
router.get('/test', protect, testAiConnection);

module.exports = router;