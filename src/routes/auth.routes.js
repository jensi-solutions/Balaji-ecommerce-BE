import express from 'express';
import {
  login,
  forgotPassword,
  verifyEmailOtp,
  resetPassword,
  changePassword,
  logout,
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 1. Login
router.post('/login', login);

// 2. Forgot Password (send OTP to email)
router.post('/forgot-password', forgotPassword);

// 3. Verify Email OTP
router.post('/verify-otp', verifyEmailOtp);

// 4. Reset Password
router.post('/reset-password', resetPassword);

// 5. Change Password (requires authentication)
router.post('/change-password', verifyToken, changePassword);

// 6. Logout (requires authentication)
router.post('/logout', verifyToken, logout);


export default router;
