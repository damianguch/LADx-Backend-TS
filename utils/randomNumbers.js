const EmailCode = async (length) => {
  const alphanumeric = '123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    result += alphanumeric[randomIndex];
  }
  return result;
};

module.exports = {
  EmailCode
};
