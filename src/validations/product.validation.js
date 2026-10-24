import Joi from 'joi';

/**
 * Helper to validate parsed JSON string if needed
 */
const customArrayOrJsonParser = (value, helpers) => {
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
 * Validation schema for a product variant
 */
const variantSchema = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4'] }).allow(null, '').optional(),
  sku: Joi.string().trim().allow(null, '').optional(),
  price: Joi.number().positive().required().messages({
    'number.base': 'Variant "price" must be a number',
    'number.positive': 'Variant "price" must be greater than 0',
    'any.required': 'Variant "price" is required',
  }),
  discount_price: Joi.number().min(0).allow(null, '').optional(),
  stock_quantity: Joi.number().integer().min(0).default(0).optional(),
  attributes: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.array()).allow(null, '').optional(),
  image: Joi.string().allow(null, '').optional(),
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),
});

/**
 * Validation schema for creating a product
 */
export const createProductSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': '"name" should be a type of text',
    'string.empty': '"name" cannot be an empty field',
    'any.required': '"name" is a required field',
  }),

  category_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null, '').optional().messages({
    'string.guid': '"category_id" must be a valid UUID',
  }),

  brand: Joi.string().allow(null, '').optional(),

  description: Joi.string().allow(null, '').optional(),

  short_description: Joi.string().allow(null, '').optional(),

  main_image: Joi.string().allow(null, '').optional(),

  multiple_images: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .allow(null, '')
    .optional(),

  is_featured: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),

  collection_ids: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })),
      Joi.string()
    )
    .allow(null, '')
    .optional(),

  variants: Joi.alternatives()
    .try(
      Joi.array().items(variantSchema).min(1),
      Joi.string().trim().min(2)
    )
    .required()
    .messages({
      'any.required': '"variants" is a required field. Price, discount, SKU and stock must be specified inside variants.',
    }),
}).unknown(true);

/**
 * Validation schema for updating a product
 */
export const updateProductSchema = Joi.object({
  name: Joi.string().trim().optional(),

  category_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null, '').optional().messages({
    'string.guid': '"category_id" must be a valid UUID',
  }),

  brand: Joi.string().allow(null, '').optional(),

  description: Joi.string().allow(null, '').optional(),

  short_description: Joi.string().allow(null, '').optional(),

  main_image: Joi.string().allow(null, '').optional(),

  multiple_images: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .allow(null, '')
    .optional(),

  is_featured: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),

  collection_ids: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().guid({ version: ['uuidv4'] })),
      Joi.string()
    )
    .allow(null, '')
    .optional(),

  variants: Joi.alternatives()
    .try(
      Joi.array().items(variantSchema),
      Joi.string()
    )
    .allow(null, '')
    .optional(),
}).unknown(true);

/**
 * Validation schema for updating product status
 */
export const updateProductStatusSchema = Joi.object({
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).required().messages({
    'any.required': '"status" is a required field',
  }),
});

/**
 * Validation schema for updating product featured flag
 */
export const updateProductFeaturedSchema = Joi.object({
  is_featured: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).required().messages({
    'any.required': '"is_featured" is a required field',
  }),
});

/**
 * Validation schema for updating variant stock quantity
 */
export const updateVariantStockSchema = Joi.object({
  stock_quantity: Joi.number().integer().min(0).required().messages({
    'number.base': '"stock_quantity" must be a number',
    'number.integer': '"stock_quantity" must be an integer',
    'number.min': '"stock_quantity" cannot be less than 0',
    'any.required': '"stock_quantity" is a required field',
  }),
});

/**
 * Validation schema for multiple product deletion
 */
export const deleteMultipleProductsSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .min(1)
    .required()
    .messages({
      'array.base': '"ids" must be an array of product UUIDs',
      'array.min': '"ids" must contain at least one ID',
      'any.required': '"ids" is required',
    }),
});

/**
 * Express middleware to validate product creation
 */
export const validateCreateProduct = (req, res, next) => {
  // If variants passed index-wise in form-data like variants[0][price], pre-parse into req.body.variants
  if (!req.body.variants) {
    const indexedVariants = [];
    const regex = /^variants\[(\d+)\]\[([a-zA-Z0-9_]+)\](?:\[([a-zA-Z0-9_]+)\])?$/;

    Object.keys(req.body || {}).forEach((key) => {
      const match = key.match(regex);
      if (match) {
        const index = parseInt(match[1], 10);
        const prop = match[2];
        const subProp = match[3];

        if (!indexedVariants[index]) indexedVariants[index] = {};

        if (subProp) {
          if (!indexedVariants[index][prop] || typeof indexedVariants[index][prop] !== 'object') {
            indexedVariants[index][prop] = {};
          }
          indexedVariants[index][prop][subProp] = req.body[key];
        } else {
          indexedVariants[index][prop] = req.body[key];
        }
      }
    });

    const filtered = indexedVariants.filter(Boolean);
    if (filtered.length > 0) {
      req.body.variants = filtered;
    }
  }

  const { error } = createProductSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate product update
 */
export const validateUpdateProduct = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required in URL parameter',
    });
  }

  const { error } = updateProductSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate product status update
 */
export const validateUpdateProductStatus = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required in URL parameter',
    });
  }

  const { error } = updateProductStatusSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate product featured flag
 */
export const validateUpdateProductFeatured = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required in URL parameter',
    });
  }

  const { error } = updateProductFeaturedSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate variant stock update
 */
export const validateUpdateVariantStock = (req, res, next) => {
  if (!req.params.variant_id) {
    return res.status(400).json({
      success: false,
      message: 'Variant ID is required in URL parameter',
    });
  }

  const { error } = updateVariantStockSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate multiple product deletion
 */
export const validateDeleteMultipleProducts = (req, res, next) => {
  const { error } = deleteMultipleProductsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
