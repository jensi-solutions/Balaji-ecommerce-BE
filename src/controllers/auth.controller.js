import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, Role } from '../models/index.js';
import { generateOTP, sendEmailOTP } from '../helpers/email.helper.js';
import { addToBlacklist } from '../helpers/tokenBlacklist.js';
import { getFullFileUrl } from '../helpers/upload.helper.js';

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user with Role included
    const user = await User.findOne({
      where: { email: trimmedEmail },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name', 'default_role'],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check account active status
    if (!user.active_status) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.',
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role ? user.role.role_name : null,
      },
      process.env.JWT_SECRET || 'balaji_super_secret_jwt_key_2026',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // Prepare response data (excluding password)
    const userResponse = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      gender: user.gender,
      profile_picture: getFullFileUrl(req, user.profile_picture),
      active_status: user.active_status,
      role: user.role
        ? {
            id: user.role.id,
            role_name: user.role.role_name,
          }
        : null,
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Forgot Password - Send OTP to email
 * @route   POST /api/auth/forgot-password or POST /api/auth/forgot
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check user existence
    const user = await User.findOne({
      where: { email: trimmedEmail },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.active_status) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.',
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Set OTP expiration to 5 minutes from now
    const otpExpire = new Date(Date.now() + 5 * 60 * 1000);

    // Send OTP via Email
    const emailSent = await sendEmailOTP(trimmedEmail, otp);

    if (emailSent) {
      await user.update({
        otp_code: otp,
        otp_expire: otpExpire,
      });

      return res.status(200).json({
        success: true,
        message: 'OTP has been sent successfully.',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Email OTP
 * @route   POST /api/auth/verify-otp or POST /api/auth/email-otp/verify
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otpCode = req.body.otp_code || req.body.otp;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and OTP.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = String(otpCode).trim();

    // Find user with matching OTP and valid expiry
    const user = await User.findOne({
      where: {
        email: trimmedEmail,
        otp_code: trimmedOtp,
        otp_expire: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Generate JWT token for password reset verification
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role ? user.role.role_name : 'Admin',
      },
      process.env.JWT_SECRET || 'balaji_super_secret_jwt_key_2026',
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role_id: user.role_id,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error in verify email OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset Password using OTP verification
 * @route   POST /api/auth/reset-password or POST /api/auth/reset
 */
export const resetPassword = async (req, res) => {
  try {
    const email = req.body.email || req.user?.email;
    const newPassword = req.body.newPassword || req.body.new_password;
    const confirmPassword = req.body.confirmPassword || req.body.confirm_password;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both new password and confirm password.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to reset password.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: trimmedEmail },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.otp_code = null;
    user.otp_expire = null;
    await user.save();

    // Generate new JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role ? user.role.role_name : 'Admin',
      },
      process.env.JWT_SECRET || 'balaji_super_secret_jwt_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in reset password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Change Password (for logged in user)
 * @route   POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (confirm_password && new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match.',
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Invalid token credentials.',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid current password.',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    await user.save();

    // Invalidate current token
    const authHeader = req.headers.authorization || req.header('authorization');
    if (authHeader) {
      addToBlacklist(authHeader);
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Error in change password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user (invalidate token)
 * @route   POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.header('authorization') || req.body.token;

    if (authHeader) {
      addToBlacklist(authHeader);
    }

    return res.status(200).json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

export const userLogout = logout;
