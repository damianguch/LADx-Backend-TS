// Get date and time
const today = new Date();
const currentDate =
  today.toISOString().slice(0, 10) +
  ' ' +
  today.toISOString().slice(11, 19) +
  ' Hrs';

module.exports = { currentDate };
