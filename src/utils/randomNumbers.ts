const generateOTP = async (length: number): Promise<string> => {
  const alphanumeric = '123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphanumeric.length);
    result += alphanumeric[randomIndex];
  }
  return result;
};

export default generateOTP;
