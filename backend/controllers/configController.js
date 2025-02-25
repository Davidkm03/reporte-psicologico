const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// @desc    Save user configuration
// @route   POST /api/config/save
// @access  Private
const saveConfig = asyncHandler(async (req, res) => {
    const { config } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { config } },
            { new: true }
        );

        if (!user) {
            res.status(404);
            throw new Error('Usuario no encontrado');
        }

        res.status(200).json({
            message: 'Configuración guardada exitosamente',
            config: user.config
        });
    } catch (error) {
        res.status(500);
        throw new Error('Error al guardar la configuración');
    }
});

// @desc    Load user configuration
// @route   GET /api/config/load
// @access  Private
const loadConfig = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404);
            throw new Error('Usuario no encontrado');
        }

        res.status(200).json({
            config: user.config || {}
        });
    } catch (error) {
        res.status(500);
        throw new Error('Error al cargar la configuración');
    }
});

module.exports = {
    saveConfig,
    loadConfig
};
