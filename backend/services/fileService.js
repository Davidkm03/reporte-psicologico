const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Base directory for file storage
const STORAGE_DIR = path.join(__dirname, '..', '..', 'uploads');

// Ensure storage directories exist
const initializeStorage = () => {
    // Create main uploads directory if it doesn't exist
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    
    // Create subdirectories for different file types
    const directories = ['logos', 'signatures', 'watermarks', 'headers', 'footers', 'reports', 'temp'];
    
    directories.forEach(dir => {
        const dirPath = path.join(STORAGE_DIR, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    console.log('File storage directories initialized');
};

/**
 * Save a file from base64 data
 * @param {string} base64Data - Base64 encoded file data (can include data URL prefix)
 * @param {string} fileType - Type of file (logos, signatures, etc.)
 * @param {string} userId - ID of the user who owns the file
 * @param {string} [filename] - Optional custom filename
 * @returns {Promise<Object>} - Object with file information
 */
const saveBase64File = async (base64Data, fileType, userId, filename = null) => {
    // Validate inputs
    if (!base64Data) {
        throw new Error('No file data provided');
    }
    
    if (!['logos', 'signatures', 'watermarks', 'headers', 'footers', 'temp'].includes(fileType)) {
        throw new Error('Invalid file type');
    }
    
    try {
        // Strip data URL prefix if present
        let fileData = base64Data;
        let fileExtension = 'png'; // Default extension
        
        if (base64Data.includes(';base64,')) {
            const [dataInfo, encodedData] = base64Data.split(';base64,');
            fileData = encodedData;
            
            // Try to get the file extension from the data URL
            if (dataInfo.includes('/')) {
                const mimeType = dataInfo.split(':')[1];
                const mimeExtension = mimeType.split('/')[1];
                
                // Only use common image extensions
                if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg+xml'].includes(mimeExtension)) {
                    fileExtension = mimeExtension === 'svg+xml' ? 'svg' : mimeExtension;
                }
            }
        }
        
        // Generate a unique filename with user ID prefix
        const randomString = crypto.randomBytes(8).toString('hex');
        const finalFilename = filename || `${userId}_${randomString}.${fileExtension}`;
        
        // Create full file path
        const filePath = path.join(STORAGE_DIR, fileType, finalFilename);
        
        // Write the file
        fs.writeFileSync(filePath, fileData, 'base64');
        
        // Return file information
        return {
            filename: finalFilename,
            path: filePath,
            url: `/uploads/${fileType}/${finalFilename}`,
            type: fileType,
            size: fs.statSync(filePath).size
        };
    } catch (error) {
        console.error(`Error saving ${fileType} file:`, error);
        throw new Error(`Failed to save ${fileType} file: ${error.message}`);
    }
};

/**
 * Delete a file
 * @param {string} filePath - Path to the file or filename
 * @param {string} fileType - Type of file (logos, signatures, etc.)
 * @returns {Promise<boolean>} - True if deletion was successful
 */
const deleteFile = async (filePath, fileType) => {
    try {
        // Check if filePath is just a filename or a full path
        let fullPath = filePath;
        
        if (!filePath.includes(path.sep)) {
            // It's just a filename, construct the full path
            fullPath = path.join(STORAGE_DIR, fileType, filePath);
        }
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            console.warn(`File not found: ${fullPath}`);
            return false;
        }
        
        // Delete the file
        fs.unlinkSync(fullPath);
        return true;
    } catch (error) {
        console.error(`Error deleting file:`, error);
        return false;
    }
};

/**
 * Get the full path of a file
 * @param {string} filename - Filename
 * @param {string} fileType - Type of file (logos, signatures, etc.)
 * @returns {string} - Full path to the file
 */
const getFilePath = (filename, fileType) => {
    return path.join(STORAGE_DIR, fileType, filename);
};

/**
 * Get the URL of a file
 * @param {string} filename - Filename
 * @param {string} fileType - Type of file (logos, signatures, etc.)
 * @returns {string} - URL to access the file
 */
const getFileUrl = (filename, fileType) => {
    return `/uploads/${fileType}/${filename}`;
};

/**
 * Clean up temporary files
 * Removes files older than the specified age
 * @param {number} maxAgeHours - Maximum age in hours
 * @returns {Promise<number>} - Number of files deleted
 */
const cleanupTempFiles = async (maxAgeHours = 24) => {
    try {
        const tempDir = path.join(STORAGE_DIR, 'temp');
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const now = Date.now();
        let filesDeleted = 0;
        
        // Get all files in the temp directory
        const files = fs.readdirSync(tempDir);
        
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            
            // Check if file is older than the maximum age
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
                filesDeleted++;
            }
        }
        
        console.log(`Cleaned up ${filesDeleted} temporary files`);
        return filesDeleted;
    } catch (error) {
        console.error('Error cleaning up temporary files:', error);
        return 0;
    }
};

module.exports = {
    initializeStorage,
    saveBase64File,
    deleteFile,
    getFilePath,
    getFileUrl,
    cleanupTempFiles
};