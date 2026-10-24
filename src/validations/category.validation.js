import Joi from 'joi';

/**
 * Validation schema for creating a category
 */
export const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': '"name" should be a type of text',
    'string.empty': '"name" cannot be an empty field',
    'any.required': '"name" is a required field',
  }),

  slug: Joi.string().trim().allow(null, '').optional().messages({
    'string.base': '"slug" should be a type of text',
  }),

  parent_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null, '').optional().messages({
    'string.guid': '"parent_id" must be a valid UUID',
  }),

  description: Joi.string().allow(null, '').optional(),

  image: Joi.string().allow(null, '').optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),
});

/**
 * Validation schema for updating a category
 */
export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),

  slug: Joi.string().trim().allow(null, '').optional(),

  parent_id: Joi.string().guid({ version: ['uuidv4'] }).allow(null, '').optional().messages({
    'string.guid': '"parent_id" must be a valid UUID',
  }),

  description: Joi.string().allow(null, '').optional(),

  image: Joi.string().allow(null, '').optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),
});

/**
 * Validation schema for category status update
 */
export const updateCategoryStatusSchema = Joi.object({
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).required().messages({
    'any.required': '"status" is a required field',
  }),
});

/**
 * Validation schema for multiple category deletion
 */
export const deleteMultipleCategoriesSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .min(1)
    .required()
    .messages({
      'array.base': '"ids" must be an array of category UUIDs',
      'array.min': '"ids" must contain at least one ID',
      'any.required': '"ids" is required',
    }),
});

/**
 * Express middleware to validate category creation
 */
export const validateCreateCategory = (req, res, next) => {
  const { error } = createCategorySchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate category update
 */
export const validateUpdateCategory = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Category ID is required in URL parameter',
    });
  }

  const { error } = updateCategorySchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate category status update
 */
export const validateUpdateCategoryStatus = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Category ID is required in URL parameter',
    });
  }

  const { error } = updateCategoryStatusSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate multiple category deletion
 */
export const validateDeleteMultipleCategories = (req, res, next) => {
  const { error } = deleteMultipleCategoriesSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
