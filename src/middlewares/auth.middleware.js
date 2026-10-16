import jwt from 'jsonwebtoken';
import { UserPermission, RolePermission } from '../models/index.js';
import { isTokenBlacklisted } from '../helpers/tokenBlacklist.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.header('authorization');

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Authorization denied.',
    });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token is required.',
    });
  }

  if (isTokenBlacklisted(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token has been invalidated / logged out. Please log in again.',
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'balaji_super_secret_jwt_key_2026',
    (err, decodedUser) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token.',
        });
      }
      req.user = decodedUser;
      next();
    }
  );
};

export const checkUserPermissions = (module_name, permission) => async (req, res, next) => {
  try {
    const reqUser = req.user;

    if (!reqUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User object is missing.',
      });
    }

    const userId = reqUser.id;
    const userRole = reqUser.role_id;
    const userRoleName = reqUser.role_name;

    // Default super admin bypass
    if (userRole === 1 || userRoleName === 'Admin') {
      return next();
    }

    if (!userId || !userRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Incomplete user credentials.',
      });
    }

    // 1. Check custom UserPermission
    const userPermission = await UserPermission.findOne({
      where: { user_id: userId, module_name },
    });

    if (userPermission) {
      if (userPermission[permission]) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. You do not have '${permission}' for module '${module_name}'.`,
      });
    }

    // 2. Fallback to RolePermission
    const rolePermission = await RolePermission.findOne({
      where: { role_id: userRole, module_name },
    });

    if (rolePermission && rolePermission[permission]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. You do not have '${permission}' for module '${module_name}'.`,
    });
  } catch (error) {
    next(error);
  }
};
