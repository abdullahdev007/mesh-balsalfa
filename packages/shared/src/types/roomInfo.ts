import { Player, Round, Topic } from "@repo/game-core";

export type RoomInfo = {
  id: string;
  adminID: string;
  players: Player[];
  topics: Topic[];
  rounds: Round[];
};
