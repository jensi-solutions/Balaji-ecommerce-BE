import { Op } from 'sequelize';
import { Coupon } from '../models/index.js';

/**
 * Helper to safely parse JSON or return original value
 */
const safeParseJSON = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((v) => v.trim());
    }
  }
  return value;
};

/**
 * @desc    Create a new coupon
 * @route   POST /api/coupons/create
 */
export const createCoupon = async (req, res) => {
  try {
    const {
      coupon_code,
      discount,
      discount_type,
      products,
      expiration_date,
      usage_limit,
      used_count,
      status,
      display,
    } = req.body;

    const trimmedCode = coupon_code.trim();

    // Check duplicate coupon code
    const existingCoupon = await Coupon.findOne({
      where: { coupon_code: trimmedCode },
    });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: 'Coupon code already exists.',
      });
    }

    const parsedProducts = safeParseJSON(products);

    const newCoupon = await Coupon.create({
      coupon_code: trimmedCode,
      discount,
      discount_type,
      products: parsedProducts,
      expiration_date,
      usage_limit: usage_limit || 1,
      used_count: used_count || 0,
      status: status !== undefined ? Boolean(status) : true,
      display: display !== undefined ? Boolean(display) : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: {},
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing coupon
 * @route   PUT /api/coupons/update/:id
 */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    const {
      coupon_code,
      discount,
      discount_type,
      products,
      expiration_date,
      usage_limit,
      used_count,
      display,
      status,
    } = req.body;

    // Check if used_count exceeds usage_limit
    const finalUsageLimit = usage_limit !== undefined ? usage_limit : coupon.usage_limit;
    const finalUsedCount = used_count !== undefined ? used_count : coupon.used_count;
    if (finalUsedCount > finalUsageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Used count cannot exceed the usage limit',
      });
    }

    // Check duplicate coupon code if changing
    if (coupon_code && coupon_code.trim() !== coupon.coupon_code) {
      const existingCoupon = await Coupon.findOne({
        where: {
          coupon_code: coupon_code.trim(),
          id: { [Op.ne]: id },
        },
      });
      if (existingCoupon) {
        return res.status(409).json({
          success: false,
          message: 'Coupon code already exists.',
        });
      }
      coupon.coupon_code = coupon_code.trim();
    }

    if (discount !== undefined) coupon.discount = discount;
    if (discount_type !== undefined) coupon.discount_type = discount_type;
    if (products !== undefined) coupon.products = safeParseJSON(products);
    if (expiration_date !== undefined) coupon.expiration_date = expiration_date;
    if (usage_limit !== undefined) coupon.usage_limit = usage_limit;
    if (used_count !== undefined) coupon.used_count = used_count;
    if (display !== undefined) coupon.display = Boolean(display);
    if (status !== undefined) coupon.status = Boolean(status);

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon updated successfully.',
      data: {},
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all coupons with pagination, search, and status filter
 * @route   GET /api/coupons/all
 */
export const getAllCoupon = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * pageSize;
    const search = req.query.search ? req.query.search.trim() : '';
    const status = req.query.status !== undefined && req.query.status !== null ? req.query.status.toString().trim().toLowerCase() : null;

    const whereCondition = {};

    if (status === 'true' || status === '1') {
      whereCondition.status = true;
    } else if (status === 'false' || status === '0') {
      whereCondition.status = false;
    }

    if (search) {
      whereCondition.coupon_code = { [Op.like]: `%${search}%` };
    }

    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereCondition,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    const formattedCoupons = coupons.map((c) => {
      const cJson = c.toJSON();
      const productIds = safeParseJSON(cJson.products);
      return {
        ...cJson,
        products: productIds,
        items: [],
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
      perPage: pageSize,
      data: formattedCoupons,
    });
  } catch (error) {
    console.error('Error retrieving coupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get coupon by ID
 * @route   GET /api/coupons/:id
 */
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Record not available',
      });
    }

    const cJson = coupon.toJSON();
    const productIds = safeParseJSON(cJson.products);

    return res.status(200).json({
      success: true,
      message: 'Coupon retrieved successfully',
      data: {
        ...cJson,
        products: productIds,
        items: [],
      },
    });
  } catch (error) {
    console.error('Error retrieving coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete coupon by ID (Soft delete)
 * @route   DELETE /api/coupons/delete/:id (also /:id)
 */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Record not available',
      });
    }

    await coupon.destroy();

    return res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete multiple coupons by IDs
 * @route   POST /api/coupons/multiple/delete
 */
export const deleteMultipleCoupon = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ids must be a non-empty array of coupon IDs',
      });
    }

    const successfulDeletions = [];
    const failedDeletions = [];

    for (const id of ids) {
      const coupon = await Coupon.findByPk(id);
      if (!coupon) {
        failedDeletions.push({ id, message: 'Coupon not found' });
        continue;
      }
      await coupon.destroy();
      successfulDeletions.push(id);
    }

    return res.status(200).json({
      success: true,
      message: 'Multiple coupons deleted successfully',
      deleted: successfulDeletions,
      failed: failedDeletions,
    });
  } catch (error) {
    console.error('Error deleting multiple coupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all non-expired coupons without filter
 * @route   GET /api/coupons/all/withoutFilter
 */
export const getAllCouponWithoutFilter = async (req, res) => {
  try {
    const currentDate = new Date();

    const coupons = await Coupon.findAll({
      where: {
        expiration_date: {
          [Op.gte]: currentDate,
        },
      },
      order: [['created_at', 'DESC']],
    });

    const formattedCoupons = coupons.map((c) => {
      const cJson = c.toJSON();
      const productIds = safeParseJSON(cJson.products);
      return {
        ...cJson,
        products: productIds,
        items: [],
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: formattedCoupons,
    });
  } catch (error) {
    console.error('Error retrieving coupons without filter:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Display active, non-expired coupons marked for display in store
 * @route   GET /api/coupons/all/displayCouponsForStore
 */
export const displayCouponsForStore = async (req, res) => {
  try {
    const currentDate = new Date();

    const coupons = await Coupon.findAll({
      where: {
        display: true,
        status: true,
        expiration_date: {
          [Op.gte]: currentDate,
        },
      },
      order: [['created_at', 'DESC']],
    });

    const formattedCoupons = coupons.map((c) => {
      const cJson = c.toJSON();
      return {
        ...cJson,
        products: safeParseJSON(cJson.products),
        items: [],
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data: formattedCoupons,
    });
  } catch (error) {
    console.error('Error retrieving store coupons:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update coupon status (active / inactive)
 * @route   PUT /api/coupons/status/change/:id
 */
export const updateCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found',
      });
    }

    const newStatus = status === true || status === 'true' || status === 1 || status === '1';
    coupon.status = newStatus;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: 'Coupon status changed successfully.',
      data: coupon,
    });
  } catch (error) {
    console.error('Error updating coupon status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
