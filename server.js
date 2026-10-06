require('dotenv').config();
const app = require('./src/app');
const db = require('./src/models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test MySQL & Sequelize connection
    await db.sequelize.authenticate();
    console.log('✅ MySQL Database connected successfully.');

    // Sync database models (alter: true updates tables if schemas change)
    await db.sequelize.sync();
    console.log('✅ Models synchronized with MySQL.');
  } catch (error) {
    console.error('⚠️ MySQL connection error:', error.message);
    console.warn('👉 Tip: Check your MySQL service status and .env configuration (DB_NAME, DB_USER, DB_PASSWORD).');
  }

  // Start HTTP Server
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
