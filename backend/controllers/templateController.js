const Template = require('../models/Template');
const asyncHandler = require('express-async-handler');

// @desc    Create a new template
// @route   POST /api/templates
// @access  Private
const createTemplate = asyncHandler(async (req, res) => {
    const { name, category, sections, description } = req.body;
    
    const template = new Template({
        name,
        category,
        sections,
        description,
        createdBy: req.user._id
    });

    const createdTemplate = await template.save();
    res.status(201).json(createdTemplate);
});

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
const getTemplates = asyncHandler(async (req, res) => {
    const templates = await Template.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 });
    res.json(templates);
});

// @desc    Get template by ID
// @route   GET /api/templates/:id
// @access  Private
const getTemplateById = asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (template) {
        res.json(template);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
const updateTemplate = asyncHandler(async (req, res) => {
    const { name, category, sections, description, isStarred } = req.body;

    const template = await Template.findById(req.params.id);

    if (template) {
        template.name = name || template.name;
        template.category = category || template.category;
        template.sections = sections || template.sections;
        template.description = description || template.description;
        template.isStarred = isStarred || template.isStarred;

        const updatedTemplate = await template.save();
        res.json(updatedTemplate);
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
const deleteTemplate = asyncHandler(async (req, res) => {
    const template = await Template.findById(req.params.id);

    if (template) {
        await template.remove();
        res.json({ message: 'Template removed' });
    } else {
        res.status(404);
        throw new Error('Template not found');
    }
});

module.exports = {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate
};
