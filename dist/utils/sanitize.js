"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizedTraveldetails = exports.sanitizeProfileInput = exports.sanitizeSignUpInput = void 0;
const validator_1 = require("validator");
const sanitizeSignUpInput = (input) => {
    return {
        fullname: (0, validator_1.escape)(input.fullname),
        email: (0, validator_1.escape)(input.email),
        country: (0, validator_1.escape)(input.country),
        state: (0, validator_1.escape)(input.state),
        phone: input.phone && (0, validator_1.isNumeric)(input.phone) ? (0, validator_1.escape)(input.phone) : null,
        password: (0, validator_1.escape)(input.password),
        confirm_password: (0, validator_1.escape)(input.confirm_password)
    };
};
exports.sanitizeSignUpInput = sanitizeSignUpInput;
const sanitizeProfileInput = (input) => {
    return {
        fullname: (0, validator_1.escape)(input.fullname),
        country: (0, validator_1.escape)(input.country),
        state: (0, validator_1.escape)(input.state)
    };
};
exports.sanitizeProfileInput = sanitizeProfileInput;
// Escape and sanitize Travel Details fields
const sanitizedTraveldetails = (input) => {
    return {
        flight_number: (0, validator_1.escape)(input.flight_number),
        departure_city: (0, validator_1.escape)(input.departure_city),
        destination_city: (0, validator_1.escape)(input.destination_city),
        departure_date: new Date(input.departure_date),
        destination_date: new Date(input.destination_date),
        arrival_time: (0, validator_1.escape)(input.arrival_time),
        boarding_time: (0, validator_1.escape)(input.boarding_time),
        airline_name: (0, validator_1.escape)(input.airline_name),
        item_weight: input.item_weight
    };
};
exports.sanitizedTraveldetails = sanitizedTraveldetails;
