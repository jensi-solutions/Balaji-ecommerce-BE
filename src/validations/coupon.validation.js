import Joi from 'joi';

/**
 * Validation schema for creating a new coupon
 */
export const createCouponSchema = Joi.object({
  coupon_code: Joi.string().trim().required().messages({
    'string.base': '"coupon_code" should be a type of text',
    'string.empty': '"coupon_code" cannot be an empty field',
    'any.required': '"coupon_code" is a required field',
  }),

  discount: Joi.number().positive().required().messages({
    'number.base': '"discount" should be a type of number',
    'number.positive': '"discount" must be a positive number',
    'any.required': '"discount" is a required field',
  }),

  discount_type: Joi.string().valid('percentage', 'fixed_amount').required().messages({
    'string.base': '"discount_type" should be a type of text',
    'any.only': '"discount_type" must be one of [percentage, fixed_amount]',
    'any.required': '"discount_type" is a required field',
  }),

  expiration_date: Joi.date().required().messages({
    'date.base': '"expiration_date" should be a valid date',
    'any.required': '"expiration_date" is a required field',
  }),

  usage_limit: Joi.number().integer().min(1).required().messages({
    'number.base': '"usage_limit" should be a type of number',
    'number.integer': '"usage_limit" must be an integer',
    'number.min': '"usage_limit" should be at least 1',
    'any.required': '"usage_limit" is a required field',
  }),

  used_count: Joi.number().integer().min(0).allow(null, '').optional(),

  products: Joi.array().allow(null, '').optional(),

  display: Joi.boolean().required().messages({
    'any.required': '"display" is a required field',
  }),

  status: Joi.boolean().required().messages({
    'any.required': '"status" is a required field',
  }),
});

/**
 * Validation schema for updating a coupon
 */
export const updateCouponSchema = Joi.object({
  coupon_code: Joi.string().trim().optional(),

  discount: Joi.number().positive().optional(),

  discount_type: Joi.string().valid('percentage', 'fixed_amount').optional(),

  expiration_date: Joi.date().optional(),

  usage_limit: Joi.number().integer().min(1).optional(),

  used_count: Joi.number().integer().min(0).allow(null, '').optional(),

  products: Joi.array().allow(null, '').optional(),

  display: Joi.boolean().optional(),

  status: Joi.boolean().optional(),
}).min(1);

/**
 * Validation schema for updating coupon status
 */
export const updateCouponStatusSchema = Joi.object({
  status: Joi.alternatives()
    .try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0'))
    .required()
    .messages({
      'any.required': '"status" is a required field',
    }),
});

/**
 * Validation schema for multiple deletion of coupons
 */
export const deleteMultipleCouponsSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number()))
    .min(1)
    .required()
    .messages({
      'any.required': '"ids" array is required',
      'array.base': '"ids" must be an array of coupon IDs',
      'array.min': 'At least one coupon ID must be provided',
    }),
});

/**
 * Express middleware to validate create coupon
 */
export const validateCreateCoupon = (req, res, next) => {
  const { error } = createCouponSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

/**
 * Express middleware to validate update coupon
 */
export const validateUpdateCoupon = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Coupon ID is required in URL parameter',
    });
  }

  const { error } = updateCouponSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

/**
 * Express middleware to validate coupon status update
 */
export const validateUpdateCouponStatus = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Coupon ID is required in URL parameter',
    });
  }

  const { error } = updateCouponStatusSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

/**
 * Express middleware to validate multiple delete
 */
export const validateDeleteMultipleCoupons = (req, res, next) => {
  const { error } = deleteMultipleCouponsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
