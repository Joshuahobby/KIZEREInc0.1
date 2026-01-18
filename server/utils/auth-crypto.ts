import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt
 * @param password The cleartext password
 * @returns A string in the format "hash.salt"
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a cleartext password with a hashed password
 * @param supplied The cleartext password provided by the user
 * @param hashed The hashed password from the database (format "hash.salt")
 * @returns True if they match, false otherwise
 */
export async function comparePasswords(supplied: string, hashed: string) {
  const [hash, salt] = hashed.split(".");
  const hashedBuf = Buffer.from(hash, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
