const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { saveConfig, loadConfig } = require('../controllers/configController');

router.route('/save')
    .post(protect, saveConfig);

router.route('/load')
    .get(protect, loadConfig);

module.exports = router;
