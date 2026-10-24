import Joi from 'joi';

/**
 * Validation schema for creating a collection
 */
export const createCollectionSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.base': '"name" should be a type of text',
    'string.empty': '"name" cannot be an empty field',
    'any.required': '"name" is a required field',
  }),

  description: Joi.string().allow(null, '').optional(),

  image: Joi.string().allow(null, '').optional(),

  banner_image: Joi.string().allow(null, '').optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),
});

/**
 * Validation schema for updating a collection
 */
export const updateCollectionSchema = Joi.object({
  name: Joi.string().trim().optional(),

  description: Joi.string().allow(null, '').optional(),

  image: Joi.string().allow(null, '').optional(),

  banner_image: Joi.string().allow(null, '').optional(),

  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).optional(),
});

/**
 * Validation schema for collection status update
 */
export const updateCollectionStatusSchema = Joi.object({
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '0', '1')).required().messages({
    'any.required': '"status" is a required field',
  }),
});

/**
 * Validation schema for multiple collection deletion
 */
export const deleteMultipleCollectionsSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.string().guid({ version: ['uuidv4'] }))
    .min(1)
    .required()
    .messages({
      'array.base': '"ids" must be an array of collection UUIDs',
      'array.min': '"ids" must contain at least one ID',
      'any.required': '"ids" is required',
    }),
});

/**
 * Express middleware to validate collection creation
 */
export const validateCreateCollection = (req, res, next) => {
  const { error } = createCollectionSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate collection update
 */
export const validateUpdateCollection = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Collection ID is required in URL parameter',
    });
  }

  const { error } = updateCollectionSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate collection status update
 */
export const validateUpdateCollectionStatus = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Collection ID is required in URL parameter',
    });
  }

  const { error } = updateCollectionStatusSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate multiple collection deletion
 */
export const validateDeleteMultipleCollections = (req, res, next) => {
  const { error } = deleteMultipleCollectionsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
