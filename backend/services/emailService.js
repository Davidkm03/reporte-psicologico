const nodemailer = require('nodemailer');

// Create transporter once
let transporter;

/**
 * Initialize email transporter
 * @returns {Object} - Configured nodemailer transporter
 */
const initializeTransporter = () => {
    // Check if transporter already exists
    if (transporter) return transporter;
    
    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email credentials are missing in .env file. Email functionality will not work properly.');
    }
    
    // Create transporter based on environment (development or production)
    if (process.env.NODE_ENV === 'development' && process.env.EMAIL_TEST_MODE === 'true') {
        // For development: use Ethereal (fake SMTP service)
        console.log('Using test email service (Ethereal)...');
        
        nodemailer.createTestAccount().then(testAccount => {
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            
            console.log('Test email account created:');
            console.log(`- Username: ${testAccount.user}`);
            console.log(`- Password: ${testAccount.pass}`);
            console.log(`- Preview URL: https://ethereal.email/login`);
        });
    } else {
        // For production: use configured SMTP service (default: Gmail)
        transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    
    return transporter;
};

/**
 * Send an email
 * @param {Object} options - Email options (to, subject, text, html)
 * @returns {Promise} - Result of email sending operation
 */
const sendEmail = async (options) => {
    // Get or initialize transporter
    const emailTransporter = initializeTransporter();
    
    // Default from address
    const from = `${process.env.EMAIL_FROM_NAME || 'Sistema de Informes Psicológicos'} <${process.env.EMAIL_USER}>`;
    
    // Prepare mail options
    const mailOptions = {
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || convertTextToHtml(options.text)
    };
    
    // Send email
    try {
        const info = await emailTransporter.sendMail(mailOptions);
        
        // For development with Ethereal: log preview URL
        if (process.env.NODE_ENV === 'development' && process.env.EMAIL_TEST_MODE === 'true') {
            console.log('Email preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send a verification email
 * @param {string} to - Recipient email address
 * @param {string} token - Verification token
 * @param {string} name - Recipient name
 * @returns {Promise} - Result of email sending operation
 */
const sendVerificationEmail = async (to, token, name = '') => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;
    
    const subject = 'Verificación de Correo Electrónico';
    
    const text = `Hola${name ? ' ' + name : ''},
    
Gracias por registrarte en el Sistema de Informes Psicológicos. Para verificar tu dirección de correo electrónico, haz clic en el siguiente enlace:

${verificationUrl}

Este enlace expirará en 24 horas.

Si no solicitaste esta verificación, puedes ignorar este correo.

Saludos,
El Equipo del Sistema de Informes Psicológicos`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0d6efd;">Sistema de Informes Psicológicos</h2>
            <p style="font-size: 18px; color: #333;">Verificación de Correo Electrónico</p>
        </div>
        
        <p>Hola${name ? ' <strong>' + name + '</strong>' : ''},</p>
        
        <p>Gracias por registrarte en el Sistema de Informes Psicológicos. Para verificar tu dirección de correo electrónico, haz clic en el siguiente enlace:</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verificar mi correo electrónico</a>
        </div>
        
        <p>O copia y pega esta URL en tu navegador:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${verificationUrl}
        </p>
        
        <p>Este enlace expirará en 24 horas.</p>
        
        <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Saludos,<br>
            El Equipo del Sistema de Informes Psicológicos
        </p>
    </div>
    `;
    
    return sendEmail({ to, subject, text, html });
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} token - Reset token
 * @param {string} name - Recipient name
 * @returns {Promise} - Result of email sending operation
 */
const sendPasswordResetEmail = async (to, token, name = '') => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    
    const subject = 'Restablecer Contraseña';
    
    const text = `Hola${name ? ' ' + name : ''},
    
Has recibido este correo porque tú (o alguien más) ha solicitado restablecer la contraseña de tu cuenta.

Por favor, haz clic en el siguiente enlace para completar el proceso:

${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.

Saludos,
El Equipo del Sistema de Informes Psicológicos`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0d6efd;">Sistema de Informes Psicológicos</h2>
            <p style="font-size: 18px; color: #333;">Restablecer Contraseña</p>
        </div>
        
        <p>Hola${name ? ' <strong>' + name + '</strong>' : ''},</p>
        
        <p>Has recibido este correo porque tú (o alguien más) ha solicitado restablecer la contraseña de tu cuenta.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0d6efd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer mi contraseña</a>
        </div>
        
        <p>O copia y pega esta URL en tu navegador:</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
        </p>
        
        <p>Este enlace expirará en 1 hora.</p>
        
        <p>Si no solicitaste esto, por favor ignora este correo y tu contraseña permanecerá sin cambios.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Saludos,<br>
            El Equipo del Sistema de Informes Psicológicos
        </p>
    </div>
    `;
    
    return sendEmail({ to, subject, text, html });
};

/**
 * Send a password changed confirmation email
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @returns {Promise} - Result of email sending operation
 */
const sendPasswordChangedEmail = async (to, name = '') => {
    const subject = 'Confirmación de cambio de contraseña';
    
    const text = `Hola${name ? ' ' + name : ''},
    
Esta es una confirmación de que la contraseña para tu cuenta ${to} ha sido cambiada recientemente.

Si no realizaste este cambio, por favor contacta a soporte inmediatamente.

Saludos,
El Equipo del Sistema de Informes Psicológicos`;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0d6efd;">Sistema de Informes Psicológicos</h2>
            <p style="font-size: 18px; color: #333;">Confirmación de cambio de contraseña</p>
        </div>
        
        <p>Hola${name ? ' <strong>' + name + '</strong>' : ''},</p>
        
        <p>Esta es una confirmación de que la contraseña para tu cuenta <strong>${to}</strong> ha sido cambiada recientemente.</p>
        
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Nota de Seguridad:</strong> Si no realizaste este cambio, por favor contacta a soporte inmediatamente.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center;">
            Saludos,<br>
            El Equipo del Sistema de Informes Psicológicos
        </p>
    </div>
    `;
    
    return sendEmail({ to, subject, text, html });
};

/**
 * Helper function to convert plain text to simple HTML
 * @param {string} text - Plain text content
 * @returns {string} - HTML formatted content
 */
const convertTextToHtml = (text) => {
    if (!text) return '';
    
    // Replace newlines with <br> tags
    return text
        .replace(/\n/g, '<br>')
        .replace(/\r/g, '')
        .split('<br><br>')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendPasswordChangedEmail
};