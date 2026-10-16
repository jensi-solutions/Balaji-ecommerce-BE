import Joi from 'joi';

/**
 * Validation schema for creating a new warehouse
 */
export const createWarehouseSchema = Joi.object({
  warehouse_name: Joi.string().trim().required().messages({
    'string.empty': 'Warehouse name is a required field',
    'any.required': 'Warehouse name is a required field',
  }),

  first_name: Joi.string().allow('', null).optional(),

  email: Joi.string().email().allow('', null).optional().messages({
    'string.email': 'Email must be a valid email address',
  }),

  phone_number: Joi.string().allow('', null).optional(),

  phone_print: Joi.string().allow('', null).optional(),

  address: Joi.string().allow('', null).optional(),

  address_2: Joi.string().allow('', null).optional(),

  city: Joi.string().allow('', null).optional(),

  state: Joi.string().allow('', null).optional(),

  country: Joi.string().allow('', null).optional(),

  zip_code: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  longitude: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  latitude: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  gst_no: Joi.string().allow('', null).optional(),

  fssai_code: Joi.string().allow('', null).optional(),

  warehouse_maintainer: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number(), Joi.object()))
    .allow(null)
    .optional(),

  active_status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).optional(),

  online_order: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).allow(null, '').optional(),
});

/**
 * Validation schema for updating an existing warehouse
 */
export const updateWarehouseSchema = Joi.object({
  warehouse_name: Joi.string().trim().optional(),

  first_name: Joi.string().allow('', null).optional(),

  email: Joi.string().email().allow('', null).optional().messages({
    'string.email': 'Email must be a valid email address',
  }),

  phone_number: Joi.string().allow('', null).optional(),

  phone_print: Joi.string().allow('', null).optional(),

  address: Joi.string().allow('', null).optional(),

  address_2: Joi.string().allow('', null).optional(),

  city: Joi.string().allow('', null).optional(),

  state: Joi.string().allow('', null).optional(),

  country: Joi.string().allow('', null).optional(),

  zip_code: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  longitude: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  latitude: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  gst_no: Joi.string().allow('', null).optional(),

  fssai_code: Joi.string().allow('', null).optional(),

  warehouse_maintainer: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number(), Joi.object()))
    .allow(null)
    .optional(),

  active_status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).optional(),

  online_order: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).allow(null, '').optional(),
});

/**
 * Validation schema for multiple deletion of warehouses
 */
export const deleteMultipleWarehousesSchema = Joi.object({
  ids: Joi.array()
    .items(Joi.alternatives().try(Joi.string(), Joi.number()))
    .min(1)
    .required()
    .messages({
      'any.required': 'ids array is required',
      'array.base': 'ids must be an array of warehouse IDs',
      'array.min': 'At least one warehouse ID must be provided',
    }),
});

/**
 * Express middleware to validate create warehouse body
 */
export const validateCreateWarehouse = (req, res, next) => {
  const { error } = createWarehouseSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate update warehouse body
 */
export const validateUpdateWarehouse = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'Warehouse ID is required in URL parameter',
    });
  }

  const { error } = updateWarehouseSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate multiple delete body
 */
export const validateDeleteMultipleWarehouses = (req, res, next) => {
  const { error } = deleteMultipleWarehousesSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
