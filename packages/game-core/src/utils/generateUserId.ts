import { nanoid } from "nanoid";

export function generateUserId(): string {
  return nanoid(8);
}