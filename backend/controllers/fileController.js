const asyncHandler = require('express-async-handler');
const fileService = require('../services/fileService');
const fs = require('fs');
const User = require('../models/User');

// @desc    Upload logo file
// @route   POST /api/files/upload-logo
// @access  Private
const uploadLogo = asyncHandler(async (req, res) => {
    const { imageData } = req.body;
    
    if (!imageData) {
        res.status(400);
        throw new Error('No image data provided');
    }
    
    try {
        const fileInfo = await fileService.saveBase64File(
            imageData,
            'logos',
            req.user._id.toString()
        );
        
        // Update user config with the new logo URL
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    'config.logo': fileInfo.url,
                    'config.logoFilename': fileInfo.filename
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading logo:', error);
        res.status(500);
        throw new Error(`Failed to upload logo: ${error.message}`);
    }
});

// @desc    Upload watermark file
// @route   POST /api/files/upload-watermark
// @access  Private
const uploadWatermark = asyncHandler(async (req, res) => {
    const { imageData } = req.body;
    
    if (!imageData) {
        res.status(400);
        throw new Error('No image data provided');
    }
    
    try {
        const fileInfo = await fileService.saveBase64File(
            imageData,
            'watermarks',
            req.user._id.toString()
        );
        
        // Update user config with the new watermark URL
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    'config.watermark': fileInfo.url,
                    'config.watermarkFilename': fileInfo.filename
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading watermark:', error);
        res.status(500);
        throw new Error(`Failed to upload watermark: ${error.message}`);
    }
});

// @desc    Upload header file
// @route   POST /api/files/upload-header
// @access  Private
const uploadHeader = asyncHandler(async (req, res) => {
    const { imageData } = req.body;
    
    if (!imageData) {
        res.status(400);
        throw new Error('No image data provided');
    }
    
    try {
        const fileInfo = await fileService.saveBase64File(
            imageData,
            'headers',
            req.user._id.toString()
        );
        
        // Update user config with the new header URL
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    'config.header': fileInfo.url,
                    'config.headerFilename': fileInfo.filename
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading header:', error);
        res.status(500);
        throw new Error(`Failed to upload header: ${error.message}`);
    }
});

// @desc    Upload footer file
// @route   POST /api/files/upload-footer
// @access  Private
const uploadFooter = asyncHandler(async (req, res) => {
    const { imageData } = req.body;
    
    if (!imageData) {
        res.status(400);
        throw new Error('No image data provided');
    }
    
    try {
        const fileInfo = await fileService.saveBase64File(
            imageData,
            'footers',
            req.user._id.toString()
        );
        
        // Update user config with the new footer URL
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    'config.footer': fileInfo.url,
                    'config.footerFilename': fileInfo.filename
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading footer:', error);
        res.status(500);
        throw new Error(`Failed to upload footer: ${error.message}`);
    }
});

// @desc    Upload signature file
// @route   POST /api/files/upload-signature
// @access  Private
const uploadSignature = asyncHandler(async (req, res) => {
    const { imageData } = req.body;
    
    if (!imageData) {
        res.status(400);
        throw new Error('No image data provided');
    }
    
    try {
        const fileInfo = await fileService.saveBase64File(
            imageData,
            'signatures',
            req.user._id.toString()
        );
        
        // Update user config with the new signature URL
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $set: { 
                    'config.signature': fileInfo.url,
                    'config.signatureFilename': fileInfo.filename
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            file: fileInfo
        });
    } catch (error) {
        console.error('Error uploading signature:', error);
        res.status(500);
        throw new Error(`Failed to upload signature: ${error.message}`);
    }
});

// @desc    Delete file
// @route   DELETE /api/files/:type/:filename
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
    const { type, filename } = req.params;
    
    // Validate file type
    if (!['logos', 'watermarks', 'headers', 'footers', 'signatures'].includes(type)) {
        res.status(400);
        throw new Error('Invalid file type');
    }
    
    try {
        // Check if file belongs to user
        const user = await User.findById(req.user._id);
        const fileField = `config.${type.slice(0, -1)}Filename`; // Remove trailing 's'
        
        if (user.config && user.config[`${type.slice(0, -1)}Filename`] !== filename) {
            res.status(403);
            throw new Error('You do not have permission to delete this file');
        }
        
        // Delete the file
        const success = await fileService.deleteFile(filename, type);
        
        if (!success) {
            res.status(404);
            throw new Error('File not found or could not be deleted');
        }
        
        // Update user config to remove the file reference
        const updateField = `config.${type.slice(0, -1)}`;
        const updateFilenameField = `config.${type.slice(0, -1)}Filename`;
        
        await User.findByIdAndUpdate(
            req.user._id,
            { 
                $unset: { 
                    [updateField]: "",
                    [updateFilenameField]: ""
                } 
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting ${type} file:`, error);
        
        if (error.name === 'CastError' || error.kind === 'ObjectId') {
            res.status(400);
            throw new Error('Invalid user ID');
        }
        
        if (!res.statusCode || res.statusCode === 200) {
            res.status(500);
        }
        
        throw error;
    }
});

// @desc    Serve file
// @route   GET /uploads/:type/:filename
// @access  Public (but can be restricted if needed)
const serveFile = (req, res) => {
    const { type, filename } = req.params;
    
    // Validate file type
    if (!['logos', 'watermarks', 'headers', 'footers', 'signatures', 'temp'].includes(type)) {
        return res.status(400).send('Invalid file type');
    }
    
    const filePath = fileService.getFilePath(filename, type);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    
    // Determine content type
    let contentType = 'application/octet-stream';
    
    if (filename.endsWith('.png')) {
        contentType = 'image/png';
    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
    } else if (filename.endsWith('.gif')) {
        contentType = 'image/gif';
    } else if (filename.endsWith('.svg')) {
        contentType = 'image/svg+xml';
    }
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    
    // Send the file
    res.sendFile(filePath);
};

module.exports = {
    uploadLogo,
    uploadWatermark,
    uploadHeader,
    uploadFooter,
    uploadSignature,
    deleteFile,
    serveFile
};