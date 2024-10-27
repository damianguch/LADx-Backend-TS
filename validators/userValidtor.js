const Joi = require('joi');

const userSignupSchema = Joi.object({
  fullname: Joi.string().trim().required().messages({
    'any.required': 'Full name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  country: Joi.string().trim().required().messages({
    'any.required': 'Country is required'
  }),
  state: Joi.string().trim().required().messages({
    'any.required': 'State is required'
  }),
  phone: Joi.string().pattern(/^\d+$/).required().messages({
    'any.required': 'Phone number is required',
    'string.pattern.base': 'Phone number should be numeric'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  confirm_password: Joi.any().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Confirm password is required'
  })
});

const validateUserSignup = (req, res, next) => {
  const { error } = userSignupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ status: 'E00', errors });
  }
  next();
};

module.exports = { validateUserSignup };
