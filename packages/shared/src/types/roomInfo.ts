import { Round, Topic } from "@repo/game-core";

export type RoomInfo = {
  id: string;
  adminID: string;
  players: { id: string; username: string }[];
  topics: Topic[];
  rounds: Round[];
};
