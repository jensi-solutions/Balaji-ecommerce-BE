import express from 'express';
import {
  createCollection,
  updateCollection,
  getAllCollections,
  getAllCollectionsWithoutFilter,
  getCollectionById,
  updateCollectionStatus,
  deleteCollection,
  deleteMultipleCollections,
} from '../controllers/collection.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import { upload } from '../helpers/upload.helper.js';
import {
  validateCreateCollection,
  validateUpdateCollection,
  validateUpdateCollectionStatus,
  validateDeleteMultipleCollections,
} from '../validations/collection.validation.js';

const router = express.Router();

/**
 * @route   POST /api/collections/create
 * @desc    Create a new collection
 * @access  Private (Collections -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 },
  ]),
validateCreateCollection,
  checkUserPermissions('Collections', 'create_access'),
  createCollection
);

/**
 * @route   PUT /api/collections/update/:id
 * @desc    Update collection details
 * @access  Private (Collections -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'banner_image', maxCount: 1 },
  ]),
  validateUpdateCollection,
  checkUserPermissions('Collections', 'edit_access'),
  updateCollection
);

/**
 * @route   GET /api/collections/all
 * @desc    Get all collections with pagination, search & status filter
 * @access  Private (Collections -> view_access)
 */
router.get(
  '/all',
  verifyToken,
  checkUserPermissions('Collections', 'view_access'),
  getAllCollections
);

/**
 * @route   GET /api/collections/withoutFilter
 * @desc    Get all active collections without pagination
 * @access  Private (Collections -> view_access)
 */
router.get(
  '/withoutFilter',
  verifyToken,
  checkUserPermissions('Collections', 'view_access'),
  getAllCollectionsWithoutFilter
);

/**
 * @route   GET /api/collections/get/:id
 * @desc    Get collection by ID
 * @access  Private (Collections -> view_access)
 */
router.get(
  '/get/:id',
  verifyToken,
  checkUserPermissions('Collections', 'view_access'),
  getCollectionById
);

/**
 * @route   PUT /api/collections/status/:id
 * @desc    Update collection status
 * @access  Private (Collections -> edit_access)
 */
router.put(
  '/status/:id',
  verifyToken,
  validateUpdateCollectionStatus,
  checkUserPermissions('Collections', 'edit_access'),
  updateCollectionStatus
);

/**
 * @route   DELETE /api/collections/delete/:id
 * @desc    Soft delete collection by ID
 * @access  Private (Collections -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Collections', 'delete_access'),
  deleteCollection
);

/**
 * @route   POST /api/collections/multiple/delete
 * @desc    Bulk soft delete collections
 * @access  Private (Collections -> delete_access)
 */
router.post(
  '/multiple/delete',
  verifyToken,
  validateDeleteMultipleCollections,
  checkUserPermissions('Collections', 'delete_access'),
  deleteMultipleCollections
);


export default router;
