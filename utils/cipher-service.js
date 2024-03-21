import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const TOKEN_KEY = 'eydjcbmcducbhnopisjcibicnk'

export const hashPassword = async (password) => {
  const saltRounds = 10; // Number of salt rounds for bcrypt
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
};

export const comparePasswords = async (
  inputPassword,
  hashedPassword
) => {
  const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
  return isMatch;
};

export const createToken = (data, expiresIn = '365D') => {
  const token = jwt.sign(
        data,
        TOKEN_KEY,
        {
          expiresIn: expiresIn,
        }
      );
  return token
}

export const decodeToken = (token) => {
  const decoded = jwt.verify(token, TOKEN_KEY);
  return decoded
}

