const mongoose = require('mongoose');

const connectDB = async () => {
    console.log('Attempting to connect to MongoDB...');
    try {
        console.log('MongoDB URI:', process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log('Database name:', conn.connection.name);
        console.log('Connection ready state:', conn.connection.readyState);
    } catch (error) {
        console.error('Failed to connect to MongoDB:');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
};

module.exports = connectDB;
