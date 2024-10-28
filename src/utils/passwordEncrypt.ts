import bcrypt from 'bcrypt';

async function encryptPasswordWithBcrypt(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

export default encryptPasswordWithBcrypt;
