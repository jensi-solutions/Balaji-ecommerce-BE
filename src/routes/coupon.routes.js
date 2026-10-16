
import express from 'express';
import {
  createCoupon,
  updateCoupon,
  getAllCoupon,
  getCouponById,
  deleteCoupon,
  deleteMultipleCoupon,
  getAllCouponWithoutFilter,
  displayCouponsForStore,
  updateCouponStatus,
} from '../controllers/coupon.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateUpdateCouponStatus,
  validateDeleteMultipleCoupons,
} from '../validations/coupon.validation.js';

const router = express.Router();

/**
 * @route   POST /api/coupons/create
 * @desc    Create a new coupon
 * @access  Private (Coupon -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  validateCreateCoupon,
  checkUserPermissions('Coupon', 'create_access'),
  createCoupon
);

/**
 * @route   PUT /api/coupons/update/:id
 * @desc    Update coupon details
 * @access  Private (Coupon -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  validateUpdateCoupon,
  checkUserPermissions('Coupon', 'edit_access'),
  updateCoupon
);

/**
 * @route   GET /api/coupons/all
 * @desc    Get all coupons with pagination & search
 * @access  Private (Coupon -> view_access)
 */
router.get(
  '/all',
  verifyToken,
  checkUserPermissions('Coupon', 'view_access'),
  getAllCoupon
);

/**
 * @route   POST /api/coupons/multiple/delete
 * @desc    Delete multiple coupons by IDs
 * @access  Private (Coupon -> delete_access)
 */
router.post(
  '/multiple/delete',
  verifyToken,
  validateDeleteMultipleCoupons,
  checkUserPermissions('Coupon', 'delete_access'),
  deleteMultipleCoupon
);

/**
 * @route   GET /api/coupons/withoutFilter
 * @desc    Get non-expired coupons without filters
 * @access  Public / Store
 */
router.get(
  '/withoutFilter',
  getAllCouponWithoutFilter
);

/**
 * @route   GET /api/coupons/displayCouponsForStore
 * @desc    Display active store coupons
 * @access  Private
 */
router.get(
  '/displayCouponsForStore',
  verifyToken,
  displayCouponsForStore
);

/**
 * @route   PUT /api/coupons/status/change/:id
 * @desc    Change coupon status (active/inactive)
 * @access  Private (Coupon -> edit_access)
 */
router.put(
  '/status/change/:id',
  verifyToken,
  validateUpdateCouponStatus,
  checkUserPermissions('Coupon', 'edit_access'),
  updateCouponStatus
);

/**
 * @route   DELETE /api/coupons/delete/:id
 * @desc    Delete coupon by ID
 * @access  Private (Coupon -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Coupon', 'delete_access'),
  deleteCoupon
);

/**
 * @route   GET /api/coupons/:id
 * @desc    Get coupon by ID
 * @access  Private (Coupon -> view_access)
 */
router.get(
  '/:id',
  verifyToken,
  checkUserPermissions('Coupon', 'view_access'),
  getCouponById
);

export default router;
