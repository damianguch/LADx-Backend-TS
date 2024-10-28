const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  fullname: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z\s]+$/)
    .optional()
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 50 characters',
      'string.pattern.base': 'Full name must contain only letters and spaces'
    }),

  country: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'Country must be at least 2 characters',
    'string.max': 'Country must not exceed 50 characters'
  }),

  state: Joi.string().trim().min(2).max(50).optional().messages({
    'string.min': 'State must be at least 2 characters',
    'string.max': 'State must not exceed 50 characters'
  })
});

module.exports = { profileUpdateSchema };
