import { nanoid } from "nanoid";

export default function generateUserId(): string {
  return nanoid(8);
}