import { UserPermission, RolePermission, Role, User } from '../models/index.js';

/**
 * @desc    Get user permissions by user_id
 * @route   GET /api/user-permissions/:user_id
 */
export const getUserProfileByToken = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required.',
      });
    }

    const userPermissions = await UserPermission.findAll({
      where: { user_id },
      order: [['module_name', 'ASC']],
    });

    if (userPermissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No permissions found for the given user.',
      });
    }

    const role_id = userPermissions[0].role_id;

    return res.status(200).json({
      success: true,
      message: 'User permissions fetched successfully.',
      data: {
        user_id,
        role_id,
        permissions: userPermissions,
      },
    });
  } catch (error) {
    console.error('Error in getUserProfileByToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Create or update user permissions (with is_extra custom overrides)
 * @route   POST /api/user-permissions/create
 */
export const createUserPermissions = async (req, res) => {
  try {
    const { role_id, user_id, permissions } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Both user_id and role_id are required.',
      });
    }

    const userExists = await User.findByPk(user_id);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${user_id} not found.`,
      });
    }

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
        is_extra = false,
        is_extra_view = false,
        is_extra_create = false,
        is_extra_edit = false,
        is_extra_delete = false,
      } = perm;

      const existingPermission = await UserPermission.findOne({
        where: { user_id, role_id, module_name },
      });

      if (existingPermission) {
        existingPermission.module_access = module_access;
        existingPermission.create_access = create_access;
        existingPermission.edit_access = edit_access;
        existingPermission.view_access = view_access;
        existingPermission.delete_access = delete_access;
        existingPermission.is_extra = is_extra;
        existingPermission.is_extra_view = is_extra_view;
        existingPermission.is_extra_create = is_extra_create;
        existingPermission.is_extra_edit = is_extra_edit;
        existingPermission.is_extra_delete = is_extra_delete;
        await existingPermission.save();
        return existingPermission;
      }

      const created = await UserPermission.create({
        role_id,
        user_id,
        module_name,
        module_access,
        create_access,
        edit_access,
        view_access,
        delete_access,
        is_extra,
        is_extra_view,
        is_extra_create,
        is_extra_edit,
        is_extra_delete,
      });

      return created;
    });

    const results = (await Promise.all(permissionPromises)).filter(Boolean);

    return res.status(201).json({
      success: true,
      message: 'User permissions saved successfully.',
      data: {
        role_id,
        user_id,
        permissions: results,
      },
    });
  } catch (error) {
    console.error('Error in createUserPermissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset user permissions back to the role's default permissions
 * @route   POST /api/user-permissions/resetPermissionToDefault
 */
export const resetPermissionToDefault = async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Both user_id and role_id are required.',
      });
    }

    // Fetch default permissions for this role
    const defaultRolePermissions = await RolePermission.findAll({
      where: { role_id },
    });

    if (defaultRolePermissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No default permissions found for this role.',
      });
    }

    const defaultMap = {};
    defaultRolePermissions.forEach((dp) => {
      defaultMap[dp.module_name] = dp;
    });

    // Fetch user's existing permissions
    const userPermissions = await UserPermission.findAll({
      where: { user_id, role_id },
    });

    // Reset user permissions to role defaults and clear is_extra flags
    for (const uPerm of userPermissions) {
      const defaultPerm = defaultMap[uPerm.module_name];
      if (defaultPerm) {
        uPerm.module_access = defaultPerm.module_access;
        uPerm.create_access = defaultPerm.create_access;
        uPerm.edit_access = defaultPerm.edit_access;
        uPerm.view_access = defaultPerm.view_access;
        uPerm.delete_access = defaultPerm.delete_access;
      }
      uPerm.is_extra = false;
      uPerm.is_extra_create = false;
      uPerm.is_extra_view = false;
      uPerm.is_extra_edit = false;
      uPerm.is_extra_delete = false;

      await uPerm.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Permissions reset to default successfully.',
    });
  } catch (error) {
    console.error('Error in resetPermissionToDefault:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
