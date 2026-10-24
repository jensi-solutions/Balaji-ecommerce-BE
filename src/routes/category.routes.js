import express from 'express';
import {
  createCategory,
  updateCategory,
  getAllCategories,
  getCategoryTree,
  getAllCategoriesWithoutFilter,
  getCategoryById,
  updateCategoryStatus,
  deleteCategory,
  deleteMultipleCategories,
} from '../controllers/category.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import { upload } from '../helpers/upload.helper.js';
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateUpdateCategoryStatus,
  validateDeleteMultipleCategories,
} from '../validations/category.validation.js';

const router = express.Router();

/**
 * @route   POST /api/categories/create
 * @desc    Create a new category
 * @access  Private (Categories -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validateCreateCategory,
  checkUserPermissions('Categories', 'create_access'),
  createCategory
);

/**
 * @route   PUT /api/categories/update/:id
 * @desc    Update category details
 * @access  Private (Categories -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  upload.fields([{ name: 'image', maxCount: 1 }]),
  validateUpdateCategory,
  checkUserPermissions('Categories', 'edit_access'),
  updateCategory
);

/**
 * @route   GET /api/categories/all
 * @desc    Get all categories with pagination, search, status & parent filter
 * @access  Private (Categories -> view_access)
 */
router.get(
  '/all',
  verifyToken,
  checkUserPermissions('Categories', 'view_access'),
  getAllCategories
);

/**
 * @route   GET /api/categories/tree
 * @desc    Get hierarchical category tree
 * @access  Private (Categories -> view_access)
 */
router.get(
  '/tree',
  verifyToken,
  checkUserPermissions('Categories', 'view_access'),
  getCategoryTree
);

/**
 * @route   GET /api/categories/withoutFilter
 * @desc    Get all active categories without pagination (for dropdowns)
 * @access  Private (Categories -> view_access)
 */
router.get(
  '/withoutFilter',
  verifyToken,
  checkUserPermissions('Categories', 'view_access'),
  getAllCategoriesWithoutFilter
);

/**
 * @route   GET /api/categories/get/:id
 * @desc    Get category by ID
 * @access  Private (Categories -> view_access)
 */
router.get(
  '/get/:id',
  verifyToken,
  checkUserPermissions('Categories', 'view_access'),
  getCategoryById
);

/**
 * @route   PUT /api/categories/status/:id
 * @desc    Update category status
 * @access  Private (Categories -> edit_access)
 */
router.put(
  '/status/:id',
  verifyToken,
  validateUpdateCategoryStatus,
  checkUserPermissions('Categories', 'edit_access'),
  updateCategoryStatus
);

/**
 * @route   DELETE /api/categories/delete/:id
 * @desc    Soft delete category by ID
 * @access  Private (Categories -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Categories', 'delete_access'),
  deleteCategory
);

/**
 * @route   POST /api/categories/multiple/delete
 * @desc    Bulk soft delete categories
 * @access  Private (Categories -> delete_access)
 */
router.post(
  '/multiple/delete',
  verifyToken,
  validateDeleteMultipleCategories,
  checkUserPermissions('Categories', 'delete_access'),
  deleteMultipleCategories
);


export default router;
