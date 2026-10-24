import { Op } from 'sequelize';
import { Role, User, RolePermission } from '../models/index.js';

/**
 * @desc    Get all roles with optional search and pagination
 * @route   GET /api/roles
 */
export const getAllRoles = async (req, res) => {
  try {
    const { search, page, limit } = req.query;

    const whereClause = {};
    if (search && search.trim() !== '') {
      whereClause.role_name = {
        [Op.like]: `%${search.trim()}%`,
      };
    }

    // Pagination support if query params provided
    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * pageSize;

      const { count, rows } = await Role.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id'],
          },
        ],
        order: [['id', 'ASC']],
        limit: pageSize,
        offset,
      });

      const formattedRoles = rows.map((r) => ({
        id: r.id,
        role_name: r.role_name,
        default_role: r.default_role,
        user_count: r.users ? r.users.length : 0,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      return res.status(200).json({
        success: true,
        message: 'Roles fetched successfully.',
        data: formattedRoles,
        pagination: {
          totalCount: count,
          totalPages: Math.ceil(count / pageSize),
          currentPage: pageNum,
          pageSize,
        },
      });
    }

    // Default: Return all roles
    const roles = await Role.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      role_name: r.role_name,
      default_role: r.default_role,
      user_count: r.users ? r.users.length : 0,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    return res.status(200).json({
      success: true,
      message: 'Roles fetched successfully.',
      data: formattedRoles,
    });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single role by ID
 * @route   GET /api/roles/:id
 */
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id, {
      include: [
        {
          model: RolePermission,
          as: 'role_permissions',
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role retrieved successfully.',
      data: role,
    });
  } catch (error) {
    console.error('Error in getRoleById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new role
 * @route   POST /api/roles
 */
export const createRole = async (req, res) => {
  try {
    const { role_name, default_role } = req.body;

    if (!role_name || role_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Role name is required.',
      });
    }

    const trimmedName = role_name.trim();

    // Check duplicate
    const existing = await Role.findOne({
      where: { role_name: trimmedName },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Role "${trimmedName}" already exists.`,
      });
    }

    const newRole = await Role.create({
      role_name: trimmedName,
      default_role: Boolean(default_role),
    });

    return res.status(201).json({
      success: true,
      message: 'Role created successfully.',
      data: newRole,
    });
  } catch (error) {
    console.error('Error in createRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update role
 * @route   PUT /api/roles/:id
 */
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, default_role } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    if (role_name && role_name.trim() !== '') {
      const trimmedName = role_name.trim();

      // Check if another role with same name exists
      const duplicate = await Role.findOne({
        where: {
          role_name: trimmedName,
          id: { [Op.ne]: id },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Role "${trimmedName}" already exists.`,
        });
      }

      role.role_name = trimmedName;
    }

    if (typeof default_role !== 'undefined') {
      role.default_role = Boolean(default_role);
    }

    await role.save();

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully.',
      data: role,
    });
  } catch (error) {
    console.error('Error in updateRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete role
 * @route   DELETE /api/roles/:id
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found.',
      });
    }

    // Safety checks: Cannot delete super admin default role
    if (role.default_role || role.role_name.toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Default or Admin role cannot be deleted.',
      });
    }

    // Safety check: Cannot delete if users are currently assigned
    const userCount = await User.count({ where: { role_id: id } });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this role because ${userCount} user(s) are currently assigned to it.`,
      });
    }

    // Clean up role permissions if any
    await RolePermission.destroy({ where: { role_id: id } });

    // Delete role
    await role.destroy();

    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleteRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
