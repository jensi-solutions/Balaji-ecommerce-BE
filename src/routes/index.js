import express from 'express';
import authRoutes from './auth.routes.js';
import rolePermissionRoutes from './rolePermission.routes.js';
import userPermissionRoutes from './userPermission.routes.js';
import userRoutes from './user.routes.js';
import warehouseRoutes from './warehouse.routes.js';
import couponRoutes from './coupon.routes.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

// Authentication routes
router.use('/auth', authRoutes);

// Role & User Permission routes
router.use('/role-permissions', rolePermissionRoutes);
router.use('/user-permissions', userPermissionRoutes);

// User CRUD routes
router.use('/users', userRoutes);

// Warehouse routes
router.use('/warehouses', warehouseRoutes);

// Coupon routes
router.use('/coupons', couponRoutes);

export default router;
