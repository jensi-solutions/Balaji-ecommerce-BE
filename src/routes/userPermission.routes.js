import express from 'express';
import multer from 'multer';
import {
  createUserPermissions,
  getUserProfileByToken,
  resetPermissionToDefault,
} from '../controllers/userPermission.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();
const upload = multer();

router.post('/create', verifyToken, createUserPermissions);
router.get('/:user_id', getUserProfileByToken);
router.post('/resetPermissionToDefault', verifyToken, upload.none(), resetPermissionToDefault);

export default router;
