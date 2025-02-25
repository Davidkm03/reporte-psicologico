const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Infantil', 'Adultos', 'Familiar', 'Educativa']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sections: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'checkbox', 'radio', 'select']
        },
        required: Boolean,
        options: [String],
        defaultValue: mongoose.Schema.Types.Mixed
    }],
    isStarred: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
TemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Template', TemplateSchema);
