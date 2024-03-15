import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

const comparePasswords = async (
  inputPassword,
  hashedPassword
) => {
  const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
  return isMatch;
};

export { hashPassword, comparePasswords };