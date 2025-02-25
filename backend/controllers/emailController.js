const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Reuse the email transporter from passwordController
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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
    const verificationTokenExpiry = Date.now() + 3600000; // 1 hour

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationTokenExpiry;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: 'Verificación de Correo Electrónico',
        text: `Por favor, haz clic en el siguiente enlace para verificar tu dirección de correo electrónico:\n\n
        ${verificationUrl}\n\n
        Si no solicitaste esta verificación, por favor ignora este correo.\n`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Correo de verificación enviado' });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('El token de verificación es inválido o ha expirado');
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Correo electrónico verificado correctamente' });
});

module.exports = {
    sendVerificationEmail,
    verifyEmail
};
