const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// @desc    Send verification email
// @route   POST /api/auth/send-verification
// @access  Private
const sendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isVerified) {
        res.status(400);
        throw new Error('User is already verified');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 3600000; // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationTokenExpiry;
    await user.save();

    // Send verification email
    try {
        const emailResult = await emailService.sendVerificationEmail(
            user.email,
            verificationToken,
            user.profile?.fullName
        );

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            res.status(500);
            throw new Error('Error sending verification email. Please try again later.');
        }
        
        res.status(200).json({ 
            message: 'Verification email sent',
            // In development, return additional information for testing
            ...(process.env.NODE_ENV === 'development' && { 
                debug: { token: verificationToken, email: user.email } 
            })
        });
    } catch (error) {
        console.error('Error in sendVerificationEmail:', error);
        res.status(500);
        throw new Error('Failed to send verification email');
    }
});

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        res.status(400);
        throw new Error('Verification token is required');
    }

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Verification token is invalid or has expired');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });
});

// @desc    Check verification status
// @route   GET /api/auth/verification-status
// @access  Private
const checkVerificationStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    res.status(200).json({ 
        isVerified: user.isVerified,
        email: user.email
    });
});

module.exports = {
    sendVerificationEmail,
    verifyEmail,
    checkVerificationStatus
};