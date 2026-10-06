import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from '../models/index.js';

export const login = async (req, res, next) => {
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
      profile_picture: user.profile_picture,
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
    next(error);
  }
};
