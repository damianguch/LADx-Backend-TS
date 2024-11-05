"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.travelDetailsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Validation schema using Joi
const travelDetailsSchema = joi_1.default.object({
    flight_number: joi_1.default.string().required().messages({
        'any.required': 'Flight number is required'
    }),
    departure_city: joi_1.default.string().required().messages({
        'any.required': 'Departure city is required'
    }),
    destination_city: joi_1.default.string().required().messages({
        'any.required': 'Destination city is required'
    }),
    departure_date: joi_1.default.date().required().messages({
        'any.required': 'Departure date is required'
    }),
    destination_date: joi_1.default.date().optional(),
    arrival_time: joi_1.default.string().required().messages({
        'any.required': 'Arrival time is required'
    }),
    boarding_time: joi_1.default.string().required().messages({
        'any.required': 'Boarding time is required'
    }),
    airline_name: joi_1.default.string().required().messages({
        'any.required': 'Airline name is required'
    }),
    item_weight: joi_1.default.number().required().messages({
        'any.required': 'Item weight is required'
    })
});
exports.travelDetailsSchema = travelDetailsSchema;
