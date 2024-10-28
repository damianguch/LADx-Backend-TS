import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';

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

// Express middleware functions generally don’t return a value
// Simply set the return type to void and return nothing explicitly
const validateUserSignup = (
  req: Request,
  res: Response<any, Record<string, any>>,
  next: NextFunction
): void => {
  const { error } = userSignupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    res.status(400).json({ status: 'E00', errors });
    return;
  }
  next();
};

export { validateUserSignup };
