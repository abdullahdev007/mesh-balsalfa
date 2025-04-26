export type Role = "Insider" | "Spy";

export interface Player {
  id: string;
  username: string;
  role: Role | undefined;
  score: number;
}
