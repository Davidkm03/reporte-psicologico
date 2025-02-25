const AuditLog = require('../models/AuditLog');

const auditLog = async (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', async () => {
        try {
            const auditEntry = {
                action: `${req.method} ${req.originalUrl}`,
                user: req.user?._id || null,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                details: {
                    statusCode: res.statusCode,
                    responseTime: Date.now() - start,
                    params: req.params,
                    query: req.query,
                    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
                }
            };

            await AuditLog.create(auditEntry);
        } catch (error) {
            console.error('Error creating audit log:', error);
        }
    });

    next();
};

module.exports = auditLog;
