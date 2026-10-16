import Joi from 'joi';

/**
 * Validation schema for creating a new user
 */
export const createUserSchema = Joi.object({
  first_name: Joi.string().trim().required().messages({
    'string.empty': 'First name is a required field',
    'any.required': 'First name is a required field',
  }),

  last_name: Joi.string().allow('', null).optional(),

  email: Joi.string().trim().email().required().messages({
    'string.email': 'Email must be a valid email',
    'string.empty': 'Email cannot be an empty field',
    'any.required': 'Email is a required field',
  }),

  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password cannot be an empty field',
    'any.required': 'Password is a required field',
  }),

  phone_number: Joi.string().allow('', null).optional(),

  birth_date: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null).optional(),

  gender: Joi.string().valid('male', 'female', 'other').allow('', null).optional().messages({
    'any.only': 'Gender must be one of [male, female, other]',
  }),

  role_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow('', null).optional(),

  address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).optional(),
  zip_code: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  active_status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).optional(),

  profile_picture: Joi.string().allow('', null).optional(),

  permissions: Joi.alternatives().try(Joi.array(), Joi.string()).allow('', null).optional(),
});

/**
 * Validation schema for updating a user
 */
export const updateUserSchema = Joi.object({
  id: Joi.string().optional(),

  first_name: Joi.string().trim().optional(),

  last_name: Joi.string().allow('', null).optional(),

  email: Joi.string().trim().email().optional().messages({
    'string.email': 'Email must be a valid email',
  }),

  password: Joi.string().min(6).allow('', null).optional().messages({
    'string.min': 'Password must be at least 6 characters long',
  }),

  phone_number: Joi.string().allow('', null).optional(),

  birth_date: Joi.alternatives().try(Joi.date(), Joi.string()).allow('', null).optional(),

  gender: Joi.string().valid('male', 'female', 'other').allow('', null).optional().messages({
    'any.only': 'Gender must be one of [male, female, other]',
  }),

  role_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow('', null).optional(),

  address: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).optional(),
  zip_code: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null).optional(),

  active_status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false', '1', '0')).optional(),

  profile_picture: Joi.string().allow('', null).optional(),

  permissions: Joi.alternatives().try(Joi.array(), Joi.string()).allow('', null).optional(),
});

/**
 * Express middleware to validate create user
 */
export const validateCreateUser = (req, res, next) => {
  const { error } = createUserSchema.validate(req.body, { abortEarly: false });
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
 * Express middleware to validate update user
 */
export const validateUpdateUser = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required in URL parameter',
    });
  }

  const { error } = updateUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};
