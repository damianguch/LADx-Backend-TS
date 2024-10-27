const { escape, isNumeric } = require('validator');

const sanitizeInput = (input) => {
  return {
    fullname: escape(input.fullname),
    email: escape(input.email),
    country: escape(input.country),
    state: escape(input.state),
    phone: input.phone && isNumeric(input.phone) ? escape(input.phone) : null,
    password: escape(input.password),
    confirm_password: escape(input.confirm_password)
  };
};

const sanitizeProfileInput = (input) => {
  return {
    fullname: escape(input.fullname),
    country: escape(input.country),
    state: escape(input.state)
  };
};

module.exports = {
  sanitizeInput,
  sanitizeProfileInput
};
