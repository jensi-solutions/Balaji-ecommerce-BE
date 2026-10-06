const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

// Mount module routes
router.use('/users', userRoutes);

module.exports = router;
