const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiService');

// @desc    Get response from AI assistant
// @route   POST /api/ai/chat
// @access  Private
const chatWithAssistant = asyncHandler(async (req, res) => {
    const { message, options } = req.body;
    
    if (!message) {
        res.status(400);
        throw new Error('Message is required');
    }
    
    try {
        // Get response from AI service
        const response = await aiService.generateResponse(message, {
            ...options,
            userId: req.user._id
        });
        
        res.status(200).json({ 
            success: true, 
            response
        });
    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500);
        throw new Error('Failed to process AI request: ' + error.message);
    }
});

// @desc    Generate content for report sections
// @route   POST /api/ai/generate-content
// @access  Private
const generateContent = asyncHandler(async (req, res) => {
    const { sectionType, reportData, options } = req.body;
    
    if (!sectionType || !reportData) {
        res.status(400);
        throw new Error('Section type and report data are required');
    }
    
    try {
        // Generate content from AI service
        const content = await aiService.generateReportContent(sectionType, reportData, {
            ...options,
            userId: req.user._id
        });
        
        res.status(200).json({ 
            success: true, 
            content
        });
    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500);
        throw new Error('Failed to generate content: ' + error.message);
    }
});

// @desc    Enhance existing text
// @route   POST /api/ai/enhance-text
// @access  Private
const enhanceText = asyncHandler(async (req, res) => {
    const { text, enhancementType, options } = req.body;
    
    if (!text) {
        res.status(400);
        throw new Error('Text is required');
    }
    
    try {
        // Enhance text using AI service
        const enhancedText = await aiService.enhanceText(text, enhancementType, {
            ...options,
            userId: req.user._id
        });
        
        res.status(200).json({ 
            success: true, 
            enhancedText
        });
    } catch (error) {
        console.error('Error enhancing text:', error);
        res.status(500);
        throw new Error('Failed to enhance text: ' + error.message);
    }
});

// @desc    Test AI assistant connection
// @route   GET /api/ai/test
// @access  Private
const testAiConnection = asyncHandler(async (req, res) => {
    try {
        // Simple test query
        const response = await aiService.generateResponse('Test connection', {
            maxTokens: 50,
            temperature: 0.3
        });
        
        res.status(200).json({ 
            success: true, 
            status: 'AI service is working',
            testResponse: response
        });
    } catch (error) {
        console.error('Error testing AI connection:', error);
        res.status(500);
        throw new Error('AI service connection test failed: ' + error.message);
    }
});

module.exports = {
    chatWithAssistant,
    generateContent,
    enhanceText,
    testAiConnection
};