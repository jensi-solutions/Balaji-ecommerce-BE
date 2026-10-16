import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Role, UserPermission, RolePermission } from '../models/index.js';
import { getFullFileUrl } from '../helpers/upload.helper.js';

/**
 * @desc    Create a new user
 * @route   POST /api/users/create
 */
export const createUser = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body is required. In Postman, ensure you provide Body (JSON or form-data).',
      });
    }

    const {
      first_name,
      last_name,
      birth_date,
      phone_number,
      email,
      password,
      role_id = 1,
      address,
      city,
      state,
      country,
      zip_code,
      gender,
      active_status = true,
      profile_picture,
    } = req.body;

    if (!first_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'first_name, email and password are required fields.',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const existingEmail = await User.findOne({ where: { email: trimmedEmail } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Check phone_number uniqueness if provided
    if (phone_number) {
      const existingPhone = await User.findOne({ where: { phone_number: phone_number.trim() } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists.',
        });
      }
    }

    // Verify role exists
    const targetRole = await Role.findByPk(role_id);
    if (!targetRole) {
      return res.status(404).json({
        success: false,
        message: `Role with ID ${role_id} not found.`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Format birth_date if provided
    let formattedBirthDate = null;
    if (birth_date) {
      const parsedDate = new Date(birth_date);
      if (!isNaN(parsedDate.getTime())) {
        formattedBirthDate = parsedDate.toISOString().split('T')[0];
      }
    }

    // Determine profile_picture file path
    let avatarPath = null;
    if (req.files && req.files.profile_picture && req.files.profile_picture[0]) {
      avatarPath = `uploads/users/${req.files.profile_picture[0].filename}`;
    } else if (req.file) {
      avatarPath = `uploads/users/${req.file.filename}`;
    } else if (profile_picture) {
      avatarPath = profile_picture;
    }

    // Create user
    const newUser = await User.create({
      first_name,
      last_name,
      birth_date: formattedBirthDate,
      phone_number: phone_number ? phone_number.trim() : null,
      email: trimmedEmail,
      password: hashedPassword,
      role_id,
      address,
      city,
      state,
      country,
      zip_code,
      gender,
      active_status,
      profile_picture: avatarPath,
    });

    // Auto-create default user permissions based on role permissions
    const rolePermissions = await RolePermission.findAll({
      where: { role_id },
    });

    if (rolePermissions.length > 0) {
      const userPermissionsData = rolePermissions.map((rp) => ({
        role_id,
        user_id: newUser.id,
        module_name: rp.module_name,
        module_access: rp.module_access,
        create_access: rp.create_access,
        edit_access: rp.edit_access,
        view_access: rp.view_access,
        delete_access: rp.delete_access,
        is_extra: false,
      }));
      await UserPermission.bulkCreate(userPermissionsData);
    }

    // Format response with full path URL for profile_picture
    const responseUser = {
      id: newUser.id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      phone_number: newUser.phone_number,
      birth_date: newUser.birth_date,
      gender: newUser.gender,
      profile_picture: getFullFileUrl(req, newUser.profile_picture),
      address: newUser.address,
      city: newUser.city,
      state: newUser.state,
      country: newUser.country,
      zip_code: newUser.zip_code,
      active_status: newUser.active_status,
      role: {
        id: targetRole.id,
        role_name: targetRole.role_name,
      },
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
    };

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: responseUser,
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/users/update/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body is required.',
      });
    }

    const {
      first_name,
      last_name,
      birth_date,
      phone_number,
      email,
      password,
      address,
      city,
      state,
      country,
      zip_code,
      gender,
      role_id,
      active_status,
      profile_picture,
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check duplicate email if changing
    if (email && email.trim().toLowerCase() !== user.email) {
      const trimmedEmail = email.trim().toLowerCase();
      const existingEmail = await User.findOne({ where: { email: trimmedEmail } });
      if (existingEmail && existingEmail.id !== id) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists.',
        });
      }
      user.email = trimmedEmail;
    }

    // Check duplicate phone if changing
    if (phone_number && phone_number.trim() !== user.phone_number) {
      const trimmedPhone = phone_number.trim();
      const existingPhone = await User.findOne({ where: { phone_number: trimmedPhone } });
      if (existingPhone && existingPhone.id !== id) {
        return res.status(409).json({
          success: false,
          message: 'User with this phone number already exists.',
        });
      }
      user.phone_number = trimmedPhone;
    }

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Update birth_date if provided
    if (birth_date !== undefined) {
      if (birth_date) {
        const parsedDate = new Date(birth_date);
        user.birth_date = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : null;
      } else {
        user.birth_date = null;
      }
    }

    // Handle profile_picture upload or update
    if (req.files && req.files.profile_picture && req.files.profile_picture[0]) {
      user.profile_picture = `uploads/users/${req.files.profile_picture[0].filename}`;
    } else if (req.file) {
      user.profile_picture = `uploads/users/${req.file.filename}`;
    } else if (profile_picture === 'null' || profile_picture === null) {
      user.profile_picture = null;
    } else if (profile_picture !== undefined) {
      user.profile_picture = profile_picture;
    }

    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (country !== undefined) user.country = country;
    if (zip_code !== undefined) user.zip_code = zip_code;
    if (gender !== undefined) user.gender = gender;
    if (role_id !== undefined) user.role_id = role_id;
    if (active_status !== undefined) user.active_status = active_status;

    await user.save();

    const role = await Role.findByPk(user.role_id);

    const updatedUserResponse = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      birth_date: user.birth_date,
      gender: user.gender,
      profile_picture: getFullFileUrl(req, user.profile_picture),
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      zip_code: user.zip_code,
      active_status: user.active_status,
      role: role ? { id: role.id, role_name: role.role_name } : null,
      updated_at: user.updated_at,
    };

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUserResponse,
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a user (soft delete)
 * @route   DELETE /api/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (req.user && req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    // Soft delete user permissions & user record
    await UserPermission.destroy({ where: { user_id: id } });
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user by ID with permissions & full path URL for profile_picture
 * @route   GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'otp_code', 'otp_expire'] },
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

    // Convert to JSON and format profile_picture to full URL
    const userJson = user.toJSON();
    userJson.profile_picture = getFullFileUrl(req, userJson.profile_picture);

    // Fetch user permissions, fallback to role permissions
    let permissions = await UserPermission.findAll({
      where: { user_id: id },
      attributes: ['id', 'role_id', 'module_name', 'module_access', 'create_access', 'edit_access', 'view_access', 'delete_access'],
    });

    if (permissions.length === 0 && user.role_id) {
      permissions = await RolePermission.findAll({
        where: { role_id: user.role_id },
        attributes: ['id', 'role_id', 'module_name', 'module_access', 'create_access', 'edit_access', 'view_access', 'delete_access'],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      data: {
        ...userJson,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users (with pagination, search, status & role filter, full URL for profile_picture)
 * @route   GET /api/users/
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status !== undefined ? req.query.status.toString().toLowerCase() : null;
    const roleId = req.query.role_id ? parseInt(req.query.role_id) : null;

    const whereCondition = {};

    if (status === 'true') {
      whereCondition.active_status = true;
    } else if (status === 'false') {
      whereCondition.active_status = false;
    }

    if (roleId) {
      whereCondition.role_id = roleId;
    }

    if (search) {
      whereCondition[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ['password', 'otp_code', 'otp_expire'] },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'role_name'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    // Format profile_picture full URL for each user in list
    const formattedUsers = rows.map((u) => {
      const userJson = u.toJSON();
      userJson.profile_picture = getFullFileUrl(req, userJson.profile_picture);
      return userJson;
    });

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
