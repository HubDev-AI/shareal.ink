import { customAlphabet } from "nanoid";

const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const generateToken = customAlphabet(BASE62, 7);

export function createSpaceToken(): string {
  return generateToken();
}
