// Base Controller for testing
const testAPI = (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        version: '1.0.0'
    });
};

module.exports = {
    testAPI
};
