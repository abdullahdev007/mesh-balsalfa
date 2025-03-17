export type Role = "Insider" | "Spy"; 

export interface Player {
  id: string;
  name: string;
  role: Role | undefined;
  score: number;
}
