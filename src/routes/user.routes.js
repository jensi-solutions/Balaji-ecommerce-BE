import express from 'express';
import {
  createUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
} from '../controllers/user.controller.js';
import { verifyToken, checkUserPermissions } from '../middlewares/auth.middleware.js';
import { upload } from '../helpers/upload.helper.js';
import {
  validateCreateUser,
  validateUpdateUser,
} from '../validations/user.validation.js';

const router = express.Router();

/**
 * @route   POST /api/users/create
 * @desc    Create a new user (supports raw JSON and multipart/form-data)
 * @access  Private (Users -> create_access)
 */
router.post(
  '/create',
  verifyToken,
  upload.fields([{ name: 'profile_picture', maxCount: 1 }]),
  validateCreateUser,
  checkUserPermissions('Users', 'create_access'),
  createUser
);

/**
 * @route   PUT /api/users/update/:id
 * @desc    Update an existing user
 * @access  Private (Users -> edit_access)
 */
router.put(
  '/update/:id',
  verifyToken,
  upload.fields([{ name: 'profile_picture', maxCount: 1 }]),
  validateUpdateUser,
  checkUserPermissions('Users', 'edit_access'),
  updateUser
);

/**
 * @route   DELETE /api/users/delete/:id
 * @desc    Delete a user by ID
 * @access  Private (Users -> delete_access)
 */
router.delete(
  '/delete/:id',
  verifyToken,
  checkUserPermissions('Users', 'delete_access'),
  deleteUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Users -> view_access)
 */
router.get(
  '/:id',
  verifyToken,
  checkUserPermissions('Users', 'view_access'),
  getUserById
);

/**
 * @route   GET /api/users/
 * @desc    Get all users with pagination, search, and status filter
 * @access  Private (Users -> view_access)
 */
router.get(
  '/',
  verifyToken,
  checkUserPermissions('Users', 'view_access'),
  getAllUsers
);

export default router;
