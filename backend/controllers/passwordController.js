const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Password reset token is invalid or has expired');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: 'Your password has been changed',
        text: `Hello,\n\n
        This is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password successfully reset' });
});

module.exports = {
    requestPasswordReset,
    resetPassword
};
