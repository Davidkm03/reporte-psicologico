require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const securityHeaders = require('./middleware/securityHeaders');

// Initialize Express app
const app = express();
console.log('Express app initialized');

// Middleware
console.log('Initializing middleware...');
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
console.log('Middleware initialized');

// Import routes
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const templateRoutes = require('./routes/templateRoutes');
const { testAPI } = require('./controllers/baseController');
const reportRoutes = require('./routes/reportRoutes');

// Database Connection
connectDB();

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/config', apiLimiter, configRoutes);
app.use('/api/templates', apiLimiter, templateRoutes);
app.get('/api/test', testAPI);
app.use('/api/reports', apiLimiter, reportRoutes);

// Serve static files from frontend
app.use('/static', express.static(path.join(__dirname, '../frontend/assets')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/index.html'));
});

// Error handling for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({ 
        error: err.message || 'Something went wrong!',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Add the audit middleware after routes are registered
const auditLog = require('./middleware/auditMiddleware');
app.use(auditLog);

// Server Setup
const PORT = process.env.PORT || 5000;
console.log(`Starting server on port ${PORT}...`);
const server = app.listen(PORT, () => {
    console.log(`Server successfully started on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

module.exports = app;