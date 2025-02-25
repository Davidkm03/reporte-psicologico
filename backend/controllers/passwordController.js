const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset email using the email service
    try {
        const emailResult = await emailService.sendPasswordResetEmail(
            user.email,
            resetToken,
            user.profile?.fullName
        );

        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            res.status(500);
            throw new Error('Error sending password reset email. Please try again later.');
        }
        
        res.status(200).json({ 
            message: 'Password reset email sent',
            // In development, return additional information for testing
            ...(process.env.NODE_ENV === 'development' && { 
                debug: { token: resetToken, email: user.email } 
            })
        });
    } catch (error) {
        console.error('Error in requestPasswordReset:', error);
        res.status(500);
        throw new Error('Failed to process password reset request');
    }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        res.status(400);
        throw new Error('Token and password are required');
    }

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Password reset token is invalid or has expired');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    try {
        await emailService.sendPasswordChangedEmail(
            user.email,
            user.profile?.fullName
        );
    } catch (error) {
        // Log the error but continue with the response
        console.error('Error sending password changed confirmation email:', error);
    }

    res.status(200).json({ message: 'Password successfully reset' });
});

// @desc    Change password (when logged in)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Current password and new password are required');
    }
    
    // Get user
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }
    
    // Set new password
    user.password = newPassword;
    await user.save();
    
    // Send confirmation email
    try {
        await emailService.sendPasswordChangedEmail(
            user.email,
            user.profile?.fullName
        );
    } catch (error) {
        // Log the error but continue with the response
        console.error('Error sending password changed confirmation email:', error);
    }
    
    res.status(200).json({ message: 'Password successfully changed' });
});

module.exports = {
    requestPasswordReset,
    resetPassword,
    changePassword
};