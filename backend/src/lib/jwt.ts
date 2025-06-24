import jwt, { Secret, JwtPayload, SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "kala__30191";
const EXPIRE: string = process.env.JWT_EXPIRE || "30d";

export function generateToken(payload: Record<string, any>): string {
  const options: SignOptions = { expiresIn: EXPIRE as StringValue };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): Promise<JwtPayload | string> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      resolve(decoded as JwtPayload);
    });
  });
}
