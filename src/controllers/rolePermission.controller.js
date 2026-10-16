import { Role, RolePermission, UserPermission } from '../models/index.js';

/**
 * @desc    Create role permissions (Admin only)
 * @route   POST /api/role-permissions/create
 */
export const createRolePermissionsByAdmin = async (req, res) => {
  try {
    const { role_id, permissions } = req.body;
    const adminRoleName = req.user.role_name;
    const adminRoleId = req.user.role_id;

    if (adminRoleName !== 'Admin' && adminRoleId !== 1) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. Only admins can create role permissions.',
      });
    }

    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: 'role_id is required.',
      });
    }

    const targetRole = await Role.findByPk(role_id);
    if (!targetRole) {
      return res.status(404).json({
        success: false,
        message: `Role with ID ${role_id} not found.`,
      });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required and cannot be empty.',
      });
    }

    const permissionPromises = permissions.map(async (permission) => {
      if (!permission || typeof permission !== 'object' || !permission.module_name) {
        return null;
      }

      const {
        module_name,
        module_access = false,
        create_access = false,
        edit_access = false,
        view_access = false,
        delete_access = false,
      } = permission;

      // Check if permission already exists for this role & module
      let existingPermission = await RolePermission.findOne({
        where: { role_id, module_name },
      });

      if (existingPermission) {
        existingPermission.module_access = module_access;
        existingPermission.create_access = create_access;
        existingPermission.edit_access = edit_access;
        existingPermission.view_access = view_access;
        existingPermission.delete_access = delete_access;
        await existingPermission.save();
        return existingPermission;
      }

      const created = await RolePermission.create({
        role_id,
        module_name,
        module_access,
        create_access,
        edit_access,
        view_access,
        delete_access,
      });

      return created;
    });

    const results = (await Promise.all(permissionPromises)).filter(Boolean);

    return res.status(201).json({
      success: true,
      message: 'Role permissions created successfully.',
      data: {
        role_id,
        permissions: results,
      },
    });
  } catch (error) {
    console.error('Error in createRolePermissionsByAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get role permission by ID
 * @route   GET /api/role-permissions/:id
 */
export const getRolePermissionById = async (req, res) => {
  try {
    const { id } = req.params;

    // First try finding by role_id
    let permissions = await RolePermission.findAll({
      where: { role_id: id },
    });

    // If not found by role_id, check by primary key id
    if (permissions.length === 0) {
      const single = await RolePermission.findByPk(id);
      if (single) {
        permissions = [single];
      }
    }

    if (permissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No role permissions found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role permissions retrieved successfully.',
      data: {
        role_id: permissions[0].role_id,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error in getRolePermissionById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all role permissions grouped by role (with pagination)
 * @route   GET /api/role-permissions/all
 */
export const getAllRolePermission = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * pageSize;

    const roles = await Role.findAndCountAll({
      order: [['id', 'ASC']],
      limit: pageSize,
      offset,
    });

    if (roles.count === 0) {
      return res.status(200).json({
        success: true,
        message: 'No roles available.',
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        perPage: pageSize,
        data: [],
      });
    }

    const roleIds = roles.rows.map((r) => r.id);

    const permissions = await RolePermission.findAll({
      where: { role_id: roleIds },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const grouped = {};
    permissions.forEach((perm) => {
      const rId = perm.role_id;
      const rName = perm.role ? perm.role.role_name : 'Unknown';

      if (!grouped[rId]) {
        grouped[rId] = {
          role: {
            id: rId,
            role_name: rName,
          },
          permissions: [],
        };
      }
      grouped[rId].permissions.push(perm);
    });

    return res.status(200).json({
      success: true,
      message: 'Role permissions retrieved successfully.',
      totalCount: roles.count,
      totalPages: Math.ceil(roles.count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error('Error in getAllRolePermission:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update role permissions by Admin & sync linked users (respecting is_extra)
 * @route   PUT /api/role-permissions/update/:role_id
 */
export const updateRolePermissionsByAdmin = async (req, res) => {
  try {
    const { role_id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Permissions array is required and cannot be empty.',
      });
    }

    const permissionPromises = permissions.map(async (perm) => {
      if (!perm || typeof perm !== 'object' || !perm.module_name) {
        return null;
      }

      const {
        module_name,
        module_access = false,
        create_access = false,
        edit_access = false,
        view_access = false,
        delete_access = false,
      } = perm;

      let existingPermission = await RolePermission.findOne({
        where: { role_id: Number(role_id), module_name },
      });

      if (!existingPermission) {
        existingPermission = await RolePermission.create({
          role_id: Number(role_id),
          module_name,
          module_access,
          create_access,
          edit_access,
          view_access,
          delete_access,
        });
      } else {
        existingPermission.module_access = module_access;
        existingPermission.create_access = create_access;
        existingPermission.edit_access = edit_access;
        existingPermission.view_access = view_access;
        existingPermission.delete_access = delete_access;
        await existingPermission.save();
      }

      // Sync linked user permissions while preserving is_extra custom overrides!
      const userPermissions = await UserPermission.findAll({
        where: { role_id: Number(role_id), module_name },
      });

      for (const uPerm of userPermissions) {
        if (!uPerm.is_extra) {
          uPerm.module_access = module_access;
        }
        if (!uPerm.is_extra_view) {
          uPerm.view_access = view_access;
        }
        if (!uPerm.is_extra_create) {
          uPerm.create_access = create_access;
        }
        if (!uPerm.is_extra_edit) {
          uPerm.edit_access = edit_access;
        }
        if (!uPerm.is_extra_delete) {
          uPerm.delete_access = delete_access;
        }
        await uPerm.save();
      }

      return existingPermission;
    });

    await Promise.all(permissionPromises);

    const updatedPermissions = await RolePermission.findAll({
      where: { role_id: Number(role_id) },
    });

    return res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully.',
      data: {
        role_id: Number(role_id),
        permissions: updatedPermissions,
      },
    });
  } catch (error) {
    console.error('Error in updateRolePermissionsByAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get permissions by role_id
 * @route   GET /api/role-permissions/role/:role_id
 */
export const getRolePermissionByRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    const permissions = await RolePermission.findAll({
      where: { role_id },
    });

    if (permissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No role permissions found for this role.',
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Role permissions retrieved successfully.',
      data: permissions,
    });
  } catch (error) {
    console.error('Error in getRolePermissionByRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
