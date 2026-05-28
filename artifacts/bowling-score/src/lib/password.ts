import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

export const isHashed = (pw: string): boolean => pw.startsWith("$2");

export const verifyPassword = async (
  plain: string,
  stored: string
): Promise<boolean> => {
  if (isHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};
