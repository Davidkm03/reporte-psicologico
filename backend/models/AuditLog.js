const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
