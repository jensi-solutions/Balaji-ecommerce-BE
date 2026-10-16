import { Op } from 'sequelize';
import { Warehouse, User } from '../models/index.js';

/**
 * Helper to normalize warehouse_maintainer input into an array of user IDs
 */
const parseMaintainerIds = (maintainers) => {
  if (!maintainers) return [];
  let parsed = maintainers;
  if (typeof maintainers === 'string') {
    try {
      parsed = JSON.parse(maintainers);
    } catch {
      parsed = maintainers.split(',').map((id) => id.trim());
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        return item.id || item.user_id;
      }
      return item;
    })
    .filter(Boolean);
};

/**
 * Helper to fetch maintainer user records from User table
 */
const getMaintainerDetails = async (maintainerIds) => {
  if (!maintainerIds || maintainerIds.length === 0) return [];
  return await User.findAll({
    where: { id: maintainerIds },
    attributes: [
      'id',
      'first_name',
      'last_name',
      'email',
      'phone_number',
      'profile_picture',
      'gender',
      'role_id',
      'active_status',
    ],
  });
};

/**
 * @desc    Create a new warehouse
 * @route   POST /api/warehouses/create
 */
export const createWarehouse = async (req, res) => {
  try {
    const {
      warehouse_name,
      email,
      phone_number,
      phone_print,
      address,
      address_2,
      city,
      state,
      country,
      zip_code,
      longitude,
      latitude,
      gst_no,
      fssai_code,
      warehouse_maintainer,
      active_status,
      online_order,
    } = req.body;

    // Check if warehouse with same name already exists
    const existingWarehouse = await Warehouse.findOne({
      where: { warehouse_name: warehouse_name.trim() },
    });
    if (existingWarehouse) {
      return res.status(409).json({
        success: false,
        message: 'A warehouse with this name already exists.',
      });
    }

    // Parse maintainer IDs
    const maintainerList = parseMaintainerIds(warehouse_maintainer);

    if (maintainerList.length > 0) {
      for (const userId of maintainerList) {
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: `User with ID '${userId}' not found.`,
          });
        }

        if (Number(user.role_id) !== 1) {
          return res.status(400).json({
            success: false,
            message: `User with ID '${userId}' does not have role_id 1. Only users with role_id 1 can be assigned as warehouse maintainers.`,
          });
        }
      }
    }

    // Parse booleans
    const isActive = active_status !== undefined
      ? active_status === true || active_status === 'true' || active_status === 1 || active_status === '1'
      : true;

    const isOnlineOrder = online_order !== undefined
      ? online_order === true || online_order === 'true' || online_order === 1 || online_order === '1'
      : false;

    const newWarehouse = await Warehouse.create({
      warehouse_name: warehouse_name.trim(),
      email: email ? email.trim() : null,
      phone_number: phone_number ? phone_number.trim() : null,
      phone_print: phone_print ? phone_print.trim() : null,
      address: address ? address.trim() : null,
      address_2: address_2 ? address_2.trim() : null,
      city: city ? city.trim() : null,
      state: state ? state.trim() : null,
      country: country ? country.trim() : null,
      zip_code: zip_code ? String(zip_code).trim() : null,
      longitude: longitude !== undefined && longitude !== null ? String(longitude).trim() : null,
      latitude: latitude !== undefined && latitude !== null ? String(latitude).trim() : null,
      gst_no: gst_no ? gst_no.trim() : null,
      fssai_code: fssai_code ? fssai_code.trim() : null,
      warehouse_maintainer: maintainerList,
      online_order: isOnlineOrder,
      active_status: isActive,
    });

    return res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing warehouse
 * @route   PUT /api/warehouses/update/:id
 */
export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const {
      warehouse_name,
      email,
      phone_number,
      phone_print,
      address,
      address_2,
      city,
      state,
      country,
      zip_code,
      longitude,
      latitude,
      gst_no,
      fssai_code,
      warehouse_maintainer,
      active_status,
      online_order,
    } = req.body;

    // Check unique name constraint if warehouse_name is changing
    if (warehouse_name && warehouse_name.trim() !== warehouse.warehouse_name) {
      const existingName = await Warehouse.findOne({
        where: {
          warehouse_name: warehouse_name.trim(),
          id: { [Op.ne]: id },
        },
      });
      if (existingName) {
        return res.status(409).json({
          success: false,
          message: 'Another warehouse with this name already exists.',
        });
      }
      warehouse.warehouse_name = warehouse_name.trim();
    }

    if (email !== undefined) warehouse.email = email ? email.trim() : null;
    if (phone_number !== undefined) warehouse.phone_number = phone_number ? phone_number.trim() : null;
    if (phone_print !== undefined) warehouse.phone_print = phone_print ? phone_print.trim() : null;
    if (address !== undefined) warehouse.address = address ? address.trim() : null;
    if (address_2 !== undefined) warehouse.address_2 = address_2 ? address_2.trim() : null;
    if (city !== undefined) warehouse.city = city ? city.trim() : null;
    if (state !== undefined) warehouse.state = state ? state.trim() : null;
    if (country !== undefined) warehouse.country = country ? country.trim() : null;
    if (zip_code !== undefined) warehouse.zip_code = zip_code ? String(zip_code).trim() : null;
    if (longitude !== undefined) warehouse.longitude = longitude !== null ? String(longitude).trim() : null;
    if (latitude !== undefined) warehouse.latitude = latitude !== null ? String(latitude).trim() : null;
    if (gst_no !== undefined) warehouse.gst_no = gst_no ? gst_no.trim() : null;
    if (fssai_code !== undefined) warehouse.fssai_code = fssai_code ? fssai_code.trim() : null;

    if (warehouse_maintainer !== undefined) {
      const maintainerList = parseMaintainerIds(warehouse_maintainer);
      if (maintainerList.length > 0) {
        for (const userId of maintainerList) {
          const user = await User.findByPk(userId);
          if (!user) {
            return res.status(404).json({
              success: false,
              message: `User with ID '${userId}' not found.`,
            });
          }

          if (Number(user.role_id) !== 1) {
            return res.status(400).json({
              success: false,
              message: `User with ID '${userId}' does not have role_id 1. Only users with role_id 1 can be assigned as warehouse maintainers.`,
            });
          }
        }
      }
      warehouse.warehouse_maintainer = maintainerList;
    }

    if (active_status !== undefined) {
      warehouse.active_status =
        active_status === true || active_status === 'true' || active_status === 1 || active_status === '1';
    }

    if (online_order !== undefined) {
      warehouse.online_order =
        online_order === true || online_order === 'true' || online_order === 1 || online_order === '1';
    }

    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: 'Warehouse updated successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all warehouses with pagination, search, and status filter
 * @route   GET /api/warehouses/all
 */
