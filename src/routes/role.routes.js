import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/role.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Role CRUD Routes
router.get('/', verifyToken, getAllRoles);
router.get('/:id', verifyToken, getRoleById);
router.post('/', verifyToken, createRole);
router.put('/:id', verifyToken, updateRole);
router.delete('/:id', verifyToken, deleteRole);

export default router;
