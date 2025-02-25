const express = require('express');
const router = express.Router();
const { testAPI } = require('../controllers/baseController');
const authRoutes = require('./authRoutes');
const path = require('path');
const fs = require('fs');

// Get absolute path to frontend
const frontendPath = path.resolve(__dirname, '../../frontend');

// Verify frontend files exist
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    console.error('Frontend files not found at:', frontendPath);
    process.exit(1);
}

// Serve frontend
router.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// API routes
router.use('/api/auth', authRoutes);
router.get('/api/test', testAPI);

// Serve static files
router.use('/static', express.static(path.join(__dirname, '../../frontend/assets')));

// Serve static files
router.use(express.static(frontendPath));

module.exports = router;
