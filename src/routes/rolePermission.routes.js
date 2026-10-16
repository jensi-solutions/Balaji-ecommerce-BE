import express from 'express';
import {
  createRolePermissionsByAdmin,
  getAllRolePermission,
  getRolePermissionById,
  getRolePermissionByRole,
  updateRolePermissionsByAdmin,
} from '../controllers/rolePermission.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/create', verifyToken, createRolePermissionsByAdmin);
router.put('/update/:role_id', verifyToken, updateRolePermissionsByAdmin);
router.get('/all', verifyToken, getAllRolePermission);
router.get('/:id', verifyToken, getRolePermissionById);
router.get('/role/:role_id', verifyToken, getRolePermissionByRole);

export default router;
