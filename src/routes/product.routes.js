import express from 'express';
import {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProductStatus,
  updateProductFeatured,
  updateVariantStock,
  deleteProduct,
  deleteMultipleProducts,
} from '../controllers/product.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import { upload } from '../helpers/upload.helper.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateProductStatus,
  validateUpdateProductFeatured,
  validateUpdateVariantStock,
  validateDeleteMultipleProducts,
} from '../validations/product.validation.js';

const router = express.Router();

/**
 * @route   POST /api/products/create
 * @desc    Create a new product with variants and collections
 * @access  Private (Products -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'multiple_images', maxCount: 10 },
  ]),
  validateCreateProduct,
  checkUserPermissions('Products', 'create_access'),
  createProduct
);

/**
 * @route   PUT /api/products/update/:id
 * @desc    Update product details, variants, or collections
 * @access  Private (Products -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'multiple_images', maxCount: 10 },
  ]),
  validateUpdateProduct,
  checkUserPermissions('Products', 'edit_access'),
  updateProduct
);

/**
 * @route   GET /api/products/all
 * @desc    Get all products with pagination, search, category, collection, price & status filters
 * @access  Private (Products -> view_access)
 */
router.get(
  '/all',
  verifyToken,
  checkUserPermissions('Products', 'view_access'),
  getAllProducts
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by SEO slug (for storefront)
 * @access  Public / Private
 */
router.get(
  '/slug/:slug',
  getProductBySlug
);

/**
 * @route   GET /api/products/get/:id
 * @desc    Get product by ID
 * @access  Private (Products -> view_access)
 */
router.get(
  '/get/:id',
  verifyToken,
  checkUserPermissions('Products', 'view_access'),
  getProductById
);

/**
 * @route   PUT /api/products/status/:id
 * @desc    Update product status
 * @access  Private (Products -> edit_access)
 */
router.put(
  '/status/:id',
  verifyToken,
  validateUpdateProductStatus,
  checkUserPermissions('Products', 'edit_access'),
  updateProductStatus
);

/**
 * @route   PUT /api/products/featured/:id
 * @desc    Update product featured flag
 * @access  Private (Products -> edit_access)
 */
router.put(
  '/featured/:id',
  verifyToken,
  validateUpdateProductFeatured,
  checkUserPermissions('Products', 'edit_access'),
  updateProductFeatured
);

/**
 * @route   PATCH /api/products/variants/:variant_id/stock
 * @desc    Directly update or adjust stock quantity of a specific product variant
 * @access  Private (Products -> edit_access)
 */
router.put(
  '/stock/:variant_id',
  verifyToken,
  validateUpdateVariantStock,
  checkUserPermissions('Products', 'edit_access'),
  updateVariantStock
);

router.patch(
  '/stock/:variant_id',
  verifyToken,
  validateUpdateVariantStock,
  checkUserPermissions('Products', 'edit_access'),
  updateVariantStock
);

/**
 * @route   DELETE /api/products/delete/:id
 * @desc    Soft delete product by ID
 * @access  Private (Products -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Products', 'delete_access'),
  deleteProduct
);

/**
 * @route   POST /api/products/multiple/delete
 * @desc    Bulk soft delete products
 * @access  Private (Products -> delete_access)
 */
router.post(
  '/multiple/delete',
  verifyToken,
  validateDeleteMultipleProducts,
  checkUserPermissions('Products', 'delete_access'),
  deleteMultipleProducts
);


export default router;
