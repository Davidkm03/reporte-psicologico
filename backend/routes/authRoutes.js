const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordController');
const { sendVerificationEmail, verifyEmail } = require('../controllers/emailController');
const { protect } = require('../middleware/authMiddleware');

// Test route
router.get('/register', (req, res) => {
    res.json({ message: 'Register route is working' });
});

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/send-verification', protect, sendVerificationEmail);
router.get('/verify-email', verifyEmail);

module.exports = router;