export const getAllWarehouse = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status !== undefined && req.query.status !== null ? req.query.status.toString().trim().toLowerCase() : null;

    const whereCondition = {};

    if (status === 'true' || status === '1') {
      whereCondition.active_status = true;
    } else if (status === 'false' || status === '0') {
      whereCondition.active_status = false;
    }

    if (search) {
      whereCondition[Op.or] = [
        { warehouse_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: warehouses } = await Warehouse.findAndCountAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    // Populate maintainer user details
    const warehousesWithMaintainers = await Promise.all(
      warehouses.map(async (wh) => {
        const whJson = wh.toJSON();
        const maintainerIds = parseMaintainerIds(whJson.warehouse_maintainer);
        const maintainers = await getMaintainerDetails(maintainerIds);
        return {
          ...whJson,
          warehouse_maintainer: maintainers,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Warehouses retrieved successfully',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: warehousesWithMaintainers,
    });
  } catch (error) {
    console.error('Error retrieving warehouses:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all active warehouses without pagination or filters
 * @route   GET /api/warehouses/withoutFilter
 */
export const getAllWarehouseWithoutFilter = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      where: { active_status: true },
      order: [['warehouse_name', 'ASC']],
    });

    const warehousesWithMaintainers = await Promise.all(
      warehouses.map(async (wh) => {
        const whJson = wh.toJSON();
        const maintainerIds = parseMaintainerIds(whJson.warehouse_maintainer);
        const maintainers = await getMaintainerDetails(maintainerIds);
        return {
          ...whJson,
          warehouse_maintainer: maintainers,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Warehouses retrieved successfully',
      data: warehousesWithMaintainers,
    });
  } catch (error) {
    console.error('Error retrieving warehouses without filter:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a warehouse by ID
 * @route   GET /api/warehouses/get/:id (also /:id)
 */
export const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID is required',
      });
    }

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    const whJson = warehouse.toJSON();
    const maintainerIds = parseMaintainerIds(whJson.warehouse_maintainer);
    const maintainers = await getMaintainerDetails(maintainerIds);

    return res.status(200).json({
      success: true,
      message: 'Warehouse retrieved successfully',
      data: {
        ...whJson,
        warehouse_maintainer: maintainers,
      },
    });
  } catch (error) {
    console.error('Error retrieving warehouse by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get warehouse associated with the authenticated user token
 * @route   GET /api/warehouses/token
 */
export const getWarehouseByToken = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User information missing from token.',
      });
    }

    const allWarehouses = await Warehouse.findAll({
      where: { active_status: true },
      order: [['created_at', 'DESC']],
    });

    // Find warehouse where user is in maintainer list
    const userWarehouse = allWarehouses.find((wh) => {
      const maintainers = parseMaintainerIds(wh.warehouse_maintainer);
      return maintainers.some((mId) => String(mId) === String(userId));
    });

    if (!userWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found or you are not authorized to view this warehouse',
      });
    }

    const whJson = userWarehouse.toJSON();
    const maintainerIds = parseMaintainerIds(whJson.warehouse_maintainer);
    const maintainers = await getMaintainerDetails(maintainerIds);

    return res.status(200).json({
      success: true,
      message: 'Warehouse retrieved successfully',
      data: {
        ...whJson,
        warehouse_maintainer: maintainers,
      },
    });
  } catch (error) {
    console.error('Error retrieving warehouse by token:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a warehouse by ID (Soft delete)
 * @route   DELETE /api/warehouses/delete/:id (also /:id)
 */
export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse ID is required',
      });
    }

    const warehouse = await Warehouse.findByPk(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found',
      });
    }

    await warehouse.destroy();

    return res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete multiple warehouses by IDs
 * @route   POST /api/warehouses/multiple/delete
 */
export const deleteMultipleWarehouses = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids must be a non-empty array of warehouse IDs',
      });
    }

    const deletedCount = await Warehouse.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `${deletedCount} warehouse(s) deleted successfully`,
      deletedCount,
      deletedIds: ids,
    });
  } catch (error) {
    console.error('Error deleting multiple warehouses:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
