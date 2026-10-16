import express from 'express';
import {
  createWarehouse,
  updateWarehouse,
  getAllWarehouse,
  getAllWarehouseWithoutFilter,
  getWarehouseById,
  getWarehouseByToken,
  deleteWarehouse,
  deleteMultipleWarehouses,
} from '../controllers/warehouse.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import {
  validateCreateWarehouse,
  validateUpdateWarehouse,
  validateDeleteMultipleWarehouses,
} from '../validations/warehouse.validation.js';

const router = express.Router();

/**
 * @route   POST /api/warehouses/create
 * @desc    Create a new warehouse
 * @access  Private (Warehouse -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  validateCreateWarehouse,
  checkUserPermissions('Warehouse', 'create_access'),
  createWarehouse
);

/**
 * @route   PUT /api/warehouses/update/:id
 * @desc    Update warehouse details
 * @access  Private (Warehouse -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  validateUpdateWarehouse,
  checkUserPermissions('Warehouse', 'edit_access'),
  updateWarehouse
);

/**
 * @route   GET /api/warehouses/all
 * @desc    Get all warehouses with pagination, search & status filter
 * @access  Private (Warehouse -> view_access)
 */
router.get(
  '/all',
  verifyToken,
  checkUserPermissions('Warehouse', 'view_access'),
  getAllWarehouse
);

/**
 * @route   GET /api/warehouses/withoutFilter
 * @desc    Get all active warehouses without filters
 * @access  Private (Warehouse -> view_access)
 */
router.get(
  '/withoutFilter',
  verifyToken,
  checkUserPermissions('Warehouse', 'view_access'),
  getAllWarehouseWithoutFilter
);

/**
 * @route   GET /api/warehouses/token
 * @desc    Get warehouse assigned to the authenticated maintainer
 * @access  Private
 */
router.get(
  '/token',
  verifyToken,
  getWarehouseByToken
);

/**
 * @route   GET /api/warehouses/get/:id
 * @desc    Get warehouse by ID
 * @access  Private (Warehouse -> view_access)
 */
router.get(
  '/get/:id',
  verifyToken,
  checkUserPermissions('Warehouse', 'view_access'),
  getWarehouseById
);

/**
 * @route   DELETE /api/warehouses/delete/:id
 * @desc    Delete warehouse by ID
 * @access  Private (Warehouse -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Warehouse', 'delete_access'),
  deleteWarehouse
);

/**
 * @route   POST /api/warehouses/multiple/delete
 * @desc    Delete multiple warehouses by ID array
 * @access  Private (Warehouse -> delete_access)
 */
router.post(
  '/multiple/delete',
  verifyToken,
  validateDeleteMultipleWarehouses,
  checkUserPermissions('Warehouse', 'delete_access'),
  deleteMultipleWarehouses
);

export default router;
