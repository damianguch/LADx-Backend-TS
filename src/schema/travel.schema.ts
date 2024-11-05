import Joi from 'joi';

// Validation schema using Joi
const travelDetailsSchema = Joi.object({
  flight_number: Joi.string().required().messages({
    'any.required': 'Flight number is required'
  }),
  departure_city: Joi.string().required().messages({
    'any.required': 'Departure city is required'
  }),
  destination_city: Joi.string().required().messages({
    'any.required': 'Destination city is required'
  }),
  departure_date: Joi.date().required().messages({
    'any.required': 'Departure date is required'
  }),
  destination_date: Joi.date().optional(),
  arrival_time: Joi.string().required().messages({
    'any.required': 'Arrival time is required'
  }),
  boarding_time: Joi.string().required().messages({
    'any.required': 'Boarding time is required'
  }),
  airline_name: Joi.string().required().messages({
    'any.required': 'Airline name is required'
  }),
  item_weight: Joi.number().required().messages({
    'any.required': 'Item weight is required'
  })
});

export { travelDetailsSchema };
